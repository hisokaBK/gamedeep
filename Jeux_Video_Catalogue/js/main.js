
/* =========================================
   RAWG VIDEO GAMES APP
   HTML + CSS + JavaScript
========================================= */

// 1. CONFIGURATION
const API_KEY = 'e7cef097d7b447a8babd4c45651f0df4';

const API_URL = 'https://api.rawg.io/api/games';
const PAGE_SIZE = 20;

// 2. LOCAL STORAGE
function readFavorites() {
    try {
        const data = JSON.parse(localStorage.getItem('likes') || '[]');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Erreur de lecture des favoris:', error);
        return [];
    }
}

let localData = readFavorites();

function saveFavorites() {
    localStorage.setItem('likes', JSON.stringify(localData));
}

// 3. PLATFORM ICONS
const iconsPlat = [
    {
        type: 'PC',
        data: '<i class="text-[13px] text-gray-400 fa-brands fa-windows"></i>'
    },
    {
        type: 'PlayStation',
        data: '<i class="text-[13px] text-gray-400 fa-brands fa-playstation"></i>'
    },
    {
        type: 'Xbox',
        data: '<i class="text-[13px] text-gray-400 fa-brands fa-xbox"></i>'
    },
    {
        type: 'Linux',
        data: '<i class="text-[13px] text-gray-400 fa-brands fa-linux"></i>'
    },
    {
        type: 'Nintendo',
        data: '<i class="text-[13px] text-gray-400 fa-solid fa-gamepad"></i>'
    }
];

// 4. DOM ELEMENTS
const hero = document.querySelector('#hero-section');
const x = document.querySelector('#x');
const next = document.querySelector('#next');
const searchInput = document.querySelector('#inp_shearch');
const searchContainer = document.querySelector('#div_shearch');
const searchLogo = document.querySelector('#img-log');
const platformSelect = document.querySelector('#platformSelect');
const genreSelect = document.querySelector('#genreSelect');

if (hero) {
    hero.style.backgroundImage = "url('./images/Background.png')";
}

// 5. STATE
let nextUrl = null;
let isLoading = false;
let searchTimer = null;
let currentController = null;
let requestId = 0;
let activeUrl = null;

// 6. HELPERS

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function buildUrl(options = {}) {
    const params = new URLSearchParams({
        key: API_KEY,
        page: '1',
        page_size: String(PAGE_SIZE)
    });

    if (options.search) {
        params.set('search', options.search);
    }

    if (options.platform) {
        params.set('platforms', options.platform);
    }

    if (options.genre) {
        params.set('genres', options.genre);
    }

    return `${API_URL}?${params.toString()}`;
}

function getPlatformNames(game) {
    const platforms = Array.isArray(game.parent_platforms)
        ? game.parent_platforms
        : [];

    return platforms
        .map(item => item.platform?.name)
        .filter(Boolean);
}

function getPlatformIcons(game) {
    const names = getPlatformNames(game);

    return names.map(name => {
        const icon = iconsPlat.find(item => item.type === name);
        return icon ? icon.data : '';
    }).join('');
}

function showMessage(message) {
    if (!x) return;

    const div = document.createElement('div');
    div.className = 'col-span-full text-center text-gray-300 p-6';
    div.textContent = message;
    x.appendChild(div);
}

function showLoading() {
    if (!x) return null;

    const div = document.createElement('div');
    div.className = 'loading col-span-full flex justify-center p-5';

    div.innerHTML = `
        <div class="loadings">
            <div></div>
            <div></div>
            <div></div>
        </div>
    `;

    x.appendChild(div);
    return div;
}

function updateNextButton(url) {
    if (!next) return;

    nextUrl = url || null;
    next.style.display = nextUrl ? 'flex' : 'none';
}

function formatDate(date) {
    if (!date) return 'Non disponible';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return String(date);
    }

    return parsedDate.toLocaleDateString('fr-FR');
}

// 7. FAVORITES

function isFavorite(id) {
    return localData.some(game => String(game.id) === String(id));
}

