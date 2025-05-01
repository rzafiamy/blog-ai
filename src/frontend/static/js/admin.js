document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);

  const adminBtn = $('admin-btn');
  const adminModal = $('admin-modal');
  const closeModal = $('close-modal');
  const loginForm = $('auth-form');
  const loginError = $('login-error');
  const loginSection = $('login-form');
  const contentPanel = $('content-panel');
  const pageListSidebar = $('page-list-sidebar');
  const modalTitle = $('modal-title');
  const addNewPageButton = $('add-new-page');
  const postForm = $('post-form');
  let editingPageId = null;

  adminBtn?.addEventListener('click', () => {
    adminModal?.classList.remove('hidden');
    if (localStorage.getItem('editToken')) {
      showAdminPanel();
    } else {
      showLoginForm();
    }
  });

  closeModal?.addEventListener('click', () => {
    adminModal?.classList.add('hidden');
    resetForms();
  });

  adminModal?.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      adminModal.classList.add('hidden');
      resetForms();
    }
  });

  function showLoginForm() {
    loginSection?.classList.remove('hidden');
    contentPanel?.classList.add('hidden');
    loginError?.classList.add('hidden');
  }

  function showAdminPanel() {
    loginSection?.classList.add('hidden');
    contentPanel?.classList.remove('hidden');
    if (modalTitle) modalTitle.textContent = 'Manage Pages';
    fetchPosts();
  }

  function resetForms() {
    loginForm?.reset();
    postForm?.reset();
    loginError?.classList.add('hidden');
    editingPageId = null;
    if (modalTitle) modalTitle.textContent = 'Add New Page';
    const submitBtn = postForm?.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = getSaveButtonHTML();
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('username')?.value;
    const password = $('password')?.value;

    if (!username || !password) {
      console.warn('Missing username or password');
      return;
    }

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('editToken', data.token);
        showAdminPanel();
      } else {
        console.error('Login failed:', await response.text());
        loginError?.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Login error:', error);
      loginError?.classList.remove('hidden');
    }
  });

  async function fetchPosts() {
    try {
      const token = localStorage.getItem('editToken');
      if (!token) return console.warn('Missing token');

      const response = await fetch('/pages', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!pageListSidebar) return;

      if (response.ok) {
        const posts = await response.json();

        if (Array.isArray(posts) && posts.length > 0) {
          pageListSidebar.innerHTML = posts.map(renderPostItem).join('');
        } else {
          pageListSidebar.innerHTML = `<p class="text-gray-500 text-sm">No pages found.</p>`;
        }

        addEventListeners();
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch posts:', errorText);
        pageListSidebar.innerHTML = `<p class="text-red-500 text-sm">Failed to load pages. Check console.</p>`;
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (pageListSidebar)
        pageListSidebar.innerHTML = `<p class="text-red-500 text-sm">Error fetching pages.</p>`;
    }
  }

  function renderPostItem(p) {
    return `
      <div class="flex justify-between items-center p-2 rounded-md hover:bg-gray-100">
        <button class="edit-btn text-lemur-green hover:text-accent-green text-left w-full" data-id="${p.id}">
          ${p.title}
        </button>
        <button data-id="${p.id}" class="delete-btn text-red-500 hover:text-red-600">
          <i class="fas fa-trash w-5 h-5"></i>
        </button>
      </div>
    `;
  }

  addNewPageButton?.addEventListener('click', () => {
    resetForms();
    if (modalTitle) modalTitle.textContent = 'Add New Page';
  });

  postForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      title: $('title')?.value,
      author: $('author')?.value,
      category: $('category')?.value,
      section: $('section')?.value,
      content: $('content')?.value,
      date: editingPageId ? new Date().toISOString().split('T')[0] : undefined,
    };

    const token = localStorage.getItem('editToken');
    const url = editingPageId ? `/page/${editingPageId}` : '/page';
    const method = editingPageId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        postForm?.reset();
        editingPageId = null;
        if (modalTitle) modalTitle.textContent = 'Add New Page';
        const submitBtn = postForm?.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = getSaveButtonHTML();
        fetchPosts();
      } else {
        console.error('Failed to save page:', await response.text());
      }
    } catch (error) {
      console.error('Error saving page:', error);
    }
  });

  function addEventListeners() {
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const response = await fetch(`/page/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('editToken')}` },
          });
          if (response.ok) {
            const page = await response.json();
            $('title').value = page.title;
            $('author').value = page.author;
            $('category').value = page.id.split('/')[0];
            $('section').value = page.id.split('/')[1];
            $('content').value = page.content;
            editingPageId = id;
            if (modalTitle) modalTitle.textContent = 'Edit Page';
            const submitBtn = postForm?.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = getUpdateButtonHTML();
          } else {
            console.error('Failed to load page:', await response.text());
          }
        } catch (error) {
          console.error('Error loading page:', error);
        }
      });
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Are you sure you want to delete this page?')) {
          try {
            const response = await fetch(`/page/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${localStorage.getItem('editToken')}` },
            });
            if (response.ok) {
              fetchPosts();
            } else {
              console.error('Failed to delete page:', await response.text());
            }
          } catch (error) {
            console.error('Error deleting page:', error);
          }
        }
      });
    });
  }

  function getSaveButtonHTML() {
    return `
      <i class="fas fa-save w-5 h-5 mr-2"></i>
      Save Page
    `;
  }

  function getUpdateButtonHTML() {
    return `
      <i class="fas fa-pen w-5 h-5 mr-2"></i>
      Update Page
    `;
  }
});
