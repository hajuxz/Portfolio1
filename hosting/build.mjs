import {mkdir,readdir,readFile,writeFile} from "node:fs/promises";
import "../dist/content.js";
const {defaults,certificateLibrary} = globalThis.PortfolioContent;
const root = new URL("../dist/",import.meta.url);
const files = {};
const workspaceAssets = (await readdir(new URL("assets/workspace/",root))).map(name => "assets/workspace/"+name);
const mime = {txt:"text/plain",html:"text/html",css:"text/css",js:"text/javascript",svg:"image/svg+xml"};
for (const file of ["sunglasses.js","assets/sunglasses/frames.js","workspace-icons.js",...workspaceAssets.filter(name=>!name.endsWith(".woff2")),"index.html","styles.css","portrait.css","navigation-config.js","navigation.js","navigation.css","content.js","app.js","studio.js","assets/portrait-placeholder.svg",...defaults.projects.map(p=>p.image)]) {
  files["/"+file] = {mime:mime[file.split(".").at(-1)],text: await readFile(new URL(file,root),"utf8")};
}
files["/assets/anton/LICENSE"] = {mime:"text/plain",text:await readFile(new URL("assets/anton/LICENSE",root),"utf8")};
const binaryTypes = {pdf:"application/pdf",jpg:"image/jpeg",png:"image/png",webp:"image/webp",woff2:"font/woff2"};
for (const file of new Set(["assets/sunglasses/first.jpg","assets/sunglasses/last.jpg",...workspaceAssets.filter(name=>name.endsWith(".woff2")),defaults.profile.portrait,defaults.profile.auraPortrait,"assets/portrait-normal-mask.png","assets/portrait-aura-mask.png","assets/portrait-photo.webp","assets/portrait-aura.webp","assets/anton/anton-latin-400-normal.woff2",...certificateLibrary.flatMap(c=>[c.file,c.preview])])) {
  files["/"+file] = {mime:binaryTypes[file.split(".").at(-1)],base64:(await readFile(new URL(file,root))).toString("base64")};
}
const worker = await readFile(new URL("worker.mjs",import.meta.url),"utf8");
await mkdir(new URL("server/",root),{recursive:true});
await writeFile(new URL("server/index.js",root),files["/content.js"].text+"\nconst PortfolioContent = globalThis.PortfolioContent;\nconst files = "+JSON.stringify(files)+";\n"+worker);
await mkdir(new URL(".openai/",root),{recursive:true});
await writeFile(new URL(".openai/hosting.json",root),await readFile(new URL("../.openai/hosting.json",import.meta.url)));
