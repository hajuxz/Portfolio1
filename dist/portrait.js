"use strict";

const CONFIG = {
  portraits: {
    normal: {src:"assets/portrait-normal.jpg", x:0, y:0, scale:1},
    aura: {src:"assets/portrait-aura.jpg", x:"-1.375%", y:"-6.375%", scale:1}
  },
  eyes: {x:49.875, y:19.25},
  ACCENT_COLOR: "#dbe0e6", graphiteColor: "#303338",
  durations: {aura:.5, normal:.7, fallback:.3, introDelay:1, labelOut:.15, labelIn:.19, labelDelay:.11},
  ease: "power3.out", maxDpr:2, edgeWidth:.019, glow:.38, blurPx:6, incomingScale:1.03,
  noise: {resolution:256, scale:13, detailWeight:.22, seed:7163},
  fragments: {count:96, sizePx:[5,19], aspect:[.32,1.2], travel:[.1,.32], spin:[-8,8],
    gravity:.045, scatter:1, center:{x:.5,y:.49}, sampleResolution:96, backgroundCutoff:.94},
  lens: {
    radiusPx: 90, softnessPx: 40, proximityPx: 80, lag: 0.15, wobble: 0.08,
    maxStretch: 1.3, fullSpeedPxPerMs: 1.25, glowIdle: 0.35, glowFast: 0.85,
    enterMs: 300, exitMs: 400
  }
};
const PORTRAITS = CONFIG.portraits; // Preserve the existing live alignment controls.

