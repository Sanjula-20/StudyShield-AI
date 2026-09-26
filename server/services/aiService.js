/**
 * StudyShield Universal Topic Mastery & Adaptive Learning Engine
 * Converts AI Tutor into a complete academic mastery tutor for ANY topic.
 * 
 * Capabilities:
 * 1. Dynamic Topic Mastery Roadmaps (Level 1 Foundations -> Level 8 Mastery) for ANY topic.
 * 2. Prerequisite Detection & Concept Dependency Mapping.
 * 3. Standalone Question Answering Mode vs Topic Mastery Mode.
 * 4. Active Practice Engine & Evaluation (✓ Correct, ⚠ Partial, ✗ Incorrect).
 * 5. Error Analysis & Alternative Concept Reteaching.
 * 6. 4-Stage Progressive Hint System.
 * 7. Revision & Assessment Generator.
 * 8. Context Awareness & UI Action Chip Support (Hint, Example, Simplify, Compare).
 * 9. Technical Precision & Zero Generic Banned Buzzwords.
 */

const https = require('https');

// ============================================================================
// 1. BANNED GENERIC FILLER PHRASES & TEXT CLEANER
// ============================================================================
const BANNED_FILLER_PATTERNS = [
  /systemic clarity/gi,
  /practical utility/gi,
  /goal alignment/gi,
  /master core concepts/gi,
  /structural framework/gi,
  /serves as a building block/gi,
  /academic concept overview/gi,
  /enhances scalability/gi,
  /designed to optimize efficiency/gi,
  /encapsulating specific functionality/gi,
  /reduces complexity by/gi
];

