"use strict";

const heroMedia = (() => {
  const get = id => document.getElementById(id);
  const home = get("home"), stage = get("heroStage");
  const title = get("homeTitle"), time = get("localTime");
  const clock = new Intl.DateTimeFormat("en-PH",{timeZone:"Asia/Manila",hour:"numeric",minute:"2-digit"});
  let layoutFrame=0, clockTimer;
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

  // Two ink colors sit on the same geometry. Only the original contributes to
  // the accessibility tree. The decorative layers never receive pointer events.
  function makeLightInk(selector) {
    const original=stage.querySelector(selector), twin=original.cloneNode(true);
    twin.classList.add("hero-light-ink");
    original.classList.add("hero-dark-ink");
    twin.setAttribute("aria-hidden","true"); twin.inert=true;
    for (const item of twin.querySelectorAll("[id]")) {item.removeAttribute("id");item.removeAttribute("tabindex");}
    original.after(twin);
    function sync() {
      const source=original.querySelectorAll("h1,li span,strong"), destination=twin.querySelectorAll("h1,li span,strong");
      source.forEach((item,i)=>{
        if (item.tagName==="H1") destination[i].replaceChildren(...Array.from(item.children,line=>line.cloneNode(true)));
        else destination[i].textContent=item.textContent;
      });
    }
    new MutationObserver(sync).observe(original,{subtree:true,childList:true,characterData:true});
  }
  makeLightInk(".hero-copy");
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
    // The original top anchor and translate3d live on ONE parent of both frame layers.
    const scale = Math.max(box.height/HERO_CONFIG.height,center/(HERO_CONFIG.width*x),
      (box.width-center)/(HERO_CONFIG.width*(1-x)));
    const w = HERO_CONFIG.width*scale, h = HERO_CONFIG.height*scale;
    stage.style.setProperty("--draw-w",w+"px");
    stage.style.setProperty("--draw-h",h+"px");
    stage.style.setProperty("--draw-x",center-w*x+"px");
    stage.style.setProperty("--guide-x",center+"px");
    stage.style.setProperty("--guide-y",h*HERO_CONFIG.focal.y+"px");
    const widest = Math.max(1,...Array.from(title.children,line => line.offsetWidth));
    stage.style.setProperty("--name-fit",Math.min(1,title.clientWidth/widest));
  }
  function requestLayout() { if (!layoutFrame) layoutFrame = requestAnimationFrame(layout); }

  function setProfile(profile) {
    const words = profile.name.trim().split(/\s+/);
    title.replaceChildren(...[words.slice(0,-1).join(" "),words.at(-1)].filter(Boolean).map(text => {
      const line = document.createElement("span"); line.textContent = text; return line;
    }));
    title.setAttribute("aria-label",profile.name);
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
