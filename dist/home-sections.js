"use strict";

/**
 * ══════════════════════════════════════════════════════════════════
 * HOME PAGE SECTIONS
 * (A) Services Grid
 * (B) Animated Process Pipeline
 *
 * All copy is defined in the data arrays below for easy editing.
 * ══════════════════════════════════════════════════════════════════
 */

/* ─── DATA ARRAY: SERVICES (Part A) ─── */
const SERVICES_DATA = [
  {
    id: "01",
    title: "Web Apps",
    icon: "LayoutDashboard",
    description: "Web systems built around how your team actually works.",
    bullets: [
      "Dashboards and admin panels",
      "Booking, inventory, and record-keeping systems",
      "API design and third-party integrations"
    ],
    stack: ["JavaScript", "React", "Laravel", "MySQL"]
  },
  {
    id: "02",
    title: "Mobile Apps",
    icon: "Smartphone",
    description: "Mobile-first apps for people who work on the move.",
    bullets: [
      "Android and cross-platform builds",
      "Sign-in, profiles, and push notifications",
      "Offline mode with cloud sync"
    ],
    stack: ["Flutter", "Dart", "Firebase"]
  },
  {
    id: "03",
    title: "Network Setup",
    icon: "Network",
    description: "Planning, configuring, and fixing the connections that keep an office online.",
    bullets: [
      "LAN/WAN layout and device setup",
      "Routing, switching, and VLANs",
      "Diagnosing slow or broken connections"
    ],
    stack: ["Cisco", "Linux", "Wireshark"]
  },
  {
    id: "04",
    title: "Online Stores",
    icon: "ShoppingBag",
    description: "Stores that make it simple for customers to buy and for owners to manage.",
    bullets: [
      "Catalogs, search, and carts",
      "Payment checkout and order tracking",
      "Stock and store management"
    ],
    stack: ["WordPress", "PHP", "JavaScript", "MySQL"]
  },
  {
    id: "05",
    title: "SaaS Products",
    icon: "Layers",
    description: "Cloud software shaped around one clear idea and the people who use it.",
    bullets: [
      "MVPs and user dashboards",
      "Roles and multi-tenant structure",
      "Subscriptions and API connections"
    ],
    stack: ["React", "Laravel", "MySQL", "Postman"]
  },
  {
    id: "06",
    title: "Capstone & Research Systems",
    icon: "FlaskConical",
    description: "Turning a research problem into a working prototype.",
    bullets: [
      "Web and mobile research systems",
      "Database design and documentation",
      "Testing, refinement, and defense-ready demos"
    ],
    stack: ["Laravel", "Python", "MySQL", "Git"]
  },
  {
    id: "07",
    title: "UI/UX Design",
    icon: "PenTool",
    description: "Interfaces that make complicated tasks feel clear and easy.",
    bullets: [
      "User flows, wireframes, and layouts",
      "Clickable prototypes and usability checks",
      "Responsive layouts and design systems"
    ],
    stack: ["Figma", "HTML5", "CSS3"]
  },
  {
    id: "08",
    title: "Data & Dashboards",
    icon: "BarChart3",
    description: "Turning raw data into patterns that support better decisions.",
    bullets: [
      "Cleaning, preparing, and validating data",
      "Exploratory analysis and SQL reports",
      "Dashboards with clear takeaways"
    ],
    stack: ["Excel", "SQL", "Python"]
  }
];

/* ─── DATA ARRAY: PROCESS PIPELINE (Part B) ─── */
const PIPELINE_DATA = [
  {
    step: "01",
    num: 1,
    title: "Find the problem",
    icon: "Search",
    description: "Spot a real need that technology can help solve.",
    output: "A clear problem statement."
  },
  {
    step: "02",
    num: 2,
    title: "Know the users",
    icon: "Users",
    description: "Learn who will use it and what they need to get done.",
    output: "A list of user needs and requirements."
  },
  {
    step: "03",
    num: 3,
    title: "Plan the features",
    icon: "Target",
    description: "Decide what to build first and how success will be measured.",
    output: "A prioritized feature list with success criteria."
  },
  {
    step: "04",
    num: 4,
    title: "Pick the tech",
    icon: "Boxes",
    description: "Choose languages, frameworks, database, and hosting that fit the budget, skills, and platform.",
    output: "A tech stack that fits the project."
  },
  {
    step: "05",
    num: 5,
    title: "Design the system",
    icon: "PencilRuler",
    description: "Map out screens, data structure, user roles, and how the parts connect.",
    output: "Wireframes, database design, and a system diagram."
  },
  {
    step: "06",
    num: 6,
    title: "Build",
    icon: "Code2",
    description: "Develop the frontend, backend, database, and integrations.",
    output: "A working version of the core features."
  },
  {
    step: "07",
    num: 7,
    title: "Test and refine",
    icon: "ShieldCheck",
    description: "Check features, fix bugs, and improve usability and security.",
    output: "A stable, tested build."
  },
  {
    step: "08",
    num: 8,
    title: "Launch",
    icon: "Rocket",
    description: "Publish the project so people can start using it.",
    output: "A live system."
  },
  {
    step: "09",
    num: 9,
    title: "Maintain and improve",
    icon: "RefreshCw",
    description: "Monitor the system, collect feedback, and ship updates.",
    output: "Ongoing improvements."
  }
];