const cleanResponseText = (text) => {
  if (!text) return '';
  let cleaned = text
    .replace(/\\"/g, '"')                 // Unescape double quotes
    .replace(/\\'/g, "'")                 // Unescape single quotes
    .replace(/\*"\s*(.*?)\s*"\*/g, '"$1"') // Fix *" text "* to clean "text"
    .replace(/\*'\s*(.*?)\s*'\*/g, "'$1'") // Fix *' text '* to clean 'text'
    .replace(/\\/g, '')                   // Remove stray backslashes
    .replace(/\/\/\/\s*/g, '')            // Remove stray triple slashes
    .replace(/([^\n])(###+ )/g, '$1\n\n$2') // Ensure header spacing
    .replace(/\n{3,}/g, '\n\n')           // Remove excessive newlines
    .trim();

  BANNED_FILLER_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  return cleaned.trim();
};

// ============================================================================
// 2. DOMAIN & SUBJECT CLASSIFIER (UNIVERSAL ACADEMIC DOMAINS)
// ============================================================================
const DOMAINS = {
  OPERATING_SYSTEMS: 'Operating Systems',
  DATA_STRUCTURES: 'Data Structures',
  ALGORITHMS: 'Algorithms',
  DBMS: 'DBMS',
  COMPUTER_NETWORKS: 'Computer Networks',
  COMPUTER_ORGANIZATION: 'Computer Organization & Architecture',
  OOP: 'Object-Oriented Programming (OOP)',
  SOFTWARE_ENGINEERING: 'Software Engineering',
  WEB_DEVELOPMENT: 'Web Development',
  PROGRAMMING_LANGUAGES: 'Programming Languages',
  AI_MACHINE_LEARNING: 'AI & Machine Learning',
  DEEP_LEARNING_CV_NLP: 'Deep Learning, Computer Vision & NLP',
  CYBERSECURITY_CLOUD: 'Cybersecurity & Cloud Computing',
  MATHEMATICS_STATISTICS: 'Mathematics & Statistics',
  PHYSICS_SCIENCE: 'Physics & General Science',
  ENGINEERING: 'Engineering & Technology',
  GENERAL_ACADEMIC: 'Academic Discipline'
};

const detectDomain = (questionText, topic, subtopic) => {
  const combined = `${questionText || ''} ${topic || ''} ${subtopic || ''}`.toLowerCase();

  if (/\b(operating system|os|kernel|process|thread|deadlock|virtual memory|paging|segmentation|cpu scheduling|pcb|semaphore|mutex|file system|syscall|fork)\b/.test(combined)) {
    return DOMAINS.OPERATING_SYSTEMS;
  }
  if (/\b(linked list|stack|queue|tree|binary search tree|bst|heap|hash table|graph|node|array|trie|avl)\b/.test(combined)) {
    return DOMAINS.DATA_STRUCTURES;
  }
  if (/\b(binary search|sorting|quick sort|merge sort|bfs|dfs|dynamic programming|greedy|recursion|dijkstra|knapsack|big-o|sliding window|time complexity|space complexity)\b/.test(combined)) {
    return DOMAINS.ALGORITHMS;
  }
  if (/\b(dbms|sql|database|table|normalization|1nf|2nf|3nf|bcnf|acid|transaction|primary key|foreign key|index|join|relational)\b/.test(combined)) {
    return DOMAINS.DBMS;
  }
  if (/\b(network|tcp|udp|ip address|osi|router|switch|socket|dns|http|https|subnet|mac address|protocol|packet)\b/.test(combined)) {
    return DOMAINS.COMPUTER_NETWORKS;
  }
  if (/\b(class|object|inheritance|polymorphism|encapsulation|abstraction|interface|constructor|method overriding|method overloading)\b/.test(combined)) {
    return DOMAINS.OOP;
  }
  if (/\b(machine learning|ml|supervised|unsupervised|classification|regression|overfitting|loss function|dataset|scikit-learn)\b/.test(combined)) {
    return DOMAINS.AI_MACHINE_LEARNING;
  }
  if (/\b(cnn|rnn|lstm|transformer|nlp|neural network|deep learning|computer vision|opencv|yolo|segmentation|edge detection|bert|gpt)\b/.test(combined)) {
    return DOMAINS.DEEP_LEARNING_CV_NLP;
  }
  if (/\b(java|python|c\+\+|cpp|\bc\b|javascript|typescript|golang|rust|swift|syntax|pointer)\b/.test(combined)) {
    return DOMAINS.PROGRAMMING_LANGUAGES;
  }
  if (/\b(react|express|node\.js|html|css|mern|rest api|frontend|backend|dom|vue|angular)\b/.test(combined)) {
    return DOMAINS.WEB_DEVELOPMENT;
  }
  if (/\b(calculus|derivative|integral|matrix|eigenvalue|probability|statistics|algebra|differential equation|formula|standard deviation|mean|theorem|math)\b/.test(combined)) {
    return DOMAINS.MATHEMATICS_STATISTICS;
  }
  if (/\b(thermodynamics|mechanics|circuit|electronics|electromagnetism|quantum|physics|kinematics|fluid dynamics)\b/.test(combined)) {
    return DOMAINS.PHYSICS_SCIENCE;
  }
  if (/\b(cybersecurity|firewall|encryption|cryptography|cloud|docker|kubernetes|devops|aws|git|github)\b/.test(combined)) {
    return DOMAINS.CYBERSECURITY_CLOUD;
  }

  return DOMAINS.GENERAL_ACADEMIC;
};

// ============================================================================
// 3. UNIVERSAL PREREQUISITE & DEPENDENCY DETECTOR
// ============================================================================
const detectPrerequisites = (topicName) => {
  const t = topicName.toLowerCase();

  if (t.includes('dynamic programming')) {
    return ['Arrays & Data Structures', 'Recursion & Call Stack', 'Recurrence Relations', 'Time & Space Complexity Analysis'];
  }
  if (t.includes('machine learning') || t.includes('deep learning')) {
    return ['Basic Python Programming', 'Linear Algebra (Matrices & Vectors)', 'Probability & Statistics', 'Basic Calculus (Derivatives & Gradients)'];
  }
  if (t.includes('operating system') || t.includes('os')) {
    return ['Basic C / Programming Concepts', 'Computer Organization & CPU Registers', 'Basic Data Structures (Queues & Stacks)'];
  }
  if (t.includes('react')) {
    return ['HTML5 Structure & Semantic Tags', 'CSS Fundamentals & Flexbox', 'JavaScript ES6+ (Arrow functions, Promises, Array methods)'];
  }
  if (t.includes('dbms') || t.includes('database')) {
    return ['Basic Set Theory & Logic', 'Data Modeling Concepts', 'Basic Data Types'];
  }
  if (t.includes('computer networks')) {
    return ['Basic Computer Hardware Concepts', 'Binary & Decimal Conversions', 'System Architecture Fundamentals'];
  }
  if (t.includes('thermodynamics')) {
    return ['Basic High School Physics', 'Elementary Calculus (Integration & Differentiation)', 'Energy & Work Fundamentals'];
  }
  if (t.includes('c++') || t.includes('java')) {
    return ['Basic Computer Logic', 'Variables, Data Types & Operators', 'Control Structures (If-else, Loops)'];
  }
  if (t.includes('graph') || t.includes('tree')) {
    return ['Arrays & Pointers / References', 'Recursion Fundamentals', 'Basic Queue & Stack Operations'];
  }

  return [`Basic foundational knowledge in ${topicName}`, 'Fundamental logical reasoning'];
};

// ============================================================================
// 4. DYNAMIC LEARNING ROADMAP GENERATOR (FOR ANY TOPIC)
// ============================================================================
const generateTopicRoadmap = (topicName) => {
  const t = topicName.toLowerCase();

  if (t.includes('operating system') || t.includes('os')) {
    return [
      { level: 1, title: 'Foundations & Architecture', subtopics: ['What is an OS?', 'Kernel Mode vs User Mode', 'System Calls', 'OS Architecture'] },
      { level: 2, title: 'Process Management', subtopics: ['Program vs Process', 'Process States & PCB', 'Context Switching', 'Threads'] },
      { level: 3, title: 'CPU Scheduling', subtopics: ['Preemptive vs Non-Preemptive', 'FCFS & SJF', 'Round Robin', 'Multilevel Feedback Queue'] },
      { level: 4, title: 'Process Synchronization', subtopics: ['Critical Section Problem', 'Race Conditions', 'Mutex & Semaphores', 'Monitors'] },
      { level: 5, title: 'Deadlocks', subtopics: ['4 Coffman Conditions', 'Deadlock Prevention & Avoidance', 'Banker\'s Algorithm', 'Detection & Recovery'] },
      { level: 6, title: 'Memory Management', subtopics: ['Address Binding', 'Paging & Segmentation', 'Virtual Memory', 'Page Replacement (LRU, FIFO)'] },
      { level: 7, title: 'File Systems & I/O', subtopics: ['File Allocation Methods', 'Directory Structures', 'Free Space Management', 'Disk Scheduling'] },
      { level: 8, title: 'Advanced & Modern OS', subtopics: ['Virtualization & Hypervisors', 'Containerization Basics', 'OS Security & Protection'] }
    ];
  }

  if (t.includes('python')) {
    return [
      { level: 1, title: 'Beginner Foundations', subtopics: ['Variables & Data Types', 'Operators & Input/Output', 'Control Flow (If-Else, Loops)'] },
      { level: 2, title: 'Data Structures', subtopics: ['Lists & Tuples', 'Dictionaries & Sets', 'List Comprehensions', 'String Manipulation'] },
      { level: 3, title: 'Functions & Modules', subtopics: ['Defining Functions & Parameters', 'Scope & Global Keywords', 'Lambda Functions', 'Standard Library Imports'] },
      { level: 4, title: 'Object-Oriented Python', subtopics: ['Classes & Objects', 'Self & __init__', 'Inheritance & Polymorphism', 'Encapsulation'] },
      { level: 5, title: 'File Handling & Exceptions', subtopics: ['Reading & Writing Files', 'Try-Except-Finally', 'Custom Exceptions', 'Context Managers (with)'] },
      { level: 6, title: 'Intermediate Concepts', subtopics: ['Decorators & Generators', 'Iterators & Iterables', 'Virtual Environments & pip', 'Working with JSON'] },
      { level: 7, title: 'Advanced & Ecosystem', subtopics: ['Multithreading vs Multiprocessing', 'Asynchronous Programming (asyncio)', 'Unit Testing with unittest/pytest'] },
      { level: 8, title: 'Mastery & Real Projects', subtopics: ['Building APIs with FastAPI/Flask', 'Data Analysis with Pandas', 'Scripting & Automation'] }
    ];
  }

  if (t.includes('machine learning') || t.includes('ml')) {
    return [
      { level: 1, title: 'Foundations & Math Basics', subtopics: ['What is ML?', 'Supervised vs Unsupervised vs Reinforcement', 'Linear Algebra & Vectors', 'Statistics & Distributions'] },
      { level: 2, title: 'Data Preprocessing', subtopics: ['Feature Scaling & Normalization', 'Handling Missing Data', 'Encoding Categorical Data', 'Train-Test Split'] },
      { level: 3, title: 'Supervised Learning — Regression', subtopics: ['Linear Regression', 'Cost Functions & Gradient Descent', 'Polynomial Regression', 'Regularization (L1/L2)'] },
      { level: 4, title: 'Supervised Learning — Classification', subtopics: ['Logistic Regression', 'Decision Trees & Random Forests', 'Support Vector Machines (SVM)', 'Naive Bayes'] },
      { level: 5, title: 'Model Evaluation & Tuning', subtopics: ['Confusion Matrix & ROC-AUC', 'Precision, Recall & F1-Score', 'Cross-Validation', 'GridSearchCV & Hyperparameters'] },
      { level: 6, title: 'Unsupervised Learning', subtopics: ['K-Means Clustering', 'Hierarchical Clustering', 'PCA (Principal Component Analysis)', 'Anomaly Detection'] },
      { level: 7, title: 'Introduction to Neural Networks', subtopics: ['Perceptrons & Activation Functions', 'Forward & Backward Propagation', 'Loss Functions', 'Overfitting Mitigation'] },
      { level: 8, title: 'Mastery & Real-World ML', subtopics: ['Model Deployment with Flask/FastAPI', 'ML Pipeline Optimization', 'Ethics & Bias in ML'] }
    ];
  }

  if (t.includes('c++')) {
    return [
      { level: 1, title: 'Syntax & Basics', subtopics: ['Structure of C++ Program', 'Variables, Data Types & I/O', 'Control Flow (If, Switch, Loops)', 'Pointers & References'] },
      { level: 2, title: 'Functions & Memory', subtopics: ['Function Pass by Value vs Reference', 'Function Overloading', 'Dynamic Memory Allocation (new/delete)', 'Call Stack'] },
      { level: 3, title: 'Object-Oriented Programming', subtopics: ['Classes & Constructors/Destructors', 'Access Specifiers', 'Inheritance & Virtual Functions', 'Polymorphism'] },
      { level: 4, title: 'Standard Template Library (STL)', subtopics: ['Vectors & Arrays', 'Lists & Deques', 'Stacks & Queues', 'Maps & Sets'] },
      { level: 5, title: 'Advanced C++ Concepts', subtopics: ['Templates & Generic Programming', 'Exception Handling', 'Smart Pointers (unique_ptr, shared_ptr)', 'Move Semantics'] },
      { level: 6, title: 'Mastery & Problem Solving', subtopics: ['STL Algorithms (std::sort, std::binary_search)', 'Custom Data Structures', 'Competitive Programming Techniques'] }
    ];
  }

  // Universal Dynamic Generator for ANY arbitrary topic
  return [
    { level: 1, title: `Foundations of ${topicName}`, subtopics: [`Overview & Definition of ${topicName}`, `Core Purpose & Why It Matters`, `Basic Terminology`, `Real-world Context`] },
    { level: 2, title: `Core Mechanisms & Principles`, subtopics: [`Primary Operating Components`, `Basic Working Flow`, `Fundamental Rules & Laws`, `Simple Practical Examples`] },
    { level: 3, title: `Intermediate Concepts & Methods`, subtopics: [`Key Algorithms & Operations`, `Implementation Techniques`, `Common Standard Problems`, `Comparative Analysis`] },
    { level: 4, title: `Advanced Working & Internal Details`, subtopics: [`Internal Architecture & Edge Cases`, `Trade-off Analysis`, `Optimization Strategies`, `Systemic Integration`] },
    { level: 5, title: `Problem Solving & Practical Application`, subtopics: [`Real-world Scenario Analysis`, `Troubleshooting & Debugging`, `Complex Numerical / Coding Problems`, `Best Practices`] },
    { level: 6, title: `Topic Mastery & Critical Thinking`, subtopics: [`System Design & Architecture Questions`, `Interview / Exam Level Challenges`, `Independent Application`, `Mastery Synthesis`] }
  ];
};

// ============================================================================
// 5. INTENT CLASSIFIER & TOPIC MASTERY MODE DETECTOR
// ============================================================================
const INTENTS = {
  TOPIC_MASTERY_REQUEST: 'TOPIC_MASTERY_REQUEST', // "Teach me OS", "Master Python"
  DEFINITION: 'DEFINITION',             // "What is X?"
  EXPLANATION: 'EXPLANATION',           // "Explain X"
  DETAILED_EXPLANATION: 'DETAILED',     // "Explain X in detail"
  SIMPLE_EXPLANATION: 'SIMPLE',         // "Explain X simply"
  WHY_NEEDED: 'WHY_NEEDED',             // "Why is X needed?"
  HOW_IT_WORKS: 'HOW_IT_WORKS',         // "How does X work?"
  WHAT_IF: 'WHAT_IF',                   // "What happens if process enters deadlock?"
  COMPARISON: 'COMPARISON',             // "X vs Y"
  EXAMPLE: 'EXAMPLE',                   // "Give an example of X"
  REAL_WORLD_EXAMPLE: 'REAL_WORLD',     // "Real-world example of X"
  CODE_GEN: 'CODE_GEN',                 // "Write C++ code for X"
  CODE_EXPLANATION: 'CODE_EXPLANATION', // "Explain this code"
  CODE_DEBUG: 'CODE_DEBUG',             // "Why is this code giving error?"
  CODE_OPTIMIZE: 'CODE_OPTIMIZE',       // "Optimize this code"
  ALGORITHM: 'ALGORITHM',               // "Explain sliding window algorithm"
  PROBLEM_SOLVING: 'PROBLEM_SOLVING',   // "Solve this array problem"
  DRY_RUN: 'DRY_RUN',                   // "Dry run this code"
  EXAM_5_MARK: 'EXAM_5_MARK',           // "Give 5-mark answer for X"
  EXAM_10_MARK: 'EXAM_10_MARK',         // "Give 10-mark long answer for X"
  SHORT_2_LINE: 'SHORT_2_LINE',         // "Explain OS in 2 lines"
  MCQ: 'MCQ',                           // "Answer this MCQ"
  TRUE_FALSE: 'TRUE_FALSE',             // "True or False"
  INTERVIEW_PREP: 'INTERVIEW',          // "Explain X for an interview"
  VIVA_PREP: 'VIVA',                    // "Viva answer for X"
  NOTES_REQUEST: 'NOTES',               // "Give notes on X"
  REVISION: 'REVISION',                 // "Quick revision points for X"
  LEARNING_PLAN: 'LEARNING_PLAN',       // "What should I learn next?"
  HINT: 'HINT',                         // "Give me a hint"
  SIMPLIFY: 'SIMPLIFY',                 // "Simplify"
  ANALOGY: 'ANALOGY',                   // "Explain using an analogy"
  ERROR_CORRECTION: 'CORRECTION',       // Politeness & correction of wrong statement
  PRACTICE_SUBMISSION: 'PRACTICE_SUBMISSION', // Student answering a tutor question
  OPEN_ENDED: 'OPEN_ENDED'              // Dynamic open-ended query
};

const detectMasteryRequest = (rawText) => {
  const lower = rawText.toLowerCase().trim();
  const masteryRegex = /^(teach me|i want to learn|i want to master|master|start learning|learn|create a learning path for|create roadmap for|guide me through)\s+(.+)/i;
  const match = lower.match(masteryRegex);

  if (match) {
    let topicName = match[2]
      .replace(/\s+(from basics|from scratch|step by step|completely|for beginners|in detail)$/i, '')
      .replace(/[?!.]+$/g, '')
      .trim();

    if (topicName.length > 1) {
      const formattedTopic = topicName.charAt(0).toUpperCase() + topicName.slice(1);
      return { isMastery: true, topic: formattedTopic };
    }
  }
  return { isMastery: false, topic: null };
};

const extractExactConcept = (questionText, history = [], topic = '', subtopic = '') => {
  const raw = questionText.trim();
  const lower = raw.toLowerCase();

  // Action chips & follow-ups
  if (/^(give me a hint|hint)$/i.test(lower)) {
    const lastConcept = extractConceptFromHistory(history) || topic || 'Concept';
    return { concept: lastConcept, isAction: 'HINT' };
  }
  if (/^(give me a real-world example|real-world example|example)$/i.test(lower)) {
    const lastConcept = extractConceptFromHistory(history) || topic || 'Concept';
    return { concept: lastConcept, isAction: 'EXAMPLE' };
  }
  if (/^(simplify this concept|simplify|make that simpler|make it simpler)$/i.test(lower)) {
    const lastConcept = extractConceptFromHistory(history) || topic || 'Concept';
    return { concept: lastConcept, isAction: 'SIMPLIFY' };
  }
  if (/^(compare with alternative approach|compare)$/i.test(lower)) {
    const lastConcept = extractConceptFromHistory(history) || topic || 'Concept';
    return { concept: lastConcept, isAction: 'COMPARE' };
  }

  // Handle implicit references ("What about its types?", "Explain the second one")
  if (/\b(its types|the second one|the first one|the third one|it|this|that|above)\b/i.test(lower)) {
    const lastConcept = extractConceptFromHistory(history);
    if (lastConcept) {
      return { concept: `${lastConcept} (${raw})`, isAction: null };
    }
  }

  // Comparison queries ("TCP vs UDP", "Process vs Thread")
  const vsMatch = raw.match(/([a-zA-Z0-9\+\#\s\.]+)\s+(?:vs|versus|and|different from|difference between)\s+([a-zA-Z0-9\+\#\s\.]+)/i);
  if (vsMatch) {
    const termA = vsMatch[1].replace(/^(what is the difference between|difference between|compare)\s+/i, '').trim();
    const termB = vsMatch[2].replace(/\?$/g, '').trim();
    return { concept: `${termA} vs ${termB}`, isAction: null };
  }

  let extracted = raw
    .replace(/^(what is|what are|define|explain|tell me about|can you explain|give me an example of|show me|how to|why is|difference between|write|calculate|derive|solve|teach me|i want to learn|master)\s+/i, '')
    .replace(/^(a|an|the)\s+/i, '')
    .replace(/[?!.]+$/g, '')
    .trim();

  if (extracted.length < 2 || extracted.split(/\s+/).length > 6) {
    extracted = subtopic || topic || 'Academic Concept';
  }

  const titleCaseConcept = extracted.charAt(0).toUpperCase() + extracted.slice(1);
  return { concept: titleCaseConcept, isAction: null };
};

const extractConceptFromHistory = (history) => {
  if (!history || !Array.isArray(history) || history.length === 0) return null;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'user' && msg.content && !/^(hint|example|simplify|compare)$/i.test(msg.content.trim())) {
      const parsed = extractExactConcept(msg.content, []);
      if (parsed && parsed.concept) return parsed.concept;
    }
  }
  return null;
};

const detectQuestionType = (questionText, isAction) => {
  if (isAction) return isAction;
  const lower = questionText.toLowerCase().trim();

  // Check Topic Mastery intent first
  const masteryCheck = detectMasteryRequest(lower);
  if (masteryCheck.isMastery) return INTENTS.TOPIC_MASTERY_REQUEST;

  // Exam formats
  if (/\b(in 2 lines|in two lines|in 2 sentences|in 1 line|one sentence)\b/.test(lower)) return INTENTS.SHORT_2_LINE;
  if (/\b(5 mark|5-mark|5 marks)\b/.test(lower)) return INTENTS.EXAM_5_MARK;
  if (/\b(10 mark|10-mark|10 marks|long answer|essay)\b/.test(lower)) return INTENTS.EXAM_10_MARK;

  // MCQ & True/False
  if (/\b(mcq|option a|option b|multiple choice|choose the correct)\b/.test(lower)) return INTENTS.MCQ;
  if (/\b(true or false|true\/false|is this statement true)\b/.test(lower)) return INTENTS.TRUE_FALSE;

  // Code actions: Dry Run, Debug, Optimize
  if (/\b(dry run|trace execution|step through code)\b/.test(lower)) return INTENTS.DRY_RUN;
  if (/\b(debug|fix this|error in code|why is this failing)\b/.test(lower)) return INTENTS.CODE_DEBUG;
  if (/\b(optimize|improve efficiency|refactor code|make it faster)\b/.test(lower)) return INTENTS.CODE_OPTIMIZE;

  // Interview, Viva, Notes, Revision
  if (/\b(interview|interview question|crack interview)\b/.test(lower)) return INTENTS.INTERVIEW_PREP;
  if (/\b(viva|viva question|oral exam)\b/.test(lower)) return INTENTS.VIVA_PREP;
  if (/\b(notes|study notes|class notes)\b/.test(lower)) return INTENTS.NOTES_REQUEST;
  if (/\b(revision|quick revision|cheat sheet)\b/.test(lower)) return INTENTS.REVISION;
  if (/\b(what should i learn|learn after|next topic|roadmap)\b/.test(lower)) return INTENTS.LEARNING_PLAN;

  // What-if
  if (/^what happens if/i.test(lower) || /\b(what if|if a process enters|if system crashes)\b/.test(lower)) return INTENTS.WHAT_IF;

  // Code Generation
  if (/\b(code|program|implementation|c\+\+ code|java code|python code|write a function)\b/.test(lower)) return INTENTS.CODE_GEN;

  // Comparisons & Pros/Cons
  if (/\b(vs|difference|compare|versus|different between)\b/.test(lower)) return INTENTS.COMPARISON;

  // Simplification, Hint, Analogy
  if (/\b(simply|simply put|simple language|make it simpler|beginner friendly)\b/.test(lower)) return INTENTS.SIMPLIFY;
  if (/\b(hint|clue)\b/.test(lower)) return INTENTS.HINT;
  if (/\b(analogy|metaphor)\b/.test(lower)) return INTENTS.ANALOGY;
  if (/\b(real-world|real world|in real life|practical application)\b/.test(lower)) return INTENTS.REAL_WORLD_EXAMPLE;

  // Standard Definition / Explanation
  if (/\b(in detail|detailed|comprehensive)\b/.test(lower)) return INTENTS.DETAILED_EXPLANATION;
  if (/^(what is|define|meaning of)\s+/i.test(lower)) return INTENTS.DEFINITION;

  return INTENTS.OPEN_ENDED;
};

// Check if user is responding to a practice question in conversation history
const checkPracticeAnswerContext = (history) => {
  if (!history || !Array.isArray(history) || history.length === 0) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'assistant' && msg.content) {
      if (msg.content.includes('Practice Question') || msg.content.includes('Exercise:') || msg.content.includes('Question:')) {
        return msg.content;
      }
    }
  }
  return null;
};

// Get current hint stage from history
const getHintStage = (history) => {
  if (!history || !Array.isArray(history)) return 1;
  let hintCount = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'user' && /^(give me a hint|hint|clue)$/i.test(msg.content.trim())) {
      hintCount++;
    } else if (msg.role === 'user' && !/^(give me a hint|hint|clue)$/i.test(msg.content.trim())) {
      break;
    }
  }
  return Math.min(4, hintCount + 1);
};

// ============================================================================
// 6. LLM PROMPT BUILDER
// ============================================================================
const buildContextPrompt = (history, topic, subtopic, learningGoal) => {
  let contextStr = `CURRENT LEARNING CONTEXT:\n- Primary Subject/Topic: ${topic || 'General Studies'}\n`;
  if (subtopic) contextStr += `- Subtopic: ${subtopic}\n`;
  if (learningGoal) contextStr += `- Student Goal: ${learningGoal}\n`;

  if (history && Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-6);
    contextStr += `\nRECENT CONVERSATION HISTORY:\n`;
    recent.forEach(msg => {
      const speaker = msg.role === 'user' ? 'Student' : 'AI Tutor';
      contextStr += `${speaker}: ${msg.content.substring(0, 180)}\n`;
    });
  }

  return contextStr;
};

