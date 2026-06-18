const loader = document.querySelector(".loader");
const hero = document.querySelector(".hero");
const heroStage = document.querySelector(".hero-stage");
const heroVideo = document.querySelector(".hero-video");
const brand = document.querySelector(".brand");
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav a");
const revealItems = document.querySelectorAll(".reveal");
const abilityStack = document.querySelector(".ability-stack-container");
const abilityCards = Array.from(document.querySelectorAll(".ability-card"));
const scrollStackInner = document.querySelector(".scroll-stack-inner");
const scrollStackCards = Array.from(document.querySelectorAll(".scroll-stack-card"));
const scrollStackEnd = document.querySelector(".scroll-stack-end");
const keywordButtons = Array.from(document.querySelectorAll(".keyword-letter"));
const keywordIndex = document.querySelector("#keyword-index");
const keywordTitle = document.querySelector("#keyword-title");
const keywordText = document.querySelector("#keyword-text");
const qrOpen = document.querySelector("#qr-open");
const qrClose = document.querySelector("#qr-close");
const qrModal = document.querySelector("#qr-modal");
const ambientCanvas = document.querySelector("#ambient-canvas");
const dotCanvas = document.querySelector("#dot-grid");
const ambientCtx = ambientCanvas.getContext("2d");
const dotCtx = dotCanvas.getContext("2d");

let ambientDots = [];
let gridDots = [];
let lastPointer = { x: 0, y: 0, t: 0 };
let scrollStackMetrics = [];
let scrollStackEndTop = 0;
let scrollFrame = 0;
let lastAnimationTime = 0;
let canvasFrame = 0;
let resizeFrame = 0;
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, speed: 0 };

function dismissLoader() {
  if (!loader || loader.classList.contains("done")) return;
  loader.classList.add("done");
  window.setTimeout(() => loader.remove(), 900);
}

document.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);
  window.setTimeout(dismissLoader, 450);
});

window.setTimeout(dismissLoader, 2200);

window.addEventListener("load", () => {
  measureScrollStack();
  scheduleScrollEffects();
});

if (heroVideo && heroStage) {
  heroVideo.muted = true;

  const tryHeroVideo = () => {
    const playback = heroVideo.play();
    if (playback) playback.catch(() => heroStage.classList.remove("video-ready"));
  };

  heroVideo.addEventListener("playing", () => heroStage.classList.add("video-ready"));
  heroVideo.addEventListener("error", () => heroStage.classList.remove("video-ready"));
  heroVideo.addEventListener("canplay", tryHeroVideo, { once: true });
  document.addEventListener("pointerdown", tryHeroVideo, { once: true, passive: true });
  tryHeroVideo();
}

