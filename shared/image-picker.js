/**
 * MWR Universal Image Picker Modal
 * Handles GitHub WebP uploading, Base64 conversion, and Image Selection.
 */
window.ImagePicker = (() => {
    let galleryCache = [];
    let onSelectCallback = null;
    let currentTargetName = "";

    const injectHTML = () => {
        if (document.getElementById('imagePickerModal')) return;

        // We inject a tiny native CSS block to guarantee 4 cols on mobile and 6 on desktop, 
        // completely bypassing any Tailwind CDN purging bugs!
        const modalHtml = `
        <style>
            .picker-grid-custom {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 0.75rem;
                justify-content: center;
                align-content: start;
            }
            @media (min-width: 768px) {
                .picker-grid-custom {
                    grid-template-columns: repeat(6, 1fr);
                    gap: 1rem;
                }
            }
        </style>
        <div id="imagePickerModal" class="fixed inset-0 hidden flex items-center justify-center p-4 backdrop-blur-sm fade-in" style="z-index: 70; background-color: rgba(0,0,0,0.9);">
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 shadow-2xl w-full max-w-4xl flex flex-col" style="height: 80vh;">
                <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 shrink-0">
                    <h3 class="text-xl font-bold text-white"><i class="fa-solid fa-images text-indigo-400 mr-2"></i> Select Image</h3>
                    <div class="flex gap-3">
                        <label class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded cursor-pointer font-bold shadow-lg transition-colors text-sm flex items-center">
                            <i class="fa-solid fa-upload mr-2"></i> Upload New
                            <input type="file" accept="image/*" class="hidden" onchange="ImagePicker.upload(event)">
                        </label>
                        <button type="button" onclick="ImagePicker.close()" class="text-gray-400 hover:text-white transition-colors ml-2"><i class="fa-solid fa-xmark text-xl"></i></button>
                    </div>
                </div>
                <div class="mb-4 shrink-0">
                    <input type="text" id="pickerSearchInput" onkeyup="ImagePicker.filter()" placeholder="Search existing images..." class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none focus:border-indigo-500">
                </div>
                <div id="pickerGrid" class="flex-grow overflow-y-auto hide-scrollbar picker-grid-custom">
                    <div class="text-center text-gray-500 py-10" style="grid-column: 1 / -1;"><i class="fas fa-circle-notch fa-spin text-2xl text-indigo-500 mb-2"></i><br>Loading Library...</div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    const open = async (callback, targetName = "Unknown") => {
        onSelectCallback = callback;
        currentTargetName = targetName;
        injectHTML();
        
        document.getElementById('imagePickerModal').classList.remove('hidden');
        document.getElementById('pickerSearchInput').value = "";
        
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
                document.getElementById('pickerGrid').innerHTML = `<div class="text-red-400 text-center py-10" style="grid-column: 1 / -1;">Failed to load images.</div>`;
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
        const grid = document.getElementById('pickerGrid');
        const search = document.getElementById('pickerSearchInput').value.toLowerCase();
        const filtered = galleryCache.filter(img => img.name.toLowerCase().includes(search));
        
        if (filtered.length === 0) {
            grid.innerHTML = `<div class="text-gray-500 text-center py-10" style="grid-column: 1 / -1;">No images found.</div>`;
            return;
        }
        
        // We use aspect-square here so the grid perfectly scales the height to match the new width!
        grid.innerHTML = filtered.map(img => `
            <div onclick="ImagePicker.select('${img.download_url}')" class="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 cursor-pointer relative group transition-colors aspect-square w-full">
                <div class="absolute inset-0 p-2 flex items-center justify-center">
                    <img src="${img.download_url}" class="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform">
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] text-gray-300 truncate px-1 py-1 text-center z-10">${img.name}</div>
            </div>
        `).join('');
    };

    const filter = () => render();

    const select = (url) => {
        if (onSelectCallback) onSelectCallback(url);
        close();
    };

    const upload = async (event) => {
        const file = event.target.files[0];
        if(!file) return;
        
        if(!currentTargetName || currentTargetName.trim() === "") { 
            alert("Please enter a Name/Title in the editor first so we can name the file!"); 
            event.target.value = ""; 
            return; 
        }

        const grid = document.getElementById('pickerGrid');
        grid.innerHTML = `<div class="text-yellow-400 font-bold text-center py-10" style="grid-column: 1 / -1;"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>Converting & Uploading...</div>`;

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

            const safeName = currentTargetName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const fileName = `${safeName}_${Date.now()}.webp`;

            const token = localStorage.getItem('mw_admin_token') || sessionStorage.getItem('mw_admin_token');
            const res = await fetch(window.MWR_GLOBALS.API_URL, { 
                method: "POST", 
                body: JSON.stringify({ action: "upload_image", fileData: base64WebP, fileName: fileName, token: token }), 
                redirect: "follow" 
            });
            const data = await res.json();
            
            if(data.error) throw new Error(data.error);
            
            // Auto-select the newly uploaded image!
            select(data.url);
            galleryCache = []; // Purge cache so it refreshes next time
            
        } catch(e) {
            alert("Upload failed: " + e.message);
            render(); // Restore grid
        } finally {
            event.target.value = ""; 
        }
    };

    return { open, close, filter, select, upload };
})();