const buildSystemInstruction = (domain, concept, intent) => {
  return `You are StudyShield AI Tutor, a world-class personal academic tutor and professor.
Domain: "${domain}" | Subject/Concept: "${concept}"

UNIVERSAL ACADEMIC MASTERY INSTRUCTIONS:
1. TECHNICAL CORRECTNESS & INTENT ADAPTATION ARE YOUR TOP PRIORITIES.
2. TOPIC MASTERY MODE: If asked "Teach me X" or "Master X", do NOT dump a wall of text. Present a clear 6-8 Level Roadmap (From Level 1 Foundations to Level 6+ Mastery), list prerequisites, and teach Level 1 clearly followed by a Practice Question.
3. STANDALONE QUESTION MODE: If asked a specific question ("What is X?"), answer it accurately and directly without forcing a course structure. Append a subtle "Next Study Step".
4. ACTIVE LEARNING: Always include a practice question after explaining important concepts so the learner can test their understanding.
5. NO FILLER: Zero buzzwords or generic phrases (no "Systemic Clarity", "Practical Utility", "Goal Alignment", "Master core concepts").
6. TECHNICAL ACCURACY: Never invent formulas, complexities, or technical specifications. State limits clearly.`;
};

const buildFormatInstruction = (intent, concept, hintStage) => {
  switch (intent) {
    case INTENTS.TOPIC_MASTERY_REQUEST:
      return `FORMAT: 
1. **Topic Learning Path & Prerequisites**: List mandatory/recommended prerequisites for "${concept}", then present the 6-8 Level Structured Roadmap (Foundations -> Core Mechanics -> Intermediate -> Advanced -> Mastery).
2. **LEVEL 1 — FOUNDATIONS**: Explain what "${concept}" is, why it matters, and a real-world analogy.
3. **Practice Question (Level 1)**: End with one clear question for the student to test their level 1 understanding.`;

    case INTENTS.HINT:
      return `FORMAT: Provide Stage ${hintStage} Progressive Hint for "${concept}":
Stage 1 = Conceptual Clue
Stage 2 = Strategy & Approach Clue
Stage 3 = Specific Direction Clue
Stage 4 = Partial Solution
(Provide ONLY Stage ${hintStage} hint clearly).`;

    case INTENTS.SHORT_2_LINE:
      return `FORMAT: Provide a clear, precise 2-line explanation of "${concept}".`;

    case INTENTS.EXAM_5_MARK:
      return `FORMAT: Provide a 5-mark exam answer for "${concept}" with: 1. Definition, 2. Key Points (bulleted), 3. Important Terminology, 4. Short Example, 5. Conclusion.`;

    case INTENTS.EXAM_10_MARK:
      return `FORMAT: Provide a 10-mark long exam answer for "${concept}" with detailed sections covering Overview, Architecture/Components, Working Mechanism, Examples, and Advantages.`;

    case INTENTS.MCQ:
      return `FORMAT: State the correct option clearly (e.g. "**Correct Option: B**") followed by a clear, step-by-step technical explanation of why it is correct and why other options are incorrect.`;

    case INTENTS.TRUE_FALSE:
      return `FORMAT: State clearly "**Statement: TRUE**" or "**Statement: FALSE**", followed by the exact technical explanation.`;

    case INTENTS.DRY_RUN:
      return `FORMAT: Provide a step-by-step Dry Run table tracing variable states, line numbers, loop conditions, and final output.`;

    case INTENTS.CODE_DEBUG:
      return `FORMAT: 1. Identify the exact error/bug, 2. Explain why it occurs, 3. Provide corrected code block, 4. Explain the fix.`;

    case INTENTS.WHAT_IF:
      return `FORMAT: 1. Direct answer explaining the immediate consequence, 2. System behavior breakdown, 3. Recovery or prevention mechanisms.`;

    case INTENTS.COMPARISON:
      return `FORMAT: Clean Markdown comparison table with meaningful properties, followed by situational recommendations ("When to use which").`;

    case INTENTS.INTERVIEW_PREP:
      return `FORMAT: 1. High-level elevator pitch answer for interviewer, 2. Technical deep-dive points, 3. Common follow-up interview questions to prepare.`;

    case INTENTS.VIVA_PREP:
      return `FORMAT: 3-4 bullet points of direct, crisp viva answers that can be spoken aloud in an oral examination.`;

    case INTENTS.REAL_WORLD_EXAMPLE:
    case INTENTS.ANALOGY:
      return `FORMAT: Provide an intuitive, easy-to-understand real-world analogy and practical scenario explaining "${concept}".`;

    case INTENTS.CODE_GEN:
      return `FORMAT: 1. Approach explanation, 2. Clean, syntactically valid code block, 3. Key line explanation, 4. Sample input/output.`;

    case INTENTS.DEFINITION:
      return `FORMAT: 1. What is ${concept}? (2-4 sentences), 2. Main Functions / Key Components, 3. Simple Example, 4. Key Takeaway.`;

    default:
      return `FORMAT: Provide a clear, technically accurate academic explanation tailored to the exact question. End with a practice question or next concept recommendation.`;
  }
};

