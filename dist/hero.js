"use strict";

const heroMedia = (() => {
  const get = id => document.getElementById(id);
  const home = get("home"), stage = get("heroStage");
  const title = get("homeTitle"), time = get("localTime");
  const nameBlock = get("heroNameBlock");
  const clock = new Intl.DateTimeFormat("en-PH",{timeZone:"Asia/Manila",hour:"numeric",minute:"2-digit"});
  let layoutFrame=0, clockTimer;
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = matchMedia("(max-width: 768px)");
  const canHover = matchMedia("(pointer: fine)");

  // ── Letter-wrapping for staggered reveal ──
  function wrapLetters(el) {
    const rawText = el.getAttribute("data-full-name") || el.textContent;
    el.setAttribute("data-full-name", rawText);
    el.textContent = "";

    if (mobileQuery.matches) {
      // Mobile: split into 2 lines — "CHRISTIAN REY" / "ADOLFO"
      const words = rawText.trim().split(/\s+/);
      const line1Text = words.slice(0, -1).join(" ");
      const line2Text = words.at(-1) || "";
      let charIndex = 0;

      const line1 = document.createElement("span");
      line1.className = "name-mobile-line";
      for (let i = 0; i < line1Text.length; i++) {
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = line1Text[i] === " " ? "\u00A0" : line1Text[i];
        if (!reduced.matches) span.style.transitionDelay = (charIndex * 35) + "ms";
        charIndex++;
        line1.appendChild(span);
      }
      el.appendChild(line1);

      const line2 = document.createElement("span");
      line2.className = "name-mobile-line";
      for (let i = 0; i < line2Text.length; i++) {
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = line2Text[i] === " " ? "\u00A0" : line2Text[i];
        if (!reduced.matches) span.style.transitionDelay = (charIndex * 35) + "ms";
        charIndex++;
        line2.appendChild(span);
      }
      el.appendChild(line2);
    } else {
      // Desktop: single line
      const text = rawText.toUpperCase();
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = text[i] === " " ? "\u00A0" : text[i];
        if (!reduced.matches) span.style.transitionDelay = (i * 35) + "ms";
        el.appendChild(span);
      }
    }
  }

  wrapLetters(title);

  function reveal() {
    if (!reduced.matches) {
      requestAnimationFrame(() => {
        void title.offsetWidth;
        title.classList.add("is-revealed");
        nameBlock.classList.add("is-revealed");
      });
    } else {
      title.classList.add("is-revealed");
      nameBlock.classList.add("is-revealed");
    }
  }

  reveal();

  // Re-wrap on mobile breakpoint change
  mobileQuery.addEventListener("change", () => {
    title.classList.remove("is-revealed");
    nameBlock.classList.remove("is-revealed");
    wrapLetters(title);
    reveal();
  });

  // ── Cursor highlight for glass letters (inside letters only, pointer: fine only) ──
  if (canHover.matches && !reduced.matches) {
    let mouseFrame = 0;
    window.addEventListener("mousemove", e => {
      if (home.hidden || mouseFrame) return;
      mouseFrame = requestAnimationFrame(() => {
        title.style.setProperty("--mx", e.clientX + "px");
        title.style.setProperty("--my", e.clientY + "px");
        mouseFrame = 0;
      });
    }, {passive: true});
  }

  // ── Light-ink twin for theme transition on widgets ──
  function makeLightInk(selector) {
    const original=stage.querySelector(selector);
    if (!original) return;
    const twin=original.cloneNode(true);
    twin.classList.add("hero-light-ink");
    original.classList.add("hero-dark-ink");
    twin.setAttribute("aria-hidden","true"); twin.inert=true;
    for (const item of twin.querySelectorAll("[id]")) {item.removeAttribute("id");item.removeAttribute("tabindex");}
    original.after(twin);
    function sync() {
      const source=original.querySelectorAll("strong"), destination=twin.querySelectorAll("strong");
      source.forEach((item,i)=>{
        if (destination[i]) destination[i].textContent=item.textContent;
      });
    }
    new MutationObserver(sync).observe(original,{subtree:true,childList:true,characterData:true});
  }
  makeLightInk(".hero-widgets");

  function updateTime() {
    clearTimeout(clockTimer);
    if (home.hidden || document.hidden) return;
    time.textContent = clock.format(new Date())+" PHT";
    clockTimer = setTimeout(updateTime,60000 - Date.now()%60000);
  }

  function layout() {
    layoutFrame = 0;
    const box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const center = clamp(document.documentElement.clientWidth/2-box.left,1,box.width-1);
    const x = clamp(HERO_CONFIG.focal.x,.001,.999);
    const scale = Math.max(box.height/HERO_CONFIG.height,center/(HERO_CONFIG.width*x),
      (box.width-center)/(HERO_CONFIG.width*(1-x)));
    const w = HERO_CONFIG.width*scale, h = HERO_CONFIG.height*scale;
    stage.style.setProperty("--draw-w",w+"px");
    stage.style.setProperty("--draw-h",h+"px");
    stage.style.setProperty("--draw-x",center-w*x+"px");
    stage.style.setProperty("--guide-x",center+"px");
    stage.style.setProperty("--guide-y",h*HERO_CONFIG.focal.y+"px");
  }
  function requestLayout() { if (!layoutFrame) layoutFrame = requestAnimationFrame(layout); }

  function setProfile(profile) {
    const words = profile.name.trim().split(/\s+/);
    const fullName = words.join(" ").toUpperCase();

    // Update the accessible h1
    title.setAttribute("aria-label", profile.name);
    title.setAttribute("data-full-name", fullName);

    // Re-wrap letters with new name
    title.classList.remove("is-revealed");
    nameBlock.classList.remove("is-revealed");
    wrapLetters(title);
    reveal();

    requestLayout();
  }

  document.addEventListener("keydown",event => {
    if (home.hidden || event.key.toLowerCase() !== "d" || event.repeat || event.isComposing ||
        event.altKey || event.ctrlKey || event.metaKey || document.querySelector("dialog[open]") ||
        document.body.classList.contains("drawer-open") || event.target.isContentEditable ||
        event.target.closest?.("input,textarea,select")) return;
    stage.toggleAttribute("data-guides");
  });
  new ResizeObserver(layout).observe(stage);
  window.addEventListener("resize",layout);
  document.fonts.ready.then(requestLayout);
  document.fonts.addEventListener("loadingdone",requestLayout);
  document.addEventListener("portfolio:view",()=>{ requestLayout(); updateTime(); });
  document.addEventListener("visibilitychange",()=>{ updateTime(); });
  layout();
  updateTime();
  return {setProfile};
})();
