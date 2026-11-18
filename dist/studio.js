"use strict";
let draft = null, dirty = false, busy = false, tab = "profile";
const fieldNames = {
  name:"Display name", eyebrow:"Professional title", headline:"Introduction", roles:"Rotating specialties (comma separated)", location:"Based in", availability:"Availability",
  resume:"Résumé URL", alt:"Image description", aboutTitle:"About heading", aboutIntro:"About introduction", bio:"Biography", footer:"Footer note",
  title:"Title", description:"Description", category:"Category", year:"Date or study label", summary:"Short description", detail:"Case study", highlights:"Design decisions (one per line)", tags:"Tags (comma separated)", url:"Project URL",
  items:"Skills (comma separated)", organization:"Organization or focus", date:"Date", type:"Milestone type", email:"Contact email", intro:"Contact introduction", github:"GitHub URL", linkedin:"LinkedIn URL", website:"Website URL", accent:"Primary color", secondary:"Secondary color"
};
const groups = {
  profile:["name","eyebrow","headline","roles","location","availability","resume","portrait","alt","aboutTitle","aboutIntro","bio","footer"],
  services:["title","description"], interests:["title","description"], projects:["title","category","year","image","alt","summary","detail","highlights","tags","url"],
  skills:["title","description","items"], journey:["title","date","organization","description","type"],
  contact:["email","intro","github","linkedin","website"], appearance:["accent","secondary"]
};
const plural = {services:"service",interests:"interest",projects:"project",skills:"skill group",journey:"milestone"};
const editor = byId("studioDialog");
function markChanged() {
  dirty = true;
  byId("saveState").textContent = "Unsaved changes";
  document.querySelector(".studio-status").classList.add("is-dirty");
  render(draft);
}
function editorStatus(message) { byId("saveState").textContent = message; }
function setBusy(value) {
  busy = value;
  byId("saveContent").disabled = value;
  byId("studioForm").inert = value;
  editor.querySelector(".studio-footer__tools").inert = value;
}
async function compressImage(file) {
  if (!["image/png","image/webp","image/jpeg","image/gif"].includes(file.type) || file.size > 6 * 1024 * 1024) throw Error("Choose a JPG, PNG, WebP or GIF under 6 MB.");
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const scale = Math.min(1,1400/Math.max(img.width,img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width*scale));
    canvas.height = Math.max(1, Math.round(img.height*scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const data = canvas.toDataURL("image/jpeg",.78);
    if (data.length >= 1600000) throw Error("Please use a smaller image.");
    return data;
  } finally { URL.revokeObjectURL(src); }
}
function addField(owner, field) {
  if (field === "image" || field === "portrait") {
    const container = byId("imageFieldTemplate").content.firstElementChild.cloneNode(true);
    const preview = container.querySelector("img"), input = container.querySelector("input");
    preview.src = owner[field];
    input.onchange = async () => {
      if (!input.files[0]) return;
      setBusy(true);
      try {
        const data = await compressImage(input.files[0]);
        owner[field] = preview.src = data;
        markChanged();
      } catch (error) { editorStatus(error.message); }
      finally { setBusy(false); input.value = ""; }
    };
    return container;
  }
  const label = node("label","editor-field");
  label.append(node("span","",fieldNames[field]));
  const multiline = ["bio","summary","description","highlights","detail","intro","headline","aboutIntro"].includes(field);
  const input = node(multiline ? "textarea" : "input");
  if (multiline) input.rows = 3;
  else if (["accent","secondary"].includes(field)) input.type = "color";
  else if (field === "email") input.type = "email";
  else if (["resume","url","github","linkedin","website"].includes(field)) input.type = "url";
  input.value = owner[field];
  input.maxLength = 5000;
  input.oninput = ()=>{ owner[field] = input.value; markChanged(); };
  label.append(input);
  return label;
}
function section(title) {
  const wrapper = node("section","editor-section"), header = node("div","editor-section__head");
  header.append(node("h3","",title)); wrapper.append(header);
  return wrapper;
}
function repeatGroup(group) {
  const wrapper = section(group === "journey" ? "Milestones" : group.charAt(0).toUpperCase()+group.slice(1));
  wrapper.id = "collection-"+group;
  const rows = draft[group];
  rows.forEach((row,i)=>{
    const card = node("details","repeat-card"), heading = node("summary","repeat-card__top",row.title || "Untitled");
    card.append(heading);
    const fields = node("div","repeat-fields");
    groups[group].forEach(f=>fields.append(addField(row,f)));
    const actions = node("div","repeat-card__actions");
    for (const [offset,label] of [[-1,"Move up"],[1,"Move down"]]) {
      const b = button("mini-button",label,()=>{
        [rows[i],rows[i+offset]] = [rows[i+offset],rows[i]];
        rebuild(); markChanged();
      });
      b.disabled = i+offset < 0 || i+offset >= rows.length;
      actions.append(b);
    }
    actions.append(button("mini-button mini-button--danger","Remove",()=>{
      if (confirm("Remove this "+plural[group]+" from your draft?")) {rows.splice(i,1); rebuild(); markChanged();}
    }));
    fields.append(actions); card.append(fields); wrapper.append(card);
  });
  wrapper.append(button("add-button","+ Add "+plural[group],()=>{
    if (rows.length >= 80) return editorStatus("This collection is full.");
    const item = Object.fromEntries(groups[group].map(f=>[f,f === "image" ? defaults.projects[0].image : ""]));
    item.title = "New "+plural[group];
    rows.push(item); rebuild(); markChanged();
    const last = byId("collection-"+group).querySelectorAll("details");
    last[last.length-1].open = true;
    last[last.length-1].querySelector("input").focus();
  }));
  return wrapper;
}
function rebuild() {
  all("[data-editor-tab]").forEach(b=>{
    const selected = tab === b.dataset.editorTab;
    b.setAttribute("aria-selected", selected); b.classList.toggle("is-active",selected);
    b.tabIndex = selected ? 0 : -1;
    b.id = "tab-"+b.dataset.editorTab;
    b.setAttribute("aria-controls","editor-"+b.dataset.editorTab);
  });
  all(".editor-panel").forEach(panel=>{
    panel.hidden = panel.id !== "editor-"+tab;
    panel.setAttribute("aria-labelledby",panel.id.replace("editor-","tab-"));
    panel.replaceChildren();
  });
  const panel = byId("editor-"+tab);
  if (plural[tab]) panel.append(repeatGroup(tab));
  else {
    const wrapper = section(({profile:"Profile & introduction",contact:"Contact details",appearance:"Portfolio colors"})[tab]);
    groups[tab].forEach(f=>wrapper.append(addField(draft[tab],f)));
    panel.append(wrapper);
    if (tab === "profile") panel.append(repeatGroup("services"),repeatGroup("interests"));
  }
}
function openEditor() {
  if (serverMode && !canPublish) return;
  draft = copy(saved); dirty = false; tab = "profile";
  editor.querySelector(".studio-status").classList.remove("is-dirty");
  editorStatus("Editing saved content");
  rebuild(); editor.showModal(); byId("studioForm").scrollTop = 0;
}
function closeEditor(force = false) {
  if (busy || (!force && dirty && !confirm("Discard the changes made since your last save?"))) return;
  editor.close(); draft = null; dirty = false; render(saved);
}
all("[data-open-editor]").forEach(b=>b.onclick = openEditor);
all("[data-close-editor]").forEach(b=>b.onclick = ()=>closeEditor());
editor.oncancel = e=>{ e.preventDefault(); closeEditor(); };
all("[data-editor-tab]").forEach(b=>b.onclick = ()=>{ tab = b.dataset.editorTab; rebuild(); byId("studioForm").scrollTop = 0; });
document.querySelector(".studio-tabs").onkeydown = e=>{
  const tabs = all("[data-editor-tab]"), i = tabs.indexOf(e.target);
  if (i === -1 || !["ArrowLeft","ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  const next = tabs[(i+(e.key === "ArrowRight" ? 1 : -1)+tabs.length)%tabs.length];
  next.click(); next.focus();
};
byId("studioForm").onsubmit = e=>e.preventDefault();
byId("undoEditor").onclick = ()=>{
  draft = copy(saved); dirty = false; rebuild(); render(draft);
  document.querySelector(".studio-status").classList.remove("is-dirty"); editorStatus("Restored your last save");
};
byId("resetContent").onclick = ()=>{
  if (!confirm("Replace this draft with the sample portfolio? Save to keep this change.")) return;
  draft = copy(defaults); rebuild(); markChanged();
};
byId("exportContent").onclick = ()=>{
  try {
    const blob = new Blob([JSON.stringify(validate(draft),null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob), a = node("a");
    a.href = url; a.download = "portfolio.json"; document.body.append(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000); editorStatus("Backup downloaded");
  } catch (e) { editorStatus(e.message); }
};
byId("importContent").onchange = async e=>{
  const file = e.target.files[0]; if (!file) return;
  setBusy(true);
  try {
    if (file.size > 12*1024*1024) throw Error("Choose a backup under 12 MB.");
    const next = validate(JSON.parse(await file.text()));
    if (!dirty || confirm("Replace your current draft with this backup?")) { draft = next; rebuild(); markChanged(); editorStatus("Backup loaded. Save to keep it."); }
  } catch(error) { editorStatus(error instanceof SyntaxError ? "This backup contains invalid JSON." : error.message); }
  finally { setBusy(false); e.target.value = ""; }
};
byId("saveContent").onclick = async ()=>{
  if (busy) return;
  setBusy(true);
  try {
    const next = validate(draft), data = JSON.stringify(next);
    if (new Blob([data]).size > 12*1024*1024) throw Error("The portfolio is too large. Use smaller images.");
    if (serverMode) {
      const response = await fetch("/api/portfolio",{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+adminToken,"If-Match":revision},body:data});
      if (!response.ok) throw Error(response.status === 412 ? "A newer version was saved. Export this draft, then reload." : "Could not publish. Check your admin link and connection.");
      revision = response.headers.get("ETag");
    } else {
      try { localStorage.setItem(key,data); } catch { throw Error("Browser storage is unavailable or full. Export a backup or use smaller images."); }
    }
    saved = next; setBusy(false); closeEditor(true);
    toast(serverMode ? "Published. Visitors can now see your changes." : "Portfolio saved to this browser.");
  } catch (e) { editorStatus(e.message); }
  finally { setBusy(false); }
};

async function startPortfolio() {
  const fragment = new URLSearchParams(location.hash.slice(1));
  if (fragment.has("admin")) {
    adminToken = fragment.get("admin");
    history.replaceState(null,"",location.pathname+location.search);
    try { sessionStorage.setItem("orbitfolio.owner",adminToken); } catch {}
  } else {
    try { adminToken = sessionStorage.getItem("orbitfolio.owner") || ""; } catch {}
  }
  if (location.protocol !== "file:") {
    try {
      // Only transmit a token to the same origin.
      const response = await fetch("./api/portfolio",{cache:"no-store",headers:adminToken ? {Authorization:"Bearer "+adminToken} : {},signal:AbortSignal.timeout(4500)});
      if (response.headers.get("X-Portfolio-Server") === "1") {
        serverMode = true;
        if (!response.ok) throw Error("The server could not load the portfolio.");
        const payload = await response.json();
        saved = validate(payload.content); revision = response.headers.get("ETag"); canPublish = payload.canPublish;
      }
    } catch { if (serverMode) toast("The saved portfolio could not be loaded.",true); }
  }
  if (!serverMode) {
    let local = false;
    try {
      const record = localStorage.getItem(key);
      if (record) { saved = validate(JSON.parse(record)); local = true; }
    } catch { toast("Showing the sample portfolio. Your browser backup could not be read.",true); }
    if (!local && location.protocol !== "file:") {
      try {
        const response = await fetch("./portfolio.json",{cache:"no-cache",signal:AbortSignal.timeout(3000)});
        if (response.ok) saved = validate(await response.json());
      } catch { /* A static installation can use the bundled sample content. */ }
    }
  }
  if (serverMode && !canPublish) {
    all("[data-open-editor]").forEach(b=>b.hidden = true);
    document.body.classList.add("visitor");
  } else {
    commands.push({label:"Edit portfolio",icon:"✎",action:openEditor});
    if (serverMode) {
      editor.querySelector(".studio-header .kicker").textContent = "Owner editor";
      editor.querySelector(".studio-header p:last-child").textContent = "Publish changes to update the portfolio for every visitor.";
      editor.querySelector(".studio-status b").textContent = "Shared portfolio";
      byId("saveContent").textContent = "Publish changes";
    }
  }
  render(saved);
  document.body.classList.add("ready");
  if (fragment.has("admin") && canPublish) openEditor();
}
render(saved);
startPortfolio().catch(()=>toast("Portfolio loaded with sample content.",true)).finally(()=>document.body.classList.add("ready"));
