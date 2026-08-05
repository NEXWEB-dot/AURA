
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

        // Cart badge sync
        function updateCartBadge() {
            const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
            const total = cart.reduce((sum, i) => sum + i.qty, 0);
            document.querySelectorAll('.cart-counter-badge').forEach(el => el.textContent = total);
        }
        document.addEventListener('DOMContentLoaded', updateCartBadge);
    


        (function () {
            const carousel = document.getElementById('heroCarousel');
            if (!carousel) return;

            const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
            const thumbs = Array.from(carousel.querySelectorAll('.hero-thumb'));
            const prevBtn = carousel.querySelector('.hero-prev');
            const nextBtn = carousel.querySelector('.hero-next');
            const counterCurrent = carousel.querySelector('.hero-counter-current');
            const progressBar = carousel.querySelector('.hero-progress');

            let current = 0;
            let autoplayTimer = null;
            let progressTimer = null;
            const AUTOPLAY_MS = 6000;

            function pad(n) { return String(n + 1).padStart(2, '0'); }

            function goTo(index) {
                slides[current].classList.remove('active');
                thumbs[current].classList.remove('active');
                current = (index + slides.length) % slides.length;
                slides[current].classList.add('active');
                thumbs[current].classList.add('active');
                counterCurrent.textContent = pad(current);
                restartAutoplay();
            }

            function next() { goTo(current + 1); }
            function prevSlide() { goTo(current - 1); }

            function restartAutoplay() {
                clearTimeout(autoplayTimer);
                clearInterval(progressTimer);
                progressBar.style.width = '0%';
                let elapsed = 0;
                progressTimer = setInterval(() => {
                    elapsed += 100;
                    progressBar.style.width = Math.min((elapsed / AUTOPLAY_MS) * 100, 100) + '%';
                }, 100);
                autoplayTimer = setTimeout(next, AUTOPLAY_MS);
            }

            thumbs.forEach((thumb) => {
                thumb.addEventListener('click', () => {
                    const idx = parseInt(thumb.getAttribute('data-index'), 10);
                    goTo(idx);
                });
            });

            nextBtn.addEventListener('click', next);
            prevBtn.addEventListener('click', prevSlide);

            carousel.addEventListener('mouseenter', () => {
                clearTimeout(autoplayTimer);
                clearInterval(progressTimer);
            });
            carousel.addEventListener('mouseleave', restartAutoplay);

            restartAutoplay();
        })();
    


    window.addEventListener('scroll', () => {
        const btn = document.getElementById('back-to-top');
        if (window.scrollY > 400) { btn.style.opacity='1'; btn.style.pointerEvents='auto'; }
        else { btn.style.opacity='0'; btn.style.pointerEvents='none'; }
    });
    


        const SANITY_PROJECT_ID = '8uqf5doi';
        const SANITY_DATASET = 'production';
        const SANITY_API_VERSION = '2023-05-03';

        async function sanityFetch(query) {
            const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Sanity fetch failed: ' + res.status);
            const data = await res.json();
            return data.result;
        }

        const PRODUCTS_QUERY = `*[_type == "product"] | order(_createdAt desc){
            "id": slug.current,
            name,
            brand,
            category,
            price,
            oldPrice,
            "images": images[]{ "url": asset->url, "color": color },
            isNew
        }[0...10]`;

        async function loadHomeProducts() {
            try {
                const products = await sanityFetch(PRODUCTS_QUERY);
                
                // Trendy Grid (first 4 products)
                const trendyGrid = document.getElementById('trendy-grid');
                if (trendyGrid) {
                    trendyGrid.innerHTML = '';
                    products.slice(0, 4).forEach(p => {
                        const imgUrl = p.images && p.images.length ? (p.images[0].url || p.images[0]) : '';
                        const card = document.createElement('div');
                        card.className = 'group cursor-pointer';
                        card.onclick = () => window.location.href = `product-detail.html?id=${p.id}`;
                        
                        const saleBadge = (p.oldPrice && p.oldPrice > p.price) ? `<div class="absolute top-4 left-4 bg-accent text-white text-[10px] px-3 py-1 uppercase font-bold tracking-widest">Sale</div>` : '';
                        
                        card.innerHTML = `
                            <div class="relative bg-surface aspect-[4/5] mb-3 sm:mb-5 overflow-hidden flex items-center justify-center p-4 sm:p-8">
                                <img src="${imgUrl}" alt="${p.name}" class="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700">
                                ${saleBadge}
                                <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                                    <button class="bg-white text-primary text-[8px] sm:text-[10px] uppercase tracking-widest px-3 py-2 sm:px-8 sm:py-3 font-bold hover:bg-accent hover:text-white transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300">View Details</button>
                                </div>
                            </div>
                            <div class="text-left">
                                <h4 class="font-semibold text-primary uppercase text-sm mb-1 group-hover:text-accent transition-colors tracking-wide">${p.name}</h4>
                                <p class="text-gray-500 text-sm font-medium">
                                    ${p.oldPrice ? `<span class="text-gray-400 line-through mr-2">Rs. ${p.oldPrice.toLocaleString()}</span> <span class="text-accent">Rs. ${p.price.toLocaleString()}</span>` : `Rs. ${p.price.toLocaleString()}`}
                                </p>
                            </div>
                        `;
                        trendyGrid.appendChild(card);
                    });
                }
                
                // Collection Slider (next 6 products)
                const slider = document.getElementById('collection-slider');
                if (slider) {
                    slider.innerHTML = '';
                    products.slice(0, 6).forEach(p => {
                        const imgUrl = p.images && p.images.length ? (p.images[0].url || p.images[0]) : '';
                        const item = document.createElement('div');
                        item.className = 'snap-center shrink-0 w-[70vw] sm:w-[40vw] lg:w-[25vw] aspect-[4/5] relative bg-surface p-4 group-hover/slide:scale-105 transition-transform cursor-pointer';
                        item.onclick = () => window.location.href = `product-detail.html?id=${p.id}`;
                        item.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-contain mix-blend-multiply hover:scale-110 transition-transform duration-500" alt="${p.name}">`;
                        slider.appendChild(item);
                    });
                }
            } catch(e) {
                console.error("Could not load products", e);
            }
        }
        
        document.addEventListener('DOMContentLoaded', loadHomeProducts);
    