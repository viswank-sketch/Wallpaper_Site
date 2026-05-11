document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('wallpaper-grid');
    const loader = document.getElementById('loader');
    
    // Modal Elements
    const uploadBtn = document.getElementById('upload-btn');
    const closeModal = document.getElementById('close-modal');
    const modal = document.getElementById('upload-modal');
    
    // Form Elements
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const dropArea = document.getElementById('drop-area');
    const fileNameDisplay = document.getElementById('file-name-display');
    const submitBtn = document.getElementById('submit-upload');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Image Modal Elements
    const imageModal = document.getElementById('image-modal');
    const closeImageModal = document.getElementById('close-image-modal');
    const fullImage = document.getElementById('full-image');

    // Toast
    const toastContainer = document.getElementById('toast-container');

    // State
    let allWallpapers = [];
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Fetch Wallpapers on Load
    fetchWallpapers();

    // -- Modal Toggle Logic --
    uploadBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
        resetForm();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            resetForm();
        }
    });

    closeImageModal.addEventListener('click', () => {
        imageModal.classList.add('hidden');
        fullImage.src = '';
    });

    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.classList.add('hidden');
            fullImage.src = '';
        }
    });

    // -- File Drag & Drop logic --
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });

    dropArea.addEventListener('drop', (e) => {
        let dt = e.dataTransfer;
        let files = dt.files;
        if (files.length) {
            fileInput.files = files;
            updateFileDisplay();
        }
    });

    fileInput.addEventListener('change', updateFileDisplay);

    function updateFileDisplay() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            // Simple validation
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file.', 'error');
                resetForm();
                return;
            }
            fileNameDisplay.textContent = file.name;
            submitBtn.disabled = false;
        } else {
            fileNameDisplay.textContent = '';
            submitBtn.disabled = true;
        }
    }

    function resetForm() {
        uploadForm.reset();
        fileNameDisplay.textContent = '';
        submitBtn.disabled = true;
    }

    // -- Upload Logic --
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!fileInput.files.length) return;

        const categorySelect = document.getElementById('wallpaper-category');
        const nameInput = document.getElementById('wallpaper-name');

        if (!nameInput.value.trim()) {
            showToast('Please enter a name for your wallpaper', 'error');
            return;
        }

        if (!categorySelect.value) {
            showToast('Please select a category', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('name', nameInput.value.trim());
        formData.append('category', categorySelect.value);
        formData.append('wallpaper', fileInput.files[0]);

        // UI Loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Wallpaper uploaded successfully!');
                modal.classList.add('hidden');
                resetForm();
                fetchWallpapers(); // Refresh grid
            } else {
                showToast(data.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Error uploading:', error);
            showToast('Network error during upload', 'error');
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    });

    // -- Fetch & Render Wallpapers --
    async function fetchWallpapers() {
        loader.classList.remove('hidden');
        grid.innerHTML = '';
        
        try {
            const response = await fetch('/api/wallpapers');
            allWallpapers = await response.json();

            // Render with active filter
            const activeFilter = document.querySelector('.filter-btn.active').dataset.category;
            renderGrid(activeFilter);
        } catch (error) {
            console.error('Error fetching wallpapers:', error);
            loader.classList.add('hidden');
            showToast('Failed to load gallery', 'error');
        }
    }

    function renderGrid(filterCategory = 'All') {
        loader.classList.add('hidden');
        grid.innerHTML = '';

        const files = filterCategory === 'All' 
            ? allWallpapers 
            : allWallpapers.filter(w => w.category === filterCategory);

        if (files.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <h3>No wallpapers found</h3>
                    <p>Upload a new background in this category.</p>
                </div>
            `;
            return;
        }

        files.forEach(fileObj => {
            const card = createWallpaperCard(fileObj);
            grid.appendChild(card);
        });
    }

    // Category Filtering logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderGrid(e.target.dataset.category);
        });
    });

    function createWallpaperCard(fileObj) {
        const div = document.createElement('div');
        div.className = 'wallpaper-card';
        
        const imageUrl = `/uploads/${fileObj.filename}`;
        
        div.innerHTML = `
            <img src="${imageUrl}" alt="Wallpaper" loading="lazy">
            <div class="card-overlay">
                <div class="card-actions">
                    <div>
                        <span style="color: white; font-size: 1.05rem; font-weight: 600; display: block; margin-bottom: 0.25rem;">${fileObj.name}</span>
                        <span style="color: var(--primary-color); font-size: 0.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px">${fileObj.category}</span>
                    </div>
                    <a href="${imageUrl}" download="${fileObj.filename}" class="download-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download
                    </a>
                </div>
            </div>
        `;
        
        div.addEventListener('click', (e) => {
            // Prevent opening modal if clicking the download button
            if (e.target.closest('.download-btn')) return;
            
            fullImage.src = imageUrl;
            fullImage.alt = fileObj.name;
            imageModal.classList.remove('hidden');
        });
        
        return div;
    }

    // -- Toast Notification --
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

        toast.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger reflow for animation
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
