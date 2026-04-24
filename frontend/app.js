const BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://sticky-notes-bbw6.onrender.com';

const API_URL = `${BASE_URL}/api/notes`;
const AUTH_URL = `${BASE_URL}/api/auth`;

// DOM Elements - Auth
const authOverlay = document.getElementById('authOverlay');
const mainApp = document.getElementById('mainApp');
const loginTabBtn = document.getElementById('loginTabBtn');
const registerTabBtn = document.getElementById('registerTabBtn');
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const purposeInput = document.getElementById('purposeInput');
const purposeGroup = document.getElementById('purposeGroup');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authError = document.getElementById('authError');
const logoutBtn = document.getElementById('logoutBtn');

// DOM Elements - Main App
const notesGrid = document.getElementById('notesGrid');
const pinnedNotesGrid = document.getElementById('pinnedNotesGrid');
const pinnedTitle = document.getElementById('pinnedTitle');
const othersTitle = document.getElementById('othersTitle');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const modal = document.getElementById('noteModal');
const addNoteBtn = document.getElementById('addNoteBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const noteForm = document.getElementById('noteForm');
const modalTitle = document.getElementById('modalTitle');

const titleInput = document.getElementById('titleInput');
const descInput = document.getElementById('descInput');
const noteIdInput = document.getElementById('noteId');
const dueDateInput = document.getElementById('dueDateInput');
const searchInput = document.getElementById('searchInput');

const sortSelect = document.getElementById('sortSelect');
const colorFilter = document.getElementById('colorFilter');
const boardTabs = document.querySelectorAll('.board-tab');

const toast = document.getElementById('toast');

// State
let notes = [];
let currentUserId = sessionStorage.getItem('userId');
let isLoginMode = true;
let currentBoard = 'Main';
let currentSort = 'newest';
let currentColorFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    if (currentUserId) {
        showMainApp();
        fetchNotes();
    } else {
        showAuthOverlay();
    }
}

// Event Listeners - Auth
loginTabBtn.addEventListener('click', () => setAuthMode(true));
registerTabBtn.addEventListener('click', () => setAuthMode(false));
authForm.addEventListener('submit', handleAuth);
logoutBtn.addEventListener('click', handleLogout);

// Event Listeners - Notes
addNoteBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
noteForm.addEventListener('submit', handleSaveNote);
searchInput.addEventListener('input', applyFiltersAndRender);
sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFiltersAndRender();
});
colorFilter.addEventListener('change', (e) => {
    currentColorFilter = e.target.value;
    applyFiltersAndRender();
});
boardTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        boardTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentBoard = e.target.dataset.board;
        applyFiltersAndRender();
    });
});

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
});

// --- Auth Functions ---
function setAuthMode(isLogin) {
    isLoginMode = isLogin;
    if (isLogin) {
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');
        authSubmitBtn.textContent = 'Login';
        purposeGroup.classList.add('hidden');
        purposeInput.removeAttribute('required');
    } else {
        loginTabBtn.classList.remove('active');
        registerTabBtn.classList.add('active');
        authSubmitBtn.textContent = 'Register';
        purposeGroup.classList.remove('hidden');
        purposeInput.setAttribute('required', 'true');
    }
    authError.classList.add('hidden');
}

