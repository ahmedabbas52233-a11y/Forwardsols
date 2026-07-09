/* ---------- shared helpers ---------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- preloader ---------- */
(function initPreloader(){
  const preloader = document.getElementById('preloader');
  const canvas = document.getElementById('preloadStars');
  const ctx = canvas.getContext('2d');
  let w, h, dots = [], raf = null;
  const mouse = { x: -9999, y: -9999, active: false };
  const REPEL_RADIUS = 110;
  const REPEL_STRENGTH = 2.2;

  function resize(){
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    dots = [];
    const count = Math.floor((w * h) / 3200);
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.3 + 0.6
      });
    }
  }
  function updateMouse(e){
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    mouse.x = point.clientX - rect.left;
    mouse.y = point.clientY - rect.top;
    mouse.active = true;
  }
  window.addEventListener('mousemove', updateMouse, { passive: true });
  window.addEventListener('touchmove', updateMouse, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.active = false; });

  function draw(){
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      if (!prefersReducedMotion) {
        // drifts on its own, all the time — galaxy motion
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = w; if (d.x > w) d.x = 0;
        if (d.y < 0) d.y = h; if (d.y > h) d.y = 0;
        // separately: flees the cursor when nearby
        if (mouse.active) {
          const dx = d.x - mouse.x, dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_RADIUS && dist > 0.01) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            d.x += (dx / dist) * force;
            d.y += (dy / dist) * force;
          }
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!prefersReducedMotion) raf = requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize(); draw();

  function dismiss(){
    preloader.classList.add('done');
    if (raf) cancelAnimationFrame(raf);
    setTimeout(() => preloader.remove(), 700);
  }
  const minDelay = prefersReducedMotion ? 200 : 1500;
  const start = Date.now();
  window.addEventListener('load', () => {
    const elapsed = Date.now() - start;
    setTimeout(dismiss, Math.max(0, minDelay - elapsed));
  });
  setTimeout(dismiss, 4000); // safety fallback
})();

/* ---------- desktop mega-menu (mouse + keyboard) ---------- */
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  const trigger = item.querySelector('.nav-trigger');
  const openMenu = () => { item.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); };
  const closeMenu = () => { item.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); };

  item.addEventListener('mouseenter', openMenu);
  item.addEventListener('mouseleave', closeMenu);

  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    navItems.forEach(other => { if (other !== item) other.classList.remove('open'); });
    isOpen ? closeMenu() : openMenu();
  });

  item.addEventListener('focusout', (e) => {
    if (!item.contains(e.relatedTarget)) closeMenu();
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') navItems.forEach(item => {
    item.classList.remove('open');
    item.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false');
  });
});

/* ---------- mobile nav drawer ---------- */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileNav = document.getElementById('mobileNav');
const mobileOverlay = document.getElementById('mobileOverlay');

function openMobileNav(){
  mobileNav.classList.add('open');
  mobileOverlay.classList.add('open');
  mobileNav.setAttribute('aria-hidden', 'false');
  hamburgerBtn.classList.add('open');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
  hamburgerBtn.setAttribute('aria-label', 'Close menu');
  document.body.style.overflow = 'hidden';
}
function closeMobileNav(){
  mobileNav.classList.remove('open');
  mobileOverlay.classList.remove('open');
  mobileNav.setAttribute('aria-hidden', 'true');
  hamburgerBtn.classList.remove('open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  hamburgerBtn.setAttribute('aria-label', 'Open menu');
  document.body.style.overflow = '';
}
hamburgerBtn.addEventListener('click', () => {
  mobileNav.classList.contains('open') ? closeMobileNav() : openMobileNav();
});
mobileOverlay.addEventListener('click', closeMobileNav);
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileNav(); });

/* ---------- fade up on scroll ---------- */
if (prefersReducedMotion) {
  document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: .2 });
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
}

/* ---------- crossfade: brackets brighten on approach, then fade into starfield in place ---------- */
const crossfadeSec = document.getElementById('crossfadeSec');
const flashLayer = document.getElementById('flashLayer');
const clientsLayer = document.getElementById('clientsLayer');
const flashGlowEl = crossfadeSec.querySelector('.flash-glow');
const flashTextEl = crossfadeSec.querySelector('.flash-text');
const bracketLeftEl = crossfadeSec.querySelector('.bracket-left');
const bracketRightEl = crossfadeSec.querySelector('.bracket-right');

function getCrossfadeTargets(){
  const rect = crossfadeSec.getBoundingClientRect();
  const vh = window.innerHeight;
  const entrance = Math.min(1, Math.max(0, (vh - rect.top) / vh));
  const scrollable = Math.max(1, rect.height - vh);
  const pin = Math.min(1, Math.max(0, (0 - rect.top) / scrollable));
  return { entrance, pin };
}

function applyCrossfade(entrance, pin, pulse){
  pulse = pulse === undefined ? 1 : pulse;
  const fadeOut = 1 - pin; // 1 = brackets fully present, 0 = fully crossfaded away
  const glow = Math.min(1, entrance) * fadeOut;
  const bracketOpacity = entrance * fadeOut;
  bracketLeftEl.style.opacity = bracketOpacity;
  bracketRightEl.style.opacity = bracketOpacity;
  bracketLeftEl.style.transform = `translateX(${(1 - entrance) * -140}px)`;
  bracketRightEl.style.transform = `translateX(${(1 - entrance) * 140}px)`;
  // blur radius must taper to 0 alongside opacity, or a soft wide shadow keeps
  // showing faintly even once the source is almost fully transparent
  const glowBlur = (8 + entrance * 58) * pulse * fadeOut;
  const brightness = 1 + entrance * 0.5 * pulse;
  bracketLeftEl.style.filter = `brightness(${brightness}) drop-shadow(0 0 ${glowBlur}px var(--yellow))`;
  bracketRightEl.style.filter = `brightness(${brightness}) drop-shadow(0 0 ${glowBlur}px var(--yellow))`;
  flashGlowEl.style.opacity = glow * (0.82 + 0.18 * pulse);
  flashGlowEl.style.filter = `brightness(${0.9 + 0.25 * pulse})`;
  flashTextEl.style.opacity = bracketOpacity;
  flashLayer.style.opacity = fadeOut;
  flashLayer.style.visibility = fadeOut < 0.01 ? 'hidden' : 'visible';
  flashLayer.style.pointerEvents = fadeOut < 0.01 ? 'none' : 'auto';
  clientsLayer.style.opacity = pin;
}

