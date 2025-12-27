const SUPABASE_URL = 'https://ahspzqqgqxjtmnzhhtja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-ZQXB2uJNzINYjy_RSO1MQ_l1ea6rt3';

// DOM Elements
const loadingEl = document.getElementById('loading');
const contentGridEl = document.getElementById('contentGrid');
const emptyEl = document.getElementById('empty');
const dashboardViewEl = document.getElementById('dashboardView');
const topNav = document.getElementById('topNav');
const navLinks = document.getElementById('navLinks');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const themeToggle = document.getElementById('themeToggle');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

// State
let allContent = [];
let currentView = 'dashboard';
let currentTheme = localStorage.getItem('theme') || 'dark';

// Page titles and subtitles
const pageInfo = {
    dashboard: { title: 'Dashboard', subtitle: 'Welcome back! Here\'s an overview of your content.' },
    all: { title: 'All Content', subtitle: 'Browse and manage all your published content.' },
    home: { title: 'Home', subtitle: 'Content for your home section.' },
    about: { title: 'About', subtitle: 'About section content and information.' },
    contact: { title: 'Contact', subtitle: 'Contact information and forms.' }
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupTheme();
    setupNavigation();
    setupMobileMenu();
    setupScrollEffects();
    await loadContent();
    updateStats();
    showDashboard();
    animateStatsOnLoad();
}

// Scroll Effects
function setupScrollEffects() {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 50) {
            topNav.classList.add('scrolled');
        } else {
            topNav.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// Animate stats on load
function animateStatsOnLoad() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${0.1 + index * 0.1}s`;
    });
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
    
    // Add rotation animation
    themeToggle.style.transform = 'scale(1.1) rotate(360deg)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 300);
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
            
            // Update active nav item with animation
            navItems.forEach(nav => {
                nav.classList.remove('active');
            });
            item.classList.add('active');
            
            // Update page title and subtitle with animation
            updatePageHeader(section);
            
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

function updatePageHeader(section) {
    const info = pageInfo[section] || pageInfo.dashboard;
    
    // Animate out
    pageTitle.style.opacity = '0';
    pageTitle.style.transform = 'translateY(-10px)';
    pageSubtitle.style.opacity = '0';
    
    setTimeout(() => {
        pageTitle.textContent = info.title;
        pageSubtitle.textContent = info.subtitle;
        
        // Animate in
        pageTitle.style.opacity = '1';
        pageTitle.style.transform = 'translateY(0)';
        pageSubtitle.style.opacity = '1';
    }, 200);
    
    // Add transition styles
    pageTitle.style.transition = 'all 0.3s ease';
    pageSubtitle.style.transition = 'all 0.3s ease 0.1s';
}

function setupMobileMenu() {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
}

function toggleMobileMenu() {
    navLinks.classList.toggle('open');
    const icon = mobileMenuBtn.querySelector('i');
    
    if (navLinks.classList.contains('open')) {
        icon.className = 'fas fa-times';
        mobileMenuBtn.style.transform = 'rotate(90deg)';
    } else {
        icon.className = 'fas fa-bars';
        mobileMenuBtn.style.transform = 'rotate(0deg)';
    }
}

function closeMobileMenu() {
    navLinks.classList.remove('open');
    const icon = mobileMenuBtn.querySelector('i');
    icon.className = 'fas fa-bars';
    mobileMenuBtn.style.transform = 'rotate(0deg)';
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
            statusText.textContent = 'Error';
            break;
    }
}

// Stats with Animation
function updateStats() {
    const total = allContent.length;
    const published = allContent.filter(item => item.status === 'published').length;
    const draft = allContent.filter(item => item.status === 'draft').length;
    
    animateCounter('totalCount', total);
    animateCounter('publishedCount', published);
    animateCounter('draftCount', draft);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue;
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Dashboard View
function showDashboard() {
    hideAllViews();
    dashboardViewEl.style.display = 'block';
    
    // Animate dashboard cards
    const cards = dashboardViewEl.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
    
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
    
    recentActivity.innerHTML = recentItems.map((item, index) => `
        <div class="activity-item" style="animation: fadeInUp 0.4s ease ${index * 0.1}s backwards;">
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
            const card = createContentCard(content, index);
            contentGridEl.appendChild(card);
        }, index * 80);
    });
}

function createContentCard(content, index) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.style.animationDelay = `${index * 0.08}s`;

    const hasImage = content.image_url && content.image_url.trim() !== '';
    
    const imageHtml = hasImage 
        ? `<div class="content-image-container">
             <img src="${content.image_url}" alt="${content.title || 'Content image'}" class="content-image" 
                  onerror="this.parentElement.remove();" 
                  onload="this.style.opacity='1';" 
                  style="opacity: 0; transition: opacity 0.5s ease;">
           </div>`
        : '';

    card.innerHTML = `
        ${imageHtml}
        <div class="content-body ${!hasImage ? 'no-image' : ''}">
            <h2 class="content-title">${content.title || 'Untitled'}</h2>
            <p class="content-description">${content.description || 'No description available.'}</p>
        </div>
    `;

    // Add hover sound effect (optional visual feedback)
    card.addEventListener('mouseenter', () => {
        card.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.zIndex = '';
    });

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

// Intersection Observer for scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.content-card, .stat-card, .dashboard-card').forEach(el => {
        observer.observe(el);
    });
}

// Initialize scroll animations after content loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupScrollAnimations, 500);
});