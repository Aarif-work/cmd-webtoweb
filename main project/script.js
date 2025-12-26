const SUPABASE_URL = 'https://ahspzqqgqxjtmnzhhtja.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-ZQXB2uJNzINYjy_RSO1MQ_l1ea6rt3';
const TABLE_NAME = 'content_blocks_new';
const STORAGE_BUCKET = 'my-storage';

const form = document.getElementById('content-form');
const contentList = document.getElementById('content-list');
const messageEl = document.getElementById('message');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');

const contentIdInput = document.getElementById('content-id');
const sectionInput = document.getElementById('section');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const imageFileInput = document.getElementById('image-file');
const imageUrlInput = document.getElementById('image-url');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const statusInput = document.getElementById('status');
const orderIndexInput = document.getElementById('order-index');

const fileLabelText = document.getElementById('file-label-text');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const uploadZone = document.getElementById('upload-zone');

const totalCount = document.getElementById('total-count');
const publishedCount = document.getElementById('published-count');
const draftCount = document.getElementById('draft-count');

let selectedFile = null;

function getHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

function getStorageHeaders(contentType) {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
    };
}

function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    setTimeout(() => messageEl.className = 'message hidden', 4000);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncateText(text, maxLength = 50) {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function updateStats(data) {
    totalCount.textContent = data.length;
    publishedCount.textContent = data.filter(i => i.status === 'published').length;
    draftCount.textContent = data.filter(i => i.status === 'draft').length;
}

function updateImagePreview() {
    const url = imageUrlInput.value.trim();
    if (url) {
        previewImg.src = url;
        previewImg.onload = () => imagePreview.classList.remove('hidden');
        previewImg.onerror = () => imagePreview.classList.add('hidden');
    } else {
        imagePreview.classList.add('hidden');
    }
}

function clearImagePreview() {
    imageUrlInput.value = '';
    imageFileInput.value = '';
    selectedFile = null;
    fileLabelText.textContent = 'PNG, JPG, GIF up to 10MB';
    imagePreview.classList.add('hidden');
    previewImg.src = '';
}

function showUploadProgress(show) {
    uploadProgress.classList.toggle('hidden', !show);
    if (show) {
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
    }
}

function updateProgressBar(percent) {
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
}

async function uploadImageToStorage(file, section) {
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${section || 'general'}/${timestamp}-${sanitizedFilename}`;

    showUploadProgress(true);
    updateProgressBar(30);

    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`, {
            method: 'POST',
            headers: getStorageHeaders(file.type),
            body: file
        });

        updateProgressBar(70);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Upload failed');
        }

        updateProgressBar(100);
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;
        setTimeout(() => showUploadProgress(false), 500);
        return publicUrl;
    } catch (error) {
        showUploadProgress(false);
        throw error;
    }
}

function setEditMode(editing) {
    formTitle.textContent = editing ? 'Edit Content' : 'Create New Content';
}

async function fetchContent() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=order_index.asc`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        renderContent(data);
        updateStats(data);
    } catch (error) {
        console.error('Error fetching content:', error);
        showMessage('Failed to fetch content. Please try again.', 'error');
        contentList.innerHTML = '<tr><td colspan="9" class="empty-state">❌ Error loading content</td></tr>';
    }
}

function renderContent(data) {
    if (!data || data.length === 0) {
        contentList.innerHTML = '<tr><td colspan="9" class="empty-state">📭 No content found. Create your first entry above.</td></tr>';
        return;
    }

    contentList.innerHTML = data.map(item => `
        <tr>
            <td class="id-cell">#${item.id}</td>
            <td>${item.image_url
            ? `<img src="${item.image_url}" alt="${item.title || 'Image'}" class="table-thumb" onerror="this.outerHTML='<div class=\\'no-image\\'>Error</div>'">`
            : '<div class="no-image">No img</div>'}</td>
            <td><span class="section-tag">${item.section || '-'}</span></td>
            <td class="title-cell" title="${item.title || ''}">${truncateText(item.title, 20)}</td>
            <td class="desc-cell" title="${item.description || ''}">${truncateText(item.description, 30)}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            <td class="order-cell">${item.order_index ?? '-'}</td>
            <td class="date-cell">${formatDate(item.updated_at || item.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editContent(${item.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteContent(${item.id})" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function createContent(contentData) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(contentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create content');
        }

        showMessage('Content created successfully!', 'success');
        resetForm();
        fetchContent();
    } catch (error) {
        console.error('Error creating content:', error);
        showMessage(`Failed to create content: ${error.message}`, 'error');
    }
}

async function updateContent(id, contentData) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(contentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update content');
        }

        showMessage('Content updated successfully!', 'success');
        resetForm();
        fetchContent();
    } catch (error) {
        console.error('Error updating content:', error);
        showMessage(`Failed to update content: ${error.message}`, 'error');
    }
}

