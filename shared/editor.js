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
            <div class="absolute inset-0 backdrop-blur-sm transition-opacity" style="background-color: rgba(0,0,0,0.9);" onclick="TierlistEditor.close()"></div>
            <div class="relative bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col fade-in" style="height: 85vh;">
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
                                <!-- FIX: Properly hooked up to the Universal Image Picker, no local upload logic needed! -->
                                <button type="button" onclick="ImagePicker.open((url) => document.getElementById('editImage').value = url, document.getElementById('editName').value)" class="bg-gray-700 hover:bg-gray-600 text-white px-4 rounded border border-gray-600 transition-colors shadow-sm" title="Select Image from Gallery"><i class="fa-solid fa-images"></i></button>
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

    return { open, close, save, delete: deleteHero };
})();