function closeMenu() {
  if (!siteHeader || !menuToggle) return;
  siteHeader.classList.remove("menu-open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "打开导航");
}

if (siteHeader && menuToggle) {
  menuToggle.addEventListener("click", () => {
    const willOpen = !siteHeader.classList.contains("menu-open");
    siteHeader.classList.toggle("menu-open", willOpen);
    document.body.classList.toggle("menu-open", willOpen);
    menuToggle.setAttribute("aria-expanded", `${willOpen}`);
    menuToggle.setAttribute("aria-label", willOpen ? "关闭导航" : "打开导航");
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.16 });

revealItems.forEach((item) => observer.observe(item));

brand.addEventListener("click", () => {
  brand.classList.remove("brand-flash");
  void brand.offsetWidth;
  brand.classList.add("brand-flash");
  window.setTimeout(() => brand.classList.remove("brand-flash"), 650);
});

function setKeyword(button) {
  keywordButtons.forEach((item) => item.classList.toggle("is-active", item === button));
  keywordIndex.textContent = button.dataset.index;
  keywordTitle.textContent = button.dataset.title;
  keywordText.textContent = button.dataset.text;
}

keywordButtons.forEach((button) => {
  button.addEventListener("click", () => setKeyword(button));
});

function layoutAbilityStack() {
  if (!abilityCards.length) return;
  const isMobile = window.innerWidth < 701;

  abilityCards.forEach((card, index) => {
    const random = Number(card.dataset.randomRotate || 0);
    const depth = abilityCards.length - index - 1;
    const rotate = depth * (isMobile ? 1.2 : 5) + random * (isMobile ? 0.45 : 1);
    const scaleStep = isMobile ? 0.035 : 0.065;
    const scale = 1 + index * scaleStep - abilityCards.length * (isMobile ? 0.032 : 0.06);
    const x = (index - abilityCards.length / 2) * (isMobile ? 3 : 8);
    const y = depth * (isMobile ? 8 : 12);
    card.style.zIndex = `${index + 1}`;
    card.style.opacity = `${0.72 + index * 0.08}`;
    card.style.transform = `translate3d(${x}px, ${y}px, 0) rotateZ(${rotate}deg) scale(${scale})`;
  });
}

function sendAbilityToBack(card) {
  if (!abilityStack || !card) return;
  abilityStack.prepend(card);
  abilityCards.splice(abilityCards.indexOf(card), 1);
  abilityCards.unshift(card);
  layoutAbilityStack();
}

abilityCards.forEach((card, index) => {
  card.dataset.randomRotate = `${(index % 2 ? 1 : -1) * (index + 1) * 0.7}`;
  let drag = null;

  card.addEventListener("pointerdown", (event) => {
    if (abilityCards[abilityCards.length - 1] !== card) {
      sendAbilityToBack(card);
      return;
    }
    drag = {
      startX: event.clientX,
      startY: event.clientY
    };
    card.classList.add("is-dragging");
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (window.innerWidth < 701 && Math.abs(dy) > Math.abs(dx)) return;
    const rotateX = Math.max(-60, Math.min(60, dy * -0.35));
    const rotateY = Math.max(-60, Math.min(60, dx * 0.35));
    card.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(0deg) scale(1)`;
  });

  card.addEventListener("pointerup", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    card.classList.remove("is-dragging");
    drag = null;
    const threshold = window.innerWidth < 701 ? 70 : 170;
    if (Math.abs(dx) > threshold || (window.innerWidth >= 701 && Math.hypot(dx, dy) > threshold)) {
      sendAbilityToBack(card);
    } else {
      layoutAbilityStack();
    }
  });

  card.addEventListener("pointercancel", () => {
    card.classList.remove("is-dragging");
    drag = null;
    layoutAbilityStack();
  });

  card.addEventListener("click", () => {
    if (abilityCards[abilityCards.length - 1] === card) {
      sendAbilityToBack(card);
    }
  });
});

function measureScrollStack() {
  if (!scrollStackCards.length || !scrollStackInner) return;
  const innerTop = scrollStackInner.getBoundingClientRect().top + window.scrollY;
  scrollStackMetrics = scrollStackCards.map((card) => innerTop + card.offsetTop);
  scrollStackEndTop = scrollStackEnd
    ? innerTop + scrollStackEnd.offsetTop
    : scrollStackMetrics[scrollStackMetrics.length - 1] + window.innerHeight;
}

function updateScrollStack() {
  if (!scrollStackCards.length) return;

  if (scrollStackMetrics.length !== scrollStackCards.length) measureScrollStack();

  const isMobile = window.innerWidth < 701;
  const stackPositionPx = window.innerHeight * (isMobile ? 0.13 : 0.2);
  const scaleEndPositionPx = window.innerHeight * (isMobile ? 0.07 : 0.1);
  const itemScale = isMobile ? 0.018 : 0.03;
  const itemStackDistance = isMobile ? 18 : 30;
  const baseScale = isMobile ? 0.9 : 0.85;

  let topCardIndex = 0;
  scrollStackMetrics.forEach((cardTop, index) => {
    const triggerStart = cardTop - stackPositionPx - itemStackDistance * index;
    if (window.scrollY >= triggerStart) topCardIndex = index;
  });

  scrollStackCards.forEach((card, index) => {
    const cardTop = scrollStackMetrics[index];
    const triggerStart = cardTop - stackPositionPx - itemStackDistance * index;
    const triggerEnd = cardTop - scaleEndPositionPx;
    const pinStart = triggerStart;
    const pinEnd = scrollStackEndTop - window.innerHeight / 2;
    const scaleProgress = Math.min(1, Math.max(0, (window.scrollY - triggerStart) / Math.max(1, triggerEnd - triggerStart)));
    const targetScale = baseScale + index * itemScale;
    const scale = 1 - scaleProgress * (1 - targetScale);
    let translateY = 0;

    if (window.scrollY >= pinStart && window.scrollY <= pinEnd) {
      translateY = window.scrollY - cardTop + stackPositionPx + itemStackDistance * index;
    } else if (window.scrollY > pinEnd) {
      translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * index;
    }

    const depth = index < topCardIndex ? topCardIndex - index : 0;
    const opacity = depth > 2 ? 0.72 : 1;
    card.style.zIndex = `${index + 1}`;
    card.style.transform = `translate3d(0, ${Math.round(translateY * 100) / 100}px, 0) scale(${Math.round(scale * 1000) / 1000})`;
    card.style.opacity = `${opacity}`;
  });
}

function updateScrollEffects() {
  if (!hero) return;
  const showSignature = window.scrollY > window.innerHeight * 0.42;
  hero.classList.toggle("signature-on", showSignature);
  const scale = Math.max(0.72, 1 - window.scrollY / 2600);
  if (heroStage && showSignature) {
    heroStage.style.transform = "";
  }
  if (heroStage && !showSignature) {
    heroStage.style.transform = `scale(${scale})`;
  }
  updateScrollStack();
  scrollFrame = 0;
}

function scheduleScrollEffects() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScrollEffects);
}

qrOpen.addEventListener("click", () => {
  qrModal.classList.add("open");
  qrModal.setAttribute("aria-hidden", "false");
});

qrClose.addEventListener("click", closeQr);
qrModal.addEventListener("click", (event) => {
  if (event.target === qrModal) closeQr();
});

function closeQr() {
  qrModal.classList.remove("open");
  qrModal.setAttribute("aria-hidden", "true");
}

function sizeCanvas(canvas, ctx) {
  const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 701 ? 1.5 : 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function resize() {
  sizeCanvas(ambientCanvas, ambientCtx);
  sizeCanvas(dotCanvas, dotCtx);
  const dotLimit = window.innerWidth < 701 ? 36 : 95;
  const dotDivisor = window.innerWidth < 701 ? 18 : 15;
  ambientDots = Array.from({ length: Math.min(dotLimit, Math.floor(window.innerWidth / dotDivisor)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.8 + 0.6
  }));
  buildDotGrid();
}

function buildDotGrid() {
  const gap = 42;
  const size = window.innerWidth < 700 ? 3.2 : 4.2;
  const cols = Math.ceil(window.innerWidth / gap) + 2;
  const rows = Math.ceil(window.innerHeight / gap) + 2;
  gridDots = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      gridDots.push({
        x: x * gap - gap / 2,
        y: y * gap - gap / 2,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        size
      });
    }
  }
}

function drawAmbient() {
  ambientCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ambientCtx.fillStyle = "rgba(255, 87, 34, 0.34)";
  ambientCtx.strokeStyle = "rgba(255, 87, 34, 0.12)";
  ambientDots.forEach((dot, index) => {
    dot.x += dot.vx;
    dot.y += dot.vy;
    if (dot.x < 0 || dot.x > window.innerWidth) dot.vx *= -1;
    if (dot.y < 0 || dot.y > window.innerHeight) dot.vy *= -1;
    ambientCtx.beginPath();
    ambientCtx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ambientCtx.fill();

    for (let i = index + 1; i < ambientDots.length; i += 1) {
      const other = ambientDots[i];
      const distance = Math.hypot(dot.x - other.x, dot.y - other.y);
      if (distance < 92) {
        ambientCtx.globalAlpha = 1 - distance / 92;
        ambientCtx.beginPath();
        ambientCtx.moveTo(dot.x, dot.y);
        ambientCtx.lineTo(other.x, other.y);
        ambientCtx.stroke();
        ambientCtx.globalAlpha = 1;
      }
    }
  });
}

function drawDotGrid() {
  dotCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  gridDots.forEach((dot) => {
    const dx = dot.x + dot.ox - pointer.x;
    const dy = dot.y + dot.oy - pointer.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 145) {
      const force = (1 - dist / 145) * Math.min(pointer.speed / 1200, 1.8);
      const angle = Math.atan2(dy || 0.001, dx || 0.001);
      dot.vx += Math.cos(angle) * force * 2.8;
      dot.vy += Math.sin(angle) * force * 2.8;
    }

    dot.vx += -dot.ox * 0.018;
    dot.vy += -dot.oy * 0.018;
    dot.vx *= 0.84;
    dot.vy *= 0.84;
    dot.ox += dot.vx;
    dot.oy += dot.vy;

    const hot = Math.max(0, 1 - dist / 180);
    const alpha = 0.14 + hot * 0.58;
    dotCtx.fillStyle = `rgba(255, 87, 34, ${alpha})`;
    dotCtx.beginPath();
    dotCtx.arc(dot.x + dot.ox, dot.y + dot.oy, dot.size + hot * 2.2, 0, Math.PI * 2);
    dotCtx.fill();
  });
}

function animate(time = 0) {
  if (document.hidden) {
    canvasFrame = 0;
    return;
  }
  if (time - lastAnimationTime > 32) {
    drawAmbient();
    drawDotGrid();
    lastAnimationTime = time;
  }
  canvasFrame = requestAnimationFrame(animate);
}

function updatePointer(event) {
  const now = performance.now();
  const dt = Math.max(16, now - (lastPointer.t || now));
  const vx = ((event.clientX - lastPointer.x) / dt) * 1000;
  const vy = ((event.clientY - lastPointer.y) / dt) * 1000;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.speed = Math.min(Math.hypot(vx, vy), 5000);
  lastPointer = { x: event.clientX, y: event.clientY, t: now };
  document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
  document.documentElement.style.setProperty("--my", `${event.clientY}px`);

  if (event.pointerType !== "touch" && heroStage && !hero.classList.contains("signature-on")) {
    const rect = heroStage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = (event.clientY - cy) / rect.height;
    const ry = (event.clientX - cx) / rect.width;
    heroStage.style.transform = `rotateX(${rx * -3}deg) rotateY(${ry * 4}deg)`;
  }
}

document.addEventListener("pointermove", updatePointer, { passive: true });

document.addEventListener("click", (event) => {
  gridDots.forEach((dot) => {
    const dx = dot.x + dot.ox - event.clientX;
    const dy = dot.y + dot.oy - event.clientY;
    const dist = Math.hypot(dx, dy);
    if (dist < 250) {
      const force = (1 - dist / 250) * 14;
      const angle = Math.atan2(dy || 0.001, dx || 0.001);
      dot.vx += Math.cos(angle) * force;
      dot.vy += Math.sin(angle) * force;
    }
  });
});

window.addEventListener("scroll", scheduleScrollEffects, { passive: true });

resize();
layoutAbilityStack();
measureScrollStack();
updateScrollStack();
canvasFrame = requestAnimationFrame(animate);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !canvasFrame) canvasFrame = requestAnimationFrame(animate);
});
window.addEventListener("resize", () => {
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    resize();
    layoutAbilityStack();
    measureScrollStack();
    updateScrollStack();
    if (window.innerWidth >= 701) closeMenu();
    resizeFrame = 0;
  });
});
