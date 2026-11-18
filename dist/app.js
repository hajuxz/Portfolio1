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
let saved = copy(defaults), current = saved, filter = "", roleIndex = 0;
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
function fill(id, items) {
  byId(id).replaceChildren(...items);
}
function usesThemePalette(appearance) {
  return appearance.accent === defaults.appearance.accent && appearance.secondary === defaults.appearance.secondary;
}
function render(content) {
  current = content;
  const p = content.profile;
  const words = p.name.trim().split(/\s+/);
  const initials = [words[0]?.[0], words.length > 1 ? words.at(-1)[0] : ""].join("").toUpperCase();
  for (const id of ["railInitials","mobileInitials","signatureInitials"]) byId(id).textContent = initials;
  byId("footerMark").replaceChildren(initials, node("span","",".")); 
  byId("heroName").textContent = words.join(" ");
  document.title = (p.name || "My portfolio") + " — Portfolio";
  const values = {heroAvailability:p.availability, heroEyebrow:p.eyebrow, heroHeadline:p.headline, heroLocation:p.location, aboutTitle:p.aboutTitle, aboutIntro:p.aboutIntro, aboutBio:p.bio, contactIntro:content.contact.intro, footerNote:p.footer, footerName:p.name, footerYear:new Date().getFullYear()};
  Object.entries(values).forEach(([id,value]) => byId(id).textContent = value);
  const portrait = byId("profilePortrait");
  if (portrait.getAttribute("src") !== p.portrait) portrait.src = p.portrait;
  portrait.alt = p.alt;
  const resume = byId("resumeLink");
  resume.textContent = safeURL(p.resume) ? "View résumé ↗" : "Get in touch ↗";
  resume.href = safeURL(p.resume) || "#contact";
  resume.target = safeURL(p.resume) ? "_blank" : "_self";
  resume.rel = "noopener noreferrer";
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
    card.append(node("span","service-card__number",["✳","</>","▥"][index % 3]),body);
    return card;
  }));
  byId("interests").hidden = !content.interests.length;
  fill("interestsGrid",content.interests.map(interest=>{
    const card = node("article");
    card.append(node("h4","",interest.title),node("p","",interest.description));
    return card;
  }));
  renderProjects();
  fill("skillsGrid",content.skills.map((s,index) => {
    const card = node("article","capability-card"), top = node("div","capability-card__top"), heading = node("div");
    heading.append(node("h3","",s.title),node("p","",s.description));
    top.append(heading,node("span","capability-card__icon",["✳","{ }","▥"][index % 3]));
    card.append(top,tags(s.items,"skill-pill"));
    return card;
  }));
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
  showRole();
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
  gallery.querySelectorAll(".reveal").forEach(card=>revealObserver.unobserve(card));
  fill("projectsList",projects.length ? projects.map((p,index) => {
    const article = node("article","project-card reveal"), media = node("div","project-card__media"), body = node("div","project-card__body");
    article.style.setProperty("--card-delay",(index % 2)*75+"ms");
    media.append(imageFor(p.image,p.alt,defaults.projects[0].image));
    const intro = node("div"), meta = node("div","project-card__meta");
    meta.append(node("span","project-card__type",p.category),node("span","project-card__year",p.year));
    intro.append(meta,node("h3","",p.title),node("p","project-card__summary",p.summary));
    const footer = node("div","project-card__footer");
    const open = button("project-open","↗",()=>openProject(p));
    open.setAttribute("aria-label","View case study for "+p.title);
    footer.append(tags(p.tags),open);
    body.append(intro,footer);
    article.append(media,body);
    return article;
  }) : [node("p","empty-state","New projects will appear here.")]);
  gallery.scrollLeft = 0;
  gallery.querySelectorAll(".reveal").forEach(card=>revealObserver.observe(card));
  updateGalleryControls();
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
  const hero = node("div","project-detail__hero"), body = node("div","project-detail__body");
  hero.append(imageFor(p.image,p.alt,defaults.projects[0].image));
  const h = node("h2","",p.title);
  h.id = "projectDialogTitle";
  body.append(node("p","kicker",p.category + " / " + p.year),h,node("p","project-detail__lead",p.detail || p.summary));
  const grid = node("div","project-detail__grid"), decisions = node("div"), stack = node("div"), ul = node("ul");
  list(p.highlights,"\n").forEach(line=>ul.append(node("li","",line)));
  decisions.append(node("h3","","Design decisions"),ul);
  stack.append(node("h3","","Tools & disciplines"),tags(p.tags));
  grid.append(decisions,stack);
  body.append(grid);
  if (safeURL(p.url)) body.append(external("Visit project ↗",p.url,"button button--primary project-detail__actions"));
  fill("projectDialogContent",[hero,body]);
  byId("projectDialog").showModal();
}
function showRole() {
  const roles = list(current.profile.roles);
  byId("rotatingRole").textContent = roles[roleIndex % roles.length] || "digital products";
}
function toggleTheme() {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  syncThemeButtons();
  updateGalleryControls();
  playPortrait();
  try { localStorage.setItem("orbitfolio.theme",theme); } catch {}
}
const commands = [
  ...[["home","Home"],["about","About & services"],["work","Selected work"],["skills","Skills"],["journey","Journey"],["contact","Contact"]]
    .map(([id,label])=>({label,icon:"↗",action:()=>{ location.hash = id; byId(id).scrollIntoView(); }})),
  {label:"Certificates of completion",icon:"↗",action:()=>{location.hash = "certificates"; byId("certificates").scrollIntoView();}},
  {label:"Switch light / dark theme",icon:"◐",action:toggleTheme}
];
function renderCommands() {
  const query = byId("commandInput").value.toLowerCase().trim();
  const items = commands.filter(c=>c.label.toLowerCase().includes(query)).map(c=>{
    const item = button("command-item","",()=>{ byId("commandDialog").close(); c.action(); });
    item.append(node("span","",c.icon),node("strong","",c.label));
    return item;
  });
  fill("commandResults",items.length ? items : [node("p","command-empty","No matches")]);
}
function quickJump() {
  if (document.querySelector("dialog[open]")) return;
  byId("commandInput").value = "";
  renderCommands();
  byId("commandDialog").showModal();
  byId("commandInput").focus();
}
byId("commandInput").oninput = renderCommands;
byId("commandDialog").onkeydown = event => {
  const items = [...byId("commandResults").querySelectorAll("button")], index = items.indexOf(document.activeElement);
  if (!items.length) return;
  if (["ArrowDown","ArrowUp"].includes(event.key)) {
    event.preventDefault();
    items[(index + (event.key === "ArrowDown" ? 1 : index < 0 ? 0 : -1) + items.length) % items.length].focus();
  } else if (event.key === "Enter" && document.activeElement === byId("commandInput")) items[0].click();
};
document.addEventListener("keydown",e=>{ if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {e.preventDefault(); quickJump();} });
byId("commandButton").onclick = byId("mobileCommandButton").onclick = quickJump;
function syncThemeButtons() {
  const dark = document.documentElement.dataset.theme === "dark", next = dark ? "light" : "dark";
  for (const id of ["themeToggle","mobileThemeToggle"]) byId(id).setAttribute("aria-label","Switch to "+next+" theme");
  byId("mobileThemeToggle").textContent = dark ? "Light ◑" : "Dark ◐";
}
byId("themeToggle").onclick = byId("mobileThemeToggle").onclick = toggleTheme;
syncThemeButtons();
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
function updateNavigation() {
  const marker = innerHeight * 0.4;
  const section = all("[data-section]").filter(s=>s.getBoundingClientRect().top <= marker).at(-1)?.id || "home";
  all("[data-nav]").forEach(a=>{
    a.classList.toggle("is-active",a.dataset.nav === section);
    if (a.dataset.nav === section) a.setAttribute("aria-current","location"); else a.removeAttribute("aria-current");
  });
  const timeline = document.querySelector(".timeline-shell").getBoundingClientRect();
  document.documentElement.style.setProperty("--timeline-progress", Math.min(100,Math.max(0,(innerHeight*.7-timeline.top)/timeline.height*100))+"%");
}
let frame = false;
addEventListener("scroll",()=>{ if (!frame) { frame = true; requestAnimationFrame(()=>{ updateNavigation(); frame = false; }); } },{passive:true});
const revealObserver = new IntersectionObserver(entries=>entries.forEach(e=>{
  if (e.isIntersecting) {e.target.classList.add("is-visible"); revealObserver.unobserve(e.target);}
}),{threshold:0.03});
all(".reveal").forEach(el=>revealObserver.observe(el));
const portraitStage = document.querySelector(".hero__visual");
const particles = document.querySelector(".portrait-particles");
for (let index=0;index<18;index++) {
  const particle = node("i");
  const angle = index*2.4, radius = 28+(index%4)*6;
  const x = Math.cos(angle)*radius, y = Math.sin(angle)*radius;
  particle.style.left = (50+x)+"%";
  particle.style.top = (50+y)+"%";
  particle.style.setProperty("--from-x",(-x*1.2)+"px");
  particle.style.setProperty("--from-y",(-y*1.2)+"px");
  particle.style.setProperty("--delay",(index%5)*50+"ms");
  particles.append(particle);
}
function playPortrait() {
  if (reduced.matches) return;
  portraitStage.classList.remove("portrait-playing");
  void portraitStage.offsetWidth;
  portraitStage.classList.add("portrait-playing");
}
byId("replayPortrait").onclick = playPortrait;
const portraitObserver = new IntersectionObserver(entries=>{
  if (entries.some(entry=>entry.isIntersecting)) {
    playPortrait();
    portraitObserver.disconnect();
  }
},{threshold:.35});
portraitObserver.observe(portraitStage);
function updateClock() {
  byId("localTime").textContent = new Intl.DateTimeFormat("en-PH",{hour:"numeric",minute:"2-digit", timeZone:"Asia/Manila"}).format(new Date())+" PHT";
}
updateClock(); setInterval(updateClock,30000);
setInterval(()=>{ if (!reduced.matches && !document.hidden) { roleIndex++; showRole(); } },4800);
updateNavigation();
