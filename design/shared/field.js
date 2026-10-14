export function paintField(mode) {
  const canvas = document.getElementById("field");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = canvas.getContext("2d");
  const count = mode === "lantern" ? 64 : 42;
  const dots = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1.2 + Math.random() * (mode === "puddle" ? 8 : 2.6),
    v: 0.05 + Math.random() * 0.14,
    p: Math.random() * Math.PI * 2,
  }));
  const colors = {
    ink: ["#111111", "#ef4444", "#ffe600", "#3b82f6"],
    press: ["#00b4d8", "#e91e8c", "#ffe14a", "#111111"],
    puddle: ["#ffffff", "#9fd8ee", "#ffe08a", "#2a9a8a"],
    lantern: ["#fff6d2", "#ffb25a", "#ffffff", "#e07a3d"],
  }[mode] || ["#ffffff"];

  function frame(t) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) {
      requestAnimationFrame(frame);
      return;
    }
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const rising = mode === "puddle" || mode === "lantern";
    dots.forEach((d, i) => {
      const x = ((((d.x + Math.sin(t / 900 + d.p) * 0.03) % 1) + 1) % 1) * w;
      const y = rising
        ? ((((d.y - (t / 7000) * d.v) % 1) + 1) % 1) * h
        : d.y * h + Math.sin(t / 650 + i) * 10;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = mode === "ink" ? 0.38 : 0.62;
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
