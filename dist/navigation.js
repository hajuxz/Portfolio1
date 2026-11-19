"use strict";

const portfolioNav = (() => {
  const config = NAV_CONFIG;
  const root = document.documentElement;
  const el = id => document.getElementById(id);
  const sidebar = el("workspaceSidebar"), nav = el("primaryNav");
  const menu = el("menuTrigger"), backdrop = el("drawerBackdrop"), main = el("main-content");
  const themeButton = el("themeToggle"), marker = nav.querySelector(".route-marker");
  const mobile = matchMedia("(width < 1024px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const views = config.views.filter(view => !view.feature || config.features[view.feature]);
  const links = new Map();
  let current, target, animation, sequence = 0, pending = Promise.resolve();
  let owner = el("workspaceOwner").textContent, drawer = false, preferences = {};

  try { preferences = JSON.parse(localStorage.getItem(config.sidebarKey)) || {}; } catch {}
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  for (const placeholder of document.querySelectorAll("[data-icon]")) placeholder.append(workspaceIcon(placeholder.dataset.icon));
  el("workspaceStatus").textContent = config.status.text;
  el("workspaceStatus").hidden = !config.status.enabled;
  el("workspaceVersion").textContent = config.version;
  el("shortcutBadge").textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

  for (const group of new Set(views.map(view => view.group))) {
    const heading = document.createElement("p");
    heading.className = "workspace-group";
    heading.textContent = group;
    nav.append(heading);
    for (const view of views.filter(item => item.group === group)) {
      const a = document.createElement("a");
      a.href = "#" + view.id;
      a.dataset.route = view.id;
      a.append(workspaceIcon(view.icon),document.createTextNode(view.label));
      links.set(view.id,a);
      nav.append(a);
    }
  }

  function setProfile(profile,contact) {
    owner = profile.name;
    el("workspaceOwner").textContent = owner;
    el("workspaceLocation").textContent = config.location || profile.location;
    el("workspaceSocials").replaceChildren(...Object.entries(config.social).map(([type,override]) => {
      const value = override || contact[type];
      const label = {github:"GitHub",linkedin:"LinkedIn",email:"Email"}[type];
      const url = type === "email" ? (value ? "mailto:" + encodeURIComponent(value.replace(/^mailto:/i,"")) : "") : PortfolioContent.safeURL(value);
      const item = document.createElement(url ? "a" : "button");
      item.className = "social-tile";
      item.title = url ? label : label + " link has not been added";
      item.setAttribute("aria-label",item.title);
      if (url) {
        item.href = url;
        if (type !== "email") { item.target = "_blank"; item.rel = "noopener noreferrer"; }
      } else item.disabled = true;
      item.append(workspaceIcon(type === "email" ? "mail" : type));
      return item;
    }));
    updateTitle();
  }
  function updateTitle() {
    if (current) document.title = owner + " — " + views.find(v => v.id === current).label;
  }
  function moveMarker() {
    const link = links.get(current);
    if (link) marker.style.transform = "translateY(" + link.offsetTop + "px)";
  }
  function updateShell() {
    const view = views.find(v => v.id === current);
    const expanded = mobile.matches ? drawer : !(preferences[current] ?? view?.collapsed ?? false);
    const modal = mobile.matches && drawer;
    document.body.classList.toggle("sidebar-expanded",expanded);
    document.body.classList.toggle("drawer-open",modal);
    sidebar.inert = !expanded;
    if (modal) { sidebar.setAttribute("role","dialog"); sidebar.setAttribute("aria-modal","true"); }
    else { sidebar.removeAttribute("role"); sidebar.removeAttribute("aria-modal"); }
    menu.hidden = expanded;
    menu.setAttribute("aria-expanded",String(expanded));
    main.inert = modal;
    themeButton.inert = modal;
    document.querySelector(".skip-link").inert = modal;
    backdrop.hidden = !modal;
    moveMarker();
  }
  function setSidebar(open,restore = true) {
    if (mobile.matches) drawer = open;
    else {
      preferences[current] = !open;
      try { localStorage.setItem(config.sidebarKey,JSON.stringify(preferences)); } catch {}
    }
    updateShell();
    if (restore) (open ? el("closeSidebar") : menu).focus({preventScroll:true});
  }
  function closeDrawer(restore = false) {
    if (drawer) setSidebar(false,restore);
  }
  menu.onclick = () => setSidebar(true);
  el("closeSidebar").onclick = () => setSidebar(false);
  backdrop.onclick = () => closeDrawer(true);
  sidebar.addEventListener("keydown",event => {
    if (!drawer) return;
    if (event.key === "Escape") { event.preventDefault(); closeDrawer(true); }
    if (event.key !== "Tab") return;
    const items = [...sidebar.querySelectorAll("a[href],button:enabled")];
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  mobile.addEventListener("change",() => {
    drawer = false;
    updateShell();
    if (sidebar.inert && sidebar.contains(document.activeElement)) menu.focus();
  });
  new ResizeObserver(moveMarker).observe(nav);

  function show(id,focus = true) {
    current = id;
    for (const panel of main.querySelectorAll(":scope > [data-view]")) panel.hidden = panel.dataset.view !== id;
    for (const [key,link] of links) {
      if (key === id) link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    }
    document.body.dataset.view = id;
    updateShell();
    updateTitle();
    window.scrollTo({top:0,behavior:"instant"});
    if (focus && !document.querySelector("dialog[open]")) el(id).querySelector("h1").focus({preventScroll:true});
    document.dispatchEvent(new CustomEvent("portfolio:view",{detail:id}));
  }
  async function animatePanel(panel,frames,duration) {
    if (reduced.matches || !panel.animate) return;
    animation = panel.animate(frames,{duration,easing:config.ease});
    try { await animation.finished; } catch { /* A newer route owns the view. */ }
  }
  function route(id) {
    closeDrawer();
    if (id === target) return pending;
    for (const dialogId of ["commandDialog","projectDialog"]) {
      const dialog = el(dialogId);
      if (dialog.open) dialog.close();
    }
    target = id;
    const ticket = ++sequence;
    animation?.cancel();
    pending = (async () => {
      if (current && current !== id) {
        await animatePanel(el(current),[{opacity:1,transform:"none"},{opacity:0,transform:"translateY(-8px)"}],config.timing.exit);
        if (ticket !== sequence) return;
      }
      const firstVisit = !current;
      show(id);
      if (id === "home") {
        // A translated hash target scrolls the document before the first frame.
        if (!firstVisit) await animatePanel(el(id),[{opacity:0},{opacity:1}],config.timing.enter);
      } else {
        await animatePanel(el(id),[{opacity:0,transform:"translateY(12px)",filter:"blur(3px)"},{opacity:1,transform:"none",filter:"blur(0)"}],config.timing.enter);
      }
    })();
    return pending;
  }
  function readLocation() {
    const requested = location.hash.slice(1);
    const id = links.has(requested) ? requested : "home";
    if (requested !== id && !new URLSearchParams(requested).has("admin")) history.replaceState(history.state,"","#"+id);
    return route(id);
  }
  function go(id) {
    if (!links.has(id)) id = "home";
    if (location.hash !== "#" + id) history.pushState(null,"","#"+id);
    if (id === current && id === target) {
      closeDrawer();
      window.scrollTo({top:0,behavior:"instant"});
      el(id).querySelector("h1").focus({preventScroll:true});
    }
    return route(id);
  }
  document.addEventListener("click",event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = link.hash.slice(1);
    if (id === "main-content") { event.preventDefault(); el(current).querySelector("h1").focus(); }
    else if (links.has(id)) { event.preventDefault(); go(id); }
  });
  addEventListener("hashchange",readLocation);
  addEventListener("popstate",readLocation);
  readLocation();
  addEventListener("load",()=>requestAnimationFrame(()=>{
    if (document.activeElement === document.body && !document.querySelector("dialog[open]")) el(current).querySelector("h1").focus({preventScroll:true});
  }),{once:true});

  let transition;
  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.getElementById("themeLabel").textContent = theme === "dark" ? "Light" : "Dark";
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    document.querySelector('meta[name="theme-color"]').content = config.colors[theme].bg;
    document.dispatchEvent(new Event("portfolio:theme"));
  }
  function toggleTheme() {
    if (transition) {
      transition.skipTransition();
      transition.finished.then(toggleTheme);
      return;
    }
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => {
      applyTheme(theme);
      try { localStorage.setItem(config.storageKey, theme); } catch {}
    };
    if (!document.startViewTransition || reduced.matches) { apply(); return; }
    const box = themeButton.getBoundingClientRect();
    const x = box.left + box.width / 2, y = box.top + box.height / 2;
    const radius = Math.hypot(Math.max(x,innerWidth-x), Math.max(y,innerHeight-y));
    root.classList.add("theme-wipe");
    transition = document.startViewTransition(apply);
    transition.ready.then(() => root.animate([
      {clipPath:`circle(0px at ${x}px ${y}px)`},
      {clipPath:`circle(${Math.ceil(radius)}px at ${x}px ${y}px)`}
    ], {duration:config.timing.theme,easing:config.ease,pseudoElement:"::view-transition-new(root)"})).catch(()=>{});
    transition.finished.finally(() => { transition = null; root.classList.remove("theme-wipe"); });
  }
  function restoreTheme() {
    let saved;
    try { saved = localStorage.getItem(config.storageKey); } catch {}
    applyTheme(saved === "dark" || saved === "light" ? saved : systemTheme.matches ? "dark" : "light");
  }
  themeButton.addEventListener("click", toggleTheme);
  systemTheme.addEventListener("change", restoreTheme);
  addEventListener("storage", e => { if (!e.key || e.key === config.storageKey) restoreTheme(); });
  applyTheme(root.dataset.theme);
  return {views,go,toggleTheme,setProfile,closeDrawer};
})();