if (prefersReducedMotion) {
  const t = getCrossfadeTargets();
  applyCrossfade(1, t.pin > 0.5 ? 1 : 0);
}

/* ---------- word by word reveal paragraph ---------- */
const revealEl = document.getElementById('revealText');
const words = revealEl.textContent.trim().split(/\s+/);
revealEl.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
const wordSpans = revealEl.querySelectorAll('.word');

/* ---------- "About" watermark split-open vertically, paragraph revealed through the gap ---------- */
const revealSec = document.getElementById('revealSec');
const wordTop = revealSec.querySelector('.reveal-word-top');
const wordBottom = revealSec.querySelector('.reveal-word-bottom');
const revealWrap = revealSec.querySelector('.wrap');
const MAX_TRAVEL = 120; // px each half travels away from center at full progress — keeps the gap tight

function getRevealTarget(){
  const rect = revealSec.getBoundingClientRect();
  const vh = window.innerHeight;
  // 0 when section top is at viewport bottom, 1 when section is centered in viewport
  return Math.min(1, Math.max(0, (vh - rect.top) / (rect.height / 2 + vh / 2)));
}

function applyReveal(progress){
  // words light up only once the heading has started opening
  const wordProgress = Math.min(1, Math.max(0, (progress - 0.15) / 0.7));
  const lit = Math.floor(wordProgress * wordSpans.length);
  wordSpans.forEach((s, i) => s.classList.toggle('lit', i < lit));

  const travel = progress * MAX_TRAVEL;
  const wordOpacity = 0.55 + progress * 0.45;
  const paraOpacity = Math.min(1, Math.max(0, (progress - 0.1) / 0.5));
  wordTop.style.transform = `translate(-50%,-50%) translateY(${-travel}px)`;
  wordBottom.style.transform = `translate(-50%,-50%) translateY(${travel}px)`;
  wordTop.style.opacity = wordOpacity;
  wordBottom.style.opacity = wordOpacity;
  revealWrap.style.opacity = paraOpacity;
}

if (prefersReducedMotion) {
  wordTop.style.transform = `translate(-50%,-50%) translateY(${-MAX_TRAVEL}px)`;
  wordBottom.style.transform = `translate(-50%,-50%) translateY(${MAX_TRAVEL}px)`;
  wordTop.style.opacity = 1; wordBottom.style.opacity = 1;
  revealWrap.style.opacity = 1;
  wordSpans.forEach(s => s.classList.add('lit'));
}

/* ---------- continuous smoothed scroll loop ----------
   Frame-rate independent easing: the smoothing factor is normalized against
   elapsed time rather than a fixed per-frame amount, so motion feels identical
   on a 60Hz or a 144Hz display instead of snapping faster on high refresh rates. */
let smoothedReveal = 0;
let smoothedEntrance = 0;
let smoothedPin = 0;
const SMOOTHING = 0.16; // portion of remaining distance closed per ~16.7ms frame
let lastFrameTime = performance.now();

function smoothScrollLoop(now){
  const dt = Math.min(50, now - lastFrameTime); // cap to avoid huge jumps after tab-switch
  lastFrameTime = now;
  const k = 1 - Math.pow(1 - SMOOTHING, dt / 16.6667);

  if (!prefersReducedMotion) {
    const revealTarget = getRevealTarget();
    smoothedReveal += (revealTarget - smoothedReveal) * k;
    if (Math.abs(revealTarget - smoothedReveal) < 0.0005) smoothedReveal = revealTarget;
    applyReveal(smoothedReveal);

    const cf = getCrossfadeTargets();
    smoothedEntrance += (cf.entrance - smoothedEntrance) * k;
    smoothedPin += (cf.pin - smoothedPin) * k;
    if (Math.abs(cf.entrance - smoothedEntrance) < 0.0005) smoothedEntrance = cf.entrance;
    if (Math.abs(cf.pin - smoothedPin) < 0.0005) smoothedPin = cf.pin;
    // a slow breathing pulse layered on top — keeps the glow feeling alive
    // rather than a flat, static wash of yellow
    const pulse = 0.88 + 0.12 * Math.sin(now / 900);
    applyCrossfade(smoothedEntrance, smoothedPin, pulse);
  }
  requestAnimationFrame(smoothScrollLoop);
}
requestAnimationFrame(smoothScrollLoop);

/* ---------- scroll-triggered fade-up + flash observers remain event-driven above ---------- */

/* ---------- tech stack tabs ---------- */
const techData = {
  lang: [['python','PYTHON'],['java','JAVA'],['javascript','JAVASCRIPT'],['csharp','C SHARP'],['swift','SWIFT'],['kotlin','KOTLIN']],
  fw:   [['react','REACT'],['nextjs','NEXT.JS'],['vue','VUE'],['django','DJANGO'],['spring','SPRING'],['express','EXPRESS']],
  cloud:[['aws','AWS'],['azure','AZURE'],['gcp','GOOGLE CLOUD'],['vercel','VERCEL'],['digitalocean','DIGITALOCEAN'],['cloudflare','CLOUDFLARE']],
  ai:   [['tensorflow','TENSORFLOW'],['pytorch','PYTORCH'],['openai','OPENAI API'],['langchain','LANGCHAIN'],['huggingface','HUGGING FACE'],['opencv','OPENCV']]
};

