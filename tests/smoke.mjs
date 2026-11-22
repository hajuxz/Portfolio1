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
  await cmd("Emulation.setDeviceMetricsOverride",{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  await cmd("Page.addScriptToEvaluateOnNewDocument",{source:"\n    window.framePaints={dark:0,light:0,bitmaps:0};\n    const originalDraw=CanvasRenderingContext2D.prototype.drawImage;\n    CanvasRenderingContext2D.prototype.drawImage=function(source,...args){\n      const look=this.canvas.parentElement?.dataset.look;\n      if(look){framePaints[look]++;if(source instanceof ImageBitmap)framePaints.bitmaps++;}\n      return originalDraw.call(this,source,...args);\n    };\n  "});
  await cmd("Page.navigate",{url:origin+"/?sequence-desktop#home"});
  await until(()=>evaluate('document.body.classList.contains("ready") && heroFraming.dataset.frame==="1"'));
  const readFrame=()=>evaluate('Number(heroFraming.dataset.frame)');
  const waitTheme=(theme)=>until(()=>evaluate('document.documentElement.dataset.targetTheme==='+JSON.stringify(theme)+' && !document.documentElement.matches(".theme-capture,.theme-fallback")'));
  const goFrame=async index=>{
    await evaluate('scrollTo({top:(heroTrack.offsetHeight-heroStage.clientHeight)*'+(index-1)+'/160,behavior:"instant"})');
    await until(async()=>await readFrame()===index);
  };
  for(const [width,height] of [[1920,1080],[2560,1080],[1366,768],[768,1024],[390,844]]){
    await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:width===390?2:1,mobile:width===390});
    if(width===390){
      await cmd("Page.reload");
      await until(()=>evaluate('document.body.classList.contains("ready") && home.hasAttribute("data-static-mobile")'));
      await until(()=>evaluate('[...heroFraming.querySelectorAll("img")].every(image=>image.complete && image.naturalWidth<=800 && image.currentSrc.endsWith("-mobile.webp"))'));
      const mobileHero=await evaluate(`(()=>{
        const posters=[...heroFraming.querySelectorAll("img")];
        return {
          static:home.hasAttribute("data-static-mobile"),
          travel:home.style.getPropertyValue("--scrub-travel"),
          canvases:[...heroFraming.querySelectorAll("canvas")].every(canvas=>getComputedStyle(canvas).display==="none"),
          posters:posters.every(image=>image.complete && image.naturalWidth<=800 && image.currentSrc.endsWith("-mobile.webp")),
          sequenceRequests:performance.getEntriesByType("resource").filter(entry=>/assets\\/frames\\/.*\\.jpg(?:\\?|$)/.test(entry.name)).length,
          title:homeTitle.textContent.trim()
        };
      })()`);
      assert.deepEqual(mobileHero,{static:true,travel:"0px",canvases:true,posters:true,sequenceRequests:0,title:"CHRISTIAN REY ADOLFO"});
      await until(()=>evaluate('!!document.querySelector("[data-pipeline-placeholder]")'));
      await evaluate('document.querySelector("[data-pipeline-placeholder]").scrollIntoView({block:"center",behavior:"instant"})');
      await until(()=>evaluate('!!document.querySelector("#pipelineToggleBtn")'));
      const mobilePipeline=await evaluate('({label:document.querySelector("#pipelineToggleLabel").textContent,status:document.querySelector("#pipelineStatusText").textContent})');
      assert.deepEqual(mobilePipeline,{label:"Play",status:"Paused"},"The workflow should not auto-play while scrolling on mobile.");
      await cmd("Page.navigate",{url:origin+"/?mobile-work#work"});
      await until(()=>evaluate('document.body.classList.contains("ready") && document.body.dataset.view==="work"'));
      await until(()=>evaluate('[...document.querySelectorAll("#projectsList picture img")].every(image=>image.complete && image.naturalWidth>0 && image.currentSrc.endsWith("-mobile.webp"))'));
      const mobileProjects=await evaluate(`[...document.querySelectorAll("#projectsList picture")].map(picture=>{
        const image=picture.querySelector("img");
        return {source:picture.querySelector("source")?.srcset||"",current:image.currentSrc,width:image.naturalWidth,loading:image.loading,decoding:image.decoding};
      })`);
      assert.equal(mobileProjects.length,3);
      assert.ok(mobileProjects.every(image=>image.source.endsWith("-mobile.webp") && image.current.endsWith("-mobile.webp") && image.width<=1000 && image.loading==="lazy" && image.decoding==="async"));
      await cmd("Page.navigate",{url:origin+"/?mobile-journey#journey"});
      await until(()=>evaluate('document.body.classList.contains("ready") && document.body.dataset.view==="journey"'));
      await until(()=>evaluate('[...document.querySelectorAll("#certificateList picture img")].every(image=>image.complete && image.naturalWidth>0 && image.currentSrc.endsWith("-mobile.webp"))'));
      const mobileCertificates=await evaluate(`[...document.querySelectorAll("#certificateList picture")].map(picture=>{
        const image=picture.querySelector("img");
        return {source:picture.querySelector("source")?.srcset||"",current:image.currentSrc,width:image.naturalWidth,loading:image.loading,decoding:image.decoding};
      })`);
      assert.equal(mobileCertificates.length,3);
      assert.ok(mobileCertificates.every(image=>image.source.endsWith("-mobile.webp") && image.current.endsWith("-mobile.webp") && image.width<=1000 && image.loading==="lazy" && image.decoding==="async"));
    }
    if(width!==390) {
      await until(()=>evaluate('(()=>{const [a,b]=heroFraming.querySelectorAll("canvas"),r=a.getBoundingClientRect(),s=b.getBoundingClientRect(),stage=heroStage.getBoundingClientRect();return a.width===b.width && a.height===b.height && r.x===s.x && r.width===s.width && r.left<=stage.left+.1 && r.right>=stage.right-.1 && r.bottom>=stage.bottom-.1 && Math.abs(r.top-stage.top)<.1 && Math.abs(r.left+r.width*HERO_CONFIG.focal.x-document.documentElement.clientWidth/2)<.1})()'));
      assert.ok(await evaluate('!document.querySelector("#portraitToggle") && localTime.textContent.includes("PHT") && heroAvailability.textContent.length>0'));
    }
    console.log("Aligned and covered",width,height);
  }
  await cmd("Emulation.setDeviceMetricsOverride",{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await cmd("Page.navigate",{url:origin+"/?sequence#home"});
  await until(()=>evaluate('document.body.classList.contains("ready") && heroFraming.dataset.frame==="1"'));
  await evaluate('history.scrollRestoration="manual";document.documentElement.style.scrollBehavior="auto";scrollTo(0,0)');
  await until(()=>evaluate('scrollY===0'));
  // Compare a downsample of each actual backing store to the matching photo on disk.
  async function checkPair(index, both=false) {
    const difference=await evaluate(`(async()=>{const c=document.createElement("canvas");c.width=32;c.height=18;const ctx=c.getContext("2d",{willReadFrequently:true});
      const pixels=source=>{ctx.drawImage(source,0,0,32,18);return ctx.getImageData(0,0,32,18).data};
      const themes=${both} ? ["dark","light"] : [document.documentElement.dataset.targetTheme];
      return Promise.all(themes.map(async theme=>{const img=new Image();img.src=frameURL(theme,${index});await img.decode();
        const live=heroFraming.querySelector('[data-look="'+theme+'"] canvas');
        const reference=document.createElement("canvas"); reference.width=live.width; reference.height=live.height;
        const refCtx=reference.getContext("2d",{alpha:false});refCtx.imageSmoothingQuality="medium";refCtx.drawImage(img,0,0,live.width,live.height);
        const ref=pixels(reference),actual=pixels(live);
        return ref.reduce((sum,n,i)=>sum+Math.abs(n-actual[i]),0)/ref.length;
      }))})()`);
    assert.ok(difference.every(n=>n<2),JSON.stringify({index,difference}));
  }
  for (const index of [1,65,161]) {
    await goFrame(index); await checkPair(index);
    const target=await evaluate('document.documentElement.dataset.targetTheme==="light"?"dark":"light"');
    await evaluate('themeToggle.click();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    await checkPair(index,true); await waitTheme(target);
    assert.equal(await readFrame(),index); await checkPair(index);
    if (index===65) {
      for (const [width,height] of [[1366,768],[390,844]]) {
        await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:width===390?2:1,mobile:width===390});
        await delay(180); assert.equal(await readFrame(),65); await checkPair(65);
      }
    }
    assert.equal(await evaluate('themeLabel.textContent'),target==="light"?"Dark":"Light");
  }
  await goFrame(65);
  await cmd("Emulation.setDeviceMetricsOverride",{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await delay(180);
  // A long fling must advance the visible surface through multiple decoded pictures.
  const steadyTheme=await evaluate('document.documentElement.dataset.targetTheme');
  const other=steadyTheme==="dark"?"light":"dark";
  const counts=await evaluate('({...framePaints})');
  await goFrame(161); await goFrame(1); await goFrame(65);
  const after=await evaluate('({...framePaints})');
  assert.equal(after[other],counts[other],"The hidden surface painted during steady playback");
  assert.ok(after[steadyTheme]-counts[steadyTheme]>3 && after.bitmaps>counts.bitmaps);
  await delay(180); assert.deepEqual(await evaluate('({...framePaints})'),after);
  const before=await evaluate('document.documentElement.dataset.targetTheme');
  const btn=await evaluate('(()=>{const b=themeToggle.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()');
  async function pressTheme(){for(const type of ["mousePressed","mouseReleased"]) await cmd("Input.dispatchMouseEvent",{type,button:"left",clickCount:1,...btn});}
  await pressTheme(); await delay(220);
  const opacity=()=>evaluate('Number(getComputedStyle(heroFraming.lastElementChild).opacity)');
  const middle=await opacity(); assert.ok(middle>0 && middle<1);
  await pressTheme(); assert.equal(await evaluate('document.documentElement.dataset.targetTheme'),before);
  assert.ok(Math.abs(await opacity()-middle)<.2); await waitTheme(before); assert.equal(await readFrame(),65);
  await evaluate('themeToggle.click()'); await goFrame(100); await checkPair(100);
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await cmd("Page.navigate",{url:origin+"/?reduced#home"});
  await until(()=>evaluate(`document.body.classList.contains("ready") && matchMedia("(prefers-reduced-motion: reduce)").matches && !home.hasAttribute("data-scrub") && heroFraming.dataset.frame==="1"`));
  const still=await readFrame();
  await evaluate('scrollTo({top:heroTrack.offsetHeight,behavior:"instant"});themeToggle.click()');
  await delay(150);
  assert.equal(await readFrame(),still);
  await cmd("Emulation.setEmulatedMedia",{features:[]});
  console.log("Paired frames 1, 65, 161, rapid reversal, live scroll during fade and reduced motion passed.");
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
  await cmd("Emulation.setDeviceMetricsOverride",{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await cmd("Page.navigate",{url:origin+"/#skills"});
  await until(()=>evaluate('document.body.classList.contains("ready") && document.body.dataset.view==="skills"'));
  assert.equal(await evaluate('workspaceSidebar.inert'),false);
  assert.equal(await evaluate('skillsGrid.children.length'),6);
  assert.ok(await evaluate('[...skillsGrid.querySelectorAll("img")].every(i=>i.loading==="lazy" && i.decoding==="async")'));
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
      await until(()=>evaluate(`document.documentElement.dataset.theme===${JSON.stringify(theme)} && !document.documentElement.matches(".theme-capture,.theme-fallback")`));
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
  await until(()=>evaluate('themeLabel.textContent==="Dark" && localStorage.getItem(NAV_CONFIG.storageKey)==="light" && !document.documentElement.matches(".theme-capture,.theme-fallback")'));
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
  await until(()=>evaluate('!document.documentElement.matches(".theme-capture,.theme-fallback") && !document.querySelector(".gallery-controls").hidden && !document.getElementById("nextProject").disabled'));
  await evaluate('document.getElementById("nextProject").click()');
  await until(()=>evaluate('document.getElementById("projectsList").scrollLeft > 50'));
  await evaluate('document.getElementById("themeToggle").click()');
  await until(()=>evaluate('document.querySelector(".gallery-controls").hidden && !document.documentElement.matches(".theme-capture,.theme-fallback")'));
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
