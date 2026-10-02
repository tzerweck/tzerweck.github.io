// XY model, Metropolis Monte Carlo, drawn live. Each spin is a short line coloured by its angle (cyclic "twilight" colour map).
(() => {
  const cv = document.getElementById("field"), ctx = cv.getContext("2d");
  const slider = document.getElementById("temp"), out = document.getElementById("tval");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TW = [[226,217,226],[166,180,203],[110,136,190],[91,79,170],[72,37,111],[47,20,54],[94,29,64],[150,52,64],[188,95,75],[210,154,128],[226,217,226]];
  const BINS = 72, palette = [];
  for (let b = 0; b < BINS; b++) { const x = b / BINS * (TW.length - 1), i = Math.floor(x), f = x - i, p = TW[i], q = TW[Math.min(i + 1, TW.length - 1)]; palette.push("rgb(" + p.map((v, k) => Math.round(v + (q[k] - v) * f)).join(",") + ")"); }
  const TAU = Math.PI * 2;
  let W = 0, H = 0, cell = 15, nx = 0, ny = 0, th = null, T = +slider.value, running = false, visible = true;

  function resize() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); W = r.width; H = r.height;
    cell = W < 520 ? 14 : 18;
    const mx = Math.floor(W / cell), my = Math.floor(H / cell);
    if (mx !== nx || my !== ny) { nx = mx; ny = my; th = new Float64Array(nx * ny); for (let k = 0; k < th.length; k++) th[k] = Math.random() * TAU; }
  }
  function sweep() {
    const n = nx * ny, step = Math.min(2.6, 1.2 + T);
    for (let k = 0; k < n; k++) {
      const i = (Math.random() * nx) | 0, j = (Math.random() * ny) | 0, s = j * nx + i, a = th[s], b = a + (Math.random() - .5) * step;
      const r = j * nx, e = th[r + (i + 1) % nx], w = th[r + (i - 1 + nx) % nx], u = th[((j + 1) % ny) * nx + i], d = th[((j - 1 + ny) % ny) * nx + i];
      const dE = Math.cos(a - e) + Math.cos(a - w) + Math.cos(a - u) + Math.cos(a - d) - Math.cos(b - e) - Math.cos(b - w) - Math.cos(b - u) - Math.cos(b - d);
      if (dE <= 0 || Math.random() < Math.exp(-dE / T)) th[s] = ((b % TAU) + TAU) % TAU;
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round"; ctx.lineWidth = Math.max(1.6, cell * .17);
    const L = cell * .4, ox = (W - nx * cell) / 2 + cell / 2, oy = (H - ny * cell) / 2 + cell / 2;
    const paths = Array.from({ length: BINS }, () => new Path2D());
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = th[j * nx + i], x = ox + i * cell, y = oy + j * cell, dx = Math.cos(a) * L, dy = Math.sin(a) * L;
      const p = paths[Math.floor(a / TAU * BINS) % BINS]; p.moveTo(x - dx, y - dy); p.lineTo(x + dx, y + dy);
    }
    for (let b = 0; b < BINS; b++) { ctx.strokeStyle = palette[b]; ctx.stroke(paths[b]); }
  }
  function frame() { if (!running) return; if (visible) { sweep(); draw(); } requestAnimationFrame(frame); }
  function setT(v) { T = Math.min(1.6, Math.max(.3, v)); slider.value = T.toFixed(2); out.textContent = "T = " + T.toFixed(2) + " J"; if (reduce) { for (let k = 0; k < 120; k++) sweep(); draw(); } }

  resize();
  for (let k = 0; k < 160; k++) sweep();   // settle before the first frame: vortices still visible, then they slowly pair up
  draw();
  if (reduce) { for (let k = 0; k < 240; k++) sweep(); draw(); }
  else { running = true; requestAnimationFrame(frame); }
  new ResizeObserver(() => { resize(); draw(); }).observe(cv);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);
  slider.addEventListener("input", () => setT(+slider.value));
  let drag = false;
  const fromX = e => { const r = cv.getBoundingClientRect(); setT(.3 + (e.clientX - r.left) / r.width * 1.3); };
  cv.addEventListener("pointerdown", e => { drag = true; cv.setPointerCapture(e.pointerId); fromX(e); });
  cv.addEventListener("pointermove", e => { if (drag) fromX(e); });
  cv.addEventListener("pointerup", () => { drag = false; });
})();
