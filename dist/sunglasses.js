"use strict";

(() => {
  const home = document.getElementById("home"), stage = document.getElementById("heroStage");
  const framing = document.getElementById("heroFraming");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const layers = Array.from(framing.children, el => ({
    theme: el.dataset.look, poster: el.querySelector("img"), canvas: el.querySelector("canvas"),
    ctx: el.querySelector("canvas").getContext("2d",{alpha:false})
  }));
  for (const {theme,poster} of layers) {
    poster.src = frameURL(theme,1) || frameURL("dark",1);
    if (theme === "light" && !FRAME_PATH.light) poster.classList.add("derived-light");
    poster.onerror = () => {
      if (theme !== "light") return;
      poster.onerror = null; poster.classList.add("derived-light"); poster.src = frameURL("dark",1);
    };
  }
  if (layers.some(layer => !layer.ctx)) return; // The first-frame images are always underneath.

  const compressed = new Map(), decoded = new Map(), pending = new Set(), failed = new Set();
  // Keep the scroll-to-frame mapping stable when rotating or resizing the viewport.
  home.style.setProperty("--scrub-travel", Math.max(1500,innerHeight*2.4)+"px");
  const http = /^https?:$/.test(location.protocol);
  let lastWidth = 0, lastHeight = 0;
  let currentFrame = 1, target = 1, position = 1, direction = 1, lastTick = 0;
  let raf = 0, active = false, nearby = false, dirtyScroll = true, dirtySize = true;
  let idleTimer = 0, warming = false, warmIndex = 2, generation = 0;

  // Keep only compressed bytes for the full sequence, with at most eight decoded pairs.
  // A foreground decode reuses an in-flight background request for the same JPEG.
  function bytes(url, priority) {
    if (!compressed.has(url)) {
      const request = fetch(url,{priority}).then(response => {
        if (!response.ok) throw Error("Missing frame");
        return response.blob();
      }).catch(error => { compressed.delete(url); throw error; });
      compressed.set(url,request);
    }
    return compressed.get(url);
  }
  async function readImage(url) {
    const image = new Image();
    image.decoding = "async";
    const src = http ? URL.createObjectURL(await bytes(url,"high")) : url;
    try { image.src = src; await image.decode(); return image; }
    finally { if (http) URL.revokeObjectURL(src); }
  }
  async function loadPair(index) {
    const results = await Promise.all(layers.map(async ({theme,poster}) => {
      const url = frameURL(theme,index);
      if (!url) return null;
      try {
        if (index === 1) { await poster.decode(); return poster; }
        return await readImage(url);
      } catch { return null; }
    }));
    if (!results[0] && !results[1]) throw Error("Frame unavailable");
    return results;
  }
  function wake() { if (active && !raf) raf = requestAnimationFrame(tick); }
  function requestPair(index) {
    if (decoded.has(index) || pending.has(index) || failed.has(index)) return;
    pending.add(index);
    const ticket = generation;
    loadPair(index).then(pair => {
      if (ticket === generation) decoded.set(index,pair);
    }).catch(() => { if (ticket === generation) failed.add(index); }).finally(() => {
      if (ticket === generation) { pending.delete(index); wake(); }
    });
  }
  function schedulePrefetch() {
    if (!active || reduced.matches || !http || warming || idleTimer || warmIndex > FRAME_COUNT || navigator.connection?.saveData) return;
    idleTimer = setTimeout(async () => {
      idleTimer = 0;
      if (!active || reduced.matches) return;
      if (position !== target || pending.size) { schedulePrefetch(); return; }
      warming = true;
      const index = warmIndex++;
      await Promise.allSettled(layers.map(({theme}) => frameURL(theme,index)).filter(Boolean).map(url => bytes(url,"low")));
      warming = false;
      schedulePrefetch();
    },75);
  }
  function warm(index) {
    const wanted = new Set([index,Math.round(target),currentFrame]);
    if (!reduced.matches) {
      for (let step=1; wanted.size<HERO_CONFIG.cachePairs && step<FRAME_COUNT; step++) {
        const next=index+step*direction, back=index-step;
        if (next>=1 && next<=FRAME_COUNT) wanted.add(next);
        if (step===1 && back>=1 && back<=FRAME_COUNT) wanted.add(back);
        if (next<1 || next>FRAME_COUNT) break;
      }
    }
    for (const key of decoded.keys()) if (!wanted.has(key)) decoded.delete(key);
    for (const key of wanted) { if (pending.size>=2) break; requestPair(key); }
  }
  function draw(index) {
    const pair = decoded.get(index);
    // Size both buffers in the same paint, capped at the actual detail in the source.
    const density = Math.min(devicePixelRatio || 1,HERO_CONFIG.maxDpr);
    const width = Math.max(1,Math.min(HERO_CONFIG.width,Math.ceil(framing.offsetWidth*density)));
    const height = Math.max(1,Math.round(width*HERO_CONFIG.height/HERO_CONFIG.width));
    layers.forEach(({ctx,canvas},i) => {
      if (canvas.width!==width || canvas.height!==height) { canvas.width=width; canvas.height=height; }
      const derived = i===1 && (!pair[i] || pair[i].classList?.contains("derived-light"));
      ctx.filter = derived ? "brightness(1.5) contrast(.86)" : "none";
      ctx.drawImage(pair[i] || pair[1-i],0,0,width,height);
    });
    currentFrame = index; // The only displayed index. Theme changes never touch playback.
    framing.dataset.frame = String(index);
    framing.dataset.painted = "";
    dirtySize = false;
  }
  function tick(now) {
    raf = 0;
    if (!active) return;
    if (dirtyScroll) {
      const rect = home.getBoundingClientRect();
      const width = stage.clientWidth, height = stage.clientHeight;
      const travel = Math.max(1,rect.height-height);
      const resized = lastWidth && (width!==lastWidth || height!==lastHeight);
      lastWidth = width; lastHeight = height;
      // Some mobile browsers adjust scrollY on rotation. Restore the logical
      // position before interpreting that automatic scroll as a user scrub.
      if (resized && !reduced.matches) {
        const top = scrollY+rect.top+travel*(target-1)/Math.max(1,FRAME_COUNT-1);
        if (Math.abs(scrollY-top)>1) window.scrollTo({top,behavior:"instant"});
      }
      const progress = resized ? (target-1)/Math.max(1,FRAME_COUNT-1) : Math.min(1,Math.max(0,-rect.top/travel));
      const next = reduced.matches ? currentFrame : 1+(FRAME_COUNT-1)*progress;
      if (next !== target) direction = Math.sign(next-target);
      target = next; dirtyScroll = false;
    }
    const elapsed = Math.min(64,lastTick ? now-lastTick : 16.7);
    position += (target-position)*(1-Math.exp(-elapsed/HERO_CONFIG.scrubLagMs));
    if (Math.abs(target-position)<.035) position=target;
    const index = Math.round(position);
    warm(index);
    // Keep the last good pair on screen while fast scrolling or on a slow connection.
    let best = currentFrame;
    for (const key of decoded.keys()) {
      if (currentFrame<index && key>best && key<=index) best=key;
      if (currentFrame>index && key<best && key>=index) best=key;
    }
    if (decoded.has(best) && (best!==currentFrame || dirtySize)) draw(best);
    lastTick = position===target ? 0 : now;
    if (lastTick) wake(); else schedulePrefetch();
  }
  function invalidate() {
    const scrub = !reduced.matches;
    if (home.hasAttribute("data-scrub")!==scrub) {
      home.toggleAttribute("data-scrub",scrub);
      if (!scrub) position=target=currentFrame;
    }
    dirtyScroll = true; wake();
  }
  function activity() {
    invalidate();
    const next = nearby && !home.hidden && !document.hidden;
    if (next === active) return;
    active = next;
    if (active) { dirtySize = true; invalidate(); }
    else {
      generation++; cancelAnimationFrame(raf); clearTimeout(idleTimer);
      raf = idleTimer = lastTick = 0; pending.clear(); failed.clear();
      for (const index of decoded.keys()) if (index!==currentFrame) decoded.delete(index);
    }
  }
  new IntersectionObserver(([entry]) => { nearby=entry.isIntersecting; activity(); }).observe(stage);
  new ResizeObserver(()=>{ dirtySize=true; invalidate(); }).observe(framing);
  new ResizeObserver(invalidate).observe(home);
  window.addEventListener("scroll",invalidate,{passive:true});
  window.addEventListener("resize",()=>{ dirtySize=true; invalidate(); });
  document.addEventListener("portfolio:view",activity);
  document.addEventListener("visibilitychange",activity);
  reduced.addEventListener("change",()=>{ if (reduced.matches) position=target=currentFrame; activity(); });
  activity();
})();