// Original, simplified colored icon marks — evoke each technology's real brand
// palette/silhouette without tracing any company's actual trademarked artwork.
const techIcons = {
  python: `<svg viewBox="0 0 48 48"><path d="M24 6c-7 0-8 3-8 6v5h9v2H11c-3 0-6 2-6 8s3 8 6 8h4v-5c0-3 2-6 6-6h8c2 0 5-2 5-5V12c0-3-2-6-10-6z" fill="#4b8bbe"/><path d="M24 42c7 0 8-3 8-6v-5h-9v-2h14c3 0 6-2 6-8s-3-8-6-8h-4v5c0 3-2 6-6 6h-8c-2 0-5 2-5 5v6c0 3 2 6 10 6z" fill="#ffd43b"/><circle cx="18" cy="10" r="1.6" fill="#fff"/><circle cx="30" cy="38" r="1.6" fill="#2b2b2b"/></svg>`,
  java: `<svg viewBox="0 0 48 48"><path d="M17 34c9 4 20 2 20-4" stroke="#5382a1" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M15 39c9 3 22 2 22-3" stroke="#5382a1" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 6c3 4-4 6-1 10 3 4-1 6-1 6" stroke="#e76f00" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="24" cy="24" rx="8" ry="3.2" fill="none" stroke="#5382a1" stroke-width="2"/></svg>`,
  javascript: `<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="6" fill="#f0db4f"/><text x="24" y="31" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#222" text-anchor="middle">JS</text></svg>`,
  csharp: `<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="10" fill="#2d2d30"/><text x="24" y="30" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#a179dc" text-anchor="middle">C#</text></svg>`,
  swift: `<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="10" fill="#f05138"/><path d="M15 15c10 2 17 9 19 19-5-2-16-6-19-19z" fill="#fff"/><path d="M13 30c5 4 12 5 17 2-6 5-15 6-21 1 2-1 3-2 4-3z" fill="#fff" opacity=".85"/></svg>`,
  kotlin: `<svg viewBox="0 0 48 48"><defs><linearGradient id="kt" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e44857"/><stop offset="50%" stop-color="#c711e1"/><stop offset="100%" stop-color="#7f52ff"/></linearGradient></defs><path d="M6 6h36L24 26l18 20H6V6z" fill="url(#kt)"/></svg>`,
  react: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="3.4" fill="#61dafb"/><g fill="none" stroke="#61dafb" stroke-width="2"><ellipse cx="24" cy="24" rx="18" ry="7"/><ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(120 24 24)"/></g></svg>`,
  nextjs: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#000"/><path d="M17 15v18M17 15l14 18" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="29" y="15" width="2.4" height="18" fill="#fff"/></svg>`,
  vue: `<svg viewBox="0 0 48 48"><path d="M6 8h9l9 16 9-16h9L24 40 6 8z" fill="#41b883"/><path d="M15 8h6l3 5.2L27 8h6L24 24 15 8z" fill="#35495e"/></svg>`,
  django: `<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="8" fill="#092e20"/><text x="24" y="30" font-family="Georgia,serif" font-size="16" font-weight="700" fill="#44b78b" text-anchor="middle">D</text></svg>`,
  spring: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#6db33f"/><path d="M33 15c-8 8-18 9-22 18 2-1 4-1 6-1-1 3-2 5-3 7 4-2 7-5 9-8 5 1 11-1 13-6 1-4-1-7-3-10z" fill="#fff"/></svg>`,
  express: `<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="8" fill="#1a1a1a"/><text x="24" y="30" font-family="Georgia,serif" font-style="italic" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">ex</text></svg>`,
  aws: `<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="8" fill="#161e2d"/><text x="24" y="26" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">aws</text><path d="M13 32c8 4 16 4 23 0" stroke="#ff9900" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M33 30l3 1-1 3" stroke="#ff9900" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  azure: `<svg viewBox="0 0 48 48"><path d="M18 6h10l-11 26h15l-21 10 9-20H10z" fill="#0089d6"/></svg>`,
  gcp: `<svg viewBox="0 0 48 48"><path d="M24 10l7 4v9l-7 4-7-4v-9z" fill="#4285f4"/><path d="M17 23l-6 10 7 5 6-4z" fill="#ea4335"/><path d="M31 23l6 10-7 5-6-4z" fill="#34a853"/><path d="M24 10l7 4-3.5 6-3.5-2z" fill="#fbbc05"/></svg>`,
  vercel: `<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="8" fill="#000"/><path d="M24 14l12 20H12z" fill="#fff"/></svg>`,
  digitalocean: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#0080ff"/><path d="M24 32a8 8 0 1 1 0-16v8h-8" fill="#fff"/></svg>`,
  cloudflare: `<svg viewBox="0 0 48 48"><path d="M32 30c4 0 7-3 7-7s-3-7-7-7c-1-5-5-9-11-9-5 0-9 3-11 8-4 1-7 4-7 8 0 4 3 7 7 7z" fill="#f6821f"/></svg>`,
  tensorflow: `<svg viewBox="0 0 48 48"><path d="M6 14l18-8 18 8-9 4v20l-9 4-9-4V18z" fill="#ff6f00"/><path d="M24 6v38M6 14l18 8v20M42 14l-18 8" stroke="#fff" stroke-width="1.6" fill="none" opacity=".55"/></svg>`,
  pytorch: `<svg viewBox="0 0 48 48"><circle cx="24" cy="27" r="12" fill="none" stroke="#ee4c2c" stroke-width="3"/><path d="M24 6v14M18 10l4 5" stroke="#ee4c2c" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  openai: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#10a37f"/><path d="M24 12a6 6 0 0 1 6 6v4l4 2a6 6 0 0 1-3 11l-4-2-4 2a6 6 0 0 1-6-6v-4l-4-2a6 6 0 0 1 3-11l4 2z" fill="#fff"/></svg>`,
  langchain: `<svg viewBox="0 0 48 48"><rect x="8" y="16" width="16" height="10" rx="5" fill="none" stroke="#1c3c34" stroke-width="3" transform="rotate(-20 16 21)"/><rect x="24" y="22" width="16" height="10" rx="5" fill="none" stroke="#3ddc84" stroke-width="3" transform="rotate(-20 32 27)"/></svg>`,
  huggingface: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#ffd21e"/><circle cx="17" cy="21" r="2.4" fill="#2b2b2b"/><circle cx="31" cy="21" r="2.4" fill="#2b2b2b"/><path d="M16 29c3 4 13 4 16 0" stroke="#2b2b2b" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
  opencv: `<svg viewBox="0 0 48 48"><circle cx="18" cy="16" r="8" fill="none" stroke="#ee3239" stroke-width="4"/><circle cx="30" cy="16" r="8" fill="none" stroke="#6dae2b" stroke-width="4" transform="translate(0 12) rotate(120 24 24)"/><circle cx="24" cy="30" r="8" fill="none" stroke="#2a5adf" stroke-width="4" transform="rotate(240 24 24)"/></svg>`
};
function techIconTile(key){
  return techIcons[key] || `<span style="font-size:13px;font-weight:700;">${key.slice(0,2).toUpperCase()}</span>`;
}
const techGrid = document.getElementById('techGrid');
const tabList = document.querySelectorAll('.tab');

