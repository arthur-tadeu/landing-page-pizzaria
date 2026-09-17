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

    /* Carrinho de sabores */
    const cartToggle = document.getElementById("cart-toggle");
    const cartDrawer = document.getElementById("cart-drawer");
    const cartOverlay = document.getElementById("cart-overlay");
    const cartClose = document.getElementById("cart-close");
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartTotalItems = document.getElementById("cart-total-items");
    const cartCheckout = document.getElementById("cart-checkout");
    const cartClear = document.getElementById("cart-clear");
    const cartToast = document.getElementById("cart-toast");
    const cartStorageKey = "bella-italia-cart";
    let cart = [];
    let toastTimer = 0;

    try {
        const savedCart = JSON.parse(window.localStorage.getItem(cartStorageKey) || "[]");
        if (Array.isArray(savedCart)) {
            cart = savedCart.filter((item) => item && typeof item.name === "string" && item.quantity > 0);
        }
    } catch (_) {
        cart = [];
    }

    const escapeHtml = (value) => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    function saveCart() {
        try {
            window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
        } catch (_) {
            // O carrinho continua funcionando durante a sessão se o armazenamento estiver indisponível.
        }
    }

    function getCartTotal() {
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    function buildWhatsAppUrl() {
        const orderLines = cart.map((item) => {
            const size = item.size === "A escolher" ? "tamanho a confirmar" : item.size;
            return `• ${item.quantity}x ${item.name} — ${size}`;
        });
        const message = [
            "Olá! Gostaria de fazer um pedido na Bella Italia:",
            "",
            ...orderLines,
            "",
            "Podemos confirmar os valores e os demais detalhes?"
        ].join("\n");

        return `https://wa.me/5517997164451?text=${encodeURIComponent(message)}`;
    }

    function renderCart() {
        if (!cartItems || !cartCount || !cartTotalItems || !cartCheckout || !cartClear || !cartToggle) return;

        const total = getCartTotal();
        cartCount.textContent = String(total);
        cartTotalItems.textContent = String(total);
        cartToggle.setAttribute("aria-label", total
            ? `Abrir carrinho, ${total} ${total === 1 ? "item" : "itens"}`
            : "Abrir carrinho, nenhum item");

        if (!cart.length) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <span aria-hidden="true">0</span>
                    <strong>Seu carrinho está vazio</strong>
                    <p>Adicione seus sabores preferidos e monte o pedido com calma.</p>
                </div>`;
            cartCheckout.setAttribute("aria-disabled", "true");
            cartCheckout.setAttribute("href", "#");
            cartClear.disabled = true;
            saveCart();
            return;
        }

        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item" data-cart-index="${index}">
                <div>
                    <strong class="cart-item-name">${escapeHtml(item.name)}</strong>
                    <label class="cart-size-label">Tamanho
                        <select data-cart-size="${index}" aria-label="Tamanho da pizza ${escapeHtml(item.name)}">
                            <option${item.size === "A escolher" ? " selected" : ""}>A escolher</option>
                            <option${item.size === "Grande" ? " selected" : ""}>Grande</option>
                            <option${item.size === "Família" ? " selected" : ""}>Família</option>
                        </select>
                    </label>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-quantity" aria-label="Quantidade de ${escapeHtml(item.name)}">
                        <button type="button" data-cart-action="decrease" data-cart-index="${index}" aria-label="Diminuir quantidade">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-cart-action="increase" data-cart-index="${index}" aria-label="Aumentar quantidade">+</button>
                    </div>
                    <button class="cart-remove" type="button" data-cart-action="remove" data-cart-index="${index}" aria-label="Remover ${escapeHtml(item.name)}">×</button>
                </div>
            </div>`).join("");

        cartCheckout.setAttribute("aria-disabled", "false");
        cartCheckout.setAttribute("href", buildWhatsAppUrl());
        cartClear.disabled = false;
        saveCart();
    }

    function setCart(open) {
        if (!cartDrawer || !cartOverlay || !cartToggle) return;
        cartDrawer.classList.toggle("open", open);
        cartOverlay.classList.toggle("open", open);
        document.body.classList.toggle("cart-open", open);
        cartDrawer.setAttribute("aria-hidden", String(!open));
        cartToggle.setAttribute("aria-expanded", String(open));

        if (open) {
            setMenu(false);
            window.setTimeout(() => cartClose?.focus(), reduceMotion.matches ? 0 : 280);
        } else {
            cartToggle.focus();
        }
    }

    function showCartToast(message) {
        if (!cartToast) return;
        window.clearTimeout(toastTimer);
        cartToast.textContent = message;
        cartToast.classList.add("show");
        toastTimer = window.setTimeout(() => cartToast.classList.remove("show"), 2200);
    }

    document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
        button.addEventListener("click", () => {
            const name = button.dataset.addToCart;
            const existingItem = cart.find((item) => item.name === name);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ name, quantity: 1, size: "A escolher" });
            }

            renderCart();
            cartToggle?.classList.remove("bump");
            window.requestAnimationFrame(() => cartToggle?.classList.add("bump"));
            button.classList.add("added");
            const originalText = button.childNodes[0].textContent;
            button.childNodes[0].textContent = "Adicionado ";
            showCartToast(`${name} foi adicionado ao carrinho.`);

            window.setTimeout(() => {
                button.classList.remove("added");
                button.childNodes[0].textContent = originalText;
            }, 950);
        });
    });

    cartItems?.addEventListener("click", (event) => {
        const control = event.target.closest("[data-cart-action]");
        if (!control) return;

        const index = Number(control.dataset.cartIndex);
        if (!Number.isInteger(index) || !cart[index]) return;

        if (control.dataset.cartAction === "increase") cart[index].quantity += 1;
        if (control.dataset.cartAction === "decrease") cart[index].quantity -= 1;
        if (control.dataset.cartAction === "remove" || cart[index].quantity <= 0) cart.splice(index, 1);
        renderCart();
    });

    cartItems?.addEventListener("change", (event) => {
        const select = event.target.closest("[data-cart-size]");
        if (!select) return;
        const index = Number(select.dataset.cartSize);
        if (!Number.isInteger(index) || !cart[index]) return;
        cart[index].size = select.value;
        renderCart();
    });

    cartToggle?.addEventListener("click", () => setCart(!cartDrawer?.classList.contains("open")));
    cartClose?.addEventListener("click", () => setCart(false));
    cartOverlay?.addEventListener("click", () => setCart(false));
    cartClear?.addEventListener("click", () => {
        cart = [];
        renderCart();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && cartDrawer?.classList.contains("open")) setCart(false);
    });

    renderCart();

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
