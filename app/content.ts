export type Experience = {
  period: string;
  company: string;
  role: string;
  summary: string;
  outcomes: string[];
  stack: string;
};

export const experience: Experience[] = [
  {
    period: "MAY 2026 — PRESENT",
    company: "Curefit · House of Cult",
    role: "Software Engineering Intern",
    summary: "Engineering production AI automation across campaign, segmentation, notification, and internal operations systems.",
    outcomes: [
      "Built an AI agent for root-cause analysis with Hermes Agent and webhook-based self-learning feedback loops, auto-resolving 60%+ of failures while optimizing token usage for low latency and cost.",
      "Reduced incident response time by 70% by integrating Coralogix, AWS SQS, Sentry, and Metabase into automated monitoring and remediation pipelines.",
      "Evolved leave approval from Copilot to Autopilot with human-in-the-loop review, cutting manual review effort by 85%.",
      "Built and maintained 20+ REST APIs, including Metabase card APIs powering real-time dashboards for the Operations team.",
    ],
    stack: "Hermes Agent · Java · Python · AWS SQS · Coralogix · Sentry · Metabase · REST APIs",
  },
  {
    period: "MAY 2025 — APR 2026",
    company: "WorldQuant BRAIN",
    role: "Quantitative Research Consultant — Expert",
    summary: "Researched, implemented, and backtested quantitative alpha models under strict risk and turnover constraints.",
    outcomes: [
      "Developed and implemented new alpha models that improved investment-strategy performance by 20%.",
      "Conducted quantitative research and backtesting, collaborating with research teams to derive actionable financial insights.",
      "Submitted 300+ alphas; 12+ passed every quality check, including Sharpe above 2.25 and turnover below 30%.",
    ],
    stack: "Python · Quant research · Backtesting · Statistics",
  },
];

export type Project = {
  index: string;
  title: string;
  type: string;
  description: string;
  outcomes: string[];
  result: string;
  stack: string;
  href: string;
};

export const projects: Project[] = [
  {
    index: "01",
    title: "Automated Job Application System",
    type: "Full-stack browser automation",
    description: "A full-stack Chrome extension that turns unstructured résumé PDFs into editable profiles and completes applications across job portals.",
    outcomes: [
      "Built the extension and application stack with React, Node.js, Express, and MongoDB.",
      "Designed JWT-secured APIs and a modular schema for private, scalable profile management.",
      "Implemented asynchronous PDF parsing with pdf-parse and an editable React review flow.",
    ],
    result: "PDF → structured profile → autofill",
    stack: "React · Node.js · Express · MongoDB · JWT",
    href: "https://github.com/adityakumar027/Automated-Job-Application-System",
  },
  {
    index: "02",
    title: "Graph Node Classification",
    type: "Graph machine learning",
    description: "A GCN-based node classifier with two-hop neighborhood aggregation and weighted loss for the imbalanced CORA citation dataset.",
    outcomes: [
      "Improved classification accuracy by 15% over traditional dense-network baselines.",
      "Implemented two-hop neighborhood aggregation for stronger graph representation learning.",
      "Used weighted loss and data balancing to improve convergence on imbalanced CORA classes.",
    ],
    result: "15% accuracy improvement",
    stack: "Python · TensorFlow · Keras · GCN",
    href: "https://github.com/adityakumar027/node-classifier",
  },
  {
    index: "03",
    title: "PyOS",
    type: "Systems simulation",
    description: "A modular terminal operating-system simulation with authentication, concurrent command execution, process scheduling, and an extensible shell.",
    outcomes: [
      "Built a terminal OS simulation with a custom CLI, secure authentication, and multithreading.",
      "Designed an extensible shell where new commands can be added in fewer than 10 lines.",
      "Applied object-oriented architecture to authentication, process execution, and module boundaries.",
    ],
    result: "New commands in under 10 lines",
    stack: "Python · CLI · Multithreading",
    href: "https://github.com/adityakumar027/PyOS",
  },
];

export type Capability = {
  label: string;
  items: string;
};

export const capabilities: Capability[] = [
  { label: "Languages", items: "C, C++, JavaScript, Python, SQL" },
  { label: "Backend & Web", items: "Node.js, React, Express, REST APIs, microservices, JWT, Tailwind CSS" },
  { label: "AI Engineering", items: "Hermes Agent, OpenClaw, RAG, tokenization, prompt engineering, AI agents, deep learning" },
  { label: "Cloud & Operations", items: "AWS SQS, Kubernetes, Rancher, Jenkins, Spinnaker, Coralogix, Sentry, Metabase" },
  { label: "Data & ML", items: "MySQL, MongoDB, TensorFlow, Keras, NumPy, Pandas, Matplotlib" },
  { label: "Engineering", items: "Git, GitHub, Linux, workflow automation, MCP tooling, data structures, algorithms, operating systems" },
];

export const achievements: string[] = [
  "LeetCode Knight · 1820",
  "CodeChef 3★ · 1661",
  "Codeforces · 1300+",
  "1,000+ problems solved",
  "Google Big Code 2026 semifinalist",
];

export type ProductionSurface = {
  index: string;
  title: string;
  description: string;
  signal: string;
};

export const productionSurfaces: ProductionSurface[] = [
  {
    index: "01",
    title: "Campaign orchestration",
    description: "Worked on campaign execution and failure-analysis paths where reliability directly affects high-volume customer communication.",
    signal: "Production workflows · AI-assisted RCA",
  },
  {
    index: "02",
    title: "Segmentation services",
    description: "Contributed to operational services that turn audience and policy inputs into dependable, reviewable production workflows.",
    signal: "Human-in-the-loop · 85% less manual review",
  },
  {
    index: "03",
    title: "Notification reliability",
    description: "Built self-learning remediation loops across notification systems, automatically resolving more than 60% of observed failures.",
    signal: "60%+ auto-resolved · 70% faster response",
  },
  {
    index: "04",
    title: "Operations platform",
    description: "Delivered APIs and real-time operational visibility across Coralogix, Sentry, AWS SQS, and Metabase.",
    signal: "20+ REST APIs · Real-time dashboards",
  },
];

export type Contact = {
  email: string;
  github: string;
  linkedin: string;
  resume: string;
};

export const contact: Contact = {
  email: "adi.workspace76865@gmail.com",
  github: "https://github.com/adityakumar027",
  linkedin: "https://www.linkedin.com/in/adicrzz/",
  resume: "https://drive.google.com/file/d/1OJ-TCUjlttRgMqDw7UB4nr96Z6fGtAiQ/view?usp=sharing",
};