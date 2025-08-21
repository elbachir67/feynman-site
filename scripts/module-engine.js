// Moteur de modules pour la plateforme d'apprentissage
class ModuleEngine {
  constructor() {
    this.pyodideReady = false;
    this.pyodide = null;
    this.currentModule = null;
    this.progress = 0;
    this.completedObjectives = new Set();

    this.initializePyodide();
  }

  async initializePyodide() {
    try {
      this.pyodide = await loadPyodide();
      await this.pyodide.loadPackage(["numpy", "matplotlib", "pandas"]);
      this.pyodideReady = true;
      console.log("Pyodide prêt avec NumPy, Matplotlib et Pandas !");
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Pyodide:", error);
    }
  }

  // Initialiser un module
  initializeModule(config) {
    this.currentModule = config;
    this.loadProgress();
    this.renderObjectives();
    this.renderContent();
    this.renderQuiz();
    this.setupNavigation();
    this.updateProgressBar();
  }

  // Charger la progression depuis localStorage
  loadProgress() {
    const moduleId = this.currentModule.id;
    const savedProgress = localStorage.getItem(`module-${moduleId}-progress`);
    const savedObjectives = localStorage.getItem(
      `module-${moduleId}-objectives`
    );

    if (savedProgress) {
      this.progress = parseInt(savedProgress);
    }

    if (savedObjectives) {
      this.completedObjectives = new Set(JSON.parse(savedObjectives));
    }
  }

  // Sauvegarder la progression
  saveProgress() {
    const moduleId = this.currentModule.id;
    localStorage.setItem(
      `module-${moduleId}-progress`,
      this.progress.toString()
    );
    localStorage.setItem(
      `module-${moduleId}-objectives`,
      JSON.stringify([...this.completedObjectives])
    );
  }

  // Rendre les objectifs
  renderObjectives() {
    const objectivesList = document.getElementById("objectives-list");
    if (!objectivesList || !this.currentModule.objectives) return;

    objectivesList.innerHTML = "";
    this.currentModule.objectives.forEach((objective, index) => {
      const li = document.createElement("li");
      li.textContent = objective;
      li.id = `objective-${index}`;

      if (this.completedObjectives.has(index)) {
        li.classList.add("completed");
      }

      objectivesList.appendChild(li);
    });
  }

  // Marquer un objectif comme complété
  completeObjective(index) {
    this.completedObjectives.add(index);
    const objective = document.getElementById(`objective-${index}`);
    if (objective) {
      objective.classList.add("completed");
    }

    this.updateProgress(20); // Chaque objectif vaut 20% de progression
    this.saveProgress();
  }

