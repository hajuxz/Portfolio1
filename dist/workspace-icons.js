"use strict";

// All navigation and fallback icons share a 24px grid and inherit the theme.
const workspaceIcon = (() => {
  const paths = {
    home: "m3 10 9-7 9 7v10h-6v-7H9v7H3Z",
    user: "M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 6 0 0 1 16 0v2",
    layers: "m3 8 9-5 9 5-9 5Zm0 5 9 5 9-5M3 17l9 5 9-5",
    skills: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    route: "M5 6a2 2 0 1 0 0-.1ZM19 18a2 2 0 1 0 0-.1ZM7 6h8a3 3 0 1 1 0 6H9a3 3 0 1 0 0 6h8",
    mail: "M3 5h18v14H3zM3 6l9 7 9-7",
    compass: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-6-4-3 5-5 3 3-5Z",
    menu: "M4 6h16M4 12h12M4 18h16",
    panel: "M3 4h18v16H3zM9 4v16m7-11-3 3 3 3",
    search: "M16.5 10a6.5 6.5 0 1 1-13 0 6.5 6.5 0 1 1 13 0Zm-1.8 5 5.8 5.8",
    pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Zm-5 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
    moon: "M20.5 14.2A8.4 8.4 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z",
    sun: "M16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19",
    github: "M9 21v-4c-4 1-4-2-6-2m12 6v-4c0-1-.3-1.5-1-2 4-.4 6-2 6-6 0-1.4-.4-2.6-1.4-3.6.2-1 .1-2.2-.4-3.4-1.5.1-2.8.7-4 1.6a12 12 0 0 0-5.2 0A8 8 0 0 0 5 2c-.5 1.2-.6 2.4-.4 3.4A5.3 5.3 0 0 0 3.2 9c0 4 2 5.6 6 6-.8.6-1 1.2-1 2",
    linkedin: "M4 9v11m0-16v.4M9 20V9h4v1.6C15 7 21 8 21 13v7m-8 0v-6",
    swap: "M3 8h17m-4-4 4 4-4 4M21 16H4m4-4-4 4 4 4",
    ai: "m12 2 2.3 6.7L21 11l-6.7 2.3L12 20l-2.3-6.7L3 11l6.7-2.3Zm7 15 .8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8Z",
    browser: "M3 4h18v16H3zM3 9h18M6 6.5h.1m3 0h.1m-1 6-2 2 2 2m6-4 2 2-2 2",
    server: "M3 3h18v7H3zM3 14h18v7H3zM6 6.5h.1m0 11h.1M11 6.5h6m-6 11h6",
    api: "M9 3H7a2 2 0 0 0-2 2v4c0 2-2 3-3 3 1 0 3 1 3 3v4a2 2 0 0 0 2 2h2m6-18h2a2 2 0 0 1 2 2v4c0 2 2 3 3 3-1 0-3 1-3 3v4a2 2 0 0 1-2 2h-2",
    database: "M20 6c0 4-16 4-16 0s16-4 16 0Zm0 0v12c0 4-16 4-16 0V6m16 6c0 4-16 4-16 0",
    core: "M3 8h18v13H3zM8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 13c5 3 13 3 18 0m-10 1h2",
    code: "m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18",
    edit: "m4 16 12-12 4 4L8 20l-5 1Zm10-10 4 4"
  };
  return name => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    const path = document.createElementNS(svg.namespaceURI,"path");
    svg.setAttribute("viewBox","0 0 24 24");
    svg.setAttribute("aria-hidden","true");
    svg.classList.add("workspace-icon");
    path.setAttribute("d",paths[name] || paths.code);
    svg.append(path);
    return svg;
  };
})();