const fetchPublicLlm = async (systemInstruction, contextPrompt, userMessage, formatInstruction) => {
  try {
    const fullPrompt = `${systemInstruction}\n\n${contextPrompt}\n\n${formatInstruction}\n\nStudent Request: "${userMessage}"\n\nGenerate accurate response now:`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 15) {
        return cleanResponseText(text.trim());
      }
    }
  } catch (err) {
    console.warn('[StudyShield AI Tutor LLM Fetch Warning]', err.message);
  }
  return null;
};

// ============================================================================
// 7. DYNAMIC ACADEMIC FALLBACK ENGINE (HANDLES ANY TOPIC & INTENT OFFLINE)
// ============================================================================
const generateFallbackResponse = ({ domain, intent, concept, rawMsg, topic, history, hintStage }) => {
  const lowerMsg = rawMsg.toLowerCase();
  const displayTopic = concept || topic || 'Academic Topic';

  // 1. TOPIC MASTERY ROADMAP MODE ("Teach me X", "Master X")
  if (intent === INTENTS.TOPIC_MASTERY_REQUEST || lowerMsg.startsWith('teach me') || lowerMsg.includes('master')) {
    const topicName = concept || topic || 'Target Subject';
    const prereqs = detectPrerequisites(topicName);
    const roadmap = generateTopicRoadmap(topicName);

    let output = `🎓 **Universal Topic Mastery Roadmap: ${topicName}**\n\n`;

    output += `### 📋 Prerequisites & Background Check\n`;
    output += `Before mastering **${topicName}**, it is recommended to have familiarity with:\n`;
    prereqs.forEach(p => output += `• ${p}\n`);
    output += `*(If you are new to these, don't worry! We will cover key background points as we go.)*\n\n`;

    output += `--- \n\n### 🗺️ Master Learning Path for ${topicName}\n\n`;
    roadmap.forEach(lvl => {
      output += `**LEVEL ${lvl.level} — ${lvl.title.toUpperCase()}**\n`;
      lvl.subtopics.forEach(st => output += `  • ${st}\n`);
      output += `\n`;
    });

    output += `--- \n\n### 🚀 LEVEL 1 — FOUNDATIONS: What is ${topicName}?\n\n`;
    output += `**${topicName}** is a core discipline in **${domain}**.\n\n`;
    output += `• **Primary Purpose**: Provides the core principles and structural mechanisms for solving problems in **${domain}**.\n`;
    output += `• **Real-World Analogy**: Think of ${topicName} like the blueprints and engine of an automobile — it defines how data, operations, and logic interact seamlessly.\n\n`;

    output += `### ✏️ Practice Question (Level 1 Check)\n`;
    output += `To start your journey into **${topicName}**, answer this quick question:\n`;
    output += `*In your own words, what is the primary goal of ${topicName}, and why is it important in ${domain}?*\n\n`;
    output += `*(Type your answer below, and I will evaluate your understanding!)*`;

    return cleanResponseText(output);
  }

  // 2. PROGRESSIVE HINT ENGINE (4 STAGES)
  if (intent === INTENTS.HINT || lowerMsg.includes('hint')) {
    if (hintStage === 1) {
      return cleanResponseText(
        `💡 **Stage 1 Hint (Conceptual Clue): ${displayTopic}**\n\n` +
        `Think about the underlying goal of **${displayTopic}**. Identify what inputs are received and what the final required outcome is before writing down steps.`
      );
    } else if (hintStage === 2) {
      return cleanResponseText(
        `💡 **Stage 2 Hint (Strategy & Approach): ${displayTopic}**\n\n` +
        `Consider breaking **${displayTopic}** into smaller sub-problems. If working with data or code, ask yourself: *What state changes at each step?*`
      );
    } else if (hintStage === 3) {
      return cleanResponseText(
        `💡 **Stage 3 Hint (Specific Direction): ${displayTopic}**\n\n` +
        `Focus on the key rule of **${displayTopic}**: verify the boundary conditions (e.g., empty inputs, zero values, or maximum limits) to avoid edge-case errors.`
      );
    } else {
      return cleanResponseText(
        `💡 **Stage 4 Hint (Partial Solution): ${displayTopic}**\n\n` +
        `Here is the key structure:\n` +
        `1. Initialize your starting values / assumptions.\n` +
        `2. Execute the main transition rule for **${displayTopic}**.\n` +
        `3. Return or evaluate the final result.\n\n` +
        `Would you like me to walk through the complete solution step-by-step?`
      );
    }
  }

  // 3. SIMPLIFICATION ENGINE
  if (intent === INTENTS.SIMPLIFY || lowerMsg.includes('simplify')) {
    return cleanResponseText(
      `🔍 **Simplified Breakdown: ${displayTopic}**\n\n` +
      `Let's strip away the complex technical terms:\n\n` +
      `1. **What is it?**: **${displayTopic}** is simply a method to solve a specific problem step-by-step.\n` +
      `2. **Why do we need it?**: Without it, the system would be slow, disorganized, or fail completely.\n` +
      `3. **Simple Analogy**: Imagine organizing a shelf by alphabetical order so you can find any book in seconds instead of searching every page.`
    );
  }

  // 4. REAL-WORLD EXAMPLE ENGINE
  if (intent === INTENTS.REAL_WORLD_EXAMPLE || lowerMsg.includes('real-world example')) {
    return cleanResponseText(
      `🧩 **Real-World Application: ${displayTopic}**\n\n` +
      `### Industry Context\n` +
      `In modern software and engineering systems, **${displayTopic}** is used every day:\n\n` +
      `• **Example**: When you use apps like Google Maps or Netflix, **${displayTopic}** processes data requests in real-time to deliver instant, optimal responses without overwhelming server hardware.\n` +
      `• **Key Takeaway**: Understanding **${displayTopic}** allows engineers to build scalable, high-performance applications.`
    );
  }

  // 5. COMPARISON ENGINE
  if (intent === INTENTS.COMPARISON || lowerMsg.includes('vs') || lowerMsg.includes('compare')) {
    return cleanResponseText(
      `📊 **Comparative Analysis: ${displayTopic}**\n\n` +
      `| Feature / Criteria | ${displayTopic.split(' vs ')[0] || displayTopic} | ${displayTopic.split(' vs ')[1] || 'Alternative Approach'} |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **Core Mechanism** | Primary operational logic | Secondary/Alternative logic |\n` +
      `| **Performance Overhead** | Optimized for specific workload | Optimized for general flexibility |\n` +
      `| **Complexity** | Straightforward implementation | Higher architectural complexity |\n` +
      `| **Best Use Case** | When high predictability is required | When dynamic adaptability is required |\n\n` +
      `### Recommendation:\n` +
      `Choose **${displayTopic.split(' vs ')[0] || displayTopic}** when reliability and strict constraints take priority.`
    );
  }

  // 6. SHORT 2-LINE INTENT
  if (intent === INTENTS.SHORT_2_LINE) {
    return cleanResponseText(
      `📌 **${displayTopic} (In 2 Lines)**\n\n` +
      `**${displayTopic}** is a foundational concept in **${domain}** that structures system operations and data flow.\n` +
      `It provides the essential rules required to ensure efficiency, correctness, and predictable performance.`
    );
  }

  // 7. EXAM 5-MARK ANSWER
  if (intent === INTENTS.EXAM_5_MARK) {
    return cleanResponseText(
      `📝 **${displayTopic} — 5-Mark Exam Reference Answer**\n\n` +
      `### 1. Definition\n` +
      `**${displayTopic}** is a core technical principle in **${domain}** designed to handle operational processes and resource allocation efficiently.\n\n` +
      `### 2. Key Characteristics & Features\n` +
      `• **Systemic Execution**: Operates under defined constraints within **${domain}**.\n` +
      `• **Resource Optimization**: Minimizes overhead during high-concurrency or execution states.\n` +
      `• **Predictability**: Ensures consistent outputs given identical input parameters.\n\n` +
      `### 3. Practical Example\n` +
      `When executing operations in **${domain}**, **${displayTopic}** manages intermediate states to prevent deadlocks or data corruption.\n\n` +
      `### 4. Summary\n` +
      `**${displayTopic}** serves as a mandatory building block for mastering advanced topics in **${domain}**.`
    );
  }

  // 8. DEFAULT STANDALONE ACADEMIC EXPLANATION
  return cleanResponseText(
    `📖 **${displayTopic}**\n\n` +
    `### 1. Overview & Definition\n` +
    `**${displayTopic}** is an essential subject in **${domain}**.\n` +
    `It defines the core rules and structural logic needed to execute operations reliably.\n\n` +
    `### 2. How It Works\n` +
    `1. **Initialization**: Input parameters and system states are verified.\n` +
    `2. **Core Operation**: The algorithm / mechanism of **${displayTopic}** processes the data.\n` +
    `3. **Termination & Output**: The result is returned with verified correctness.\n\n` +
    `### 3. Real-World Significance\n` +
    `Engineers and computer scientists use **${displayTopic}** to build reliable, high-performance systems in **${domain}**.\n\n` +
    `### ✏️ Quick Practice Question\n` +
    `*What is one key advantage of using ${displayTopic} in ${domain}? Write a 1-sentence answer below!*`
  );
};

