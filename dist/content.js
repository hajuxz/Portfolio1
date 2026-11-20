/* The same schema is used by the editor, JSON backups and the publishing server. */
(() => {
  const certificateDirectory = "assets/certificates/";
  const certificateLibrary = [
    {title:"Introduction to AI Literacy and Responsible Use", file:"ai-literacy.png", preview:"ai-literacy.png", format:"PNG"},
    {title:"CCNA: Switching, Routing, and Wireless Essentials", file:"switching-routing-wireless.pdf", preview:"switching-routing-wireless.jpg", format:"PDF"},
    {title:"CCNA: Introduction to Networks", file:"introduction-to-networks.pdf", preview:"introduction-to-networks.jpg", format:"PDF"}
  ].map(record => ({...record, file:certificateDirectory+record.file, preview:certificateDirectory+record.preview}));
  const defaults = {
    version: 2,
    profile: {
      name: "Christian Rey Adolfo", eyebrow: "IT Student at Bukidnon State University",
      headline: "I design interfaces and build the systems behind them, from the first sketch to the final release.",
      roles: "Web Development, Full-Stack and UI/UX", location: "Bukidnon, Philippines",
      availability: "Available for select projects", resume: "",
      portrait: "assets/portrait-normal.jpg", auraPortrait: "assets/portrait-aura.jpg", alt: "Portrait of Christian Rey Adolfo",
      footer: "Independent design & development"
    },
    services: [],
    interests: [
      {title: "Photography", description: "Collecting references for light, framing, and color."},
      {title: "Field recording", description: "Listening for details on walks and recording the sounds of a place."},
      {title: "Sketchbooks", description: "Drawing quick studies of everyday objects and interfaces."}
    ],
    projects: [
      {title: "Real-Time Intramurals Tally System", badge: "Live Platform", role: "Fullstack Developer", category: "Web Application", year: "2024", summary: "University tournament scoring and medal-tracking platform deployed during university-wide sports and socio-cultural competitions.", detail: "Delivered an interactive, zero-latency tournament management experience during Bukidnon State University intramurals, keeping thousands of students, faculty, and athletes updated on tournament rankings in real-time.", overview: "Delivered an interactive, zero-latency tournament management experience during Bukidnon State University intramurals, keeping thousands of students, faculty, and athletes updated on tournament rankings in real-time.", highlights: "Employed non-blocking asynchronous Fetch/AJAX polling for instantaneous scoreboard feeds.\nImplemented automated tie-breaker algorithms and real-time division standings.\nDelivered zero-downtime performance across hundreds of concurrent live campus viewers.", contributions: "Engineered an event scoring and tallying dashboard deployed during university-wide sports and socio-cultural intramural competitions.\nImplemented non-blocking asynchronous data polling via AJAX/Fetch API, streaming score updates to spectator screens and judging panels without page refreshes.\nArchitected automated tie-breaking algorithms and overall championship medal tally aggregators.", tags: "React.js, Backend API, AJAX / Fetch, Analytics", image: "assets/project-intramurals.jpg", images: "assets/project-intramurals.jpg", alt: "Real-Time Intramurals Tally System showing live tournament dashboard", url: ""},
      {title: "Acadex: Offline Study Companion", badge: "Personal Project", role: "Personal Project", category: "Productivity", year: "2024", summary: "All-in-one offline academic and productivity platform empowering students to organize coursework, track assignments, and run focus timers with zero internet reliance.", detail: "An offline-first academic productivity suite designed to help students organize their subjects, track assignments, prepare for exams, and stay focused.", overview: "Architected an offline-first local data layer ensuring instant load performance and uninterrupted study sessions, empowering students to manage assignments and exams without connectivity.", highlights: "Architected offline-first local data layer ensuring instant load performance and uninterrupted study sessions.\nBuilt integrated Pomodoro study timers with customizable focus intervals and session analytics.\nDesigned exam countdown trackers and automated task prioritization queues.", contributions: "Architected offline-first local data layer ensuring instant load performance and uninterrupted study sessions.\nBuilt integrated Pomodoro study timers with customizable focus intervals and session analytics.\nDesigned exam countdown trackers and automated task prioritization queues.", tags: "React.js, Offline-First, IndexedDB, Productivity UI", image: "assets/project-acadex.jpg", images: "assets/project-acadex.jpg", alt: "Acadex offline study companion interface", url: ""},
      {title: "Bukidnon Bus Company", badge: "Capstone Project", role: "Fullstack Developer", category: "Web & Mobile", year: "2024", summary: "Real-time bus tracking and ticketing platform for Bukidnon commuters, with live bus locations, route information, and estimated arrival times. Includes an admin dashboard and a companion mobile app.", detail: "Capstone project developed by a team of four. It helps commuters know where their bus is, check routes and schedules, and buy tickets, while giving admins tools to manage the fleet.", overview: "Capstone project developed by a team of four. It helps commuters know where their bus is, check routes and schedules, and buy tickets, while giving admins tools to manage the fleet.", highlights: "Built live bus tracking so commuters can see buses approaching terminals and bus stops.\nDeveloped an online ticketing flow for passengers.\nBuilt an admin dashboard for managing buses, routes, and schedules, plus a mobile app.", contributions: "Built live bus tracking so commuters can see buses approaching terminals and bus stops.\nDeveloped an online ticketing flow for passengers.\nBuilt an admin dashboard for managing buses, routes, and schedules, plus a mobile app.", tags: "Real-Time GPS Tracking, Ticketing System, Admin Dashboard, Mobile App", image: "assets/project-bukidnon-bus.jpg", images: "assets/project-bukidnon-bus.jpg", alt: "Bukidnon Bus Company platform showing real-time bus tracking", url: ""},
      {title: "BoardWise", badge: "Personal Project", role: "UI/UX Designer", category: "Mobile Design", year: "1st Year", summary: "Boarding house management mobile app concept that helps boarders and owners track dues and payments, with sections for rules, feedback, room, emergency, report, and resident info.", detail: "A design project created during first year of studies. BoardWise is a boarding house management mobile app concept designed in Figma, covering dashboard, profile, transactions, payment screens, and a consistent teal visual identity.", overview: "Boarding house management mobile app concept that helps boarders and owners track dues and payments, with sections for rules, feedback, room, emergency, report, and resident info. Designed as a solo UI/UX project during 1st year.", highlights: "Designed the full mobile UI in Figma, including the home dashboard, profile, transactions, and payment screens.\nDesigned a due-date tracking feature so boarders can see when payments are due.\nCreated a consistent teal visual identity, logo, and splash screen.", contributions: "Designed the full mobile UI in Figma, including the home dashboard, profile, transactions, and payment screens.\nDesigned a due-date tracking feature so boarders can see when payments are due.\nCreated a consistent teal visual identity, logo, and splash screen.", tags: "Figma, UI/UX Design, Prototyping, Mobile App", image: "assets/project-boardwise-combo.jpg", images: "assets/project-boardwise-1.jpg, assets/project-boardwise-2.jpg", alt: "BoardWise mobile app splash screen and dashboard", url: ""},
      {title: "Impasug-ong Stays", badge: "Academic Project", role: "Fullstack Developer", category: "Web & Mobile", year: "3rd Year", summary: "Accommodation platform for staycations, apartments, Airbnb stays, and daily rentals in Impasug-ong, Bukidnon. Guests can explore and book stays, and hosts can list their properties. Includes a mobile app.", detail: "Accommodation platform for staycations, apartments, Airbnb stays, and daily rentals in Impasug-ong, Bukidnon. Guests can explore and book stays, and hosts can list their properties. Includes a mobile app.", overview: "Accommodation platform for staycations, apartments, Airbnb stays, and daily rentals in Impasug-ong, Bukidnon. Guests can explore and book stays, and hosts can list their properties. Includes a companion mobile app.", highlights: "Built guest and host accounts with an explore-stays flow.\nDeveloped listings for traveller-inns, Airbnb stays, and daily rentals.\nExtended the platform with a companion mobile app.", contributions: "Built guest and host accounts with an explore-stays flow.\nDeveloped listings for traveller-inns, Airbnb stays, and daily rentals.\nExtended the platform with a companion mobile app.", tags: "Web Platform, Host and Guest Accounts, Mobile App, Laravel, PHP, MySQL", image: "assets/project-impasugong.jpg", images: "assets/project-impasugong.jpg", alt: "Impasug-ong Stays accommodation platform", url: ""}
    ],
    skills: [
      {title: "AI Tools", description: "", items: "Gemini, Codex, Claude, PyTorch, TensorFlow, OpenCV"},
      {title: "Frontend", description: "", items: "React.js, JavaScript, TypeScript, HTML5 / CSS3, Tailwind CSS, Flutter, Vite, Alpine.js, Sass, Bootstrap, Responsive UI/UX"},
      {title: "Backend", description: "", items: "Node.js, Laravel, Python, PHP, Django, Java, Express.js, C, Dart, Apache, WordPress, Git & GitHub, OOP & MVC, Cisco CCNA, Raspberry Pi"},
      {title: "API's", description: "", items: "RESTful APIs, Postman, FastAPI, GraphQL, Swagger / OpenAPI"},
      {title: "Database", description: "", items: "MySQL, MongoDB, SQL, Firebase, Relational Schemas, Vercel, Render"},
      {title: "Professional and Core", description: "", items: "Problem-Solving, Project Management, Data Analysis, Communication, Adaptability, Time Management, Digital Marketing, Tech Literacy"}
    ],
    certificates: [
      {title:certificateLibrary[0].title,issuer:"Mapúa University · CHED ACHIEVE",date:"14 September 2026",document:certificateLibrary[0].file},
      {title:certificateLibrary[1].title,issuer:"Bukidnon State University · Cisco Networking Academy",date:"23 December 2025",document:certificateLibrary[1].file},
      {title:certificateLibrary[2].title,issuer:"Bukidnon State University · Cisco Networking Academy",date:"16 May 2025",document:certificateLibrary[2].file}
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
  const previousProfile = {
    portrait: "assets/portrait-photo.webp", auraPortrait: "assets/portrait-aura.webp",
    location: "Philippines", eyebrow: "Independent designer & developer", roles: "web applications, design systems, digital products"
  };
  const assetNames = new Set([defaults.profile.portrait, defaults.profile.auraPortrait, previousProfile.portrait, previousProfile.auraPortrait, "assets/portrait-placeholder.svg", ...defaults.projects.map(p => p.image), ...defaults.projects.flatMap(p => (p.images || "").split(",").map(s => s.trim()).filter(Boolean))]);
  const previousSkills = [
      {title: "Design", description: "From early sketches to reusable interface components.", items: "Figma, Prototyping, Typography, Accessibility"},
      {title: "Development", description: "Building responsive experiences for the browser.", items: "JavaScript, HTML, CSS, React, Git"},
      {title: "Data & systems", description: "Structuring information and making patterns legible.", items: "SQL, Data modeling, API design, Charts"}
    ];
  function validate(value) {
    function check(item, template, path) {
      if (path === "profile" && value.version === 1 && item && typeof item === "object") {
        item = {...item};
        for (const [field, previous] of Object.entries(previousProfile)) {
          if (item[field] === previous) item[field] = defaults.profile[field];
        }
      }
      if (path === "profile.auraPortrait" && item === undefined) return defaults.profile.auraPortrait;
      if (path === "profile.portrait" && item === "assets/portrait-placeholder.svg") return defaults.profile.portrait;
      if (path === "profile.alt" && item === "Illustrated studio portrait") return "Portrait of " + value.profile.name;
      // Portfolios saved before certificates existed inherit the supplied documents.
      if (path === "certificates" && item === undefined) return copy(defaults.certificates);
      if (path === "services") return [];
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
        if (item !== 1 && item !== defaults.version) throw Error("This file uses an unsupported portfolio version.");
        return defaults.version;
      }
      if (typeof item !== "string") throw Error("Expected text for " + path);
      const key = path.split(".").pop();
      if (["portrait", "auraPortrait", "image"].includes(key)) {
        if (assetNames.has(item) || (item.length < 1600000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(item))) return item;
        throw Error("Please upload a supported image for " + path);
      }
      if (key === "images") {
        // Comma-separated list of image paths; each must be in the asset whitelist or a data URI
        const parts = item.split(",").map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          if (!assetNames.has(part) && !(part.length < 1600000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(part))) {
            throw Error("Please upload a supported image for " + path);
          }
        }
        return item;
      }
      if (item.length > 5000) throw Error("Please shorten " + path);
      if (key === "document" && !certificateLibrary.some(c => c.file === item) && !safeURL(item)) throw Error("Select an original certificate or enter its full web address.");
      if (["resume","url","github","linkedin","website"].includes(key) && item && !safeURL(item)) throw Error("Enter a full web address for " + path);
      if (key === "email" && item && !/^[^\s@?&#:]+@[^\s@?&#:]+\.[^\s@?&#:]+$/.test(item)) throw Error("Please check the contact email address.");
      if (["accent","secondary"].includes(key) && !/^#[a-f\d]{6}$/i.test(item)) throw Error("Choose a valid color.");
      if (["name","title"].includes(key) && !item.trim()) throw Error("Please fill in " + path);
      return item;
    }
    const checked = check(value, defaults, "");
    if (JSON.stringify(checked.skills) === JSON.stringify(previousSkills)) checked.skills = copy(defaults.skills);
    return checked;
  }
  globalThis.PortfolioContent = {defaults, copy, safeURL, validate, certificateLibrary};
})();
