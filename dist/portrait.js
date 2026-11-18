"use strict";
const portraitSwitch = (() => {
  const frame = document.getElementById("portraitFrame");
  const photo = document.getElementById("profilePortrait");
  const aura = document.getElementById("auraPortrait");
  const sweep = frame.querySelector(".portrait-sweep");
  const ribbon = sweep.querySelector("img");
  const toggle = document.getElementById("portraitToggle");
  const action = document.getElementById("portraitAction");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let description, showingAura = false, targetAura = false, timeline;
  let generation = 0, ready = false, autoDue = false, autoUsed = false;

  function describe() {
    frame.setAttribute("aria-label", showingAura ? description + " (chrome aura)" : description);
    action.textContent = showingAura ? "Show Photo" : "Show Aura";
  }

  function settle(next) {
    timeline?.kill();
    timeline = null;
    showingAura = next;
    photo.style.visibility = next ? "hidden" : "visible";
    aura.style.visibility = next ? "visible" : "hidden";
    for (const image of [photo, aura]) {
      image.style.clipPath = "none";
      image.style.opacity = "1";
    }
    sweep.style.visibility = "hidden";
    toggle.removeAttribute("aria-disabled");
    describe();
  }

  function transition() {
    if (!ready || timeline) return;
    targetAura = !showingAura;
    if (!window.gsap) { settle(targetAura); return; }
    toggle.setAttribute("aria-disabled", "true");
    photo.style.visibility = aura.style.visibility = "visible";
    timeline = gsap.timeline({paused: true, onComplete: () => settle(targetAura)});
    if (motion.matches || !ribbon.naturalWidth) {
      const fade = {duration: .2, ease: "sine.inOut"};
      timeline.fromTo(photo, {opacity: showingAura ? 0 : 1}, {opacity: targetAura ? 0 : 1, ...fade}, 0)
        .fromTo(aura, {opacity: showingAura ? 1 : 0}, {opacity: targetAura ? 1 : 0, ...fade}, 0);
    } else {
      // The strip's leading edge slopes left by 16% of the frame width from top to bottom.
      const bounds = frame.getBoundingClientRect();
      const right = Math.max(124, (document.documentElement.clientWidth - bounds.left) / bounds.width * 100 + 20);
      const start = targetAura ? -8 : right, end = targetAura ? right : -8;
      const mask = (x, edge) => `polygon(${edge}% 0%, ${x}% 0%, ${x - 16}% 100%, ${edge}% 100%)`;
      const timing = {duration: 1.2, ease: "power2.inOut"};
      sweep.style.visibility = "visible";
      timeline.fromTo(aura, {clipPath: mask(start, 0)}, {clipPath: mask(end, 0), ...timing}, 0)
        .fromTo(photo, {clipPath: mask(start, 100)}, {clipPath: mask(end, 100), ...timing}, 0)
        .fromTo(sweep, {xPercent: start}, {xPercent: end, force3D: true, ...timing}, 0)
        .fromTo(sweep, {opacity: 0}, {opacity: 1, duration: .12}, 0)
        .to(sweep, {opacity: 0, duration: .1}, 1.1);
    }
    timeline.play();
  }

  function maybeAuto() {
    if (autoDue && ready && !autoUsed) {
      autoUsed = true;
      transition();
    }
  }
  toggle.addEventListener("click", () => { autoUsed = true; transition(); });
  motion.addEventListener("change", () => { if (timeline) settle(targetAura); });
  const loaded = document.readyState === "complete" ? Promise.resolve() :
    new Promise(resolve => window.addEventListener("load", resolve, {once: true}));
  const deadline = loaded.then(() => new Promise(resolve => setTimeout(resolve, 1000)));

  function setSources(profile) {
    description = profile.alt || ("Portrait of " + profile.name);
    describe();
    if (generation && photo.getAttribute("src") === profile.portrait && aura.getAttribute("src") === profile.auraPortrait) return;
    const current = ++generation;
    ready = false;
    toggle.hidden = true;
    settle(showingAura);
    if (photo.getAttribute("src") !== profile.portrait) photo.src = profile.portrait;
    if (aura.getAttribute("src") !== profile.auraPortrait) aura.src = profile.auraPortrait;
    Promise.all([photo.decode(), aura.decode(), ribbon.decode().catch(() => {})]).then(() => {
      if (current !== generation) return;
      ready = true;
      toggle.hidden = false;
      maybeAuto();
    }).catch(() => { if (current === generation) settle(false); });
  }
  return {setSources, startAuto() { deadline.then(() => { autoDue = true; maybeAuto(); }); }};
})();

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    gsap.to(".intro-shade", {
      opacity: 1, ease: "none",
      scrollTrigger: {trigger: "#home", start: "top top", end: "bottom top", scrub: true}
    });
  });
}
