document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar burger toggle ─────────────────────────────────
  document.querySelectorAll('.navbar-burger').forEach(burger => {
    burger.addEventListener('click', () => {
      const target = document.getElementById(burger.dataset.target);
      burger.classList.toggle('is-active');
      target.classList.toggle('is-active');
    });
  });

  // ── Simple carousel ──────────────────────────────────────
  document.querySelectorAll('.simple-carousel').forEach(carousel => {
    const slides = carousel.querySelectorAll('.slide');
    const counter = carousel.querySelector('.carousel-counter');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    let idx = 0;
    function show(i) {
      slides.forEach(s => s.classList.remove('active'));
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add('active');
      if (counter) counter.textContent = `${idx + 1} / ${slides.length}`;
    }
    if (prevBtn) prevBtn.addEventListener('click', () => show(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => show(idx + 1));
    show(0);
  });

  // ── Entropy canvas background ────────────────────────────
  initEntropyCanvas();

  // ── Scroll reveal ────────────────────────────────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-revealed'));
  }

  // ── Count-up animation ───────────────────────────────────
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.countSuffix || '';
    const decimals = parseInt(el.dataset.countDecimals || '0', 10);
    const duration = 1100;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const countObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

  // ── Topology SVG edge animations ─────────────────────────
  document.querySelectorAll('.topo-card').forEach(card => {
    const lines = Array.from(card.querySelectorAll('line.topo-edge'));

    card.addEventListener('mouseenter', () => {
      lines.forEach((line, i) => {
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        line.style.strokeDasharray = `${len}`;
        line.style.strokeDashoffset = `${len}`;
        line.style.transition = 'none';
        line.getBoundingClientRect(); // force reflow
        line.style.transition = `stroke-dashoffset 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.09}s`;
        line.style.strokeDashoffset = '0';
      });
    });

    card.addEventListener('mouseleave', () => {
      lines.forEach(line => {
        const len = parseFloat(line.style.strokeDasharray) || 50;
        line.style.transition = 'stroke-dashoffset 0.3s ease-in';
        line.style.strokeDashoffset = `${len}`;
        // Clean up after leave animation
        setTimeout(() => {
          line.style.strokeDasharray = '';
          line.style.strokeDashoffset = '';
          line.style.transition = '';
        }, 350);
      });
    });
  });

});

// ── Entropy canvas ────────────────────────────────────────
function initEntropyCanvas() {
  const canvas = document.getElementById('entropy-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let raf = null;
  let t = 0;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each agent: center position, base sigma, amplitude, phase offset, color
  const agents = [
    { x: 0.12, sigma: 0.055, h: 0.72, phase: 0,    isHigh: false },
    { x: 0.30, sigma: 0.065, h: 0.85, phase: 1.1,  isHigh: false },
    { x: 0.50, sigma: 0.075, h: 0.90, phase: 2.2,  isHigh: false },
    { x: 0.70, sigma: 0.060, h: 0.78, phase: 3.3,  isHigh: false },
    { x: 0.88, sigma: 0.058, h: 0.68, phase: 0.6,  isHigh: false },
    { x: 0.50, sigma: 0.190, h: 0.38, phase: 1.5,  isHigh: true  }, // high-entropy wide curve
  ];

  function resize() {
    canvas.width  = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }

  function gaussian(x, mu, sigma) {
    const d = (x - mu) / sigma;
    return Math.exp(-0.5 * d * d);
  }

  function drawFrame() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    agents.forEach(agent => {
      const sigma = agent.sigma * (1 + 0.28 * Math.sin(t * 0.35 + agent.phase));
      const N = 300;

      ctx.beginPath();
      for (let j = 0; j <= N; j++) {
        const nx = j / N;
        const px = nx * W;
        const raw = gaussian(nx, agent.x, sigma);
        const py  = H - raw * H * (agent.isHigh ? 0.28 : 0.42) * agent.h;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      // Close to baseline
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();

      if (agent.isHigh) {
        ctx.strokeStyle = 'rgba(185, 50, 50, 0.13)';
        ctx.fillStyle   = 'rgba(185, 50, 50, 0.030)';
      } else {
        ctx.strokeStyle = 'rgba(50, 115, 220, 0.16)';
        ctx.fillStyle   = 'rgba(50, 115, 220, 0.030)';
      }
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fill();
    });

    t += 0.007;
    raf = requestAnimationFrame(drawFrame);
  }

  // Pause when hero leaves viewport (perf)
  const visObs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!raf) raf = requestAnimationFrame(drawFrame);
    } else {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
  });
  visObs.observe(canvas.parentElement);

  window.addEventListener('resize', () => {
    resize();
  });

  resize();

  if (prefersReduced) {
    // Draw a single static frame, no animation
    drawFrame();
    cancelAnimationFrame(raf);
    raf = null;
  } else {
    raf = requestAnimationFrame(drawFrame);
  }
}
