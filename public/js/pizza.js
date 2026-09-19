document.addEventListener("DOMContentLoaded", () => {
    const products = {
        "Fernando": {
            tag: "Especial da casa",
            description: "Receita exclusiva da Bella Italia, preparada com a combinação especial da casa.",
            ingredients: ["Molho artesanal", "Muçarela", "Orégano"]
        },
        "Calabresa": {
            tag: "Clássica",
            description: "Calabresa fatiada, cebola, muçarela, molho artesanal e orégano.",
            ingredients: ["Calabresa", "Cebola", "Muçarela", "Molho artesanal", "Orégano"]
        },
        "4 Queijos": {
            tag: "Cremosa",
            description: "Uma combinação intensa e cremosa de quatro queijos selecionados.",
            ingredients: ["Mix de quatro queijos", "Molho artesanal", "Orégano"]
        },
        "Muçarela": {
            tag: "Tradicional",
            description: "Muçarela, molho artesanal, tomate e orégano em uma receita atemporal.",
            ingredients: ["Muçarela", "Molho artesanal", "Tomate", "Orégano"]
        },
        "Frango com catupiry": {
            tag: "Queridinha",
            description: "Frango temperado e desfiado com catupiry cremoso e orégano.",
            ingredients: ["Frango", "Catupiry", "Orégano"]
        },
        "Portuguesa": {
            tag: "Completa",
            description: "Presunto, ovos, cebola, ervilha, muçarela e o toque da casa.",
            ingredients: ["Presunto", "Ovos", "Cebola", "Ervilha", "Muçarela"]
        },
        "Bacon especial": {
            tag: "Defumada",
            description: "Bacon crocante, muçarela, cebola e molho artesanal.",
            ingredients: ["Bacon", "Muçarela", "Cebola", "Molho artesanal"]
        },
        "Rúcula e tomate seco": {
            tag: "Vegetariana",
            description: "Muçarela, rúcula fresca, tomate seco e finalização delicada.",
            ingredients: ["Muçarela", "Rúcula", "Tomate seco"]
        },
        "Carne seca com catupiry": {
            tag: "Marcante",
            description: "Carne seca desfiada, cebola e catupiry em uma combinação cremosa.",
            ingredients: ["Carne seca", "Cebola", "Catupiry"]
        }
    };

    const extras = ["Bacon", "Catupiry", "Cheddar", "Cebola", "Azeitona", "Milho", "Tomate", "Rúcula"];
    const crusts = [
        { name: "Sem borda recheada", large: "Sem acréscimo", family: "Sem acréscimo" },
        { name: "Catupiry", large: "R$ 7,00", family: "R$ 9,00" },
        { name: "Cheddar", large: "R$ 7,00", family: "R$ 9,00" },
        { name: "Calabresa com catupiry", large: "R$ 14,00", family: "R$ 18,00" },
        { name: "Muçarela", large: "R$ 14,00", family: "R$ 18,00" },
        { name: "Mista catupiry / cheddar", large: "R$ 7,00", family: "R$ 9,00" }
    ];
    const drinks = [
        { name: "Sem bebida", price: "" },
        { name: "Coca-Cola 2 litros", price: "R$ 18,00" },
        { name: "Coca-Cola Zero 2 litros", price: "R$ 18,00" },
        { name: "Fanta 2 litros", price: "R$ 15,00" },
        { name: "Sprite 2 litros", price: "R$ 15,00" },
        { name: "Cotuba 2 litros", price: "R$ 12,00" }
    ];

    const requestedName = new URLSearchParams(window.location.search).get("produto") || "Fernando";
    const productName = Object.prototype.hasOwnProperty.call(products, requestedName) ? requestedName : "Fernando";
    const product = products[productName];
    const cartStorageKey = "bella-italia-cart";
    const state = {
        size: "Grande",
        removedIngredients: [],
        addedIngredients: [],
        crust: "Sem borda recheada",
        drink: "Sem bebida",
        drinkQuantity: 1,
        quantity: 1
    };

    const elements = {
        name: document.getElementById("pizza-name"),
        tag: document.getElementById("pizza-tag"),
        description: document.getElementById("pizza-description"),
        sizeOptions: document.getElementById("size-options"),
        ingredientOptions: document.getElementById("ingredient-options"),
        extraOptions: document.getElementById("extra-options"),
        crustOptions: document.getElementById("crust-options"),
        drinkOptions: document.getElementById("drink-options"),
        drinkQuantity: document.getElementById("drink-quantity"),
        drinkQuantityValue: document.getElementById("drink-quantity-value"),
        pizzaQuantityValue: document.getElementById("pizza-quantity-value"),
        reviewName: document.getElementById("review-name"),
        orderSummary: document.getElementById("order-summary"),
        addOrder: document.getElementById("add-order"),
        viewCart: document.getElementById("view-cart"),
        cartCount: document.getElementById("mini-cart-count"),
        toast: document.getElementById("builder-toast")
    };

    const escapeHtml = (value) => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    function getCart() {
        try {
            const stored = JSON.parse(window.localStorage.getItem(cartStorageKey) || "[]");
            return Array.isArray(stored) ? stored : [];
        } catch (_) {
            return [];
        }
    }

    function updateCartCount(cart = getCart()) {
        const total = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        elements.cartCount.textContent = String(total);
    }

    function toggleArrayValue(list, value) {
        const index = list.indexOf(value);
        if (index >= 0) list.splice(index, 1);
        else list.push(value);
    }

    function renderSizes() {
        elements.sizeOptions.innerHTML = ["Grande", "Família"].map((size) => `
            <button class="size-option${state.size === size ? " is-selected" : ""}" type="button"
                data-size="${size}" role="radio" aria-checked="${state.size === size}">
                <strong>${size}</strong>
                <small>${size === "Grande" ? "Ideal para compartilhar" : "Mais pizza para a mesa toda"}</small>
            </button>`).join("");
    }

    function renderIngredients() {
        elements.ingredientOptions.innerHTML = product.ingredients.map((ingredient) => {
            const removed = state.removedIngredients.includes(ingredient);
            return `<button class="choice-chip${removed ? " is-removed" : ""}" type="button"
                data-remove-ingredient="${escapeHtml(ingredient)}" aria-pressed="${removed}">${removed ? "− " : "✓ "}${escapeHtml(ingredient)}</button>`;
        }).join("");

        const availableExtras = extras.filter((extra) => !product.ingredients.includes(extra));
        elements.extraOptions.innerHTML = availableExtras.map((extra) => {
            const added = state.addedIngredients.includes(extra);
            return `<button class="choice-chip${added ? " is-added" : ""}" type="button"
                data-add-ingredient="${escapeHtml(extra)}" aria-pressed="${added}">${added ? "✓ " : "+ "}${escapeHtml(extra)}</button>`;
        }).join("");
    }

    function renderCrusts() {
        elements.crustOptions.innerHTML = crusts.map((crust) => {
            const selected = state.crust === crust.name;
            const price = state.size === "Família" ? crust.family : crust.large;
            return `<button class="choice-card${selected ? " is-selected" : ""}" type="button"
                data-crust="${escapeHtml(crust.name)}" role="radio" aria-checked="${selected}">
                <strong>${escapeHtml(crust.name)}</strong>
                <small>${price ? `No tamanho ${state.size.toLowerCase()}: <b>${price}</b>` : ""}</small>
            </button>`;
        }).join("");
    }

    function renderDrinks() {
        elements.drinkOptions.innerHTML = drinks.map((drink) => {
            const selected = state.drink === drink.name;
            return `<button class="choice-card${selected ? " is-selected" : ""}" type="button"
                data-drink="${escapeHtml(drink.name)}" role="radio" aria-checked="${selected}">
                <strong>${escapeHtml(drink.name)}</strong>
                <small>${drink.price ? `<b>${drink.price}</b>` : "Continue sem refrigerante"}</small>
            </button>`;
        }).join("");
        elements.drinkQuantity.hidden = state.drink === "Sem bebida";
        elements.drinkQuantityValue.textContent = String(state.drinkQuantity);
    }

    function renderSummary() {
        const summary = [state.size];
        if (state.removedIngredients.length) summary.push(`Sem ${state.removedIngredients.join(", ")}`);
        if (state.addedIngredients.length) summary.push(`Com ${state.addedIngredients.join(", ")}`);
        if (state.crust !== "Sem borda recheada") summary.push(`Borda de ${state.crust}`);
        if (state.drink !== "Sem bebida") summary.push(`${state.drinkQuantity}x ${state.drink}`);

        elements.reviewName.textContent = `Pizza ${productName}`;
        elements.orderSummary.innerHTML = summary.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
        elements.pizzaQuantityValue.textContent = String(state.quantity);
    }

    function renderAll() {
        renderSizes();
        renderIngredients();
        renderCrusts();
        renderDrinks();
        renderSummary();
    }

    function showToast(message) {
        window.clearTimeout(showToast.timer);
        elements.toast.textContent = message;
        elements.toast.classList.add("show");
        showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
    }

    function sameConfiguration(item) {
        const itemRemoved = Array.isArray(item.removedIngredients) ? [...item.removedIngredients].sort() : [];
        const itemAdded = Array.isArray(item.addedIngredients) ? [...item.addedIngredients].sort() : [];
        return item.name === productName
            && item.size === state.size
            && JSON.stringify(itemRemoved) === JSON.stringify([...state.removedIngredients].sort())
            && JSON.stringify(itemAdded) === JSON.stringify([...state.addedIngredients].sort())
            && (item.crust || "Sem borda recheada") === state.crust
            && (item.drink || "Sem bebida") === state.drink
            && (Number(item.drinkQuantity) || 0) === (state.drink === "Sem bebida" ? 0 : state.drinkQuantity);
    }

    function addToCart() {
        const cart = getCart();
        const existing = cart.find(sameConfiguration);

        if (existing) {
            existing.quantity = (Number(existing.quantity) || 0) + state.quantity;
        } else {
            cart.push({
                name: productName,
                quantity: state.quantity,
                size: state.size,
                removedIngredients: [...state.removedIngredients],
                addedIngredients: [...state.addedIngredients],
                crust: state.crust,
                drink: state.drink,
                drinkQuantity: state.drink === "Sem bebida" ? 0 : state.drinkQuantity,
                customizerOpen: false
            });
        }

        try {
            window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
            updateCartCount(cart);
            elements.viewCart.hidden = false;
            elements.addOrder.innerHTML = "Adicionar novamente <span aria-hidden=\"true\">+</span>";
            showToast(`${state.quantity}x pizza ${productName} adicionada ao carrinho.`);
        } catch (_) {
            showToast("Não foi possível salvar o pedido neste navegador.");
        }
    }

    elements.sizeOptions.addEventListener("click", (event) => {
        const option = event.target.closest("[data-size]");
        if (!option) return;
        state.size = option.dataset.size;
        renderSizes();
        renderCrusts();
        renderSummary();
    });

    elements.ingredientOptions.addEventListener("click", (event) => {
        const option = event.target.closest("[data-remove-ingredient]");
        if (!option) return;
        toggleArrayValue(state.removedIngredients, option.dataset.removeIngredient);
        renderIngredients();
        renderSummary();
    });

    elements.extraOptions.addEventListener("click", (event) => {
        const option = event.target.closest("[data-add-ingredient]");
        if (!option) return;
        toggleArrayValue(state.addedIngredients, option.dataset.addIngredient);
        renderIngredients();
        renderSummary();
    });

    elements.crustOptions.addEventListener("click", (event) => {
        const option = event.target.closest("[data-crust]");
        if (!option) return;
        state.crust = option.dataset.crust;
        renderCrusts();
        renderSummary();
    });

    elements.drinkOptions.addEventListener("click", (event) => {
        const option = event.target.closest("[data-drink]");
        if (!option) return;
        state.drink = option.dataset.drink;
        renderDrinks();
        renderSummary();
    });

    document.addEventListener("click", (event) => {
        const counter = event.target.closest("[data-counter]");
        if (!counter) return;
        const difference = counter.dataset.direction === "increase" ? 1 : -1;
        const key = counter.dataset.counter === "drink" ? "drinkQuantity" : "quantity";
        state[key] = Math.min(20, Math.max(1, state[key] + difference));
        renderSummary();
        if (key === "drinkQuantity") elements.drinkQuantityValue.textContent = String(state.drinkQuantity);
    });

    elements.addOrder.addEventListener("click", addToCart);

    elements.name.textContent = productName;
    elements.tag.textContent = product.tag;
    elements.description.textContent = product.description;
    document.title = `${productName} — Bella Italia`;
    document.getElementById("current-year").textContent = String(new Date().getFullYear());
    updateCartCount();
    renderAll();
});
