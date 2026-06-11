(function () {
  'use strict';

  /* ---- Custom Cursor ---- */
  const cursorDot = document.getElementById('cursorDot');
  let mouseX = -100;
  let mouseY = -100;
  let dotX = -100;
  let dotY = -100;
  let cursorSuppressed = false;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!cursorSuppressed) {
      cursorDot.classList.remove('hidden');
    }
  });

  document.addEventListener('mouseleave', () => cursorDot.classList.add('hidden'));

  function animateCursor() {
    dotX += (mouseX - dotX) * 0.18;
    dotY += (mouseY - dotY) * 0.18;
    cursorDot.style.left = dotX + 'px';
    cursorDot.style.top = dotY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll(
    'a, button, .cylinder-card, .cylinder-slider, .keyword, .resume-btn, .nav-toggle, .scroll-hint, .modal-close, .modal-content, .rowing-shell'
  ).forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('hover'));
  });

  /* ---- Smooth Scroll (heavy + momentum) ---- */
  const smoothScroll = {
    enabled: window.matchMedia('(hover: hover) and (pointer: fine)').matches
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    current: 0,
    target: 0,
    velocity: 0,
    paused: false,
    wheelMultiplier: 0.25,
    friction: 0.78,
    ease: 0.0475,
    minVelocity: 0.12,
    maxScroll: 0,

    init() {
      this.syncFromWindow();
      this.updateMax();

      if (!this.enabled) return;

      window.addEventListener('wheel', e => this.onWheel(e), { passive: false });

      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
          const id = link.getAttribute('href');
          if (!id || id === '#') return;
          const el = document.querySelector(id);
          if (!el) return;
          e.preventDefault();
          this.scrollTo(el.getBoundingClientRect().top + window.scrollY);
        });
      });

      window.addEventListener('resize', () => {
        this.updateMax();
        this.target = Math.min(this.target, this.maxScroll);
      });
    },

    syncFromWindow() {
      this.current = window.scrollY;
      this.target = this.current;
      this.velocity = 0;
    },

    updateMax() {
      this.maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    },

    clamp(value) {
      return Math.max(0, Math.min(value, this.maxScroll));
    },

    onWheel(e) {
      if (this.paused) return;
      e.preventDefault();
      this.velocity += e.deltaY * this.wheelMultiplier;
    },

    scrollTo(y) {
      this.target = this.clamp(y);
      this.velocity = 0;
    },

    pause() {
      this.paused = true;
      this.velocity = 0;
    },

    resume() {
      this.paused = false;
      this.syncFromWindow();
    },

    tick() {
      if (this.enabled && !this.paused) {
        this.updateMax();

        this.target = this.clamp(this.target + this.velocity);
        this.velocity *= this.friction;

        if (this.target <= 0 || this.target >= this.maxScroll) {
          this.velocity *= 0.58;
        }
        if (Math.abs(this.velocity) < this.minVelocity) {
          this.velocity = 0;
        }

        const diff = this.target - this.current;
        this.current += diff * this.ease;

        if (Math.abs(diff) < 0.4 && Math.abs(this.velocity) < 0.08) {
          this.current = this.target;
        }

        window.scrollTo(0, this.current);
      }

      requestAnimationFrame(() => this.tick());
    }
  };

  smoothScroll.init();
  smoothScroll.tick();

  /* ---- Navigation ---- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  /* ---- Fade-in on scroll ---- */
  const fadeEls = document.querySelectorAll(
    '.section-title, .keywords, .about-text, .video-wrapper, .activity-block, .contact-grid, .contact-links'
  );
  fadeEls.forEach(el => el.classList.add('fade-in'));

  const fadeObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.15 }
  );
  fadeEls.forEach(el => fadeObserver.observe(el));

  /* ---- Photojournalism Cylinder ---- */
  const cylinder = document.getElementById('cylinder');
  const cylinderSlider = document.getElementById('cylinderSlider');
  const cards = cylinder.querySelectorAll('.cylinder-card');
  const cardCount = cards.length;
  const angleStep = 360 / cardCount;

  function getCylinderRadius() {
    return window.innerWidth <= 768 ? 330.88 : 406.12;
  }

  function layoutCylinderCards() {
    const radius = getCylinderRadius();
    cards.forEach((card, i) => {
      const angle = angleStep * i;
      card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    });
  }

  function updateCardHitTargets(rotationDeg) {
    cards.forEach((card, i) => {
      const worldAngle = (angleStep * i + rotationDeg) % 360;
      const facing = Math.cos((worldAngle * Math.PI) / 180);
      const isFront = facing > 0;

      card.classList.toggle('cylinder-card--front', isFront);
      card.setAttribute('aria-hidden', isFront ? 'false' : 'true');
    });
  }

  function setCylinderRotation(rotationDeg) {
    cylinder.style.transform = `rotateY(${rotationDeg}deg)`;
    updateCardHitTargets(rotationDeg);
  }

  layoutCylinderCards();

  let isDraggingSlider = false;

  if (cylinderSlider) {
    cylinderSlider.addEventListener('input', () => {
      setCylinderRotation(Number(cylinderSlider.value));
    });

    function startSliderDrag(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      isDraggingSlider = true;
      cursorSuppressed = true;
      cursorDot.classList.add('hidden');
      cursorDot.classList.remove('hover');
      cylinderSlider.classList.add('is-dragging');
    }

    function endSliderDrag() {
      if (!isDraggingSlider) return;

      isDraggingSlider = false;
      cursorSuppressed = false;
      cylinderSlider.classList.remove('is-dragging');
      cursorDot.classList.remove('hidden');
    }

    cylinderSlider.addEventListener('pointerdown', startSliderDrag);
    window.addEventListener('pointerup', endSliderDrag);
    window.addEventListener('pointercancel', endSliderDrag);
  }

  window.addEventListener('resize', layoutCylinderCards);
  setCylinderRotation(cylinderSlider ? Number(cylinderSlider.value) : 0);

  /* ---- Photo Modal ---- */
  const modal = document.getElementById('photoModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      if (!card.classList.contains('cylinder-card--front')) return;

      const info = card.querySelector('.card-info');
      modalTitle.textContent = info.querySelector('h4').textContent;
      modalText.textContent = info.querySelector('p').textContent;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      smoothScroll.pause();
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    smoothScroll.resume();
  }

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  /* ---- Rowing Shell Animation ---- */
  const rowingScene = document.getElementById('rowingScene');
  const rowingShell = document.getElementById('rowingShell');
  const shellTrack = document.getElementById('shellTrack');
  const waterPath = document.getElementById('waterPath');
  const rowingInfos = rowingScene.querySelectorAll('.rowing-info');
  const WATER_VIEWBOX = { width: 1200, height: 80 };
  const CARD_GAP_SCALE = 0.9215;
  const CARD_REVEAL_LEAD = 0.4;
  let shellProgress = 0;
  let isDraggingShell = false;

  function getShellMetrics() {
    const isMobile = window.innerWidth <= 768;
    return {
      isMobile,
      width: isMobile ? 80 : 120,
      height: isMobile ? 16 : 24,
      centerX: isMobile ? 40 : 60,
      centerY: isMobile ? 8 : 12
    };
  }

  function getPathPointAtLengthRatio(ratio) {
    if (!waterPath) return { x: 0, y: WATER_VIEWBOX.height / 2 };
    return waterPath.getPointAtLength(ratio * waterPath.getTotalLength());
  }

  function mapPathPointToTrack(pt) {
    const trackWidth = shellTrack.offsetWidth;
    const trackHeight = shellTrack.offsetHeight;

    return {
      x: (pt.x / WATER_VIEWBOX.width) * trackWidth,
      y: (pt.y / WATER_VIEWBOX.height) * trackHeight
    };
  }

  function positionShellOnPathByProgress(progress) {
    const { centerX, centerY } = getShellMetrics();
    const pt = mapPathPointToTrack(getPathPointAtLengthRatio(progress));

    rowingShell.style.left = `${pt.x - centerX}px`;
    rowingShell.style.top = `${pt.y - centerY}px`;
    rowingShell.style.transform = 'none';
  }

  function layoutRowingInfos() {
    if (!shellTrack || !rowingInfos.length) return;

    const { isMobile } = getShellMetrics();
    const count = rowingInfos.length;

    if (isMobile) {
      const topStart = 12;
      const topEnd = 76;
      const range = topEnd - topStart;
      const step = count > 1 ? (range / (count - 1)) * CARD_GAP_SCALE : 0;
      const offset = topStart + (range - step * (count - 1)) / 2;
      rowingInfos.forEach((info, i) => {
        info.style.left = '5%';
        info.style.top = `${offset + step * i}%`;
      });
      return;
    }

    const trackW = shellTrack.offsetWidth;
    const cardW = Math.min(180, Math.max(150, trackW * 0.16));
    document.documentElement.style.setProperty('--info-card-width', `${cardW}px`);

    const edgePad = cardW / 2 + 32;
    const span = Math.max(0, trackW - edgePad * 2);
    const step = count > 1 ? (span / (count - 1)) * CARD_GAP_SCALE : 0;
    const start = edgePad + (span - step * (count - 1)) / 2;

    rowingInfos.forEach((info, i) => {
      info.style.left = `${start + step * i}px`;
      info.style.top = '50%';
    });
  }

  function getCardStepPx() {
    const { isMobile } = getShellMetrics();
    const count = rowingInfos.length;

    if (isMobile) {
      const trackH = rowingScene.offsetHeight;
      const range = trackH * (76 - 12) / 100;
      return count > 1 ? (range / (count - 1)) * CARD_GAP_SCALE : 0;
    }

    const trackW = shellTrack.offsetWidth;
    const cardW = Math.min(180, Math.max(150, trackW * 0.16));
    const edgePad = cardW / 2 + 32;
    const span = Math.max(0, trackW - edgePad * 2);
    return count > 1 ? (span / (count - 1)) * CARD_GAP_SCALE : 0;
  }

  function updateInfoCardsFromProgress() {
    const shellRect = rowingShell.getBoundingClientRect();
    const shellCenterX = shellRect.left + shellRect.width / 2;
    const shellCenterY = shellRect.top + shellRect.height / 2;
    const { isMobile } = getShellMetrics();
    const revealLead = getCardStepPx() * CARD_REVEAL_LEAD;

    rowingInfos.forEach((info) => {
      const cardRect = info.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const passed = isMobile
        ? cardCenterY <= shellCenterY + revealLead
        : cardCenterX <= shellCenterX + revealLead;

      info.classList.toggle('visible', passed);
    });
  }

  function setShellProgress(progress) {
    if (!shellTrack) return;

    shellProgress = Math.max(0, Math.min(1, progress));
    positionShellOnPathByProgress(shellProgress);
    updateInfoCardsFromProgress();
    rowingShell.setAttribute('aria-valuenow', String(Math.round(shellProgress * 100)));
  }

  function progressFromPointer(clientX, clientY) {
    if (!waterPath || !shellTrack) return shellProgress;

    const trackRect = shellTrack.getBoundingClientRect();
    const px = clientX - trackRect.left;
    const py = clientY - trackRect.top;
    let bestProgress = 0;
    let bestDist = Infinity;

    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const pt = mapPathPointToTrack(getPathPointAtLengthRatio(t));
      const dist = Math.hypot(pt.x - px, pt.y - py);
      if (dist < bestDist) {
        bestDist = dist;
        bestProgress = t;
      }
    }

    return bestProgress;
  }

  function onShellPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    isDraggingShell = true;
    cursorSuppressed = true;
    cursorDot.classList.add('hidden');
    cursorDot.classList.remove('hover');
    rowingShell.classList.add('dragging');
    rowingShell.setPointerCapture(e.pointerId);
    smoothScroll.pause();
    setShellProgress(progressFromPointer(e.clientX, e.clientY));
    e.preventDefault();
  }

  function onShellPointerMove(e) {
    if (!isDraggingShell) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    setShellProgress(progressFromPointer(e.clientX, e.clientY));
    e.preventDefault();
  }

  function endShellDrag(e) {
    if (!isDraggingShell) return;

    isDraggingShell = false;
    cursorSuppressed = false;
    cursorDot.classList.remove('hidden');
    rowingShell.classList.remove('dragging');
    if (rowingShell.hasPointerCapture(e.pointerId)) {
      rowingShell.releasePointerCapture(e.pointerId);
    }
    smoothScroll.resume();
  }

  function onRowingLayoutChange() {
    layoutRowingInfos();
    setShellProgress(shellProgress);
  }

  layoutRowingInfos();
  setShellProgress(0);

  rowingShell.addEventListener('pointerdown', onShellPointerDown);
  rowingShell.addEventListener('pointermove', onShellPointerMove);
  rowingShell.addEventListener('pointerup', endShellDrag);
  rowingShell.addEventListener('pointercancel', endShellDrag);
  window.addEventListener('resize', onRowingLayoutChange);

  /* ---- Keyword hover ripple ---- */
  document.querySelectorAll('.keyword').forEach(kw => {
    kw.addEventListener('mouseenter', function () {
      this.style.transform = 'scale(1.05)';
    });
    kw.addEventListener('mouseleave', function () {
      this.style.transform = 'scale(1)';
    });
  });
})();
