import {
  ShaderMount,
  ShaderFitOptions,
  getShaderColorFromString,
  meshGradientFragmentShader,
  neuroNoiseFragmentShader,
  simplexNoiseFragmentShader,
} from "../vendor/paper-shaders/dist/index.js";

const fit = {
  u_fit: ShaderFitOptions.cover,
  u_scale: 1,
  u_rotation: 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_offsetX: 0,
  u_offsetY: 0,
  u_worldWidth: 0,
  u_worldHeight: 0,
};

export function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mount(el, fragment, uniforms, speed) {
  const reduced = prefersReduced();
  const shader = new ShaderMount(
    el,
    fragment,
    uniforms,
    { alpha: false, antialias: false, powerPreference: "high-performance" },
    reduced ? 0 : speed,
    0,
    1,
    1280 * 800
  );
  el._paper = shader;
  return shader;
}

/** Paper Shaders MeshGradient — living color spots. */
export function mountMesh(el, opts) {
  const colors = opts.colors.map((c) => getShaderColorFromString(c));
  return mount(
    el,
    meshGradientFragmentShader,
    {
      u_colors: colors,
      u_colorsCount: colors.length,
      u_distortion: opts.distortion ?? 0.85,
      u_swirl: opts.swirl ?? 0.4,
      u_grainMixer: opts.grainMixer ?? 0.2,
      u_grainOverlay: opts.grainOverlay ?? 0.08,
      ...fit,
      u_scale: opts.scale ?? 1.15,
    },
    opts.speed ?? 0.75
  );
}

/** Paper Shaders NeuroNoise — filament stage light. */
export function mountNeuro(el, opts) {
  const c = getShaderColorFromString;
  return mount(
    el,
    neuroNoiseFragmentShader,
    {
      u_colorFront: c(opts.front),
      u_colorMid: c(opts.mid),
      u_colorBack: c(opts.back),
      u_brightness: opts.brightness ?? 0.42,
      u_contrast: opts.contrast ?? 0.38,
      ...fit,
      u_scale: opts.scale ?? 0.62,
    },
    opts.speed ?? 0.5
  );
}

/** Paper Shaders SimplexNoise — ink moving under the sheet. */
export function mountSimplex(el, opts) {
  const colors = opts.colors.map((c) => getShaderColorFromString(c));
  return mount(
    el,
    simplexNoiseFragmentShader,
    {
      u_colors: colors,
      u_colorsCount: colors.length,
      u_stepsPerColor: opts.steps ?? 2,
      u_softness: opts.softness ?? 0.72,
      ...fit,
      u_fit: ShaderFitOptions.none,
      u_scale: opts.scale ?? 0.35,
    },
    opts.speed ?? 0.45
  );
}