const portraitSwitch = (() => {
  const frame = document.getElementById("portraitFrame"), canvas = frame.querySelector("canvas");
  const toggle = document.getElementById("portraitToggle"), label = document.getElementById("portraitAction");
  const oldLabel = toggle.querySelector(".portrait-old-label");
  const layers = Object.fromEntries([...frame.querySelectorAll("[data-portrait]")].map(el=>[el.dataset.portrait,el]));
  const images = Object.fromEntries(Object.entries(layers).map(([key,el])=>[key,el.querySelector("img")]));
  const motion = matchMedia("(prefers-reduced-motion: reduce)"), coarse = matchMedia("(any-pointer: coarse)");
  const events = new AbortController(), options = {signal:events.signal};
  const eligible = () => !motion.matches && !coarse.matches && !navigator.maxTouchPoints && !!window.gsap;
  let active="normal", description=frame.getAttribute("aria-label"), turns=0, ready=false, destroyed=false;
  let sourceVersion=0, swapVersion=0, gpuVersion=0, engine=null, preparing=null, gpuFailed=false;
  let inView=false, autoDue=false, autoUsed=false, autoTimer, autoScheduled=false;
  const visible = () => inView && !document.hidden;
  const lens = createAuraLens(frame, layers, CONFIG, events.signal);
  const duration = CONFIG.durations;
  frame.style.setProperty("--portrait-fade",duration.fallback+"s");
  for (const key of ["labelOut","labelIn","labelDelay"]) toggle.style.setProperty("--"+key,duration[key]+"s");

  function align() {
    const unit = value => typeof value === "number" ? value+"px" : value;
    for (const [key,layer] of Object.entries(layers)) {
      const {x,y,scale}=PORTRAITS[key];
      layer.style.setProperty("--x",unit(x)); layer.style.setProperty("--y",unit(y));
      layer.style.setProperty("--scale",scale);
      lens.align(key, unit(x), unit(y), scale);
    }
    const normal=PORTRAITS.normal;
    frame.style.setProperty("--eye-x",`calc(${50+(CONFIG.eyes.x-50)*normal.scale}% + ${unit(normal.x)})`);
    frame.style.setProperty("--eye-y",`calc(${100+(CONFIG.eyes.y-100)*normal.scale}% + ${unit(normal.y)})`);
    if (visible()) engine?.resize();
  }
  align();

  function describe() {
    frame.setAttribute("aria-label",description+(active==="aura" ? " (chrome aura)" : ""));
    label.textContent=active==="normal" ? "Show Aura" : "Show Normal";
    toggle.setAttribute("aria-label",label.textContent+". Switch portrait");
  }
  function settle() {
    ++swapVersion;
    engine?.stop(); canvas.hidden=true;
    frame.classList.remove("is-changing","is-fading","is-webgl");
    toggle.classList.remove("is-changing");
    for (const [key,layer] of Object.entries(layers)) layer.dataset.state=key===active ? "shown" : "idle";
    toggle.setAttribute("aria-disabled",String(!ready || frame.classList.contains("is-debug")));
    describe();
    lens.revealOpposite(active, 0);
    syncLens();
  }
  function syncLens() {
    lens.enable(ready && visible() && !destroyed && !frame.classList.contains("is-debug"));
  }
  function releaseGPU(releaseContext = false) {
    ++gpuVersion; preparing=null;
    engine?.dispose(releaseContext); engine=null;
  }
  function prepareGPU() {
    if (!eligible() || gpuFailed || !ready || destroyed) return null;
    if (engine || preparing) return engine || preparing;
    const version=++gpuVersion;
    preparing=import("./portrait-burst.js").then(async ({createBurst})=>{
      if (destroyed || version!==gpuVersion || !eligible()) return null;
      // DOM image.width follows CSS. Detached images keep native dimensions for GPU storage.
      const entries=await Promise.all(Object.entries(images).map(async ([key,source])=>{
        const image=new Image();
        image.src=source.currentSrc || source.src;
        await image.decode();
        return [key,image];
      }));
      if (destroyed || version!==gpuVersion || !eligible()) return null;
      engine=createBurst(canvas,frame,Object.fromEntries(entries),CONFIG,window.gsap);
      engine.setVisible(visible());
      return engine;
    }).catch(()=>{if (version===gpuVersion) gpuFailed=true;return null;})
      .finally(()=>{if (version===gpuVersion) preparing=null;});
    return preparing;
  }

  async function swap() {
    if (destroyed || !ready || frame.classList.contains("is-changing") || frame.classList.contains("is-debug")) return;
    const version=++swapVersion, from=active;
    active=from==="normal" ? "aura" : "normal";
    frame.classList.add("is-changing");
    toggle.setAttribute("aria-disabled","true");
    const gpu=await prepareGPU();
    if (version!==swapVersion || destroyed) return;
    oldLabel.textContent=label.textContent;
    toggle.classList.toggle("simple-swap",!gpu);
    toggle.classList.add("is-changing");
    toggle.style.setProperty("--turn",(++turns*180)+"deg");
    toggle.style.setProperty("--swap-duration",duration[active]+"s");
    lens.revealOpposite(active, gpu ? duration[active] : duration.fallback);
    describe();
    if (gpu) {
      try {
        frame.classList.add("is-webgl"); canvas.hidden=false;
        if (await gpu.play(from,active)) {if (version===swapVersion) settle();return;}
      } catch { gpuFailed=true; releaseGPU(); }
      if (version!==swapVersion || destroyed) return;
    }
    canvas.hidden=true; frame.classList.remove("is-webgl");
    frame.classList.add("is-fading"); toggle.classList.add("simple-swap");
    layers[from].dataset.state="idle"; layers[active].dataset.state="shown";
    const fades=layers[active].getAnimations().filter(a=>a.transitionProperty==="opacity");
    await Promise.allSettled(fades.map(a=>a.finished));
    if (version===swapVersion && !destroyed) settle();
  }
  function maybeAuto() {
    if (autoDue && ready && visible() && !autoUsed && !destroyed) {autoUsed=true;swap();}
  }
  function onVisibility() {
    engine?.setVisible(visible());
    syncLens();
    if (visible()) {prepareGPU();maybeAuto();}
  }
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;onVisibility();});
  observer.observe(frame);
  const resize=new ResizeObserver(()=>{lens.layout();if (visible()) engine?.resize();});
  resize.observe(frame);
  document.addEventListener("visibilitychange",onVisibility,options);
  toggle.addEventListener("click",()=>{autoUsed=true;swap();},options);
  document.addEventListener("keydown",event=>{
    if (event.key.toLowerCase()!=="d" || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.isContentEditable || event.target.closest?.("input,textarea,select") || document.querySelector("dialog[open]")) return;
    autoUsed=true;frame.classList.toggle("is-debug");settle();
  },options);
  for (const media of [motion,coarse]) media.addEventListener("change",()=>{
    settle();releaseGPU();if (visible()) prepareGPU();
  },options);
  canvas.addEventListener("webglcontextlost",event=>{
    event.preventDefault();gpuFailed=true;releaseGPU();
  },options);
  canvas.addEventListener("webglcontextrestored",()=>{gpuFailed=false;if (visible()) prepareGPU();},options);

  function setSources(profile={}) {
    if (destroyed) return;
    description=profile.alt || "Portrait of "+(profile.name || "the portfolio owner");
    describe();
    let changed=false;
    for (const [key,image] of Object.entries(images)) {
      const field=key==="normal" ? "portrait" : "auraPortrait";
      const src=profile[field] && profile[field]!==globalThis.PortfolioContent?.defaults.profile[field] ? profile[field] : PORTRAITS[key].src;
      if (image.getAttribute("src")!==src) {image.src=src;changed=true;}
    }
    if (sourceVersion && !changed) return;
    const version=++sourceVersion;
    ready=false;settle();releaseGPU();toggle.hidden=true;
    lens.setImages(images);
    Promise.all(Object.values(images).map(image=>image.decode())).then(()=>{
      if (version!==sourceVersion || destroyed) return;
      ready=true;toggle.hidden=false;settle();if (visible()) prepareGPU();maybeAuto();
    }).catch(()=>{if (version===sourceVersion && !destroyed) {active="normal";settle();}});
  }
  function startAuto() {
    if (autoScheduled || destroyed) return;
    autoScheduled=true;
    const schedule=()=>{autoTimer=setTimeout(()=>{autoDue=true;maybeAuto();},duration.introDelay*1000);};
    if (document.readyState==="complete") schedule();
    else window.addEventListener("load",schedule,{...options,once:true});
  }
  function destroy() {
    if (destroyed) return;
    destroyed=true;ready=false;++sourceVersion;clearTimeout(autoTimer);
    events.abort();observer.disconnect();resize.disconnect();unmount.disconnect();
    settle();releaseGPU(true);toggle.hidden=true;
  }
  const unmount=new MutationObserver(()=>{if (!frame.isConnected || !toggle.isConnected) destroy();});
  unmount.observe(document.body,{childList:true,subtree:true});
  window.addEventListener("pagehide",e=>{if (!e.persisted) destroy();},options);
  return {align,setSources,startAuto,destroy};
})();

