const loader = document.querySelector(".loader");
const hero = document.querySelector(".hero");
const heroStage = document.querySelector(".hero-stage");
const heroVideo = document.querySelector(".hero-video");
const brand = document.querySelector(".brand");
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
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, speed: 0 };

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
  setTimeout(() => loader.classList.add("done"), 1250);
  measureScrollStack();
  scheduleScrollEffects();
});

if (heroVideo && heroStage) {
  const enableHeroVideo = () => {
    heroStage.classList.add("video-ready");
    heroVideo.play().catch(() => {
      heroStage.classList.remove("video-ready");
    });
  };

  const disableHeroVideo = () => {
    heroStage.classList.remove("video-ready");
  };

  heroVideo.addEventListener("canplay", enableHeroVideo, { once: true });
  heroVideo.addEventListener("error", disableHeroVideo);
  if (heroVideo.readyState >= 3) enableHeroVideo();
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
  if (window.innerWidth < 701) {
    abilityCards.forEach((card) => {
      card.style.transform = "";
      card.style.zIndex = "";
      card.style.opacity = "";
    });
    return;
  }

  abilityCards.forEach((card, index) => {
    const random = Number(card.dataset.randomRotate || 0);
    const depth = abilityCards.length - index - 1;
    const rotate = depth * 5 + random;
    const scale = 1 + index * 0.065 - abilityCards.length * 0.06;
    const x = (index - abilityCards.length / 2) * 8;
    const y = depth * 12;
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
    if (window.innerWidth < 701) return;
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
    if (Math.hypot(dx, dy) > 170) {
      sendAbilityToBack(card);
    } else {
      layoutAbilityStack();
    }
  });

  card.addEventListener("click", () => {
    if (window.innerWidth < 701) return;
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
  if (!scrollStackCards.length || window.innerWidth < 701) {
    scrollStackCards.forEach((card) => {
      card.style.transform = "";
      card.style.filter = "";
      card.style.zIndex = "";
      card.style.opacity = "";
    });
    return;
  }

  if (scrollStackMetrics.length !== scrollStackCards.length) measureScrollStack();

  const stackPositionPx = window.innerHeight * 0.2;
  const scaleEndPositionPx = window.innerHeight * 0.1;
  const itemScale = 0.03;
  const itemStackDistance = 30;
  const baseScale = 0.85;

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
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function resize() {
  sizeCanvas(ambientCanvas, ambientCtx);
  sizeCanvas(dotCanvas, dotCtx);
  ambientDots = Array.from({ length: Math.min(95, Math.floor(window.innerWidth / 15)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.8 + 0.6
  }));
  buildDotGrid();
}

function buildDotGrid() {
  const gap = window.innerWidth < 700 ? 34 : 42;
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
  if (time - lastAnimationTime > 32) {
    drawAmbient();
    drawDotGrid();
    lastAnimationTime = time;
  }
  requestAnimationFrame(animate);
}

document.addEventListener("mousemove", (event) => {
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

  if (heroStage && !hero.classList.contains("signature-on")) {
    const rect = heroStage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = (event.clientY - cy) / rect.height;
    const ry = (event.clientX - cx) / rect.width;
    heroStage.style.transform = `rotateX(${rx * -3}deg) rotateY(${ry * 4}deg)`;
  }
});

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
animate();
window.addEventListener("resize", () => {
  resize();
  layoutAbilityStack();
  measureScrollStack();
  updateScrollStack();
});
