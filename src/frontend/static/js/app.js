document.addEventListener('DOMContentLoaded', () => {
    const episodeList = document.getElementById('episode-list');
    const postContent = document.getElementById('post-content');
    const searchInput = document.getElementById('search-input');
    const prevPost = document.getElementById('prev-post');
    const nextPost = document.getElementById('next-post');

    let pages = [];
    let currentPageIndex = 0;

    // Fetch pages
    async function fetchPages() {
        const response = await fetch('/pages', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('readToken') || 'read-token-123'}` }
        });
        if (response.ok) {
            pages = await response.json();
            renderSidebar();
            loadPage(pages[currentPageIndex].id);
        }
    }

    // Render sidebar with categories
    function renderSidebar() {
        const categories = [...new Set(pages.map(p => p.category))];
        episodeList.innerHTML = categories.map(cat => `
            <li class="mt-2">
                <span class="text-green-400">${cat}</span>
                <ul class="ml-4">
                    ${pages.filter(p => p.category === cat).map(p => `
                        <li class="hover:text-green-400 cursor-pointer" data-id="${p.id}">${p.title}</li>
                    `).join('')}
                </ul>
            </li>
        `).join('');

        episodeList.querySelectorAll('li[data-id]').forEach(item => {
            item.addEventListener('click', () => loadPage(item.dataset.id));
        });
    }

    // Load and render page
    async function loadPage(id) {
        const response = await fetch(`/page/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('readToken') || 'read-token-123'}` }
        });
        if (response.ok) {
            const page = await response.json();
            postContent.innerHTML = `
                <h1 class="text-2xl font-bold">${page.title}</h1>
                <p class="text-gray-400">By ${page.author} on ${page.date}</p>
                <div>${page.content}</div>
                <img data-src="/static/media/placeholder.jpg" class="lazy w-full h-64 object-cover my-4">
                <video controls class="w-full my-4" data-src="/static/media/placeholder.mp4"></video>
            `;
            lazyLoadMedia();
            updateNavigation(id);
        }
    }

    // Lazy load images and videos
    function lazyLoadMedia() {
        const lazyImages = document.querySelectorAll('img.lazy');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    obs.unobserve(img);
                }
            });
        });
        lazyImages.forEach(img => observer.observe(img));
    }

    // Update prev/next navigation
    function updateNavigation(id) {
        currentPageIndex = pages.findIndex(p => p.id === id);
        prevPost.style.display = currentPageIndex > 0 ? 'block' : 'none';
        nextPost.style.display = currentPageIndex < pages.length - 1 ? 'block' : 'none';
        if (currentPageIndex > 0) prevPost.href = `#${pages[currentPageIndex - 1].id}`;
        if (currentPageIndex < pages.length - 1) nextPost.href = `#${pages[currentPageIndex + 1].id}`;
    }

    // Client-side search
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filtered = pages.filter(p => p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
        episodeList.innerHTML = filtered.map(p => `
            <li class="hover:text-green-400 cursor-pointer" data-id="${p.id}">${p.title}</li>
        `).join('');
        episodeList.querySelectorAll('li[data-id]').forEach(item => {
            item.addEventListener('click', () => loadPage(item.dataset.id));
        });
    });

    fetchPages();
});