function renderTechGrid(tab){
  const data = techData[tab.dataset.tab];
  techGrid.setAttribute('aria-labelledby', tab.id);
  techGrid.innerHTML = data.map(([iconKey, n]) =>
    `<div class="tech-card"><div class="glyph" aria-hidden="true">${techIconTile(iconKey)}</div><b>${n}</b></div>`).join('');
}

function activateTab(tab){
  tabList.forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
    t.tabIndex = -1;
  });
  tab.classList.add('active');
  tab.setAttribute('aria-selected', 'true');
  tab.tabIndex = 0;
  tab.focus();
  renderTechGrid(tab);
}

tabList.forEach((tab, i) => {
  tab.tabIndex = tab.classList.contains('active') ? 0 : -1;
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (e) => {
    const list = Array.from(tabList);
    let target = null;
    if (e.key === 'ArrowRight') target = list[(i + 1) % list.length];
    else if (e.key === 'ArrowLeft') target = list[(i - 1 + list.length) % list.length];
    else if (e.key === 'Home') target = list[0];
    else if (e.key === 'End') target = list[list.length - 1];
    if (target) { e.preventDefault(); activateTab(target); }
  });
});
// paint the initially-active tab's icons immediately (grid starts empty in markup)
const initialTab = document.querySelector('.tab.active') || tabList[0];
if (initialTab) renderTechGrid(initialTab);

/* ---------- testimonials carousel ---------- */
const testimonials = [
  { name: 'JOHN BALL', role: 'President | Automotive Solutions LLC', quote: "\u201cTerry's team delivered everything promised \u2013 their AI-powered marketing strategies and relentless work ethic transformed our lead generation. Highly recommend for any service business!\u201d", stars: 5 },
  { name: 'JESSE STOSIC', role: 'Operations Manager | Heritage Medical Group', quote: "\u201cElijah at ForwardSols was our hero! His technical expertise in Google Business Profile compliance and white-hat recovery methods saved our $1.2M/year patient acquisition channel. Worth every penny!\u201d", stars: 5 }
];
let tIndex = 0;
let tAutoTimer = null;
const T_AUTOPLAY_MS = 7000;
const testCard = document.getElementById('testCard');

function paintTestContent(){
  const t = testimonials[tIndex];
  testCard.innerHTML = `
    <span class="quote-mark">${t.name}</span>
    <div class="role">${t.role}</div>
    <p class="quote">${t.quote}</p>
    <div class="stars" aria-label="${t.stars} out of 5 stars">${'★'.repeat(t.stars)}</div>`;
}

function renderTestimonial(direction){
  const dir = direction === 'prev' ? -1 : 1;
  testCard.style.transition = 'opacity .35s ease, transform .35s ease';
  testCard.style.opacity = '0';
  testCard.style.transform = `translateX(${-dir * 16}px)`;
  setTimeout(() => {
    paintTestContent();
    testCard.style.transition = 'none';
    testCard.style.transform = `translateX(${dir * 16}px)`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        testCard.style.transition = 'opacity .4s ease, transform .4s ease';
        testCard.style.opacity = '1';
        testCard.style.transform = 'translateX(0)';
      });
    });
  }, 320);
}
function goToTestimonial(newIndex, direction){
  tIndex = (newIndex + testimonials.length) % testimonials.length;
  renderTestimonial(direction);
  restartTestAutoplay();
}
function restartTestAutoplay(){
  if (tAutoTimer) clearInterval(tAutoTimer);
  if (prefersReducedMotion) return;
  tAutoTimer = setInterval(() => {
    tIndex = (tIndex + 1) % testimonials.length;
    renderTestimonial('next');
  }, T_AUTOPLAY_MS);
}
document.getElementById('tNext').addEventListener('click', () => goToTestimonial(tIndex + 1, 'next'));
document.getElementById('tPrev').addEventListener('click', () => goToTestimonial(tIndex - 1, 'prev'));
restartTestAutoplay();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (tAutoTimer) clearInterval(tAutoTimer); }
  else restartTestAutoplay();
});
const testSec = testCard.closest('section');
testSec.addEventListener('mouseenter', () => { if (tAutoTimer) clearInterval(tAutoTimer); });
testSec.addEventListener('mouseleave', () => restartTestAutoplay());

/* ---------- contact form ---------- */
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = contactForm.querySelector('.verify-btn');
  const original = btn.textContent;
  btn.textContent = 'SENT ✓';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
});

