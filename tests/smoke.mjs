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
  await cmd("Page.addScriptToEvaluateOnNewDocument",{source:`
    if (location.search==="?no-webgl") {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,options){return type.startsWith("webgl") ? null : get.call(this,type,options);};
    }
    window.shardDraws = [];
    window.releasedGPU={deleteTexture:0,deleteBuffer:0,deleteProgram:0};
    for (const method of Object.keys(releasedGPU)) {
      const original=WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method]=function(resource){
        if (this.canvas.classList.contains("portrait-canvas") && resource) releasedGPU[method]++;
        return original.call(this,resource);
      };
    }
    document.addEventListener("DOMContentLoaded",()=>{window.firstPortraitLabel=document.getElementById("portraitAction")?.textContent;});
    const draw = WebGL2RenderingContext.prototype.drawArraysInstanced;
    WebGL2RenderingContext.prototype.drawArraysInstanced = function(mode, first, vertices, instances) {
      if (this.canvas.classList.contains("portrait-canvas")) shardDraws.push(instances);
      return draw.call(this,mode,first,vertices,instances);
    };
    if (location.hash === "#burst-test") new MutationObserver(()=>{
      const tl=window.gsap?.globalTimeline.getChildren().find(t=>t.data==="portrait-burst");
      if (tl && tl !== window.sampledBurst) {window.sampledBurst=tl;tl.pause().progress(.22);}
    }).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  `});
  await cmd("Page.navigate",{url:origin+"/#burst-test"});
  await until(()=>evaluate('document.body.classList.contains("ready") && !document.getElementById("portraitToggle").hidden'));
  assert.equal(await evaluate('firstPortraitLabel'),"Show Aura");
  assert.equal(await evaluate('document.querySelectorAll("link[rel=preload][as=image]").length'),2);
  const label = () => evaluate('document.getElementById("portraitAction").textContent');
  const clickPortrait = () => evaluate('document.getElementById("portraitToggle").click()');
  const settled = () => evaluate('!document.getElementById("portraitFrame").classList.contains("is-changing")');
  const pressD = () => evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"d",bubbles:true}))');
  const checkTexture = async (id,x,y) => {
    const error=await evaluate(`(()=>{
      sampledBurst.progress(.01).progress(0);
      const gpu=document.querySelector(".portrait-canvas");
      const sample=document.createElement("canvas"), ref=document.createElement("canvas");
      const width=sample.width=ref.width=gpu.width, height=sample.height=ref.height=gpu.height;
      const a=sample.getContext("2d"),b=ref.getContext("2d");
      a.drawImage(gpu,0,0);
      b.fillStyle="white";b.fillRect(0,0,width,height);
      b.drawImage(document.getElementById("${id}"),width*${x},height*${y},width,height);
      const actual=a.getImageData(0,0,width,height).data,expected=b.getImageData(0,0,width,height).data;
      let difference=0;
      for(let i=0;i<actual.length;i+=4) difference+=Math.abs(actual[i]-expected[i]);
      sampledBurst.progress(.22);
      return difference/(width*height);
    })()`);
    assert.ok(error<6,"GPU image differs from the registered portrait: "+error);
  };
  await until(()=>evaluate('window.sampledBurst?.duration()===.5 && !document.querySelector(".portrait-canvas").hidden'));
  await checkTexture("profilePortrait",0,0);
  assert.ok(await evaluate('shardDraws.includes(96) && document.querySelectorAll("#portraitFrame canvas").length===1'));
  assert.ok(await evaluate('performance.now() - performance.getEntriesByType("navigation")[0].loadEventEnd >= 1000'));
  await clickPortrait();
  assert.equal(await label(),"Show Normal","Rapid clicks must not reverse a running transition");
  await evaluate('sampledBurst.resume();true');
  await until(settled);
  await clickPortrait();
  await until(()=>evaluate('window.sampledBurst?.duration()===.7 && sampledBurst.paused()'));
  await checkTexture("auraPortrait",-.01375,-.06375);
  await evaluate('portfolioNav.go("work")');
  await delay(250);
  const offscreenDraws=await evaluate('shardDraws.length');
  await delay(200);
  assert.equal(await evaluate('shardDraws.length'),offscreenDraws);
  await evaluate('portfolioNav.go("home")');
  await until(settled);
  assert.equal(await label(),"Show Aura");
  await pressD();
  assert.ok(await evaluate('[...document.querySelectorAll(".portrait-layer")].every(el=>+getComputedStyle(el).opacity===.5)'));
  await clickPortrait();
  assert.equal(await label(),"Show Aura");
  await pressD();
  assert.ok(await evaluate('getComputedStyle(document.querySelector("[data-portrait=aura]")).opacity==="0"'));
  await evaluate('portfolioNav.go("about")');
  await evaluate('document.getElementById("portraitFrame").remove()');
  await until(()=>evaluate('document.getElementById("portraitToggle").hidden && Object.values(releasedGPU).every(count=>count>0)'));
  console.log("Desktop WebGL bursts in both directions, instanced draws, offscreen pause, lock and debug overlay passed.");
  await cmd("Emulation.setDeviceMetricsOverride",{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await cmd("Page.navigate",{url:origin+"/?lens-test"});
  await until(async()=>await label()==="Show Normal" && await settled());
  const move = (x,y) => cmd("Input.dispatchMouseEvent",{type:"mouseMoved",x,y});
  const lensHidden = () => evaluate('document.querySelector(".aura-lens").hidden');
  const point = await evaluate(`(()=>{
    const b=document.getElementById("portraitFrame").getBoundingClientRect();
    return {x:Math.round(b.left+b.width*.50),y:Math.round(b.top+b.height*.195),
      lower:Math.round(b.top+b.height*.67),left:b.left};
  })()`);
  const patchPixels = async (x,y) => {
    const {data} = await cmd("Page.captureScreenshot",{format:"png",clip:{x:x-7,y:y-7,width:14,height:14,scale:1}});
    return evaluate(`(async()=>{
      const img=new Image();img.src="data:image/png;base64,${data}";await img.decode();
      const c=document.createElement("canvas").getContext("2d");c.drawImage(img,0,0);
      return [...c.getImageData(0,0,14,14).data];
    })()`);
  };
  const diff = (a,b) => a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length;
  const auraEye = await patchPixels(point.x,point.y);
  await clickPortrait(); await until(settled);
  const normalEye = await patchPixels(point.x,point.y), normalTorso = await patchPixels(point.x,point.lower);
  assert.ok(diff(auraEye,normalEye)>12,"The eye sample must distinguish the two portraits");
  await move(point.left-50,point.y);
  await until(async()=>!await lensHidden());
  await move(point.x,point.y);
  await until(()=>evaluate('Number(document.querySelector(".aura-lens").style.getPropertyValue("--lens-alpha"))===1'));
  await until(()=>evaluate('Math.abs(parseFloat(document.querySelector(".aura-lens").style.getPropertyValue("--lens-x"))-document.getElementById("portraitFrame").clientWidth*.5)<2'));
  assert.ok(diff(await patchPixels(point.x,point.y),auraEye)<4,"Lens core must show the registered alternate eye");
  assert.ok(diff(await patchPixels(point.x,point.lower),normalTorso)<2,"Outside the aperture the base must stay visible");
  const moving = await evaluate(`(async()=>{
    const lens=document.querySelector(".aura-lens"), base=document.getElementById("auraPortrait");
    const twin=lens.querySelector('[data-lens-portrait="aura"] img');
    const start=parseFloat(lens.style.getPropertyValue("--lens-x"));
    document.dispatchEvent(new PointerEvent("pointermove",{clientX:${point.x+120},clientY:${point.y+55},pointerType:"mouse"}));
    await new Promise(requestAnimationFrame);
    const shifted=parseFloat(lens.style.getPropertyValue("--lens-x"))-start;
    const original=base.getBoundingClientRect(), overlay=twin.getBoundingClientRect();
    return {shifted,glow:+lens.style.getPropertyValue("--lens-glow"),
      drift:Math.max(Math.abs(original.left-overlay.left),Math.abs(original.top-overlay.top),
        Math.abs(original.width-overlay.width),Math.abs(original.height-overlay.height))};
  })()`);
  assert.ok(moving.shifted>0 && moving.shifted<120 && moving.glow>.35 && moving.drift<.15,
    "The aperture should lag and brighten without shifting the moving eye: "+JSON.stringify(moving));
  await move(point.x+1,point.y);
  await clickPortrait(); await until(settled);
  assert.ok(diff(await patchPixels(point.x,point.y),normalEye)<4,"Stationary lens must reverse when the base swaps");
  await pressD(); assert.equal(await lensHidden(),true); await pressD();
  await move(point.x+5,point.y); await until(async()=>!await lensHidden());
  await delay(310);
  await move(2,2);
  await until(()=>evaluate('(()=>{const lens=document.querySelector(".aura-lens");return !lens.hidden && +lens.style.getPropertyValue("--lens-alpha")<.95;})()'));
  await until(lensHidden);
  const idleStyle = await evaluate('document.querySelector(".aura-lens").getAttribute("style")');
  await delay(150);
  assert.equal(await evaluate('document.querySelector(".aura-lens").getAttribute("style")'),idleStyle);
  console.log("Lens proximity, registration in both directions, outer pixels, debug, exit and idle state passed.");
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
  await keypress("k",2); await cmd("Input.insertText",{text:"swpr"});
  await keypress("Enter");
  await until(async()=>await active()==="home" && await settled());
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
  for (const width of [320,390,768,1024,1536]) {
    await cmd("Emulation.setDeviceMetricsOverride",{width,height:864,deviceScaleFactor:1,mobile:false});
    const layout = await evaluate(`(() => {
      const title = document.getElementById("heroName");
      const lines = [...title.children].map(line => {
        const range = document.createRange(); range.selectNodeContents(line);
        return range.getClientRects().length === 1 ? line.textContent : "wrapped";
      });
      const portrait = document.getElementById("profilePortrait").getBoundingClientRect();
      const button = document.getElementById("portraitToggle").getBoundingClientRect();
      const separate = innerWidth <= 820 ? +getComputedStyle(document.getElementById("portraitToggle")).zIndex > +getComputedStyle(document.getElementById("home"),"::after").zIndex :
        button.right <= portrait.left || button.left >= portrait.right;
      const chrome = document.getElementById("auraPortrait").getBoundingClientRect();
      const deltaX = Math.abs(portrait.left + portrait.width * .49875 - chrome.left - chrome.width * .5125);
      const deltaY = Math.abs(portrait.top + portrait.height * .1925 - chrome.top - chrome.height * .25625);
      return {lines, separate, aligned:deltaX < .1 && deltaY < .1, mobileStack:title.getBoundingClientRect().bottom <= portrait.top,
        pageHeight:document.getElementById("home").offsetHeight, size:parseFloat(getComputedStyle(title).fontSize),width:portrait.width,height:portrait.height};
    })()`);
    assert.deepEqual(layout.lines,["Christian Rey","Adolfo"],"Two-line name at "+width);
    assert.ok(layout.size >= 50 && layout.separate && layout.pageHeight >= 863,"Full-height hero and separate control at "+width);
    assert.ok(layout.aligned && Math.abs(layout.width-layout.height) < .1 && (width <= 820 ? layout.mobileStack : layout.height > 600),"Eye registration and portrait position at "+width+" "+JSON.stringify(layout));
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
  await until(()=>evaluate('document.body.classList.contains("ready") && !document.getElementById("portraitToggle").hidden'));
  await clickPortrait();
  const midFade = () => evaluate('(()=>{const a=getComputedStyle(document.querySelector("[data-portrait=aura]")); return +a.opacity>0 && +a.opacity<1 && a.transform==="none" && a.filter==="none" && a.transitionDuration==="0.3s"})()');
  await until(midFade);
  await until(settled);
  await move(180,500); await delay(90); assert.equal(await lensHidden(),true);
  await delay(1300);
  assert.equal(await label(),"Show Normal","An early click must cancel the automatic transition");
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
  await cmd("Emulation.setEmulatedMedia",{features:[]});
  for (const mode of ["touch","no-webgl"]) {
    await cmd("Emulation.setTouchEmulationEnabled",mode === "touch" ? {enabled:true,maxTouchPoints:1} : {enabled:false});
    await cmd("Page.navigate",{url:origin+"/?"+mode});
    await until(()=>evaluate('document.body.classList.contains("ready") && !document.getElementById("portraitToggle").hidden'));
    await clickPortrait();
    await until(midFade);
    assert.ok(await evaluate('document.querySelector(".portrait-canvas").hidden && !shardDraws.length'));
    await until(settled);
    if (mode==="touch") {
      await move(point.x,point.y); await delay(90); assert.equal(await lensHidden(),true);
      assert.ok(await evaluate('!performance.getEntriesByType("resource").some(r=>r.name.includes("three.module"))'));
    }
  }
  await evaluate('portraitSwitch.destroy()');
  await pressD();
  assert.ok(await evaluate('document.getElementById("portraitToggle").hidden && !document.getElementById("portraitFrame").classList.contains("is-debug")'));
  assert.deepEqual(errors,[]);
  console.log("Browser editing, image upload, shared save, reload, project filter, case study, theme, quick jump and five viewport widths passed.");
} finally {
  ws?.close(); browser?.kill(); server.kill();
}
