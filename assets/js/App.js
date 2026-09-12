// get api
let products = [];
async function getAPI() {
    try {
        const response = await fetch('assets/data/productsAPI.json');
        const data = await response.json();
        products = data.products || [];
        return products;
    } catch (error) {
        const section = document.querySelector('section');

        section.innerHTML = `<span>خطا در دیافت محصولات</span>  ${error}`;

        console.error('خطا:', error);
        products = [];
        return [];
    }
}

// main code 
async function initApp() {
    await getAPI();

    // Elements 
    const popularOffersBox = document.getElementById('popularOffersBox');
    const productBox = document.getElementById('productBox');
    const pages = document.getElementById('pages');



    // Load Popular Offers
    const popularOffers = products.filter(pro => pro.papular == 1);
    const loadPopularOffers = () => {
        popularOffersBox.innerHTML = '';

        popularOffers.forEach(pro => {
            const cardOffer = document.createElement('div');
            cardOffer.className = 'popularOfferCard shadow';
            cardOffer.innerHTML = `
                <div>
                    <img src="${pro.img[0]}" alt="${pro.name}">
                </div>
                <div class="mt-2">
                    <span class="small fw-bolder">${pro.name}</span>
                    <p class="small descriptionProductCard">${pro.description}</p>
                </div>
                <div class="d-flex justify-content-end mt-1">
                    <span class="price">${pro.price} تومان</span>
                </div>
            `;
            popularOffersBox.appendChild(cardOffer);
        })
    }


    // Load pages 
    let perPage = 7;
    const totalPages = Math.ceil(products.length / perPage);
    let currentPage = 1;

    const loadProducts = () => {
        productBox.innerHTML = '';
        let start = (currentPage - 1) * perPage;

        let productsInPage = products.slice(start, start + perPage);


        productsInPage.forEach(p => {
            const product = document.createElement('div');

            product.className = "productCart rounded-4 shadow cardObserv col-12 col-sm-5";
            product.innerHTML = `
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
                        <span class="fw-bolder">${p.price} تومان</span>
                    </div>
                </div>
            `;

            productBox.appendChild(product);
        });
    }


    // Create Btn pages 
    const createBtnPages = () => {
        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('button');
            pageNumber.className = 'page';
            pageNumber.setAttribute('value', i);
            pageNumber.textContent = i;

            pageNumber.addEventListener('click', e => {
                currentPage = parseInt(e.target.value);

                if(e.target.classList.contains('pageMore')) return;

                const scrollToProduct = document.querySelector('.products');
                scrollToProduct.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });

                loadProducts();
                controlBtnPages(pageBtn);
                handlePaginationNav(pageBtn);
            });
            
            pages.appendChild(pageNumber);
        }
        const pageBtn = document.querySelectorAll('.page');

        
        loadProducts();
        controlBtnPages(pageBtn);
        handlePaginationNav(pageBtn);
    }
    const controlBtnPages = (btns) => {
        const lastChild = btns[btns.length - 1];
        const secondLast = btns[btns.length - 2];

        if(!secondLast) return;

        btns.forEach(btn => {
            btn.classList.add('d-none');
            btn.classList.remove('active');
        });
        btns[currentPage - 1].classList.add('active');
        lastChild.classList.remove('d-none');
        
        if((btns[btns.length - 3]) && currentPage >= parseInt(btns[btns.length - 3].value)) {
            secondLast.textContent = btns[btns.length - 2].value;
            secondLast.classList.remove('pageMore', 'd-none');
            secondLast.classList.add('page');
            
        }else {
            secondLast.classList.remove('page', 'd-none');
            secondLast.classList.add('pageMore');
            secondLast.textContent = '...';
        }

        if(btns[0]) {
            btns[0].classList.remove('d-none');
        }
    }
    const handlePaginationNav = (btns) => {
        if(btns[currentPage - 2]) {
            btns[currentPage - 2].classList.remove('d-none');
        }
        btns[currentPage - 1].classList.remove('d-none');
        btns[currentPage].classList.remove('d-none');
        if(currentPage == 1) {
            if(btns[currentPage + 1]) {
                btns[currentPage + 1].classList.remove('d-none');
            }
        }
    }


    // burger Menu 
    const nBar = document.querySelector('.nBar');
    const outBurgerMenu = document.getElementById('outBurgerMenu');
    const burgerMenu = document.getElementById('burgerMenu');
    const btnBurgerMenu = document.getElementById('btnBurgerMenu');
    const closeBurgerMenuBtn = document.getElementById('closeBurgerMenuBtn');

    let startX = 0;
    let isDragging = false;

    // open burger menu
    btnBurgerMenu.addEventListener('click', () => {
    outBurgerMenu.classList.add('active');
    nBar.classList.add('d-none');
    burgerMenu.classList.add('burgerMenuShow');
    });

    // close
    function closeBurgerMenu() {
    outBurgerMenu.classList.remove('active');
    nBar.classList.remove('d-none');
    burgerMenu.classList.remove('burgerMenuShow');
    burgerMenu.style.transform = '';
    burgerMenu.style.transition = '';
    }

    // click out menu for close menu
    outBurgerMenu.addEventListener('click', (e) => {
    if (e.target === outBurgerMenu) closeBurgerMenu();
    });

    // cloase btn menu
    closeBurgerMenuBtn.addEventListener('click', closeBurgerMenu);


    burgerMenu.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    burgerMenu.setPointerCapture(e.pointerId);
    burgerMenu.style.transition = 'none';
    });

    burgerMenu.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const width = burgerMenu.offsetWidth;

    let percent = (deltaX / width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    burgerMenu.style.transform = `translateX(${percent}%)`;
    });

    burgerMenu.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;

    burgerMenu.style.transition = 'transform 0.3s ease';

    const currentPercent = getTranslateXPercent(burgerMenu, burgerMenu.offsetWidth);

    if (currentPercent > 50) {
        closeBurgerMenu();
    } else {
        burgerMenu.style.transform = 'translateX(0)';
    }
    });

    function getTranslateXPercent(el, width) {
    const matrix = getComputedStyle(el).transform;
    if (matrix === 'none') return 0;
    const px = parseFloat(matrix.match(/matrix.*\((.+)\)/)[1].split(', ')[4]);
    return (px / width) * 100;
    }


    // searchs 
    // elements 
    const searchs = document.querySelector('.searchs');
    const searchBtn = document.getElementById('searchBtn');
    const closeSearchBoxResponsive = document.querySelector('.closeSearchBoxResponsive');
    const searchValue = document.getElementById('searchValue');
    const SearchingBtn = document.querySelector('.SearchingBtn');

    let isSearchBoxOpen = false;

    // open search Box 
    const openSearchBox = ()=> {
        if (isSearchBoxOpen) return;

        isSearchBoxOpen = true;
        searchs.classList.remove('d-none');

        history.pushState({searchBox : true}, '', '#search');
    }

    // close search Box with btn
    const closeSearch = ()=> {
        if (!isSearchBoxOpen) return;

        isSearchBoxOpen = false;
        searchs.classList.add('d-none');
    }

    // close search Box with history 
    const closeSearchBoxWithHistory = ()=> {
        if (!isSearchBoxOpen) return;

        isSearchBoxOpen = false;
        searchs.classList.add('d-none');
        history.back();
    }

    // Searching 
    const Searching = ()=> {
        const value = searchValue.value;
        
    }

    // events 
    searchBtn.addEventListener('click', openSearchBox);
    closeSearchBoxResponsive.addEventListener('click', closeSearchBoxWithHistory);

    window.addEventListener('popstate' , e => {
        if (isSearchBoxOpen){
            closeSearch();
        }

    });

    loadProducts();
    createBtnPages();
    loadPopularOffers();
}
initApp()