// State
let cart = JSON.parse(localStorage.getItem('vkCart')) || [];
let currentFilter = 'all';
let isDark = localStorage.getItem('vkDark') === 'true';

// Init
document.addEventListener('DOMContentLoaded', () => {
  applyDark();
  renderProducts(products);
  updateCartUI();
  window.addEventListener('scroll', handleScroll);
});

// ──────────────────────────────────────────────
// RENDER PRODUCTS
// ──────────────────────────────────────────────
function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  const noResults = document.getElementById('noResults');
  grid.innerHTML = '';
  if (!list.length) { noResults.style.display = 'flex'; return; }
  noResults.style.display = 'none';
  list.forEach((p, i) => {
    const discount = Math.round((1 - p.price / p.originalPrice) * 100);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="product-img-wrap" onclick="openModal(${p.id})">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        <span class="discount-badge">-${discount}%</span>
        <img src="${p.image}" alt="${p.name}" loading="lazy"/>
        <div class="product-overlay"><i class="fas fa-eye"></i> Quick View</div>
      </div>
      <div class="product-info">
        <span class="product-cat">${p.category}</span>
        <h3 onclick="openModal(${p.id})">${p.name}</h3>
        <div class="product-rating">
          ${renderStars(p.rating)}
          <span>(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="product-price">
          <strong>₹${p.price.toLocaleString()}</strong>
          <del>₹${p.originalPrice.toLocaleString()}</del>
        </div>
        <button class="add-cart-btn" onclick="addToCart(${p.id})">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
      </div>`;
    grid.appendChild(card);
  });
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) html += '<i class="fas fa-star"></i>';
    else if (i - rating < 1) html += '<i class="fas fa-star-half-alt"></i>';
    else html += '<i class="far fa-star"></i>';
  }
  return html;
}

// ──────────────────────────────────────────────
// FILTER & SEARCH
// ──────────────────────────────────────────────
function filterCategory(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase().replace(/ /g,'') === cat.toLowerCase().replace(/ /g,'') || (cat === 'all' && b.textContent === 'All'));
  });
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = products.filter(p =>
    (cat === 'all' || p.category === cat) &&
    (p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query))
  );
  renderProducts(filtered);
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function searchProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = products.filter(p =>
    (currentFilter === 'all' || p.category === currentFilter) &&
    (p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
  );
  renderProducts(filtered);
}

// ──────────────────────────────────────────────
// CART
// ──────────────────────────────────────────────
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(`✅ ${product.name} added to cart!`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { saveCart(); updateCartUI(); renderCartItems(); }
}

function saveCart() {
  localStorage.setItem('vkCart', JSON.stringify(cart));
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = total;
  document.getElementById('mobileCartCount').textContent = total;
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  const open = sidebar.classList.toggle('open');
  overlay.classList.toggle('open', open);
  if (open) renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (!cart.length) {
    container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>`;
    footer.style.display = 'none';
    return;
  }
  footer.style.display = 'block';
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cartTotal').textContent = `₹${total.toLocaleString()}`;
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}"/>
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>₹${item.price.toLocaleString()}</p>
        <div class="qty-controls">
          <button onclick="changeQty(${item.id}, -1)"><i class="fas fa-minus"></i></button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id}, 1)"><i class="fas fa-plus"></i></button>
        </div>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');
}

function checkout() {
  if (!cart.length) return;
  showToast('🎉 Order placed successfully! Thank you for shopping with VK Digital Mart.');
  cart = [];
  saveCart();
  updateCartUI();
  renderCartItems();
  toggleCart();
}

// ──────────────────────────────────────────────
// MODAL
// ──────────────────────────────────────────────
function openModal(id) {
  const p = products.find(x => x.id === id);
  const discount = Math.round((1 - p.price / p.originalPrice) * 100);
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-img">
      <img src="${p.image}" alt="${p.name}"/>
      <span class="badge">${p.badge || ''}</span>
    </div>
    <div class="modal-details">
      <span class="product-cat">${p.category}</span>
      <h2>${p.name}</h2>
      <div class="product-rating">${renderStars(p.rating)} <span>(${p.reviews.toLocaleString()} reviews)</span></div>
      <div class="modal-price">
        <strong>₹${p.price.toLocaleString()}</strong>
        <del>₹${p.originalPrice.toLocaleString()}</del>
        <span class="save-badge">Save ${discount}%</span>
      </div>
      <p class="modal-desc">${p.description}</p>
      <div class="modal-specs">
        <h4>Key Specifications</h4>
        <ul>${p.specs.map(s => `<li><i class="fas fa-check-circle"></i> ${s}</li>`).join('')}</ul>
      </div>
      <button class="add-cart-btn modal-cart-btn" onclick="addToCart(${p.id}); closeModal()">
        <i class="fas fa-cart-plus"></i> Add to Cart – ₹${p.price.toLocaleString()}
      </button>
    </div>`;
  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ──────────────────────────────────────────────
// DARK MODE
// ──────────────────────────────────────────────
function toggleDark() {
  isDark = !isDark;
  localStorage.setItem('vkDark', isDark);
  applyDark();
}

function applyDark() {
  document.body.classList.toggle('dark', isDark);
  const icon = document.getElementById('darkToggle').querySelector('i');
  icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// ──────────────────────────────────────────────
// MOBILE MENU
// ──────────────────────────────────────────────
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ──────────────────────────────────────────────
// NAVBAR SCROLL
// ──────────────────────────────────────────────
function handleScroll() {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
}

// ──────────────────────────────────────────────
// NEWSLETTER
// ──────────────────────────────────────────────
function subscribeNewsletter() {
  const email = document.getElementById('emailInput').value;
  const msg = document.getElementById('newsletterMsg');
  if (!email || !email.includes('@')) {
    msg.textContent = '⚠️ Please enter a valid email address.';
    msg.style.color = '#f97316';
    return;
  }
  msg.textContent = '🎉 You\'re subscribed! Exclusive deals coming your way.';
  msg.style.color = '#22c55e';
  document.getElementById('emailInput').value = '';
  showToast('📧 Subscribed successfully!');
}

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}
