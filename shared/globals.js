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
    // Export globally so all pages (Tierlist, Info, AOE) can use it instantly
    window.MWR_GLOBALS.db = firebase.firestore();
}

window.AppMenu = (() => {
    const PUBLIC_PAGES = [
        { name: "Tierlist", url: "index.html", icon: "fa-list" },
        { name: "Information", url: "info.html", icon: "fa-circle-info" },
        { name: "Formations", url: "formation.html", icon: "fa-chess-board" }
    ];

    const ADMIN_PAGES = [
        { name: "Admin Dashboard", url: "admin.html", icon: "fa-shield-halved" },
        { name: "Edit Tierlist", url: "index.html", icon: "fa-list" },
        { name: "Edit Info Guides", url: "info.html", icon: "fa-file-pen" },
        { name: "Edit AOE & Aura Data", url: "aoe-editor.html", icon: "fa-pen-ruler" }
    ];

    const build = (isAdmin = false, activeColor = 'indigo') => {
        const pages = isAdmin ? ADMIN_PAGES : PUBLIC_PAGES;
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const hash = isAdmin ? "#admin" : "";

        const navLinks = pages.map(p => {
            const isActive = currentPath === p.url;
            const activeClasses = isActive 
                ? `bg-${activeColor}-600/20 text-${activeColor}-400 border-${activeColor}-500/50` 
                : `border-transparent text-gray-400 hover:bg-gray-800 hover:text-white`;
            
            return `
                <a href="${p.url}${hash}" class="flex items-center gap-3 px-4 py-2.5 border rounded-lg font-bold transition-colors w-full text-left ${activeClasses}">
                    <i class="fa-solid ${p.icon} w-5 text-center"></i> ${p.name}
                </a>
            `;
        }).join('');

        // FIX: Removed backdrop-blur-sm, added strict will-change-transform for zero-lag menu sliding
        const sidebarHTML = `
            <div id="sidebarOverlay" class="fixed inset-0 bg-black/80 z-50 hidden transition-opacity duration-300 opacity-0" onclick="AppMenu.toggleSidebar()"></div>
            <div id="sidebar" class="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out shadow-2xl flex flex-col will-change-transform">
                <div class="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div class="flex items-center gap-3">
                        <img src="https://i.imgur.com/1h28KPo.png" class="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                        <span class="font-bold text-lg text-white">Menu</span>
                    </div>
                    <button onclick="AppMenu.toggleSidebar()" class="text-gray-400 hover:text-white transition-colors">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <div class="p-4 flex-grow flex flex-col gap-2 overflow-y-auto">
                    <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2 px-2">${isAdmin ? 'Admin Controls' : 'Navigation'}</div>
                    ${navLinks}
                </div>

                ${isAdmin ? `
                <div class="p-4 border-t border-gray-700 bg-gray-800">
                    <button onclick="AppMenu.exitAdmin()" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/50 rounded-lg font-bold transition-colors">
                        <i class="fa-solid fa-right-from-bracket"></i> Exit Admin
                    </button>
                </div>
                ` : `
                <div class="p-4 border-t border-gray-700 bg-gray-800">
                    <a href="admin.html" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-300 font-bold transition-colors text-sm">
                        <i class="fa-solid fa-lock text-xs"></i> Admin Login
                    </a>
                </div>
                `}
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', sidebarHTML);
    };

    const toggleSidebar = () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar.classList.contains('-translate-x-full')) {
            overlay.classList.remove('hidden');
            // Small delay to allow display:block to apply before animating opacity
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            sidebar.classList.remove('-translate-x-full');
            document.body.style.overflow = 'hidden'; 
        } else {
            overlay.classList.add('opacity-0');
            sidebar.classList.add('-translate-x-full');
            document.body.style.overflow = '';
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    };

    const exitAdmin = () => {
        sessionStorage.removeItem('mw_admin_token');
        window.location.href = 'index.html';
    };

    return { build, toggleSidebar, exitAdmin };
})();
