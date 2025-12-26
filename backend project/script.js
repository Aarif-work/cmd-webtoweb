const SUPABASE_URL = 'https://ahspzqqgqxjtmnzhhtja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-ZQXB2uJNzINYjy_RSO1MQ_l1ea6rt3';

// DOM Elements
const loadingEl = document.getElementById('loading');
const contentGridEl = document.getElementById('contentGrid');
const emptyEl = document.getElementById('empty');
const dashboardViewEl = document.getElementById('dashboardView');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const themeToggle = document.getElementById('themeToggle');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// State
let allContent = [];
let currentView = 'dashboard';
let currentTheme = localStorage.getItem('theme') || 'dark';

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupTheme();
    setupNavigation();
    setupMobileMenu();
    await loadContent();
    updateStats();
    showDashboard();
}

// Theme Management
function setupTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    
    themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update page title
            const pageTitle = document.querySelector('.page-title');
            const icon = item.querySelector('i').className;
            const text = item.querySelector('span').textContent;
            pageTitle.innerHTML = `<i class="${icon}"></i> ${text}`;
            
            // Show appropriate view
            if (section === 'dashboard') {
                showDashboard();
            } else {
                showContentGrid(section);
            }
            
            currentView = section;
            
            // Close mobile menu
            closeMobileMenu();
        });
    });
}

function setupMobileMenu() {
    mobileMenuBtn.addEventListener('click', openMobileMenu);
    sidebarToggle.addEventListener('click', closeMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
}

function openMobileMenu() {
    sidebar.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

// Data Loading
async function loadContent() {
    try {
        updateConnectionStatus('connecting');
        
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/content_blocks_new?select=*&order=order_index.asc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allContent = await response.json();
        updateConnectionStatus('connected');
        
    } catch (error) {
        console.error('Error fetching content:', error);
        updateConnectionStatus('error');
        throw error;
    }
}

function updateConnectionStatus(status) {
    statusDot.className = `status-dot ${status}`;
    
    switch (status) {
        case 'connecting':
            statusText.textContent = 'Connecting...';
            break;
        case 'connected':
            statusText.textContent = 'Connected';
            break;
        case 'error':
            statusText.textContent = 'Connection Error';
            break;
    }
}

// Stats
function updateStats() {
    const total = allContent.length;
    const published = allContent.filter(item => item.status === 'published').length;
    const draft = allContent.filter(item => item.status === 'draft').length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('publishedCount').textContent = published;
    document.getElementById('draftCount').textContent = draft;
}

// Dashboard View
function showDashboard() {
    hideAllViews();
    dashboardViewEl.style.display = 'block';
    populateRecentActivity();
}

function populateRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    const recentItems = allContent
        .filter(item => item.updated_at || item.created_at)
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 5);
    
    if (recentItems.length === 0) {
        recentActivity.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No recent activity</p>';
        return;
    }
    
    recentActivity.innerHTML = recentItems.map(item => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${item.status === 'published' ? 'fa-check' : 'fa-edit'}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${item.title || 'Untitled'}</div>
                <div class="activity-time">${formatDate(item.updated_at || item.created_at)}</div>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

// Content Grid View
function showContentGrid(section) {
    hideAllViews();
    contentGridEl.style.display = 'grid';
    
    const filteredContent = filterContent(section);
    displayContent(filteredContent);
}

function filterContent(section) {
    if (section === 'all') {
        return allContent.filter(item => item.status === 'published');
    }
    return allContent.filter(item => 
        item.section === section && item.status === 'published'
    );
}

function displayContent(contentItems) {
    loadingEl.style.display = 'none';
    contentGridEl.innerHTML = '';
    
    if (contentItems.length === 0) {
        emptyEl.style.display = 'block';
        contentGridEl.style.display = 'none';
        return;
    }

    emptyEl.style.display = 'none';
    contentGridEl.style.display = 'grid';
    
    contentItems.forEach((content, index) => {
        setTimeout(() => {
            const card = createContentCard(content);
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            contentGridEl.appendChild(card);
            
            requestAnimationFrame(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        }, index * 100);
    });
}

function createContentCard(content) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.style.animationDelay = `${Math.random() * 0.3}s`;

    const hasImage = content.image_url && content.image_url.trim() !== '';
    
    const imageHtml = hasImage 
        ? `<div class="content-image-container">
             <img src="${content.image_url}" alt="${content.title || 'Content image'}" class="content-image" 
                  onerror="this.parentElement.remove();" 
                  onload="this.style.opacity='1';" 
                  style="opacity: 0; transition: opacity 0.3s ease;">
           </div>`
        : '';

    card.innerHTML = `
        ${imageHtml}
        <div class="content-body ${!hasImage ? 'no-image' : ''}">
            <h2 class="content-title">${content.title || 'Untitled'}</h2>
            <p class="content-description">${content.description || 'No description available.'}</p>
        </div>
    `;

    return card;
}

function hideAllViews() {
    loadingEl.style.display = 'none';
    dashboardViewEl.style.display = 'none';
    contentGridEl.style.display = 'none';
    emptyEl.style.display = 'none';
}

function showError() {
    hideAllViews();
    emptyEl.style.display = 'block';
    emptyEl.innerHTML = `
        <div class="empty-icon">⚠️</div>
        <h3>Connection Error</h3>
        <p>Unable to load content. Please check your connection and try again.</p>
    `;
}