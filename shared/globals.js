// --- TAILWIND CSS VARIABLE MAPPING ---
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    gray: {
                        900: 'rgba(var(--color-gray-900), <alpha-value>)',
                        800: 'rgba(var(--color-gray-800), <alpha-value>)',
                        700: 'rgba(var(--color-gray-700), <alpha-value>)',
                        600: 'rgba(var(--color-gray-600), <alpha-value>)',
                        500: 'rgba(var(--color-gray-500), <alpha-value>)',
                        400: 'rgba(var(--color-gray-400), <alpha-value>)',
                        300: 'rgba(var(--color-gray-300), <alpha-value>)',
                        200: 'rgba(var(--color-gray-200), <alpha-value>)',
                        100: 'rgba(var(--color-gray-100), <alpha-value>)'
                    },
                    white: 'rgba(var(--color-white), <alpha-value>)'
                }
            }
        }
    };
}

window.MWR_GLOBALS = {
    API_URL: "https://script.google.com/macros/s/AKfycbyNcCFpZaPBG4vOFPCJjO7Wg3z6m0FcHwKR1tRRbvK9D5cPKY2OBpKYtnx-86mQnKSz/exec",
    BASE_RANKS: ["SSS", "SS", "S", "A", "B", "C", "D", "F", "Unranked"],
    RANKS: [
        "SSS+", "SSS", "SSS-",
        "SS+", "SS", "SS-",
        "S+", "S", "S-",
        "A+", "A", "A-",
        "B+", "B", "B-",
        "C+", "C", "C-",
        "D+", "D", "D-",
        "F+", "F", "F-",
        "Unranked"
    ],
    CLASS_ICONS: {
        "Mage": "https://raw.githubusercontent.com/nekowoah/mwtierlist/main/images/icons/mage_icon.webp",
        "Archer": "https://raw.githubusercontent.com/nekowoah/mwtierlist/main/images/icons/archer_icon.webp",
        "Shield Guard": "https://raw.githubusercontent.com/nekowoah/mwtierlist/main/images/icons/shield_icon.webp",
        "Swordman": "https://raw.githubusercontent.com/nekowoah/mwtierlist/main/images/icons/swordman_icon.webp",
        "Spearman": "https://raw.githubusercontent.com/nekowoah/mwtierlist/main/images/icons/spearman_icon.webp",
        "Cavalry": "https://raw.githubusercontent.com/nekowoah/mwtierlist/main/images/icons/cavalry_icon.webp",
        "Pegasus Knight": "https://raw.githubusercontent.com/nekowoah/mwtierlist/main/images/icons/pegasus_icon.webp",
        "Priest": "https://raw.githubusercontent.com/nekowoah/mwtierlist/main/images/icons/priest_icon.webp"
    },
    TIER_INFO: {
        'early': { title: "Early Game Ranking", desc: "Based on heroes that do well with limited investment (0-2 stars, no sacrament). Emphasis on campaign." },
        'late': { title: "Late Game Ranking", desc: "Based on maxed out heroes (6 stars, sacrament 5). Emphasis on PVP. Also used for mid-game." },
        'sacrament': { title: "Sacrament Priority", desc: "The priority of every hero sacrament. High rank sacraments should be the focus of resources." }
    }
};