/* ─── OUTLINE SVG ICONS (Lucide style, 1.5px stroke width) ─── */
const OUTLINE_ICONS = {
  LayoutDashboard: `<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`,
  Smartphone: `<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>`,
  Network: `<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>`,
  ShoppingBag: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
  Layers: `<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2 12.5"/><path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2 17.5"/>`,
  FlaskConical: `<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>`,
  PenTool: `<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>`,
  BarChart3: `<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>`,
  Search: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
  Users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  Target: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
  Boxes: `<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>`,
  PencilRuler: `<path d="m15 5 4 4"/><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"/><path d="m8 6 2-2"/><path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z"/><path d="m18 16 4 4"/><path d="m17 21 4-4"/>`,
  Code2: `<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>`,
  ShieldCheck: `<path d="M20 13c0 5-8 9-8 9s-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-4"/>`,
  Rocket: `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>`,
  RefreshCw: `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`,
  Workflow: `<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>`,
  ArrowRight: `<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`,
  ArrowLeft: `<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>`,
  ArrowDown: `<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>`,
  Pause: `<rect width="4" height="16" x="6" y="4" rx="1"/><rect width="4" height="16" x="14" y="4" rx="1"/>`,
  Play: `<polygon points="6 3 20 12 6 21 6 3"/>`
};

function renderSvgIcon(name, size = 18) {
  const content = OUTLINE_ICONS[name] || "";
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
}

/* ─── BRAND ICONS FOR STACK CHIPS ─── */
const BRAND_MAP = {
  javascript: "assets/workspace/javascript.svg",
  react: "assets/workspace/react.svg",
  html5: "assets/workspace/html5.svg",
  css3: "assets/workspace/css3.svg",
  figma: "assets/workspace/figma.svg",
  git: "assets/workspace/git.svg"
};

/**
 * ══════════════════════════════════════════════════════════════════
 * BUILDER FUNCTIONS
 * ══════════════════════════════════════════════════════════════════
 */

function buildServicesSection() {
  const section = document.createElement("section");
  section.className = "home-section home-section--services";
  section.id = "servicesSection";
  section.setAttribute("aria-labelledby", "servicesTitle");

  // Header
  const header = document.createElement("header");
  header.className = "hs-header hs-reveal";
  header.innerHTML = `
    <div class="hs-header__copy">
      <p class="hs-eyebrow">WHAT I CAN DO</p>
      <h2 id="servicesTitle" class="hs-title">What I Can Build for You.</h2>
      <p class="hs-subtitle">From first idea to finished product. Browse the areas I work in and the tools I use.</p>
    </div>
    <button type="button" class="hs-cta" id="startProjectLink">Start a project &rarr;</button>
  `;

  header.querySelector("#startProjectLink").addEventListener("click", () => {
    if (window.portfolioNav && typeof window.portfolioNav.go === "function") {
      window.portfolioNav.go("contact");
    } else {
      location.hash = "#contact";
    }
  });

  // Services Grid
  const grid = document.createElement("div");
  grid.className = "services-grid";

  SERVICES_DATA.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "svc-card hs-reveal";
    card.style.setProperty("--row-delay", `${(index % 2) * 60}ms`);

    // Chips markup
    const chipsHtml = item.stack.map(tech => {
      const key = tech.toLowerCase().replace(/[^a-z0-9]/g, "");
      const brandSrc = BRAND_MAP[key];
      if (brandSrc) {
        return `<span class="svc-chip"><img src="${brandSrc}" alt="" width="14" height="14" loading="lazy" decoding="async" /><span>${tech}</span></span>`;
      }
      return `<span class="svc-chip"><span>${tech}</span></span>`;
    }).join("");

    // Bullets markup
    const bulletsHtml = item.bullets.map(b => `<li>${b}</li>`).join("");

    card.innerHTML = `
      <div class="svc-card__top">
        <div class="svc-card__icon" aria-hidden="true">${renderSvgIcon(item.icon, 20)}</div>
        <span class="svc-card__idx">${item.id}</span>
      </div>
      <h3 class="svc-card__title">${item.title}</h3>
      <p class="svc-card__desc">${item.description}</p>
      <ul class="svc-card__bullets">${bulletsHtml}</ul>
      <div class="svc-card__divider" aria-hidden="true"></div>
      <p class="svc-card__stack-label">STACK</p>
      <div class="svc-card__chips">${chipsHtml}</div>
    `;

    grid.appendChild(card);
  });

  section.appendChild(header);
  section.appendChild(grid);
  return section;
}

