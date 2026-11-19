"use strict";

const portfolioNav = (() => {
  const config = NAV_CONFIG;
  const root = document.documentElement;
  const nav = document.getElementById("primaryNav");
  const row = nav.querySelector(".primary-row"), links = nav.querySelector(".nav-links");
  const indicator = links.querySelector(".nav-indicator"), divider = nav.querySelector(".nav-divider");
  const themeButton = nav.querySelector(".nav-theme"), burger = nav.querySelector(".nav-menu-toggle");
  const menu = document.getElementById("navMenu"), panel = menu.firstElementChild;
  const mobile = matchMedia("(width < 768px)"), reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const items = new Map(), sections = [];
  let active, hover, contact, menuOpen = false, scrollTarget = null, observer;

  for (const [index, item] of config.sections.entries()) {
    const section = document.getElementById(item.id);
    if (!section) continue;
    const link = document.createElement("a");
    link.href = "#" + item.id;
    link.textContent = item.label;
    link.dataset.sectionLink = section.id;
    link.style.setProperty("--order", index);
    if (item.cta) {
      contact = link;
      link.className = "nav-cta";
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden","true");
      arrow.textContent = "↗";
      link.append(arrow);
    } else {
      links.append(link);
      link.addEventListener("pointerenter", e => {
        if (e.pointerType !== "touch") { hover = link; positionIndicator(); }
      });
    }
    items.set(section.id, link);
    sections.push(section);
  }

  function positionIndicator() {
    if (mobile.matches) return;
    const focused = links.querySelector("a:focus-visible");
    const target = hover || focused || items.get(active);
    if (!target || target === contact) { indicator.style.opacity = "0"; return; }
    const bounds = target.getBoundingClientRect();
    indicator.style.width = bounds.width + "px";
    indicator.style.transform = "translateX(" + (bounds.left - links.getBoundingClientRect().left) + "px)";
    indicator.style.opacity = "1";
  }
  function setActive(id) {
    if (id === active) return;
    items.get(active)?.removeAttribute("aria-current");
    active = id;
    items.get(id)?.setAttribute("aria-current","page");
    positionIndicator();
  }
  function readSection() {
    const bottom = scrollY > 0 && Math.ceil(scrollY + innerHeight) >= root.scrollHeight - 1;
    const marker = Math.max(config.scrollOffset + 1, innerHeight * .24);
    const section = bottom ? sections.at(-1) : sections.filter(s => s.getBoundingClientRect().top <= marker).at(-1);
    setActive((section || sections[0]).id);
  }
  function observeSections() {
    observer?.disconnect();
    const marker = Math.min(innerHeight - 2, Math.max(config.scrollOffset + 1, Math.round(innerHeight * .24)));
    observer = new IntersectionObserver(readSection, {rootMargin: `-${marker}px 0px -${innerHeight-marker-2}px 0px`});
    sections.forEach(s => observer.observe(s));
    readSection();
  }
  function setMenu(open, restoreFocus = false) {
    menuOpen = open;
    nav.classList.toggle("menu-open", open);
    root.classList.toggle("nav-locked", open);
    menu.inert = !open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    if (open) nav.classList.remove("nav-away");
    if (restoreFocus) burger.focus({preventScroll:true});
  }
  function layout() {
    setMenu(false);
    hover = null;
    if (mobile.matches) panel.append(links, contact);
    else { row.insertBefore(links, divider); row.append(contact); }
    positionIndicator();
  }
  burger.addEventListener("click", () => setMenu(!menuOpen));
  document.addEventListener("pointerdown", e => { if (menuOpen && !nav.contains(e.target)) setMenu(false); });
  document.addEventListener("focusin", e => { if (menuOpen && !nav.contains(e.target)) setMenu(false); });
  nav.addEventListener("focusin", () => { nav.classList.remove("nav-away"); positionIndicator(); });
  document.addEventListener("keydown", e => {
    if (menuOpen && e.key === "Escape") { e.preventDefault(); setMenu(false, true); }
  });
  links.addEventListener("pointerleave", () => { hover = null; positionIndicator(); });
  links.addEventListener("focusout", () => requestAnimationFrame(positionIndicator));
  nav.addEventListener("click", e => {
    const link = e.target.closest("a[href^='#']");
    if (!link || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const section = document.getElementById(link.hash.slice(1));
    if (!section) return;
    e.preventDefault();
    setMenu(false);
    scrollTarget = section;
    nav.classList.remove("nav-away");
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    section.setAttribute("tabindex","-1");
    section.focus({preventScroll:true});
    // Unlock the viewport before measuring. ScrollTrigger may also refresh on a breakpoint change.
    requestAnimationFrame(() => {
      if (scrollTarget !== section) return;
      window.scrollTo({top:destination(section),behavior:reduced.matches ? "instant" : "smooth"});
      scheduleScrollEnd();
    });
  });

  let lastY = Math.max(0,scrollY), lastTime = performance.now(), pending = false, scrollEnd;
  function destination(section) {
    return Math.max(0,Math.min(root.scrollHeight-root.clientHeight, scrollY + section.getBoundingClientRect().top - config.scrollOffset));
  }
  function scheduleScrollEnd() {
    clearTimeout(scrollEnd);
    scrollEnd = setTimeout(() => {
      // If a layout refresh interrupted native scrolling, settle at the newly measured heading.
      if (scrollTarget) {
        const top = destination(scrollTarget);
        scrollTarget = null;
        if (Math.abs(scrollY-top)>2) window.scrollTo({top,behavior:"instant"});
      }
      readSection();
    }, 160);
  }
  function onScroll(now) {
    pending = false;
    const y = Math.max(0,scrollY), delta = y - lastY;
    const elapsed = Math.min(80,Math.max(1,now - lastTime));
    if (scrollTarget && Math.abs(y-destination(scrollTarget))<=2) scrollTarget = null;
    nav.classList.toggle("nav-compact", y > config.compactAfter);
    if (delta < 0 || y <= config.compactAfter || scrollTarget || menuOpen) nav.classList.remove("nav-away");
    else if (delta / elapsed >= config.hideSpeed && !nav.querySelector(":focus-visible")) nav.classList.add("nav-away");
    if (Math.ceil(y + innerHeight) >= root.scrollHeight - 1) readSection();
    lastY = y; lastTime = now;
    scheduleScrollEnd();
  }
  addEventListener("scroll", () => { if (!pending) { pending = true; requestAnimationFrame(onScroll); } }, {passive:true});
  // User input can interrupt native smooth scrolling before scrollend fires.
  for (const type of ["wheel","touchstart","pointerdown","keydown"]) {
    document.addEventListener(type, () => { scrollTarget = null; }, {passive:true,capture:true});
  }
  addEventListener("popstate", () => { scrollTarget = null; });
  mobile.addEventListener("change", layout);
  addEventListener("resize", observeSections);
  new ResizeObserver(positionIndicator).observe(links);
  document.fonts.ready.then(positionIndicator);
  layout(); observeSections(); onScroll(performance.now());

  let transition;
  function applyTheme(theme) {
    root.dataset.theme = theme;
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
  return {toggleTheme};
})();
