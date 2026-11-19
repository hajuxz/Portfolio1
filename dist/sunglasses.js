"use strict";

(() => {
  const canvas = document.getElementById("sunglassesSequence");
  const hero = document.getElementById("home"), main = hero.parentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const context = canvas.getContext("2d");
  if (!context) { canvas.dataset.still = ""; return; }

  const cache = new Map(), loading = new Set(), failed = new Set();
  let bundle, nearby = false, active = false, generation = 0;
  let frame = 0, target = 0, position = 0, painted = -1, direction = 1;
  let lastTick = 0, measure = true;

  // Fetch all compressed JPEGs once. Keep only a small playback window decoded.
  // A classic script also works when the portfolio is opened directly from disk.
  function loadBundle() {
    if (bundle) return bundle;
    const script = document.createElement("script");
    bundle = new Promise((resolve,reject) => {
      script.onload = resolve;
      script.onerror = reject;
      script.src = "assets/sunglasses/frames.js";
      document.head.append(script);
    }).finally(() => script.remove());
    return bundle;
  }
  function wake() {
    if (active && !frame) frame = requestAnimationFrame(tick);
  }
  function decode(index) {
    const version = generation;
    const image = new Image();
    image.decoding = "async";
    loading.add(index);
    image.src = "data:image/jpeg;base64," + globalThis.sunglassesFrames[index];
    image.decode().then(() => {
      if (version === generation) cache.set(index,image);
    }).catch(() => {
      if (version === generation) failed.add(index);
    }).finally(() => {
      if (version !== generation) return;
      loading.delete(index);
      wake();
    });
  }
  function warmWindow(index,last) {
    const wanted = new Set([index,Math.round(target)]);
    for (let i = 1; i <= 8; i++) {
      wanted.add(index + direction*i);
      if (i <= 3) wanted.add(index - direction*i);
    }
    // Retain the displayed frame until its replacement is ready.
    for (const key of cache.keys()) if (key !== painted && !wanted.has(key)) cache.delete(key);
    for (const key of wanted) {
      if (loading.size >= 3) break;
      if (key >= 0 && key <= last && !cache.has(key) && !loading.has(key) && !failed.has(key)) decode(key);
    }
  }
  function tick(now) {
    frame = 0;
    const frames = globalThis.sunglassesFrames;
    if (!active || !frames?.length) return;
    const last = frames.length - 1;
    if (measure) {
      const start = hero.getBoundingClientRect().bottom;
      const travel = main.getBoundingClientRect().bottom - start - canvas.clientHeight;
      const next = last * Math.max(0,Math.min(1,-start / Math.max(1,travel)));
      if (next !== target) direction = Math.sign(next-target);
      target = next;
      measure = false;
    }
    const elapsed = Math.min(64,lastTick ? now-lastTick : 16.7);
    lastTick = now;
    position += (target-position) * (1-Math.exp(-elapsed/75));
    if (Math.abs(target-position) < .035) position = target;
    const index = Math.round(position);
    warmWindow(index,last);
    // Draw only between the current pixels and the playhead. A prefetched endpoint
    // must never flash early and then jump backwards when a closer frame decodes.
    let best = painted;
    for (const key of cache.keys()) {
      if (painted < index && key > best && key <= index) best = key;
      if (painted > index && key < best && key >= index) best = key;
    }
    if (best >= 0 && best !== painted) {
      context.drawImage(cache.get(best),0,0,canvas.width,canvas.height);
      painted = best;
    }
    if (position !== target) wake();
    else lastTick = 0;
  }
  function invalidate() { measure = true; wake(); }
  function updateActivity() {
    const next = nearby && document.body.dataset.view === "home" && !motion.matches && !document.hidden;
    if (!next && (motion.matches || document.body.dataset.view !== "home") && painted !== -1) {
      context.clearRect(0,0,canvas.width,canvas.height);
      painted = -1;
      position = target = 0;
    }
    if (next === active) return;
    active = next;
    if (active) {
      measure = true;
      loadBundle().then(() => {
        delete canvas.dataset.still;
        invalidate();
      }).catch(() => { bundle = undefined; canvas.dataset.still = ""; });
    } else {
      generation++;
      cancelAnimationFrame(frame);
      frame = lastTick = 0;
      cache.clear();
      loading.clear();
      failed.clear();
    }
  }
  new IntersectionObserver(([entry]) => {
    nearby = entry.isIntersecting;
    updateActivity();
  },{rootMargin:"55% 0px"}).observe(canvas);
  const resize = new ResizeObserver(invalidate);
  resize.observe(hero);
  resize.observe(canvas);
  window.addEventListener("scroll",invalidate,{passive:true});
  window.addEventListener("resize",invalidate);
  document.addEventListener("portfolio:view",updateActivity);
  document.addEventListener("visibilitychange",updateActivity);
  motion.addEventListener("change",updateActivity);
})();