// HYBRID CONFIGURATION: Initialize Global Firebase Instance
if (typeof firebase !== 'undefined') {
    const firebaseConfig = {
        apiKey: "AIzaSyAuiszbK6B-EzOD9yTsrGHlPIlGWIGUdEQ",
        authDomain: "legion-mwr-archive.firebaseapp.com",
        projectId: "legion-mwr-archive"
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.MWR_GLOBALS.db = firebase.firestore();
}

window.AppMenu = (() => {
    
    // THEME CYCLING LOGIC
    const THEMES = ['dark', 'light', 'true-gray', 'oled', 'purple', 'pink', 'pastel-yellow'];

    const initTheme = () => {
        const savedTheme = localStorage.getItem('mwr_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    };
    initTheme();

    const toggleTheme = () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        let nextIndex = THEMES.indexOf(current) + 1;
        if (nextIndex >= THEMES.length) nextIndex = 0;
        const target = THEMES[nextIndex];
        
        document.documentElement.setAttribute('data-theme', target);
        localStorage.setItem('mwr_theme', target);
    };

    const PUBLIC_PAGES = [
        { name: "Hero Recommendations", url: "info.html?post=03f7b5d4-24e3-44ac-93cb-91e4aa9d61bc", icon: "fa-award" },       
        { name: "Tierlist", url: "index.html", icon: "fa-list-ul" },
        { name: "Information", url: "info.html", icon: "fa-book-open" },
        { name: "Formation Builder", url: "formation.html", icon: "fa-chess-board" }
    ];

    const ADMIN_PAGES = [
        { name: "Admin Dashboard", url: "admin.html", icon: "fa-shield-halved" },
        { name: "Edit Tierlist", url: "index.html", icon: "fa-list" },
        { name: "Edit Info Guides", url: "info.html", icon: "fa-file-pen" },
        { name: "Edit AOE & Aura Data", url: "aoe-editor.html", icon: "fa-pen-ruler" }
    ];

    const build = (isAdmin = false, activeColor = 'indigo') => {
        let pages = isAdmin ? ADMIN_PAGES : PUBLIC_PAGES;
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const hash = isAdmin ? "#admin" : "";

        if (isAdmin) {
            const role = sessionStorage.getItem('mw_admin_role') || localStorage.getItem('mw_admin_role') || 'admin';
            if (role !== 'admin') {
                pages = pages.filter(p => p.name !== "Edit Tierlist");
            }
        }

        const navLinks = pages.map(p => {
            const isActive = currentPath === p.url || (currentPath === '' && p.url === 'index.html');
            const activeClasses = isActive 
                ? `bg-${activeColor}-600/20 text-${activeColor}-400 border-${activeColor}-500/30` 
                : "text-gray-300 hover:bg-gray-800 hover:text-white border-transparent";
            
            return `
                <a href="${p.url}${hash}" class="flex items-center gap-3 px-4 py-2.5 border rounded-lg font-bold transition-colors w-full text-left ${activeClasses}">
                    <i class="fa-solid ${p.icon} w-5 text-center"></i> ${p.name}
                </a>
            `;
        }).join('');

        const sidebarHTML = `
            <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden transition-opacity" onclick="window.AppMenu.toggleSidebar()"></div>
            <div id="sidebar" class="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out shadow-2xl flex flex-col">
                <div class="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div class="flex items-center gap-3">
                        <img src="https://i.imgur.com/1h28KPo.png" class="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                        <span class="font-bold text-lg text-white">Menu</span>
                    </div>
                    <button onclick="window.AppMenu.toggleSidebar()" class="text-gray-400 hover:text-white p-1"><i class="fa-solid fa-times text-xl"></i></button>
                </div>
                
                <div class="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">Navigation</div>
                
                <div class="flex flex-col gap-1 px-3 flex-grow pb-4">
                    <!-- Top Navigation Links -->
                    ${navLinks}
                    
                    <!-- Bottom Anchored Links -->
                    <div class="mt-auto flex flex-col gap-1">
                        <div class="h-px bg-gray-700 my-2 mx-2"></div>
                        
                        <!-- THEME TOGGLE BUTTON -->
                        <button onclick="window.AppMenu.toggleTheme()" class="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-yellow-400 rounded-lg font-bold transition-colors w-full text-left border border-transparent">
                            <i class="fa-solid fa-palette w-5 text-center"></i> Change Theme
                        </button>

                        ${isAdmin ? `
                        <!-- Exit Admin -->
                        <button onclick="window.AppMenu.exitAdmin()" class="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg font-bold transition-colors w-full text-left border border-transparent">
                            <i class="fa-solid fa-right-from-bracket w-5 text-center"></i> Exit Admin
                        </button>
                        ` : `
                        <!-- Admin Access -->
                        <a href="admin.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-${activeColor}-400 rounded-lg font-bold transition-colors w-full text-left border border-transparent">
                            <i class="fa-solid fa-lock w-5 text-center"></i> Admin Access
                        </a>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    };

    const toggleSidebar = () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    };

    const exitAdmin = () => {
        sessionStorage.removeItem('mw_admin_token');
        sessionStorage.removeItem('mw_admin_role');
        localStorage.removeItem('mw_admin_token');
        localStorage.removeItem('mw_admin_role');
        window.location.href = 'index.html';
    };

    return { build, toggleSidebar, exitAdmin, toggleTheme };
})();


// --- GOOGLE ANALYTICS (GA4) ---
(function() {
    // 1. Inject the external Google Tag Manager script
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-770Z73BYC0';
    document.head.appendChild(gaScript);

    // 2. Initialize the data layer and config
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-770Z73BYC0');
})();
