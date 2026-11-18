"use strict";

// Numbers are CSS pixels. Percentages scale with the shared portrait box.
const PORTRAITS = {
  normal: {src: "assets/portrait-normal.jpg", x: 0, y: 0, scale: 1},
  aura:   {src: "assets/portrait-aura.jpg", x: "-1.375%", y: "-6.375%", scale: 1}
};
const EYES = {x: 49.875, y: 19.25}; // Midpoint of the normal pupils, in percent.

const portraitSwitch = (() => {
  const frame = document.getElementById("portraitFrame");
  const toggle = document.getElementById("portraitToggle");
  const label = document.getElementById("portraitAction");
  const previousLabel = toggle.querySelector(".portrait-old-label");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const layers = Object.fromEntries([...frame.querySelectorAll("[data-portrait]")].map(layer => [layer.dataset.portrait, layer]));
  const length = value => typeof value === "number" ? value + "px" : value;
  let active = "normal", description = frame.getAttribute("aria-label"), turns = 0;
  let ready = false, autoDue = false, autoUsed = false, sourceVersion = 0, swapVersion = 0;

  function align() {
    for (const [key, layer] of Object.entries(layers)) {
      const {x, y, scale} = PORTRAITS[key];
      layer.style.setProperty("--x", length(x));
      layer.style.setProperty("--y", length(y));
      layer.style.setProperty("--scale", scale);
    }
    // The artwork scales about its base. Both transition layers zoom about the registered eyes.
    const normal = PORTRAITS.normal;
    frame.style.setProperty("--eye-x", `calc(${50 + (EYES.x - 50) * normal.scale}% + ${length(normal.x)})`);
    frame.style.setProperty("--eye-y", `calc(${100 + (EYES.y - 100) * normal.scale}% + ${length(normal.y)})`);
  }
  align();

  function describe() {
    frame.setAttribute("aria-label", description + (active === "aura" ? " (chrome aura)" : ""));
    label.textContent = active === "normal" ? "Show Aura" : "Show Normal";
    toggle.setAttribute("aria-label", label.textContent + ". Switch portrait");
  }

  function settle() {
    ++swapVersion;
    frame.classList.remove("is-changing", "is-shining");
    toggle.classList.remove("is-changing");
    for (const [key, layer] of Object.entries(layers)) layer.dataset.state = key === active ? "shown" : "idle";
    toggle.setAttribute("aria-disabled", String(frame.classList.contains("is-debug") || !ready));
    describe();
  }

  async function swap() {
    if (!ready || frame.classList.contains("is-changing") || frame.classList.contains("is-debug")) return;
    const version = ++swapVersion;
    const outgoing = active;
    active = active === "normal" ? "aura" : "normal";
    previousLabel.textContent = label.textContent;
    frame.classList.remove("is-shining");
    frame.classList.add("is-changing");
    toggle.classList.add("is-changing");
    toggle.setAttribute("aria-disabled", "true");
    toggle.style.setProperty("--turn", (++turns * 180) + "deg");
    layers[outgoing].dataset.state = "leaving";
    layers[active].dataset.state = "shown";
    describe();

    const fades = layers[active].getAnimations().filter(animation => animation.transitionProperty === "opacity");
    await Promise.allSettled(fades.map(animation => animation.finished));
    if (version !== swapVersion) return;
    settle();
    if (active === "aura" && !motion.matches) frame.classList.add("is-shining");
  }

  toggle.addEventListener("click", () => { autoUsed = true; swap(); });
  document.addEventListener("keydown", event => {
    if (event.key.toLowerCase() !== "d" || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.isContentEditable || event.target.closest?.("input, textarea, select") || document.querySelector("dialog[open]")) return;
    autoUsed = true;
    frame.classList.toggle("is-debug");
    settle();
  });
  motion.addEventListener("change", settle);

  function maybeAuto() {
    if (ready && autoDue && !autoUsed) { autoUsed = true; swap(); }
  }

  // An explicit studio upload takes precedence over the component's source config.
  function setSources(profile = {}) {
    description = profile.alt || "Portrait of " + (profile.name || "the portfolio owner");
    describe();
    let changed = false;
    for (const [key, layer] of Object.entries(layers)) {
      const field = key === "normal" ? "portrait" : "auraPortrait";
      const saved = profile[field];
      const src = saved && saved !== globalThis.PortfolioContent?.defaults.profile[field] ? saved : PORTRAITS[key].src;
      const image = layer.querySelector("img");
      if (image.getAttribute("src") !== src) { image.src = src; changed = true; }
    }
    if (sourceVersion && !changed) return;
    const version = ++sourceVersion;
    ready = false;
    settle();
    toggle.hidden = true;
    const images = Object.values(layers).map(layer => layer.querySelector("img"));
    Promise.all(images.map(image => image.decode())).then(() => {
      if (version !== sourceVersion) return;
      const aura = layers.aura.querySelector("img");
      layers.aura.style.setProperty("--shine-mask", "url(" + JSON.stringify(aura.src) + ")");
      ready = true;
      toggle.hidden = false;
      settle();
      maybeAuto();
    }).catch(() => { if (version === sourceVersion) { active = "normal"; settle(); } });
  }
  const loaded = document.readyState === "complete" ? Promise.resolve() :
    new Promise(resolve => window.addEventListener("load", resolve, {once: true}));
  const deadline = loaded.then(() => new Promise(resolve => setTimeout(resolve, 1000)));
  return {align, setSources, startAuto() { deadline.then(() => { autoDue = true; maybeAuto(); }); }};
})();
