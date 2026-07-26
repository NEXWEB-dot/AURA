
        // ---- STATE ----
        let currentStep = 1;
        let shippingMethod = 'standard'; // 'standard' | 'express'
        let paymentMethod = 'cod';
        const SHIPPING_COST = { standard: 0, express: 350 };

        // ---- CART ----
        function getCart() { return JSON.parse(localStorage.getItem('aura_cart') || '[]'); }
        function saveCart(c) { localStorage.setItem('aura_cart', JSON.stringify(c)); }

        function updateBadge() {
            const total = getCart().reduce((s,i) => s+i.qty, 0);
            document.getElementById('cart-badge').textContent = total;
        }

        function getSubtotal() {
            return getCart().reduce((s,i) => s + i.price * i.qty, 0);
        }

        function getTotal() {
            return getSubtotal() + SHIPPING_COST[shippingMethod];
        }

        // ---- RENDER CART ----
        function renderCartItems() {
            const cart = getCart();
            const listEl = document.getElementById('cart-items-list');
            const emptyEl = document.getElementById('empty-cart-msg');
            const actionsEl = document.getElementById('cart-actions');
            const summaryEl = document.getElementById('summary-items');

            if (cart.length === 0) {
                listEl.innerHTML = '';
                emptyEl.classList.remove('hidden');
                actionsEl.classList.add('hidden');
                summaryEl.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">No items in cart.</p>';
                updateTotals();
                return;
            }

            emptyEl.classList.add('hidden');
            actionsEl.classList.remove('hidden');

            // Cart list
            listEl.innerHTML = cart.map(item => `
                <div class="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0" id="cart-item-${item.id}">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 bg-[#f5f5f5] rounded-sm overflow-hidden shrink-0">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">${item.brand}</p>
                        <p class="text-sm font-semibold text-black leading-snug mt-0.5 truncate">${item.name}</p>
                        ${item.color ? `<p class="text-[10px] font-bold text-gray-500 mt-0.5">COLOR: ${item.color.toUpperCase()}</p>` : ''}
                        <p class="text-sm font-bold mt-1">Rs. ${item.price.toLocaleString()}</p>
                    </div>
                    <div class="flex flex-col items-end gap-3 shrink-0">
                        <button onclick="removeItem('${item.id}')" class="text-gray-300 hover:text-red-500 transition-colors text-xs">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="flex items-center border border-gray-200 rounded-sm">
                            <button onclick="changeQty('${item.id}', -1)" class="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm">−</button>
                            <span class="w-8 text-center text-sm font-semibold">${item.qty}</span>
                            <button onclick="changeQty('${item.id}', 1)" class="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm">+</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Sidebar summary
            summaryEl.innerHTML = cart.map(item => `
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-surface rounded-sm overflow-hidden shrink-0 relative">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                        <span class="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-gray-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold" style="width:18px;height:18px;">${item.qty}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold truncate">${item.name}</p>
                        ${item.color ? `<p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">${item.color}</p>` : ''}
                        <p class="text-xs text-gray-400">Rs. ${(item.price * item.qty).toLocaleString()}</p>
                    </div>
                </div>
            `).join('');

            updateTotals();
        }

        function updateTotals() {
            const sub = getSubtotal();
            const ship = SHIPPING_COST[shippingMethod];
            const total = sub + ship;
            document.getElementById('subtotal-display').textContent = 'Rs. ' + sub.toLocaleString();
            document.getElementById('shipping-display').textContent = ship === 0 ? 'FREE' : 'Rs. ' + ship.toLocaleString();
            document.getElementById('shipping-display').className = ship === 0 
                ? 'text-green-600 font-semibold' 
                : 'font-semibold';
            document.getElementById('total-display').textContent = 'Rs. ' + total.toLocaleString();
        }

        function removeItem(id) {
            const cart = getCart().filter(i => i.id !== id);
            saveCart(cart);
            updateBadge();
            renderCartItems();
        }

        function changeQty(id, delta) {
            const cart = getCart();
            const item = cart.find(i => i.id === id);
            if (!item) return;
            item.qty = Math.max(1, item.qty + delta);
            saveCart(cart);
            updateBadge();
            renderCartItems();
        }

        function clearCart() {
            if (!confirm('Remove all items from cart?')) return;
            saveCart([]);
            updateBadge();
            renderCartItems();
        }

        // ---- STEP NAVIGATION ----
        function goToStep(step) {
            const sections = { 1: 'section-cart', 2: 'section-delivery', 3: 'section-payment' };
            Object.values(sections).forEach(id => document.getElementById(id).classList.add('hidden'));
            document.getElementById(sections[step]).classList.remove('hidden');
            currentStep = step;
            updateStepUI(step);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function updateStepUI(step) {
            // step 2 circle
            const c2 = document.getElementById('step-2-circle');
            const c3 = document.getElementById('step-3-circle');
            const l2 = document.getElementById('line-2');
            const l3 = document.getElementById('step-3-label');

            if (step >= 2) {
                c2.className = 'w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold';
                l2.classList.add('done');
            } else {
                c2.className = 'w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold';
                l2.classList.remove('done');
            }
            if (step >= 3) {
                c3.className = 'w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold';
                l3.className = 'text-[10px] font-semibold mt-1 tracking-wide uppercase text-black';
            } else {
                c3.className = 'w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold';
                l3.className = 'text-[10px] font-semibold mt-1 tracking-wide uppercase text-gray-400';
            }
        }

        // ---- DELIVERY ----
        function submitDelivery() {
            const required = ['first-name', 'last-name', 'phone', 'address', 'city'];
            let valid = true;
            required.forEach(id => {
                const el = document.getElementById(id);
                if (!el.value.trim()) {
                    el.style.borderColor = '#ef4444';
                    valid = false;
                } else {
                    el.style.borderColor = '#e5e7eb';
                }
            });

            if (!valid) {
                alert('Please fill in all required fields.');
                return;
            }

            // Populate delivery summary
            const name = document.getElementById('first-name').value + ' ' + document.getElementById('last-name').value;
            const city = document.getElementById('city').value;
            const addr = document.getElementById('address').value + ', ' + city;
            const phone = document.getElementById('phone').value;
            document.getElementById('summary-name').textContent = name;
            document.getElementById('summary-address').textContent = addr;
            document.getElementById('summary-phone').textContent = phone;

            goToStep(3);
        }

        // ---- SHIPPING SELECT ----
        function selectShipping(method, el) {
            shippingMethod = method;
            document.querySelectorAll('.radio-card[id^="ship-"]').forEach(c => c.classList.remove('selected'));
            document.getElementById('ship-' + method + '-card').classList.add('selected');
            updateTotals();
        }

        // ---- PAYMENT SELECT ----
        function selectPayment(method, el) {
            paymentMethod = method;
            document.querySelectorAll('.radio-card[id^="pay-"]').forEach(c => c.classList.remove('selected'));
            document.getElementById('pay-' + method + '-card').classList.add('selected');
            document.getElementById('bank-details').classList.toggle('hidden', method !== 'bank');
            document.getElementById('easypaisa-details').classList.toggle('hidden', method !== 'easypaisa');
            updatePaymentUI();
        }

        // ---- ONLINE PAYMENT UI ----
        function updatePaymentUI() {
            const placeBtn = document.getElementById('place-order-btn');
            const instructionsPanel = document.getElementById('online-payment-instructions');
            const instructionText = document.getElementById('payment-instruction-text');
            const whatsappLink = document.getElementById('whatsapp-payment-link');
            const total = getTotal();
            const orderId = '#AUR-' + String(Math.floor(Math.random() * 90000) + 10000);
            const whatsappMsg = encodeURIComponent(`Hi! I've placed order ${orderId}. Here's my payment screenshot.`);
            const whatsappUrl = `https://wa.me/923120378695?text=${whatsappMsg}`;

            if (paymentMethod === 'bank') {
                placeBtn.classList.add('hidden');
                instructionsPanel.classList.remove('hidden');
                instructionText.textContent = `Please transfer Rs. ${total.toLocaleString()} to the account shown above and share the payment screenshot via WhatsApp to confirm your order.`;
                whatsappLink.href = whatsappUrl;
            } else if (paymentMethod === 'easypaisa') {
                placeBtn.classList.add('hidden');
                instructionsPanel.classList.remove('hidden');
                instructionText.textContent = `Please send Rs. ${total.toLocaleString()} to the EasyPaisa number shown above and share the payment screenshot via WhatsApp to confirm your order.`;
                whatsappLink.href = whatsappUrl;
            } else {
                // Cash on Delivery
                placeBtn.classList.remove('hidden');
                instructionsPanel.classList.add('hidden');
            }
        }



        // ---- PLACE ORDER ----
        async function placeOrder() {
            const cart = getCart();
            if (cart.length === 0) { alert('Your cart is empty!'); return; }

            const orderId = '#AUR-' + String(Math.floor(Math.random() * 90000) + 10000);
            const payLabels = { cod: 'Cash on Delivery', bank: 'Bank Transfer', easypaisa: 'EasyPaisa / JazzCash' };

            // Collect form values (delivery step must have been completed)
            const customerName  = (document.getElementById('first-name').value + ' ' + document.getElementById('last-name').value).trim();
            const customerPhone = document.getElementById('phone').value.trim();
            const customerEmail = document.getElementById('email').value.trim();
            const customerAddr  = document.getElementById('address').value.trim() + ', ' + document.getElementById('city').value;
            const itemCount     = cart.reduce((s, i) => s + i.qty, 0);
            const orderTotal    = 'Rs. ' + getTotal().toLocaleString();
            const payLabel      = payLabels[paymentMethod];
            const shipLabel     = shippingMethod === 'express' ? 'Express (Rs. 350)' : 'Standard (FREE)';

            // Update success overlay
            document.getElementById('order-id').textContent = orderId;
            document.getElementById('success-items').textContent = itemCount + ' item(s)';
            document.getElementById('success-total').textContent = orderTotal;
            document.getElementById('success-payment').textContent = payLabel;

            // Populate Receipt
            const d = new Date();
            const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            document.getElementById('receipt-name').textContent = customerName;
            document.getElementById('receipt-phone').textContent = customerPhone;
            document.getElementById('receipt-address').textContent = customerAddr;
            document.getElementById('receipt-order-id').textContent = orderId;
            document.getElementById('receipt-date').textContent = dateStr;
            document.getElementById('receipt-payment').textContent = payLabel;
            
            const tbody = document.getElementById('receipt-items-tbody');
            tbody.innerHTML = cart.map(item => `
                <tr class="border-b border-gray-100 last:border-0">
                    <td class="py-3">
                        <p class="font-semibold text-black">${item.name}</p>
                        ${item.color ? `<p class="text-[9px] font-bold text-gray-400 uppercase mt-0.5">COLOR: ${item.color}</p>` : ''}
                    </td>
                    <td class="py-3 text-center text-gray-600">${item.qty}</td>
                    <td class="py-3 text-right font-medium">Rs. ${(item.price * item.qty).toLocaleString()}</td>
                </tr>
            `).join('');

            document.getElementById('receipt-subtotal').textContent = 'Rs. ' + getSubtotal().toLocaleString();
            document.getElementById('receipt-shipping').textContent = shipLabel;
            document.getElementById('receipt-total').textContent = orderTotal;

            // Disable place order button to prevent double submit
            const placeBtn = document.querySelector('button[onclick="placeOrder()"]');
            if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'Processing...'; }

            // ---- WhatsApp Message ----
            let msg = `Hi AURA! I'd like to place an order (${orderId}):\n\n`;
            cart.forEach(item => {
                msg += `${item.qty}x ${item.name}`;
                if (item.color) msg += ` (Color: ${item.color})`;
                msg += ` - Rs. ${(item.price * item.qty).toLocaleString()}\n`;
            });
            msg += `\n*Subtotal:* Rs. ${getSubtotal().toLocaleString()}\n`;
            msg += `*Shipping:* ${shipLabel}\n`;
            msg += `*Total:* ${orderTotal}\n\n`;
            msg += `*Delivery Details:*\n`;
            msg += `Name: ${customerName}\n`;
            msg += `Phone: ${customerPhone}\n`;
            if (customerEmail) msg += `Email: ${customerEmail}\n`;
            msg += `Address: ${customerAddr}\n\n`;
            msg += `*Payment Method:* ${payLabel}\n`;

            window.open(`https://wa.me/923120378695?text=${encodeURIComponent(msg)}`, '_blank');
            if (placeBtn) { placeBtn.disabled = false; placeBtn.innerHTML = '<i class="fas fa-lock text-[11px]"></i> Place Order'; }

            // Clear cart & show success screen
            saveCart([]);
            updateBadge();
            const overlay = document.getElementById('success-overlay');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        // ---- RECEIPT MODAL LOGIC ----
        function showReceipt() {
            document.getElementById('receipt-modal').classList.remove('hidden');
            document.getElementById('receipt-modal').classList.add('flex');
        }

        function closeReceipt() {
            document.getElementById('receipt-modal').classList.add('hidden');
            document.getElementById('receipt-modal').classList.remove('flex');
        }

        function printReceipt() {
            const printContent = document.getElementById('printable-receipt').outerHTML;
            const originalContent = document.body.innerHTML;
            
            // Create a temporary print view
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>AURA Receipt</title>
                    <script src="https://cdn.tailwindcss.com"></` + `script>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,700&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 20px; color: black; }
                        .font-serif { font-family: 'Playfair Display', serif; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; padding: 0; }
                            #printable-receipt { border: none !important; box-shadow: none !important; margin: 0; padding: 0; }
                        }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div style="max-w: 600px; margin: 0 auto;">
                        ${printContent}
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        // ---- WHATSAPP CHECKOUT ----
        function checkoutViaWhatsapp() {
            const cart = getCart();
            if (cart.length === 0) { alert('Your cart is empty!'); return; }

            let msg = `Hi AURA! I'd like to place an order:%0A%0A`;
            cart.forEach(item => {
                msg += `${item.qty}x ${item.name}`;
                if (item.color) msg += ` (Color: ${item.color})`;
                msg += ` - Rs. ${(item.price * item.qty).toLocaleString()}%0A`;
            });
            
            msg += `%0A*Total: Rs. ${getSubtotal().toLocaleString()}* (Excluding Shipping)%0A%0A`;
            msg += `Please let me know the next steps.`;

            window.open(`https://wa.me/923120378695?text=${msg}`, '_blank');
        }

        // ---- INIT ----
        document.addEventListener('DOMContentLoaded', () => {
            renderCartItems();
            updateBadge();
        });
    