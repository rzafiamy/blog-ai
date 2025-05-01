document.addEventListener('DOMContentLoaded', () => {
    const categoryGrid = document.getElementById('category-grid');
    const searchInput = document.getElementById('search-input');
    const categoryButtons = document.getElementById('category-buttons');
    const prevPost = document.getElementById('prev-post');
    const nextPost = document.getElementById('next-post');
  
    let pages = [];
    let currentPageIndex = 0;
    let activeCategory = null;
  
    async function fetchPages() {
      const response = await fetch('/pages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('readToken') || 'read-token-123'}` }
      });
      if (response.ok) {
        pages = await response.json();
        renderCategoryButtons();
        renderCategoryGrid();
      }
    }
  
    function renderCategoryButtons() {
      const categories = [...new Set(pages.map(p => p.category))];
      categoryButtons.innerHTML = `<button data-category="all" class="px-4 py-2 rounded bg-futuristic text-white text-sm font-medium hover:opacity-90">All</button>` +
        categories.map(cat =>
          `<button data-category="${cat}" class="px-4 py-2 rounded bg-gray-200 text-gray-700 text-sm font-medium hover:bg-futuristic hover:text-white">${cat}</button>`
        ).join('');
  
      categoryButtons.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          activeCategory = btn.dataset.category === 'all' ? null : btn.dataset.category;
          renderCategoryGrid();
        });
      });
    }
  
    function renderCategoryGrid() {
      const displayPages = activeCategory
        ? pages.filter(p => p.category === activeCategory)
        : pages;
  
      const categories = activeCategory
        ? [activeCategory]
        : [...new Set(displayPages.map(p => p.category))];
  
      categoryGrid.innerHTML = categories.map(category => {
        const catPages = displayPages.filter(p => p.category === category);
        return `
          <section class="mb-10">
            <h2 class="text-2xl font-bold text-futuristic mb-4">${category}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${catPages.map(p => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:scale-[1.02] transition">
                  <img src="https://placehold.co/400x200?text=${encodeURIComponent(p.title)}" alt="${p.title}" class="w-full h-40 object-cover">
                  <div class="p-4">
                    <h3 class="text-xl font-semibold text-futuristic mb-1">${p.title}</h3>
                    <p class="text-sm text-gray-500">By ${p.author} on ${p.date}</p>
                    <button data-id="${p.id}" class="mt-3 bg-futuristic text-white px-4 py-1 rounded text-sm font-bold hover:opacity-90">Read More</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        `;
      }).join('');
  
      document.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', () => loadPage(btn.dataset.id));
      });
    }
  
    async function loadPage(id) {
      const response = await fetch(`/page/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('readToken') || 'read-token-123'}` }
      });
      if (response.ok) {
        const page = await response.json();
        categoryGrid.innerHTML = `
          <article class="prose max-w-full">
            <h1>${page.title}</h1>
            <p class="text-gray-500">By ${page.author} on ${page.date}</p>
            <div>${page.content}</div>
            <img data-src="https://placehold.co/400" class="lazy w-full h-64 object-cover my-4">
            <video controls class="w-full my-4" data-src="/static/media/placeholder.mp4"></video>
          </article>
        `;
        lazyLoadMedia();
        updateNavigation(id);
      }
    }
  
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
  
    function updateNavigation(id) {
      currentPageIndex = pages.findIndex(p => p.id === id);
      prevPost.style.display = currentPageIndex > 0 ? 'block' : 'none';
      nextPost.style.display = currentPageIndex < pages.length - 1 ? 'block' : 'none';
      if (currentPageIndex > 0) prevPost.href = `#${pages[currentPageIndex - 1].id}`;
      if (currentPageIndex < pages.length - 1) nextPost.href = `#${pages[currentPageIndex + 1].id}`;
    }
  
    function levenshtein(a, b) {
      const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          matrix[i][j] = b[i - 1] === a[j - 1]
            ? matrix[i - 1][j - 1]
            : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
      return matrix[b.length][a.length];
    }
  
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const threshold = 5;
  
      const filtered = pages.filter(p =>
        levenshtein(query, p.title.toLowerCase()) <= threshold ||
        p.category.toLowerCase().includes(query)
      );
  
      activeCategory = null;
  
      const categories = [...new Set(filtered.map(p => p.category))];
      categoryGrid.innerHTML = categories.map(category => {
        const catPages = filtered.filter(p => p.category === category);
        return `
          <section class="mb-10">
            <h2 class="text-2xl font-bold text-futuristic mb-4">${category}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${catPages.map(p => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:scale-[1.02] transition">
                  <img src="https://placehold.co/400x200?text=${encodeURIComponent(p.title)}" class="w-full h-40 object-cover">
                  <div class="p-4">
                    <h3 class="text-xl font-semibold text-futuristic mb-1">${p.title}</h3>
                    <p class="text-sm text-gray-500">By ${p.author} on ${p.date}</p>
                    <button data-id="${p.id}" class="mt-3 bg-futuristic text-white px-4 py-1 rounded text-sm font-bold hover:opacity-90">Read More</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        `;
      }).join('');
  
      document.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', () => loadPage(btn.dataset.id));
      });
    });
  
    fetchPages();
  });
  