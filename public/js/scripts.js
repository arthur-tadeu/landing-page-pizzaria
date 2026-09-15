/* ==========================================================================
   BELLA ITALIA — Enhanced Interactive Features
   Scroll video sync, mobile menu, category filters, scroll animations,
   active nav tracking, accessibility (reduced-motion, focus trap).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ──────────────────────────────────────────────
    // Detect user preferences
    // ──────────────────────────────────────────────
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ──────────────────────────────────────────────
    // 1. SCROLL-SYNCED VIDEO
    // ──────────────────────────────────────────────
    const video = document.getElementById('scroll-video');
    const heroSection = document.getElementById('hero-section');

    if (video && heroSection) {
        let targetTime = 0;
        let currentTime = 0;
        let isVideoReady = false;
        let isPageVisible = true;

        // Track page visibility to save resources
        document.addEventListener('visibilitychange', () => {
            isPageVisible = !document.hidden;
        });

        const onVideoReady = () => {
            isVideoReady = true;
        };

        video.addEventListener('loadedmetadata', onVideoReady);

        // If metadata already loaded
        if (video.readyState >= 1) {
            isVideoReady = true;
        }

        if (!prefersReducedMotion) {
            // Smooth lerp-based sync loop via rAF
            const lerpFactor = 0.1; // Controls smoothness (lower = smoother)
            const threshold = 0.02; // Minimum difference to update

            function syncVideoWithScroll() {
                if (!isVideoReady || !video.duration || !isPageVisible) {
                    requestAnimationFrame(syncVideoWithScroll);
                    return;
                }

                const rect = heroSection.getBoundingClientRect();
                const sectionHeight = heroSection.offsetHeight - window.innerHeight;

                // Calculate scroll progress as 0..1
                const scrollProgress = Math.min(Math.max(-rect.top / sectionHeight, 0), 1);

                // Target time in the video timeline
                targetTime = scrollProgress * video.duration;

                // Interpolate smoothly toward target
                const delta = targetTime - currentTime;
                if (Math.abs(delta) > threshold) {
                    currentTime += delta * lerpFactor;

                    // Clamp to valid range
                    currentTime = Math.max(0, Math.min(currentTime, video.duration));

                    try {
                        video.currentTime = currentTime;
                    } catch (e) {
                        // Fallback: some browsers throw when seeking rapidly
                    }
                }

                requestAnimationFrame(syncVideoWithScroll);
            }

            requestAnimationFrame(syncVideoWithScroll);
        } else {
            // Reduced motion: show first frame as poster
            video.currentTime = 0;
        }
    }

    // ──────────────────────────────────────────────
    // 2. MOBILE MENU
    // ──────────────────────────────────────────────
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const mobileOverlay = document.getElementById('mobile-overlay');

    if (navToggle && navLinks) {
        const focusableSelectors = 'a[href], button:not([disabled])';
        let previouslyFocused = null;

        function openMenu() {
            navToggle.classList.add('open');
            navLinks.classList.add('open');
            if (mobileOverlay) mobileOverlay.classList.add('open');
            navToggle.setAttribute('aria-expanded', 'true');
            navToggle.setAttribute('aria-label', 'Fechar menu de navegação');
            document.body.style.overflow = 'hidden';
            previouslyFocused = document.activeElement;

            // Focus first nav item
            const firstItem = navLinks.querySelector('.nav-item');
            if (firstItem) firstItem.focus();
        }

        function closeMenu() {
            navToggle.classList.remove('open');
            navLinks.classList.remove('open');
            if (mobileOverlay) mobileOverlay.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Abrir menu de navegação');
            document.body.style.overflow = '';

            // Restore focus
            if (previouslyFocused) previouslyFocused.focus();
        }

        function isMenuOpen() {
            return navLinks.classList.contains('open');
        }

        navToggle.addEventListener('click', () => {
            isMenuOpen() ? closeMenu() : openMenu();
        });

        // Close on overlay click
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', closeMenu);
        }

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen()) {
                closeMenu();
            }
        });

        // Close on nav link click
        navLinks.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen()) closeMenu();
            });
        });

        // Simple focus trap within mobile menu
        navLinks.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab' || !isMenuOpen()) return;

            const focusable = navLinks.querySelectorAll(focusableSelectors);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    // ──────────────────────────────────────────────
    // 3. SMOOTH SCROLL for Nav Links
    // ──────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth'
                });
            }
        });
    });

    // ──────────────────────────────────────────────
    // 4. CATEGORY FILTERS
    // ──────────────────────────────────────────────
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuCards = document.querySelectorAll('.menu-card[data-category]');
    const categoryHeadings = document.querySelectorAll('.menu-category-heading');
    const categoryGrids = document.querySelectorAll('[data-category-grid]');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // Update active state
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            // Show/hide cards
            menuCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });

            // Show/hide category headings and grids
            categoryHeadings.forEach(heading => {
                const cat = heading.dataset.categoryHeading;
                if (filter === 'all' || cat === filter) {
                    heading.classList.remove('hidden');
                } else {
                    heading.classList.add('hidden');
                }
            });

            categoryGrids.forEach(grid => {
                const cat = grid.dataset.categoryGrid;
                if (filter === 'all' || cat === filter) {
                    grid.style.display = '';
                } else {
                    grid.style.display = 'none';
                }
            });
        });
    });

    // ──────────────────────────────────────────────
    // 5. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
    // ──────────────────────────────────────────────
    if (!prefersReducedMotion) {
        const revealElements = document.querySelectorAll('.reveal');

        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            revealElements.forEach(el => revealObserver.observe(el));
        } else {
            // Fallback: reveal all immediately
            revealElements.forEach(el => el.classList.add('revealed'));
        }
    } else {
        // Reduced motion: show everything immediately
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('revealed');
        });
    }

    // ──────────────────────────────────────────────
    // 6. NAVBAR SCROLL STATE
    // ──────────────────────────────────────────────
    const navbar = document.querySelector('.navbar-container');

    if (navbar) {
        let ticking = false;

        function updateNavbar() {
            if (window.scrollY > 80) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        }, { passive: true });

        // Initial check
        updateNavbar();
    }

    // ──────────────────────────────────────────────
    // 7. ACTIVE NAV INDICATOR (section tracking)
    // ──────────────────────────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-item[href^="#"]');

    if (sections.length > 0 && navItems.length > 0 && 'IntersectionObserver' in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navItems.forEach(item => {
                        item.classList.toggle('active', item.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '-20% 0px -60% 0px'
        });

        sections.forEach(section => sectionObserver.observe(section));
    }
});