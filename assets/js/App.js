"use strict";

/* =========================================================
   NOVA — main application script
   Sections:
   1. State & constants
   2. Utilities
   3. Product data (fetch)
   4. Cart (localStorage)
   5. Popular offers
   6. Product grid + pagination (index page)
   7. Category filter (index page)
   8. Search (mobile overlay + desktop dropdown)
   9. Product detail page (product.html)
   10. Burger menu
   11. Mobile search overlay open/close
   12. Login modal (front-end only, no backend yet)
   13. Bootstrap / init
========================================================= */

// ---------- 1. State & constants ----------
let products = []; // cached product list, shared by every feature on the page

const CART_STORAGE_KEY = "novaCart";
const PRODUCTS_PER_PAGE = 8;

// small inline icons reused by JS-generated markup
const ICON_PLUS =
  '<svg viewBox="0 0 640 640"><path fill="#fff" d="M344 120C344 106.7 333.3 96 320 96C306.7 96 296 106.7 296 120L296 296L120 296C106.7 296 96 306.7 96 320C96 333.3 106.7 344 120 344L296 344L296 520C296 533.3 306.7 544 320 544C333.3 544 344 533.3 344 520L344 344L520 344C533.3 344 544 333.3 544 320C544 306.7 533.3 296 520 296L344 296L344 120z"/></svg>';
const ICON_MINUS =
  '<svg viewBox="0 0 640 640"><path fill="#fff" d="M96 320C96 306.7 106.7 296 120 296L520 296C533.3 296 544 306.7 544 320C544 333.3 533.3 344 520 344L120 344C106.7 344 96 333.3 96 320z"/></svg>';
const ICON_TRASH =
  '<svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/></svg>';

// ---------- 2. Utilities ----------

// format a number the way the rest of the UI does: 260000 -> "260.000"
function formatPrice(value) {
  return Number(value || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// tiny toast for lightweight feedback ("added to cart", etc.)
function showToast(message) {
  let container = document.querySelector(".novaToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.className = "novaToastContainer";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "novaToast";
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// ---------- 3. Product data ----------
async function fetchProducts() {
  try {
    const response = await fetch("assets/data/productsAPI.json");
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    products = data.products || [];
  } catch (error) {
    console.error("Failed to load products:", error);
    products = [];

    const mainArea = document.querySelector("main") || document.querySelector("section");
    if (mainArea) {
      mainArea.insertAdjacentHTML(
        "afterbegin",
        `<div class="container py-4 text-danger">خطا در دریافت محصولات. لطفا اتصال اینترنت خود را بررسی کنید.</div>`
      );
    }
  }
  return products;
}

// ---------- 4. Cart (localStorage) ----------
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadges();
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }

  saveCart(cart);
  renderCartItems();
}

function setCartItemQty(productId, qty) {
  let cart = getCart();

  if (qty <= 0) {
    cart = cart.filter((item) => item.id !== productId);
  } else {
    const item = cart.find((i) => i.id === productId);
    if (item) item.qty = qty;
  }

  saveCart(cart);
  renderCartItems();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadges() {
  const count = getCartCount();
  document.querySelectorAll(".cartCountBadge").forEach((badge) => {
    badge.textContent = count;
  });
}

// builds the offcanvas cart content; safe to call even if the offcanvas isn't in the DOM
function renderCartItems() {
  const body = document.getElementById("cartOffcanvasBody");
  const totalEl = document.getElementById("cartTotalPrice");
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (!body) return;

  const cart = getCart();

  if (cart.length === 0) {
    body.innerHTML = `<p class="cartEmptyMsg">سبد خرید شما خالی است</p>`;
    if (totalEl) totalEl.textContent = "0";
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  let total = 0;
  body.innerHTML = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) return "";
      total += product.price * item.qty;

      return `
        <div class="cartItem" data-id="${product.id}">
          <img src="${product.img[0]}" alt="${product.name}">
          <div class="cartItemInfo">
            <h6>${product.name}</h6>
            <span>${formatPrice(product.price)} تومان</span>
            <div class="cartItemQty mt-1">
              <button class="cartDecreaseBtn" data-id="${product.id}">-</button>
              <span>${item.qty}</span>
              <button class="cartIncreaseBtn" data-id="${product.id}">+</button>
            </div>
          </div>
          <button class="cartRemoveBtn" data-id="${product.id}" title="حذف">${ICON_TRASH}</button>
        </div>
      `;
    })
    .join("");

  if (totalEl) totalEl.textContent = formatPrice(total);
  if (checkoutBtn) checkoutBtn.disabled = false;

  // wire per-item controls
  body.querySelectorAll(".cartIncreaseBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      const item = getCart().find((i) => i.id === id);
      setCartItemQty(id, (item ? item.qty : 0) + 1);
    });
  });

  body.querySelectorAll(".cartDecreaseBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      const item = getCart().find((i) => i.id === id);
      setCartItemQty(id, (item ? item.qty : 1) - 1);
    });
  });

  body.querySelectorAll(".cartRemoveBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      setCartItemQty(id, 0);
    });
  });
}

