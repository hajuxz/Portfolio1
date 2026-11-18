/* The same schema is used by the editor, JSON backups and the publishing server. */
(() => {
  const defaults = {
    version: 1,
    profile: {
      name: "Alex Reyes", eyebrow: "Independent designer & developer",
      headline: "I design interfaces and build the systems behind them, from the first sketch to the final release.",
      roles: "web applications, design systems, digital products", location: "Philippines",
      availability: "Available for select projects", resume: "",
      portrait: "assets/portrait-placeholder.svg", alt: "Illustrated studio portrait",
      aboutTitle: "About my practice.", aboutIntro: "I work across interface design, front-end development and data visualization.",
      bio: "I start with the people who will use a product. A conversation, a paper sketch and a working prototype usually teach me more than a long brief.",
      footer: "Independent design & development"
    },
    services: [
      {title: "Interface design", description: "Layouts, prototypes and component libraries for products that need room to grow."},
      {title: "Web development", description: "Responsive websites and applications with accessible interactions and practical content tools."},
      {title: "Data visualization", description: "Dashboards that turn a complex dataset into a clear next decision."}
    ],
    interests: [
      {title: "Photography", description: "Collecting references for light, framing, and color."},
      {title: "Field recording", description: "Listening for details on walks and recording the sounds of a place."},
      {title: "Sketchbooks", description: "Drawing quick studies of everyday objects and interfaces."}
    ],
    projects: [
      {title: "Northstar", category: "Data design", year: "Study 01", summary: "An analytics workspace that puts the weekly trend, breakdown and outliers on one screen.", detail: "This interface study explores how a small team might review product activity together. A single overview leads into focused comparisons without losing the original time range.", highlights: "A shared date range across charts\nConsistent color keys for each metric\nA compact summary for weekly reviews", tags: "Dashboard, Data visualization, UI design", image: "assets/project-northstar.svg", alt: "Northstar concept dashboard with a line chart and a donut chart", url: ""},
      {title: "Civic Atlas", category: "Product design", year: "Study 02", summary: "A map-led directory for finding neighborhood services and checking what is available nearby.", detail: "A directory becomes easier to explore when location and service details stay side by side. This concept pairs a map with a readable list so each view can be used independently.", highlights: "Map and list navigation\nAt-a-glance service summaries\nLayouts for handheld screens", tags: "Mapping, Interaction design, Prototype", image: "assets/project-civic.svg", alt: "Civic Atlas concept showing a map and service summaries", url: ""},
      {title: "Studio Board", category: "Product design", year: "Study 03", summary: "A project dashboard for independent studios to keep briefs, reviews and next steps together.", detail: "The concept centers on one question at the beginning of a studio day: what needs attention? A focused brief and a short list of review items take priority over secondary statistics.", highlights: "One place for the current brief\nReview items grouped by project\nReusable components for smaller teams", tags: "Design systems, Workflow, Interface", image: "assets/project-studio.svg", alt: "Studio Board interface concept with project and review panels", url: ""}
    ],
    skills: [
      {title: "Design", description: "From early sketches to reusable interface components.", items: "Figma, Prototyping, Typography, Accessibility"},
      {title: "Development", description: "Building responsive experiences for the browser.", items: "JavaScript, HTML, CSS, React, Git"},
      {title: "Data & systems", description: "Structuring information and making patterns legible.", items: "SQL, Data modeling, API design, Charts"}
    ],
    journey: [
      {date: "Now", title: "Independent practice", organization: "Design & development", description: "Exploring how small teams can build maintainable digital tools.", type: "Practice"},
      {date: "Previously", title: "Learning by building", organization: "Personal studies", description: "Turning sketches into working prototypes and documenting the decisions along the way.", type: "Learning"}
    ],
    contact: {email: "", intro: "Have a project in mind? Share a little about your goals and timeline.", github: "", linkedin: "", website: ""},
    appearance: {accent: "#3157ff", secondary: "#ff6b4a"}
  };

  const copy = value => JSON.parse(JSON.stringify(value));
  const safeURL = value => {
    if (!value) return "";
    try {
      const parsed = new URL(value);
      return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : "";
    } catch { return ""; }
  };
  const assetNames = new Set([defaults.profile.portrait, ...defaults.projects.map(p => p.image)]);
  function validate(value) {
    function check(item, template, path) {
      if (Array.isArray(template)) {
        if (!Array.isArray(item) || item.length > 80) throw Error("Invalid collection: " + path);
        return item.map((row, index) => check(row, template[0], path + "." + index));
      }
      if (typeof template === "object") {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw Error("Missing group: " + path);
        return Object.fromEntries(Object.entries(template).map(([key, sample]) =>
          [key, check(item[key], sample, path ? path + "." + key : key)]));
      }
      if (path === "version") {
        if (item !== 1) throw Error("This file uses an unsupported portfolio version.");
        return item;
      }
      if (typeof item !== "string") throw Error("Expected text for " + path);
      const key = path.split(".").pop();
      if (["portrait", "image"].includes(key)) {
        if (assetNames.has(item) || (item.length < 1600000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(item))) return item;
        throw Error("Please upload a supported image for " + path);
      }
      if (item.length > 5000) throw Error("Please shorten " + path);
      if (["resume","url","github","linkedin","website"].includes(key) && item && !safeURL(item)) throw Error("Enter a full web address for " + path);
      if (key === "email" && item && !/^[^\s@?&#:]+@[^\s@?&#:]+\.[^\s@?&#:]+$/.test(item)) throw Error("Please check the contact email address.");
      if (["accent","secondary"].includes(key) && !/^#[a-f\d]{6}$/i.test(item)) throw Error("Choose a valid color.");
      if (["name","title"].includes(key) && !item.trim()) throw Error("Please fill in " + path);
      return item;
    }
    return check(value, defaults, "");
  }
  globalThis.PortfolioContent = {defaults, copy, safeURL, validate};
})();
