"use strict";

// Paths are relative to the public site root. {frame} is one-based and padded to three digits.
const FRAME_COUNT = 161;
const FRAME_PATH = {
  dark: "assets/frames/dark/ezgif-frame-{frame}.jpg",
  light: "assets/frames/white pic/ezgif-frame-{frame}.jpg"
};
const CROSSFADE_MS = 700;
// LERP_SPEED is the fraction of the remaining distance covered in one 60 Hz tick.
const LERP_SPEED = 0.18;
const MAX_DPR = 2;
const MAX_CANVAS_WIDTH = 1920;
const PRELOAD_BATCH_SIZE = 8; // Frame numbers per background batch, with limited simultaneous decodes.
const HERO_CONFIG = {
  focal: {x: .54, y: .405}, // Face center and eye line in both 1280 x 720 exports.
  width: 1280, height: 720,
  ease: "cubic-bezier(0.333333, 0, 0.666667, 1)"
};
function frameURL(theme, frame) {
  return FRAME_PATH[theme]?.replace("{frame}", String(frame).padStart(3,"0"));
}
document.documentElement.style.setProperty("--theme-duration", CROSSFADE_MS + "ms");
document.documentElement.style.setProperty("--theme-ease", HERO_CONFIG.ease);
