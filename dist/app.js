"use strict";
const {defaults, copy, validate, safeURL} = PortfolioContent;
const byId = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const node = (tag, className = "", text = "") => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};
const button = (className, label, action) => {
  const element = node("button", className, label);
  element.type = "button";
  element.addEventListener("click", action);
  return element;
};
const list = (value, delimiter = ",") => value.split(delimiter).map(s => s.trim()).filter(Boolean);
const key = "orbitfolio.content.v1";
let saved = copy(defaults), current = saved, filter = "";
let serverMode = false, canPublish = false, revision = "", adminToken = "";
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
function toast(message, error = false) {
  const target = node("div", "toast" + (error ? " is-error" : ""), message);
  const host = document.querySelector("dialog[open] .studio-status") || byId("toastRegion");
  if (host !== byId("toastRegion")) {
    byId("saveState").textContent = message;
    return;
  }
  host.append(target);
  setTimeout(() => target.remove(), 4500);
}
function external(label, url, className = "") {
  const a = node("a", className, label);
  a.href = safeURL(url);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}
function imageFor(src, alt, fallback) {
  const img = node("img");
  img.loading = "lazy";
  img.src = src;
  img.alt = alt;
  img.onerror = () => { img.onerror = null; img.src = fallback; };
  return img;
}
function tags(value, className = "tag") {
  const wrapper = node("div", className === "tag" ? "tag-list" : "skill-cloud");
  list(value).forEach(item => wrapper.append(node("span", className, item)));
  return wrapper;
}
const serviceSymbols = [
  "M3 5h18v14H3z M3 9h18 M9 9v10",
  "m7 8-4 4 4 4 m10-8 4 4-4 4 m-4-11-2 14",
  "M4 4v16h17 M9 16v-4 m5 4V7 m5 9v-6"
];
function serviceIcon(index) {
  const ring = node("span","service-card__number");
  ring.setAttribute("aria-hidden","true");
  const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  const path = document.createElementNS(svg.namespaceURI,"path");
  svg.setAttribute("viewBox","0 0 24 24");
  path.setAttribute("d",serviceSymbols[index % serviceSymbols.length]);
  svg.append(path);
  ring.append(svg);
  return ring;
}
function fill(id, items) {
  byId(id).replaceChildren(...items);
}
function usesThemePalette(appearance) {
  return appearance.accent === defaults.appearance.accent && appearance.secondary === defaults.appearance.secondary;
}
function skillCard(skill, index) {
  const categories = {
    "ai tools": "ai", "ai": "ai",
    "frontend": "browser", "front-end": "browser",
    "backend": "server", "back-end": "server",
    "apis": "api", "api's": "api", "api": "api",
    "database": "database", "databases": "database",
    "professional and core": "core", "professional & core": "core", "core": "core"
  };
  const brands = {
    "gemini": "gemini", "googlegemini": "gemini",
    "codex": "codex", "openai": "codex",
    "claude": "claude", "anthropic": "claude",
    "pytorch": "pytorch", "tensorflow": "tensorflow", "opencv": "opencv",
    "react": "react", "react.js": "react", "reactjs": "react",
    "javascript": "javascript", "js": "javascript",
    "typescript": "typescript", "ts": "typescript",
    "html5 / css3": "html5", "html5/css3": "html5", "html5": "html5", "html": "html5", "css3": "css3", "css": "css3",
    "tailwind css": "tailwindcss", "tailwindcss": "tailwindcss", "tailwind": "tailwindcss",
    "flutter": "flutter", "vite": "vite",
    "alpine.js": "alpinejs", "alpinejs": "alpinejs", "alpinedotjs": "alpinejs",
    "sass": "sass", "scss": "sass", "bootstrap": "bootstrap",
    "responsive ui/ux": "responsiveuiux", "responsive ui": "responsiveuiux", "responsive design": "responsiveuiux",
    "node.js": "nodejs", "nodejs": "nodejs", "nodedotjs": "nodejs", "node": "nodejs",
    "laravel": "laravel", "python": "python", "php": "php", "django": "django", "java": "java", "openjdk": "java",
    "express.js": "express", "expressjs": "express", "express": "express",
    "c": "c", "dart": "dart", "apache": "apache", "wordpress": "wordpress",
    "git & github": "git", "git": "git", "github": "github",
    "oop & mvc": "oopmvc", "oop": "oopmvc", "mvc": "oopmvc",
    "cisco ccna": "cisco", "cisco": "cisco", "raspberry pi": "raspberrypi",
    "restful apis": "restfulapis", "restful api": "restfulapis", "rest apis": "restfulapis", "rest api": "restfulapis",
    "postman": "postman", "fastapi": "fastapi", "graphql": "graphql",
    "swagger / openapi": "swagger", "swagger/openapi": "swagger", "swagger": "swagger", "openapi": "openapi",
    "mysql": "mysql", "mongodb": "mongodb",
    "sql": "sql", "sqlite": "sql", "postgresql": "sql", "postgres": "sql",
    "firebase": "firebase", "relational schemas": "relationalschemas", "data modeling": "relationalschemas",
    "vercel": "vercel", "render": "render",
    "figma": "figma",
    "problem-solving": "problemsolving", "problemsolving": "problemsolving",
    "project management": "projectmanagement",
    "data analysis": "dataanalysis",
    "communication": "communication",
    "adaptability": "adaptability",
    "time management": "timemanagement",
    "digital marketing": "digitalmarketing",
    "tech literacy": "techliteracy"
  };

  const normCat = (skill.title || "").trim().toLowerCase();
  const icon = categories[normCat] || "skills";
  const card = node("article", "skill-card reveal"), header = node("header"), tile = node("span", "category-tile");
  card.style.setProperty("--order", index);
  tile.dataset.category = icon;
  tile.append(workspaceIcon(icon));
  header.append(tile, node("h2", "", skill.title));
  card.append(header);
  if (skill.description) card.append(node("p", "skill-description", skill.description));
  const chips = node("ul", "skill-chips");
  for (const raw of list(skill.items)) {
    let label = raw.trim();
    let explicitIcon = "";
    if (label.includes(":")) {
      const parts = label.split(":");
      label = parts[0].trim();
      explicitIcon = parts[1].trim().toLowerCase();
    }
    const clean = label.toLowerCase();
    const slug = clean.replace(/[^a-z0-9]/g, "");
    const brandFile = explicitIcon || brands[clean] || brands[slug];

    const chip = node("li", "skill-chip"), glyph = node("span", "chip-glyph");
    if (brandFile) {
      const image = node("img");
      image.alt = "";
      image.width = image.height = 16;
      image.loading = "lazy";
      image.src = "assets/workspace/" + brandFile + ".svg";
      glyph.classList.add("brand-" + brandFile);
      glyph.append(image);
    } else {
      glyph.append(workspaceIcon(icon));
    }
    chip.append(glyph, document.createTextNode(label));
    chips.append(chip);
  }
  if (chips.childElementCount > 0) {
    card.append(chips);
  }
  return card;
}
function render(content) {
  current = content;
  const p = content.profile;
  const words = p.name.trim().split(/\s+/);
  const initials = [words[0]?.[0], words.length > 1 ? words.at(-1)[0] : ""].join("").toUpperCase();
  for (const id of ["mobileInitials","signatureInitials"]) byId(id).textContent = initials;
  heroMedia.setProfile(p);
  portfolioNav.setProfile(p, content.contact);
  document.querySelector('meta[name="description"]').content = p.headline;
  const values = {heroEducation:p.eyebrow, heroLocation:p.location, heroFocus:p.roles, heroAvailability:p.availability, aboutTitle:p.aboutTitle, aboutIntro:p.aboutIntro, aboutBio:p.bio, contactIntro:content.contact.intro};
  Object.entries(values).forEach(([id,value]) => byId(id).textContent = value);
  for (const [field, variable] of [["accent","--accent"],["secondary","--accent-2"]]) {
    const color = content.appearance[field];
    if (!usesThemePalette(content.appearance) && /^#[a-f\d]{6}$/i.test(color)) {
      document.documentElement.style.setProperty(variable,color);
      document.documentElement.style.setProperty(variable + "-rgb",color.slice(1).match(/../g).map(x => parseInt(x,16)).join(","));
    } else {
      document.documentElement.style.removeProperty(variable);
      document.documentElement.style.removeProperty(variable + "-rgb");
    }
  }
  fill("servicesGrid",content.services.map((s,index) => {
    const card = node("article","service-card"), body = node("div");
    body.append(node("h3","",s.title),node("p","",s.description));
    card.append(serviceIcon(index),body);
    return card;
  }));
  fill("interestsGrid",content.interests.map(interest=>{
    const card = node("article");
    card.append(node("h4","",interest.title),node("p","",interest.description));
    return card;
  }));
  renderProjects();
  fill("skillsGrid", content.skills.map(skillCard));
  fill("timelineList",content.journey.map(j => {
    const card = node("article","timeline-item"), body = node("div");
    body.append(node("h3","",j.title),node("h4","",j.organization),node("p","",j.description));
    card.append(node("span","timeline-item__date",j.date),body,node("span","timeline-item__type",j.type));
    return card;
  }));
  byId("certificates").hidden = content.certificates.length === 0;
  fill("certificateList",content.certificates.map(c => {
    const original = PortfolioContent.certificateLibrary.find(asset => asset.file === c.document);
    const link = node("a","certificate-card");
    const url = original?.file || safeURL(c.document);
    if (url) link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label","Open "+c.title+" in a new tab");
    if (original) {
      const preview = node("img","certificate-preview");
      preview.src = original.preview;
      preview.alt = "";
      preview.loading = "lazy";
      link.append(preview);
    }
    const caption = node("div","certificate-caption");
    caption.append(node("p","certificate-date",c.date),node("h4","",c.title),node("p","certificate-issuer",c.issuer),
      node("span","certificate-action","View certificate"+(original ? " · "+original.format : "")+" ↗"));
    link.append(caption);
    return link;
  }));
  const contact = content.contact;
  byId("contactEmail").textContent = contact.email || "Contact address coming soon";
  byId("contactEmail").removeAttribute("href");
  if (contact.email) byId("contactEmail").href = "mailto:" + encodeURIComponent(contact.email);
  byId("copyEmail").hidden = !contact.email;
  byId("contactForm").querySelector("button").disabled = !contact.email;
  byId("contactForm").querySelector(".form-note").textContent = contact.email ? "Your email app opens with a draft for you to review and send." : "Email inquiries open once a contact address is added.";
  fill("socialList",[["GitHub",contact.github],["LinkedIn",contact.linkedin],["Website",contact.website]].filter(([,url])=>safeURL(url)).map(([label,url])=>external(label+" ↗",url)));
}
function getBadgeIcon(badge = "") {
  const b = badge.toLowerCase();
  if (b.includes("live") || b.includes("tally") || b.includes("award")) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
  }
  if (b.includes("personal") || b.includes("solo")) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }
  // Capstone / Academic / Study
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`;
}

function getCardIcon(p) {
  const t = (p.title + " " + p.category).toLowerCase();
  if (t.includes("tally") || t.includes("intramural") || t.includes("sport")) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
  }
  if (t.includes("acadex") || t.includes("study") || t.includes("academic") || t.includes("student")) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`;
  }
  if (t.includes("bus") || t.includes("transport") || t.includes("tracking") || t.includes("fleet")) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="14" rx="3"/><path d="M7 17v3"/><path d="M17 17v3"/><path d="M3 10h18"/><circle cx="7" cy="14" r="1.5"/><circle cx="17" cy="14" r="1.5"/></svg>`;
  }
  if (t.includes("boardwise") || t.includes("figma") || t.includes("design") || t.includes("ui/ux")) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
  }
  if (t.includes("stay") || t.includes("hotel") || t.includes("tourism") || t.includes("rental")) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-8a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v8"/><path d="M3 10l9-7 9 7"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>`;
  }
  return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
}

