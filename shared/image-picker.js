/**
 * MWR Universal Image Picker Modal
 * Handles GitHub WebP uploading, Base64 conversion, List Selection, and Previewing.
 */
window.ImagePicker = (() => {
    let galleryCache = [];
    let onSelectCallback = null;
    let currentSelection = null; // Tracks the currently clicked image object

    const injectHTML = () => {
        if (document.getElementById('imagePickerModal')) return;

        const modalHtml = `
        <div id="imagePickerModal" class="fixed inset-0 hidden flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm fade-in" style="z-index: 70; background-color: rgba(0,0,0,0.9);">
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 shadow-2xl w-full max-w-5xl flex flex-col" style="height: 85vh;">
                
                <!-- Header -->
                <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-3 shrink-0">
                    <h3 class="text-xl font-bold text-white"><i class="fa-solid fa-images text-indigo-400 mr-2"></i> Image Library</h3>
                    <div class="flex gap-2 sm:gap-3 items-center">
                        <label class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg cursor-pointer font-bold shadow-sm transition-colors text-xs sm:text-sm flex items-center border border-gray-600">
                            <i class="fa-solid fa-upload sm:mr-2"></i> <span class="hidden sm:inline">Upload</span>
                            <input type="file" accept="image/*" class="hidden" onchange="ImagePicker.upload(event)">
                        </label>
                        <button type="button" onclick="ImagePicker.close()" class="text-gray-400 hover:text-white transition-colors ml-1 sm:ml-2 bg-gray-900 w-8 h-8 rounded-full flex items-center justify-center border border-gray-700"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>

                <!-- Search -->
                <div class="mb-4 shrink-0">
                    <div class="relative">
                        <input type="text" id="pickerSearchInput" onkeyup="ImagePicker.filter()" placeholder="Search images..." class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 pl-10 text-white outline-none focus:border-indigo-500 transition-colors shadow-inner text-sm">
                        <i class="fa-solid fa-search absolute left-3.5 top-3.5 text-gray-500"></i>
                    </div>
                </div>

                <!-- Main Content Area (Split View) -->
                <div class="flex flex-grow overflow-hidden min-h-0 gap-4">
                    
                    <!-- Left Side: Scrollable List -->
                    <div id="pickerList" class="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-2 pr-1 content-start">
                        <div class="text-center text-gray-500 py-10 w-full"><i class="fas fa-circle-notch fa-spin text-2xl text-indigo-500 mb-2"></i><br>Loading Library...</div>
                    </div>

                    <!-- Right Side: Preview Pane (Hidden on Mobile) -->
                    <div class="hidden md:flex w-1/2 lg:w-5/12 bg-gray-900/50 border border-gray-700 rounded-xl p-4 flex-col items-center justify-center relative overflow-hidden shadow-inner">
                        <div id="previewEmpty" class="text-gray-600 text-center flex flex-col items-center gap-3">
                            <i class="fa-regular fa-image text-5xl opacity-50"></i>
                            <span class="text-sm font-bold tracking-wide">Select an image from the list</span>
                        </div>
                        <div id="previewContent" class="hidden w-full h-full flex flex-col items-center justify-center gap-4">
                            <div class="relative flex-grow w-full flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-700 p-2">
                                <img id="previewImg" src="" class="max-w-full max-h-full object-contain drop-shadow-xl rounded">
                            </div>
                            <div id="previewName" class="text-sm text-gray-300 font-bold truncate w-full text-center px-2 bg-gray-900 py-2 rounded-lg border border-gray-700 shrink-0"></div>
                        </div>
                    </div>

                </div>

                <!-- Footer Action Bar -->
                <div class="border-t border-gray-700 pt-4 mt-4 shrink-0 flex justify-end gap-3 bg-gray-800">
                    <button type="button" onclick="ImagePicker.close()" class="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors text-sm">Cancel</button>
                    <button type="button" id="btnConfirmImage" onclick="ImagePicker.confirmSelection()" disabled class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-all shadow-lg flex items-center gap-2 text-sm border border-indigo-500">
                        <i class="fa-solid fa-check"></i> Select Image
                    </button>
                </div>

            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // We keep the targetName argument in the signature to avoid breaking existing calls in info.html & editor.js, but we won't use it for uploads anymore.
    const open = async (callback, targetName = "Unknown") => {
        onSelectCallback = callback;
        currentSelection = null;
        injectHTML();
        
        document.getElementById('imagePickerModal').classList.remove('hidden');
        document.getElementById('pickerSearchInput').value = "";
        
        // Reset preview state
        document.getElementById('previewEmpty').classList.remove('hidden');
        document.getElementById('previewContent').classList.add('hidden');
        document.getElementById('btnConfirmImage').disabled = true;
        
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
                render();
            } catch(e) {
                document.getElementById('pickerList').innerHTML = `<div class="w-full text-red-400 text-center py-10">Failed to load images.</div>`;
            }
        } else {
            render();
        }
    };

    const close = () => {
        const modal = document.getElementById('imagePickerModal');
        if (modal) modal.classList.add('hidden');
    };

    const render = () => {
        const list = document.getElementById('pickerList');
        const search = document.getElementById('pickerSearchInput').value.toLowerCase();
        const filtered = galleryCache.filter(img => img.name.toLowerCase().includes(search));
        
        if (filtered.length === 0) {
            list.innerHTML = `<div class="w-full text-gray-500 text-center py-10 text-sm">No images found matching your search.</div>`;
            return;
        }
        
        list.innerHTML = filtered.map(img => {
            const isSelected = currentSelection && currentSelection.sha === img.sha;
            const activeContainerClass = isSelected ? 'bg-indigo-600/10 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-700/50';
            const activeTextClass = isSelected ? 'text-white' : 'text-gray-300';
            
            const safeSha = img.sha;

            return `
                <div onclick="ImagePicker.selectPreview('${safeSha}')" class="flex items-center gap-3 p-2 rounded-lg border ${activeContainerClass} cursor-pointer transition-colors group">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gray-900 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-700 shadow-inner p-1">
                        <img src="${img.download_url}" class="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform">
                    </div>
                    <div class="flex-grow min-w-0">
                        <h4 class="text-xs sm:text-sm font-bold ${activeTextClass} truncate group-hover:text-white transition-colors">${img.name}</h4>
                    </div>
                    ${isSelected ? '<div class="mr-3"><i class="fa-solid fa-circle-check text-indigo-400 text-lg sm:text-xl drop-shadow-md"></i></div>' : ''}
                </div>
            `;
        }).join('');
    };

    const filter = () => render();

    const selectPreview = (sha) => {
        currentSelection = galleryCache.find(img => img.sha === sha);
        if (!currentSelection) return;

        // Enable the final select button
        document.getElementById('btnConfirmImage').disabled = false;
        
        // Render right-side preview (Visible on Desktop)
        document.getElementById('previewEmpty').classList.add('hidden');
        const previewContent = document.getElementById('previewContent');
        previewContent.classList.remove('hidden');
        document.getElementById('previewImg').src = currentSelection.download_url;
        document.getElementById('previewName').innerText = currentSelection.name;

        // Re-render the list to apply the active selection border/icon
        render();
    };

    const confirmSelection = () => {
        if (currentSelection && onSelectCallback) {
            onSelectCallback(currentSelection.download_url);
            close();
        }
    };

    const upload = async (event) => {
        const file = event.target.files[0];
        if(!file) return;

        const list = document.getElementById('pickerList');
        list.innerHTML = `<div class="w-full text-yellow-400 font-bold text-center py-10"><i class="fas fa-spinner fa-spin text-2xl mb-3"></i><br>Converting & Uploading...</div>`;
        document.getElementById('btnConfirmImage').disabled = true;

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

            // Extract the original filename without the extension, make it safe, append .webp
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            let safeName = originalName.replace(/[^a-zA-Z0-9_\-]/g, "").toLowerCase();
            if (!safeName) safeName = `image_${Date.now()}`; 
            const fileName = `${safeName}.webp`;

            const token = localStorage.getItem('mw_admin_token') || sessionStorage.getItem('mw_admin_token');
            const res = await fetch(window.MWR_GLOBALS.API_URL, { 
                method: "POST", 
                body: JSON.stringify({ action: "upload_image", fileData: base64WebP, fileName: fileName, token: token }), 
                redirect: "follow" 
            });
            const data = await res.json();
            
            if(data.error) throw new Error(data.error);
            
            // Push the newly uploaded image into the local cache so we don't have to re-download the whole library
            const newImageObj = { name: fileName, download_url: data.url, sha: data.url }; // fake sha for instant selection
            galleryCache.unshift(newImageObj);
            
            // Auto-select the newly uploaded image!
            selectPreview(newImageObj.sha);
            
        } catch(e) {
            alert("Upload failed: " + e.message);
            render(); // Restore list on failure
        } finally {
            event.target.value = ""; 
        }
    };

    return { open, close, filter, selectPreview, confirmSelection, upload };
})();