function setupCartOffcanvas() {
  const offcanvas = document.getElementById("cartOffcanvas");
  if (offcanvas) {
    // re-render every time the cart is opened, so it always reflects the latest state
    offcanvas.addEventListener("show.bs.offcanvas", renderCartItems);
  }

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      showToast("قابلیت پرداخت آنلاین به زودی اضافه می‌شود");
    });
  }

  updateCartBadges();
}

// ---------- 5. Popular offers ----------
function renderPopularOffers(container, list) {
  if (!container) return;

  container.innerHTML = list
    .map(
      (pro) => `
        <div class="popularOfferCard shadow cardObserv" data-id="${pro.id}">
          <div>
            <img src="${pro.img[0]}" alt="${pro.name}">
          </div>
          <div class="mt-2">
            <span class="small fw-bolder">${pro.name}</span>
            <p class="small descriptionProductCard">${pro.description}</p>
          </div>
          <div class="d-flex justify-content-end mt-1">
            <span class="price">${formatPrice(pro.price)} تومان</span>
          </div>
        </div>
      `
    )
    .join("");

  container.querySelectorAll(".popularOfferCard").forEach((card) => {
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${card.dataset.id}`;
    });
  });

  observeRevealElements(container.querySelectorAll(".cardObserv"));
}

// ---------- 6. Product grid + pagination (index page) ----------
let activeCategory = null; // JSON category value, or null for "all"
let currentPage = 1;

function getFilteredProducts() {
  if (!activeCategory) return products;
  return products.filter((p) => p.category === activeCategory);
}

function renderProductsGrid(container, list) {
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="productsEmptyState">
        <p>محصولی در این دسته یافت نشد.</p>
        <button type="button" id="resetCategoryBtn">نمایش همه محصولات</button>
      </div>
    `;
    const resetBtn = document.getElementById("resetCategoryBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        setActiveCategory(null);
      });
    }
    return;
  }

  container.innerHTML = list
    .map(
      (p) => `
        <div class="productCart rounded-4 shadow cardObserv col-12 col-sm-5" data-id="${p.id}">
          <div class="rounded-5">
            <img src="${p.img[0]}" alt="${p.name}">
          </div>
          <div class="d-flex flex-column p-2">
            <div class="h-75">
              <div class="mt-2">
                <h5 class="fs-6 fw-bolder">${p.name}</h5>
              </div>
              <div class="small mt-4 descriptionProductCard">
                <p>${p.description}</p>
              </div>
            </div>
            <div class="d-flex justify-content-end h-25 align-items-center">
              <span class="fw-bolder">${formatPrice(p.price)} تومان</span>
            </div>
          </div>
        </div>
      `
    )
    .join("");

  container.querySelectorAll(".productCart").forEach((card) => {
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${card.dataset.id}`;
    });
  });

  observeRevealElements(container.querySelectorAll(".cardObserv"));
}

// clean, dot-aware pagination: 1 2 3 ... 8 9 (no more off-by-one bugs)
function buildPageNumbers(current, total) {
  const delta = 1;
  const pages = [];

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i);
    }
  }

  const withDots = [];
  let previous = null;
  pages.forEach((page) => {
    if (previous !== null) {
      if (page - previous === 2) withDots.push(previous + 1);
      else if (page - previous > 2) withDots.push("...");
    }
    withDots.push(page);
    previous = page;
  });

  return withDots;
}

function renderPagination(container, totalItems) {
  if (!container) return;
  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / PRODUCTS_PER_PAGE);
  if (totalPages <= 1) return;

  buildPageNumbers(currentPage, totalPages).forEach((entry) => {
    const btn = document.createElement("button");

    if (entry === "...") {
      btn.className = "pageMore";
      btn.textContent = "...";
      btn.disabled = true;
    } else {
      btn.className = "page" + (entry === currentPage ? " active" : "");
      btn.textContent = entry;
      btn.addEventListener("click", () => {
        currentPage = entry;
        loadProductsPage();
        document.querySelector(".products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    container.appendChild(btn);
  });
}

function loadProductsPage() {
  const productBox = document.getElementById("productBox");
  const pages = document.getElementById("pages");

  const filtered = getFilteredProducts();
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageItems = filtered.slice(start, start + PRODUCTS_PER_PAGE);

  renderProductsGrid(productBox, pageItems);
  renderPagination(pages, filtered.length);
}

// ---------- 7. Category filter (index page) ----------
function setActiveCategory(category) {
  activeCategory = category;
  currentPage = 1;

  document.querySelectorAll(".category-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.category === category && category !== null);
  });

  loadProductsPage();
}

function setupCategoryFilter() {
  const items = document.querySelectorAll(".category-item");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      const category = item.dataset.category;
      // clicking the already-active category clears the filter
      setActiveCategory(activeCategory === category ? null : category);
    });
  });
}

// ---------- 8. Search ----------
function matchProducts(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(normalized) ||
        p.description.toLowerCase().includes(normalized)
    )
    .slice(0, 8);
}

function buildSearchResultsMarkup(results) {
  if (results.length === 0) {
    return `<p class="searchEmptyMsg">محصولی یافت نشد</p>`;
  }

  return results
    .map(
      (p) => `
        <div class="searchResultItem" data-id="${p.id}">
          <img src="${p.img[0]}" alt="${p.name}">
          <div class="searchResultInfo">
            <span>${p.name}</span>
            <small>${formatPrice(p.price)} تومان</small>
          </div>
        </div>
      `
    )
    .join("");
}

function wireSearchResultClicks(container) {
  container.querySelectorAll(".searchResultItem").forEach((el) => {
    el.addEventListener("click", () => {
      window.location.href = `product.html?id=${el.dataset.id}`;
    });
  });
}

function setupSearch() {
  // mobile full-screen search overlay
  const mobileInput = document.getElementById("searchValue");
  const mobileResults = document.getElementById("resultsFoundInSearchs");

  if (mobileInput && mobileResults) {
    mobileInput.addEventListener("input", () => {
      const query = mobileInput.value;
      if (!query.trim()) {
        mobileResults.innerHTML = "";
        return;
      }
      mobileResults.innerHTML = buildSearchResultsMarkup(matchProducts(query));
      wireSearchResultClicks(mobileResults);
    });
  }

  // desktop dropdown search (visible from md breakpoint up)
  const desktopInput = document.getElementById("desktopSearchInput");
  const desktopResults = document.getElementById("desktopSearchResults");

  if (desktopInput && desktopResults) {
    desktopInput.addEventListener("input", () => {
      const query = desktopInput.value;
      if (!query.trim()) {
        desktopResults.classList.add("d-none");
        desktopResults.innerHTML = "";
        return;
      }
      desktopResults.classList.remove("d-none");
      desktopResults.innerHTML = buildSearchResultsMarkup(matchProducts(query));
      wireSearchResultClicks(desktopResults);
    });

    // close the dropdown when clicking outside of it
    document.addEventListener("click", (e) => {
      if (!desktopInput.contains(e.target) && !desktopResults.contains(e.target)) {
        desktopResults.classList.add("d-none");
      }
    });
  }
}

// ---------- 9. Product detail page ----------
function initProductPage() {
  const infoBox = document.getElementById("infoProductBox");
  const imgEl = document.getElementById("productImage");
  if (!infoBox) return; // not the product page

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);
  const product = products.find((p) => p.id === id);

  if (!product) {
    infoBox.innerHTML = `
      <h2>محصول یافت نشد</h2>
      <p>ممکن است لینک اشتباه باشد یا محصول حذف شده باشد.</p>
      <a href="index.html" class="addToShopingCard d-inline-block text-center mt-3">بازگشت به فروشگاه</a>
    `;
    if (imgEl) imgEl.closest(".imgProduct")?.classList.add("d-none");
    return;
  }

  document.title = `NOVA | ${product.name}`;

  if (imgEl) {
    imgEl.src = product.img[0];
    imgEl.alt = product.name;
  }

  infoBox.innerHTML = `
    <h2>${product.name}</h2>
    <p>${product.description}</p>
    <span class="productPrice">${formatPrice(product.price)} تومان</span>

    <div class="d-flex justify-content-between align-items-center mt-4">
      <button type="button" class="addToShopingCard" id="addToCartBtn">افزودن به سبد خرید</button>
      <div class="d-flex align-items-center">
        <button type="button" class="btnAdd" id="qtyIncreaseBtn">${ICON_PLUS}</button>
        <div class="total" id="qtyValue">1</div>
        <button type="button" class="btnReducing" id="qtyDecreaseBtn">${ICON_MINUS}</button>
      </div>
    </div>
  `;

  let qty = 1;
  const qtyValueEl = document.getElementById("qtyValue");
  const decreaseBtn = document.getElementById("qtyDecreaseBtn");
  const addBtn = document.getElementById("addToCartBtn");

  decreaseBtn.disabled = qty <= 1;

  document.getElementById("qtyIncreaseBtn").addEventListener("click", () => {
    qty += 1;
    qtyValueEl.textContent = qty;
    decreaseBtn.disabled = false;
  });

  decreaseBtn.addEventListener("click", () => {
    if (qty <= 1) return;
    qty -= 1;
    qtyValueEl.textContent = qty;
    decreaseBtn.disabled = qty <= 1;
  });

  addBtn.addEventListener("click", () => {
    addToCart(product.id, qty);
    showToast("به سبد خرید اضافه شد");

    addBtn.classList.add("added");
    addBtn.textContent = "اضافه شد ✓";
    setTimeout(() => {
      addBtn.classList.remove("added");
      addBtn.textContent = "افزودن به سبد خرید";
    }, 1200);
  });

  // popular offers strip on the product page, excluding the product being viewed
  const popularBox = document.getElementById("popularOffersBox");
  if (popularBox) {
    const popular = products.filter((p) => p.papular == 1 && p.id !== product.id);
    renderPopularOffers(popularBox, popular);
  }
}

// ---------- 10. Burger menu ----------
function setupBurgerMenu() {
  const nBar = document.querySelector(".nBar");
  const outBurgerMenu = document.getElementById("outBurgerMenu");
  const burgerMenu = document.getElementById("burgerMenu");
  const btnBurgerMenu = document.getElementById("btnBurgerMenu");
  const closeBurgerMenuBtn = document.getElementById("closeBurgerMenuBtn");

  if (!outBurgerMenu || !burgerMenu) return;

  let startX = 0;
  let isDragging = false;

  function openBurgerMenu() {
    outBurgerMenu.classList.add("active");
    burgerMenu.classList.add("burgerMenuShow");
  }

  function closeBurgerMenu() {
    outBurgerMenu.classList.remove("active");
    burgerMenu.classList.remove("burgerMenuShow");
    burgerMenu.style.transform = "";
    burgerMenu.style.transition = "";
  }

  if (btnBurgerMenu) btnBurgerMenu.addEventListener("click", openBurgerMenu);
  if (closeBurgerMenuBtn) closeBurgerMenuBtn.addEventListener("click", closeBurgerMenu);

  outBurgerMenu.addEventListener("click", (e) => {
    if (e.target === outBurgerMenu) closeBurgerMenu();
  });

  // close the menu automatically after a navigation link is tapped
  burgerMenu.querySelectorAll(".burgerMenu-list a").forEach((link) => {
    link.addEventListener("click", () => {
      if (!link.hasAttribute("data-bs-toggle")) closeBurgerMenu();
    });
  });

  // swipe-to-close gesture
  burgerMenu.addEventListener("pointerdown", (e) => {
    isDragging = true;
    startX = e.clientX;
    burgerMenu.setPointerCapture(e.pointerId);
    burgerMenu.style.transition = "none";
  });

  burgerMenu.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const width = burgerMenu.offsetWidth;
    let percent = (deltaX / width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    burgerMenu.style.transform = `translateX(${percent}%)`;
  });

  burgerMenu.addEventListener("pointerup", () => {
    if (!isDragging) return;
    isDragging = false;
    burgerMenu.style.transition = "transform 0.3s ease";

    const matrix = getComputedStyle(burgerMenu).transform;
    let currentPercent = 0;
    if (matrix !== "none") {
      const px = parseFloat(matrix.match(/matrix.*\((.+)\)/)[1].split(", ")[4]);
      currentPercent = (px / burgerMenu.offsetWidth) * 100;
    }

    if (currentPercent > 50) closeBurgerMenu();
    else burgerMenu.style.transform = "translateX(0)";
  });
}

// ---------- 11. Mobile search overlay ----------
function setupSearchOverlay() {
  const searchs = document.querySelector(".searchs");
  const searchBtn = document.getElementById("searchBtn");
  const closeSearchBoxResponsive = document.querySelector(".closeSearchBoxResponsive");

  if (!searchs || !searchBtn) return;

  let isSearchBoxOpen = false;

  function openSearchBox() {
    if (isSearchBoxOpen) return;
    isSearchBoxOpen = true;
    searchs.classList.remove("d-none");
    history.pushState({ searchBox: true }, "", "#search");
  }

  function closeSearch() {
    if (!isSearchBoxOpen) return;
    isSearchBoxOpen = false;
    searchs.classList.add("d-none");
  }

  function closeSearchBoxWithHistory() {
    if (!isSearchBoxOpen) return;
    isSearchBoxOpen = false;
    searchs.classList.add("d-none");
    history.back();
  }

  searchBtn.addEventListener("click", openSearchBox);
  if (closeSearchBoxResponsive) {
    closeSearchBoxResponsive.addEventListener("click", closeSearchBoxWithHistory);
  }

  window.addEventListener("popstate", () => {
    if (isSearchBoxOpen) closeSearch();
  });
}

// ---------- 12. Login modal ----------
function setupLoginForm() {
  const form = document.querySelector(".login-form");
  if (!form) return;

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameMsg = document.querySelector(".username_msg");
  const passwordMsg = document.querySelector(".password_msg");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (usernameInput.value.trim().length < 3) {
      usernameMsg.textContent = "نام کاربری باید حداقل ۳ کاراکتر باشد";
      usernameMsg.classList.remove("d-none");
      usernameInput.classList.add("is-invalid");
      valid = false;
    } else {
      usernameMsg.classList.add("d-none");
      usernameInput.classList.remove("is-invalid");
    }

    if (passwordInput.value.length < 4) {
      passwordMsg.textContent = "رمز عبور باید حداقل ۴ کاراکتر باشد";
      passwordMsg.classList.remove("d-none");
      passwordInput.classList.add("is-invalid");
      valid = false;
    } else {
      passwordMsg.classList.add("d-none");
      passwordInput.classList.remove("is-invalid");
    }

    if (!valid) return;

    // no backend/auth service is connected yet — this is a friendly placeholder
    showToast("ورود با حساب کاربری به زودی فعال می‌شود");
  });

  // show / hide password toggle
  const toggleBtn = document.querySelector(".showAndHidePass");
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
    });
  }
}

// ---------- Scroll-reveal helper (shared with animetion.js) ----------
function observeRevealElements(elements) {
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  elements.forEach((el) => observer.observe(el));
}

// ---------- 13. Bootstrap ----------
async function initApp() {
  await fetchProducts();

  setupCartOffcanvas();
  setupBurgerMenu();
  setupSearchOverlay();
  setupSearch();
  setupLoginForm();

  // index page: popular offers + product grid + pagination + category filter
  const popularOffersBox = document.getElementById("popularOffersBox");
  const productBox = document.getElementById("productBox");

  if (productBox) {
    const popularOffers = products.filter((pro) => pro.papular == 1);
    renderPopularOffers(popularOffersBox, popularOffers);
    setupCategoryFilter();
    loadProductsPage();
  }

  // product detail page
  initProductPage();
}

initApp();