function buildPipelineSection() {
  const section = document.createElement("section");
  section.className = "home-section home-section--pipeline";
  section.id = "pipelineSection";
  section.setAttribute("aria-labelledby", "pipelineTitle");

  // Header
  const header = document.createElement("header");
  header.className = "hs-header hs-reveal";
  header.innerHTML = `
    <div class="hs-header__copy">
      <p class="hs-eyebrow">HOW I WORK / 01–09</p>
      <h2 id="pipelineTitle" class="hs-title">From idea to a working system.</h2>
      <p class="hs-subtitle">A step-by-step workflow where feedback shapes every new round.</p>
    </div>
    <div class="pipeline-header-controls">
      <span class="pipeline-status" id="pipelineStatusDot">
        <span class="pipeline-dot" aria-hidden="true"></span>
        <span id="pipelineStatusText">Auto-play</span>
      </span>
      <button type="button" class="pipeline-toggle" id="pipelineToggleBtn" aria-label="Pause workflow auto-play">
        <span id="pipelineToggleIcon" aria-hidden="true">${renderSvgIcon("Pause", 14)}</span>
        <span id="pipelineToggleLabel">Pause</span>
      </button>
    </div>
  `;

  // Pipeline Panel
  const panel = document.createElement("div");
  panel.className = "pipeline-shell hs-reveal";

  // Panel Top Bar
  const panelTop = document.createElement("div");
  panelTop.className = "pipeline-top";
  panelTop.innerHTML = `
    <div class="pipeline-badge">
      ${renderSvgIcon("Workflow", 15)}
      <span>WORKFLOW</span>
    </div>
    <span class="pipeline-walkthrough">Click any step</span>
  `;

  // Grid wrapper containing the cards and snake arrow connectors
  const gridWrapper = document.createElement("div");
  gridWrapper.className = "pipeline-grid-wrapper";

  const grid = document.createElement("div");
  grid.className = "pipeline-grid";
  grid.setAttribute("role", "tablist");
  grid.setAttribute("aria-label", "Process pipeline steps");

  PIPELINE_DATA.forEach((step, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "step-card";
    btn.id = `step-card-${step.num}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    btn.setAttribute("aria-current", idx === 0 ? "step" : "false");
    btn.setAttribute("aria-controls", "pipelineDetailPanel");
    btn.dataset.stepIndex = idx;
    btn.dataset.stepNum = step.num;

    // Progress bar element
    const progress = document.createElement("div");
    progress.className = "step-card__progress";
    progress.setAttribute("aria-hidden", "true");

    btn.innerHTML = `
      <div class="step-card__head">
        <span class="step-card__idx">${step.step}</span>
        <div class="step-card__icon" aria-hidden="true">${renderSvgIcon(step.icon, 18)}</div>
      </div>
      <h3 class="step-card__title">${step.title}</h3>
      <p class="step-card__desc">${step.description}</p>
    `;
    btn.appendChild(progress);

    grid.appendChild(btn);
  });

  // Connector arrows layer (desktop snake layout: row 1 L→R, row 2 R→L, row 3 L→R)
  const connectors = document.createElement("div");
  connectors.className = "pipeline-connectors";
  connectors.setAttribute("aria-hidden", "true");
  connectors.innerHTML = `
    <!-- Row 1: 01 -> 02 -> 03 -->
    <div class="conn-arrow conn-r1-12">${renderSvgIcon("ArrowRight", 14)}</div>
    <div class="conn-arrow conn-r1-23">${renderSvgIcon("ArrowRight", 14)}</div>
    <!-- Row 1 to Row 2: 03 down to 04 -->
    <div class="conn-arrow conn-corner-34">${renderSvgIcon("ArrowDown", 14)}</div>
    <!-- Row 2: 04 -> 05 -> 06 (Right to Left) -->
    <div class="conn-arrow conn-r2-45">${renderSvgIcon("ArrowLeft", 14)}</div>
    <div class="conn-arrow conn-r2-56">${renderSvgIcon("ArrowLeft", 14)}</div>
    <!-- Row 2 to Row 3: 06 down to 07 -->
    <div class="conn-arrow conn-corner-67">${renderSvgIcon("ArrowDown", 14)}</div>
    <!-- Row 3: 07 -> 08 -> 09 -->
    <div class="conn-arrow conn-r3-78">${renderSvgIcon("ArrowRight", 14)}</div>
    <div class="conn-arrow conn-r3-89">${renderSvgIcon("ArrowRight", 14)}</div>
  `;

  // Mobile downward connectors are inserted between stacked cards via CSS

  gridWrapper.appendChild(grid);
  gridWrapper.appendChild(connectors);

  // Return Feedback Line (09 -> 03)
  const feedback = document.createElement("div");
  feedback.className = "pipeline-feedback";
  feedback.innerHTML = `
    <span class="pipeline-feedback__line" aria-hidden="true"></span>
    <span class="pipeline-feedback__text">${renderSvgIcon("RefreshCw", 13)} 09 &rarr; 03 Feedback loops back to planning</span>
  `;

  // Detail Panel (2 columns with cross-fade)
  const detail = document.createElement("div");
  detail.className = "pipeline-detail";
  detail.id = "pipelineDetailPanel";
  detail.setAttribute("role", "tabpanel");
  detail.setAttribute("aria-live", "polite");
  detail.innerHTML = `
    <div class="pipeline-detail__left" id="pipelineDetailLeft">
      <p class="pipeline-detail__label" id="detailStepLabel">STEP 01 OF 09</p>
      <h3 class="pipeline-detail__title" id="detailStepTitle">${PIPELINE_DATA[0].title}</h3>
      <p class="pipeline-detail__desc" id="detailStepDesc">${PIPELINE_DATA[0].description}</p>
    </div>
    <div class="pipeline-detail__right" id="pipelineDetailRight">
      <p class="pipeline-detail__label">WHAT YOU GET</p>
      <p class="pipeline-detail__output" id="detailStepOutput">${PIPELINE_DATA[0].output}</p>
    </div>
  `;

  // Footer Hint
  const footerHint = document.createElement("p");
  footerHint.className = "pipeline-hint";
  footerHint.textContent = "Follow the live workflow or click any step to jump ahead. Pause to take a closer look.";

  panel.appendChild(panelTop);
  panel.appendChild(gridWrapper);
  panel.appendChild(feedback);
  panel.appendChild(detail);
  panel.appendChild(footerHint);

  section.appendChild(header);
  section.appendChild(panel);
  return section;
}

/**
 * ══════════════════════════════════════════════════════════════════
 * PIPELINE AUTO-PLAY & INTERACTIVITY ENGINE
 * ══════════════════════════════════════════════════════════════════
 */
function initPipelineEngine(container) {
  const STEP_DURATION = 3500; // 3.5s per step
  // Loop sequence: 0, 1, 2, 3, 4, 5, 6, 7, 8 then loops back to 2 (step 03)!
  const LOOP_SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  let loopPointer = 0;
  let activeIndex = 0;
  let isPaused = false;
  let isUserPaused = false;
  let inView = false;
  let stepTimer = null;
  let progressStartTime = 0;
  let progressRaf = null;

  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (mobileQuery.matches) isPaused = true;
  if (reducedMotion) {
    isPaused = true;
    isUserPaused = true;
  }

  const cards = container.querySelectorAll(".step-card");
  const toggleBtn = container.querySelector("#pipelineToggleBtn");
  const toggleLabel = container.querySelector("#pipelineToggleLabel");
  const toggleIcon = container.querySelector("#pipelineToggleIcon");
  const statusDot = container.querySelector("#pipelineStatusDot");
  const statusText = container.querySelector("#pipelineStatusText");

  const detailLeft = container.querySelector("#pipelineDetailLeft");
  const detailRight = container.querySelector("#pipelineDetailRight");
  const detailLabel = container.querySelector("#detailStepLabel");
  const detailTitle = container.querySelector("#detailStepTitle");
  const detailDesc = container.querySelector("#detailStepDesc");
  const detailOutput = container.querySelector("#detailStepOutput");

  function updateControlsUI() {
    if (isUserPaused || isPaused) {
      toggleLabel.textContent = "Play";
      toggleBtn.setAttribute("aria-label", "Play workflow auto-play");
      toggleIcon.innerHTML = renderSvgIcon("Play", 14);
      statusDot.classList.add("is-paused");
      statusText.textContent = "Paused";
    } else {
      toggleLabel.textContent = "Pause";
      toggleBtn.setAttribute("aria-label", "Pause workflow auto-play");
      toggleIcon.innerHTML = renderSvgIcon("Pause", 14);
      statusDot.classList.remove("is-paused");
      statusText.textContent = "Auto-play";
    }
  }

  function crossFadeDetail(stepData) {
    if (reducedMotion) {
      detailLabel.textContent = `STEP ${stepData.step} OF 09`;
      detailTitle.textContent = stepData.title;
      detailDesc.textContent = stepData.description;
      detailOutput.textContent = stepData.output;
      return;
    }

    // Smooth cross-fade
    detailLeft.style.opacity = "0";
    detailRight.style.opacity = "0";

    setTimeout(() => {
      detailLabel.textContent = `STEP ${stepData.step} OF 09`;
      detailTitle.textContent = stepData.title;
      detailDesc.textContent = stepData.description;
      detailOutput.textContent = stepData.output;

      detailLeft.style.opacity = "1";
      detailRight.style.opacity = "1";
    }, 150);
  }

  function clearAllProgressBars() {
    cancelAnimationFrame(progressRaf);
    cards.forEach(card => {
      const bar = card.querySelector(".step-card__progress");
      if (!bar) return;
      if (mobileQuery.matches) {
        bar.style.transition = "none";
        bar.style.transform = "scaleX(0)";
      } else {
        bar.style.width = "0%";
      }
    });
  }

  function animateProgressBar(card) {
    if (reducedMotion || isPaused) return;
    const bar = card.querySelector(".step-card__progress");
    if (!bar) return;

    if (mobileQuery.matches) {
      progressRaf = requestAnimationFrame(() => {
        progressRaf = null;
        if (isPaused || !mobileQuery.matches) return;
        bar.style.transition = `transform ${STEP_DURATION}ms linear`;
        bar.style.transform = "scaleX(1)";
      });
      return;
    }

    progressStartTime = performance.now();

    function frame(now) {
      const elapsed = now - progressStartTime;
      const pct = Math.min(100, (elapsed / STEP_DURATION) * 100);
      bar.style.width = `${pct}%`;
      if (elapsed < STEP_DURATION && !isPaused) {
        progressRaf = requestAnimationFrame(frame);
      }
    }

    progressRaf = requestAnimationFrame(frame);
  }

  function setActiveStep(index, animateProgress = true) {
    activeIndex = index;
    const stepData = PIPELINE_DATA[index];

    cards.forEach((card, i) => {
      const isCurrent = i === index;
      card.setAttribute("aria-selected", isCurrent ? "true" : "false");
      card.setAttribute("aria-current", isCurrent ? "step" : "false");
      card.classList.toggle("is-active", isCurrent);
      const bar = card.querySelector(".step-card__progress");
      if (bar && !isCurrent) {
        if (mobileQuery.matches) {
          bar.style.transition = "none";
          bar.style.transform = "scaleX(0)";
        } else {
          bar.style.width = "0%";
        }
      }
    });

    crossFadeDetail(stepData);

    if (animateProgress && !isPaused && !reducedMotion) {
      animateProgressBar(cards[index]);
    }
  }

  function advanceNext() {
    loopPointer++;
    if (loopPointer >= LOOP_SEQUENCE.length) {
      // Loop 01 -> 09 -> 03: after step 9 (index 8), jump to step 3 (index 2)!
      loopPointer = 2;
    }
    setActiveStep(LOOP_SEQUENCE[loopPointer], true);
    scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(stepTimer);
    if (isPaused || !inView || reducedMotion) return;
    stepTimer = setTimeout(advanceNext, STEP_DURATION);
  }

  function start() {
    if (reducedMotion || isUserPaused) return;
    isPaused = false;
    updateControlsUI();
    clearAllProgressBars();
    setActiveStep(activeIndex, true);
    scheduleNext();
  }

  function pause(userInitiated = false) {
    isPaused = true;
    if (userInitiated) isUserPaused = true;
    clearTimeout(stepTimer);
    cancelAnimationFrame(progressRaf);
    clearAllProgressBars();
    updateControlsUI();
  }

  // Toggle button handler
  toggleBtn.addEventListener("click", () => {
    if (isUserPaused || isPaused) {
      isUserPaused = false;
      start();
    } else {
      pause(true);
    }
  });
  mobileQuery.addEventListener("change", event => {
    if (event.matches) pause(false);
    else if (inView && !isUserPaused && !reducedMotion) start();
  });

  // Step card clicks
  cards.forEach((card, idx) => {
    card.addEventListener("click", () => {
      // Find where in loop sequence this step exists
      const foundSeq = LOOP_SEQUENCE.indexOf(idx);
      if (foundSeq !== -1) loopPointer = foundSeq;
      pause(true);
      setActiveStep(idx, false);
      card.focus();
    });

    // Keyboard navigation (Arrow keys)
    card.addEventListener("keydown", (e) => {
      let targetIdx = -1;
      if (e.key === "ArrowRight") targetIdx = (idx + 1) % cards.length;
      else if (e.key === "ArrowLeft") targetIdx = (idx - 1 + cards.length) % cards.length;
      else if (e.key === "ArrowDown") targetIdx = Math.min(cards.length - 1, idx + 3);
      else if (e.key === "ArrowUp") targetIdx = Math.max(0, idx - 3);

      if (targetIdx !== -1 && targetIdx !== idx) {
        e.preventDefault();
        cards[targetIdx].click();
      }
    });
  });

  // IntersectionObserver to auto-play only when in viewport
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) {
      if (!isUserPaused && !reducedMotion && (!mobileQuery.matches || !isPaused)) start();
    } else {
      clearTimeout(stepTimer);
      cancelAnimationFrame(progressRaf);
      clearAllProgressBars();
    }
  }, { threshold: 0.25 });

  observer.observe(container);

  // Set initial step
  setActiveStep(0, false);
  updateControlsUI();
}

/**
 * ══════════════════════════════════════════════════════════════════
 * SCROLL REVEAL OBSERVER
 * ══════════════════════════════════════════════════════════════════
 */
function initScrollReveal(scope) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = scope.querySelectorAll(".hs-reveal");

  if (reduced) {
    elements.forEach(el => el.classList.add("is-shown"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-shown");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  elements.forEach(el => observer.observe(el));
}

/**
 * ══════════════════════════════════════════════════════════════════
 * MOUNT & INITIALIZATION
 * ══════════════════════════════════════════════════════════════════
 */
function initHomeSections() {
  const container = document.getElementById("homeSections");
  if (!container) return;

  container.innerHTML = "";
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  if (isMobile) container.dataset.pending = "";

  const scheduleIdle = callback => {
    if ("requestIdleCallback" in window) requestIdleCallback(callback,{timeout:1500});
    else setTimeout(callback,0);
  };
  let pipelinePlaceholder = null;
  const mountPipeline = () => {
    const pipelineSec = buildPipelineSection();
    if (pipelinePlaceholder) pipelinePlaceholder.replaceWith(pipelineSec);
    else container.appendChild(pipelineSec);
    initPipelineEngine(pipelineSec);
    initScrollReveal(pipelineSec);
    delete container.dataset.pending;
  };

  const mountServices = () => {
    const servicesSec = buildServicesSection();
    container.appendChild(servicesSec);
    initScrollReveal(servicesSec);
    if (isMobile) {
      pipelinePlaceholder = document.createElement("section");
      pipelinePlaceholder.className = "home-section home-section--pipeline";
      pipelinePlaceholder.dataset.pipelinePlaceholder = "";
      pipelinePlaceholder.setAttribute("aria-hidden","true");
      pipelinePlaceholder.style.minHeight = "1800px";
      container.appendChild(pipelinePlaceholder);
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        scheduleIdle(mountPipeline);
      },{rootMargin:"300px 0px"});
      observer.observe(pipelinePlaceholder);
    } else {
      mountPipeline();
    }
  };

  if (isMobile) {
    scheduleIdle(mountServices);
  } else {
    mountServices();
  }
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeSections);
} else {
  initHomeSections();
}
