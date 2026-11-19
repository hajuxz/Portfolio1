// Stage and source coordinates use a top-left origin, like CSS object-position.
export const portraitVertex = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  varying vec2 vStage;
  void main() {
    vStage = vec2(uv.x, 1.0 - uv.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const portraitFragment = `
  precision highp float;
  varying vec2 vStage;
  uniform sampler2D uFrom, uTo, uNoise;
  uniform vec4 uFromBox, uToBox;
  uniform vec2 uSize, uEye;
  uniform vec3 uAccent, uBackground;
  uniform float uProgress, uEdge, uBlur, uZoom, uGlow;

  vec3 portrait(sampler2D image, vec2 stage, vec4 box) {
    vec2 uv = (stage - box.xy) / box.zw;
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return uBackground;
    vec4 texel = texture2D(image, vec2(uv.x, 1.0 - uv.y));
    return mix(uBackground, texel.rgb, texel.a);
  }

  void main() {
    float field = texture2D(uNoise, vStage).r;
    vec3 old = portrait(uFrom, vStage, uFromBox);
    if (uProgress <= 0.0 || field > uProgress + 3.0 * uEdge) {
      gl_FragColor = vec4(old, 1.0);
      return;
    }
    vec2 uv = uEye + (vStage - uEye) / mix(uZoom, 1.0, uProgress);
    vec2 radius = (1.0 - uProgress) * uBlur / uSize;
    vec3 fresh = portrait(uTo, uv, uToBox);
    if (uProgress < 1.0) {
      fresh = (fresh * 4.0 + portrait(uTo, uv + radius, uToBox) +
        portrait(uTo, uv - radius, uToBox) + portrait(uTo, uv + vec2(radius.x, -radius.y), uToBox) +
        portrait(uTo, uv + vec2(-radius.x, radius.y), uToBox)) / 8.0;
    }
    if (uProgress >= 1.0) { gl_FragColor = vec4(fresh, 1.0); return; }
    float reveal = smoothstep(field - uEdge * .2, field + uEdge * .2, uProgress);
    float distanceToEdge = abs(field - uProgress) / uEdge;
    vec3 contrast = max(abs(old - uBackground), abs(fresh - uBackground));
    float subject = max(contrast.r, max(contrast.g, contrast.b));
    float ink = smoothstep(.025, .2, subject);
    vec3 base = mix(old, fresh, reveal);
    float rim = (1.0 - smoothstep(0.0, 1.0, distanceToEdge)) * ink;
    vec3 color = mix(base, uAccent, rim) + uAccent * (exp(-distanceToEdge * 1.6) * ink * uGlow);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const shardVertex = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 aOrigin, aVelocity;
  attribute vec4 aShape; // width in CSS px, aspect, spin, initial rotation
  attribute float aShade;
  uniform vec4 uFromBox;
  uniform vec2 uSize;
  uniform float uTime, uGravity;
  varying float vShade;
  void main() {
    vec2 origin = uFromBox.xy + aOrigin * uFromBox.zw;
    vec2 travel = aVelocity * uTime + vec2(0.0, uGravity * uTime * uTime);
    float angle = aShape.w + uTime * aShape.z;
    mat2 turn = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
    vec2 triangle = turn * (position.xy * vec2(1.0, aShape.y));
    vec2 point = origin + travel + triangle * aShape.x * (1.0 - uTime) / uSize;
    vShade = aShade;
    gl_Position = vec4(point * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
  }
`;

export const shardFragment = `
  precision highp float;
  varying float vShade;
  uniform vec3 uAccent, uGraphite;
  uniform float uTime;
  void main() {
    float alpha = smoothstep(0.0, .08, uTime) * (1.0 - smoothstep(.32, 1.0, uTime));
    gl_FragColor = vec4(mix(uGraphite, uAccent, vShade), alpha);
  }
`;
