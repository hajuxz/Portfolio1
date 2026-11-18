import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp,readFile} from "node:fs/promises";
import {randomBytes} from "node:crypto";
import os from "node:os";
import path from "node:path";
import {setTimeout as delay} from "node:timers/promises";

// Exercises the normal browser editor against an isolated portfolio and browser profile.
const temp = await mkdtemp(path.join(os.tmpdir(),"orbitfolio-check-"));
const browserPath = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const owner = randomBytes(24).toString("hex");
const port = 25000+Math.floor(Math.random()*10000), origin = "http://127.0.0.1:"+port;
const server = spawn(process.execPath,["server.mjs"],{windowsHide:true,env:{...process.env,PORT:String(port),PORTFOLIO_DATA_DIR:temp,PORTFOLIO_QUIET:"1",PORTFOLIO_ADMIN_TOKEN:owner},stdio:"ignore"});
let browser, ws;
async function until(fn, timeout = 15000) {
  const end = Date.now()+timeout;
  while (Date.now()<end) {
    try { const result=await fn(); if (result) return result; } catch {}
    await delay(100);
  }
  throw Error("Timed out waiting for "+fn.toString().slice(0,100));
}
try {
  await until(async()=>(await fetch(origin)).ok);
  const initial = await fetch(origin+"/api/portfolio"), first = await initial.json();
  assert.equal(first.canPublish,false);
  assert.equal(first.content.certificates.length,3);
  for (const certificate of first.content.certificates) {
    const response = await fetch(origin+"/"+certificate.document);
    assert.equal(response.status,200);
    const bytes = await response.arrayBuffer();
    assert.deepEqual(Buffer.from(bytes),await readFile(new URL("../dist/"+certificate.document,import.meta.url)));
  }
  assert.equal((await fetch(origin+"/api/portfolio",{method:"PUT",body:"{}"})).status,403);
  console.log("Visitor API and owner-only write check passed.");
  const debuggingPort = port+11000;
  browser = spawn(browserPath,["--headless=new","--disable-gpu","--no-first-run","--disable-background-networking","--remote-debugging-port="+debuggingPort,"--user-data-dir="+path.join(temp,"browser"),"about:blank"],{windowsHide:true,stdio:"ignore"});
  browser.on("error",()=>{});
  const debuggerURL = await until(async()=>{
    const pages = await (await fetch("http://127.0.0.1:"+debuggingPort+"/json")).json();
    return pages.find(page=>page.type === "page")?.webSocketDebuggerUrl;
  });
  ws = new WebSocket(debuggerURL);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let id = 0;
  const replies = new Map(), errors = [];
  ws.onmessage = event=>{
    const data = JSON.parse(event.data);
    if (data.id && replies.has(data.id)) { replies.get(data.id)(data); replies.delete(data.id); }
    if (data.method === "Runtime.exceptionThrown") errors.push(data.params.exceptionDetails.text);
  };
  const cmd = (method,params={})=>new Promise((resolve,reject)=>{
    const number = ++id;
    replies.set(number,answer=>answer.error ? reject(Error(answer.error.message)) : resolve(answer.result));
    ws.send(JSON.stringify({id:number,method,params}));
  });
  const evaluate = async expression=>{
    const evaluation = await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    assert.ok(!evaluation.exceptionDetails, evaluation.exceptionDetails?.exception?.description);
    return evaluation.result.value;
  };
  await cmd("Runtime.enable");
  await cmd("Page.navigate",{url:origin});
  await until(()=>evaluate('document.body.classList.contains("ready") && !document.getElementById("portraitToggle").hidden'));
  assert.equal(await evaluate('document.getElementById("portraitAction").textContent'),"Show Aura");
  assert.equal(await evaluate('document.querySelectorAll("link[rel=preload][as=image]").length'),2);
  const midScan = () => evaluate(`(() => {
    const sweep = document.querySelector(".portrait-sweep");
    const aura = document.getElementById("auraPortrait");
    const photo = document.getElementById("profilePortrait");
    const mask = getComputedStyle(aura).clipPath.match(/[-.\\d]+%/g);
    if (!mask || getComputedStyle(sweep).visibility !== "visible") return false;
    const top = parseFloat(mask[2]), bottom = parseFloat(mask[4]);
    if (top < 18 || top > 85) return false;
    const x = new DOMMatrix(getComputedStyle(sweep).transform).m41;
    const box = sweep.getBoundingClientRect();
    return Math.abs(x / box.width * 100 - top) < .15 && Math.abs(top - bottom - 16) < .1
      && JSON.stringify(photo.getBoundingClientRect()) === JSON.stringify(aura.getBoundingClientRect());
  })()`);
  await until(midScan);
  const scanTime = await evaluate('performance.now() - performance.getEntriesByType("navigation")[0].loadEventEnd');
  assert.ok(scanTime >= 1000);
  const label = () => evaluate('document.getElementById("portraitAction").textContent');
  const clickPortrait = () => evaluate('document.getElementById("portraitToggle").click()');
  await until(async()=>await label() === "Show Photo");
  assert.equal(await evaluate('getComputedStyle(document.getElementById("profilePortrait")).visibility'),"hidden");
  await clickPortrait();
  await until(midScan);
  await until(async()=>await label() === "Show Aura");
  await delay(1300);
  assert.ok(await evaluate('getComputedStyle(document.getElementById("auraPortrait")).visibility === "hidden" && getComputedStyle(document.querySelector(".portrait-sweep")).visibility === "hidden"'));
  console.log("Automatic portrait reveal, registered ribbon and mask, reverse scan and stable endpoints passed.");
  await cmd("Page.navigate",{url:origin+"/?editor#admin="+owner});
  await until(()=>evaluate('document.querySelector("#studioDialog")?.open'));
  for (const width of [320,390,768,1024,1536]) {
    await cmd("Emulation.setDeviceMetricsOverride",{width,height:864,deviceScaleFactor:1,mobile:false});
    const layout = await evaluate(`(() => {
      const title = document.getElementById("heroName");
      const text = title.firstChild;
      const intactWords = [...text.data.matchAll(/\\S+/g)].every(word => {
        const range = document.createRange();
        range.setStart(text,word.index);
        range.setEnd(text,word.index + word[0].length);
        return range.getClientRects().length === 1;
      });
      const portrait = document.getElementById("profilePortrait").getBoundingClientRect();
      return {intactWords,size:parseFloat(getComputedStyle(title).fontSize),width:portrait.width,height:portrait.height};
    })()`);
    assert.ok(layout.intactWords && layout.size <= 43,"Name size or wrapping at "+width);
    assert.ok(layout.width > 0 && layout.width <= (width < 680 ? 96 : 176) && layout.height <= 220,"Portrait size at "+width);
  }
  await evaluate('document.querySelector("[data-editor-tab=journey]").click()');
  assert.equal(await evaluate('document.querySelectorAll("#collection-certificates details").length'),3);
  await evaluate('const issuer=document.querySelectorAll("#collection-certificates .repeat-fields input")[1]; issuer.value="Certificate QA"; issuer.dispatchEvent(new Event("input")); document.querySelector("[data-editor-tab=profile]").click()');
  await evaluate('const nameField=document.querySelector("#editor-profile input"); nameField.value="Portfolio QA"; nameField.dispatchEvent(new Event("input"));');
  for (const [index,id] of ["profilePortrait","auraPortrait"].entries()) {
    await evaluate(`(async()=>{
      const imgInput=document.querySelectorAll("#editor-profile input[type=file]")[${index}];
      const c=document.createElement("canvas"); c.width=c.height=4;
      const blob=await new Promise(r=>c.toBlob(r)), files=new DataTransfer();
      files.items.add(new File([blob],"sample.png",{type:"image/png"}));
      imgInput.files=files.files; imgInput.dispatchEvent(new Event("change"));
    })()`);
    await until(()=>evaluate(`document.getElementById("${id}").src.startsWith("data:image/jpeg")`));
  }
  await evaluate('document.getElementById("saveContent").click()');
  await until(()=>evaluate('!document.getElementById("studioDialog").open'));
  await cmd("Page.reload");
  await until(()=>evaluate('document.body.classList.contains("ready") && document.title.startsWith("Portfolio QA")'));
  assert.ok(await evaluate('document.getElementById("profilePortrait").src.startsWith("data:image/jpeg")'));
  assert.ok(await evaluate('document.getElementById("auraPortrait").src.startsWith("data:image/jpeg")'));
  assert.equal(await evaluate('document.querySelector(".certificate-issuer").textContent'),"Certificate QA");
  assert.equal((await (await fetch(origin+"/api/portfolio")).json()).content.profile.name,"Portfolio QA");
  assert.equal(JSON.parse(await readFile(path.join(temp,"portfolio.json"),"utf8")).profile.name,"Portfolio QA");
  await evaluate('document.querySelectorAll(".filter-button")[1].click(); document.querySelector(".project-open").click()');
  assert.equal(await evaluate('document.getElementById("projectDialog").open && document.querySelectorAll(".project-card").length === 1'),true);
  await evaluate('document.getElementById("projectDialog").close(); document.getElementById("themeToggle").click(); document.getElementById("commandButton").click()');
  assert.ok(await evaluate('document.getElementById("commandDialog").open'));
  await evaluate('document.getElementById("commandDialog").close()');
  await cmd("Emulation.setDeviceMetricsOverride",{width:390,height:850,deviceScaleFactor:1,mobile:false});
  await evaluate(`if (document.documentElement.dataset.theme === "light") document.getElementById("mobileThemeToggle").click();
    document.querySelector(".filter-button").click();`);
  assert.ok(await evaluate('!document.querySelector(".gallery-controls").hidden && !document.getElementById("nextProject").disabled'));
  await evaluate('document.getElementById("nextProject").click()');
  await until(()=>evaluate('document.getElementById("projectsList").scrollLeft > 50'));
  await evaluate('document.getElementById("mobileThemeToggle").click()');
  assert.ok(await evaluate('document.querySelector(".gallery-controls").hidden'));
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await cmd("Page.reload");
  await until(()=>evaluate('document.body.classList.contains("ready") && !document.getElementById("portraitToggle").hidden'));
  await clickPortrait();
  const midFade = () => evaluate('(()=>{const a=getComputedStyle(document.getElementById("auraPortrait"));return Number(a.opacity)>0 && Number(a.opacity)<1 && a.clipPath==="none" && getComputedStyle(document.querySelector(".portrait-sweep")).visibility==="hidden"})()');
  await until(midFade);
  await until(async()=>await label() === "Show Photo");
  await delay(1300);
  assert.equal(await label(),"Show Photo","An early click must cancel the automatic transition");
  await clickPortrait();
  await until(midFade);
  await until(async()=>await label() === "Show Aura");
  for (const width of [320,390,768,1024,1440]) {
    await cmd("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:false});
    if (!await evaluate('document.documentElement.scrollWidth <= innerWidth + 1')) {
      const overflow = await evaluate('[...document.querySelectorAll("main *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,20).map(el=>[el.className,Math.round(el.getBoundingClientRect().right)])');
      assert.fail("Horizontal overflow at "+width+" "+JSON.stringify(overflow));
    }
  }
  assert.deepEqual(errors,[]);
  console.log("Browser editing, image upload, shared save, reload, project filter, case study, theme, quick jump and five viewport widths passed.");
} finally {
  ws?.close(); browser?.kill(); server.kill();
}
