import {mkdir,readdir,readFile,writeFile} from "node:fs/promises";
import "../dist/content.js";
const {defaults,certificateLibrary,mobileImageFiles} = globalThis.PortfolioContent;
const root = new URL("../dist/",import.meta.url);
const files = {};
const byContent = new Map(), aliases = {};
const workspaceAssets = (await readdir(new URL("assets/workspace/",root))).map(name => "assets/workspace/"+name);
const mime = {txt:"text/plain",html:"text/html",css:"text/css",js:"text/javascript",svg:"image/svg+xml"};
for (const file of ["sequence-config.js","hero.js","frame-cache.js","sunglasses.js","home-sections.js","workspace-icons.js",...workspaceAssets.filter(name=>!name.endsWith(".woff2")),"index.html","styles.css","portrait.css","home-sections.css","navigation-config.js","navigation.js","navigation.css","content.js","app.js","studio.js","assets/portrait-placeholder.svg",...defaults.projects.map(p=>p.image)]) {
  files["/"+file] = {mime:mime[file.split(".").at(-1)],text: await readFile(new URL(file,root),"utf8")};
}
files["/assets/anton/LICENSE"] = {mime:"text/plain",text:await readFile(new URL("assets/anton/LICENSE",root),"utf8")};
const frameFiles = [];
for (const folder of ["dark","white pic"]) {
  const prefix = "assets/frames/"+folder+"/";
  for (const name of await readdir(new URL(prefix,root))) {
    if (/\.(jpe?g|webp)$/i.test(name)) frameFiles.push(prefix+name);
  }
}
// Existing backups and project cards may still point to these optional legacy images.
const optionalPortraits = (await readdir(new URL("assets/",root))).filter(name=>/^portrait-aura[.-]/.test(name)).map(name=>"assets/"+name);
const binaryTypes = {mp4:"video/mp4",webm:"video/webm",pdf:"application/pdf",jpg:"image/jpeg",png:"image/png",webp:"image/webp",woff2:"font/woff2"};
for (const file of new Set([...frameFiles,...optionalPortraits,...mobileImageFiles,...workspaceAssets.filter(name=>name.endsWith(".woff2")),defaults.profile.portrait,"assets/portrait-normal-mask.png","assets/portrait-photo.webp","assets/anton/anton-latin-400-normal.woff2",...certificateLibrary.flatMap(c=>[c.file,c.preview])])) {
  const base64 = (await readFile(new URL(file,root))).toString("base64");
  // Identical exported frames share bytes in the Worker while keeping their public URLs.
  if (byContent.has(base64)) aliases["/"+file] = byContent.get(base64);
  else {
    byContent.set(base64,"/"+file);
    files["/"+file] = {mime:binaryTypes[file.split(".").at(-1)],base64};
  }
}
const worker = await readFile(new URL("worker.mjs",import.meta.url),"utf8");
await mkdir(new URL("server/",root),{recursive:true});
await writeFile(new URL("server/index.js",root),files["/content.js"].text+"\nconst PortfolioContent = globalThis.PortfolioContent;\nconst files = "+JSON.stringify(files)+";\nfor(const [path,src] of Object.entries("+JSON.stringify(aliases)+")) files[path]=files[src];\n"+worker);
await mkdir(new URL(".openai/",root),{recursive:true});
await writeFile(new URL(".openai/hosting.json",root),await readFile(new URL("../.openai/hosting.json",import.meta.url)));
