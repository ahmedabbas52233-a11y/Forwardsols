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

/* ---------- flash section trigger ---------- */
const flashSec = document.getElementById('flashSec');
const io2 = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) flashSec.classList.add('lit');
    else flashSec.classList.remove('lit');
  });
}, { threshold: .5 });
io2.observe(flashSec);

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

function getRevealProgress(){
  const rect = revealSec.getBoundingClientRect();
  const vh = window.innerHeight;
  // 0 when section top is at viewport bottom, 1 when section is centered in viewport
  return Math.min(1, Math.max(0, (vh - rect.top) / (rect.height / 2 + vh / 2)));
}

function updateReveal(progress){
  if (prefersReducedMotion) { wordSpans.forEach(s => s.classList.add('lit')); return; }
  // words light up only once the heading has started opening
  const wordProgress = Math.min(1, Math.max(0, (progress - 0.15) / 0.7));
  const lit = Math.floor(wordProgress * wordSpans.length);
  wordSpans.forEach((s, i) => s.classList.toggle('lit', i < lit));
}

function updateWatermark(progress){
  if (prefersReducedMotion) {
    wordTop.style.transform = `translate(-50%,-50%) translateY(${-MAX_TRAVEL}px)`;
    wordBottom.style.transform = `translate(-50%,-50%) translateY(${MAX_TRAVEL}px)`;
    wordTop.style.opacity = 1; wordBottom.style.opacity = 1;
    revealWrap.style.opacity = 1;
    return;
  }
  const travel = progress * MAX_TRAVEL;
  const wordOpacity = 0.55 + progress * 0.45;
  // paragraph stays hidden while the heading is closed, fades in as it opens
  const paraOpacity = Math.min(1, Math.max(0, (progress - 0.1) / 0.5));
  wordTop.style.transform = `translate(-50%,-50%) translateY(${-travel}px)`;
  wordBottom.style.transform = `translate(-50%,-50%) translateY(${travel}px)`;
  wordTop.style.opacity = wordOpacity;
  wordBottom.style.opacity = wordOpacity;
  revealWrap.style.opacity = paraOpacity;
}

function updateRevealSection(){
  const progress = prefersReducedMotion ? 1 : getRevealProgress();
  updateWatermark(progress);
  updateReveal(progress);
}

/* ---------- batched scroll handler (single rAF per frame) ---------- */
let scrollTicking = false;
function onScrollFrame(){
  updateRevealSection();
  scrollTicking = false;
}
function requestScrollUpdate(){
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(onScrollFrame);
  }
}
window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
updateRevealSection();

/* ---------- tech stack tabs ---------- */
const techData = {
  lang: [['Py','PYTHON'],['J','JAVA'],['JS','JAVASCRIPT'],['C#','C SHARP'],['Sw','SWIFT'],['K','KOTLIN']],
  fw:   [['R','REACT'],['N','NEXT.JS'],['V','VUE'],['D','DJANGO'],['S','SPRING'],['E','EXPRESS']],
  cloud:[['AWS','AWS'],['AZ','AZURE'],['GC','GOOGLE CLOUD'],['VC','VERCEL'],['DO','DIGITALOCEAN'],['CF','CLOUDFLARE']],
  ai:   [['TF','TENSORFLOW'],['PT','PYTORCH'],['OA','OPENAI API'],['LC','LANGCHAIN'],['HF','HUGGING FACE'],['CV','OPENCV']]
};
const techGrid = document.getElementById('techGrid');
const tabList = document.querySelectorAll('.tab');

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
  const data = techData[tab.dataset.tab];
  techGrid.setAttribute('aria-labelledby', tab.id);
  techGrid.innerHTML = data.map(([g, n]) =>
    `<div class="tech-card"><div class="glyph" aria-hidden="true">${g}</div><b>${n}</b></div>`).join('');
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