function showAuthOverlay() {
    authOverlay.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    authOverlay.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

async function handleAuth(e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const purpose = purposeInput.value;
    const endpoint = isLoginMode ? '/login' : '/register';

    const payload = { email, password };
    if (!isLoginMode) payload.purpose = purpose;

    try {
        const response = await fetch(`${AUTH_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUserId = data._id;
            sessionStorage.setItem('userId', currentUserId);
            showMainApp();
            fetchNotes();
            authForm.reset();
            authError.classList.add('hidden');
        } else {
            authError.textContent = data.message || 'Authentication failed';
            authError.classList.remove('hidden');
        }
    } catch (error) {
        authError.textContent = 'Server error. Please try again later.';
        authError.classList.remove('hidden');
    }
}

function handleLogout() {
    currentUserId = null;
    sessionStorage.removeItem('userId');
    notes = [];
    showAuthOverlay();
}

// --- Fetch API Helper ---
async function fetchWithAuth(url, options = {}) {
    if (!currentUserId) return;
    const headers = {
        'Content-Type': 'application/json',
        'User-Id': currentUserId,
        ...options.headers
    };
    return fetch(url, { ...options, headers });
}

// --- Notes Functions ---
async function fetchNotes() {
    try {
        const response = await fetchWithAuth(API_URL);
        if (response && response.ok) {
            notes = await response.json();
            applyFiltersAndRender();
        } else if (response && response.status === 401) {
            handleLogout();
        }
    } catch (error) {
        showToast('Error fetching notes', true);
        console.error('Error fetching notes:', error);
    }
}

function applyFiltersAndRender() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm) || 
                              note.description.toLowerCase().includes(searchTerm);
        const matchesBoard = (note.board || 'Main') === currentBoard;
        const matchesColor = currentColorFilter === 'all' || note.color === currentColorFilter;
        return matchesSearch && matchesBoard && matchesColor;
    });

    if (currentSort === 'newest') {
        filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
        filteredNotes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    renderNotes(filteredNotes);
}

// Render Notes
function renderNotes(notesToRender) {
    notesGrid.innerHTML = '';
    pinnedNotesGrid.innerHTML = '';
    
    const pinnedNotes = notesToRender.filter(note => note.pinned);
    const unpinnedNotes = notesToRender.filter(note => !note.pinned);

    if (pinnedNotes.length > 0) {
        pinnedTitle.classList.remove('hidden');
        othersTitle.classList.remove('hidden');
        pinnedNotes.forEach(note => pinnedNotesGrid.appendChild(createNoteElement(note)));
    } else {
        pinnedTitle.classList.add('hidden');
        othersTitle.classList.add('hidden');
    }

    unpinnedNotes.forEach(note => notesGrid.appendChild(createNoteElement(note)));
}

// Create Note HTML Element
function createNoteElement(note) {
    const div = document.createElement('div');
    div.classList.add('note-card');
    div.style.backgroundColor = note.color;
    div.setAttribute('draggable', 'true');
    div.dataset.id = note._id;

    // Format date
    const date = new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
    
    let dueDateHtml = '';
    if (note.dueDate) {
        const due = new Date(note.dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        const isOverdue = due < today;
        const dueStr = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dueDateHtml = `<span class="due-date-badge ${isOverdue ? 'overdue' : ''}">Due: ${dueStr}</span>`;
    }

    div.innerHTML = `
        <button class="pin-btn ${note.pinned ? 'active' : ''}" onclick="togglePin('${note._id}', ${note.pinned})">
            <i class="fa-solid fa-thumbtack"></i>
        </button>
        <div class="note-header">
            <h3 class="note-title">${escapeHTML(note.title)}</h3>
        </div>
        <div class="note-body">
            <p class="note-desc">${escapeHTML(note.description)}</p>
        </div>
        <div class="note-footer">
            <div>
                ${dueDateHtml}
                <span class="date">${date}</span>
            </div>
            <div class="note-actions">
                <button class="action-btn" onclick="openEditModal('${note._id}')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteNote('${note._id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    // Drag and Drop Events
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);

    return div;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Modal Functions
function openAddModal() {
    modalTitle.textContent = 'Add New Note';
    noteForm.reset();
    noteIdInput.value = '';
    dueDateInput.value = '';
    document.getElementById('color1').checked = true;
    modal.classList.add('active');
}

function openEditModal(id) {
    const note = notes.find(n => n._id === id);
    if (!note) return;

    modalTitle.textContent = 'Edit Note';
    noteIdInput.value = note._id;
    titleInput.value = note.title;
    descInput.value = note.description;
    
    if (note.dueDate) {
        dueDateInput.value = new Date(note.dueDate).toISOString().split('T')[0];
    } else {
        dueDateInput.value = '';
    }
    
    const colorRadio = document.querySelector(`input[name="color"][value="${note.color}"]`);
    if (colorRadio) colorRadio.checked = true;
    else document.getElementById('color6').checked = true;

    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

// Save Note (Create or Update)
async function handleSaveNote(e) {
    e.preventDefault();

    const id = noteIdInput.value;
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const dueDate = dueDateInput.value;
    const color = document.querySelector('input[name="color"]:checked').value;

    const noteData = { title, description, color, board: currentBoard };
    noteData.dueDate = dueDate ? dueDate : null;

    try {
        if (id) {
            const res = await fetchWithAuth(`${API_URL}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(noteData)
            });
            if (res && res.ok) showToast('Note updated successfully');
        } else {
            const res = await fetchWithAuth(API_URL, {
                method: 'POST',
                body: JSON.stringify(noteData)
            });
            if (res && res.ok) showToast('Note created successfully');
        }
        closeModal();
        fetchNotes();
    } catch (error) {
        console.error('Error saving note:', error);
        showToast('Error saving note', true);
    }
}

// Delete Note
async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        const res = await fetchWithAuth(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res && res.ok) {
            showToast('Note deleted');
            fetchNotes();
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showToast('Error deleting note', true);
    }
}

// Toggle Pin
async function togglePin(id, currentPinnedStatus) {
    try {
        const res = await fetchWithAuth(`${API_URL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ pinned: !currentPinnedStatus })
        });
        if (res && res.ok) fetchNotes();
    } catch (error) {
        console.error('Error updating pin status:', error);
    }
}

// Toast Notification
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ef4444' : '#333';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Drag and Drop implementation
let draggedNoteId = null;

function handleDragStart(e) {
    draggedNoteId = this.dataset.id;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

[notesGrid, pinnedNotesGrid].forEach(grid => {
    grid.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;

        const afterElement = getDragAfterElement(grid, e.clientY);
        if (afterElement == null) {
            grid.appendChild(draggable);
        } else {
            grid.insertBefore(draggable, afterElement);
        }
    });

    grid.addEventListener('drop', e => {
        e.preventDefault();
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;

        const isPinnedGrid = grid === pinnedNotesGrid;
        const noteId = draggable.dataset.id;
        const note = notes.find(n => n._id === noteId);

        if (note && note.pinned !== isPinnedGrid) {
            togglePin(noteId, note.pinned);
        }
    });
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.note-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
