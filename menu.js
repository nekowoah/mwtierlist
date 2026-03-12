const AppMenu = (() => {
    
    // --- THEME INITIALIZATION ---
    // Runs instantly to prevent white-flashes on page load
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

    // --- PAGE LINKS ---
    const pages = [
        { name: "Tierlist", url: "index.html", icon: "fa-list-ul" },
        { name: "Information", url: "info.html", icon: "fa-book-open" }
    ];

    const build = (isAdmin, activeColor = "indigo") => {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const hash = isAdmin ? "#admin" : ""; 

        const menuHtml = pages.map(p => {
            const isActive = currentPath === p.url;
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
            <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden transition-opacity" onclick="app.toggleSidebar()"></div>
            <div id="sidebar" class="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out shadow-2xl flex flex-col">
                <div class="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div class="flex items-center gap-3">
                        <img src="https://i.imgur.com/1h28KPo.png" class="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                        <span class="font-bold text-lg text-white">Menu</span>
                    </div>
                    <button onclick="app.toggleSidebar()" class="text-gray-400 hover:text-white p-1"><i class="fa-solid fa-times text-xl"></i></button>
                </div>
                
                <div class="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">Navigation</div>
                <div class="flex flex-col gap-1 px-3 flex-grow">
                    ${menuHtml}
                    <div class="h-px bg-gray-700 my-2 mx-2"></div>
                    <a href="admin.html" class="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-${activeColor}-400 rounded-lg font-bold transition-colors w-full text-left border border-transparent">
                        <i class="fa-solid fa-shield-halved w-5 text-center"></i> Admin Panel
                    </a>
                    
                    <!-- NEW THEME TOGGLE BUTTON -->
                    <button onclick="AppMenu.toggleTheme()" class="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-yellow-400 rounded-lg font-bold transition-colors w-full text-left border border-transparent mt-auto mb-2">
                        <i class="fa-solid fa-circle-half-stroke w-5 text-center"></i> Toggle Theme
                    </button>

                    ${isAdmin ? `
                    <button onclick="app.exitAdmin()" class="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg font-bold transition-colors w-full text-left border border-transparent mb-4">
                        <i class="fa-solid fa-right-from-bracket w-5 text-center"></i> Exit Admin Mode
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    };

    // Export both build and toggleTheme so the button can access it
    return { build, toggleTheme };
})();
