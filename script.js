// Cart state
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();
    setupPaymentMethodListener();
});

// Render products
function renderProducts() {
    const featuredProducts = products.slice(0, 4);
    const clothingProducts = products.filter(p => p.category === 'clothing');
    const watchProducts = products.filter(p => p.category === 'watch');
    
    renderProductGrid('featuredProducts', featuredProducts);
    renderProductGrid('clothingProducts', clothingProducts);
    renderProductGrid('watchProducts', watchProducts);
}

function renderProductGrid(elementId, productList) {
    const container = document.getElementById(elementId);
    container.innerHTML = productList.map(product => `
        <div class="product-card" onclick="openProductModal('${product.id}')">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <span class="badge">${product.category === 'clothing' ? 'Clothing' : 'Watch'}</span>
            </div>
            <div class="product-content">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price">PKR ${product.price.toLocaleString()}</p>
                <button class="btn btn-primary btn-block" onclick="event.stopPropagation(); openProductModal('${product.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Product Modal
function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;
    
    selectedSize = null;
    selectedColor = null;
    
    document.getElementById('modalProductName').textContent = currentProduct.name;
    document.getElementById('modalProductImage').src = currentProduct.image;
    document.getElementById('modalProductCategory').textContent = 
        currentProduct.category === 'clothing' ? 'Clothing' : 'Watch';
    document.getElementById('modalProductPrice').textContent = 
        `PKR ${currentProduct.price.toLocaleString()}`;
    document.getElementById('modalProductDescription').textContent = currentProduct.description;
    
    // Size selection
    const sizeSelection = document.getElementById('sizeSelection');
    if (currentProduct.sizes) {
        sizeSelection.style.display = 'block';
        document.getElementById('sizeOptions').innerHTML = currentProduct.sizes.map(size => `
            <div class="size-option" onclick="selectSize('${size}')">${size}</div>
        `).join('');
    } else {
        sizeSelection.style.display = 'none';
    }
    
    // Color selection
    const colorSelection = document.getElementById('colorSelection');
    if (currentProduct.colors) {
        colorSelection.style.display = 'block';
        document.getElementById('colorOptions').innerHTML = currentProduct.colors.map(color => `
            <div class="color-option" onclick="selectColor('${color}')">${color}</div>
        `).join('');
    } else {
        colorSelection.style.display = 'none';
    }
    
    document.getElementById('productModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    currentProduct = null;
    selectedSize = null;
    selectedColor = null;
}

function selectSize(size) {
    selectedSize = size;
    document.querySelectorAll('.size-option').forEach(el => {
        el.classList.remove('active');
        if (el.textContent === size) el.classList.add('active');
    });
}

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(el => {
        el.classList.remove('active');
        if (el.textContent === color) el.classList.add('active');
    });
}

function addToCartFromModal() {
    if (!currentProduct) return;
    
    if (currentProduct.sizes && !selectedSize) {
        alert('Please select a size');
        return;
    }
    
    if (currentProduct.colors && !selectedColor) {
        alert('Please select a color');
        return;
    }
    
    addToCart(currentProduct, selectedSize, selectedColor);
    closeProductModal();
}

// Cart functions
function addToCart(product, size = null, color = null) {
    const existingItem = cart.find(item => 
        item.id === product.id && 
        item.selectedSize === size && 
        item.selectedColor === color
    );
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            selectedSize: size,
            selectedColor: color
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification('Added to cart!');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    showNotification('Removed from cart');
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('cartCount').textContent = cartCount;
    document.getElementById('totalAmount').textContent = `PKR ${cartTotal.toLocaleString()}`;
    
    const cartItemsContainer = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-muted);"></i>
                <p>Your cart is empty</p>
            </div>
        `;
    } else {
        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    ${item.selectedSize ? `<div class="cart-item-details">Size: ${item.selectedSize}</div>` : ''}
                    ${item.selectedColor ? `<div class="cart-item-details">Color: ${item.selectedColor}</div>` : ''}
                    <div class="cart-item-price">PKR ${item.price.toLocaleString()}</div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateQuantity(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-btn" onclick="removeFromCart(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    
    cartSidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Checkout
function goToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('checkoutSubtotal').textContent = `PKR ${total.toLocaleString()}`;
    document.getElementById('checkoutTotal').textContent = `PKR ${total.toLocaleString()}`;
    
    toggleCart();
    document.getElementById('checkoutModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function setupPaymentMethodListener() {
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const mobileMoneyField = document.getElementById('mobileMoneyField');
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'jazzcash' || e.target.value === 'easypaisa') {
                mobileMoneyField.style.display = 'block';
                mobileMoneyField.querySelector('input').required = true;
            } else {
                mobileMoneyField.style.display = 'none';
                mobileMoneyField.querySelector('input').required = false;
            }
        });
    });
}

function processPayment(event) {
    event.preventDefault();
    
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Simulate payment processing
    setTimeout(() => {
        alert(`Order placed successfully!\nPayment Method: ${paymentMethod.toUpperCase()}\nTotal: PKR ${total.toLocaleString()}\n\nThank you for shopping at Asad's Store!`);
        
        cart = [];
        saveCart();
        updateCartUI();
        closeCheckout();
        closeAll();
    }, 1000);
}

// Utility functions
function closeAll() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function showNotification(message) {
    // Simple notification (you can enhance this)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});