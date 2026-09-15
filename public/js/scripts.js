document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.getElementById('site-header');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const mobileOverlay = document.getElementById('mobile-overlay');

    function menuIsOpen() {
        return navLinks?.classList.contains('open');
    }

    function openMenu() {
        if (!navToggle || !navLinks) return;

        navToggle.classList.add('open');
        navLinks.classList.add('open');
        mobileOverlay?.classList.add('open');
        document.body.classList.add('menu-open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Fechar menu de navegação');
        navLinks.querySelector('a')?.focus();
    }

    function closeMenu({ restoreFocus = false } = {}) {
        if (!navToggle || !navLinks) return;

        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        mobileOverlay?.classList.remove('open');
        document.body.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menu de navegação');

        if (restoreFocus) navToggle.focus();
    }

    navToggle?.addEventListener('click', () => {
        menuIsOpen() ? closeMenu() : openMenu();
    });

    mobileOverlay?.addEventListener('click', () => closeMenu({ restoreFocus: true }));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuIsOpen()) {
            closeMenu({ restoreFocus: true });
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900 && menuIsOpen()) closeMenu();
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const selector = link.getAttribute('href');
            if (!selector || selector === '#') return;

            const target = document.querySelector(selector);
            if (!target) return;

            event.preventDefault();
            closeMenu();
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    });

    const filterButtons = [...document.querySelectorAll('.filter-btn')];
    const cards = [...document.querySelectorAll('.menu-card[data-category]')];
    const categoryHeadings = [...document.querySelectorAll('[data-category-heading]')];
    const categoryGrids = [...document.querySelectorAll('[data-category-grid]')];

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedCategory = button.dataset.filter;
            const showAll = selectedCategory === 'all';

            filterButtons.forEach((item) => {
                const isSelected = item === button;
                item.classList.toggle('active', isSelected);
                item.setAttribute('aria-pressed', String(isSelected));
            });

            cards.forEach((card) => {
                card.classList.toggle(
                    'hidden',
                    !showAll && card.dataset.category !== selectedCategory
                );
            });

            categoryHeadings.forEach((heading) => {
                heading.classList.toggle(
                    'hidden',
                    !showAll && heading.dataset.categoryHeading !== selectedCategory
                );
            });

            categoryGrids.forEach((grid) => {
                grid.classList.toggle(
                    'hidden',
                    !showAll && grid.dataset.categoryGrid !== selectedCategory
                );
            });
        });
    });

    const revealElements = document.querySelectorAll('.reveal');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach((element) => element.classList.add('revealed'));
    } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -45px' });

        revealElements.forEach((element) => revealObserver.observe(element));
    }

    let headerTicking = false;

    function updateHeader() {
        header?.classList.toggle('scrolled', window.scrollY > 36);
        headerTicking = false;
    }

    window.addEventListener('scroll', () => {
        if (headerTicking) return;
        headerTicking = true;
        window.requestAnimationFrame(updateHeader);
    }, { passive: true });

    updateHeader();

    const sections = document.querySelectorAll('section[id]');
    const trackedLinks = document.querySelectorAll('.nav-item[href^="#"]');

    if ('IntersectionObserver' in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                trackedLinks.forEach((link) => {
                    link.classList.toggle(
                        'active',
                        link.getAttribute('href') === `#${entry.target.id}`
                    );
                });
            });
        }, { rootMargin: '-25% 0px -62%', threshold: 0 });

        sections.forEach((section) => sectionObserver.observe(section));
    }

    document.querySelectorAll('.order-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const pizzaName = button.closest('.menu-card')?.querySelector('.pizza-title')?.textContent;
            const contactSection = document.getElementById('contato');

            if (pizzaName) {
                button.setAttribute('aria-label', `${pizzaName} selecionada. Ir para reservas`);
            }

            contactSection?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    });
});
