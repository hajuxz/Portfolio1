"use strict";

// Decode outside the animation loop. Full-resolution anchors spread across the whole
// timeline let a cold fling show a nearby real frame, in either direction.
function createFrameCache(posters, onReady) {
  const bytes = new Map(), ready = new Map(), pending = new Map(), failed = new Set();
  const http = /^https?:$/.test(location.protocol);
  const controller = new AbortController();
  const smallDevice = (navigator.deviceMemory || 8) <= 4 || matchMedia("(pointer: coarse)").matches;
  const budget = (smallDevice ? 96 : 192) * 1024 * 1024;
  const capacity = Math.max(8, Math.floor(budget / (2 * HERO_CONFIG.width * HERO_CONFIG.height * 4)));
  const batchSize = Math.max(1, Math.floor(PRELOAD_BATCH_SIZE));

  // Split the largest gap first. Even the first few completed anchors cover the clip.
  const anchors = new Set([1, FRAME_COUNT]);
  const gaps = [[1, FRAME_COUNT]];
  while (gaps.length && anchors.size < Math.ceil(capacity / 2)) {
    const [lo, hi] = gaps.shift();
    if (hi - lo < 2) continue;
    const mid = Math.round((lo + hi) / 2);
    anchors.add(mid);
    gaps.push([lo, mid], [mid, hi]);
  }
  const order = [...anchors, ...Array.from({length:FRAME_COUNT}, (_,i)=>i+1).filter(i=>!anchors.has(i))];
  let wanted = [1], displayed = 1, goal = 1, cursor = 0, foreground = 0, timer = 0;
  let enabled = false, allowBackground = false, batching = false, disposed = false;

  function blobFor(url, priority) {
    if (!bytes.has(url)) {
      bytes.set(url, fetch(url, {priority, signal:controller.signal}).then(res => {
        if (!res.ok) throw Error("Unavailable frame: " + url);
        return res.blob();
      }).catch(error => { bytes.delete(url); throw error; }));
    }
    return bytes.get(url);
  }

  async function decode(theme, index, priority) {
    const url = frameURL(theme, index);
    if (!url) return null;
    let blob, objectURL;
    try {
      if (http) blob = await blobFor(url, priority);
      if (blob && window.createImageBitmap) {
        try { return await createImageBitmap(blob); } catch { /* Try the browser image decoder. */ }
      }
      const img = index===1 ? posters[theme] : new Image();
      if (index!==1) {
        img.decoding = "async";
        img.src = blob ? (objectURL=URL.createObjectURL(blob)) : url;
      }
      await img.decode();
      if (window.createImageBitmap) {
        try { return await createImageBitmap(img); } catch { /* Direct-file and older browser fallback. */ }
      }
      return img;
    } catch { return null; }
    finally { if (objectURL) URL.revokeObjectURL(objectURL); }
  }

  async function lightCopy(dark) {
    // Only used for a missing light export. Bake the legacy look once on decode.
    const w=dark.naturalWidth || dark.width, h=dark.naturalHeight || dark.height;
    const surface = typeof OffscreenCanvas==="function" ? new OffscreenCanvas(w,h) : document.createElement("canvas");
    surface.width=w; surface.height=h;
    const ctx=surface.getContext("2d",{alpha:false});
    ctx.filter="brightness(1.5) contrast(.86)";
    ctx.drawImage(dark,0,0,w,h);
    return surface.transferToImageBitmap ? surface.transferToImageBitmap() : surface;
  }

  function release(pair) {
    for (const image of new Set([pair.dark,pair.light])) image?.close?.();
  }

  function trim() {
    if (ready.size <= capacity) return;
    let victim, worst = -1;
    for (const index of ready.keys()) {
      if (index===displayed || anchors.has(index) || wanted.includes(index)) continue;
      const score = Math.min(...wanted.map(i=>Math.abs(index-i)));
      if (score>worst) { victim=index; worst=score; }
    }
    if (victim!==undefined) { release(ready.get(victim)); ready.delete(victim); }
  }

  function request(index, priority) {
    if (ready.has(index) || failed.has(index)) return Promise.resolve();
    if (pending.has(index)) return pending.get(index);
    const job = Promise.all([decode("dark",index,priority),decode("light",index,priority)])
      .then(async ([dark,light]) => {
        if (!dark) { light?.close?.(); failed.add(index); return; }
        const pair = {dark, light:light || await lightCopy(dark).catch(()=>dark)};
        if (disposed) { release(pair); return; }
        ready.set(index,pair);
        trim();
        if (enabled && ready.has(index)) onReady(index);
      }).catch(()=>failed.add(index)).finally(()=>pending.delete(index));
    pending.set(index,job);
    return job;
  }

  function pump() {
    if (!enabled) return;
    for (const index of wanted) {
      if (foreground >= (smallDevice ? 2 : 3)) break;
      if (index!==1 && !ready.has(1) && !failed.has(1)) continue;
      if (ready.has(index) || pending.has(index) || failed.has(index)) continue;
      foreground++;
      request(index,"high").finally(()=>{ foreground--; pump(); schedule(); });
    }
  }

  function canPreload() {
    // Fill the distributed anchors early; give cursor-local work the decoder
    // lanes during a fling instead of decoding far-away pictures in parallel.
    const idle = !foreground && (displayed===goal || failed.has(goal));
    return enabled && allowBackground && (cursor<anchors.size || idle);
  }

  function schedule() {
    if (!canPreload() || batching || timer || cursor>=order.length || (!ready.has(1) && !failed.has(1))) return;
    // Yield between batches. Reserve the foreground lanes even during an idle preload.
    timer = setTimeout(async ()=>{
      timer=0; batching=true;
      const end=Math.min(cursor+batchSize,order.length);
      async function lane() {
        while (canPreload() && cursor<end) await request(order[cursor++],"low");
      }
      try { await Promise.all(Array.from({length:smallDevice ? 1 : 2},lane)); }
      finally { batching=false; schedule(); }
    },16);
  }

  return {
    get:index=>ready.get(index),
    protect(index) { displayed=index; if (index===goal) schedule(); },
    plan(indices, destination) {
      goal=destination;
      // Always reserve space for the displayed pair, including on a low-memory phone.
      let hotSlots=capacity-anchors.size-(anchors.has(displayed) ? 0 : 1);
      wanted=[...new Set(indices)].filter(i=>{
        if (i<1 || i>FRAME_COUNT) return false;
        if (i===displayed || anchors.has(i)) return true;
        if (hotSlots===0) return false;
        hotSlots--;
        return true;
      });
      pump(); schedule();
    },
    nearest(index, target) {
      const hasDisplayed=ready.has(displayed);
      let best=hasDisplayed ? displayed : null;
      const low=Math.min(displayed,Math.round(target)), high=Math.max(displayed,Math.round(target));
      for (const i of ready.keys()) {
        if (hasDisplayed && (i<low || i>high)) continue;
        if (best===null || Math.abs(index-i)<Math.abs(index-best)) best=i;
      }
      return best;
    },
    activity(active, preload) {
      enabled=active; allowBackground=preload && !navigator.connection?.saveData;
      if (!active || !allowBackground) { clearTimeout(timer); timer=0; }
      if (active) { pump(); schedule(); }
    },
    dispose() {
      enabled=false; disposed=true; clearTimeout(timer); controller.abort();
      for (const pair of ready.values()) release(pair);
      ready.clear(); bytes.clear();
    }
  };
}
