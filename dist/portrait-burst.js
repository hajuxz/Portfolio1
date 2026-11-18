import * as THREE from "./vendor/three/three.module.min.js";
import {portraitVertex, portraitFragment, shardVertex, shardFragment} from "./portrait-shaders.js";

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Interpolating random values across triangles gives the threshold angular fault lines.
// The histogram keeps the noise field spread across the whole 0–1 progress range.
function fractureTexture(config) {
  const {resolution, scale, seed, detailWeight} = config.noise;
  const random = seededRandom(seed);
  function field(cells) {
    const stride = cells + 1;
    const grid = Float32Array.from({length: stride * stride}, random);
    return (u, v) => {
      const x = u * cells, y = v * cells, i = Math.floor(x), j = Math.floor(y);
      const dx = x - i, dy = y - j, k = j * stride + i;
      const a = grid[k], b = grid[k+1], c = grid[k+stride], d = grid[k+stride+1];
      return dx > dy ? a + dx*(b-a) + dy*(d-b) : a + dy*(c-a) + dx*(d-c);
    };
  }
  const coarse = field(scale), fine = field(scale * 3);
  const bins = new Uint32Array(256), bytes = new Uint8Array(resolution * resolution * 4);
  for (let i=0; i<bytes.length/4; i++) {
    const u = (i%resolution + .5)/resolution, v = (Math.floor(i/resolution) + .5)/resolution;
    const level = Math.round(255 * (coarse(u,v)*(1-detailWeight) + fine(u,v)*detailWeight));
    bytes[4*i] = level; bins[level]++;
  }
  for (let i=1;i<bins.length;i++) bins[i] += bins[i-1];
  for (let i=0;i<bytes.length;i+=4) {
    bytes[i] = Math.round(255*bins[bytes[i]]/(bytes.length/4)); bytes[i+3] = 255;
  }
  const map = new THREE.DataTexture(bytes, resolution, resolution, THREE.RGBAFormat);
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return map;
}

function shardGeometry(image, config, seed) {
  const settings = config.fragments, random = seededRandom(seed);
  const sample = document.createElement("canvas");
  sample.width = sample.height = settings.sampleResolution;
  const ctx = sample.getContext("2d", {willReadFrequently:true});
  ctx.drawImage(image, 0, 0, sample.width, sample.height);
  const pixels = ctx.getImageData(0,0,sample.width,sample.height).data;
  const candidates = [];
  for (let i=0;i<pixels.length;i+=4) {
    const shade = (.2126*pixels[i] + .7152*pixels[i+1] + .0722*pixels[i+2])/255;
    if (pixels[i+3] > 100 && shade < settings.backgroundCutoff) candidates.push([i/4,shade]);
  }
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([-.68,-.44,0, .88,-.24,0, -.22,.83,0],3));
  const origins=[], velocities=[], shapes=[], shades=[];
  const range = ([min,max]) => min + (max-min)*random();
  for (let i=0; candidates.length && i<settings.count; i++) {
    const [pixel,shade] = candidates[Math.floor(random()*candidates.length)];
    const x = (pixel%sample.width+.5)/sample.width, y = (Math.floor(pixel/sample.width)+.5)/sample.height;
    const angle = Math.atan2(y-settings.center.y,x-settings.center.x) + (random()-.5)*settings.scatter;
    const distance = range(settings.travel);
    origins.push(x,y); velocities.push(Math.cos(angle)*distance, Math.sin(angle)*distance);
    shapes.push(range(settings.sizePx),range(settings.aspect),range(settings.spin),random()*Math.PI*2);
    shades.push(shade);
  }
  for (const [name,values,size] of [["aOrigin",origins,2],["aVelocity",velocities,2],["aShape",shapes,4],["aShade",shades,1]]) {
    geometry.setAttribute(name,new THREE.InstancedBufferAttribute(new Float32Array(values),size));
  }
  geometry.instanceCount = shades.length;
  return geometry;
}

const rgb = hex => new THREE.Vector3(...hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255));
const fraction = (value,size) => typeof value === "string" && value.endsWith("%") ? parseFloat(value)/100 : parseFloat(value)/size;

