// shared/globals.js

// --- 1. TAILWIND DYNAMIC CONFIGURATION ---
window.tailwind = window.tailwind || {};
window.tailwind.config = {
    theme: {
        extend: {
            colors: {
                white: 'rgba(var(--color-white), <alpha-value>)',
                black: 'rgba(var(--color-black), <alpha-value>)',
                gray: {
                    900: 'rgba(var(--color-gray-900), <alpha-value>)',
                    800: 'rgba(var(--color-gray-800), <alpha-value>)',
                    700: 'rgba(var(--color-gray-700), <alpha-value>)',
                    600: 'rgba(var(--color-gray-600), <alpha-value>)',
                    500: 'rgba(var(--color-gray-500), <alpha-value>)',
                    400: 'rgba(var(--color-gray-400), <alpha-value>)',
                    300: 'rgba(var(--color-gray-300), <alpha-value>)',
                    200: 'rgba(var(--color-gray-200), <alpha-value>)',
                    100: 'rgba(var(--color-gray-100), <alpha-value>)',
                }
            }
        }
    }
};

// --- 2. GLOBAL CONSTANTS ---
window.MWR_GLOBALS = {
    API_URL: "https://script.google.com/macros/s/AKfycbyNcCFpZaPBG4vOFPCJjO7Wg3z6m0FcHwKR1tRRbvK9D5cPKY2OBpKYtnx-86mQnKSz/exec",
    BASE_RANKS: ["SSS", "SS", "S", "A", "B", "C", "D", "F", "Unranked"],
    RANKS: ["SSS+", "SSS", "SSS-", "SS+", "SS", "SS-", "S+", "S", "S-", "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "Unranked"],
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

// --- 3. SMART MENU & THEME TOGGLE CONTROLLER ---
window.AppMenu = (() => {
    
    // Instantly apply theme to prevent white-flashing
    const initTheme = () => {
        const savedTheme = localStorage.getItem('mwr_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    };
    initTheme();

    const toggleTheme = () => {
        const current = document.documentElement.getAttribute('data-theme');
        const target = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', target);
        localStorage.setItem('mwr_theme', target);
    };

    const pages = [
        { name: "Tierlist", url: "index.html", icon: "fa-list-ul" },
        { name: "Formation Builder", url: "formation.html", icon: "fa-chess-board" },
        { name: "Information", url: "info.html", icon: "fa-book-open" }
    ];

    const build = (isAdmin, activeColor = "indigo") => {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const hash = isAdmin ? "#admin" : ""; 

        const menuHtml = pages.map(p => {
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
            <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden transition-opacity" onclick="AppMenu.toggleSidebar()"></div>
            <div id="sidebar" class="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out shadow-2xl flex flex-col">
                <div class="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div class="flex items-center gap-3">
                        <img src="https://i.imgur.com/1h28KPo.png" class="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                        <span class="font-bold text-lg text-white">Menu</span>
                    </div>
                    <button onclick="AppMenu.toggleSidebar()" class="text-gray-400 hover:text-white p-1"><i class="fa-solid fa-times text-xl"></i></button>
                </div>
                
                <div class="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">Navigation</div>
                <div class="flex flex-col gap-1 px-3 flex-grow">
                    ${menuHtml}
                    <div class="h-px bg-gray-700 my-2 mx-2"></div>
                    <a href="admin.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-${activeColor}-400 rounded-lg font-bold transition-colors w-full text-left border border-transparent">
                        <i class="fa-solid fa-shield-halved w-5 text-center"></i> Dashboard
                    </a>
                    
                    <button onclick="AppMenu.toggleTheme()" class="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-yellow-400 rounded-lg font-bold transition-colors w-full text-left border border-transparent mt-auto mb-2">
                        <i class="fa-solid fa-circle-half-stroke w-5 text-center"></i> Toggle Theme
                    </button>

                    ${isAdmin ? `
                    <button onclick="AppMenu.exitAdmin()" class="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg font-bold transition-colors w-full text-left border border-transparent mb-4">
                        <i class="fa-solid fa-right-from-bracket w-5 text-center"></i> Exit Admin Mode
                    </button>
                    ` : ''}
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
        window.location.hash = '';
        if(window.location.pathname.includes('admin.html')) {
            window.location.href = 'index.html';
        } else {
            window.location.reload();
        }
    };

    return { build, toggleTheme, toggleSidebar, exitAdmin };
})();
