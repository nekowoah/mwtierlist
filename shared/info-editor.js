/**
 * MWR Info Editor Module
 * Handles the full-page editing workspace, Quill editor with custom embed blots
 * for Formations and Heroes, Image Picker integration, and Save/Delete logic.
 * 
 * Depends on: window.MWR_GLOBALS, window.ImagePicker, Quill, QuillBlotFormatter
 * Exposes: window.InfoEditor
 */
window.InfoEditor = (() => {
    const { API_URL } = window.MWR_GLOBALS;

    let quillEditor = null;
    let heroData = [];
    let selectedRecHeroes = [];
    let authToken = '';
    let onSaveCallback = null;
    let onDeleteCallback = null;
    let onCancelCallback = null;

    // --- INITIALIZATION ---
    const init = (token, callbacks = {}) => {
        authToken = token;
        onSaveCallback = callbacks.onSave || null;
        onDeleteCallback = callbacks.onDelete || null;
        onCancelCallback = callbacks.onCancel || null;
        loadHeroData();
    };

    const loadHeroData = async () => {
        try {
            const cached = localStorage.getItem('mwr_tierlist_data_v6');
            if (cached) { heroData = JSON.parse(cached); return; }
            const res = await fetch(API_URL + "?view=all", { redirect: "follow" });
            const data = await res.json();
            if (Array.isArray(data)) heroData = data;
        } catch(e) { console.warn("InfoEditor: Failed to load hero data.", e); }
    };

    const getHeroTypeClass = (heroType) => {
        if (heroType === 'VIP') return 'type-vip';
        if (heroType === 'Limited') return 'type-limited';
        if (heroType === 'Basic Limited' || heroType === 'Basic Banner') return 'type-basic';
        return '';
    };

    // ========================================================
    //  CUSTOM QUILL BLOTS (BlockEmbed)
    //  These render as visual blocks in both editor and viewer.
    // ========================================================
    const registerBlots = () => {
        const BlockEmbed = Quill.import('blots/block/embed');

        // --- Formation Blot ---
        class FormationBlot extends BlockEmbed {
            static create(value) {
                const node = super.create();
                node.setAttribute('data-formation-code', value.code || '');
                node.setAttribute('contenteditable', 'false');
                node.innerHTML = `
                    <div class="shortcode-embed-header">
                        <i class="fa-solid fa-chess-board"></i> Formation
                        <span class="shortcode-embed-hint">Delete to remove</span>
                    </div>
                    <div class="formation-grid shortcode-formation-grid" id="editor-fg-${value.code}"></div>
                    <p class="shortcode-embed-loading"><i class="fas fa-circle-notch fa-spin"></i> Loading...</p>
                `;
                // Async load the formation grid
                setTimeout(() => loadFormationIntoElement(value.code, node), 100);
                return node;
            }
            static value(node) {
                return { code: node.getAttribute('data-formation-code') || '' };
            }
        }
        FormationBlot.blotName = 'formationEmbed';
        FormationBlot.tagName = 'DIV';
        FormationBlot.className = 'shortcode-formation-embed';
        Quill.register(FormationBlot);

        // --- Heroes Blot ---
        class HeroesBlot extends BlockEmbed {
            static create(value) {
                const node = super.create();
                const ids = Array.isArray(value.ids) ? value.ids : [];
                node.setAttribute('data-hero-ids', ids.join(','));
                node.setAttribute('contenteditable', 'false');
                node.innerHTML = `
                    <div class="shortcode-embed-header">
                        <i class="fa-solid fa-users"></i> ${ids.length} heroes
                        <span class="shortcode-embed-hint">Delete to remove</span>
                    </div>
                    <div class="hero-rec-row shortcode-heroes-row"></div>
                `;
                // Render heroes immediately from cached data
                setTimeout(() => renderHeroesIntoElement(ids, node), 50);
                return node;
            }
            static value(node) {
                const idsStr = node.getAttribute('data-hero-ids') || '';
                return { ids: idsStr.split(',').filter(Boolean) };
            }
        }
        HeroesBlot.blotName = 'heroesEmbed';
        HeroesBlot.tagName = 'DIV';
        HeroesBlot.className = 'shortcode-heroes-embed';
        Quill.register(HeroesBlot);
    };

    // --- Render formation into a blot element ---
    const loadFormationIntoElement = async (code, containerEl) => {
        const gridEl = containerEl.querySelector('.shortcode-formation-grid');
        const loadingEl = containerEl.querySelector('.shortcode-embed-loading');
        if (!gridEl || !code || code.length !== 5) {
            if (loadingEl) loadingEl.innerHTML = '<span class="text-red-400 text-xs">Invalid code</span>';
            return;
        }
        try {
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'load_formation', code: code }), redirect: 'follow' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            const grid = data.grid;
            if (loadingEl) loadingEl.style.display = 'none';
            if (!grid || !Array.isArray(grid)) return;

            const placements = {};
            grid.forEach(formation => {
                if (Array.isArray(formation)) {
                    formation.forEach(cell => {
                        if (cell && cell.heroId) placements[cell.row + '-' + cell.col] = cell.heroId;
                    });
                }
            });

            let html = '';
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 5; c++) {
                    const hid = placements[r + '-' + c];
                    if (hid) {
                        const h = heroData.find(hero => hero.heroId === hid || hero.id === hid);
                        if (h) {
                            const tc = getHeroTypeClass(h.heroType);
                            html += `<div class="formation-cell"><div class="cell-hero-border ${tc}"><img src="${h.image}" title="${h.name}" onerror="this.src='https://placehold.co/40/4E4F5C/FFFFFF?text=?'"></div></div>`;
                        } else {
                            html += `<div class="formation-cell"><div class="cell-hero-border"><img src="https://placehold.co/40/4E4F5C/FFFFFF?text=?" title="Unknown"></div></div>`;
                        }
                    } else {
                        html += `<div class="formation-cell"></div>`;
                    }
                }
            }
            gridEl.innerHTML = html;
        } catch(e) {
            if (loadingEl) loadingEl.innerHTML = `<span class="text-red-400 text-xs">Failed to load formation</span>`;
        }
    };

    // --- Render heroes into a blot element ---
    const renderHeroesIntoElement = (ids, containerEl) => {
        const row = containerEl.querySelector('.shortcode-heroes-row');
        if (!row || !ids.length) return;
        if (heroData.length === 0) {
            row.innerHTML = '<span class="text-xs text-gray-500 italic">Hero data loading...</span>';
            return;
        }
        row.innerHTML = ids.map(hid => {
            const h = heroData.find(hero => hero.id === hid);
            if (!h) return '';
            const tc = getHeroTypeClass(h.heroType);
            return `<div class="flex flex-col items-center">
                <div class="hero-rec-circle ${tc}" title="${h.name}">
                    <img src="${h.image}" onerror="this.src='https://placehold.co/56/4E4F5C/FFFFFF?text=?'">
                    ${h.hasAwaken === 'Yes' ? '<div style="position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:#111827;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid #4b5563;z-index:2"><i class="fa-solid fa-fire-flame-curved" style="font-size:7px;color:#ef4444"></i></div>' : ''}
                </div>
                <span class="hero-rec-label">${h.name}</span>
            </div>`;
        }).join('');
    };

    // --- QUILL EDITOR SETUP ---
    const setupQuill = () => {
        if (quillEditor) return quillEditor;

        // Register custom blots BEFORE creating the editor
        registerBlots();

        try {
            const BlotFormatter = window.QuillBlotFormatter 
                ? window.QuillBlotFormatter.default 
                : (window.BlotFormatter || null);

            const modules = {
                toolbar: {
                    container: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image', 'video'],
                        ['clean'],
                        ['insertFormation', 'insertHeroes']
                    ],
                    handlers: {
                        'image': imagePickerHandler,
                        'insertFormation': insertFormationHandler,
                        'insertHeroes': insertHeroesHandler
                    }
                }
            };

            if (BlotFormatter) {
                Quill.register('modules/blotFormatter', BlotFormatter, true);
                modules.blotFormatter = {};
            }

            quillEditor = new Quill('#editorQuillContainer', {
                theme: 'snow',
                placeholder: 'Write your comprehensive guide here...',
                modules: modules
            });

            // Style the custom toolbar buttons
            const toolbar = document.querySelector('#articleEditPage .ql-toolbar');
            if (toolbar) {
                const formBtn = toolbar.querySelector('.ql-insertFormation');
                if (formBtn) {
                    formBtn.innerHTML = '<i class="fa-solid fa-chess-board" style="font-size:12px"></i>';
                    formBtn.title = 'Insert Formation';
                }
                const heroBtn = toolbar.querySelector('.ql-insertHeroes');
                if (heroBtn) {
                    heroBtn.innerHTML = '<i class="fa-solid fa-users" style="font-size:12px"></i>';
                    heroBtn.title = 'Insert Hero Recommendation';
                }
                const imgBtn = toolbar.querySelector('.ql-image');
                if (imgBtn) imgBtn.title = 'Insert Image from Library';
            }

            // Live character counter
            quillEditor.on('text-change', updateCharCounter);

        } catch(e) { 
            console.warn("InfoEditor: Quill setup failed.", e); 
        }

        return quillEditor;
    };

    // --- CUSTOM TOOLBAR HANDLERS ---
    const imagePickerHandler = () => {
        if (!window.ImagePicker) { alert("Image Picker not loaded."); return; }
        window.ImagePicker.open((url) => {
            const range = quillEditor.getSelection(true);
            quillEditor.insertEmbed(range.index, 'image', url, Quill.sources.USER);
            quillEditor.setSelection(range.index + 1, Quill.sources.SILENT);
        }, 'Guide Image');
    };

    const insertFormationHandler = () => {
        const code = prompt("Enter the 5-letter Formation Code:");
        if (!code || code.trim().length !== 5) return;
        const range = quillEditor.getSelection(true);
        quillEditor.insertEmbed(range.index, 'formationEmbed', { code: code.trim().toUpperCase() }, Quill.sources.USER);
        quillEditor.setSelection(range.index + 1, Quill.sources.SILENT);
    };

    const insertHeroesHandler = () => {
        openHeroPickerOverlay((selectedIds) => {
            if (!selectedIds || selectedIds.length === 0) return;
            const range = quillEditor.getSelection(true);
            quillEditor.insertEmbed(range.index, 'heroesEmbed', { ids: selectedIds }, Quill.sources.USER);
            quillEditor.setSelection(range.index + 1, Quill.sources.SILENT);
        });
    };

    // --- CHARACTER COUNTER ---
    const CHAR_LIMIT = 50000;
    const CHAR_WARN = 45000;

    const updateCharCounter = () => {
        const counter = document.getElementById('editorCharCounter');
        const saveBtn = document.getElementById('editorSaveBtn');
        if (!counter || !quillEditor) return;

        const len = quillEditor.root.innerHTML.length;
        counter.textContent = `${len.toLocaleString()} / ${CHAR_LIMIT.toLocaleString()} chars`;

        if (len > CHAR_WARN) {
            counter.className = 'text-xs font-bold text-red-400 animate-pulse';
            if (len > CHAR_LIMIT && saveBtn) {
                saveBtn.disabled = true;
                saveBtn.title = 'Content exceeds 50,000 character limit. Remove pasted images.';
            }
        } else {
            counter.className = 'text-xs font-bold text-gray-500';
            if (saveBtn) { saveBtn.disabled = false; saveBtn.title = ''; }
        }
    };

    // --- HERO PICKER OVERLAY ---
    const openHeroPickerOverlay = (callback) => {
        selectedRecHeroes = [];
        const existing = document.getElementById('heroShortcodeOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'heroShortcodeOverlay';
        overlay.className = 'fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm';
        overlay.innerHTML = `
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-2xl w-full max-w-lg flex flex-col" style="max-height:80vh">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-bold text-white"><i class="fa-solid fa-users text-green-400 mr-2"></i>Select Heroes</h3>
                    <button onclick="document.getElementById('heroShortcodeOverlay').remove()" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <div id="heroOverlaySelected" class="flex flex-wrap gap-2 mb-3 min-h-[44px] bg-gray-900 rounded-lg p-2 border border-gray-700 items-center">
                    <span class="text-xs text-gray-600 italic">Click heroes below to select</span>
                </div>
                <input type="text" id="heroOverlaySearch" oninput="InfoEditor.renderOverlayPool()" placeholder="Search heroes..." class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 mb-2">
                <div id="heroOverlayPool" class="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto mb-4"></div>
                <div class="flex gap-3 justify-end">
                    <button onclick="document.getElementById('heroShortcodeOverlay').remove()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold text-sm">Cancel</button>
                    <button id="heroOverlayConfirm" class="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-sm shadow-lg"><i class="fa-solid fa-check mr-1"></i>Insert</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('heroOverlayConfirm').onclick = () => {
            overlay.remove();
            callback(selectedRecHeroes);
        };

        renderOverlayPool();
    };

    const renderOverlayPool = () => {
        const pool = document.getElementById('heroOverlayPool');
        const search = (document.getElementById('heroOverlaySearch')?.value || '').toLowerCase();
        if (!pool || heroData.length === 0) return;

        const filtered = heroData.filter(h => !search || h.name.toLowerCase().includes(search));
        pool.innerHTML = filtered.slice(0, 80).map(h => {
            const tc = getHeroTypeClass(h.heroType);
            const selected = selectedRecHeroes.includes(h.id) ? 'selected-hero' : '';
            return `<div onclick="InfoEditor.toggleOverlayHero('${h.id}')" class="hero-pick-item ${tc} ${selected}" title="${h.name}">
                <img src="${h.image}" onerror="this.src='https://placehold.co/40/4E4F5C/FFFFFF?text=?'" class="w-full h-full object-cover">
            </div>`;
        }).join('');
    };

    const toggleOverlayHero = (heroId) => {
        const idx = selectedRecHeroes.indexOf(heroId);
        if (idx > -1) selectedRecHeroes.splice(idx, 1);
        else selectedRecHeroes.push(heroId);
        updateOverlaySelected();
        renderOverlayPool();
    };

    const updateOverlaySelected = () => {
        const row = document.getElementById('heroOverlaySelected');
        if (!row) return;
        if (selectedRecHeroes.length === 0) {
            row.innerHTML = '<span class="text-xs text-gray-600 italic">Click heroes below to select</span>';
            return;
        }
        row.innerHTML = selectedRecHeroes.map(hid => {
            const h = heroData.find(hero => hero.id === hid);
            if (!h) return '';
            const tc = getHeroTypeClass(h.heroType);
            return `<div class="relative group">
                <div class="hero-pick-item ${tc}" title="${h.name}">
                    <img src="${h.image}" class="w-full h-full object-cover">
                </div>
                <button type="button" onclick="event.stopPropagation(); InfoEditor.toggleOverlayHero('${hid}')" class="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><i class="fa-solid fa-xmark"></i></button>
            </div>`;
        }).join('');
    };

    // --- OPEN / CLOSE FULL-PAGE EDITOR ---
    const openEditor = (article = null) => {
        setupQuill();
        if (!quillEditor) { alert("Editor failed to initialize."); return; }

        const editPage = document.getElementById('articleEditPage');
        const mainEl = document.querySelector('main');
        const fpEl = document.getElementById('articleFullPage');

        if (mainEl) mainEl.classList.add('hidden');
        if (fpEl) fpEl.classList.add('hidden');
        editPage.classList.remove('hidden');

        if (article) {
            document.getElementById('editorTitle').innerText = 'Edit Guide';
            document.getElementById('editorArticleId').value = article.id;
            document.getElementById('editorArticleTitle').value = article.title;
            document.getElementById('editorBannerUrl').value = article.image || '';
            document.getElementById('editorPinned').checked = article.isPinned === true;
            quillEditor.root.innerHTML = article.content || '';
            document.getElementById('editorDeleteBtn').classList.remove('hidden');

            // Re-render any blots that were loaded from saved HTML
            setTimeout(() => hydrateExistingBlots(), 200);
        } else {
            document.getElementById('editorTitle').innerText = 'Create New Guide';
            document.getElementById('editorArticleId').value = '';
            document.getElementById('editorArticleTitle').value = '';
            document.getElementById('editorBannerUrl').value = '';
            document.getElementById('editorPinned').checked = false;
            quillEditor.root.innerHTML = '';
            document.getElementById('editorDeleteBtn').classList.add('hidden');
        }

        updateCharCounter();
        window.scrollTo(0, 0);
    };

    // When loading saved content, re-render the formations and heroes inside existing blots
    const hydrateExistingBlots = () => {
        const formBlots = document.querySelectorAll('#editorQuillContainer .shortcode-formation-embed');
        formBlots.forEach(el => {
            const code = el.getAttribute('data-formation-code');
            if (code) loadFormationIntoElement(code, el);
        });

        const heroBlots = document.querySelectorAll('#editorQuillContainer .shortcode-heroes-embed');
        heroBlots.forEach(el => {
            const idsStr = el.getAttribute('data-hero-ids') || '';
            const ids = idsStr.split(',').filter(Boolean);
            if (ids.length) renderHeroesIntoElement(ids, el);
        });
    };

    const closeEditor = () => {
        const editPage = document.getElementById('articleEditPage');
        editPage.classList.add('hidden');
        if (onCancelCallback) onCancelCallback();
    };

    // --- SAVE ---
    const saveArticle = async () => {
        if (!quillEditor) return;
        const btn = document.getElementById('editorSaveBtn');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`; btn.disabled = true;

        const formData = {
            id: document.getElementById('editorArticleId').value || "temp_" + Date.now(),
            title: document.getElementById('editorArticleTitle').value,
            image: document.getElementById('editorBannerUrl').value,
            isPinned: document.getElementById('editorPinned').checked,
            content: quillEditor.root.innerHTML,
            lastUpdate: new Date().toISOString(),
            recommendedHeroes: [],
            formationCode: ''
        };

        try {
            const res = await fetch(API_URL, { 
                method: "POST", 
                body: JSON.stringify({ action: "save_info", data: formData, token: authToken }), 
                redirect: "follow" 
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            if (formData.id.startsWith("temp_") && data.id) {
                formData.id = data.id;
            }
            if (onSaveCallback) onSaveCallback(formData);
            closeEditor();
        } catch(e) { 
            alert("Failed to save! " + e.message); 
        } finally {
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Save Post`; btn.disabled = false;
        }
    };

    // --- DELETE ---
    const deleteArticle = async () => {
        const id = document.getElementById('editorArticleId').value;
        if (!id || !confirm("Are you sure you want to permanently delete this guide?")) return;

        try {
            await fetch(API_URL, { 
                method: "POST", 
                body: JSON.stringify({ action: "delete_info", id: id, token: authToken }), 
                redirect: "follow" 
            });
            if (onDeleteCallback) onDeleteCallback(id);
            closeEditor();
        } catch(e) { alert("Failed to delete."); }
    };

    return { 
        init, openEditor, closeEditor, saveArticle, deleteArticle,
        renderOverlayPool, toggleOverlayHero,
        getHeroData: () => heroData,
        getHeroTypeClass
    };
})();
