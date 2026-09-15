document.documentElement.classList.add("reveal-ready");

document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("landing-header") || document.getElementById("site-header");
    const toggle = document.getElementById("landing-menu-toggle") || document.getElementById("menu-toggle");
    const navigation = document.getElementById("landing-nav-links") || document.getElementById("nav-links");
    const overlay = document.getElementById("landing-menu-overlay") || document.getElementById("menu-overlay");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const menuIsOpen = () => navigation?.classList.contains("open");

    function setMenu(open) {
        if (!toggle || !navigation || !overlay) return;

        navigation.classList.toggle("open", open);
        overlay.classList.toggle("open", open);
        toggle.classList.toggle("open", open);
        document.body.classList.toggle("menu-open", open);
        document.body.classList.toggle("landing-menu-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    }

    toggle?.addEventListener("click", () => setMenu(!menuIsOpen()));
    overlay?.addEventListener("click", () => setMenu(false));

    navigation?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuIsOpen()) {
            setMenu(false);
            toggle?.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 850 && menuIsOpen()) setMenu(false);
    }, { passive: true });

    let pageFrame = 0;

    function updatePageState() {
        pageFrame = 0;
        header?.classList.toggle("scrolled", window.scrollY > 36);

        const sections = [...document.querySelectorAll("main section[id]")];
        const marker = window.scrollY + Math.min(220, window.innerHeight * 0.32);
        let currentId = "hero-section";

        sections.forEach((section) => {
            if (section.offsetTop <= marker) currentId = section.id;
        });

        navigation?.querySelectorAll("a[href^='#']").forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
        });
    }

    function requestPageUpdate() {
        if (!pageFrame) pageFrame = window.requestAnimationFrame(updatePageState);
    }

    window.addEventListener("scroll", requestPageUpdate, { passive: true });
    updatePageState();

    /* Entrada suave das seções */
    const revealItems = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window && !reduceMotion.matches) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("revealed");
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: "0px 0px -10% 0px",
            threshold: 0.08
        });

        revealItems.forEach((item) => revealObserver.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("revealed"));
    }

    /* Filtros do cardápio */
    const filterButtons = document.querySelectorAll("[data-filter]");
    const menuPanels = document.querySelectorAll("[data-panel]");

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selected = button.dataset.filter;

            filterButtons.forEach((item) => {
                const active = item === button;
                item.classList.toggle("active", active);
                item.setAttribute("aria-pressed", String(active));
            });

            menuPanels.forEach((panel) => {
                const active = panel.dataset.panel === selected;
                panel.hidden = !active;
                panel.classList.toggle("active", active);

                if (active) {
                    window.requestAnimationFrame(() => {
                        panel.querySelectorAll(".reveal").forEach((item) => item.classList.add("revealed"));
                    });
                }
            });
        });
    });

    /* Vídeo sincronizado com a rolagem */
    const videoSection = document.getElementById("experiencia");
    const video = document.getElementById("scroll-video");
    const videoProgress = document.getElementById("video-progress-bar");
    const chapters = document.querySelectorAll("[data-video-chapter]");
    let videoReady = false;
    let targetTime = 0;
    let scrubFrame = 0;
    let scrollFrame = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    function setActiveChapter(progress) {
        const activeChapter = progress < 0.3 ? "1" : progress < 0.66 ? "2" : "3";

        chapters.forEach((chapter) => {
            chapter.classList.toggle("active", chapter.dataset.videoChapter === activeChapter);
        });
    }

    function scrubVideo() {
        scrubFrame = 0;
        if (!videoReady || !video || reduceMotion.matches) return;

        const difference = targetTime - video.currentTime;

        if (Math.abs(difference) < 0.012) {
            video.currentTime = targetTime;
            return;
        }

        video.currentTime += difference * 0.13;
        scrubFrame = window.requestAnimationFrame(scrubVideo);
    }

    function updateScrollVideo() {
        scrollFrame = 0;
        if (!videoSection) return;

        const rect = videoSection.getBoundingClientRect();
        const scrollRange = Math.max(1, videoSection.offsetHeight - window.innerHeight);
        const progress = clamp(-rect.top / scrollRange, 0, 1);
        const sectionNearby = rect.bottom > -window.innerHeight && rect.top < window.innerHeight * 2;

        if (videoProgress) {
            videoProgress.style.transform = `scaleX(${progress})`;
        }

        setActiveChapter(progress);

        if (videoReady && sectionNearby && video && Number.isFinite(video.duration)) {
            targetTime = progress * Math.max(0, video.duration - 0.08);
            if (!scrubFrame) scrubFrame = window.requestAnimationFrame(scrubVideo);
        }
    }

    function requestVideoUpdate() {
        if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollVideo);
    }

    if (video && videoSection) {
        video.pause();

        const prepareVideo = () => {
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;
            videoReady = true;
            updateScrollVideo();
        };

        if (video.readyState >= 1) prepareVideo();
        video.addEventListener("loadedmetadata", prepareVideo, { once: true });
        video.addEventListener("error", () => videoSection.classList.add("video-fallback"), { once: true });
        window.addEventListener("scroll", requestVideoUpdate, { passive: true });
        window.addEventListener("resize", requestVideoUpdate, { passive: true });
        updateScrollVideo();
    }

    reduceMotion.addEventListener?.("change", () => {
        if (reduceMotion.matches && scrubFrame) {
            window.cancelAnimationFrame(scrubFrame);
            scrubFrame = 0;
        }
        updateScrollVideo();
    });

    const year = document.getElementById("current-year");
    if (year) year.textContent = String(new Date().getFullYear());
});
