document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("landing-header");
    const toggle = document.getElementById("landing-menu-toggle");
    const navigation = document.getElementById("landing-nav-links");
    const overlay = document.getElementById("landing-menu-overlay");

    function menuIsOpen() {
        return navigation.classList.contains("open");
    }

    function openMenu() {
        navigation.classList.add("open");
        overlay.classList.add("open");
        toggle.classList.add("open");

        document.body.classList.add("landing-menu-open");

        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Fechar menu");
    }

    function closeMenu() {
        navigation.classList.remove("open");
        overlay.classList.remove("open");
        toggle.classList.remove("open");

        document.body.classList.remove("landing-menu-open");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menu");
    }

    toggle.addEventListener("click", () => {
        if (menuIsOpen()) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    overlay.addEventListener("click", closeMenu);

    navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuIsOpen()) {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 850 && menuIsOpen()) {
            closeMenu();
        }
    });

    function updateHeader() {
        header.classList.toggle("scrolled", window.scrollY > 40);
    }

    window.addEventListener("scroll", updateHeader, {
        passive: true
    });

    updateHeader();
});