/* ---------- business stats carousel ---------- */
const statItems = [
  {
    title: 'Real-Time Market Valuation Intelligence',
    body: "Track your business's financial health with AI-driven market analytics. Our platform monitors 17+ valuation metrics (including EBITDA multiples and industry benchmarks) to help you make data-backed decisions, attract investors, and outperform competitors.",
    cta: 'Get Your Free Valuation Report →',
    mock: 'valuation'
  },
  {
    title: 'AI-Powered Website Performance Monitoring',
    body: 'Google penalizes slow sites. Our system audits 53+ performance factors (Core Web Vitals, uptime, conversion paths) with real-time alerts. Clients average 2.3s faster load times and 40% higher engagement within 90 days.',
    cta: 'Run Free Speed Test →',
    mock: 'performance'
  },
  {
    title: 'Dominant Search Engine Visibility',
    body: "Rank on page 1 for high-value keywords with our 360° visibility framework. Combining technical SEO, semantic content clusters, and AI-powered backlink strategies, we've helped clients achieve 300% more organic traffic in 6 months.",
    cta: 'Free SEO Audit →',
    mock: 'seo'
  }
];

// White-card dashboard mockups, styled after real analytics tools — original layouts/data, not screenshots
const mockGraphics = {
  valuation: `
    <rect x="0" y="0" width="460" height="300" rx="14" fill="#ffffff"/>
    <text x="20" y="26" font-family="Inter" font-size="10" fill="#8a8f98">SESSIONS TRENDS BY MEDIUM</text>
    <g>
      <rect x="20" y="45" width="18" height="70" rx="2" fill="#3ddc84"/><rect x="20" y="100" width="18" height="15" rx="2" fill="#e05c5c"/>
      <rect x="48" y="55" width="18" height="60" rx="2" fill="#3ddc84"/><rect x="48" y="95" width="18" height="20" rx="2" fill="#8b6fe0"/>
      <rect x="76" y="40" width="18" height="75" rx="2" fill="#3ddc84"/><rect x="76" y="105" width="18" height="10" rx="2" fill="#e05c5c"/>
      <rect x="104" y="60" width="18" height="55" rx="2" fill="#3ddc84"/><rect x="104" y="98" width="18" height="17" rx="2" fill="#8b6fe0"/>
      <rect x="132" y="48" width="18" height="67" rx="2" fill="#3ddc84"/><rect x="132" y="102" width="18" height="13" rx="2" fill="#e05c5c"/>
      <rect x="160" y="52" width="18" height="63" rx="2" fill="#3ddc84"/><rect x="160" y="100" width="18" height="15" rx="2" fill="#8b6fe0"/>
      <rect x="188" y="42" width="18" height="73" rx="2" fill="#3ddc84"/><rect x="188" y="103" width="18" height="12" rx="2" fill="#e05c5c"/>
    </g>
    <rect x="228" y="14" width="105" height="60" rx="8" fill="#f4f5f7"/>
    <text x="238" y="30" font-family="Inter" font-size="8" fill="#8a8f98">AVG SESSION DURATION</text>
    <text x="238" y="55" font-family="Space Grotesk" font-size="18" fill="#141414" font-weight="700">00:05:33</text>
    <rect x="341" y="14" width="99" height="60" rx="8" fill="#f4f5f7"/>
    <text x="351" y="30" font-family="Inter" font-size="8" fill="#8a8f98">PAGES / SESSION</text>
    <text x="351" y="55" font-family="Space Grotesk" font-size="18" fill="#141414" font-weight="700">3.6</text>
    <rect x="20" y="180" width="105" height="60" rx="8" fill="#f4f5f7"/>
    <text x="30" y="198" font-family="Inter" font-size="8" fill="#8a8f98">SESSIONS</text>
    <text x="30" y="224" font-family="Space Grotesk" font-size="18" fill="#141414" font-weight="700">66,982</text>
    <rect x="133" y="180" width="105" height="60" rx="8" fill="#f4f5f7"/>
    <text x="143" y="198" font-family="Inter" font-size="8" fill="#8a8f98">USERS</text>
    <text x="143" y="224" font-family="Space Grotesk" font-size="18" fill="#141414" font-weight="700">34,226</text>
    <rect x="248" y="90" width="192" height="150" rx="8" fill="#f4f5f7"/>
    <text x="258" y="106" font-family="Inter" font-size="8" fill="#8a8f98">TOP PAGES</text>
    <g font-family="Inter" font-size="7.5" fill="#3a3f47">
      <circle cx="262" cy="120" r="2.5" fill="#3ddc84"/><text x="270" y="123">/pricing</text><text x="410" y="123">18,473</text>
      <circle cx="262" cy="136" r="2.5" fill="#e05c5c"/><text x="270" y="139">/features</text><text x="410" y="139">14,525</text>
      <circle cx="262" cy="152" r="2.5" fill="#8b6fe0"/><text x="270" y="155">/about</text><text x="410" y="155">5,268</text>
      <circle cx="262" cy="168" r="2.5" fill="#3ddc84"/><text x="270" y="171">/blog</text><text x="410" y="171">4,268</text>
    </g>
    <rect x="20" y="255" width="192" height="35" rx="8" fill="#f4f5f7"/>
    <rect x="228" y="255" width="98" height="35" rx="8" fill="#f4f5f7"/>
    <rect x="341" y="255" width="99" height="35" rx="8" fill="#f4f5f7"/>`,
  performance: `
    <rect x="0" y="0" width="460" height="300" rx="14" fill="#ffffff"/>
    <text x="20" y="26" font-family="Inter" font-size="10" fill="#8a8f98">WHERE DO YOUR USERS COME FROM</text>
    <g font-family="Inter" font-size="8" fill="#3a3f47">
      <text x="20" y="46">Direct</text><rect x="95" y="39" width="105" height="9" rx="2" fill="#e08a3c"/>
      <text x="20" y="64">Paid Search</text><rect x="95" y="57" width="76" height="9" rx="2" fill="#e08a3c"/>
      <text x="20" y="82">Organic Search</text><rect x="95" y="75" width="56" height="9" rx="2" fill="#e08a3c"/>
      <text x="20" y="100">Referral</text><rect x="95" y="93" width="32" height="9" rx="2" fill="#e08a3c"/>
      <text x="20" y="118">Social</text><rect x="95" y="111" width="18" height="9" rx="2" fill="#e08a3c"/>
    </g>
    <rect x="228" y="14" width="212" height="120" rx="8" fill="#f4f5f7"/>
    <text x="238" y="30" font-family="Inter" font-size="8" fill="#8a8f98">USERS BY COUNTRY</text>
    <g fill="#bcd4f0">
      <circle cx="270" cy="75" r="4"/><circle cx="290" cy="68" r="6"/><circle cx="310" cy="80" r="3"/>
      <circle cx="340" cy="70" r="5"/><circle cx="365" cy="90" r="7"/><circle cx="390" cy="75" r="3"/>
      <circle cx="410" cy="95" r="4"/><circle cx="255" cy="100" r="3"/><circle cx="325" cy="105" r="4"/>
    </g>
    <rect x="20" y="145" width="212" height="95" rx="8" fill="#f4f5f7"/>
    <text x="30" y="161" font-family="Inter" font-size="8" fill="#8a8f98">ACTIVE USERS OVER TIME</text>
    <polyline points="30,220 55,205 80,212 105,190 130,198 155,175 180,182 205,165" fill="none" stroke="#3c7bff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="248" y="145" width="192" height="95" rx="8" fill="#f4f5f7"/>
    <text x="258" y="161" font-family="Inter" font-size="8" fill="#8a8f98">ENGAGEMENT BY COHORT</text>
    <g>
      <rect x="258" y="172" width="26" height="14" fill="#c7ddfa"/><rect x="286" y="172" width="26" height="14" fill="#8fb8f2"/><rect x="314" y="172" width="26" height="14" fill="#3c7bff"/>
      <rect x="258" y="188" width="26" height="14" fill="#3c7bff"/><rect x="286" y="188" width="26" height="14" fill="#c7ddfa"/><rect x="314" y="188" width="26" height="14" fill="#8fb8f2"/>
      <rect x="258" y="204" width="26" height="14" fill="#8fb8f2"/><rect x="286" y="204" width="26" height="14" fill="#3c7bff"/><rect x="314" y="204" width="26" height="14" fill="#c7ddfa"/>
    </g>
    <rect x="20" y="255" width="420" height="35" rx="8" fill="#f4f5f7"/>`,
  seo: `
    <rect x="0" y="0" width="460" height="300" rx="14" fill="#ffffff"/>
    <rect x="20" y="14" width="212" height="120" rx="8" fill="#f4f5f7"/>
    <text x="30" y="30" font-family="Inter" font-size="8" fill="#8a8f98">SESSIONS</text>
    <text x="30" y="52" font-family="Space Grotesk" font-size="17" fill="#141414" font-weight="700">70,006</text>
    <polyline points="30,120 55,95 80,110 105,80 130,100 155,70 180,90 205,75" fill="none" stroke="#3c7bff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="330" cy="70" r="34" fill="none" stroke="#e7ecf3" stroke-width="12"/>
    <circle cx="330" cy="70" r="34" fill="none" stroke="#3c7bff" stroke-width="12" stroke-dasharray="214" stroke-dashoffset="90" stroke-linecap="round" transform="rotate(-90 330 70)"/>
    <text x="330" y="76" text-anchor="middle" font-family="Space Grotesk" font-size="15" fill="#141414" font-weight="700">168</text>
    <circle cx="404" cy="70" r="34" fill="none" stroke="#e7ecf3" stroke-width="12"/>
    <circle cx="404" cy="70" r="34" fill="none" stroke="#3c7bff" stroke-width="12" stroke-dasharray="214" stroke-dashoffset="60" stroke-linecap="round" transform="rotate(-90 404 70)"/>
    <text x="404" y="76" text-anchor="middle" font-family="Space Grotesk" font-size="15" fill="#141414" font-weight="700">118</text>
    <circle cx="60" cy="205" r="34" fill="none" stroke="#e7ecf3" stroke-width="12"/>
    <circle cx="60" cy="205" r="34" fill="none" stroke="#3c7bff" stroke-width="12" stroke-dasharray="214" stroke-dashoffset="45" stroke-linecap="round" transform="rotate(-90 60 205)"/>
    <text x="60" y="211" text-anchor="middle" font-family="Space Grotesk" font-size="15" fill="#141414" font-weight="700">206</text>
    <rect x="120" y="167" width="140" height="90" rx="8" fill="#f4f5f7"/>
    <text x="130" y="183" font-family="Inter" font-size="8" fill="#8a8f98">MOBILE TRAFFIC QUALITY</text>
    <polyline points="130,230 150,215 170,225 190,205 210,220 230,200" fill="none" stroke="#c96bd6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="130" y="248" font-family="Space Grotesk" font-size="15" fill="#141414" font-weight="700">28%</text>
    <rect x="272" y="167" width="168" height="90" rx="8" fill="#f4f5f7"/>
    <text x="282" y="183" font-family="Inter" font-size="8" fill="#8a8f98">SOCIAL REFERRERS</text>
    <g font-family="Inter" font-size="7.5" fill="#3a3f47">
      <text x="282" y="203">Reddit</text><text x="420" y="203">137</text>
      <text x="282" y="219">LinkedIn</text><text x="420" y="219">92</text>
      <text x="282" y="235">X</text><text x="420" y="235">64</text>
    </g>`
};

