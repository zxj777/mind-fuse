# @mind-fuse/editor

PixiJS v8 work-surface engine for Mind-Fuse.

- Owns canvas rendering, hit testing, and viewport interaction
- Imports `pixi.js` so app entry points do not need to
- Consumes Investigation data, workspace state, and AI suggestions to render the active investigation

WebGPU should be attempted first, with a clear fallback to WebGL when unavailable.
