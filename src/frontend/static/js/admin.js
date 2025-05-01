document.addEventListener('DOMContentLoaded', () => {
    const adminBtn = document.getElementById('admin-btn');
    const adminModal = document.getElementById('admin-modal');
    const closeModal = document.getElementById('close-modal');
    const loginForm = document.getElementById('auth-form');
    const loginError = document.getElementById('login-error');
    const loginSection = document.getElementById('login-form');
    const adminPanel = document.getElementById('admin-panel');
    const postForm = document.getElementById('post-form');
    const postList = document.getElementById('post-list');
    let editingPageId = null;
  
    // Open modal on Admin button click
    adminBtn.addEventListener('click', () => {
      adminModal.classList.remove('hidden');
      if (localStorage.getItem('editToken')) {
        showAdminPanel();
      } else {
        showLoginForm();
      }
    });
  
    // Close modal
    closeModal.addEventListener('click', () => {
      adminModal.classList.add('hidden');
      resetForms();
    });
  
    // Close modal on outside click
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        adminModal.classList.add('hidden');
        resetForms();
      }
    });
  
    // Show login form
    function showLoginForm() {
      loginSection.classList.remove('hidden');
      adminPanel.classList.add('hidden');
      loginError.classList.add('hidden');
    }
  
    // Show admin panel
    function showAdminPanel() {
      loginSection.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      fetchPosts();
    }
  
    // Reset forms and state
    function resetForms() {
      loginSection.querySelector('#auth-form').reset();
      postForm.reset();
      loginError.classList.add('hidden');
      editingPageId = null;
      postForm.querySelector('button[type="submit"]').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Save Page
      `;
    }
  
    // Handle login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
  
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
          loginError.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Login error:', error);
        loginError.classList.remove('hidden');
      }
    });
  
    // Fetch and display posts
    async function fetchPosts() {
      try {
        const response = await fetch('/pages', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('editToken')}` },
        });
        if (response.ok) {
          const posts = await response.json();
          postList.innerHTML = posts
            .map(
              (p) => `
            <div class="p-4 bg-white rounded-lg shadow-md flex justify-between items-center">
              <h3 class="text-lemur-green font-medium">${p.title}</h3>
              <div class="space-x-2">
                <button data-id="${p.id}" class="edit-btn text-lemur-green hover:text-accent-green">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 inline-block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button data-id="${p.id}" class="delete-btn text-red-500 hover:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 inline-block">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          `
            )
            .join('');
          addEventListeners();
        } else {
          console.error('Failed to fetch posts');
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    }
  
    // Form submission (Add/Edit)
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        category: document.getElementById('category').value,
        section: document.getElementById('section').value,
        content: document.getElementById('content').value,
        date: editingPageId ? new Date().toISOString().split('T')[0] : undefined,
      };
  
      try {
        const url = editingPageId ? `/page/${editingPageId}` : '/page';
        const method = editingPageId ? 'PUT' : 'POST';
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('editToken')}`,
          },
          body: JSON.stringify(data),
        });
  
        if (response.ok) {
          postForm.reset();
          editingPageId = null;
          postForm.querySelector('button[type="submit"]').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Save Page
          `;
          fetchPosts();
        } else {
          console.error('Failed to save page');
        }
      } catch (error) {
        console.error('Error saving page:', error);
      }
    });
  
    // Edit and delete buttons
    function addEventListeners() {
      document.querySelectorAll('.edit-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            const response = await fetch(`/page/${id}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('editToken')}` },
            });
            if (response.ok) {
              const page = await response.json();
              document.getElementById('title').value = page.title;
              document.getElementById('author').value = page.author;
              document.getElementById('category').value = page.id.split('/')[0];
              document.getElementById('section').value = page.id.split('/')[1];
              document.getElementById('content').value = page.content;
              editingPageId = id;
              postForm.querySelector('button[type="submit"]').innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Update Page
              `;
            }
          } catch (error) {
            console.error('Error loading page:', error);
          }
        });
      });
  
      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            const response = await fetch(`/page/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('editToken')}` },
            });
            if (response.ok) {
              fetchPosts();
            }
          } catch (error) {
            console.error('Error deleting page:', error);
          }
        });
      });
    }
  });