let statIndex = 0;
let statAutoTimer = null;
const STAT_AUTOPLAY_MS = 6000;
const statFeature = document.getElementById('statFeature');

function paintStatContent(){
  const s = statItems[statIndex];
  statFeature.querySelector('.stat-feature-dynamic').innerHTML = `
    <h3>${s.title}</h3>
    <p>${s.body}</p>
    <a href="#contact" class="cta">${s.cta}</a>`;
  statFeature.querySelector('.dash-mock').innerHTML = mockGraphics[s.mock];
}
paintStatContent(); // sync the initial static markup with the new mockup style immediately

function renderStat(direction){
  const textEl = statFeature.querySelector('.stat-feature-text');
  const dashEl = statFeature.querySelector('.dash-mock');
  const dir = direction === 'prev' ? -1 : 1;

  // smooth crossfade + subtle directional slide, rather than an instant content swap
  textEl.style.transition = 'opacity .35s ease, transform .35s ease';
  dashEl.style.transition = 'opacity .35s ease, transform .35s ease';
  textEl.style.opacity = '0';
  dashEl.style.opacity = '0';
  textEl.style.transform = `translateX(${-dir * 16}px)`;
  dashEl.style.transform = `translateX(${-dir * 16}px)`;

  setTimeout(() => {
    paintStatContent();

    textEl.style.transition = 'none';
    dashEl.style.transition = 'none';
    textEl.style.transform = `translateX(${dir * 16}px)`;
    dashEl.style.transform = `translateX(${dir * 16}px)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textEl.style.transition = 'opacity .4s ease, transform .4s ease';
        dashEl.style.transition = 'opacity .4s ease, transform .4s ease';
        textEl.style.opacity = '1';
        dashEl.style.opacity = '1';
        textEl.style.transform = 'translateX(0)';
        dashEl.style.transform = 'translateX(0)';
      });
    });
  }, 320);
}

function goToStat(newIndex, direction){
  statIndex = (newIndex + statItems.length) % statItems.length;
  renderStat(direction);
  restartStatAutoplay();
}
function restartStatAutoplay(){
  if (statAutoTimer) clearInterval(statAutoTimer);
  if (prefersReducedMotion) return;
  statAutoTimer = setInterval(() => {
    statIndex = (statIndex + 1) % statItems.length;
    renderStat('next');
  }, STAT_AUTOPLAY_MS);
}
document.getElementById('statNext').addEventListener('click', () => goToStat(statIndex + 1, 'next'));
document.getElementById('statPrev').addEventListener('click', () => goToStat(statIndex - 1, 'prev'));
restartStatAutoplay();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (statAutoTimer) clearInterval(statAutoTimer); }
  else restartStatAutoplay();
});
const statsSec = document.getElementById('statsSec');
statsSec.addEventListener('mouseenter', () => { if (statAutoTimer) clearInterval(statAutoTimer); });
statsSec.addEventListener('mouseleave', () => restartStatAutoplay());

/* ---------- canvas visibility helpers ---------- */
function makeVisibilityAware(canvas, startLoop, stopLoop){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { e.isIntersecting ? startLoop() : stopLoop(); });
  }, { threshold: 0 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopLoop() : startLoop();
  });
}

/* ---------- hero network canvas ---------- */
const netCanvas = document.getElementById('netCanvas');
const nctx = netCanvas.getContext('2d');
let nw, nh, nodes = [], netRAF = null, netDPR = Math.min(window.devicePixelRatio || 1, 2);
const netMouse = { x: -9999, y: -9999, active: false };
const NET_REPEL_RADIUS = 130;
const NET_REPEL_STRENGTH = 2.6;
const NET_LINK_DIST = 150;
const NET_CELL = NET_LINK_DIST; // grid cell size matches connection radius

function resizeNet(){
  nw = netCanvas.offsetWidth;
  nh = netCanvas.offsetHeight;
  netCanvas.width = nw * netDPR;
  netCanvas.height = nh * netDPR;
  nctx.setTransform(netDPR, 0, 0, netDPR, 0, 0);
}
function initNodes(){
  nodes = [];
  // moderate increase vs the original density (was /13000) — 10x was too much
  const count = prefersReducedMotion ? 0 : Math.min(1400, Math.floor((nw * nh) / 5000));
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * nw, y: Math.random() * nh,
      vx: (Math.random() - 0.5) * 0.9, vy: (Math.random() - 0.5) * 0.9
    });
  }
}
function updateNetMouse(e){
  const rect = netCanvas.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  const x = point.clientX - rect.left, y = point.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) { netMouse.active = false; return; }
  netMouse.x = x; netMouse.y = y; netMouse.active = true;
}
window.addEventListener('mousemove', updateNetMouse, { passive: true });
window.addEventListener('touchmove', updateNetMouse, { passive: true });
window.addEventListener('mouseleave', () => { netMouse.active = false; });

// spatial grid so connection lookups stay fast even with thousands of nodes
function buildNetGrid(){
  const grid = new Map();
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const key = (n.x / NET_CELL | 0) + ',' + (n.y / NET_CELL | 0);
    let bucket = grid.get(key);
    if (!bucket) { bucket = []; grid.set(key, bucket); }
    bucket.push(i);
  }
  return grid;
}

function drawNet(){
  nctx.clearRect(0, 0, nw, nh);
  nctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (const n of nodes) {
    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > nw) n.vx *= -1;
    if (n.y < 0 || n.y > nh) n.vy *= -1;
    if (netMouse.active) {
      const dx = n.x - netMouse.x, dy = n.y - netMouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < NET_REPEL_RADIUS && dist > 0.01) {
        const force = (1 - dist / NET_REPEL_RADIUS) * NET_REPEL_STRENGTH;
        n.x += (dx / dist) * force;
        n.y += (dy / dist) * force;
      }
    }
  }

  const grid = buildNetGrid();
  nctx.lineWidth = 1.2;
  for (let i = 0; i < nodes.length; i++) {
    const ni = nodes[i];
    const cx = ni.x / NET_CELL | 0, cy = ni.y / NET_CELL | 0;
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const bucket = grid.get(gx + ',' + gy);
        if (!bucket) continue;
        for (const j of bucket) {
          if (j <= i) continue; // each pair only once
          const nj = nodes[j];
          const dx = ni.x - nj.x, dy = ni.y - nj.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < NET_LINK_DIST) {
            nctx.strokeStyle = `rgba(190,190,200,${0.34 * (1 - d / NET_LINK_DIST)})`;
            nctx.beginPath(); nctx.moveTo(ni.x, ni.y); nctx.lineTo(nj.x, nj.y); nctx.stroke();
          }
        }
      }
    }
  }
  for (const n of nodes) {
    nctx.beginPath(); nctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2); nctx.fill();
  }
  netRAF = requestAnimationFrame(drawNet);
}
function startNetLoop(){ if (!netRAF) drawNet(); }
function stopNetLoop(){ if (netRAF) { cancelAnimationFrame(netRAF); netRAF = null; } }

window.addEventListener('resize', () => { resizeNet(); initNodes(); }, { passive: true });
resizeNet(); initNodes();
if (prefersReducedMotion) { drawNet(); stopNetLoop(); } else { startNetLoop(); }
makeVisibilityAware(netCanvas, startNetLoop, stopNetLoop);
setTimeout(() => netCanvas.style.opacity = 1, 300);

/* ---------- starfield canvas (client logos) — flying through a galaxy, right to left ---------- */
const starCanvas = document.getElementById('starCanvas');
const sctx = starCanvas.getContext('2d');
let sw, sh, stars = [], starRAF = null, starDPR = Math.min(window.devicePixelRatio || 1, 2);
const starMouse = { x: -9999, y: -9999, active: false };
const STAR_REPEL_RADIUS = 110;
const STAR_REPEL_STRENGTH = 2.2;

function resizeStar(){
  sw = starCanvas.offsetWidth;
  sh = starCanvas.offsetHeight;
  starCanvas.width = sw * starDPR;
  starCanvas.height = sh * starDPR;
  sctx.setTransform(starDPR, 0, 0, starDPR, 0, 0);
  stars = [];
  const count = Math.floor((sw * sh) / 1600); // denser field
  for (let i = 0; i < count; i++) {
    // varied depth: faster + brighter + slightly bigger "closer" stars, slower "farther" ones
    const depth = Math.random();
    stars.push({
      x: Math.random() * sw, y: Math.random() * sh,
      vx: -(1.0 + depth * 2.8),           // right-to-left flow, speed varies by depth
      vy: (Math.random() - 0.5) * 0.3,     // gentle vertical drift for an organic feel
      r: 0.4 + depth * 1.6,
      a: 0.35 + depth * 0.65
    });
  }
}
function updateStarMouse(e){
  const rect = starCanvas.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  const x = point.clientX - rect.left, y = point.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) { starMouse.active = false; return; }
  starMouse.x = x; starMouse.y = y; starMouse.active = true;
}
window.addEventListener('mousemove', updateStarMouse, { passive: true });
window.addEventListener('touchmove', updateStarMouse, { passive: true });
window.addEventListener('mouseleave', () => { starMouse.active = false; });

function drawStar(){
  sctx.clearRect(0, 0, sw, sh);
  const cx = sw / 2, cy = sh / 2;
  const omega = 0.0011; // slow revolve around center, layered under the flow — a galaxy feel
  const cosO = Math.cos(omega), sinO = Math.sin(omega);
  for (const s of stars) {
    if (!prefersReducedMotion) {
      // revolves gently around the field's center...
      const dx0 = s.x - cx, dy0 = s.y - cy;
      s.x = cx + (dx0 * cosO - dy0 * sinO);
      s.y = cy + (dx0 * sinO + dy0 * cosO);
      // ...while also flying on its own, all the time — right to left, re-entering from the right
      s.x += s.vx; s.y += s.vy;
      if (s.x < -4) { s.x = sw + 4; s.y = Math.random() * sh; }
      if (s.y < 0) s.y = sh; if (s.y > sh) s.y = 0;
      // separately: flees the cursor when nearby
      if (starMouse.active) {
        const dx = s.x - starMouse.x, dy = s.y - starMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < STAR_REPEL_RADIUS && dist > 0.01) {
          const force = (1 - dist / STAR_REPEL_RADIUS) * STAR_REPEL_STRENGTH;
          s.x += (dx / dist) * force;
          s.y += (dy / dist) * force;
        }
      }
    }
    // faster ("closer") stars get a subtle motion-streak trail; slower ones stay as soft dots
    const speed = Math.abs(s.vx);
    if (speed > 1.8) {
      const trailLen = (speed - 1.5) * 3.2;
      const grad = sctx.createLinearGradient(s.x + trailLen, s.y, s.x, s.y);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(1, `rgba(255,255,255,${s.a})`);
      sctx.strokeStyle = grad;
      sctx.lineWidth = s.r;
      sctx.lineCap = 'round';
      sctx.beginPath(); sctx.moveTo(s.x + trailLen, s.y); sctx.lineTo(s.x, s.y); sctx.stroke();
    }
    sctx.fillStyle = `rgba(255,255,255,${s.a})`;
    sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); sctx.fill();
  }
  starRAF = requestAnimationFrame(drawStar);
}
function startStarLoop(){ if (!starRAF) drawStar(); }
function stopStarLoop(){ if (starRAF) { cancelAnimationFrame(starRAF); starRAF = null; } }

window.addEventListener('resize', resizeStar, { passive: true });
resizeStar();
if (prefersReducedMotion) { drawStar(); stopStarLoop(); } else { startStarLoop(); }
makeVisibilityAware(starCanvas, startStarLoop, stopStarLoop);
