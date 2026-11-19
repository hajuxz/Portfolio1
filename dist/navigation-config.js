"use strict";

const NAV_CONFIG = {
  sections: [
    {id: "home", label: "Home"}, {id: "about", label: "About"},
    {id: "work", label: "Work"}, {id: "skills", label: "Skills"},
    {id: "journey", label: "Journey"}, {id: "contact", label: "Contact", cta: true}
  ],
  storageKey: "orbitfolio.theme",
  top: 16, scrollOffset: 80, compactAfter: 80, hideSpeed: 0.85, // speed in CSS px/ms
  timing: {slide: 350, enter: 600, theme: 600, icon: 300, hide: 240, menu: 280, stagger: 50},
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  colors: {
    light: {
      bg: "#ffffff", text: "#171d30", "nav-bg": "rgb(255 255 255 / .88)", "nav-border": "#dfe2e7",
      "active-pill": "#edf0f3", "cta-bg": "#192238", "cta-text": "#ffffff", secondary: "#505a68",
      focus: "#176b66", status: "#328466", shadow: "rgb(23 31 47 / .10)", "portrait-shadow": "rgb(24 30 38 / .23)"
    },
    dark: {
      bg: "#101217", text: "#f1f4f8", "nav-bg": "rgb(27 30 38 / .89)", "nav-border": "#444a56",
      "active-pill": "#353b46", "cta-bg": "#f3f5f8", "cta-text": "#141923", secondary: "#b7becb",
      focus: "#87dace", status: "#78d7ac", shadow: "rgb(0 0 0 / .43)", "portrait-shadow": "rgb(192 211 245 / .35)"
    }
  }
};

// Both palettes are in the cascade before the browser encounters any page content.
{
  const vars = obj => Object.entries(obj).map(([name,value]) => `--${name}:${value};`).join("");
  const timing = Object.fromEntries(Object.entries(NAV_CONFIG.timing).map(([k,v]) => ["nav-"+k,v+"ms"]));
  const style = document.createElement("style");
  style.textContent = `:root{${vars(NAV_CONFIG.colors.light)}${vars(timing)}--nav-top:${NAV_CONFIG.top}px;--nav-offset:${NAV_CONFIG.scrollOffset}px;--nav-ease:${NAV_CONFIG.ease}}html[data-theme="dark"]{${vars(NAV_CONFIG.colors.dark)}}`;
  document.head.append(style);
}
