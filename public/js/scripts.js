document.documentElement.classList.add("reveal-ready");

document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("landing-header") || document.getElementById("site-header");
    const toggle = document.getElementById("landing-menu-toggle") || document.getElementById("menu-toggle");
    const navigation = document.getElementById("landing-nav-links") || document.getElementById("nav-links");
    const overlay = document.getElementById("landing-menu-overlay") || document.getElementById("menu-overlay");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

    const scrollProgressBar = document.getElementById("page-scroll-progress");
    const parallaxItems = [...document.querySelectorAll(".section-orb, .story-card, .feature-icon, .contact-glow")];
    let pageFrame = 0;

    function updatePageState() {
        pageFrame = 0;
        header?.classList.toggle("scrolled", window.scrollY > 36);

        const scrollableHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const pageProgress = clamp(window.scrollY / scrollableHeight, 0, 1);
        if (scrollProgressBar) scrollProgressBar.style.transform = `scaleX(${pageProgress})`;

        if (!reduceMotion.matches) {
            parallaxItems.forEach((item, index) => {
                const rect = item.getBoundingClientRect();
                if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
                const centerOffset = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
                const direction = index % 2 === 0 ? 1 : -1;
                const strength = item.matches(".section-orb, .contact-glow") ? 42 : 20;
                item.style.setProperty("--scroll-shift", `${clamp(centerOffset * strength * direction, -30, 30).toFixed(1)}px`);
            });
        }

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
    window.addEventListener("resize", requestPageUpdate, { passive: true });
    updatePageState();

    /* Entradas variadas e escalonadas ao rolar */
    document.querySelectorAll(".trust-grid, .menu-panel, .feature-grid").forEach((group) => {
        [...group.querySelectorAll(":scope > .reveal")].forEach((item, index) => {
            item.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 130}ms`);
            item.classList.add(index % 2 === 0 ? "reveal-left" : "reveal-right");
        });
    });

    document.querySelectorAll(".story-copy, .contact-copy").forEach((item) => item.classList.add("reveal-left"));
    document.querySelectorAll(".story-visual, .contact-card").forEach((item) => item.classList.add("reveal-right"));
    document.querySelectorAll(".section-heading, .price-list, .menu-cta").forEach((item) => item.classList.add("reveal-scale"));

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

    /* Os cards de pizza levam para a página de montagem */
    document.querySelectorAll(".menu-card[data-product]").forEach((card) => {
        const productName = card.dataset.product;
        const productUrl = `./pizza.html?produto=${encodeURIComponent(productName)}`;
        card.classList.add("is-clickable");
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "link");
        card.setAttribute("aria-label", `Montar pizza ${productName}`);

        card.addEventListener("click", (event) => {
            if (event.target.closest("a, button, select, input")) return;
            window.location.href = productUrl;
        });

        card.addEventListener("keydown", (event) => {
            if ((event.key === "Enter" || event.key === " ") && event.target === card) {
                event.preventDefault();
                window.location.href = productUrl;
            }
        });
    });

    const heroVideo = document.querySelector(".hero-image-section .landing-hero-background");
    if (heroVideo instanceof HTMLVideoElement) {
        heroVideo.muted = true;
        heroVideo.play().catch(() => {
            // O poster permanece visível quando o navegador bloqueia reprodução automática.
        });
    }

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
    const pizzaIngredients = {
        "Fernando": ["Molho artesanal", "Muçarela", "Orégano"],
        "Calabresa": ["Calabresa", "Cebola", "Muçarela", "Molho artesanal", "Orégano"],
        "4 Queijos": ["Mix de quatro queijos", "Molho artesanal", "Orégano"],
        "Muçarela": ["Muçarela", "Molho artesanal", "Tomate", "Orégano"],
        "Frango com catupiry": ["Frango", "Catupiry", "Orégano"],
        "Portuguesa": ["Presunto", "Ovos", "Cebola", "Ervilha", "Muçarela"],
        "Bacon especial": ["Bacon", "Muçarela", "Cebola", "Molho artesanal"],
        "Rúcula e tomate seco": ["Muçarela", "Rúcula", "Tomate seco"],
        "Carne seca com catupiry": ["Carne seca", "Cebola", "Catupiry"]
    };
    const extraIngredients = ["Bacon", "Catupiry", "Cheddar", "Cebola", "Azeitona", "Milho", "Tomate", "Rúcula"];
    let cart = [];
    let toastTimer = 0;

    try {
        const savedCart = JSON.parse(window.localStorage.getItem(cartStorageKey) || "[]");
        if (Array.isArray(savedCart)) {
            cart = savedCart
                .filter((item) => item && typeof item.name === "string" && item.quantity > 0)
                .map((item) => ({
                    ...item,
                    removedIngredients: Array.isArray(item.removedIngredients) ? item.removedIngredients : [],
                    addedIngredients: Array.isArray(item.addedIngredients) ? item.addedIngredients : [],
                    customizerOpen: Boolean(item.customizerOpen),
                    crust: typeof item.crust === "string" ? item.crust : "Sem borda recheada",
                    drink: typeof item.drink === "string" ? item.drink : "Sem bebida",
                    drinkQuantity: Number.isInteger(item.drinkQuantity) ? item.drinkQuantity : 0
                }));
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
            const lines = [`• ${item.quantity}x ${item.name} — ${size}`];
            if (item.removedIngredients?.length) lines.push(`  Sem: ${item.removedIngredients.join(", ")}`);
            if (item.addedIngredients?.length) lines.push(`  Adicionar: ${item.addedIngredients.join(", ")}`);
            if (item.crust && item.crust !== "Sem borda recheada") lines.push(`  Borda: ${item.crust}`);
            if (item.drink && item.drink !== "Sem bebida") lines.push(`  Bebida: ${item.drinkQuantity || 1}x ${item.drink}`);
            return lines.join("\n");
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

        cartItems.innerHTML = cart.map((item, index) => {
            const baseIngredients = pizzaIngredients[item.name] || ["Molho artesanal", "Muçarela", "Orégano"];
            const availableExtras = extraIngredients.filter((ingredient) => !baseIngredients.includes(ingredient));
            const removedIngredients = item.removedIngredients || [];
            const addedIngredients = item.addedIngredients || [];
            const customizationCount = removedIngredients.length + addedIngredients.length;

            return `
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
                    ${(item.crust && item.crust !== "Sem borda recheada") || (item.drink && item.drink !== "Sem bebida") ? `
                        <div class="cart-item-selections">
                            ${item.crust && item.crust !== "Sem borda recheada" ? `<span><b>Borda</b>${escapeHtml(item.crust)}</span>` : ""}
                            ${item.drink && item.drink !== "Sem bebida" ? `<span><b>Bebida</b>${item.drinkQuantity || 1}x ${escapeHtml(item.drink)}</span>` : ""}
                        </div>` : ""}
                </div>
                <div class="cart-item-actions">
                    <div class="cart-quantity" aria-label="Quantidade de ${escapeHtml(item.name)}">
                        <button type="button" data-cart-action="decrease" data-cart-index="${index}" aria-label="Diminuir quantidade">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-cart-action="increase" data-cart-index="${index}" aria-label="Aumentar quantidade">+</button>
                    </div>
                    <button class="cart-remove" type="button" data-cart-action="remove" data-cart-index="${index}" aria-label="Remover ${escapeHtml(item.name)}">×</button>
                </div>
                <details class="cart-customizer" data-customizer-index="${index}"${item.customizerOpen ? " open" : ""}>
                    <summary>
                        <span>Personalizar ingredientes</span>
                        <b>${customizationCount ? `${customizationCount} ${customizationCount === 1 ? "alteração" : "alterações"}` : "Adicionar ou retirar"}</b>
                    </summary>
                    <div class="ingredient-editor">
                        <p class="ingredient-group-label">Retirar da receita</p>
                        <div class="ingredient-options" role="group" aria-label="Ingredientes para retirar de ${escapeHtml(item.name)}">
                            ${baseIngredients.map((ingredient) => {
                                const selected = removedIngredients.includes(ingredient);
                                return `<button class="ingredient-option${selected ? " is-removed" : ""}" type="button" data-ingredient-action="remove" data-ingredient="${escapeHtml(ingredient)}" data-cart-index="${index}" aria-pressed="${selected}">${selected ? "− " : ""}${escapeHtml(ingredient)}</button>`;
                            }).join("")}
                        </div>
                        <p class="ingredient-group-label">Adicionar extras</p>
                        <div class="ingredient-options" role="group" aria-label="Ingredientes extras para ${escapeHtml(item.name)}">
                            ${availableExtras.map((ingredient) => {
                                const selected = addedIngredients.includes(ingredient);
                                return `<button class="ingredient-option${selected ? " is-added" : ""}" type="button" data-ingredient-action="add" data-ingredient="${escapeHtml(ingredient)}" data-cart-index="${index}" aria-pressed="${selected}">${selected ? "✓ " : "+ "}${escapeHtml(ingredient)}</button>`;
                            }).join("")}
                        </div>
                        <p class="ingredient-help">A disponibilidade e o valor dos extras são confirmados no atendimento.</p>
                    </div>
                </details>
            </div>`;
        }).join("");

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
                cart.push({
                    name,
                    quantity: 1,
                    size: "A escolher",
                    removedIngredients: [],
                    addedIngredients: [],
                    customizerOpen: false,
                    crust: "Sem borda recheada",
                    drink: "Sem bebida",
                    drinkQuantity: 0
                });
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
        const ingredientControl = event.target.closest("[data-ingredient-action]");
        if (ingredientControl) {
            const index = Number(ingredientControl.dataset.cartIndex);
            const item = cart[index];
            const ingredient = ingredientControl.dataset.ingredient;
            if (!Number.isInteger(index) || !item || !ingredient) return;

            const key = ingredientControl.dataset.ingredientAction === "remove"
                ? "removedIngredients"
                : "addedIngredients";
            item[key] = Array.isArray(item[key]) ? item[key] : [];

            const ingredientIndex = item[key].indexOf(ingredient);
            if (ingredientIndex >= 0) item[key].splice(ingredientIndex, 1);
            else item[key].push(ingredient);

            item.customizerOpen = true;
            renderCart();
            showCartToast(`${ingredient} ${ingredientIndex >= 0 ? "voltou à configuração original" : key === "removedIngredients" ? "será retirado" : "foi adicionado"}.`);
            return;
        }

        const control = event.target.closest("[data-cart-action]");
        if (!control) return;

        const index = Number(control.dataset.cartIndex);
        if (!Number.isInteger(index) || !cart[index]) return;

        if (control.dataset.cartAction === "increase") cart[index].quantity += 1;
        if (control.dataset.cartAction === "decrease") cart[index].quantity -= 1;
        if (control.dataset.cartAction === "remove" || cart[index].quantity <= 0) cart.splice(index, 1);
        renderCart();
    });

    cartItems?.addEventListener("toggle", (event) => {
        const customizer = event.target.closest?.("[data-customizer-index]");
        if (!customizer) return;
        const index = Number(customizer.dataset.customizerIndex);
        if (!Number.isInteger(index) || !cart[index]) return;
        cart[index].customizerOpen = customizer.open;
        saveCart();
    }, true);

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

    if (new URLSearchParams(window.location.search).get("carrinho") === "aberto" && cart.length) {
        setCart(true);
        try {
            window.history.replaceState({}, "", `${window.location.pathname}#cardapio`);
        } catch (_) {
            // Em abertura direta por arquivo, alguns navegadores não permitem limpar a URL.
        }
    }

    /* Vídeo sincronizado com a rolagem */
    const videoSection = document.getElementById("experiencia");
    const video = document.getElementById("scroll-video");
    const videoProgress = document.getElementById("video-progress-bar");
    const chapters = document.querySelectorAll("[data-video-chapter]");
    let videoReady = false;
    let targetTime = 0;
    let scrubFrame = 0;
    let scrollFrame = 0;

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