async function deleteContent(id) {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete content');
        }

        showMessage('Content deleted successfully!', 'success');
        fetchContent();
    } catch (error) {
        console.error('Error deleting content:', error);
        showMessage(`Failed to delete content: ${error.message}`, 'error');
    }
}

async function editContent(id) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}&select=*`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch content for editing');

        const data = await response.json();

        if (data && data.length > 0) {
            const item = data[0];
            contentIdInput.value = item.id;
            sectionInput.value = item.section || '';
            titleInput.value = item.title || '';
            descriptionInput.value = item.description || '';
            imageUrlInput.value = item.image_url || '';
            statusInput.value = item.status || 'draft';
            orderIndexInput.value = item.order_index ?? 0;

            selectedFile = null;
            imageFileInput.value = '';
            fileLabelText.textContent = 'PNG, JPG, GIF up to 10MB';

            updateImagePreview();
            setEditMode(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            showMessage('Content loaded for editing.', 'success');
        }
    } catch (error) {
        console.error('Error loading content:', error);
        showMessage('Failed to load content for editing.', 'error');
    }
}

function resetForm() {
    form.reset();
    contentIdInput.value = '';
    orderIndexInput.value = '0';
    selectedFile = null;
    fileLabelText.textContent = 'PNG, JPG, GIF up to 10MB';
    clearImagePreview();
    setEditMode(false);
}

// Event Listeners
imageFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showMessage('Please select an image file.', 'error');
            imageFileInput.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showMessage('File size must be less than 10MB.', 'error');
            imageFileInput.value = '';
            return;
        }

        selectedFile = file;
        fileLabelText.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        imageFileInput.files = e.dataTransfer.files;
        imageFileInput.dispatchEvent(new Event('change'));
    }
});

imageUrlInput.addEventListener('input', () => {
    if (imageUrlInput.value.trim()) {
        selectedFile = null;
        imageFileInput.value = '';
        fileLabelText.textContent = 'PNG, JPG, GIF up to 10MB';
    }
    updateImagePreview();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let imageUrl = imageUrlInput.value.trim() || null;

    if (selectedFile) {
        try {
            submitBtn.disabled = true;
            imageUrl = await uploadImageToStorage(selectedFile, sectionInput.value || 'general');
            imageUrlInput.value = imageUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            showMessage(`Failed to upload image: ${error.message}`, 'error');
            submitBtn.disabled = false;
            return;
        }
        submitBtn.disabled = false;
    }

    const contentData = {
        section: sectionInput.value,
        title: titleInput.value,
        description: descriptionInput.value,
        image_url: imageUrl,
        status: statusInput.value,
        order_index: parseInt(orderIndexInput.value, 10) || 0
    };

    const id = contentIdInput.value;
    id ? await updateContent(id, contentData) : await createContent(contentData);
});

cancelBtn.addEventListener('click', () => {
    resetForm();
    showMessage('Form cleared.', 'success');
});

document.addEventListener('DOMContentLoaded', () => fetchContent());

window.editContent = editContent;
window.deleteContent = deleteContent;
window.clearImagePreview = clearImagePreview;
