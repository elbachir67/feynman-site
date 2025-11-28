// Moteur de modules IA4Ndada - Version 2.0
// Système d'exercices bloquants et progression guidée

class ModuleEngine {
  constructor() {
    this.pyodideReady = false;
    this.pyodide = null;
    this.currentModule = null;
    this.progress = 0;
    this.completedObjectives = new Set();
    this.completedSections = new Set();
    this.unlockedSections = new Set([0]); // Première section toujours débloquée

    this.initializePyodide();
  }

  async initializePyodide() {
    try {
      this.pyodide = await loadPyodide();
      await this.pyodide.loadPackage(["numpy", "matplotlib"]);
      this.pyodideReady = true;
      console.log("Pyodide ready!");
      this.updatePyodideStatus(true);
    } catch (error) {
      console.error("Pyodide error:", error);
      this.updatePyodideStatus(false);
    }
  }

  updatePyodideStatus(ready) {
    const status = document.getElementById("pyodide-status");
    if (status) {
      if (ready) {
        status.innerHTML = '<span class="status-ready">Python Ready</span>';
      } else {
        status.innerHTML = '<span class="status-loading">Chargement Python...</span>';
      }
    }
  }

  // Initialiser un module
  initializeModule(config) {
    this.currentModule = config;
    this.loadProgress();
    this.ensureUnlockedSectionsConsistency();
    this.renderObjectives();
    this.renderContent();
    this.updateProgressBar();
    this.checkCompletionStatus();
  }

  // S'assurer que les sections non-bloquantes sont bien débloquées après une section complétée
  ensureUnlockedSectionsConsistency() {
    // Parcourir les sections complétées et s'assurer que tout ce qui suit est bien débloqué
    for (let i = 0; i < this.currentModule.content.length; i++) {
      const section = this.currentModule.content[i];

      // Si cette section est complétée et bloquante, débloquer la chaîne suivante
      if (this.completedSections.has(i) && this.isBlockingSection(section.type)) {
        let nextIndex = i + 1;
        while (nextIndex < this.currentModule.content.length) {
          this.unlockedSections.add(nextIndex);
          const nextSection = this.currentModule.content[nextIndex];
          if (this.isBlockingSection(nextSection.type)) {
            break;
          }
          nextIndex++;
        }
      }

      // Section 0 est toujours débloquée, et les non-bloquantes au début aussi
      if (i === 0 || this.unlockedSections.has(i)) {
        if (!this.isBlockingSection(section.type)) {
          // Débloquer la suivante si c'est non-bloquant
          if (i + 1 < this.currentModule.content.length) {
            this.unlockedSections.add(i + 1);
          }
        }
      }
    }

    this.saveProgress();
  }

  // Charger la progression depuis localStorage
  loadProgress() {
    const moduleId = this.currentModule.id;
    const saved = localStorage.getItem(`module-${moduleId}-data`);

    if (saved) {
      const data = JSON.parse(saved);
      this.progress = data.progress || 0;
      this.completedObjectives = new Set(data.completedObjectives || []);
      this.completedSections = new Set(data.completedSections || []);
      this.unlockedSections = new Set(data.unlockedSections || [0]);
    }
  }