// ============================================================================
// 8. FOLLOW-UP RECOMMENDATION ENGINE
// ============================================================================
const generateNextSteps = (domain, concept) => {
  const text = `${concept}`.toLowerCase();

  if (domain === DOMAINS.OPERATING_SYSTEMS) {
    if (text.includes('operating system') || text.includes('os')) return ['Kernel Architecture (Monolithic vs Microkernel)', 'User Mode vs Kernel Mode', 'System Calls', 'Process Management'];
    if (text.includes('kernel')) return ['System Calls & Interrupts', 'User Mode vs Kernel Mode', 'Process Creation (fork/exec)', 'Context Switching'];
    if (text.includes('process')) return ['Process Control Block (PCB)', 'Process States', 'CPU Scheduling Algorithms', 'Inter-Process Communication (IPC)'];
    if (text.includes('scheduling')) return ['FCFS & SJF Scheduling', 'Round Robin Scheduling', 'Multilevel Feedback Queue', 'Real-Time Scheduling'];
    if (text.includes('deadlock')) return ['4 Coffman Conditions', 'Banker\'s Algorithm', 'Deadlock Detection', 'Mutex vs Semaphores'];
    return ['Process Synchronization', 'Virtual Memory & Paging', 'File Systems', 'Disk Scheduling'];
  }

  if (domain === DOMAINS.DATA_STRUCTURES || domain === DOMAINS.ALGORITHMS) {
    if (text.includes('linked list')) return ['Singly vs Doubly Linked List', 'Cycle Detection (Floyd\'s Algorithm)', 'Reverse Linked List', 'Time Complexity'];
    if (text.includes('binary search')) return ['Lower Bound & Upper Bound', 'Search in Rotated Sorted Array', 'Binary Search Trees (BST)', 'AVL Rotations'];
    return ['Time & Space Complexity (Big-O)', 'Recursion & Backtracking', 'Trees & Graphs', 'Dynamic Programming'];
  }

  if (domain === DOMAINS.AI_MACHINE_LEARNING || domain === DOMAINS.DEEP_LEARNING_CV_NLP) {
    return ['Data Preprocessing & Feature Scaling', 'Supervised vs Unsupervised Learning', 'Gradient Descent Optimization', 'Model Evaluation (Precision/Recall)'];
  }

  return ['Core Fundamental Definitions', 'Practical Walkthroughs', 'Edge Case Analysis', 'Practice Problems'];
};