// The aperture moves in frame coordinates. Its contents receive the inverse
// transform, so stretching the aperture never moves a face or distorts an image.
function createAuraLens(frame, layers, config, signal) {
  const settings = config.lens;
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mask = "radial-gradient(circle, black, transparent)";
  const supportsMask = CSS.supports("mask-image", mask) || CSS.supports("-webkit-mask-image", mask);
  const hero = frame.closest(".intro-hero");
  const aperture = document.createElement("div");
  aperture.className = "aura-lens";
  aperture.hidden = true;
  aperture.setAttribute("aria-hidden", "true");
  aperture.innerHTML = '<div class="aura-lens-mask"><div class="aura-lens-register"></div></div>';
  const register = aperture.querySelector(".aura-lens-register");
  const copies = {};
  for (const [key, layer] of Object.entries(layers)) {
    const copy = layer.cloneNode(true);
    copy.className = "aura-lens-image";
    copy.removeAttribute("data-portrait");
    copy.removeAttribute("data-state");
    copy.dataset.lensPortrait = key;
    copy.querySelector("img").removeAttribute("id");
    register.append(copy);
    copies[key] = copy;
  }
  frame.append(aperture);
  const style = aperture.style;
  style.setProperty("--lens-accent", config.ACCENT_COLOR);
  const options = {passive: true, signal};
  const frameMs = 1000 / 60;
  let allowed = false, decoded = false, generation = 0, enabled = false, inside = false;
  let pointer = null, bounds = null, heroBounds, zoom = 1;
  let targetX = 0, targetY = 0, x = 0, y = 0;
  let raf = 0, last = 0, started = 0, startLevel = 0, amount = 0;

  function stop() {
    cancelAnimationFrame(raf);
    raf = last = amount = 0;
    inside = false;
    aperture.hidden = true;
  }
  function eligibility() {
    enabled = allowed && decoded && supportsMask && fine.matches && !reduced.matches && !navigator.maxTouchPoints;
    if (!enabled) { pointer = null; stop(); }
    else layout();
  }
  function measure() {
    bounds = frame.getBoundingClientRect();
    heroBounds = hero.getBoundingClientRect();
    const size = getComputedStyle(frame);
    const width = parseFloat(size.width);
    zoom = bounds.width / width || 1;
    style.setProperty("--stage-width", size.width);
    style.setProperty("--stage-height", size.height);
    style.setProperty("--lens-half", ((settings.radiusPx + settings.softnessPx) * 1.2 / zoom) + "px");
  }
  function layout() {
    bounds = null;
    if (enabled && pointer) locate();
  }
  function enterOrLeave(next) {
    if (inside === next) return;
    inside = next;
    started = performance.now();
    startLevel = amount;
    if (next && aperture.hidden) { x = targetX; y = targetY; }
    if (!raf) raf = requestAnimationFrame(paint);
  }
  function locate() {
    if (!bounds) measure();
    const {clientX, clientY} = pointer;
    const dx = Math.max(bounds.left - clientX, 0, clientX - bounds.right);
    const dy = Math.max(bounds.top - clientY, 0, clientY - bounds.bottom);
    const near = Math.hypot(dx, dy) <= settings.proximityPx &&
      clientY >= heroBounds.top && clientY <= heroBounds.bottom &&
      clientX >= heroBounds.left && clientX <= heroBounds.right;
    if (near) {
      targetX = (clientX - bounds.left) / zoom;
      targetY = (clientY - bounds.top) / zoom;
    }
    enterOrLeave(near);
  }
  function forgetPointer() {
    pointer = null;
    enterOrLeave(false);
  }
  function track(event) {
    if (!enabled) return;
    if (event.pointerType === "touch" || event.target.closest?.("dialog[open]")) { forgetPointer(); return; }
    pointer = {clientX:event.clientX, clientY:event.clientY};
    locate();
  }
  // Smooth deterministic noise, sampled continuously even when the pointer rests.
  function noise(t) {
    const i = Math.floor(t), f = t - i;
    const value = n => { const h = Math.sin(n * 127.1 + 3.7) * 43758.5453; return 2 * (h - Math.floor(h)) - 1; };
    return value(i) + (value(i + 1) - value(i)) * f * f * (3 - 2 * f);
  }
  function paint(now) {
    raf = 0;
    const dt = last ? Math.max(1, now - last) : frameMs;
    last = now;
    const t = Math.min(1, Math.max(0, now - started) / (inside ? settings.enterMs : settings.exitMs));
    const back = 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
    amount = inside ? startLevel + (1 - startLevel) * back : startLevel * (1 - t * t * (3 - 2 * t));
    if (!inside && t === 1) { stop(); return; }

    const follow = 1 - (1 - settings.lag) ** (dt / frameMs);
    const dx = (targetX - x) * follow, dy = (targetY - y) * follow;
    x += dx; y += dy;
    const speed = Math.min(1, Math.hypot(dx, dy) * zoom / dt / settings.fullSpeedPxPerMs);
    const seconds = now / 1000, wobble = settings.wobble;
    const pulse = .64 * Math.sin(seconds * 2.7) + .36 * noise(seconds * 1.4);
    const bend = .65 * Math.sin(seconds * 1.9 + 1.1) + .35 * noise(seconds + 9);
    const radius = settings.radiusPx * amount * (1 + wobble * pulse) / zoom;
    const stretch = 1 + (settings.maxStretch - 1) * speed;
    const squash = (1 + wobble * bend) / Math.sqrt(stretch);
    const angle = Math.atan2(dy, dx), c = Math.cos(angle), s = Math.sin(angle);
    const a = stretch*c*c + squash*s*s, b = (stretch-squash)*c*s, d = stretch*s*s + squash*c*c;
    const det = stretch * squash;
    style.setProperty("--lens-x", x.toFixed(3) + "px");
    style.setProperty("--lens-y", y.toFixed(3) + "px");
    style.setProperty("--lens-r", radius.toFixed(3) + "px");
    style.setProperty("--lens-soft", (settings.softnessPx * amount / zoom).toFixed(3) + "px");
    style.setProperty("--lens-shape", `matrix(${a},${b},${b},${d},0,0)`);
    style.setProperty("--lens-inverse", `matrix(${d/det},${-b/det},${-b/det},${a/det},0,0)`);
    style.setProperty("--lens-alpha", Math.min(1, Math.max(0, amount)));
    style.setProperty("--lens-glow", settings.glowIdle + speed * (settings.glowFast - settings.glowIdle));
    aperture.hidden = false;
    raf = requestAnimationFrame(paint);
  }
  document.addEventListener("pointermove", track, options);
  document.addEventListener("pointerout", event => { if (!event.relatedTarget) forgetPointer(); }, options);
  document.addEventListener("pointercancel", forgetPointer, options);
  window.addEventListener("blur", forgetPointer, options);
  window.addEventListener("scroll", layout, {...options, capture:true});
  window.addEventListener("resize", layout, options);
  for (const media of [fine, reduced]) media.addEventListener("change", eligibility, {signal});
  signal.addEventListener("abort", () => { ++generation; stop(); aperture.remove(); }, {once:true});

  return {
    layout,
    enable(value) { allowed = value; eligibility(); },
    align(key, x, y, scale) {
      const art = copies[key].style;
      art.setProperty("--x", x); art.setProperty("--y", y); art.setProperty("--scale", scale);
    },
    setImages(images) {
      const version = ++generation;
      decoded = false; eligibility();
      const loading = Object.entries(images).map(([key, image]) => {
        const copy = copies[key].querySelector("img");
        if (copy.src !== image.src) copy.src = image.src;
        return copy.decode();
      });
      Promise.all(loading).then(() => {
        if (version === generation) { decoded = true; eligibility(); }
      }).catch(() => {}); // A failed preview must leave the base portrait and toggle usable.
    },
    revealOpposite(base, seconds) {
      style.setProperty("--lens-swap", seconds + "s");
      aperture.dataset.reveal = base === "normal" ? "aura" : "normal";
    }
  };
}