export function createBurst(canvas, frame, images, config, gsap) {
  const attributes={alpha:true,antialias:false,depth:false,stencil:false,powerPreference:"low-power"};
  const context=canvas.getContext("webgl2",attributes) || canvas.getContext("webgl",attributes);
  if (!context) throw Error("WebGL unavailable");
  const renderer = new THREE.WebGLRenderer({canvas,context,...attributes});
  const scene = new THREE.Scene(), camera = new THREE.Camera();
  const resources = [], textures = {}, buffers = {}, boxes = {};
  const u = value => ({value});
  let timeline, shards, finish, visible = true;
  const remember = resource => {resources.push(resource);return resource;};

  function stop(success = false) {
    timeline?.kill(); timeline = null;
    if (shards) scene.remove(shards);
    const resolve = finish; finish = null; resolve?.(success);
  }
  function dispose(releaseContext = false) {
    stop();
    for (const resource of resources) resource.dispose();
    renderer.dispose();
    if (releaseContext && !context.isContextLost()) renderer.forceContextLoss();
  }
  try {
    if (!renderer.capabilities.isWebGL2 && !renderer.extensions.has("ANGLE_instanced_arrays")) throw Error("Instancing unavailable");
    renderer.debug.onShaderError = (gl,program,vertex,fragment) => {
      throw Error([gl.getProgramInfoLog(program),gl.getShaderInfoLog(vertex),gl.getShaderInfoLog(fragment)].filter(Boolean).join("\n"));
    };
    for (const [key,image] of Object.entries(images)) {
      const texture = remember(new THREE.Texture(image));
      texture.generateMipmaps = false;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      textures[key] = texture; boxes[key] = new THREE.Vector4();
      buffers[key] = remember(shardGeometry(image,config,config.noise.seed + (key==="aura" ? 1 : 0)));
      renderer.initTexture(texture);
    }
    const uniforms = {
      uFrom:u(textures.normal), uTo:u(textures.aura), uNoise:u(remember(fractureTexture(config))),
      uFromBox:u(boxes.normal), uToBox:u(boxes.aura), uEye:u(new THREE.Vector2()), uSize:u(new THREE.Vector2()),
      uAccent:u(rgb(config.ACCENT_COLOR)), uGraphite:u(rgb(config.graphiteColor)), uProgress:u(0), uTime:u(0),
      uEdge:u(config.edgeWidth), uGlow:u(config.glow), uBlur:u(config.blurPx), uZoom:u(config.incomingScale), uGravity:u(config.fragments.gravity)
    };
    const material = (vert,frag,transparent) => remember(new THREE.RawShaderMaterial({
      vertexShader:vert, fragmentShader:frag, uniforms, transparent, depthTest:false, depthWrite:false, side:THREE.DoubleSide
    }));
    const surface = new THREE.Mesh(remember(new THREE.PlaneGeometry(2,2)),material(portraitVertex,portraitFragment,false));
    shards = new THREE.Mesh(buffers.normal,material(shardVertex,shardFragment,true));
    surface.frustumCulled = shards.frustumCulled = false;
    shards.renderOrder = 1;
    scene.add(surface,shards);
    renderer.compile(scene,camera);
    scene.remove(shards);

    function resize() {
      const w=frame.clientWidth, h=frame.clientHeight;
      if (!w || !h) return;
      const rect=frame.getBoundingClientRect();
      const dpr=Math.min(window.devicePixelRatio||1,config.maxDpr);
      const width=Math.max(1,Math.round(rect.width)), height=Math.max(1,Math.round(rect.height));
      if (canvas.width!==Math.floor(width*dpr) || canvas.height!==Math.floor(height*dpr)) {
        renderer.setDrawingBufferSize(width,height,dpr);
      }
      uniforms.uSize.value.set(rect.width,rect.height);
      for (const [key,image] of Object.entries(images)) {
        const p=config.portraits[key], ratio=image.naturalWidth/image.naturalHeight;
        const width=Math.min(1,ratio*h/w)*p.scale, height=Math.min(1,w/(ratio*h))*p.scale;
        boxes[key].set((1-width)/2+fraction(p.x,w),1-height+fraction(p.y,h),width,height);
      }
      const normal=config.portraits.normal;
      uniforms.uEye.value.set(.5+(config.eyes.x/100-.5)*normal.scale+fraction(normal.x,w),
        1+(config.eyes.y/100-1)*normal.scale+fraction(normal.y,h));
    }
    function draw() {
      if (visible) renderer.render(scene,camera);
    }
    function play(from,to) {
      stop();
      uniforms.uFrom.value=textures[from]; uniforms.uFromBox.value=boxes[from];
      uniforms.uTo.value=textures[to]; uniforms.uToBox.value=boxes[to];
      uniforms.uProgress.value=uniforms.uTime.value=0;
      shards.geometry=buffers[from]; scene.add(shards);
      resize(); draw();
      const duration=config.durations[to];
      return new Promise(resolve=>{
        finish=resolve;
        timeline=gsap.timeline({paused:true,data:"portrait-burst",onUpdate:draw,onComplete:()=>stop(true)});
        timeline.to(uniforms.uProgress,{value:1,duration,ease:config.ease},0)
          .to(uniforms.uTime,{value:1,duration,ease:"none"},0);
        if (visible) timeline.play();
      });
    }
    return {play,stop,resize,dispose,setVisible(value){visible=value;timeline?.paused(!value);}};
  } catch (error) { dispose(); throw error; }
}