function createFavoriteButton(game) {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'favorite-btn text-end pb-4';
    button.setAttribute('aria-label', 'Ajouter aux favoris');

    const liked = isFavorite(game.id);

    button.dataset.like = liked ? 'Liked' : 'noLiked';

    button.innerHTML = liked
        ? '<i class="fa-solid fa-heart text-[#9006ac9d] hover:text-gray-400"></i>'
        : '<i class="fa-regular fa-heart text-gray-400 hover:text-[#9006ac9d]"></i>';

    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        addFavorites(game, button);
    });

    return button;
}

function addFavorites(gameOrElement, button) {
    // Supports addFavorites(game, button) and old-style calls.
    let game = gameOrElement;

    if (!game || typeof game !== 'object' || !('id' in game)) {
        const id = arguments[1];

        game = {
            id,
            name: arguments[2],
            img: arguments[3],
            rating: arguments[4],
            updated: arguments[5],
            platforms: arguments[6],
            description: arguments[7],
            released: arguments[8]
        };

        button = gameOrElement;
    }

    const id = String(game.id);
    const index = localData.findIndex(
        item => String(item.id) === id
    );

    if (index === -1) {
        const favorite = {
            id: game.id,
            name: game.name || '',
            img: game.img || game.background_image || '',
            rating: game.rating ?? '',
            updated: game.updated || '',
            platforms: game.platforms || '',
            description: game.description || '',
            released: game.released || ''
        };

        localData.push(favorite);
    } else {
        localData.splice(index, 1);
    }

    saveFavorites();

    // Update the button immediately.
    if (button instanceof HTMLElement) {
        const liked = isFavorite(id);

        button.dataset.like = liked ? 'Liked' : 'noLiked';

        button.innerHTML = liked
            ? '<i class="fa-solid fa-heart text-[#9006ac9d] hover:text-gray-400"></i>'
            : '<i class="fa-regular fa-heart text-gray-400 hover:text-[#9006ac9d]"></i>';
    }
}

// 8. GAME DETAILS
// Save the selected game for details.html.

function getDetails(
    id,
    img,
    name,
    description,
    reddit,
    platforms,
    released,
    rating,
    updated
) {
    const details = {
        id,
        img,
        name,
        description,
        reddit,
        platforms,
        released,
        rating,
        update: updated
    };

    localStorage.setItem('details', JSON.stringify(details));
}

// 9. CREATE GAME CARD

function createGameCard(game) {
    const card = document.createElement('div');

    card.className = [
        'max-w-[87%]',
        'flex flex-col',
        'rounded-[16px]',
        'shadow-md',
        'hover:scale-[1.05]',
        'transition-transform',
        'border border-gray-600',
        'p-5',
        'hover:shadow-[0px_0px_12px_rgba(151,173,172,0.210)]',
        'sm:max-w-[431px]',
        'md:max-w-[341px]',
        'lg:max-w-[281px]',
        'justify-self-center'
    ].join(' ');

    const image = game.background_image || './images/not_fond.png';
    const platformIcons = getPlatformIcons(game);
    const platformNames = getPlatformNames(game);

    const favoriteButton = createFavoriteButton(game);

    card.innerHTML = `
        <div class="flex justify-between h-12">
            <div class="flex gap-2 platform-icons">
                ${platformIcons}
            </div>
        </div>

        <a href="./details.html" class="game-details-link">
            <div class="w-full h-40">
                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(game.name)}"
                    loading="lazy"
                    class="w-full h-full object-cover rounded min-w-[280px] max-w-[280px] sm:min-w-[340px] md:min-w-[300px] lg:min-w-[240px]"
                >
            </div>

            <div class="p-3">
                <h3 class="text-sm sm:text-[18px] font-semibold text-white truncate">
                    ${escapeHtml(game.name)}
                </h3>

                <div class="mt-[8px] flex items-center justify-between text-xs text-gray-500">
                    <span>★ ${escapeHtml(game.rating ?? 'N/A')}</span>
                </div>

                <div class="mt-[18px] flex items-center justify-between text-xs text-gray-500">
                    <span class="text-gray-300">Updated:</span>
                    <span>${escapeHtml(formatDate(game.updated))}</span>
                </div>
            </div>
        </a>
    `;

    // Insert the favorite button into the top row.
    const topRow = card.querySelector('.flex.justify-between.h-12');
    if (topRow) {
        topRow.appendChild(favoriteButton);
    }

    // Save the game before opening details.html.
    const link = card.querySelector('.game-details-link');

    link.addEventListener('click', () => {
        getDetails(
            game.id,
            image,
            game.name || '',
            game.description || '',
            game.reddit_url || '',
            platformIcons,
            game.released || '',
            game.rating ?? '',
            game.updated || ''
        );
    });

    return card;
}