// ============================================================================
// 9. MAIN AI TUTOR ENTRY POINT
// ============================================================================
const askAiTutor = async ({ topic, subtopic, learningGoal, userMessage, history }) => {
  const rawMsg = userMessage ? userMessage.trim() : '';
  if (!rawMsg) {
    return {
      reply: "Please ask a specific question or topic, and I'll guide you step-by-step toward mastery!",
      role: 'assistant',
      timestamp: new Date()
    };
  }

  // 1. Detect Domain, Intent, and Exact Concept
  const domain = detectDomain(rawMsg, topic, subtopic);
  const { concept, isAction } = extractExactConcept(rawMsg, history, topic, subtopic);
  const intent = detectQuestionType(rawMsg, isAction);
  const hintStage = getHintStage(history);

  // 2. Build Context & LLM Instructions
  const systemInstruction = buildSystemInstruction(domain, concept, intent);
  const contextPrompt = buildContextPrompt(history, topic, subtopic, learningGoal);
  const formatInstruction = buildFormatInstruction(intent, concept, hintStage);

  // 3. Attempt Real-Time LLM Fetch
  const realTimeReply = await fetchPublicLlm(systemInstruction, contextPrompt, rawMsg, formatInstruction);

  let finalReply = '';
  if (realTimeReply) {
    finalReply = realTimeReply;
  } else {
    // 4. Fallback to Universal Academic Fallback Engine
    finalReply = generateFallbackResponse({
      domain,
      intent,
      concept,
      rawMsg,
      topic,
      history,
      hintStage
    });
  }

  // 5. Append Next Steps for Standalone Questions (if not already included)
  if (intent !== INTENTS.TOPIC_MASTERY_REQUEST && !finalReply.includes('Next:') && !finalReply.includes('Next Study') && !finalReply.includes('Correct Option:')) {
    const nextSteps = generateNextSteps(domain, concept);
    if (nextSteps && nextSteps.length > 0) {
      finalReply += `\n\nNext Steps to Study:\n` + nextSteps.map(s => `• ${s}`).join('\n');
    }
  }

  return {
    reply: finalReply,
    role: 'assistant',
    timestamp: new Date()
  };
};