  // Rendre le contenu du module
  renderContent() {
    const contentContainer = document.getElementById("module-content");
    if (!contentContainer || !this.currentModule.content) return;

    contentContainer.innerHTML = "";

    this.currentModule.content.forEach((section, index) => {
      const sectionElement = this.createSection(section, index);
      contentContainer.appendChild(sectionElement);
    });

    // Re-rendre les formules MathJax après ajout du contenu
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([contentContainer]).catch(err => {
        console.log("Erreur MathJax:", err.message);
      });
    }
  }

  // Créer une section de contenu
  createSection(section, index) {
    const div = document.createElement("div");

    switch (section.type) {
      case "concept":
      case "intuition":
      case "exemple":
      case "mathematique":
      case "warning":
        div.className = `box ${section.type}`;
        div.innerHTML = `
                    <h3>${section.icon || ""} ${section.title}</h3>
                    ${section.content}
                `;
        break;

      case "code":
        div.className = "box exemple";
        div.innerHTML = `
                    <h3>💻 ${section.title}</h3>
                    ${
                      section.description ? `<p>${section.description}</p>` : ""
                    }
                    <div class="code-container">
                        <div class="code-header">
                            <span class="code-title">Code Python</span>
                        </div>
                        <textarea class="code-editor" id="code-${index}">${
          section.code
        }</textarea>
                        <div class="code-controls">
                            <button class="btn btn-run" onclick="moduleEngine.runCode('code-${index}', 'output-${index}')">
                                ▶ Exécuter
                            </button>
                            <button class="btn btn-copy" onclick="moduleEngine.copyCode('code-${index}')">
                                📋 Copier
                            </button>
                            <button class="btn btn-reset" onclick="moduleEngine.resetCode('code-${index}', \`${section.code.replace(
          /`/g,
          "\\`"
        )}\`)">
                                ↺ Réinitialiser
                            </button>
                        </div>
                        <div class="loading" id="loading-${index}">⏳ Chargement de Python...</div>
                        <div class="output" id="output-${index}"></div>
                    </div>
                `;
        break;
    }

    return div;
  }

  // Exécuter du code Python
  async runCode(codeId, outputId) {
    const codeElement = document.getElementById(codeId);
    const outputElement = document.getElementById(outputId);
    const loadingElement = document.getElementById(
      `loading-${codeId.split("-")[1]}`
    );
    const runButton = document.querySelector(`button[onclick*="${codeId}"]`);

    if (!codeElement || !outputElement) return;

    const code = codeElement.value;

    // Afficher le loading si Pyodide n'est pas prêt
    if (!this.pyodideReady) {
      loadingElement.classList.add("show");
      runButton.classList.add("running");
      await this.initializePyodide();
      loadingElement.classList.remove("show");
      runButton.classList.remove("running");
    }

    try {
      // Rediriger stdout et stderr
      this.pyodide.runPython(`
                import sys
                from io import StringIO
                sys.stdout = StringIO()
                sys.stderr = StringIO()
            `);

      // Exécuter le code
      this.pyodide.runPython(code);

      // Récupérer les sorties
      const stdout = this.pyodide.runPython("sys.stdout.getvalue()");
      const stderr = this.pyodide.runPython("sys.stderr.getvalue()");

      if (stderr) {
        outputElement.textContent = "Erreur :\n" + stderr;
        outputElement.classList.add("error");
      } else {
        outputElement.textContent =
          stdout || "Code exécuté avec succès (pas de sortie)";
        outputElement.classList.remove("error");
      }

      outputElement.classList.add("show");

      // Marquer l'objectif correspondant comme complété
      this.completeObjective(1); // Généralement le 2ème objectif concerne la pratique
    } catch (error) {
      outputElement.textContent = "Erreur : " + error.message;
      outputElement.classList.add("error", "show");
    }
  }

  // Copier le code
  copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    if (!codeElement) return;

    codeElement.select();
    document.execCommand("copy");

    // Feedback visuel
    const button = document.querySelector(
      `button[onclick*="copyCode('${codeId}')"]`
    );
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = "✓ Copié !";
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 2000);
    }
  }

  // Réinitialiser le code
  resetCode(codeId, originalCode) {
    const codeElement = document.getElementById(codeId);
    const outputElement = document.getElementById(
      codeId.replace("code-", "output-")
    );

    if (codeElement) {
      codeElement.value = originalCode;
    }

    if (outputElement) {
      outputElement.classList.remove("show", "error");
    }
  }

  // Rendre le quiz
  renderQuiz() {
    const quizContainer = document.getElementById("module-quiz");
    if (!quizContainer || !this.currentModule.quiz) return;

    const quiz = this.currentModule.quiz;

    document.getElementById("quiz-question").textContent = quiz.question;

    const optionsContainer = document.getElementById("quiz-options");
    optionsContainer.innerHTML = "";

    quiz.options.forEach((option, index) => {
      const div = document.createElement("div");
      div.className = "quiz-option";
      div.textContent = option;
      div.onclick = () =>
        this.checkAnswer(index, quiz.correct, quiz.explanation);
      optionsContainer.appendChild(div);
    });

    quizContainer.style.display = "block";

    // Re-rendre les formules MathJax dans le quiz
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([quizContainer]).catch(err => {
        console.log("Erreur MathJax:", err.message);
      });
    }
  }

  // Vérifier la réponse du quiz
  checkAnswer(selectedIndex, correctIndex, explanation) {
    const options = document.querySelectorAll(".quiz-option");
    const feedback = document.getElementById("quiz-feedback");

    // Réinitialiser les styles
    options.forEach(option => {
      option.classList.remove("selected", "correct", "incorrect");
    });

    options[selectedIndex].classList.add("selected");

    if (selectedIndex === correctIndex) {
      options[selectedIndex].classList.add("correct");
      feedback.textContent = "✓ Correct ! " + explanation;
      feedback.className = "quiz-feedback correct show";
      this.completeObjective(2); // Quiz généralement 3ème objectif
      this.updateProgress(30);
      this.markExerciseCompleted(); // Débloquer le module suivant
    } else {
      options[selectedIndex].classList.add("incorrect");
      options[correctIndex].classList.add("correct");
      feedback.textContent = "✗ Incorrect. " + explanation;
      feedback.className = "quiz-feedback incorrect show";
    }
  }

  // Mettre à jour la barre de progression
  updateProgress(increment = 0) {
    this.progress = Math.min(this.progress + increment, 100);

    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");

    if (progressFill) {
      progressFill.style.width = this.progress + "%";
    }

    if (progressText) {
      progressText.textContent = `Progression: ${this.progress}%`;
    }

    this.saveProgress();
  }

  // Configurer la navigation
  setupNavigation() {
    const prevLink = document.getElementById("prev-link");
    const nextLink = document.getElementById("next-link");

    if (prevLink) {
      if (
        this.currentModule.prevModule &&
        this.currentModule.prevModule !== "#"
      ) {
        prevLink.href = this.currentModule.prevModule;
        prevLink.classList.remove("disabled");
      } else {
        prevLink.classList.add("disabled");
        prevLink.onclick = e => e.preventDefault();
      }
    }

    if (nextLink) {
      if (
        this.currentModule.nextModule &&
        this.currentModule.nextModule !== "#"
      ) {
        nextLink.href = this.currentModule.nextModule;
        nextLink.classList.remove("disabled");
      } else {
        nextLink.classList.add("disabled");
        nextLink.onclick = e => e.preventDefault();
      }
    }
  }

  // Compléter le checkpoint
  completeCheckpoint() {
    // Vérifier si l'exercice bloquant est résolu
    if (!this.checkBlockingExercise()) {
      alert(
        "⚠️ Vous devez d'abord résoudre l'exercice pour débloquer le module suivant !"
      );
      return;
    }

    const moduleId = this.currentModule.id;
    const button = document.getElementById("checkpoint-btn");

    // Marquer comme complété
    localStorage.setItem(`module-${moduleId}-completed`, "true");

    // Mettre à jour l'interface
    button.classList.add("completed");
    button.textContent = "✓ Complété";

    // Compléter tous les objectifs
    this.currentModule.objectives.forEach((_, index) => {
      this.completeObjective(index);
    });

    // Progression à 100%
    this.progress = 100;
    this.updateProgress(0);

    // Animation de succès
    button.style.transform = "scale(1.1)";
    setTimeout(() => {
      button.style.transform = "scale(1)";
    }, 200);
  }

  // Vérifier l'exercice bloquant
  checkBlockingExercise() {
    // Pour les modules mathématiques, on considère que l'exercice est résolu
    // si l'utilisateur a cliqué sur "Voir la solution" dans le quiz
    const moduleId = this.currentModule.id;
    const exerciseCompleted = localStorage.getItem(
      `${moduleId}-exercise-completed`
    );
    return exerciseCompleted === "true";
  }

  // Marquer l'exercice comme complété (appelé après une bonne réponse au quiz)
  markExerciseCompleted() {
    const moduleId = this.currentModule.id;
    localStorage.setItem(`${moduleId}-exercise-completed`, "true");
  }

  // Fonction pour afficher/masquer les solutions
  toggleSolution(solutionId) {
    const solutionElement = document.getElementById(solutionId);
    const button = document.querySelector(`button[onclick*="${solutionId}"]`);

    if (solutionElement.style.display === "none") {
      solutionElement.style.display = "block";
      button.innerHTML = "🙈 Masquer la solution";
    } else {
      solutionElement.style.display = "none";
      button.innerHTML = "👁️ Voir la solution";
    }
  }
}

// Instance globale du moteur
const moduleEngine = new ModuleEngine();

// Fonction d'initialisation pour les modules
function initializeModule(config) {
  moduleEngine.initializeModule(config);
}

// Fonction pour compléter le checkpoint (appelée depuis les modules)
function completeCheckpoint() {
  moduleEngine.completeCheckpoint();
}

// Fonction pour afficher/masquer les solutions (appelée depuis les modules)
function toggleSolution(solutionId) {
  moduleEngine.toggleSolution(solutionId);
}
