"use strict";

(() => {
  const home=document.getElementById("home"), stage=document.getElementById("heroStage");
  const framing=document.getElementById("heroFraming");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const layers=Array.from(framing.children,element=>{
    const image=element.querySelector("img"), canvas=element.querySelector("canvas");
    const theme=element.dataset.look;
    image.src=frameURL(theme,1) || frameURL("dark",1);
    if (theme==="light") {
      if (!FRAME_PATH.light) image.classList.add("derived-light");
      image.onerror=()=>{ image.onerror=null; image.classList.add("derived-light"); image.src=frameURL("dark",1); };
    }
    return {theme,canvas,poster:image,ctx:canvas.getContext("2d",{alpha:false}),painted:0};
  });
  if (layers.some(layer=>!layer.ctx)) return;

  const posters=Object.fromEntries(layers.map(layer=>[layer.theme,layer.poster]));
  const cache=createFrameCache(posters,index=>{
    if (!framing.hasAttribute("data-painted") || currentFrame!==Math.round(targetFrame) || index===currentFrame) wake();
  });
  // Native scroll is the sole input. The sticky stage and its shared 3D transform stay in CSS.
  home.style.setProperty("--scrub-travel",Math.max(1500,innerHeight*2.4)+"px");
  let top=0, travel=1, stageWidth=0, stageHeight=0, width=0, height=0;
  let targetFrame=1, committedTarget=1, playhead=1, currentFrame=1;
  let theme=document.documentElement.dataset.targetTheme, blendUntil=0;
  let active=false, near=false, raf=0, previousTime=0, suspended=false;
  let plannedFrame=0, plannedTarget=0, plannedDirection=0;
  const lerp=Math.max(.001,Math.min(1,LERP_SPEED));

  function wake() { if (active && !raf) raf=requestAnimationFrame(tick); }

  // scrollY is the native scroll offset. All element geometry was cached on resize.
  function onScroll() {
    if (!active || reduced.matches) return;
    const progress=Math.max(0,Math.min(1,(window.scrollY-top)/travel));
    targetFrame=1+(FRAME_COUNT-1)*progress;
    wake();
  }

  function measure() {
    if (home.hidden) return;
    const track=document.getElementById("heroTrack") || home;
    const section=track.getBoundingClientRect(), box=stage.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const resized=stageWidth && (box.width!==stageWidth || box.height!==stageHeight);
    stageWidth=box.width; stageHeight=box.height;
    top=section.top+window.scrollY;
    travel=Math.max(1,section.height-box.height);
    // Mobile browsers may move the scroll offset when rotating. Preserve the logical position.
    if (resized && active && !reduced.matches) {
      const restored=top+travel*(committedTarget-1)/Math.max(1,FRAME_COUNT-1);
      if (Math.abs(window.scrollY-restored)>1) window.scrollTo({top:restored,behavior:"instant"});
    }
    const density=Math.min(devicePixelRatio||1,MAX_DPR);
    width=Math.max(1,Math.min(MAX_CANVAS_WIDTH,HERO_CONFIG.width,Math.ceil(framing.offsetWidth*density)));
    height=Math.max(1,Math.round(width*HERO_CONFIG.height/HERO_CONFIG.width));
    onScroll(); wake();
  }

  function plan(index, destination, direction) {
    if (index===plannedFrame && destination===plannedTarget && direction===plannedDirection) return;
    plannedFrame=index; plannedTarget=destination; plannedDirection=direction;
    const wanted=[index];
    if (!reduced.matches) {
      // Predict the next few eased frames, not just consecutive JPEGs near a fling's start.
      let predicted=playhead;
      for (let ahead=0;ahead<3;ahead++) {
        predicted+=(targetFrame-predicted)*lerp;
        wanted.push(Math.round(predicted));
      }
      wanted.push(destination,index+direction,index+2*direction,index-direction);
    }
    wanted.push(currentFrame);
    cache.plan(wanted,destination);
  }

  function paint(index, now) {
    const pair=cache.get(index);
    if (!pair) return;
    const mixing=now<blendUntil && !reduced.matches;
    for (const layer of layers) {
      const {canvas,ctx}=layer;
      if (canvas.width!==width || canvas.height!==height) {
        canvas.width=width; canvas.height=height;
        ctx.imageSmoothingEnabled=true;
        ctx.imageSmoothingQuality="medium";
        layer.painted=0;
      }
      // Refresh the incoming surface on the first fade tick. At rest only one canvas is drawn.
      if ((!mixing && layer.theme!==theme) || layer.painted===index) continue;
      ctx.drawImage(pair[layer.theme],0,0,width,height);
      layer.painted=index;
    }
    cache.protect(index);
    if (currentFrame!==index || !framing.hasAttribute("data-painted")) {
      currentFrame=index;
      framing.dataset.frame=String(index);
      framing.dataset.painted="";
    }
  }

  function tick(now) {
    raf=0;
    if (!active || !width) return;
    committedTarget=targetFrame;
    const elapsed=previousTime ? Math.min(64,now-previousTime) : 1000/60;
    playhead+=(targetFrame-playhead)*(1-Math.pow(1-lerp,elapsed/(1000/60)));
    if (Math.abs(targetFrame-playhead)<.035) playhead=targetFrame;
    const index=Math.round(playhead);
    plan(index,Math.round(targetFrame),targetFrame>=currentFrame?1:-1);
    const best=cache.nearest(index,targetFrame);
    if (best!==null) paint(best,now);
    previousTime=playhead===targetFrame ? 0 : now;
    // If an exact frame is still decoding, its completion wakes us. Never busy-wait for a bitmap.
    if (previousTime) wake();
  }

  function themeChanged(event) {
    if (theme===event.detail) return;
    theme=event.detail;
    blendUntil=reduced.matches ? 0 : performance.now()+CROSSFADE_MS+32;
    wake();
  }
  layers[1].canvas.parentElement.addEventListener("transitionend",event=>{
    if (event.propertyName==="opacity") blendUntil=0;
  });
  function activity() {
    const next=near && !home.hidden && !document.hidden && !suspended;
    active=next;
    home.toggleAttribute("data-scrub",!reduced.matches);
    if (reduced.matches) { targetFrame=committedTarget=playhead=currentFrame; previousTime=0; }
    cache.activity(active,!reduced.matches);
    if (active) { onScroll(); wake(); }
    else { cancelAnimationFrame(raf); raf=previousTime=0; }
  }
  const visibility=new IntersectionObserver(([entry])=>{ near=entry.isIntersecting; activity(); });
  visibility.observe(stage);
  const resize=new ResizeObserver(()=>{
    if (home.hasAttribute("data-scrub")===reduced.matches) activity();
    measure();
  });
  for (const element of [home,stage,framing,document.getElementById("heroTrack")].filter(Boolean)) resize.observe(element);
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",measure);
  document.addEventListener("portfolio:theme-target",themeChanged);
  document.addEventListener("portfolio:view",()=>{ stageWidth=0; activity(); measure(); });
  document.addEventListener("visibilitychange",activity);
  reduced.addEventListener("change",()=>{ plannedFrame=0; activity(); measure(); });
  window.addEventListener("pagehide",event=>{
    suspended=true; activity();
    if (!event.persisted) { resize.disconnect(); visibility.disconnect(); cache.dispose(); }
  });
  window.addEventListener("pageshow",()=>{ suspended=false; activity(); measure(); });
  activity(); measure();
})();
