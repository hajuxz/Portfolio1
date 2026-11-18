import {mkdir,readFile,writeFile} from "node:fs/promises";
import "../dist/content.js";
const {defaults,certificateLibrary} = globalThis.PortfolioContent;
const root = new URL("../dist/",import.meta.url);
const files = {};
const mime = {html:"text/html",css:"text/css",js:"text/javascript",svg:"image/svg+xml"};
for (const file of ["index.html","styles.css","portrait.css","content.js","app.js","studio.js","portrait.js","vendor/gsap.min.js","vendor/ScrollTrigger.min.js","assets/portrait-placeholder.svg",...defaults.projects.map(p=>p.image)]) {
  files["/"+file] = {mime:mime[file.split(".").at(-1)],text: await readFile(new URL(file,root),"utf8")};
}
files["/assets/anton/LICENSE"] = {mime:"text/plain",text:await readFile(new URL("assets/anton/LICENSE",root),"utf8")};
const binaryTypes = {pdf:"application/pdf",jpg:"image/jpeg",png:"image/png",webp:"image/webp",woff2:"font/woff2"};
for (const file of new Set([defaults.profile.portrait,defaults.profile.auraPortrait,"assets/portrait-photo.webp","assets/portrait-aura.webp","assets/anton/anton-latin-400-normal.woff2",...certificateLibrary.flatMap(c=>[c.file,c.preview])])) {
  files["/"+file] = {mime:binaryTypes[file.split(".").at(-1)],base64:(await readFile(new URL(file,root))).toString("base64")};
}
const worker = await readFile(new URL("worker.mjs",import.meta.url),"utf8");
await mkdir(new URL("server/",root),{recursive:true});
await writeFile(new URL("server/index.js",root),files["/content.js"].text+"\nconst PortfolioContent = globalThis.PortfolioContent;\nconst files = "+JSON.stringify(files)+";\n"+worker);
await mkdir(new URL(".openai/",root),{recursive:true});
await writeFile(new URL(".openai/hosting.json",root),await readFile(new URL("../.openai/hosting.json",import.meta.url)));