// ============================================================================
// 10. ASSESSMENT GENERATION & STRICT EVALUATION ENGINE
// ============================================================================
const generateAssessment = async ({ topic, subtopic, learningGoal }) => {
  const displayTopic = subtopic ? `${topic} (${subtopic})` : topic;
  const goal = learningGoal || 'Master core concepts and practical application';
  const domain = detectDomain('', topic, subtopic);

  const assessmentPool = [
    {
      question: `Practical Scenario (${displayTopic}): You are tasked with analyzing a key problem in ${displayTopic} to achieve the goal: "${goal}". A sudden bottleneck degrades system performance. Explain step-by-step how you would structure your solution, address edge cases, and ensure optimal results in ${domain}.`,
      expectedConcepts: [`${topic} Application`, 'System Bottleneck Diagnosis', 'Edge Case Handling', 'Solution Verification'],
      difficulty: 'intermediate',
      assessmentType: 'scenario_analysis'
    },
    {
      question: `Technical Reasoning (${displayTopic}): Reviewing a conceptual implementation in ${displayTopic}, you notice unexpected behavior during edge case execution. Describe the primary trade-offs involved, your step-by-step refactoring approach, and how your changes align with "${goal}".`,
      expectedConcepts: [`${topic} Principles`, 'Trade-off Analysis', 'Refactoring & Edge Cases', 'Logical Correctness'],
      difficulty: 'intermediate',
      assessmentType: 'code_reasoning'
    }
  ];

  const selected = assessmentPool[Math.floor(Math.random() * assessmentPool.length)];
  return {
    topic,
    subtopic: subtopic || '',
    question: selected.question,
    expectedConcepts: selected.expectedConcepts,
    difficulty: selected.difficulty,
    assessmentType: selected.assessmentType
  };
};

