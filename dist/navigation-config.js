"use strict";

const NAV_CONFIG = {
  views: [
    {id: "home", label: "Home", icon: "home", group: "Workspace", collapsed: true},
    {id: "work", label: "Work", icon: "layers", group: "Workspace"},
    {id: "skills", label: "Skills", icon: "skills", group: "Workspace"},
    {id: "journey", label: "Journey", icon: "route", group: "Workspace"},
    {id: "interests", label: "Interests", icon: "compass", group: "Connect", feature: "interests"},
    {id: "contact", label: "Contact", icon: "mail", group: "Connect"}
  ],
  features: {interests: false, aiButton: false},
  status: {enabled: true, text: "Available for roles"},
  // Blank entries inherit the corresponding Portfolio Studio profile/contact field.
  social: {github: "", linkedin: "", email: ""},
  location: "", version: "v3.0",
  storageKey: "orbitfolio.theme", sidebarKey: "orbitfolio.sidebar.v1",
  timing: {exit: 150, enter: 300, sidebar: 300, stagger: 60, theme: CROSSFADE_MS, icon: CROSSFADE_MS},
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  colors: {
    light: {
      bg: "#ffffff", "sidebar-bg":"#f7f8f8", "card-bg":"#fafbfb", "chip-bg":"#ffffff", "card-shadow":"rgb(25 35 45 / .04)", "grid-dot":"#dce1e1", "mark-bg":"#143b3a", "mark-text":"#e7faf4", violet:"#695696", blue:"#386a91", scrim:"rgb(19 26 36 / .36)", text: "#171d30", "nav-bg": "rgb(255 255 255 / .88)", "nav-border": "#dfe2e7",
      "active-pill": "#edf0f3", "cta-bg": "#192238", "cta-text": "#ffffff", secondary: "#505a68",
      focus: "#176b66", status: "#328466", shadow: "rgb(23 31 47 / .10)", "portrait-shadow": "rgb(24 30 38 / .23)"
    },
    dark: {
      bg: "#101217", "sidebar-bg":"#171b20", "card-bg":"#1b2026", "chip-bg":"#242a31", "card-shadow":"rgb(0 0 0 / .15)", "grid-dot":"#30363a", "mark-bg":"#bbdfd5", "mark-text":"#163735", violet:"#c4b5ef", blue:"#9fc6e5", scrim:"rgb(4 7 10 / .6)", text: "#f1f4f8", "nav-bg": "rgb(27 30 38 / .89)", "nav-border": "#444a56",
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
  style.textContent = `:root{${vars(NAV_CONFIG.colors.light)}${vars(timing)}--page-dark:${NAV_CONFIG.colors.dark.bg};--dots-dark:${NAV_CONFIG.colors.dark["grid-dot"]};--page-light:${NAV_CONFIG.colors.light.bg};--dots-light:${NAV_CONFIG.colors.light["grid-dot"]};--nav-ease:${NAV_CONFIG.ease}}html[data-theme="dark"]{${vars(NAV_CONFIG.colors.dark)}}`;
  document.head.append(style);
}