/* ---------- testimonials carousel ---------- */
const testimonials = [
  { name: 'JOHN BALL', role: 'President | Automotive Solutions LLC', quote: "\u201cTerry's team delivered everything promised \u2013 their AI-powered marketing strategies and relentless work ethic transformed our lead generation. Highly recommend for any service business!\u201d", stars: 5 },
  { name: 'JESSE STOSIC', role: 'Operations Manager | Heritage Medical Group', quote: "\u201cElijah at ForwardSols was our hero! His technical expertise in Google Business Profile compliance and white-hat recovery methods saved our $1.2M/year patient acquisition channel. Worth every penny!\u201d", stars: 5 }
];
let tIndex = 0;
const testCard = document.getElementById('testCard');
function renderTestimonial(){
  const t = testimonials[tIndex];
  testCard.innerHTML = `
    <span class="quote-mark">${t.name}</span>
    <div class="role">${t.role}</div>
    <p class="quote">${t.quote}</p>
    <div class="stars" aria-label="${t.stars} out of 5 stars">${'★'.repeat(t.stars)}</div>`;
}
document.getElementById('tNext').addEventListener('click', () => { tIndex = (tIndex + 1) % testimonials.length; renderTestimonial(); });
document.getElementById('tPrev').addEventListener('click', () => { tIndex = (tIndex - 1 + testimonials.length) % testimonials.length; renderTestimonial(); });

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
    mock: 'bars'
  },
  {
    title: 'AI-Powered Website Performance Monitoring',
    body: 'Google penalizes slow sites. Our system audits 53+ performance factors (Core Web Vitals, uptime, conversion paths) with real-time alerts. Clients average 2.3s faster load times and 40% higher engagement within 90 days.',
    cta: 'Run Free Speed Test →',
    mock: 'line'
  },
  {
    title: 'Dominant Search Engine Visibility',
    body: "Rank on page 1 for high-value keywords with our 360° visibility framework. Combining technical SEO, semantic content clusters, and AI-powered backlink strategies, we've helped clients achieve 300% more organic traffic in 6 months.",
    cta: 'Free SEO Audit →',
    mock: 'ring'
  }
];
const mockGraphics = {
  bars: `<g><rect x="26" y="120" width="26" height="130" rx="3" fill="#3c7bff"/><rect x="62" y="150" width="26" height="100" rx="3" fill="#2a2a30"/><rect x="98" y="100" width="26" height="150" rx="3" fill="#3c7bff"/><rect x="134" y="170" width="26" height="80" rx="3" fill="#2a2a30"/><rect x="170" y="130" width="26" height="120" rx="3" fill="#3c7bff"/></g>
    <rect x="230" y="56" width="204" height="194" rx="10" fill="#131316"/>
    <circle cx="332" cy="150" r="70" fill="none" stroke="#2a2a30" stroke-width="16"/>
    <circle cx="332" cy="150" r="70" fill="none" stroke="#3c7bff" stroke-width="16" stroke-dasharray="320" stroke-dashoffset="90" stroke-linecap="round" transform="rotate(-90 332 150)"/>
    <text x="332" y="158" text-anchor="middle" font-family="Space Grotesk" font-size="26" fill="#fff" font-weight="700">72%</text>`,
  line: `<rect x="26" y="56" width="408" height="194" rx="10" fill="#131316"/>
    <polyline points="46,220 100,190 154,205 208,150 262,165 316,110 370,120 414,80" fill="none" stroke="#3ddc84" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="414" cy="80" r="6" fill="#3ddc84"/>
    <text x="46" y="245" font-family="Inter" font-size="11" fill="#8a8a90">Load time 2.3s faster</text>`,
  ring: `<rect x="26" y="56" width="408" height="194" rx="10" fill="#131316"/>
    <circle cx="230" cy="153" r="80" fill="none" stroke="#2a2a30" stroke-width="18"/>
    <circle cx="230" cy="153" r="80" fill="none" stroke="#e73a5a" stroke-width="18" stroke-dasharray="503" stroke-dashoffset="140" stroke-linecap="round" transform="rotate(-90 230 153)"/>
    <text x="230" y="162" text-anchor="middle" font-family="Space Grotesk" font-size="26" fill="#fff" font-weight="700">+300%</text>`
};
let statIndex = 0;
const statFeature = document.getElementById('statFeature');
function renderStat(){
  const s = statItems[statIndex];
  statFeature.querySelector('.stat-feature-text').innerHTML = `
    <h3>${s.title}</h3>
    <p>${s.body}</p>
    <a href="#contact" class="cta">${s.cta}</a>`;
  statFeature.querySelector('.dash-mock').innerHTML = `
    <rect x="0" y="0" width="460" height="300" rx="14" fill="#0d0d10"/>
    <rect x="0" y="0" width="460" height="34" rx="14" fill="#151519"/>
    <circle cx="20" cy="17" r="4" fill="#e04b4b"/><circle cx="34" cy="17" r="4" fill="#e0b84b"/><circle cx="48" cy="17" r="4" fill="#4be07a"/>
    <rect x="26" y="56" width="140" height="10" rx="3" fill="#2a2a30"/>
    <rect x="26" y="76" width="90" height="8" rx="3" fill="#1e1e24"/>
    ${mockGraphics[s.mock]}`;
}
document.getElementById('statNext').addEventListener('click', () => { statIndex = (statIndex + 1) % statItems.length; renderStat(); });
document.getElementById('statPrev').addEventListener('click', () => { statIndex = (statIndex - 1 + statItems.length) % statItems.length; renderStat(); });

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

/* ---------- starfield canvas (client logos) — galaxy of drifting dots, no lines ---------- */
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
  const count = Math.floor((sw * sh) / 3200); // increased from previous density
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * sw, y: Math.random() * sh,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.4 + 0.3, a: Math.random()
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
  for (const s of stars) {
    if (!prefersReducedMotion) {
      // drifts on its own, all the time — a slow-but-alive galaxy motion
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = sw; if (s.x > sw) s.x = 0;
      if (s.y < 0) s.y = sh; if (s.y > sh) s.y = 0;
      s.a += (Math.random() - 0.5) * 0.02;
      s.a = Math.max(0.15, Math.min(1, s.a));
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