// 10. FETCH GAMES

async function getData(url, options = {}) {
    if (!x || !url) return;

    const append = options.append === true;

    // Prevent duplicate pagination requests.
    if (isLoading) return;

    // Abort an earlier search/filter request.
    if (!append && currentController) {
        currentController.abort();
    }

    if (!append) {
        requestId++;
        activeUrl = url;
        currentController = new AbortController();

        x.replaceChildren();
        updateNextButton(null);
    }

    const thisRequestId = requestId;
    const controller = currentController;
    const loadingDiv = showLoading();

    isLoading = true;

    x.className =
        'grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-[18px]';

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Ignore responses from outdated requests.
        if (thisRequestId !== requestId) return;

        if (!Array.isArray(data.results)) {
            throw new Error('Réponse RAWG invalide.');
        }

        if (data.results.length === 0 && !append) {
            showMessage('Aucun jeu trouvé.');
        } else {
            data.results.forEach(game => {
                x.appendChild(createGameCard(game));
            });
        }

        updateNextButton(data.next);

    } catch (error) {
        if (error.name === 'AbortError') return;

        console.error('Erreur RAWG API:', error);

        if (thisRequestId === requestId) {
            showMessage(
                'Impossible de charger les jeux. Vérifiez votre connexion et votre clé API.'
            );
            updateNextButton(null);
        }

    } finally {
        if (loadingDiv) loadingDiv.remove();

        if (thisRequestId === requestId) {
            isLoading = false;
        }
    }
}

// 11. INITIAL LOAD

getData(buildUrl());

// 12. LOAD MORE GAMES

if (next) {
    next.addEventListener('click', () => {
        if (!nextUrl || isLoading) return;

        getData(nextUrl, { append: true });
    });
}

// 13. SEARCH INPUT

if (searchInput) {
    searchInput.addEventListener('focus', () => {
        searchContainer?.classList.add('div_input_focus');
        searchLogo?.classList.add('img_log');
    });

    searchInput.addEventListener('input', event => {
        clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
            const search = event.target.value.trim();

            const platform = platformSelect?.value || '';
            const genre = genreSelect?.value || '';

            const options = {};

            if (search) options.search = search;
            if (platform && platform !== 'Toutes') {
                options.platform = platform;
            }
            if (genre && genre !== 'Toutes') {
                options.genre = genre;
            }

            getData(buildUrl(options));
        }, 350);
    });

    searchInput.addEventListener('blur', () => {
        searchContainer?.classList.remove('div_input_focus');
        searchLogo?.classList.remove('img_log');
    });
}

// 14. PLATFORM FILTER

if (platformSelect) {
    platformSelect.addEventListener('change', () => {
        const options = {};

        const search = searchInput?.value.trim() || '';
        const platform = platformSelect.value;
        const genre = genreSelect?.value || '';

        if (search) options.search = search;

        if (platform && platform !== 'Toutes') {
            options.platform = platform;
        }

        if (genre && genre !== 'Toutes') {
            options.genre = genre;
        }

        getData(buildUrl(options));
    });
}

// 15. GENRE FILTER

if (genreSelect) {
    genreSelect.addEventListener('change', () => {
        const options = {};

        const search = searchInput?.value.trim() || '';
        const platform = platformSelect?.value || '';
        const genre = genreSelect.value;

        if (search) options.search = search;

        if (platform && platform !== 'Toutes') {
            options.platform = platform;
        }

        if (genre && genre !== 'Toutes') {
            options.genre = genre;
        }

        getData(buildUrl(options));
    });
}

// 16. SIDEBAR

const sidebarBtn = document.getElementById('sidebar-btn');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');

if (sidebarBtn && sidebar) {
    sidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('hidden');

        requestAnimationFrame(() => {
            sidebar.classList.remove('translate-x-64');
        });
    });
}

if (sidebarClose && sidebar) {
    sidebarClose.addEventListener('click', () => {
        sidebar.classList.add('translate-x-64');

        setTimeout(() => {
            sidebar.classList.add('hidden');
        }, 300);
    });
}
