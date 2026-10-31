(() => {
  const TOTAL_FRAMES = 238;
  const canvas = document.getElementById('animation-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('loader');
  const progressText = document.getElementById('loader-progress');
  const heroContent = document.getElementById('hero-content');
  const navbar = document.getElementById('navbar');
  const scrollWrapper = document.querySelector('.hero-scroll-wrapper');

  const images = [];
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let renderedFrame = -1;
  let lastCanvasWidth = 0;
  let lastCanvasHeight = 0;

  // Initialize Lenis smooth momentum scrolling
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);
  }

  // Connect GSAP ScrollTrigger with Lenis if available
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    // Initialize luxury scroll reveal animations
    initGsapAnimations();
  }

  function initGsapAnimations() {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Brand Statement reveal
    gsap.from('.statement-headline', {
      scrollTrigger: {
        trigger: '#brand-statement',
        start: 'top 80%',
      },
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
    });

    gsap.from('.statement-body, .statement-pillars-row', {
      scrollTrigger: {
        trigger: '#brand-statement',
        start: 'top 75%',
      },
      y: 30,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power2.out',
    });

    gsap.from('.statement-media-card', {
      scrollTrigger: {
        trigger: '.statement-media-col',
        start: 'top 80%',
      },
      scale: 0.94,
      opacity: 0,
      duration: 1.2,
      ease: 'power2.out',
    });

    // Portfolio cards stagger reveal
    gsap.from('.project-card', {
      scrollTrigger: {
        trigger: '#portfolio',
        start: 'top 75%',
      },
      y: 50,
      opacity: 0,
      duration: 0.9,
      stagger: 0.2,
      ease: 'power2.out',
    });

    // Services cards stagger reveal
    gsap.from('.service-feature-card, .service-sub-card, .service-split-card', {
      scrollTrigger: {
        trigger: '#services',
        start: 'top 78%',
      },
      y: 45,
      opacity: 0,
      duration: 0.95,
      stagger: 0.18,
      ease: 'power2.out',
    });

    // Process timeline & stages reveal
    gsap.from('.process-timeline-track', {
      scrollTrigger: {
        trigger: '#process',
        start: 'top 80%',
      },
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.2,
      ease: 'power2.out',
    });

    gsap.from('.process-stage-item', {
      scrollTrigger: {
        trigger: '#process',
        start: 'top 75%',
      },
      y: 40,
      opacity: 0,
      duration: 0.85,
      stagger: 0.16,
      ease: 'power2.out',
    });
  }

  // Handle Mobile Hamburger Navigation Drawer
  const hamburgerBtn = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = hamburgerBtn.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close mobile nav when clicking any mobile link
    mobileNav.querySelectorAll('.mobile-nav-link, .mobile-quote-btn').forEach((link) => {
      link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Handle smooth navigation clicks
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(targetElem, { offset: -30, duration: 1.3 });
        } else {
          targetElem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  function getFramePath(index) {
    const pad = String(index).padStart(3, '0');
    return `frames/ezgif-frame-${pad}.jpg`;
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Force redraw on resize
    renderedFrame = -1;
    render();
  }

  function getRenderableImage(targetIndex) {
    if (images[targetIndex] && images[targetIndex].complete && images[targetIndex].naturalWidth > 0) {
      return images[targetIndex];
    }
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = targetIndex - offset;
      if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
        return images[prev];
      }
      const next = targetIndex + offset;
      if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
        return images[next];
      }
    }
    return null;
  }

  function drawImageCover(img) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const iWidth = img.naturalWidth;
    const iHeight = img.naturalHeight;

    const scale = Math.max(cWidth / iWidth, cHeight / iHeight);
    const drawWidth = iWidth * scale;
    const drawHeight = iHeight * scale;
    const offsetX = (cWidth - drawWidth) / 2;
    const offsetY = (cHeight - drawHeight) / 2;

    ctx.clearRect(0, 0, cWidth, cHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    lastCanvasWidth = cWidth;
    lastCanvasHeight = cHeight;
  }

  function render() {
    const frameIndex = Math.round(currentFrame);
    if (
      frameIndex === renderedFrame &&
      canvas.width === lastCanvasWidth &&
      canvas.height === lastCanvasHeight
    ) {
      return;
    }

    const img = getRenderableImage(frameIndex);
    if (img) {
      drawImageCover(img);
      renderedFrame = frameIndex;
    }
  }

  function updateScrollProgress() {
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const wrapperHeight = scrollWrapper ? scrollWrapper.offsetHeight : window.innerHeight * 1.75;
    const maxScroll = Math.max(1, wrapperHeight - window.innerHeight);

    // Frame scrubbing progress within the hero wrapper
    const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));
    targetFrame = progress * (TOTAL_FRAMES - 1);

    // Hero Text Fade & Parallax on scroll
    // Fades smoothly over the first 35% of the hero scroll distance
    const fadeThreshold = 0.35;
    const fadeRatio = Math.min(1, progress / fadeThreshold);
    const heroOpacity = Math.max(0, 1 - fadeRatio);
    const heroTranslateY = -45 * fadeRatio;

    if (heroContent) {
      heroContent.style.opacity = heroOpacity.toFixed(3);
      heroContent.style.transform = `translateY(${heroTranslateY.toFixed(1)}px)`;
      heroContent.style.visibility = heroOpacity <= 0 ? 'hidden' : 'visible';
    }

    // Navbar background blur and active state
    if (navbar) {
      if (scrollTop > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // Active navigation link tracking
    updateActiveNavLink(scrollTop);
  }

  function updateActiveNavLink(scrollTop) {
    const sections = [
      { id: 'contact', elem: document.getElementById('contact'), link: document.getElementById('nav-contact') },
      { id: 'process', elem: document.getElementById('process'), link: document.getElementById('nav-process') },
      { id: 'services', elem: document.getElementById('services'), link: document.getElementById('nav-services') },
      { id: 'about', elem: document.getElementById('about'), link: document.getElementById('nav-about') },
      { id: 'portfolio', elem: document.getElementById('portfolio'), link: document.getElementById('nav-portfolio') },
      { id: 'home', elem: document.getElementById('home'), link: document.getElementById('nav-home') },
    ];

    const scrollPoint = scrollTop + 160;

    for (const section of sections) {
      if (section.elem) {
        if (scrollPoint >= section.elem.offsetTop) {
          sections.forEach((s) => {
            if (s.link) s.link.classList.remove('active');
            const mobileLink = document.querySelector(`.mobile-nav-link[href="#${s.id}"]`);
            if (mobileLink) mobileLink.classList.remove('active');
          });
          if (section.link) section.link.classList.add('active');
          const activeMobile = document.querySelector(`.mobile-nav-link[href="#${section.id}"]`);
          if (activeMobile) activeMobile.classList.add('active');
          break;
        }
      }
    }
  }

  function tick() {
    updateScrollProgress();

    // Lerp damping for silky smooth scrub
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.0001) {
      currentFrame += diff * 0.12;
    } else {
      currentFrame = targetFrame;
    }

    // Only render canvas when near or inside the hero wrapper to conserve CPU/GPU
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const wrapperHeight = scrollWrapper ? scrollWrapper.offsetHeight : window.innerHeight * 2;
    if (scrollTop <= wrapperHeight + 100) {
      render();
    }

    requestAnimationFrame(tick);
  }

  // Preload frames
  function preloadImages() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);

      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (progressText) {
          progressText.textContent = percent;
        }

        // Render first frame immediately once loaded
        if (i === 1 && renderedFrame === -1) {
          render();
        }

        // Hide preloader when all frames are ready
        if (loadedCount === TOTAL_FRAMES) {
          setTimeout(() => {
            loader.classList.add('loaded');
          }, 200);
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          loader.classList.add('loaded');
        }
      };

      images.push(img);
    }
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  preloadImages();
  requestAnimationFrame(tick);
})();
