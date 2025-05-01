document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('post-form');
    const postList = document.getElementById('post-list');

    // Fetch and display posts
    async function fetchPosts() {
        const response = await fetch('/pages', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('editToken') || 'edit-token-456'}` }
        });
        if (response.ok) {
            const posts = await response.json();
            postList.innerHTML = posts.map(p => `
                <div class="p-4 bg-gray-800 rounded mb-4">
                    <h3 class="text-green-400">${p.title}</h3>
                    <button data-id="${p.id}" class="edit-btn text-green-400">Edit</button>
                    <button data-id="${p.id}" class="delete-btn text-red-400">Delete</button>
                </div>
            `).join('');
            addEventListeners();
        }
    }

    // Form submission
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            category: document.getElementById('category').value,
            section: document.getElementById('section').value,
            content: document.getElementById('content').value
        };

        const response = await fetch('/page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('editToken') || 'edit-token-456'}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            postForm.reset();
            fetchPosts();
        }
    });

    // Edit and delete buttons
    function addEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const response = await fetch(`/page/${id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('editToken') || 'edit-token-456'}` }
                });
                if (response.ok) {
                    const page = await response.json();
                    document.getElementById('title').value = page.title;
                    document.getElementById('author').value = page.author;
                    document.getElementById('content').value = page.content;
                    // Simulate update by deleting and re-creating
                    postForm.onsubmit = async (e) => {
                        e.preventDefault();
                        await fetch(`/page/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('editToken') || 'edit-token-456'}` } });
                        postForm.dispatchEvent(new Event('submit'));
                    };
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                await fetch(`/page/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('editToken') || 'edit-token-456'}` }
                });
                fetchPosts();
            });
        });
    }

    fetchPosts();
});