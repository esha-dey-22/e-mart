/* Single-file SPA with small UX/accessibility improvements and hash routing.
   Drop in place of your script.js */

(() => {
  // Sample products (unchanged)
  const PRODUCTS = [
    { id: 1, name: "Aurora Sneakers", price: 59.99, rating: 4.5, img: "https://picsum.photos/seed/sneaker/800/600", desc: "Comfortable everyday sneakers." },
    { id: 2, name: "Lumen Headphones", price: 89.00, rating: 4.2, img: "https://picsum.photos/seed/headphone/800/600", desc: "Crisp audio, long battery life." },
    { id: 3, name: "Orbit Lamp", price: 29.50, rating: 4.0, img: "https://picsum.photos/seed/lamp/800/600", desc: "Smart lamp with warm/cool mode." },
    { id: 4, name: "Nimbus Backpack", price: 45.00, rating: 4.6, img: "https://picsum.photos/seed/backpack/800/600", desc: "Water-resistant, 20L capacity." },
    { id: 5, name: "Pixel Mugs (Set of 2)", price: 19.99, rating: 4.1, img: "https://picsum.photos/seed/mug/800/600", desc: "Cute mugs to brighten your mornings." },
    { id: 6, name: "Solar Charger", price: 39.99, rating: 4.3, img: "https://picsum.photos/seed/charger/800/600", desc: "Portable charger for outdoor use." },
    { id: 7, name: "Comet T-Shirt", price: 14.99, rating: 4.0, img: "https://picsum.photos/seed/tshirt/800/600", desc: "Soft cotton tee." },
    { id: 8, name: "Glide Mouse", price: 24.50, rating: 4.4, img: "https://picsum.photos/seed/mouse/800/600", desc: "Ergonomic and responsive." }
  ];

  // Elements
  const pages = {
    home: document.getElementById('page-home'),
    about: document.getElementById('page-about'),
    cart: document.getElementById('page-cart')
  };
  const productGrid = document.getElementById('productGrid');
  const sortSelect = document.getElementById('sortSelect');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartContainer = document.getElementById('cartContainer');
  const yearEl = document.getElementById('year');
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const brand = document.getElementById('brand');

  // Storage key
  const CART_KEY = 'emart_cart_v1';

  // --- Routing (uses hash so pages are linkable) ---
  function setRoute(route, pushHash = true) {
    if (!pages[route]) route = 'home';
    Object.keys(pages).forEach(k => {
      if (k === route) {
        pages[k].classList.remove('hidden');
        pages[k].removeAttribute('hidden');
        pages[k].classList.add('active');
      } else {
        pages[k].classList.add('hidden');
        pages[k].setAttribute('hidden', '');
        pages[k].classList.remove('active');
      }
    });

    // aria-pressed for top nav
    document.querySelectorAll('.navlink').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.route === route));
    });

    if (route === 'cart') renderCart();
    if (route === 'home') renderProducts();

    if (sidebar.classList.contains('open')) toggleSidebar(false);

    if (pushHash) {
      try { history.replaceState(null, '', `#${route}`); } catch (e) { location.hash = route; }
    }

    // move focus to main content for screen readers
    document.getElementById('mainContent').focus?.();
  }

  // Respect initial hash
  function initRouteFromHash() {
    const h = (location.hash || '').replace('#', '');
    setRoute(h || 'home', false);
  }

  // Link wiring
  document.querySelectorAll('.navlink, .side-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      if (route) setRoute(route);
    });
  });

  // brand -> home (also keyboard)
  brand.addEventListener('click', () => setRoute('home'));
  brand.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') setRoute('home'); });

  // Sidebar toggle for mobile
  function toggleSidebar(force) {
    const want = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', want);
    menuToggle.setAttribute('aria-expanded', String(want));
    if (want) {
      // focus first focusable inside sidebar
      const first = sidebar.querySelector('button, [tabindex]'); if (first) first.focus();
    } else {
      menuToggle.focus();
    }
  }
  menuToggle.addEventListener('click', () => toggleSidebar());

  // close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 640 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) toggleSidebar(false);
    }
  }, { capture: true });

  // close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) toggleSidebar(false);
  });

  // Storage helpers
  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  // Cart operations
  function addToCart(product) {
    const cart = readCart();
    if (cart[product.id]) cart[product.id].qty += 1;
    else cart[product.id] = { id: product.id, name: product.name, price: product.price, img: product.img, qty: 1 };
    writeCart(cart);
    showToast('Added to cart');
  }

  function updateCartBadge() {
    const cart = readCart();
    const totalQty = Object.values(cart).reduce((s, i) => s + i.qty, 0);
    cartBadge.textContent = totalQty;
  }

  // Render products
  function getFilteredProducts() {
    const q = (searchInput.value || '').trim().toLowerCase();
    let list = PRODUCTS.slice();
    if (sortSelect.value === 'low') list.sort((a,b)=>a.price-b.price);
    if (sortSelect.value === 'high') list.sort((a,b)=>b.price-a.price);
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    return list;
  }

  function renderProducts() {
    const list = getFilteredProducts();
    productGrid.innerHTML = '';
    if (!list.length) {
      productGrid.innerHTML = `<div style="color:var(--muted)">No products match your search.</div>`;
      return;
    }

    list.forEach(p => {
      const el = document.createElement('article');
      el.className = 'card';
      el.innerHTML = `
        <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:flex-start">
          <div style="font-weight:700">${escapeHtml(p.name)}</div>
          <div style="font-weight:800">$${p.price.toFixed(2)}</div>
        </div>
        <p class="desc">${escapeHtml(p.desc)}</p>
        <div class="actions">
          <button class="add" data-id="${p.id}" aria-label="Add ${escapeHtml(p.name)} to cart">Add to cart</button>
          <div style="font-size:13px;color:#6b7280">⭐ ${p.rating}</div>
        </div>
      `;
      productGrid.appendChild(el);
    });

    // Wire add buttons
    productGrid.querySelectorAll('button.add').forEach(btn=>{
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        const product = PRODUCTS.find(x=>x.id===id);
        addToCart(product);
      });
    });
  }

  // Cart rendering
  function renderCart() {
    const cart = readCart();
    const items = Object.values(cart);
    cartContainer.innerHTML = '';
    if (items.length === 0) {
      cartContainer.innerHTML = '<div style="color:#6b7280">Your cart is empty. Add products from Home.</div>';
      return;
    }

    // Cart list
    const listWrap = document.createElement('div');
    listWrap.style.display = 'grid';
    listWrap.style.gridTemplateColumns = '1fr';
    listWrap.style.gap = '12px';

    items.forEach(it => {
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <img src="${it.img}" alt="${escapeHtml(it.name)}" />
        <div style="flex:1">
          <div style="font-weight:700">${escapeHtml(it.name)}</div>
          <div style="color:#6b7280;font-size:13px;margin-top:6px">$${it.price.toFixed(2)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
          <div class="qty-controls" role="group" aria-label="Quantity controls">
            <button class="decrease" data-id="${it.id}" aria-label="Decrease quantity">-</button>
            <div style="padding:6px 10px;border-radius:8px;border:1px solid #e6eef8">${it.qty}</div>
            <button class="increase" data-id="${it.id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove" data-id="${it.id}" style="background:transparent;border:0;color:#ef4444;cursor:pointer" aria-label="Remove item">Remove</button>
        </div>
      `;
      listWrap.appendChild(item);
    });

    // Summary
    const subtotal = items.reduce((s,i)=>s + i.price * i.qty, 0);
    const rightCol = document.createElement('div');
    rightCol.className = 'summary';
    rightCol.style.marginTop = '12px';
    rightCol.innerHTML = `
      <div style="font-size:13px;color:#6b7280">Order summary</div>
      <div style="font-weight:800;font-size:20px;margin-top:8px">$${subtotal.toFixed(2)}</div>
      <div style="margin-top:12px"><button id="checkoutBtn" class="checkout-btn">Checkout</button></div>
    `;

    // Combine into container (list + summary)
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = '1fr 320px';
    container.style.gap = '12px';
    container.appendChild(listWrap);
    container.appendChild(rightCol);

    // Responsiveness fallback for small screens
    if (window.innerWidth < 900) {
      container.style.gridTemplateColumns = '1fr';
    }

    cartContainer.appendChild(container);

    // Wire quantity and remove
    cartContainer.querySelectorAll('.decrease').forEach(btn => {
      btn.addEventListener('click', () => changeQty(Number(btn.dataset.id), -1));
    });
    cartContainer.querySelectorAll('.increase').forEach(btn => {
      btn.addEventListener('click', () => changeQty(Number(btn.dataset.id), +1));
    });
    cartContainer.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => removeItem(Number(btn.dataset.id)));
    });

    document.getElementById('checkoutBtn').addEventListener('click', () => {
      checkout();
    });
  }

  function changeQty(id, delta) {
    const cart = readCart();
    if (!cart[id]) return;
    cart[id].qty = Math.max(1, cart[id].qty + delta);
    writeCart(cart);
    renderCart();
  }

  function removeItem(id) {
    const cart = readCart();
    if (!cart[id]) return;
    delete cart[id];
    writeCart(cart);
    renderCart();
  }

  function checkout() {
    const cart = readCart();
    const subtotal = Object.values(cart).reduce((s,i)=>s+i.price*i.qty, 0);
    if (subtotal <= 0) return showToast('Cart empty');
    // fake checkout
    if (confirm(`Place order for $${subtotal.toFixed(2)}?`)) {
      localStorage.removeItem(CART_KEY);
      updateCartBadge();
      renderCart();
      showToast('Order placed — thank you!');
      setRoute('home');
    }
  }

  // Utilities
  function showToast(msg, ms = 1500) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);

    // ensure animation applies
    requestAnimationFrame(() => {
      t.classList.remove('hide');
    });

    setTimeout(()=> {
      t.classList.add('hide');
      t.addEventListener('transitionend', ()=> t.remove(), { once: true });
    }, ms);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // Search & sort wiring
  searchBtn.addEventListener('click', () => {
    renderProducts();
  });
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') renderProducts();
  });
  sortSelect.addEventListener('change', () => renderProducts());

  // Update on hash change (back/forward)
  window.addEventListener('hashchange', () => {
    const h = (location.hash || '').replace('#', '') || 'home';
    setRoute(h, false);
  });

  // make pages adjust when window resized (cart layout)
  window.addEventListener('resize', () => {
    if (pages.cart.classList.contains('active')) renderCart();
  });

  // Init
  function init() {
    yearEl.textContent = new Date().getFullYear();
    updateCartBadge();
    initRouteFromHash();

    // if user has no hash, default to home
    if (!location.hash) setRoute('home', false);

    // set initial focusability for main content
    document.getElementById('mainContent').setAttribute('tabindex', '-1');

    // ensure menuToggle has correct aria state
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  init();

})();
