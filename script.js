(function () {
  'use strict';

  /* ---- Custom Cursor ---- */
  const cursorDot = document.getElementById('cursorDot');
  let mouseX = -100;
  let mouseY = -100;
  let dotX = -100;
  let dotY = -100;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.classList.remove('hidden');
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
    'a, button, .cylinder-card, .keyword, .resume-btn, .nav-toggle, .scroll-hint, .modal-close'
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
    wheelMultiplier: 0.2,
    friction: 0.78,
    ease: 0.038,
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
  const cylinderScene = document.getElementById('cylinderScene');
  const cards = cylinder.querySelectorAll('.cylinder-card');
  const cardCount = cards.length;
  const angleStep = 360 / cardCount;
  const radius = window.innerWidth <= 768 ? 220 : 280;

  cards.forEach((card, i) => {
    const angle = angleStep * i;
    card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
  });

  let cylinderRotation = 0;
  let sceneActive = false;

  const sceneObserver = new IntersectionObserver(
    entries => {
      sceneActive = entries[0].isIntersecting;
    },
    { threshold: 0.3 }
  );
  sceneObserver.observe(cylinderScene);

  window.addEventListener('scroll', () => {
    if (!sceneActive) return;
    const rect = cylinderScene.getBoundingClientRect();
    const progress = 1 - rect.top / window.innerHeight;
    cylinderRotation = progress * 360;
    cylinder.style.transform = `rotateY(${cylinderRotation}deg)`;
  }, { passive: true });

  /* ---- Photo Modal ---- */
  const modal = document.getElementById('photoModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const info = card.querySelector('.card-info');
      modalTitle.textContent = info.querySelector('h4').textContent;
      modalText.textContent = info.querySelector('p').textContent;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      smoothScroll.pause();
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
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
  const rowingInfos = rowingScene.querySelectorAll('.rowing-info');
  let rowingActive = false;

  const rowingObserver = new IntersectionObserver(
    entries => {
      rowingActive = entries[0].isIntersecting;
    },
    { threshold: 0.2 }
  );
  rowingObserver.observe(rowingScene);

  function updateRowing() {
    if (!rowingActive) return;

    const rect = rowingScene.getBoundingClientRect();
    const sceneHeight = rowingScene.offsetHeight;
    const scrollProgress = Math.max(0, Math.min(1,
      (window.innerHeight - rect.top) / (window.innerHeight + sceneHeight * 0.6)
    ));

    const isMobile = window.innerWidth <= 768;
    const maxTravel = isMobile ? sceneHeight - 60 : window.innerWidth - 140;
    const shellPos = scrollProgress * maxTravel;

    if (isMobile) {
      rowingShell.style.left = '10px';
      rowingShell.style.top = `${shellPos}px`;
      rowingShell.style.transform = 'none';
    } else {
      rowingShell.style.top = '50%';
      rowingShell.style.left = `${shellPos}px`;
      rowingShell.style.transform = 'translateY(-50%)';
    }

    const stepCount = rowingInfos.length;
    rowingInfos.forEach((info, i) => {
      const stepStart = i / stepCount;
      const stepEnd = (i + 1) / stepCount;
      const inStep = scrollProgress >= stepStart - 0.05 && scrollProgress <= stepEnd + 0.1;
      info.classList.toggle('visible', inStep);
    });
  }

  window.addEventListener('scroll', updateRowing, { passive: true });
  window.addEventListener('resize', updateRowing);
  updateRowing();

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
