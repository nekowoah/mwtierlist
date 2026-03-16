/**
 * MWR Tierlist Admin Editor
 * Dynamically injected only for authenticated Admins. 
 */

window.TierlistEditor = (() => {
    let appRef = null;
    let editingId = null;

    const injectHTML = () => {
        if (document.getElementById('editModal')) return;

        const html = `
        <div id="editModal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-2 sm:p-4">
            <div class="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onclick="TierlistEditor.close()"></div>
            <div class="relative bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-[92vw] sm:w-[90vw] max-w-lg md:max-w-5xl h-[82vh] md:h-[90vh] flex flex-col fade-in">
                <div class="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl shrink-0">
                    <h2 class="text-xl font-bold text-indigo-400 flex items-center gap-2"><i class="fa-solid fa-pen-nib"></i> <span id="editModalTitle">Edit Hero</span></h2>
                    <button onclick="TierlistEditor.close()" class="text-gray-400 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>
                
                <form onsubmit="event.preventDefault(); TierlistEditor.save();" class="flex flex-col flex-grow p-4 sm:p-6 overflow-y-auto hide-scrollbar gap-4">
                    <input type="hidden" id="editId">
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Name</label>
                            <input type="text" id="editName" required class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500">
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Image URL</label>
                            <div class="flex gap-2">
                                <input type="text" id="editImage" required class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500">
                                <button type="button" onclick="TierlistEditor.openImageGallery()" class="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded border border-gray-600 transition-colors shadow-sm" title="Select Image from Gallery"><i class="fa-solid fa-images"></i></button>
                                <label class="bg-gray-700 hover:bg-gray-600 text-white px-3 flex items-center justify-center rounded border border-gray-600 transition-colors shadow-sm cursor-pointer" title="Upload to GitHub (Auto WebP)">
                                    <i class="fa-solid fa-upload"></i>
                                    <input type="file" accept="image/*" class="hidden" onchange="TierlistEditor.uploadImage(event)">
                                </label>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Class</label>
                            <select id="editClass" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500"></select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Hero ID (Internal)</label>
                            <input type="text" id="editHeroId" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500" placeholder="e.g. hero_name">
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Early Rank</label>
                            <select id="editEarly" class="rank-select bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500"></select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Late Rank</label>
                            <select id="editLate" class="rank-select bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500"></select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Sacrament Rank</label>
                            <select id="editSacrament" class="rank-select bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500"></select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Hero Type</label>
                            <select id="editType" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500">
                                <option value="Normal">Normal</option>
                                <option value="Basic Limited">Basic Limited</option>
                                <option value="Limited">Limited</option>
                                <option value="VIP">VIP</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Has Awaken?</label>
                            <select id="editAwaken" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500">
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Role Summary</label>
                        <input type="text" id="editRole" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500">
                    </div>

                    <div>
                        <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Analysis & Notes</label>
                        <textarea id="editNotes" rows="3" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white outline-none focus:border-indigo-500"></textarea>
                    </div>

                    <div class="border-t border-gray-700 pt-4 mt-2">
                        <button type="button" onclick="document.getElementById('skillsEditContainer').classList.toggle('hidden')" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold w-full flex justify-between items-center transition-colors">
                            <span><i class="fa-solid fa-cogs mr-2"></i> Expand/Collapse Skills Data</span>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        
                        <div id="skillsEditContainer" class="hidden flex flex-col gap-4 mt-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-xs text-blue-400 uppercase font-bold block mb-1">Skill Name</label>
                                    <input type="text" id="editSkillName" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white">
                                </div>
                                <div>
                                    <label class="text-xs text-blue-400 uppercase font-bold block mb-1">Skill Summary</label>
                                    <textarea id="editSkillSummary" rows="2" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white"></textarea>
                                </div>
                            </div>

                            <div class="border-t border-gray-700 pt-4">
                                <label class="text-xs text-yellow-500 uppercase font-bold block mb-1">Sacrament Name</label>
                                <input type="text" id="editSacrName" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white mb-2">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <input type="text" id="editS1" placeholder="Sacrament 1" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                    <input type="text" id="editS2" placeholder="Sacrament 2" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                    <input type="text" id="editS3" placeholder="Sacrament 3" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                    <input type="text" id="editS4" placeholder="Sacrament 4" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                    <input type="text" id="editS5" placeholder="Sacrament 5" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                </div>
                            </div>

                            <div class="border-t border-gray-700 pt-4">
                                <label class="text-xs text-red-400 uppercase font-bold block mb-1">Awaken Name</label>
                                <input type="text" id="editAwakenName" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white mb-2">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <input type="text" id="editAw1" placeholder="Awaken 1" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                    <input type="text" id="editAw2" placeholder="Awaken 2" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                    <input type="text" id="editAw3" placeholder="Awaken 3" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center shrink-0 pt-4 border-t border-gray-700 mt-2">
                        <button type="button" onclick="TierlistEditor.delete()" id="btnDelete" class="text-red-400 hover:text-red-300 text-sm font-bold transition-colors hidden"><i class="fa-solid fa-trash mr-1"></i>Delete Hero</button>
                        <div class="flex gap-3 ml-auto">
                            <button type="button" onclick="TierlistEditor.close()" class="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors">Cancel</button>
                            <button type="submit" id="btnSave" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold transition-colors shadow-lg"><i class="fa-solid fa-cloud-arrow-up mr-2"></i>Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    const open = (hero, appInstance) => {
        appRef = appInstance;
        injectHTML();
        
        const modal = document.getElementById('editModal');
        const btnDelete = document.getElementById('btnDelete');
        
        const classSelect = document.getElementById('editClass');
        if (classSelect.options.length === 0) {
            classSelect.innerHTML = Object.keys(window.MWR_GLOBALS.CLASS_ICONS).map(c => `<option value="${c}">${c}</option>`).join('');
        }

        const rankSelects = document.querySelectorAll('.rank-select');
        if (rankSelects[0].options.length === 0) {
            const rankOptions = window.MWR_GLOBALS.RANKS.map(r => `<option value="${r}">${r}</option>`).join('');
            rankSelects.forEach(s => s.innerHTML = rankOptions);
        }

        if (hero && hero.id) {
            editingId = hero.id;
            document.getElementById('editModalTitle').innerText = "Edit Hero";
            document.getElementById('editId').value = hero.id;
            document.getElementById('editHeroId').value = hero.heroId || "";
            document.getElementById('editName').value = hero.name || "";
            document.getElementById('editImage').value = hero.image || "";
            document.getElementById('editClass').value = hero.heroClass || "Mage";
            document.getElementById('editType').value = hero.heroType || "Normal";
            document.getElementById('editAwaken').value = hero.hasAwaken || "No";
            document.getElementById('editEarly').value = hero.early || "Unranked";
            document.getElementById('editLate').value = hero.late || "Unranked";
            document.getElementById('editSacrament').value = hero.sacrament || "Unranked";
            document.getElementById('editRole').value = hero.role || "";
            document.getElementById('editNotes').value = hero.notes || "";
            
            document.getElementById('editSkillName').value = hero.skillName || "";
            document.getElementById('editSkillSummary').value = hero.skill || "";
            document.getElementById('editSacrName').value = hero.sacramentName || "";
            document.getElementById('editS1').value = hero.s1 || "";
            document.getElementById('editS2').value = hero.s2 || "";
            document.getElementById('editS3').value = hero.s3 || "";
            document.getElementById('editS4').value = hero.s4 || "";
            document.getElementById('editS5').value = hero.s5 || "";
            document.getElementById('editAwakenName').value = hero.awakenName || "";
            document.getElementById('editAw1').value = hero.aw1 || "";
            document.getElementById('editAw2').value = hero.aw2 || "";
            document.getElementById('editAw3').value = hero.aw3 || "";
            
            btnDelete.classList.remove('hidden');
        } else {
            editingId = null;
            document.getElementById('editModalTitle').innerText = "Add New Hero";
            document.getElementById('editId').value = "";
            document.getElementById('editHeroId').value = "";
            document.getElementById('editName').value = "";
            document.getElementById('editImage').value = "";
            document.getElementById('editRole').value = "";
            document.getElementById('editNotes').value = "";
            
            document.getElementById('editSkillName').value = "";
            document.getElementById('editSkillSummary').value = "";
            document.getElementById('editSacrName').value = "";
            document.getElementById('editS1').value = "";
            document.getElementById('editS2').value = "";
            document.getElementById('editS3').value = "";
            document.getElementById('editS4').value = "";
            document.getElementById('editS5').value = "";
            document.getElementById('editAwakenName').value = "";
            document.getElementById('editAw1').value = "";
            document.getElementById('editAw2').value = "";
            document.getElementById('editAw3').value = "";
            
            btnDelete.classList.add('hidden');
        }
        
        modal.classList.remove('hidden');
    };

    const close = () => {
        const modal = document.getElementById('editModal');
        if(modal) modal.classList.add('hidden');
    };

    let galleryCache = [];

    const openImageGallery = async () => {
        if (!document.getElementById('imageGalleryModal')) {
            const modalHtml = `
            <div id="imageGalleryModal" class="fixed inset-0 z-[60] hidden flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                    <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 shrink-0">
                        <h3 class="text-xl font-bold text-white"><i class="fa-solid fa-images text-indigo-400 mr-2"></i> Select Image</h3>
                        <button type="button" onclick="document.getElementById('imageGalleryModal').classList.add('hidden')" class="text-gray-400 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-xl"></i></button>
                    </div>
                    <div class="mb-4 shrink-0">
                        <input type="text" id="gallerySearchInput" onkeyup="TierlistEditor.filterGallery()" placeholder="Search images..." class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none focus:border-indigo-500">
                    </div>
                    <div id="galleryGrid" class="flex-grow overflow-y-auto hide-scrollbar grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 content-start">
                        <div class="col-span-full text-center text-gray-500 py-10"><i class="fas fa-circle-notch fa-spin text-2xl text-indigo-500 mb-2"></i><br>Loading Library...</div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        document.getElementById('imageGalleryModal').classList.remove('hidden');
        const grid = document.getElementById('galleryGrid');
        
        if (galleryCache.length === 0) {
            try {
                const token = localStorage.getItem('mw_admin_token') || sessionStorage.getItem('mw_admin_token');
                const res = await fetch(window.MWR_GLOBALS.API_URL, { 
                    method: "POST", 
                    body: JSON.stringify({ action: "list_images", token: token }), 
                    redirect: "follow" 
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                galleryCache = data;
                renderGallery();
            } catch(e) {
                grid.innerHTML = `<div class="col-span-full text-red-400 text-center py-10">Failed to load images.</div>`;
            }
        } else {
            renderGallery();
        }
    };

    const renderGallery = () => {
        const grid = document.getElementById('galleryGrid');
        const search = document.getElementById('gallerySearchInput').value.toLowerCase();
        
        const filtered = galleryCache.filter(img => img.name.toLowerCase().includes(search));
        
        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-gray-500 text-center py-10">No images found.</div>`;
            return;
        }
        
        // FIX: The flex utilities and max-w-full keep the image properly constrained inside the box!
        grid.innerHTML = filtered.map(img => `
            <div onclick="TierlistEditor.selectImage('${img.download_url}')" class="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 cursor-pointer aspect-square relative group flex items-center justify-center p-2 transition-colors">
                <img src="${img.download_url}" class="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform">
                <div class="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] text-gray-300 truncate px-1 py-1 text-center">${img.name}</div>
            </div>
        `).join('');
    };

    const filterGallery = () => renderGallery();

    const selectImage = (url) => {
        document.getElementById('editImage').value = url;
        document.getElementById('imageGalleryModal').classList.add('hidden');
    };

    const uploadImage = async (event) => {
        const file = event.target.files[0];
        if(!file) return;
        
        const name = document.getElementById('editName').value;
        if(!name) { alert("Please enter the Hero's Name first so we can name the file!"); event.target.value = ""; return; }

        const imgInput = document.getElementById('editImage');
        const oldVal = imgInput.value;
        imgInput.value = "Converting & Uploading...";

        try {
            const base64WebP = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width; canvas.height = img.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/webp', 0.85).split(',')[1]);
                    };
                    img.onerror = () => reject("Image processing failed.");
                };
                reader.onerror = () => reject("File reading failed.");
            });

            const safeName = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const fileName = `hero_${safeName}_${Date.now()}.webp`;

            const token = localStorage.getItem('mw_admin_token') || sessionStorage.getItem('mw_admin_token');
            const res = await fetch(window.MWR_GLOBALS.API_URL, { 
                method: "POST", 
                body: JSON.stringify({ action: "upload_image", fileData: base64WebP, fileName: fileName, token: token }), 
                redirect: "follow" 
            });
            const data = await res.json();
            
            if(data.error) throw new Error(data.error);
            imgInput.value = data.url;
            galleryCache = []; // Purge cache so it refreshes next time it's opened
        } catch(e) {
            alert("Upload failed: " + e.message);
            imgInput.value = oldVal;
        } finally {
            event.target.value = ""; 
        }
    };

    const save = async () => {
        if (!appRef) return;
        const btn = document.getElementById('btnSave');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Saving...`; 
        btn.disabled = true;

        const formData = {
            id: document.getElementById('editId').value || "temp_" + Date.now(),
            heroId: document.getElementById('editHeroId').value,
            name: document.getElementById('editName').value,
            image: document.getElementById('editImage').value,
            heroClass: document.getElementById('editClass').value,
            heroType: document.getElementById('editType').value,
            hasAwaken: document.getElementById('editAwaken').value,
            early: document.getElementById('editEarly').value,
            late: document.getElementById('editLate').value,
            sacrament: document.getElementById('editSacrament').value,
            role: document.getElementById('editRole').value,
            notes: document.getElementById('editNotes').value,
            skillName: document.getElementById('editSkillName').value,
            skill: document.getElementById('editSkillSummary').value,
            sacramentName: document.getElementById('editSacrName').value,
            s1: document.getElementById('editS1').value,
            s2: document.getElementById('editS2').value,
            s3: document.getElementById('editS3').value,
            s4: document.getElementById('editS4').value,
            s5: document.getElementById('editS5').value,
            awakenName: document.getElementById('editAwakenName').value,
            aw1: document.getElementById('editAw1').value,
            aw2: document.getElementById('editAw2').value,
            aw3: document.getElementById('editAw3').value,
            lastUpdate: new Date().toISOString()
        };

        // Optimistic Local Update
        let heroes = appRef.getHeroes();
        const existingIndex = heroes.findIndex(h => h.id == formData.id);
        if (existingIndex >= 0) heroes[existingIndex] = formData;
        else heroes.unshift(formData);
        
        appRef.setHeroes(heroes);
        appRef.render();
        close();

        try {
            const token = localStorage.getItem('mw_admin_token') || sessionStorage.getItem('mw_admin_token');
            const res = await fetch(window.MWR_GLOBALS.API_URL, { 
                method: "POST", 
                body: JSON.stringify({ action: "save", data: formData, token: token }), 
                redirect: "follow" 
            });
            const data = await res.json();
            
            if(data.error) throw new Error(data.error);
            
            if(formData.id.startsWith("temp_") && data.id) {
                const idx = heroes.findIndex(h => h.id === formData.id);
                if(idx !== -1) heroes[idx].id = data.id;
            }
            localStorage.setItem('mwr_tierlist_data_v6', JSON.stringify(heroes));
        } catch(e) { 
            alert("Failed to save! Please check your connection."); 
            window.location.reload(); 
        } finally {
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up mr-2"></i>Save`; 
            btn.disabled = false;
        }
    };

    const deleteHero = async () => {
        if (!appRef) return;
        const id = document.getElementById('editId').value;
        if (!id || !confirm("Are you sure you want to permanently delete this hero?")) return;

        let heroes = appRef.getHeroes().filter(h => h.id != id);
        appRef.setHeroes(heroes);
        appRef.render();
        close();

        try {
            const token = localStorage.getItem('mw_admin_token') || sessionStorage.getItem('mw_admin_token');
            await fetch(window.MWR_GLOBALS.API_URL, { 
                method: "POST", 
                body: JSON.stringify({ action: "delete", id: id, token: token }), 
                redirect: "follow" 
            });
            localStorage.setItem('mwr_tierlist_data_v6', JSON.stringify(heroes));
        } catch(e) { 
            alert("Failed to delete."); 
            window.location.reload(); 
        }
    };

    return { open, close, save, delete: deleteHero, openImageGallery, filterGallery, selectImage, uploadImage };
})();
