const SCREENS = ["home", "trail", "listen", "celebration", "grown-ups"];
const PALETTES = {
  theatre: ["#ffe7a8", "#ffc14d", "#fff8e8", "#f2b6c9", "#ffffff", "#e8c56b"],
  riso: ["#e4572e", "#355e8c", "#21201c", "#f4edde", "#ffd1c4"],
  atelier: ["#f0b27a", "#7eb8a8", "#f4d35e", "#c4785a", "#fffaf3", "#e7d3b0"],
  ink: ["#ffd56a", "#7ec8e3", "#ef8b7a", "#fff6ea", "#3a2a22", "#f3c1d8"],
  blossom: ["#f3c7a0", "#e7a0b0", "#fff8f4", "#c47a8a", "#f6d7b0", "#d98aa8"],
  meadow: ["#9fd4e8", "#8fcec0", "#f6e2a4", "#fffaf0", "#5aa8b8", "#c6ead8"],
  puddle: ["#9fd8ee", "#ffe08a", "#7dcec2", "#fff", "#1d4e63", "#f7d7a8"],
  lantern: ["#ffd27a", "#f0a06a", "#fff6d8", "#e07a3d", "#5a3418", "#fff"],
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sizeCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  return dpr;
}

export function boot() {
  const params = new URLSearchParams(location.search);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.toggle("reduced", reduced);
  if (params.has("shot")) document.body.classList.add("shot");
  if (params.has("demo")) document.body.classList.add("demo");

  const kind = document.body.dataset.confetti || "theatre";
  const colors = PALETTES[kind] || PALETTES.theatre;
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  let parts = [];
  let raf = 0;
  let drip = 0;
  let current = "";
  let lock = false;

  function draw() {
    const dpr = sizeCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += p.g;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30));
      ctx.fillStyle = p.c;
      if (p.shape === 0) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      else if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.h / 2);
        ctx.lineTo(p.w / 2, p.h / 2);
        ctx.lineTo(-p.w / 2, p.h / 3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 30);
    if (parts.length) raf = requestAnimationFrame(draw);
    else {
      raf = 0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  function spawn(count, fromTop) {
    if (reduced) return;
    for (let i = 0; i < count; i++) {
      parts.push({
        x: fromTop ? Math.random() * innerWidth : innerWidth * (0.35 + Math.random() * 0.3),
        y: fromTop ? -10 : innerHeight * 0.38,
        vx: (Math.random() - 0.5) * (fromTop ? 2.2 : 16),
        vy: fromTop ? 1 + Math.random() * 2.4 : -8 - Math.random() * 10,
        g: 0.16 + Math.random() * 0.1,
        w: 7 + Math.random() * 10,
        h: 9 + Math.random() * 12,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.28,
        c: colors[i % colors.length],
        life: 70 + Math.random() * 50,
        shape: i % 3,
      });
    }
    if (parts.length > 240) parts = parts.slice(-240);
    if (!raf) draw();
  }

  function apply(name) {
    current = name;
    document.body.dataset.current = name;
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("is-on", el.dataset.screen === name);
    });
    document.querySelectorAll(".proto button").forEach((btn) => {
      btn.classList.toggle("is-here", btn.dataset.go === name);
    });
    clearInterval(drip);
    drip = 0;
    if (name === "celebration" && !reduced) {
      spawn(160, false);
      drip = setInterval(() => {
        if (document.body.dataset.current === "celebration") spawn(10, true);
      }, 260);
    }
    document.dispatchEvent(new CustomEvent("phase2:screen", { detail: name }));
  }

  async function show(name, first) {
    if (!name || name === current || lock) return;
    const veilMs = reduced ? 0 : 460;
    if (!first && veilMs) {
      lock = true;
      document.body.classList.add("is-transitioning");
      await wait(veilMs);
    }
    apply(name);
    if (!first && veilMs) {
      document.body.classList.remove("is-transitioning");
      await wait(veilMs);
      lock = false;
    }
  }

  const start = SCREENS.includes(params.get("screen")) ? params.get("screen") : "home";
  apply(start);

  document.body.addEventListener("click", (event) => {
    const go = event.target.closest("[data-go]");
    if (go) show(go.dataset.go);
    const choice = event.target.closest(".choice");
    if (choice) {
      choice.parentElement.querySelectorAll(".choice").forEach((el) => el.classList.remove("is-picked"));
      choice.classList.add("is-picked");
    }
  });

  const press = (on) => (event) => {
    const t = event.target.closest("button, .choice, .node");
    if (!t || reduced) return;
    t.classList.toggle("is-squashed", on);
    if (!on) {
      t.classList.add("is-released");
      setTimeout(() => t.classList.remove("is-released"), 460);
    }
  };
  document.body.addEventListener("pointerdown", press(true));
  document.body.addEventListener("pointerup", press(false));
  document.body.addEventListener("pointercancel", press(false));

  if (params.has("demo") && !reduced) {
    let i = SCREENS.indexOf(start);
    setInterval(() => {
      i = (i + 1) % SCREENS.length;
      show(SCREENS[i]);
    }, 3400);
  }

  window.addEventListener("resize", () => sizeCanvas(canvas));
  return reduced;
}
