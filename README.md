# Document de Spécifications

## Plateforme d'Apprentissage en Ligne

**Version:** 1.0  
**Date:** Janvier 2025  
**Auteur:** Dr. El Hadji Bassirou TOURE

---

## 1. Vue d'ensemble

### 1.1 Objectif

Créer une plateforme d'apprentissage **statique et interactive** pour l'enseignement des sciences informatiques et mathématiques, avec une approche pédagogique **zéro prérequis**.

### 1.2 Philosophie pédagogique

- **Aucune présomption de connaissance** : le lecteur est considéré comme débutant absolu
- **Progression structurée** : du plus simple au plus complexe
- **Apprentissage par l'exemple** : code exécutable et exercices pratiques
- **Compréhension intuitive** avant formalisation mathématique
- **Application de la méthode de Feynman** : avec des analogies afin de rendre digeste le contenu

### 1.3 Contraintes techniques

- ✅ **Site 100% statique** (pas de serveur, pas de base de données)
- ✅ **Hébergeable gratuitement** (GitHub Pages, Netlify)
- ✅ **Léger et rapide**
- ✅ **Fonctionne hors ligne** après premier chargement

---

## 2. Architecture du site

### 2.1 Structure de navigation

```
Accueil (Pathways visuels)
├── Mathématiques
│   ├── Algèbre linéaire
│   ├── Calcul différentiel
│   └── Probabilités
├── Programmation
│   ├── Python (bases)
│   └── Structures de données
├── Machine Learning
│   ├── Fondements
│   └── Réseaux de neurones
└── Deep Learning & LLMs
    ├── Architectures
    └── Transformers
```

### 2.2 Type de navigation

- **Exploration libre** (pas de progression forcée)
- **Graphe de dépendances** visible pour guider l'apprentissage
- **Breadcrumb** pour se repérer

---

## 3. Format des cours

### 3.1 Système de boîtes thématiques

Reprendre le style LaTeX avec boîtes colorées :

| Type             | Couleur | Icône | Usage                             |
| ---------------- | ------- | ----- | --------------------------------- |
| **Concept**      | Bleu    | 💡    | Définitions fondamentales         |
| **Intuition**    | Vert    | 🧠    | Analogies et explications simples |
| **Exemple**      | Orange  | 💻    | Code pratique et applications     |
| **Mathématique** | Violet  | ∑     | Formalisations et équations       |
| **Point clé**    | Jaune   | ⚠️    | À retenir absolument              |

### 3.2 Structure d'un module

1. **Titre et numérotation**
2. **Objectifs d'apprentissage** (liste avec checkboxes)
3. **Contenu pédagogique** (boîtes thématiques)
4. **Exercices interactifs**
5. **Quiz de validation**
6. **Checkpoint** de fin de module

---

## 4. Fonctionnalités interactives

### 4.1 Code exécutable

- **Python dans le navigateur** via Pyodide
- Boutons : Exécuter | Copier | Réinitialiser
- Support de NumPy, Pandas, Matplotlib
- **Pas d'installation requise**

### 4.2 Quiz et exercices

- Questions à choix multiples
- Validation instantanée
- **Corrections cachées** (affichées à la demande)
- Feedback pédagogique

### 4.3 Système de progression

- **Checkpoints** par module
- Barre de progression globale
- Sauvegarde en **localStorage**
- Badges de complétion

### 4.4 Visualisations

- Formules mathématiques avec **MathJax**
- Graphes de dépendances avec **Mermaid**
- Animations CSS légères
- Graphiques interactifs (optionnel)

---

## 5. Ordre du contenu (Pathways)

### 5.1 Progression recommandée

```
1. Mathématiques fondamentales
   ├── Algèbre linéaire (vecteurs, matrices)
   ├── Calcul différentiel (dérivées, gradients)
   └── Probabilités (distributions, Bayes)

2. Programmation
   ├── Python bases
   ├── NumPy & manipulation de données
   └── Algorithmes essentiels

3. Machine Learning
   ├── Régression linéaire
   ├── Classification
   └── Validation croisée

4. Deep Learning
   ├── Perceptron
   ├── Backpropagation
   └── CNNs

5. NLP & LLMs
   ├── Tokenisation
   ├── Embeddings
   ├── Attention
   └── Transformers
```

### 5.2 Prérequis entre modules

- Affichage sous forme de **graphe interactif**
- Modules "verrouillés" visuellement si prérequis non complétés
- Suggestions de parcours personnalisées

---

## 6. Technologies utilisées

### 6.1 Frontend

- **HTML5** + **CSS3** (animations, gradients)
- **JavaScript vanilla** (pas de framework lourd)
- **Pyodide** pour Python dans le navigateur
- **MathJax** pour les formules mathématiques
- **Prism.js** pour la coloration syntaxique
- **Mermaid** pour les diagrammes

### 6.2 Stockage

- **localStorage** pour la progression
- **Service Worker** pour le mode hors ligne (optionnel)
- Fichiers JSON pour les pathways et métadonnées

### 6.3 Hébergement

- GitHub Pages (gratuit, avec domaine personnalisé possible)
- Ou Netlify/Vercel

---

## 7. Caractéristiques non incluses

❌ **Pas de** :

- Serveur backend
- Base de données
- Authentification utilisateur
- Forum/commentaires
- Vidéos lourdes
- Tracking analytics
- Sandbox nécessitant installation

---

## 8. Livrables

### Phase 1 - MVP

1. Page d'accueil avec pathways
2. 3 modules de mathématiques
3. 3 modules de Python
4. Système de progression fonctionnel

### Phase 2 - Extension

1. Modules Machine Learning
2. Graphe de dépendances interactif
3. Mode hors ligne

### Phase 3 - Complétion

1. Modules Deep Learning & LLMs
2. Exercices avancés
3. Certificats de complétion

---

## 9. Exemples de référence

Le site suit l'approche pédagogique des documents LaTeX fournis :

- **Fondements du Machine Learning.tex**
- **Algèbre linéaire.tex**
- **Calcul Différentiel et Optimisation.tex**

Avec le même style de :

- Concepts fondamentaux clairement définis
- Intuitions avec analogies du quotidien
- Exemples concrets et progressifs
- Formalisations mathématiques quand nécessaire

---

## 10. Critères de succès

✅ L'apprenant peut :

- Comprendre les concepts **sans prérequis**
- Exécuter du code **sans rien installer**
- Progresser **à son rythme**
- Reprendre **où il s'était arrêté**
- Valider ses connaissances par la **pratique**

✅ Le site est :

- **Rapide** (< 2s de chargement)
- **Accessible** (fonctionne partout)
- **Gratuit** à héberger
- **Maintenable** (structure modulaire)

---

_"L'objectif est de créer une ressource d'apprentissage accessible à tous, où chaque concept est expliqué comme si le lecteur partait de zéro, tout en permettant une progression jusqu'aux concepts les plus avancés du Machine Learning et des LLMs."_
