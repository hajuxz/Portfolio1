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
function skillCard(skill,index) {
  const categories = {"AI Tools":"ai", Frontend:"browser", Backend:"server", APIs:"api", Database:"database", "Professional & Core":"core"};
  const brands = {figma:"figma",html:"html5",html5:"html5",css:"css3",css3:"css3",javascript:"javascript",react:"react","react.js":"react",git:"git"};
  const icon = categories[skill.title] || "skills";
  const card = node("article","skill-card"), header = node("header"), tile = node("span","category-tile");
  card.style.setProperty("--order",index);
  tile.dataset.category = icon;
  tile.append(workspaceIcon(icon));
  header.append(tile,node("h2","",skill.title));
  card.append(header);
  if (skill.description) card.append(node("p","skill-description",skill.description));
  const chips = node("ul","skill-chips");
  for (const label of list(skill.items)) {
    const chip = node("li","skill-chip"), glyph = node("span","chip-glyph");
    const brand = brands[label.toLowerCase()];
    if (brand) {
      const image = node("img");
      image.alt = ""; image.width = image.height = 16;
      image.src = "assets/workspace/" + brand + ".svg";
      glyph.classList.add("brand-" + brand);
      glyph.append(image);
    } else glyph.append(workspaceIcon(icon));
    chip.append(glyph,document.createTextNode(label));
    chips.append(chip);
  }
  card.append(chips.childElementCount ? chips : node("p","skill-empty","No skills listed yet."));
  return card;
}
function render(content) {
  current = content;
  const p = content.profile;
  const words = p.name.trim().split(/\s+/);
  const initials = [words[0]?.[0], words.length > 1 ? words.at(-1)[0] : ""].join("").toUpperCase();
  for (const id of ["mobileInitials","signatureInitials"]) byId(id).textContent = initials;
  const surname = words.at(-1);
  const nameLines = [words.slice(0,-1).join(" "), surname].filter(Boolean);
  byId("heroName").replaceChildren(...nameLines.map(line => node("span","",line)));
  byId("heroName").setAttribute("aria-label", p.name);
  portfolioNav.setProfile(p, content.contact);
  document.querySelector('meta[name="description"]').content = p.headline;
  const values = {heroAvailability:p.availability, heroEducation:p.eyebrow, heroFocus:p.roles, heroLocation:p.location, aboutTitle:p.aboutTitle, aboutIntro:p.aboutIntro, aboutBio:p.bio, contactIntro:content.contact.intro};
  Object.entries(values).forEach(([id,value]) => byId(id).textContent = value);
  portraitSwitch.setSources(p);
  const resume = byId("resumeLink");
  resume.hidden = !safeURL(p.resume);
  if (resume.hidden) resume.removeAttribute("href"); else resume.href = p.resume;
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
document.addEventListener("portfolio:theme",updateGalleryControls);
const commands = [
  ...portfolioNav.views.map(view => ({label:view.label,icon:view.icon,action:()=>portfolioNav.go(view.id)})),
  {label:"Toggle dark mode",icon:"moon",action:portfolioNav.toggleTheme},
  {label:"Switch portrait",icon:"swap",action:async()=>{
    portraitSwitch.cancelIntro();
    await portfolioNav.go("home");
    if (!byId("home").hidden) await portraitSwitch.switchManually();
  }}
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
function updateClock() {
  byId("localTime").textContent = new Intl.DateTimeFormat("en-PH",{hour:"numeric",minute:"2-digit", timeZone:"Asia/Manila"}).format(new Date())+" PHT";
}
updateClock(); setInterval(updateClock,30000);