const evaluateAssessment = async ({ question, expectedConcepts, studentAnswer, topic, subtopic, learningGoal }) => {
  const rawAnswer = studentAnswer ? studentAnswer.trim() : '';
  const answerLen = rawAnswer.length;
  const lowerAnswer = rawAnswer.toLowerCase();

  const LOW_EFFORT_PHRASES = [
    'hi', 'hello', 'hey', 'idk', 'no', 'yes', 'ok', 'okay', 'test', 'a', 'b', 'c',
    'dunno', 'dont know', "don't know", 'nothing', 'na', 'n/a', 'whatever', 'bye', 'pls'
  ];

  if (answerLen < 15 || LOW_EFFORT_PHRASES.includes(lowerAnswer)) {
    return {
      score: 0,
      metrics: { accuracy: 0, understanding: 0, application: 0, reasoning: 0, completeness: 0, relevance: 0 },
      strengths: [],
      weaknesses: [
        'Submission was too brief or non-substantive (0% awarded)',
        'Failed to address the scenario prompt and topic concepts'
      ],
      missingConcepts: expectedConcepts || [topic],
      suggestions: [
        `Write a complete response explaining your technical approach to ${topic}`,
        'Address the specific question prompt and expected concepts to earn points'
      ],
      feedback: `❌ **Score: 0% — Non-Substantive Submission**\n\nYour answer ("${rawAnswer}") was too short or non-substantive to demonstrate subject mastery for **${topic}**.`
    };
  }

  const fullContext = `${topic} ${subtopic || ''} ${learningGoal || ''} ${question || ''} ${(expectedConcepts || []).join(' ')}`.toLowerCase();
  const STOP_WORDS = new Set(['what', 'how', 'why', 'with', 'this', 'that', 'from', 'your', 'have', 'would', 'will', 'using', 'which', 'about', 'step', 'goal', 'core', 'main', 'also', 'solution', 'approach', 'system', 'implement', 'design']);
  const topicKeywords = Array.from(new Set(
    fullContext.split(/[\s\/,&().\-:]+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
  ));

  const answerWords = lowerAnswer.split(/[\s\/,&().\-:]+/);
  const matchedTopicWords = answerWords.filter(w => w.length > 3 && topicKeywords.some(kw => kw.includes(w) || w.includes(kw)));

  const matchedConcepts = [];
  const missingConcepts = [];

  (expectedConcepts || []).forEach(concept => {
    const conceptWords = concept.toLowerCase().split(/[\s\/,&]+/);
    const matched = conceptWords.some(w => w.length > 3 && lowerAnswer.includes(w));
    if (matched) matchedConcepts.push(concept);
    else missingConcepts.push(concept);
  });

  if (matchedTopicWords.length === 0 && matchedConcepts.length === 0) {
    return {
      score: 0,
      metrics: { accuracy: 0, understanding: 0, application: 0, reasoning: 0, completeness: 0, relevance: 0 },
      strengths: [],
      weaknesses: [
        `Answer is completely off-topic or irrelevant to ${topic}`,
        'Contains zero relevant technical concepts or topic terminology'
      ],
      missingConcepts: expectedConcepts || [topic],
      suggestions: [
        `Provide a relevant response addressing ${topic} and the scenario question`,
        'Use topic-specific terminology and step-by-step reasoning'
      ],
      feedback: `❌ **Score: 0% — Irrelevant Response**\n\nYour answer does not contain any relevant concepts or terminology related to **${topic}**.`
    };
  }

  const conceptRatio = (expectedConcepts && expectedConcepts.length > 0)
    ? (matchedConcepts.length / expectedConcepts.length)
    : (matchedTopicWords.length > 2 ? 0.6 : 0.3);

  const hasReasoning = lowerAnswer.includes('because') || lowerAnswer.includes('due to') || lowerAnswer.includes('step') || lowerAnswer.includes('therefore') || lowerAnswer.includes('however');

  const accuracyScore = Math.min(100, Math.round((conceptRatio * 60) + (matchedTopicWords.length * 10) + (answerLen > 100 ? 20 : 10)));
  const understandingScore = Math.min(100, Math.round((conceptRatio * 70) + (matchedTopicWords.length * 8)));
  const applicationScore = Math.min(100, Math.round((conceptRatio * 60) + (answerLen > 120 ? 30 : 15)));
  const reasoningScore = Math.min(100, Math.round((hasReasoning ? 40 : 10) + (conceptRatio * 40) + (answerLen > 100 ? 20 : 10)));
  const completenessScore = Math.min(100, Math.round(answerLen > 180 ? 95 : answerLen > 100 ? 75 : answerLen > 40 ? 50 : 25));
  const relevanceScore = Math.min(100, Math.round(40 + (conceptRatio * 40) + (matchedTopicWords.length * 10)));

  const metrics = { accuracy: accuracyScore, understanding: understandingScore, application: applicationScore, reasoning: reasoningScore, completeness: completenessScore, relevance: relevanceScore };

  const finalScore = Math.min(100, Math.max(0, Math.round(
    metrics.accuracy * 0.25 + metrics.understanding * 0.20 + metrics.application * 0.20 +
    metrics.reasoning * 0.15 + metrics.completeness * 0.10 + metrics.relevance * 0.10
  )));

  return {
    score: finalScore,
    metrics,
    strengths: [`Demonstrated relevant understanding of ${topic}`],
    weaknesses: missingConcepts.length > 0 ? missingConcepts.map(c => `Needs deeper elaboration on ${c}`) : ['Could include more quantitative details'],
    missingConcepts: expectedConcepts || [topic],
    suggestions: [`Review core ${topic} edge cases`, 'Practice writing step-by-step technical explanations'],
    feedback: `🎯 **Assessment Evaluation Complete (Score: ${finalScore}%)**\n\nYour response demonstrated a ${finalScore >= 85 ? 'strong' : finalScore >= 70 ? 'good' : 'developing'} grasp of **${topic}**.`
  };
};

module.exports = {
  askAiTutor,
  generateAssessment,
  evaluateAssessment,
  detectPrerequisites,
  generateTopicRoadmap
};
