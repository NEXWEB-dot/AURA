
        // ========================================
        // CONFIGURATION
        // ========================================
        const SANITY_PROJECT_ID = '8uqf5doi';
        const SANITY_DATASET = 'production';
        const SANITY_API_VERSION = '2023-05-03';

        const COLOR_MAP = {
            'black': '#000000', 'white': '#FFFFFF', 'red': '#DB1215',
            'navy blue': '#1B2A4A', 'brown': '#6B3A2A', 'tan': '#D2B48C',
            'beige': '#F5F0E1', 'pink': '#F4A7B9', 'maroon': '#5E1B1C',
            'gray': '#808080', 'grey': '#808080', 'olive': '#556B2F',
            'cream': '#FFFDD0', 'camel': '#C19A6B', 'burgundy': '#800020',
            'navy': '#1B2A4A', 'blue': '#2563EB', 'green': '#16A34A',
            'light brown': '#B5651D', 'dark brown': '#5C4033', 'mustard': '#FFDB58'
        };

        const PRODUCTS_QUERY = `*[_type == "product"] | order(_createdAt desc){
            "id": slug.current,
            name,
            brand,
            category,
            price,
            oldPrice,
            description,
            colors,
            "images": images[]{ "url": asset->url, "color": color },
            isNew
        }`;

        // ========================================
        // STATE
        // ========================================
        let products = [];
        let currentProduct = null;
        let currentThumb = 0;
        let qty = 1;
        let selectedColor = null;
        let wishlist = JSON.parse(localStorage.getItem('aura_wishlist') || '[]');
        let relatedSelectedColors = {};

        function selectRelatedColor(e, productId, color, btn) {
            e.preventDefault();
            e.stopPropagation();
            relatedSelectedColors[productId] = color;
            const card = btn.closest('.product-card');
            card.querySelectorAll('.related-color-' + productId).forEach(b => {
                b.classList.remove('ring-2', 'ring-black', 'ring-offset-1');
            });
            btn.classList.add('ring-2', 'ring-black', 'ring-offset-1');
        }

        // ========================================
        // SANITY FETCH
        // ========================================
        async function sanityFetch(query) {
            const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Sanity fetch failed: ' + res.status);
            const data = await res.json();
            return data.result;
        }

        // ========================================
        // CART HELPERS
        // ========================================
        function getCart() { return JSON.parse(localStorage.getItem('aura_cart') || '[]'); }
        function saveCart(cart) { localStorage.setItem('aura_cart', JSON.stringify(cart)); }
        function updateBadge() {
            const total = getCart().reduce((sum, i) => sum + i.qty, 0);
            document.getElementById('cart-count').textContent = total;
        }

        // ========================================
        // CATEGORY HELPERS
        // ========================================
        function getCategoryLabel(cat) {
            const map = {
                'handbag': 'Handbags', 'shoulder': 'Shoulder Bags', 'tote': 'Tote Bags',
                'crossbody': 'Crossbody Bags', 'wallets': 'Wallets'
            };
            return map[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'All');
        }

        function getCategorySlug(cat) {
            const bagTypes = ['handbag', 'shoulder', 'tote', 'crossbody'];
            if (bagTypes.includes(cat)) return '';
            return cat || '';
        }

        // ========================================
        // INIT
        // ========================================
        async function init() {
            try {
                products = await sanityFetch(PRODUCTS_QUERY);
            } catch (err) {
                console.error(err);
                document.getElementById('product-name').textContent = 'Could not load product';
                return;
            }

            if (!products.length) {
                document.getElementById('product-name').textContent = 'No products found';
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            currentProduct = products.find(p => p.id === id) || products[0];

            renderProduct();
            renderColorSwatches();
            renderRelated();
            renderRecentlyViewed();
            saveToRecentlyViewed();
            updateBadge();
            updateSEO();
            updateDeliveryEstimate();
            showMobileCTA();
        }

        // ========================================
        // RENDER PRODUCT
        // ========================================
        function renderProduct() {
            const p = currentProduct;

            // Breadcrumb
            document.getElementById('breadcrumb-name').textContent = p.name.length > 40 ? p.name.substring(0, 40) + '...' : p.name;
            const catLabel = getCategoryLabel(p.category);
            const breadcrumbCat = document.getElementById('breadcrumb-category');
            breadcrumbCat.textContent = catLabel;
            const catSlug = getCategorySlug(p.category);
            breadcrumbCat.href = catSlug ? `shop.html?cat=${catSlug}` : 'shop.html';

            // Product info
            document.getElementById('product-brand').textContent = p.brand || 'AURA';
            document.getElementById('product-name').textContent = p.name;
            document.getElementById('product-price').textContent = 'Rs. ' + p.price.toLocaleString();

            // Old price & discount
            if (p.oldPrice && p.oldPrice > p.price) {
                document.getElementById('product-old-price').textContent = 'Rs. ' + p.oldPrice.toLocaleString();
                const disc = Math.round((1 - p.price / p.oldPrice) * 100);
                const discountEl = document.getElementById('product-discount');
                discountEl.textContent = '-' + disc + '% OFF';
                discountEl.classList.remove('hidden');
                document.getElementById('badge-sale').textContent = '-' + disc + '%';
                document.getElementById('badge-sale').classList.remove('hidden');
            }

            if (p.isNew) document.getElementById('badge-new').classList.remove('hidden');

            // Description in tab
            if (p.description) {
                document.getElementById('tab-description').textContent = p.description;
            }

            // Main image
            if (p.images && p.images.length) {
                document.getElementById('main-img').src = p.images[0].url;
                document.getElementById('zoom-img').src = p.images[0].url;
            }

            // Thumbnails
            const thumbRow = document.getElementById('thumb-row');
            thumbRow.innerHTML = '';
            if (p.images) {
                p.images.forEach((imgObj, i) => {
                    const div = document.createElement('div');
                    div.className = `thumb-item shrink-0 w-20 h-20 cursor-pointer border-2 overflow-hidden rounded-lg ${i === 0 ? 'active border-black' : 'border-gray-200 hover:border-gray-400'}`;
                    div.onclick = () => selectThumb(i);
                    div.id = 'thumb-' + i;
                    const img = document.createElement('img');
                    img.src = imgObj.url;
                    img.alt = p.name + ' - Image ' + (i + 1);
                    img.className = 'w-full h-full object-cover';
                    img.loading = 'lazy';
                    div.appendChild(img);
                    thumbRow.appendChild(div);
                });
            }
        }

        // ========================================
        // THUMBNAIL SELECTION
        // ========================================
        function selectThumb(i) {
            const mainImg = document.getElementById('main-img');
            mainImg.style.opacity = '0';
            setTimeout(() => {
                mainImg.src = currentProduct.images[i].url;
                document.getElementById('zoom-img').src = currentProduct.images[i].url;
                mainImg.style.opacity = '1';
            }, 150);
            mainImg.style.transition = 'opacity 0.15s ease';

            // Update active state
            const prevThumb = document.getElementById('thumb-' + currentThumb);
            if (prevThumb) {
                prevThumb.classList.remove('active', 'border-black');
                prevThumb.classList.add('border-gray-200');
            }
            const newThumb = document.getElementById('thumb-' + i);
            if (newThumb) {
                newThumb.classList.add('active', 'border-black');
                newThumb.classList.remove('border-gray-200');
            }
            currentThumb = i;
        }

        // ========================================
        // COLOR SWATCHES
        // ========================================
        function renderColorSwatches() {
            const p = currentProduct;
            if (!p.colors || !p.colors.length) return;

            const section = document.getElementById('color-section');
            section.style.display = '';
            const container = document.getElementById('color-swatches');
            container.innerHTML = '';

            p.colors.forEach((c, i) => {
                const colorName = typeof c === 'string' ? c : (c.name || 'Unknown');
                const hex = (typeof c === 'object' && c.value && c.value.hex) ? c.value.hex : (COLOR_MAP[colorName.trim().toLowerCase()] || '#808080');
                const isLight = isLightColor(hex);
                const btn = document.createElement('button');
                btn.className = `color-swatch w-8 h-8 rounded-full border ${isLight ? 'border-gray-300' : 'border-transparent'} ${i === 0 ? 'active' : ''}`;
                btn.style.backgroundColor = hex;
                btn.title = colorName;
                btn.onclick = () => selectColor(colorName, i);
                container.appendChild(btn);
            });
            
            const firstColor = p.colors[0];
            selectedColor = typeof firstColor === 'string' ? firstColor : (firstColor.name || 'Unknown');
            document.getElementById('selected-color-name').textContent = selectedColor;
        }

        function selectColor(colorName, index) {
            selectedColor = colorName;
            document.getElementById('selected-color-name').textContent = colorName;
            document.querySelectorAll('.color-swatch').forEach((s, i) => {
                s.classList.toggle('active', i === index);
            });
            
            // Auto-select corresponding image if available
            const p = currentProduct;
            if (p && p.images) {
                const imgIndex = p.images.findIndex(img => img.color && img.color.trim().toLowerCase() === colorName.trim().toLowerCase());
                if (imgIndex !== -1) {
                    selectThumb(imgIndex);
                }
            }
        }

        function isLightColor(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return (r * 299 + g * 587 + b * 114) / 1000 > 180;
        }

        // ========================================
        // IMAGE ZOOM (hover)
        // ========================================
        function handleImgZoom(e) {
            const wrap = document.getElementById('main-img-wrap');
            const rect = wrap.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            const img = document.getElementById('main-img');
            img.style.setProperty('--zoom-x', x + '%');
            img.style.setProperty('--zoom-y', y + '%');
        }

        function resetImgZoom() {
            const img = document.getElementById('main-img');
            img.style.setProperty('--zoom-x', 'center');
            img.style.setProperty('--zoom-y', 'center');
        }

        // ========================================
        // LIGHTBOX ZOOM
        // ========================================
        function openZoom() {
            document.getElementById('zoom-overlay').classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeZoom() {
            document.getElementById('zoom-overlay').classList.remove('open');
            document.body.style.overflow = '';
        }
        function zoomNav(direction) {
            const p = currentProduct;
            if (!p.images || p.images.length <= 1) return;
            let newIdx = currentThumb + direction;
            if (newIdx < 0) newIdx = p.images.length - 1;
            if (newIdx >= p.images.length) newIdx = 0;
            selectThumb(newIdx);
            document.getElementById('zoom-img').src = p.images[newIdx].url;
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('zoom-overlay');
            if (overlay.classList.contains('open')) {
                if (e.key === 'Escape') closeZoom();
                if (e.key === 'ArrowLeft') zoomNav(-1);
                if (e.key === 'ArrowRight') zoomNav(1);
            } else {
                if (e.key === 'ArrowLeft') {
                    const p = currentProduct;
                    if (p && p.images && p.images.length > 1) {
                        let newIdx = currentThumb - 1;
                        if (newIdx < 0) newIdx = p.images.length - 1;
                        selectThumb(newIdx);
                    }
                }
                if (e.key === 'ArrowRight') {
                    const p = currentProduct;
                    if (p && p.images && p.images.length > 1) {
                        let newIdx = currentThumb + 1;
                        if (newIdx >= p.images.length) newIdx = 0;
                        selectThumb(newIdx);
                    }
                }
            }
        });

        // ========================================
        // TABS
        // ========================================
        function switchTab(tabName, btn) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'text-primary');
                b.classList.add('text-gray-400');
            });
            document.getElementById('tab-' + tabName).classList.remove('hidden');
            btn.classList.add('active', 'text-primary');
            btn.classList.remove('text-gray-400');
        }

        // ========================================
        // QUANTITY
        // ========================================
        function changeQty(d) {
            qty = Math.max(1, qty + d);
            document.getElementById('qty-display').textContent = qty;
        }

        // ========================================
        // ADD TO CART
        // ========================================
        function addToCart() {
            if (!currentProduct) return;
            const p = currentProduct;
            const cart = getCart();
            const cartKey = selectedColor ? p.id + '-' + selectedColor.toLowerCase() : p.id;
            const selectedImg = p.images ? (p.images.find(img => img.color && img.color.trim().toLowerCase() === selectedColor?.trim().toLowerCase())?.url || p.images[0]?.url) : '';
            const existing = cart.find(i => i.id === cartKey);
            if (existing) {
                existing.qty += qty;
            } else {
                cart.push({
                    id: cartKey,
                    productId: p.id,
                    name: p.name,
                    brand: p.brand || 'AURA',
                    price: p.price,
                    image: selectedImg,
                    color: selectedColor || null,
                    qty: qty
                });
            }
            saveCart(cart);
            updateBadge();
            showToast(qty + 'x ' + p.name.substring(0, 20) + ' added to bag!');
        }

        // ========================================
        // ORDER VIA WHATSAPP
        // ========================================
        function orderWhatsApp() {
            if (!currentProduct) return;
            const p = currentProduct;
            let msg = `Hi! I'd like to order:\n\n`;
            msg += `*${p.name}*\n`;
            msg += `Price: Rs. ${p.price.toLocaleString()}\n`;
            msg += `Qty: ${qty}\n`;
            if (selectedColor) msg += `Color: ${selectedColor}\n`;
            msg += `\nProduct link: ${window.location.href}`;
            window.open('https://wa.me/923120378695?text=' + encodeURIComponent(msg), '_blank');
        }

        // ========================================
        // SOCIAL SHARING
        // ========================================
        function shareWhatsApp() {
            const url = window.location.href;
            const text = currentProduct ? `Check out ${currentProduct.name} on AURA! ${url}` : url;
            window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
        }

        function shareFacebook() {
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank');
        }

        function copyLink() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showToast('Link copied to clipboard!');
            }).catch(() => {
                showToast('Could not copy link');
            });
        }

        // ========================================
        // DELIVERY ESTIMATE
        // ========================================
        function updateDeliveryEstimate() {
            const today = new Date();
            const minDays = 3;
            const maxDays = 5;
            const minDate = new Date(today);
            minDate.setDate(minDate.getDate() + minDays);
            const maxDate = new Date(today);
            maxDate.setDate(maxDate.getDate() + maxDays);

            const options = { month: 'short', day: 'numeric' };
            const minStr = minDate.toLocaleDateString('en-US', options);
            const maxStr = maxDate.toLocaleDateString('en-US', options);

            document.getElementById('delivery-estimate').textContent = `Order now, get by ${minStr} – ${maxStr}`;
        }

        // ========================================
        // MOBILE CTA
        // ========================================
        function showMobileCTA() {
            if (!currentProduct) return;
            const cta = document.getElementById('mobile-cta');
            cta.style.display = '';
            document.getElementById('mobile-price').textContent = 'Rs. ' + currentProduct.price.toLocaleString();
            if (currentProduct.oldPrice && currentProduct.oldPrice > currentProduct.price) {
                document.getElementById('mobile-old-price').textContent = 'Rs. ' + currentProduct.oldPrice.toLocaleString();
            }
            // Adjust floating WhatsApp position on mobile
            const floatingWA = document.getElementById('floating-whatsapp');
            if (window.innerWidth < 768) {
                floatingWA.style.bottom = '80px';
            }
        }

        // ========================================
        // RECENTLY VIEWED
        // ========================================
        function saveToRecentlyViewed() {
            if (!currentProduct) return;
            const p = currentProduct;
            let viewed = JSON.parse(localStorage.getItem('aura_recently_viewed') || '[]');
            // Remove if already exists
            viewed = viewed.filter(v => v.id !== p.id);
            // Add to front
            viewed.unshift({
                id: p.id,
                name: p.name,
                brand: p.brand || 'AURA',
                price: p.price,
                oldPrice: p.oldPrice || null,
                image: p.images ? (p.images[0]?.url || p.images[0]) : '',
                category: p.category
            });
            // Keep max 10
            viewed = viewed.slice(0, 10);
            localStorage.setItem('aura_recently_viewed', JSON.stringify(viewed));
        }

        function renderRecentlyViewed() {
            const viewed = JSON.parse(localStorage.getItem('aura_recently_viewed') || '[]');
            const filtered = viewed.filter(v => !currentProduct || v.id !== currentProduct.id).slice(0, 4);

            if (filtered.length === 0) return;

            const section = document.getElementById('recently-viewed-section');
            section.style.display = '';
            const grid = document.getElementById('recently-viewed-grid');
            grid.innerHTML = '';

            filtered.forEach(r => {
                const disc = r.oldPrice ? Math.round((1 - r.price / r.oldPrice) * 100) : null;
                const card = document.createElement('a');
                card.href = 'product-detail.html?id=' + r.id;
                card.className = 'product-card bg-white rounded-xl overflow-hidden cursor-pointer block border border-gray-100/80';
                card.innerHTML = `
                    <div class="relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 aspect-[3/4]">
                        <img src="${r.image?.url || r.image}" alt="${r.name}" class="product-img w-full h-full object-cover" loading="lazy">
                        ${disc ? `<div class="absolute top-2 left-2 badge-sale text-white text-[9px] font-bold px-2 py-0.5 rounded-full">-${disc}%</div>` : ''}
                    </div>
                    <div class="p-3 md:p-4">
                        <p class="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.15em] mb-1">${r.brand || 'AURA'}</p>
                        <h4 class="text-[11px] md:text-xs font-bold uppercase tracking-wide text-black mb-2 line-clamp-2 leading-relaxed">${r.name}</h4>
                        <div class="flex items-center space-x-2">
                            <span class="font-bold text-sm text-black">Rs. ${r.price.toLocaleString()}</span>
                            ${r.oldPrice ? `<span class="text-gray-400 line-through text-[11px]">Rs. ${r.oldPrice.toLocaleString()}</span>` : ''}
                        </div>
                    </div>`;
                grid.appendChild(card);
            });
        }

        // ========================================
        // RELATED PRODUCTS
        // ========================================
        function renderRelated() {
            const p = currentProduct;
            let related = products.filter(x => x.id !== p.id && x.category === p.category).slice(0, 4);
            if (related.length < 4) {
                const extra = products.filter(x => x.id !== p.id && !related.find(r => r.id === x.id));
                related = [...related, ...extra].slice(0, 4);
            }

            const grid = document.getElementById('related-grid');
            grid.innerHTML = '';

            related.forEach((r, index) => {
                const disc = r.oldPrice ? Math.round((1 - r.price / r.oldPrice) * 100) : null;
                const isWished = wishlist.includes(r.id);

                if (r.colors && r.colors.length > 0 && !relatedSelectedColors[r.id]) {
                    const firstColor = r.colors[0];
                    relatedSelectedColors[r.id] = typeof firstColor === 'string' ? firstColor : (firstColor.name || 'Unknown');
                }

                let colorHtml = '';
                if (r.colors && r.colors.length > 0) {
                    colorHtml = `<div class="flex gap-1.5 mt-2 mb-1" onclick="event.preventDefault(); event.stopPropagation();">`;
                    r.colors.forEach((c, i) => {
                        const colorName = typeof c === 'string' ? c : (c.name || 'Unknown');
                        const hex = (typeof c === 'object' && c.value && c.value.hex) ? c.value.hex : (COLOR_MAP[colorName.trim().toLowerCase()] || '#808080');
                        const isLight = isLightColor(hex);
                        const isSelected = relatedSelectedColors[r.id] === colorName;
                        colorHtml += `<button onclick="selectRelatedColor(event, '${r.id}', '${colorName}', this)" class="w-4 h-4 rounded-full border ${isLight ? 'border-gray-300' : 'border-transparent'} related-color-${r.id} ${isSelected ? 'ring-2 ring-black ring-offset-1' : ''}" style="background-color: ${hex}" title="${colorName}"></button>`;
                    });
                    colorHtml += `</div>`;
                }

                const card = document.createElement('div');
                card.className = 'product-card bg-white rounded-xl overflow-hidden cursor-pointer flex flex-col h-full border border-gray-100/80';
                card.style.animationDelay = (index * 0.08) + 's';
                card.style.opacity = '0';
                card.style.animation = `fadeUp 0.5s ease ${index * 0.08}s forwards`;

                card.innerHTML = `
                    <a href="product-detail.html?id=${r.id}" class="flex flex-col h-full">
                        <div class="relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 aspect-[3/4] shrink-0 w-full">
                            <img src="${r.images[0]?.url || r.images[0]}" alt="${r.name}" class="product-img w-full h-full object-cover" loading="lazy">
                            <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                ${disc ? `<div class="badge-sale text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm">-${disc}%</div>` : ''}
                                ${r.isNew ? `<div class="badge-new text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm">NEW</div>` : ''}
                            </div>
                            <button onclick="toggleWishlist(event, '${r.id}')" class="wishlist-btn ${isWished ? 'active' : ''} absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10 hover:scale-110">
                                <i class="${isWished ? 'fas' : 'far'} fa-heart text-sm ${isWished ? 'text-accent' : 'text-gray-500'}"></i>
                            </button>
                            <div class="quick-actions absolute bottom-0 left-0 right-0 p-3 z-10">
                                <button onclick="quickAddToCart(event, '${r.id}')" class="w-full bg-black/90 backdrop-blur-sm text-white py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-darkRed transition-colors flex items-center justify-center gap-2 shadow-lg">
                                    <i class="fas fa-shopping-bag text-[9px]"></i> Add to Bag
                                </button>
                            </div>
                        </div>
                        <div class="p-3 md:p-4 flex flex-col flex-1">
                            <p class="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.15em] mb-1">${r.brand || 'AURA'}</p>
                            <h4 class="text-[11px] md:text-xs font-bold uppercase tracking-wide text-black mb-2 line-clamp-2 leading-relaxed">${r.name}</h4>
                            ${colorHtml}
                            <div class="flex items-center space-x-2 mt-auto pt-1">
                                <span class="font-bold text-sm text-black">Rs. ${r.price.toLocaleString()}</span>
                                ${r.oldPrice ? `<span class="text-gray-400 line-through text-[11px]">Rs. ${r.oldPrice.toLocaleString()}</span>` : ''}
                            </div>
                        </div>
                    </a>`;
                grid.appendChild(card);
            });
        }

        function quickAddToCart(e, productId) {
            e.preventDefault();
            e.stopPropagation();
            const product = products.find(p => p.id === productId);
            if (!product) return;
            const cart = getCart();
            const firstColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;
            const firstColorName = firstColor ? (typeof firstColor === 'string' ? firstColor : (firstColor.name || 'Unknown')) : null;
            const color = relatedSelectedColors[productId] || firstColorName;
            const cartKey = color ? product.id + '-' + color.toLowerCase() : product.id;
            const selectedImg = product.images ? (product.images.find(img => img.color && img.color.trim().toLowerCase() === color?.trim().toLowerCase())?.url || product.images[0]?.url || product.images[0]) : '';

            const existing = cart.find(i => i.id === cartKey);
            if (existing) { existing.qty++; }
            else {
                cart.push({
                    id: cartKey,
                    productId: product.id,
                    name: product.name,
                    brand: product.brand || 'AURA',
                    price: product.price,
                    image: selectedImg,
                    color: color,
                    qty: 1
                });
            }
            saveCart(cart);
            updateBadge();
            showToast('Added to bag!');
        }

        // ========================================
        // WISHLIST
        // ========================================
        function toggleWishlist(e, productId) {
            e.preventDefault();
            e.stopPropagation();
            const idx = wishlist.indexOf(productId);
            if (idx > -1) { wishlist.splice(idx, 1); }
            else { wishlist.push(productId); }
            localStorage.setItem('aura_wishlist', JSON.stringify(wishlist));
            const btn = e.currentTarget;
            btn.classList.toggle('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fas');
                icon.classList.toggle('far');
                icon.classList.toggle('text-accent');
                icon.classList.toggle('text-gray-500');
            }
            showToast(idx > -1 ? 'Removed from wishlist' : 'Added to wishlist');
        }

        // ========================================
        // SEO
        // ========================================
        function updateSEO() {
            if (!currentProduct) return;
            const p = currentProduct;
            const url = window.location.href;

            document.getElementById('page-title').textContent = p.name + ' - AURA';
            document.getElementById('meta-desc').setAttribute('content', p.description || `Shop ${p.name} at AURA. Premium luxury accessories with free shipping over Rs. 10,000.`);
            document.getElementById('og-title').setAttribute('content', p.name + ' - AURA');
            document.getElementById('og-desc').setAttribute('content', p.description || `Shop ${p.name} at AURA.`);
            document.getElementById('og-image').setAttribute('content', p.images ? (p.images[0]?.url || p.images[0]) : '');
            document.getElementById('og-url').setAttribute('content', url);
            document.getElementById('canonical-url').setAttribute('href', url);
        }

        // ========================================
        // TOAST
        // ========================================
        function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toast-msg').textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        // ========================================
        // MOBILE MENU
        // ========================================
        function openMobileMenu() {
            document.getElementById('mobile-menu-overlay').classList.add('active');
            document.getElementById('mobile-menu-panel').classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeMobileMenu() {
            document.getElementById('mobile-menu-overlay').classList.remove('active');
            document.getElementById('mobile-menu-panel').classList.remove('active');
            document.body.style.overflow = '';
        }
        document.getElementById('mobile-menu-btn').addEventListener('click', openMobileMenu);

        // ========================================
        // BOOT
        // ========================================
        window.addEventListener('DOMContentLoaded', init);
    