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
  browser = spawn(browserPath,["--headless=new","--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-first-run","--disable-background-networking","--remote-debugging-port="+debuggingPort,"--user-data-dir="+path.join(temp,"browser"),"about:blank"],{windowsHide:true,stdio:"ignore"});
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
  await cmd("Page.enable");
  // Record the original JPEG index actually painted, including reverse scrubs.
  await cmd("Page.addScriptToEvaluateOnNewDocument",{source:`
    window.sequenceDraws = [];
    const paint = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image,...args) {
      if (this.canvas.id === "sunglassesSequence") {
        window.sequenceDraws.push(window.sunglassesFrames.indexOf(image.src.split(",")[1]));
      }
      return paint.call(this,image,...args);
    };
  `});
  await cmd("Page.navigate",{url:origin+"/?scroll-frames#home"});
  for (const width of [1280,390]) {
    await cmd("Emulation.setDeviceMetricsOverride",{width,height:800,deviceScaleFactor:1,mobile:false});
    await until(()=>evaluate('document.body.classList.contains("ready") && window.sunglassesFrames?.length === 161'));
    try { await until(()=>evaluate('!scrollY && Math.abs(sunglassesSequence.getBoundingClientRect().top)<1 && sequenceDraws.at(-1)===0')); }
    catch { assert.fail(JSON.stringify(await evaluate('({width:innerWidth,y:scrollY,stage:sunglassesSequence.getBoundingClientRect().toJSON(),home:home.getBoundingClientRect().toJSON(),frames:sequenceDraws.slice(-8),focus:document.activeElement.id,hash:location.hash})'))); }
    assert.ok(await evaluate('home.contains(sunglassesSequence) && document.querySelectorAll("canvas").length===1 && !document.querySelector("#portraitFrame,#portraitToggle,.intro-copy,.intro-meta")'));
    assert.ok(await evaluate('!performance.getEntriesByType("resource").some(r=>/portrait-normal|portrait-aura|three\\.module|gsap\\.min/.test(r.name))'));
    for (const fraction of [0,.5,1,.25,0]) {
      const previous = await evaluate('({index:sequenceDraws.at(-1),count:sequenceDraws.length})');
      await evaluate(`(()=>{const end=document.documentElement.scrollHeight-innerHeight; scrollTo({top:end*${fraction},behavior:"instant"})})()`);
      await until(()=>evaluate(`sequenceDraws.at(-1) === ${Math.round(fraction*160)} && Math.abs(sunglassesSequence.getBoundingClientRect().top)<2`));
      if (previous.index != null) {
        const direction = Math.sign(Math.round(fraction*160) - previous.index);
        const drawn = await evaluate('sequenceDraws.slice('+previous.count+')');
        assert.ok(drawn.every((n,i)=>direction*(n-(i ? drawn[i-1] : previous.index))>=0),"Scroll scrub must preserve frame order");
      }
    }
    const draws=await evaluate('sequenceDraws.length');
    await delay(160);
    assert.equal(await evaluate('sequenceDraws.length'),draws);
    console.log("Forward, reverse, endpoints and idle frame verified at",width);
  }
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await until(()=>evaluate('getComputedStyle(sunglassesSequence).backgroundImage.includes("last.jpg") && getComputedStyle(sunglassesSequence).position==="static" && getComputedStyle(home,"::after").display==="none" && sunglassesSequence.getContext("2d").getImageData(20,20,1,1).data[3]===0'));
  await cmd("Emulation.setEmulatedMedia",{features:[]});
  await cmd("Emulation.setDeviceMetricsOverride",{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  const active = () => evaluate('document.body.dataset.view');
  async function clickVisible(selector) {
    const position = await until(()=>evaluate(`(async()=>{
      const el=document.querySelector(${JSON.stringify(selector)}), r=el.getBoundingClientRect();
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const after=el.getBoundingClientRect();
      if(Math.abs(r.left-after.left)>.3 || Math.abs(r.top-after.top)>.3) return null;
      const x=after.left+after.width/2, y=after.top+after.height/2;
      return r.width && el.contains(document.elementFromPoint(x,y)) ? {x,y} : null;
    })()`));
    await cmd("Input.dispatchMouseEvent",{type:"mouseMoved",...position});
    await cmd("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,...position});
    await cmd("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",clickCount:1,...position});
  }
  const keypress = async (key,modifiers=0)=> {
    const code={Escape:27,Tab:9,ArrowDown:40,ArrowUp:38,Enter:13,k:75}[key];
    for (const type of ["keyDown","keyUp"]) await cmd("Input.dispatchKeyEvent",{type,key,modifiers,windowsVirtualKeyCode:code});
  };
  await cmd("Page.navigate",{url:origin+"/#skills"});
  await until(()=>evaluate('document.body.classList.contains("ready") && document.body.dataset.view==="skills"'));
  assert.equal(await evaluate('workspaceSidebar.inert'),false);
  assert.equal(await evaluate('skillsGrid.children.length'),6);
  assert.ok(await evaluate('[...skillsGrid.querySelectorAll("img")].every(i=>i.complete && i.naturalWidth)'));
  await clickVisible("#closeSidebar");
  await until(()=>evaluate('workspaceSidebar.inert && !menuTrigger.hidden'));
  await cmd("Page.reload");
  await until(()=>evaluate('document.body.classList.contains("ready") && !menuTrigger.hidden'));
  await keypress("k",2);
  await until(()=>evaluate('commandDialog.open'));
  await cmd("Input.insertText",{text:"jrny"});
  assert.equal(await evaluate('commandResults.textContent'),"Journey");
  await keypress("Enter");
  await until(async()=>await active()==="journey" && await evaluate('!workspaceSidebar.inert'));
  await evaluate("history.back()");
  await until(async()=>await active()==="skills" && await evaluate('workspaceSidebar.inert'));
  await evaluate("history.forward()");
  await until(async()=>await active()==="journey");
  await evaluate('location.hash="not-a-view"');
  await until(()=>evaluate('document.body.dataset.view==="home" && location.hash==="#home" && workspaceSidebar.inert'));
  for (const width of [1440,390]) {
    await cmd("Emulation.setDeviceMetricsOverride",{width,height:850,deviceScaleFactor:1,mobile:false});
    for (const theme of ["light","dark"]) {
      if (await evaluate('document.documentElement.dataset.theme') !== theme) await clickVisible("#themeToggle");
      await until(()=>evaluate(`document.documentElement.dataset.theme===${JSON.stringify(theme)} && !document.documentElement.classList.contains("theme-wipe")`));
      for (const view of ["about","work","skills","journey","contact","home"]) {
        if (await evaluate('workspaceSidebar.inert')) await clickVisible("#menuTrigger");
        await clickVisible('[data-route="'+view+'"]');
        await until(()=>evaluate(`document.body.dataset.view==="${view}" && document.activeElement===document.querySelector("#${view} h1")`));
        const state = await evaluate(`({visible:[...document.querySelectorAll("main > [data-view]")].filter(s=>s.getClientRects().length).map(s=>s.id),hash:location.hash,title:document.title,active:primaryNav.querySelector("[aria-current]").dataset.route,y:scrollY,overflow:document.documentElement.scrollWidth-innerWidth})`);
        assert.deepEqual(state.visible,[view]); assert.equal(state.hash,"#"+view); assert.equal(state.active,view);
        assert.ok(state.title.endsWith(view[0].toUpperCase()+view.slice(1)) && state.y===0 && state.overflow<=1,JSON.stringify(state));
      }
      console.log("All six workspace views, focus and theme passed at",width,theme);
    }
  }
  await clickVisible("#menuTrigger");
  assert.ok(await evaluate('document.body.classList.contains("drawer-open") && document.querySelector("main").inert'));
  await evaluate('document.querySelector(".identity-mark").focus()');
  await keypress("Tab",8);
  assert.ok(await evaluate('document.activeElement===primaryNav.lastElementChild'));
  await keypress("Escape");
  assert.ok(await evaluate('workspaceSidebar.inert && document.activeElement===menuTrigger'));
  await clickVisible("#menuTrigger"); await clickVisible("#commandButton");
  assert.ok(await evaluate('commandDialog.open && !document.body.classList.contains("drawer-open")'));
  await keypress("ArrowDown"); await keypress("Enter");
  await until(async()=>await active()==="about");
  await keypress("k",2); await cmd("Input.insertText",{text:"home"});
  await keypress("Enter");
  await until(async()=>await active()==="home");
  await clickVisible("#menuTrigger");
  const backdropPoint = {x:385,y:450};
  await cmd("Input.dispatchMouseEvent",{type:"mousePressed",...backdropPoint,button:"left",clickCount:1});
  await cmd("Input.dispatchMouseEvent",{type:"mouseReleased",...backdropPoint,button:"left",clickCount:1});
  await until(()=>evaluate('workspaceSidebar.inert && !document.body.classList.contains("drawer-open")'));
  await evaluate('localStorage.removeItem(NAV_CONFIG.storageKey)');
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:"dark"}]});
  await cmd("Page.navigate",{url:origin+"/?theme#skills"});
  await until(()=>evaluate('document.body.classList.contains("ready") && themeLabel.textContent==="Light" && themeToggle.getAttribute("aria-pressed")==="true"'));
  await keypress("k",2); await cmd("Input.insertText",{text:"tgldrk"}); await keypress("Enter");
  await until(()=>evaluate('document.getAnimations().some(a=>a.effect?.getKeyframes().some(k=>k.clipPath?.startsWith("circle(")))'));
  await until(()=>evaluate('themeLabel.textContent==="Dark" && localStorage.getItem(NAV_CONFIG.storageKey)==="light" && !document.documentElement.classList.contains("theme-wipe")'));
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await evaluate('portfolioNav.go("journey")');
  assert.ok(await evaluate('document.activeElement===journeyTitle && !journey.hidden && !journey.getAnimations().length'));
  await cmd("Emulation.setEmulatedMedia",{features:[]});
  await evaluate('localStorage.removeItem(NAV_CONFIG.sidebarKey)');
  await evaluate('localStorage.setItem("orbitfolio.theme","light")');
  await cmd("Page.navigate",{url:origin+"/?editor#admin="+owner});
  await until(()=>evaluate('document.querySelector("#studioDialog")?.open'));
  await evaluate('document.querySelector("[data-editor-tab=journey]").click()');
  assert.equal(await evaluate('document.querySelectorAll("#collection-certificates details").length'),3);
  await evaluate('const issuer=document.querySelectorAll("#collection-certificates .repeat-fields input")[1]; issuer.value="Certificate QA"; issuer.dispatchEvent(new Event("input")); document.querySelector("[data-editor-tab=profile]").click()');
  await evaluate('const nameField=document.querySelector("#editor-profile input"); nameField.value="Portfolio QA"; nameField.dispatchEvent(new Event("input"));');
  await evaluate('document.querySelector("[data-editor-tab=projects]").click()');
  await evaluate(`(async()=>{
    const imgInput=document.querySelector("#editor-projects input[type=file]");
    const c=document.createElement("canvas"); c.width=c.height=4;
    const blob=await new Promise(r=>c.toBlob(r)), files=new DataTransfer();
    files.items.add(new File([blob],"sample.png",{type:"image/png"}));
    imgInput.files=files.files; imgInput.dispatchEvent(new Event("change"));
  })()`);
  await until(()=>evaluate('document.querySelector(".project-card__media img").src.startsWith("data:image/jpeg")'));
  await evaluate('document.getElementById("saveContent").click()');
  await until(()=>evaluate('!document.getElementById("studioDialog").open'));
  await cmd("Page.reload");
  await until(()=>evaluate('document.body.classList.contains("ready") && document.title.startsWith("Portfolio QA")'));
  assert.ok(await evaluate('document.querySelector(".project-card__media img").src.startsWith("data:image/jpeg")'));
  assert.equal(await evaluate('document.querySelector(".certificate-issuer").textContent'),"Certificate QA");
  assert.equal((await (await fetch(origin+"/api/portfolio")).json()).content.profile.name,"Portfolio QA");
  assert.equal(JSON.parse(await readFile(path.join(temp,"portfolio.json"),"utf8")).profile.name,"Portfolio QA");
  await evaluate('portfolioNav.go("work")');
  await evaluate('document.querySelectorAll(".filter-button")[1].click(); document.querySelector(".project-open").click()');
  assert.equal(await evaluate('document.getElementById("projectDialog").open && document.querySelectorAll(".project-card").length === 1'),true);
  await evaluate('document.getElementById("projectDialog").close(); document.getElementById("commandButton").click()');
  assert.ok(await evaluate('document.getElementById("commandDialog").open'));
  await evaluate('document.getElementById("commandDialog").close()');
  await cmd("Emulation.setDeviceMetricsOverride",{width:390,height:850,deviceScaleFactor:1,mobile:false});
  await evaluate(`if (document.documentElement.dataset.theme === "light") document.getElementById("themeToggle").click();
    document.querySelector(".filter-button").click();`);
  await until(()=>evaluate('!document.documentElement.classList.contains("theme-wipe") && !document.querySelector(".gallery-controls").hidden && !document.getElementById("nextProject").disabled'));
  await evaluate('document.getElementById("nextProject").click()');
  await until(()=>evaluate('document.getElementById("projectsList").scrollLeft > 50'));
  await evaluate('document.getElementById("themeToggle").click()');
  await until(()=>evaluate('document.querySelector(".gallery-controls").hidden && !document.documentElement.classList.contains("theme-wipe")'));
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await cmd("Page.navigate",{url:origin+"/#home"});
  await until(()=>evaluate('document.body.classList.contains("ready") && !home.hidden'));
  for (const width of [320,390,768,1024,1440]) {
    await cmd("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:false});
    if (!await evaluate('document.documentElement.scrollWidth <= innerWidth + 1')) {
      const overflow = await evaluate('[...document.querySelectorAll("main *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,20).map(el=>[el.className,Math.round(el.getBoundingClientRect().right)])');
      assert.fail("Horizontal overflow at "+width+" "+JSON.stringify(overflow));
    }
  }
  await cmd("Emulation.setEmulatedMedia",{features:[]});
  assert.deepEqual(errors,[]);
  console.log("Browser editing, image upload, shared save, reload, project filter, case study, theme, quick jump and five viewport widths passed.");
} finally {
  ws?.close(); browser?.kill(); server.kill();
}