function renderProjects() {
  const categories = [...new Set(current.projects.map(p => p.category).filter(Boolean))];
  if (!categories.includes(filter)) filter = "";
  fill("projectFilters",["",...categories].map(category => {
    const active = filter === category;
    const b = button("filter-button"+(active ? " is-active" : ""),category || "All work",() => { filter = category; renderProjects(); });
    b.setAttribute("aria-pressed",active);
    return b;
  }));
  const projects = current.projects.filter(p => !filter || filter === p.category);
  byId("projectCount").textContent = projects.length + (projects.length === 1 ? " project" : " projects");
  const gallery = byId("projectsList");

  fill("projectsList",projects.length ? projects.map((p,index) => {
    const article = node("article","project-card reveal"), media = node("div","project-card__media"), body = node("div","project-card__body");
    article.style.setProperty("--card-delay",(index % 2)*75+"ms");

    // Badge overlay on image (top-left)
    if (p.badge) {
      const badge = node("span","project-card__badge");
      badge.innerHTML = `${getBadgeIcon(p.badge)}<span>${p.badge}</span>`;
      media.append(badge);
    }

    // Enlarge button on image (top-right)
    const enlarge = button("project-card__enlarge","Enlarge",()=>openImageViewer(p));
    enlarge.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg><span>Enlarge</span>`;
    media.append(enlarge);

    media.append(imageFor(p.image,p.alt,defaults.projects[0].image));

    // Icon + Role Row
    const iconRow = node("div","project-card__icon-row");
    const iconBox = node("span","project-card__icon-box");
    iconBox.innerHTML = getCardIcon(p);
    iconRow.append(iconBox);

    if (p.role) {
      const rolePill = node("span","project-card__role",p.role);
      iconRow.append(rolePill);
    }

    const intro = node("div","project-card__intro");
    intro.append(node("h3","",p.title),node("p","project-card__summary",p.summary));

    // Arrow bullets
    const bullets = node("ul","project-card__bullets");
    list(p.highlights,"\n").forEach(line => {
      const li = node("li");
      li.innerHTML = `<span class="bullet-arrow" aria-hidden="true">→</span><span>${line.replace(/^→\s*/,"")}</span>`;
      bullets.append(li);
    });

    // Tech chips
    const chips = tags(p.tags);

    // Architecture Details button
    const detailsBtn = button("project-card__details-btn","View Architecture Details →",()=>openProject(p));

    body.append(iconRow, intro, bullets, chips, detailsBtn);
    article.append(media,body);
    return article;
  }) : [node("p","empty-state","New projects will appear here.")]);
  gallery.scrollLeft = 0;

  updateGalleryControls();
}

function openImageViewer(p) {
  const imgs = (p.images || p.image).split(",").map(s => s.trim()).filter(Boolean);
  const hero = node("div","project-detail__hero project-detail__carousel");
  if (imgs.length > 1) {
    let currentSlide = 0;
    const track = node("div","carousel-track");
    imgs.forEach(src => {
      const slide = node("div","carousel-slide");
      slide.append(imageFor(src, p.alt, defaults.projects[0].image));
      track.append(slide);
    });
    hero.append(track);
    const prev = button("carousel-arrow carousel-arrow--prev","‹",() => { currentSlide = (currentSlide - 1 + imgs.length) % imgs.length; track.style.transform = `translateX(-${currentSlide * 100}%)`; });
    const next = button("carousel-arrow carousel-arrow--next","›",() => { currentSlide = (currentSlide + 1) % imgs.length; track.style.transform = `translateX(-${currentSlide * 100}%)`; });
    hero.append(prev, next);
  } else {
    hero.append(imageFor(imgs[0] || p.image, p.alt, defaults.projects[0].image));
  }
  fill("projectDialogContent",[hero]);
  byId("projectDialog").showModal();
}

function openProject(p) {
  const imgs = (p.images || p.image).split(",").map(s => s.trim()).filter(Boolean);

  // Role pill + title + tech chips header
  const headerBlock = node("div","project-detail__header");
  if (p.role) {
    const rolePill = node("span","project-detail__role",p.role);
    headerBlock.append(rolePill);
  }
  const h = node("h2","",p.title);
  h.id = "projectDialogTitle";
  headerBlock.append(h);
  headerBlock.append(tags(p.tags));

  // Carousel
  const hero = node("div","project-detail__hero project-detail__carousel");
  if (imgs.length > 1) {
    let currentSlide = 0;
    const track = node("div","carousel-track");
    imgs.forEach(src => {
      const slide = node("div","carousel-slide");
      slide.append(imageFor(src, p.alt, defaults.projects[0].image));
      track.append(slide);
    });
    hero.append(track);
    const prev = button("carousel-arrow carousel-arrow--prev","‹",() => { currentSlide = (currentSlide - 1 + imgs.length) % imgs.length; track.style.transform = `translateX(-${currentSlide * 100}%)`; });
    const next = button("carousel-arrow carousel-arrow--next","›",() => { currentSlide = (currentSlide + 1) % imgs.length; track.style.transform = `translateX(-${currentSlide * 100}%)`; });
    hero.append(prev, next);
  } else {
    hero.append(imageFor(imgs[0] || p.image, p.alt, defaults.projects[0].image));
  }

  // Body: Architectural Overview
  const body = node("div","project-detail__body");
  const overviewSection = node("div","project-detail__section");
  overviewSection.append(node("h3","project-detail__section-title","ARCHITECTURAL OVERVIEW"));
  overviewSection.append(node("p","project-detail__lead",p.overview || p.detail || p.summary));
  body.append(overviewSection);

  // Key Engineering Contributions
  const contribData = p.contributions || p.highlights || "";
  if (contribData) {
    const contribSection = node("div","project-detail__section");
    contribSection.append(node("h3","project-detail__section-title","KEY ENGINEERING CONTRIBUTIONS"));
    const ul = node("ul","project-detail__contributions");
    list(contribData,"\n").forEach(line => {
      const li = node("li");
      li.innerHTML = `<span class="bullet-arrow" aria-hidden="true">→</span><span>${line.replace(/^→\s*/,"")}</span>`;
      ul.append(li);
    });
    contribSection.append(ul);
    body.append(contribSection);
  }

  if (safeURL(p.url)) body.append(external("Visit project ↗",p.url,"button button--primary project-detail__actions"));
  fill("projectDialogContent",[headerBlock,hero,body]);
  byId("projectDialog").showModal();
}
function updateGalleryControls() {
  const gallery = byId("projectsList");
  const remaining = gallery.scrollWidth - gallery.clientWidth;
  document.querySelector(".gallery-controls").hidden = remaining <= 2;
  byId("previousProject").disabled = gallery.scrollLeft <= 2;
  byId("nextProject").disabled = gallery.scrollLeft >= remaining - 2;
}
function stepGallery(direction) {
  const gallery = byId("projectsList"), card = gallery.querySelector(".project-card");
  if (!card) return;
  gallery.scrollBy({left:direction*(card.offsetWidth+parseFloat(getComputedStyle(gallery).columnGap)),behavior:reduced.matches ? "instant" : "smooth"});
}
byId("previousProject").onclick = ()=>stepGallery(-1);
byId("nextProject").onclick = ()=>stepGallery(1);
byId("projectsList").addEventListener("scroll",updateGalleryControls,{passive:true});
new ResizeObserver(updateGalleryControls).observe(byId("projectsList"));
function openProject(p) {
  const imgs = (p.images || p.image).split(",").map(s => s.trim()).filter(Boolean);

  // Role pill + title + tech chips header
  const headerBlock = node("div","project-detail__header");
  if (p.role) {
    const rolePill = node("span","project-detail__role",p.role);
    headerBlock.append(rolePill);
  }
  const h = node("h2","",p.title);
  h.id = "projectDialogTitle";
  headerBlock.append(h);
  headerBlock.append(tags(p.tags));

  // Carousel
  const hero = node("div","project-detail__hero project-detail__carousel");
  if (imgs.length > 1) {
    let currentSlide = 0;
    const track = node("div","carousel-track");
    imgs.forEach(src => {
      const slide = node("div","carousel-slide");
      slide.append(imageFor(src, p.alt, defaults.projects[0].image));
      track.append(slide);
    });
    hero.append(track);
    const prev = button("carousel-arrow carousel-arrow--prev","‹",() => { currentSlide = (currentSlide - 1 + imgs.length) % imgs.length; track.style.transform = `translateX(-${currentSlide * 100}%)`; });
    const next = button("carousel-arrow carousel-arrow--next","›",() => { currentSlide = (currentSlide + 1) % imgs.length; track.style.transform = `translateX(-${currentSlide * 100}%)`; });
    hero.append(prev, next);
  } else {
    hero.append(imageFor(imgs[0] || p.image, p.alt, defaults.projects[0].image));
  }

  // Body: Architectural Overview
  const body = node("div","project-detail__body");
  const overviewSection = node("div","project-detail__section");
  overviewSection.append(node("h3","project-detail__section-title","ARCHITECTURAL OVERVIEW"));
  overviewSection.append(node("p","project-detail__lead",p.overview || p.detail || p.summary));
  body.append(overviewSection);

  // Key Engineering Contributions
  const contribData = p.contributions || p.highlights || "";
  if (contribData) {
    const contribSection = node("div","project-detail__section");
    contribSection.append(node("h3","project-detail__section-title","KEY ENGINEERING CONTRIBUTIONS"));
    const ul = node("ul","project-detail__contributions");
    list(contribData,"\n").forEach(line => ul.append(node("li","",line)));
    contribSection.append(ul);
    body.append(contribSection);
  }

  if (safeURL(p.url)) body.append(external("Visit project ↗",p.url,"button button--primary project-detail__actions"));
  fill("projectDialogContent",[headerBlock,hero,body]);
  byId("projectDialog").showModal();
}
document.addEventListener("portfolio:theme",updateGalleryControls);
const commands = [
  ...portfolioNav.views.map(view => ({label:view.label,icon:view.icon,action:()=>portfolioNav.go(view.id)})),
  {label:"Toggle dark mode",icon:"moon",action:portfolioNav.toggleTheme}
];
const commandDialog = byId("commandDialog"), commandInput = byId("commandInput");
let matches = [], selected = 0;
function fuzzyScore(label,query) {
  const value = label.toLowerCase();
  const prefix = value.indexOf(query);
  if (prefix >= 0) return prefix;
  let last = -1, distance = 0;
  for (const char of query) {
    const index = value.indexOf(char,last + 1);
    if (index < 0) return Infinity;
    distance += index - last;
    last = index;
  }
  return 100 + distance;
}
function selectCommand(index,scroll = true) {
  if (!matches.length) { commandInput.removeAttribute("aria-activedescendant"); return; }
  selected = (index + matches.length) % matches.length;
  [...byId("commandResults").children].forEach((item,i) => item.setAttribute("aria-selected",i === selected));
  const option = byId("command-option-"+selected);
  commandInput.setAttribute("aria-activedescendant",option.id);
  if (scroll) option.scrollIntoView({block:"nearest",behavior:"instant"});
}
function runCommand(index) {
  const command = matches[index];
  if (!command) return;
  commandDialog.close();
  command.action();
}
function renderCommands() {
  const query = commandInput.value.trim().toLowerCase();
  matches = commands.map(command => ({command,score:fuzzyScore(command.label,query)}))
    .filter(hit => Number.isFinite(hit.score)).sort((a,b)=>a.score-b.score).map(hit=>hit.command);
  const items = matches.map((command,index) => {
    const item = node("div","command-item");
    item.id = "command-option-"+index;
    item.setAttribute("role","option");
    item.append(workspaceIcon(command.icon),node("strong","",command.label));
    item.onpointermove = () => selectCommand(index,false);
    item.onmousedown = e => e.preventDefault();
    item.onclick = () => runCommand(index);
    return item;
  });
  fill("commandResults",items.length ? items : [node("p","command-empty","No matching views or actions.")]);
  selectCommand(0,false);
}
function quickJump() {
  if (document.querySelector("dialog[open]")) return;
  portfolioNav.closeDrawer(true);
  commandInput.value = "";
  renderCommands();
  commandDialog.showModal();
  commandInput.focus();
}
commandInput.oninput = renderCommands;
commandDialog.onkeydown = event => {
  if (event.isComposing) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    selectCommand(selected + (event.key === "ArrowDown" ? 1 : -1));
  } else if (event.key === "Enter") {
    event.preventDefault();
    runCommand(selected);
  }
};
document.addEventListener("keydown",event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (commandDialog.open) commandDialog.close();
    else quickJump();
  }
});
byId("commandButton").onclick = quickJump;
document.querySelector("[data-close-project]").onclick = ()=>byId("projectDialog").close();
for (const id of ["projectDialog","commandDialog"]) byId(id).onclick = e=>{ if (e.target === byId(id)) byId(id).close(); };
byId("copyEmail").onclick = async ()=>{
  try {await navigator.clipboard.writeText(current.contact.email); toast("Email address copied.");}
  catch { const r = document.createRange(); r.selectNodeContents(byId("contactEmail")); getSelection().removeAllRanges(); getSelection().addRange(r); toast("Email selected. Use your copy shortcut."); }
};
byId("contactForm").onsubmit = e=>{
  e.preventDefault();
  if (!current.contact.email) return;
  const form = new FormData(e.target), body = form.get("message")+"\n\n"+form.get("name")+"\n"+form.get("email");
  location.href = "mailto:"+encodeURIComponent(current.contact.email)+"?subject="+encodeURIComponent(form.get("subject"))+"&body="+encodeURIComponent(body);
};
