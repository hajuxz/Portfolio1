import http from "node:http";
import {readFile, writeFile, rename, mkdir} from "node:fs/promises";
import {fileURLToPath,pathToFileURL} from "node:url";
import path from "node:path";
import {randomBytes, createHash, timingSafeEqual} from "node:crypto";
import "./dist/content.js";

const {defaults, validate, certificateLibrary} = globalThis.PortfolioContent;
const port = Number(process.env.PORT || 4173);
const secret = process.env.PORTFOLIO_ADMIN_TOKEN || randomBytes(32).toString("hex");
const root = new URL("./dist/",import.meta.url);
const stateDir = process.env.PORTFOLIO_DATA_DIR ? pathToFileURL(path.resolve(process.env.PORTFOLIO_DATA_DIR)+path.sep) : new URL("./.local/",import.meta.url);
const stateFile = new URL("portfolio.json",stateDir);
const limit = 12*1024*1024;
const mime = {html:"text/html",css:"text/css",js:"text/javascript",svg:"image/svg+xml",pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",webp:"image/webp",woff2:"font/woff2"};
const staticFiles = new Set(["index.html","styles.css","app.js","studio.js","content.js","portrait.js","vendor/gsap.min.js","vendor/ScrollTrigger.min.js","assets/anton/anton-latin-400-normal.woff2","assets/anton/LICENSE","assets/aura-ribbon.svg","assets/portrait-placeholder.svg","assets/portrait-photo.webp","assets/portrait-aura.webp",defaults.profile.portrait,defaults.profile.auraPortrait,...defaults.projects.map(p=>p.image),...certificateLibrary.flatMap(c=>[c.file,c.preview])]);
const hash = value => '"'+createHash("sha256").update(JSON.stringify(value)).digest("hex")+'"';
let content;
try { content = validate(JSON.parse(await readFile(stateFile,"utf8"))); }
catch(error) { if (error.code !== "ENOENT") throw error; content = defaults; }
let revision = hash(content), writing = false;
await mkdir(stateDir,{recursive:true});

function owner(request) {
  const actual = Buffer.from(request.headers.authorization || "");
  const expected = Buffer.from("Bearer "+secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const server = http.createServer(async(req,res)=>{
  const url = new URL(req.url,"http://localhost");
  const send = (status,body="")=>{ res.statusCode = status; res.end(body); };
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  try {
    if (url.pathname === "/api/portfolio") {
      res.setHeader("Cache-Control","no-store");
      res.setHeader("X-Portfolio-Server","1");
      res.setHeader("ETag",revision);
      res.setHeader("Content-Type","application/json; charset=utf-8");
      if (req.method === "GET") return send(200, JSON.stringify({content,canPublish:owner(req)}));
      if (req.method !== "PUT") return send(405);
      if (!owner(req)) return send(403);
      if (!req.headers["content-type"]?.startsWith("application/json")) return send(415);
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > limit) return send(413);
        chunks.push(chunk);
      }
      let next;
      try { next = validate(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { return send(400); }
      if (req.headers["if-match"] !== revision || writing) return send(412);
      writing = true;
      try {
        const tmp = new URL("portfolio.pending.json",stateDir);
        await writeFile(tmp,JSON.stringify(next),"utf8");
        await rename(tmp,stateFile);
        content = next; revision = hash(content);
      } finally {writing = false;}
      res.setHeader("ETag",revision);
      return send(204);
    }
    if (req.method !== "GET" && req.method !== "HEAD") return send(405);
    const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (!staticFiles.has(name)) return send(404);
    const type = name === "assets/anton/LICENSE" ? "text/plain" : mime[name.split(".").at(-1)];
    res.setHeader("Content-Type",type.startsWith("text/") ? type+"; charset=utf-8" : type);
    return send(200,req.method === "HEAD" ? "" : await readFile(new URL(name,root)));
  } catch { return send(500); }
});
server.listen(port,process.env.HOST || "127.0.0.1",()=>{
  if (process.env.PORTFOLIO_QUIET) return;
  console.log("Portfolio: http://localhost:"+port);
  console.log("Private editor: http://localhost:"+port+"/#admin="+encodeURIComponent(secret));
  console.log("Saved content: "+fileURLToPath(stateFile));
});