  // Sauvegarder la progression
  saveProgress() {
    const moduleId = this.currentModule.id;
    const data = {
      progress: this.progress,
      completedObjectives: [...this.completedObjectives],
      completedSections: [...this.completedSections],
      unlockedSections: [...this.unlockedSections]
    };
    localStorage.setItem(`module-${moduleId}-data`, JSON.stringify(data));
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
    if (!this.completedObjectives.has(index)) {
      this.completedObjectives.add(index);
      const objective = document.getElementById(`objective-${index}`);
      if (objective) {
        objective.classList.add("completed");
      }
      this.saveProgress();
    }
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

    // Re-render MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([contentContainer]).catch(err => {
        console.log("MathJax:", err.message);
      });
    }
  }

  // Types de sections qui ne bloquent pas (pas d'exercice)
  isBlockingSection(type) {
    return ["exercise", "exercise-code", "quiz"].includes(type);
  }

  // Créer une section de contenu
  createSection(section, index) {
    const div = document.createElement("div");
    div.id = `section-${index}`;
    div.className = "section-wrapper";

    // Vérifier si la section est débloquée
    const isUnlocked = this.unlockedSections.has(index);
    const isCompleted = this.completedSections.has(index);
    const isBlocking = this.isBlockingSection(section.type);

    // Les sections non-bloquantes sont toujours accessibles si la précédente est débloquée
    const effectivelyUnlocked = isUnlocked || (!isBlocking && index === 0);

    if (!effectivelyUnlocked && isBlocking) {
      div.classList.add("locked");
    }
    if (isCompleted) {
      div.classList.add("completed");
    }

    let content = "";

    switch (section.type) {
      case "concept":
      case "intuition":
      case "exemple":
      case "mathematique":
      case "warning":
      case "application":
        content = this.createBoxSection(section, index);
        // Auto-débloquer la section suivante pour les contenus non-bloquants
        if (isUnlocked || index === 0) {
          setTimeout(() => this.autoUnlockNext(index), 100);
        }
        break;

      case "code":
        content = this.createCodeSection(section, index);
        // Auto-débloquer après avoir vu le code
        if (isUnlocked || index === 0) {
          setTimeout(() => this.autoUnlockNext(index), 100);
        }
        break;

      case "exercise":
        content = this.createExerciseSection(section, index);
        break;

      case "exercise-code":
        content = this.createCodeExerciseSection(section, index);
        break;

      case "quiz":
        content = this.createQuizSection(section, index);
        break;
    }

    div.innerHTML = content;

    // Ajouter le lockscreen uniquement pour les sections bloquantes verrouillées
    if (!effectivelyUnlocked && isBlocking) {
      const lockOverlay = document.createElement("div");
      lockOverlay.className = "lock-overlay";
      lockOverlay.innerHTML = `
        <div class="lock-message">
          <span class="lock-icon">🔒</span>
          <p>Complétez l'exercice précédent pour débloquer</p>
        </div>
      `;
      div.appendChild(lockOverlay);
    }

    return div;
  }

  // Auto-débloquer la section suivante (pour contenus non-bloquants)
  autoUnlockNext(currentIndex) {
    const nextIndex = currentIndex + 1;
    if (nextIndex < this.currentModule.content.length && !this.unlockedSections.has(nextIndex)) {
      this.unlockedSections.add(nextIndex);
      const nextSection = document.getElementById(`section-${nextIndex}`);
      if (nextSection) {
        nextSection.classList.remove("locked");
        const lockOverlay = nextSection.querySelector(".lock-overlay");
        if (lockOverlay) lockOverlay.remove();
      }
    }
  }

  // Créer une box thématique
  createBoxSection(section, index) {
    const typeClass = section.type === "mathematique" ? "math" : section.type;
    return `
      <div class="box ${typeClass}">
        <h3>${section.icon || ""} ${section.title}</h3>
        <div class="box-content">${section.content}</div>
      </div>
    `;
  }

  // Créer une section code
  createCodeSection(section, index) {
    return `
      <div class="box code">
        <h3>💻 ${section.title}</h3>
        ${section.description ? `<p class="code-description">${section.description}</p>` : ""}
        <div class="code-container">
          <textarea class="code-editor" id="code-${index}">${section.code || ""}</textarea>
          <div class="code-controls">
            <button class="btn btn-run" onclick="moduleEngine.runCode('code-${index}', 'output-${index}')">
              ▶ Exécuter
            </button>
            <button class="btn btn-reset" onclick="moduleEngine.resetCode('code-${index}', ${index})">
              ↺ Reset
            </button>
          </div>
          <div class="output-container">
            <div class="output-label">Résultat :</div>
            <textarea class="output" id="output-${index}" readonly placeholder="Cliquez sur Exécuter..."></textarea>
            <div id="plot-${index}" class="plot-container"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Créer un exercice interactif
  createExerciseSection(section, index) {
    const exerciseType = section.exerciseType || "numeric";
    let inputHTML = "";

    if (exerciseType === "numeric") {
      inputHTML = `
        <div class="exercise-input-group">
          <input type="text" id="answer-${index}" class="exercise-input" placeholder="Votre réponse...">
          <button class="btn btn-check" onclick="moduleEngine.checkExercise(${index})">
            Vérifier
          </button>
        </div>
      `;
    } else if (exerciseType === "mcq") {
      inputHTML = `
        <div class="exercise-options" id="options-${index}">
          ${section.options.map((opt, i) => `
            <div class="exercise-option" onclick="moduleEngine.selectOption(${index}, ${i})">
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="option-text">${opt}</span>
            </div>
          `).join("")}
        </div>
        <button class="btn btn-check" onclick="moduleEngine.checkMCQ(${index})" style="margin-top: 1rem;">
          Vérifier
        </button>
      `;
    }

    // Utiliser section.content ou section.question selon ce qui existe
    const questionContent = section.content || section.question || "";

    return `
      <div class="box exercise">
        <div class="exercise-header">
          <h3>✏️ ${section.title}</h3>
          <span class="exercise-badge">Exercice obligatoire</span>
        </div>
        <div class="exercise-content">
          ${questionContent}
        </div>
        ${inputHTML}
        <div class="exercise-feedback" id="feedback-${index}"></div>
        ${section.hint ? `
          <div class="exercise-hint">
            <button class="btn-hint" onclick="moduleEngine.showHint(${index})">💡 Indice</button>
            <div id="hint-${index}" class="hint-content" style="display:none;">${section.hint}</div>
          </div>
        ` : ""}
      </div>
    `;
  }

  // Créer un exercice de code
  createCodeExerciseSection(section, index) {
    // Utiliser section.content ou section.instruction selon ce qui existe
    const instructionContent = section.content || section.instruction || "";

    return `
      <div class="box exercise-code">
        <div class="exercise-header">
          <h3>💻 ${section.title}</h3>
          <span class="exercise-badge">Défi code</span>
        </div>
        <div class="exercise-content">
          ${instructionContent}
        </div>
        <div class="code-container">
          <textarea class="code-editor" id="code-${index}">${section.starterCode || ""}</textarea>
          <div class="code-controls">
            <button class="btn btn-run" onclick="moduleEngine.runCodeExercise(${index})">
              ▶ Tester mon code
            </button>
            <button class="btn btn-solution" onclick="moduleEngine.showSolution(${index})">
              👁️ Voir solution
            </button>
            <button class="btn btn-reset" onclick="moduleEngine.resetCode('code-${index}', ${index})">
              ↺ Reset
            </button>
          </div>
          <textarea class="output" id="output-${index}" readonly placeholder="Résultat du test..."></textarea>
          <div id="plot-${index}" class="plot-container"></div>
        </div>
        <div class="exercise-feedback" id="feedback-${index}"></div>
      </div>
    `;
  }

  // Créer un quiz
  createQuizSection(section, index) {
    return `
      <div class="box quiz-box">
        <div class="exercise-header">
          <h3>🧠 ${section.title || "Quiz de compréhension"}</h3>
          <span class="exercise-badge quiz-badge">Quiz</span>
        </div>
        <div class="quiz-question">${section.question}</div>
        <div class="quiz-options" id="quiz-options-${index}">
          ${section.options.map((opt, i) => `
            <div class="quiz-option" data-index="${i}" onclick="moduleEngine.selectQuizOption(${index}, ${i})">
              ${opt}
            </div>
          `).join("")}
        </div>
        <button class="btn btn-check" onclick="moduleEngine.checkQuiz(${index})" style="margin-top: 1rem;">
          Vérifier
        </button>
        <div class="exercise-feedback" id="feedback-${index}"></div>
      </div>
    `;
  }

  // Sélectionner une option (MCQ)
  selectOption(sectionIndex, optionIndex) {
    const options = document.querySelectorAll(`#options-${sectionIndex} .exercise-option`);
    options.forEach((opt, i) => {
      opt.classList.toggle("selected", i === optionIndex);
    });
    this.selectedOption = optionIndex;
  }

  // Sélectionner une option de quiz
  selectQuizOption(sectionIndex, optionIndex) {
    const options = document.querySelectorAll(`#quiz-options-${sectionIndex} .quiz-option`);
    options.forEach((opt, i) => {
      opt.classList.toggle("selected", i === optionIndex);
    });
    this.selectedQuizOption = optionIndex;
  }

  // Vérifier un exercice numérique
  checkExercise(sectionIndex) {
    const section = this.currentModule.content[sectionIndex];
    const input = document.getElementById(`answer-${sectionIndex}`);
    const feedback = document.getElementById(`feedback-${sectionIndex}`);

    if (!input || !feedback) return;

    const userAnswer = parseFloat(input.value.replace(",", "."));
    // Supporter les deux noms de propriété : correctAnswer ou answer
    const correctAnswer = section.correctAnswer !== undefined ? section.correctAnswer : section.answer;
    const tolerance = section.tolerance || 0.01;

    if (isNaN(userAnswer)) {
      feedback.innerHTML = `<div class="feedback-warning">Entrez un nombre valide</div>`;
      return;
    }

    const isCorrect = Math.abs(userAnswer - correctAnswer) <= tolerance;

    if (isCorrect) {
      feedback.innerHTML = `<div class="feedback-correct">✓ Correct ! ${section.explanation || ""}</div>`;
      input.classList.add("correct");
      input.disabled = true;
      this.completeSection(sectionIndex);
      this.unlockNextSection(sectionIndex);
    } else {
      feedback.innerHTML = `<div class="feedback-incorrect">✗ Incorrect. Réessayez !</div>`;
      input.classList.add("incorrect");
      setTimeout(() => input.classList.remove("incorrect"), 500);
    }
  }

  // Vérifier un MCQ
  checkMCQ(sectionIndex) {
    const section = this.currentModule.content[sectionIndex];
    const feedback = document.getElementById(`feedback-${sectionIndex}`);
    const options = document.querySelectorAll(`#options-${sectionIndex} .exercise-option`);

    if (this.selectedOption === undefined) {
      feedback.innerHTML = `<div class="feedback-warning">Sélectionnez une réponse</div>`;
      return;
    }

    // Supporter les deux noms de propriété : correctAnswer ou correct
    const correctIndex = section.correctAnswer !== undefined ? section.correctAnswer : section.correct;
    const isCorrect = this.selectedOption === correctIndex;

    options.forEach((opt, i) => {
      opt.classList.remove("correct", "incorrect");
      if (i === correctIndex) {
        opt.classList.add("correct");
      } else if (i === this.selectedOption && !isCorrect) {
        opt.classList.add("incorrect");
      }
      // Désactiver les clics après validation
      opt.style.pointerEvents = "none";
    });

    if (isCorrect) {
      feedback.innerHTML = `<div class="feedback-correct">✓ Excellent ! ${section.explanation || ""}</div>`;
      this.completeSection(sectionIndex);
      this.unlockNextSection(sectionIndex);
    } else {
      feedback.innerHTML = `<div class="feedback-incorrect">✗ Incorrect. ${section.wrongExplanation || "Réessayez !"}</div>`;
      // Réactiver les clics pour réessayer
      setTimeout(() => {
        options.forEach(opt => {
          opt.style.pointerEvents = "auto";
          opt.classList.remove("correct", "incorrect");
        });
      }, 1500);
    }

    this.selectedOption = undefined;
  }

  // Vérifier un quiz
  checkQuiz(sectionIndex) {
    const section = this.currentModule.content[sectionIndex];
    const feedback = document.getElementById(`feedback-${sectionIndex}`);
    const options = document.querySelectorAll(`#quiz-options-${sectionIndex} .quiz-option`);

    if (this.selectedQuizOption === undefined) {
      feedback.innerHTML = `<div class="feedback-warning">Sélectionnez une réponse</div>`;
      return;
    }

    // Supporter les deux noms de propriété : correctAnswer ou correct
    const correctIndex = section.correctAnswer !== undefined ? section.correctAnswer : section.correct;
    const isCorrect = this.selectedQuizOption === correctIndex;

    options.forEach((opt, i) => {
      opt.classList.remove("correct", "incorrect");
      if (i === correctIndex) {
        opt.classList.add("correct");
      } else if (i === this.selectedQuizOption && !isCorrect) {
        opt.classList.add("incorrect");
      }
      // Désactiver les clics après validation
      opt.style.pointerEvents = "none";
    });

    if (isCorrect) {
      feedback.innerHTML = `<div class="feedback-correct">✓ Parfait ! ${section.explanation || ""}</div>`;
      this.completeSection(sectionIndex);
      this.unlockNextSection(sectionIndex);
    } else {
      feedback.innerHTML = `<div class="feedback-incorrect">✗ Pas tout à fait. ${section.wrongExplanation || "Relisez la section précédente."}</div>`;
      // Réactiver les clics pour réessayer
      setTimeout(() => {
        options.forEach(opt => {
          opt.style.pointerEvents = "auto";
          opt.classList.remove("correct", "incorrect");
        });
      }, 1500);
    }

    this.selectedQuizOption = undefined;
  }

  // Afficher un indice
  showHint(sectionIndex) {
    const hint = document.getElementById(`hint-${sectionIndex}`);
    if (hint) {
      hint.style.display = hint.style.display === "none" ? "block" : "none";
    }
  }

  // Débloquer la section suivante et continuer pour les sections non-bloquantes
  unlockNextSection(currentIndex) {
    let nextIndex = currentIndex + 1;
    let firstUnlockedIndex = nextIndex;

    // Débloquer en chaîne toutes les sections non-bloquantes consécutives
    while (nextIndex < this.currentModule.content.length) {
      this.unlockedSections.add(nextIndex);

      const nextSectionElement = document.getElementById(`section-${nextIndex}`);
      if (nextSectionElement) {
        nextSectionElement.classList.remove("locked");
        const lockOverlay = nextSectionElement.querySelector(".lock-overlay");
        if (lockOverlay) {
          lockOverlay.remove();
        }
      }

      // Si c'est une section bloquante, on s'arrête après l'avoir débloquée
      const nextSectionConfig = this.currentModule.content[nextIndex];
      if (this.isBlockingSection(nextSectionConfig.type)) {
        break;
      }

      // Sinon on continue à débloquer
      nextIndex++;
    }

    // Scroll vers la première section débloquée
    const firstUnlockedElement = document.getElementById(`section-${firstUnlockedIndex}`);
    if (firstUnlockedElement) {
      setTimeout(() => {
        firstUnlockedElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }

    this.saveProgress();
  }

  // Compter les sections bloquantes (exercices)
  countBlockingSections() {
    return this.currentModule.content.filter(s => this.isBlockingSection(s.type)).length;
  }

  // Compter les sections bloquantes complétées
  countCompletedBlockingSections() {
    let count = 0;
    this.completedSections.forEach(index => {
      const section = this.currentModule.content[index];
      if (section && this.isBlockingSection(section.type)) {
        count++;
      }
    });
    return count;
  }

  // Marquer une section comme complétée
  completeSection(sectionIndex) {
    this.completedSections.add(sectionIndex);

    const section = document.getElementById(`section-${sectionIndex}`);
    if (section) {
      section.classList.add("completed");
    }

    // Calculer la progression basée uniquement sur les exercices
    const totalExercises = this.countBlockingSections();
    const completedExercises = this.countCompletedBlockingSections();
    this.progress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 100;
    this.updateProgressBar();

    // Compléter l'objectif correspondant si défini
    const sectionConfig = this.currentModule.content[sectionIndex];
    if (sectionConfig.completesObjective !== undefined) {
      this.completeObjective(sectionConfig.completesObjective);
    }

    this.saveProgress();
    this.checkCompletionStatus();
  }

  // Exécuter du code Python
  async runCode(codeId, outputId) {
    const codeElement = document.getElementById(codeId);
    const outputElement = document.getElementById(outputId);
    const plotContainer = document.getElementById(outputId.replace("output-", "plot-"));

    if (!codeElement || !outputElement) return;

    const code = codeElement.value;
    const runButton = document.querySelector(`button[onclick*="runCode('${codeId}'"]`);

    if (!this.pyodideReady) {
      outputElement.value = "⏳ Chargement de Python...";
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (this.pyodideReady) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
    }

    if (runButton) {
      runButton.innerHTML = "⚡ Exécution...";
      runButton.disabled = true;
    }

    try {
      // Clear previous plot
      if (plotContainer) {
        plotContainer.innerHTML = "";
      }

      // Setup matplotlib for browser
      await this.pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()

import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
plt.clf()
plt.close('all')
      `);

      // Run user code
      await this.pyodide.runPythonAsync(code);

      // Get output
      const stdout = this.pyodide.runPython("sys.stdout.getvalue()");
      const stderr = this.pyodide.runPython("sys.stderr.getvalue()");

      if (stderr && stderr.trim()) {
        outputElement.value = "❌ Erreur:\n" + stderr;
        outputElement.classList.add("error");
      } else {
        outputElement.value = stdout || "✅ Exécuté (pas de sortie texte)";
        outputElement.classList.remove("error");
      }

      // Check for matplotlib figure
      const hasFigure = this.pyodide.runPython(`
import matplotlib.pyplot as plt
len(plt.get_fignums()) > 0
      `);

      if (hasFigure && plotContainer) {
        await this.pyodide.runPythonAsync(`
import io
import base64
buf = io.BytesIO()
plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='white')
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close('all')
        `);

        const imgData = this.pyodide.globals.get("img_base64");
        plotContainer.innerHTML = `<img src="data:image/png;base64,${imgData}" alt="Plot">`;
      }

    } catch (error) {
      outputElement.value = "❌ Erreur Python:\n" + error.message;
      outputElement.classList.add("error");
    } finally {
      if (runButton) {
        runButton.innerHTML = "▶ Exécuter";
        runButton.disabled = false;
      }
    }
  }

  // Exécuter et vérifier un exercice de code
  async runCodeExercise(sectionIndex) {
    const section = this.currentModule.content[sectionIndex];
    const codeElement = document.getElementById(`code-${sectionIndex}`);
    const outputElement = document.getElementById(`output-${sectionIndex}`);
    const feedback = document.getElementById(`feedback-${sectionIndex}`);
    const plotContainer = document.getElementById(`plot-${sectionIndex}`);

    if (!codeElement) return;

    // D'abord exécuter le code
    await this.runCode(`code-${sectionIndex}`, `output-${sectionIndex}`);

    // Vérifier si le résultat contient la sortie attendue
    const output = outputElement.value;
    const hasError = output.includes("❌") || output.includes("Erreur");

    if (hasError) {
      feedback.innerHTML = `<div class="feedback-incorrect">✗ Corrigez les erreurs dans votre code</div>`;
      return;
    }

    // Vérifier avec expectedOutput si défini
    if (section.expectedOutput) {
      const isValid = output.includes(section.expectedOutput);

      if (isValid) {
        feedback.innerHTML = `<div class="feedback-correct">✓ Bravo ! Votre code fonctionne correctement !</div>`;
        this.completeSection(sectionIndex);
        this.unlockNextSection(sectionIndex);
      } else {
        feedback.innerHTML = `<div class="feedback-warning">⚠️ Le code s'exécute mais le résultat attendu n'est pas trouvé. Vérifiez votre implémentation.</div>`;
      }
    } else if (section.validate) {
      // Ancienne méthode avec validate
      try {
        const isValid = await this.pyodide.runPythonAsync(section.validate);

        if (isValid) {
          feedback.innerHTML = `<div class="feedback-correct">✓ Bravo ! ${section.successMessage || "Code correct !"}</div>`;
          this.completeSection(sectionIndex);
          this.unlockNextSection(sectionIndex);
        } else {
          feedback.innerHTML = `<div class="feedback-incorrect">✗ ${section.errorMessage || "Pas tout à fait. Vérifiez votre code."}</div>`;
        }
      } catch (e) {
        feedback.innerHTML = `<div class="feedback-incorrect">✗ Erreur dans le code</div>`;
      }
    } else {
      // Pas de validation spécifique, on valide si le code s'exécute sans erreur
      feedback.innerHTML = `<div class="feedback-correct">✓ Code exécuté avec succès !</div>`;
      this.completeSection(sectionIndex);
      this.unlockNextSection(sectionIndex);
    }
  }

  // Afficher la solution d'un exercice de code
  showSolution(sectionIndex) {
    const section = this.currentModule.content[sectionIndex];
    const codeElement = document.getElementById(`code-${sectionIndex}`);

    if (section.solution && codeElement) {
      if (confirm("Voulez-vous voir la solution ? Cela remplacera votre code actuel.")) {
        codeElement.value = section.solution;
      }
    } else {
      alert("Pas de solution disponible pour cet exercice.");
    }
  }

  // Réinitialiser le code
  resetCode(codeId, sectionIndex) {
    const codeElement = document.getElementById(codeId);
    const outputElement = document.getElementById(codeId.replace("code-", "output-"));
    const plotContainer = document.getElementById(codeId.replace("code-", "plot-"));

    if (codeElement && this.currentModule.content[sectionIndex]) {
      const section = this.currentModule.content[sectionIndex];
      codeElement.value = section.code || section.starterCode || "";
    }

    if (outputElement) {
      outputElement.value = "";
      outputElement.classList.remove("error");
    }

    if (plotContainer) {
      plotContainer.innerHTML = "";
    }
  }

  // Mettre à jour la barre de progression
  updateProgressBar() {
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");

    if (progressFill) {
      progressFill.style.width = this.progress + "%";
    }

    if (progressText) {
      progressText.textContent = `${this.progress}%`;
    }
  }

  // Vérifier si le module est complété
  checkCompletionStatus() {
    const totalExercises = this.countBlockingSections();
    const completedExercises = this.countCompletedBlockingSections();

    const checkpointBtn = document.getElementById("checkpoint-btn");
    if (checkpointBtn) {
      if (completedExercises >= totalExercises) {
        checkpointBtn.classList.add("ready");
        checkpointBtn.disabled = false;
      } else {
        checkpointBtn.classList.remove("ready");
        checkpointBtn.disabled = true;
      }
    }
  }

  // Compléter le checkpoint
  completeCheckpoint() {
    const moduleId = this.currentModule.id;

    // Vérifier que tous les exercices sont complétés
    const totalExercises = this.countBlockingSections();
    const completedExercises = this.countCompletedBlockingSections();
    if (completedExercises < totalExercises) {
      alert("Complétez tous les exercices avant de valider !");
      return;
    }

    localStorage.setItem(`module-${moduleId}-completed`, "true");

    const button = document.getElementById("checkpoint-btn");
    if (button) {
      button.classList.add("completed");
      button.innerHTML = "✓ Module Complété !";
    }

    // Compléter tous les objectifs
    this.currentModule.objectives.forEach((_, index) => {
      this.completeObjective(index);
    });

    this.progress = 100;
    this.updateProgressBar();
    this.saveProgress();

    // Confetti effect
    this.celebrateCompletion();
  }

  // Animation de célébration
  celebrateCompletion() {
    const colors = ["#667eea", "#764ba2", "#2ecc71", "#f39c12"];
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 2) + "s";
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
      }, i * 50);
    }
  }

  // Reset du module (pour debug)
  resetModule() {
    const moduleId = this.currentModule.id;
    localStorage.removeItem(`module-${moduleId}-data`);
    localStorage.removeItem(`module-${moduleId}-completed`);
    location.reload();
  }
}

// Instance globale
const moduleEngine = new ModuleEngine();

// Fonctions globales pour les modules
function initializeModule(config) {
  moduleEngine.initializeModule(config);
}

function completeCheckpoint() {
  moduleEngine.completeCheckpoint();
}

function toggleSolution(solutionId) {
  const el = document.getElementById(solutionId);
  const btn = document.querySelector(`button[onclick*="${solutionId}"]`);
  if (el) {
    const isHidden = el.style.display === "none";
    el.style.display = isHidden ? "block" : "none";
    if (btn) {
      btn.innerHTML = isHidden ? "🙈 Masquer" : "👁️ Voir la solution";
    }
  }
}
