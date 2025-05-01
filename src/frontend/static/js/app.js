document.addEventListener('DOMContentLoaded', () => {
    const categoryGrid = document.getElementById('category-grid');
    const searchInput = document.getElementById('search-input');
    const categoryButtons = document.getElementById('category-buttons');
    const prevPost = document.getElementById('prev-post');
    const nextPost = document.getElementById('next-post');
  
    let pages = [];
    let currentPageIndex = 0;
    let activeCategory = null;
  
    // Tag icon SVG for category buttons
    const tagIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 inline-block mr-2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    `;
  
    // Arrow right icon SVG for Read More buttons
    const arrowRightIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 inline-block ml-2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    `;
  
    async function fetchPages() {
      try {
        const response = await fetch('/pages', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('readToken') || 'read-token-123'}` },
        });
        if (response.ok) {
          pages = await response.json();
          renderCategoryButtons();
          renderCategoryGrid();
        } else {
          console.error('Failed to fetch pages');
        }
      } catch (error) {
        console.error('Error fetching pages:', error);
      }
    }
  
    function renderCategoryButtons() {
      const categories = [...new Set(pages.map((p) => p.category))];
      categoryButtons.innerHTML = `
        <button data-category="all" class="px-4 py-2 rounded-lg bg-lemur-green text-white text-sm font-medium hover:bg-accent-green transition flex items-center">${tagIcon}All</button>
        ${categories
          .map(
            (cat) => `
          <button data-category="${cat}" class="px-4 py-2 rounded-lg bg-gray-200 text-bamboo-dark text-sm font-medium hover:bg-lemur-green hover:text-white transition flex items-center">${tagIcon}${cat}</button>
        `
          )
          .join('')}
      `;
  
      categoryButtons.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeCategory = btn.dataset.category === 'all' ? null : btn.dataset.category;
          renderCategoryGrid();
        });
      });
    }
  
    function renderCategoryGrid() {
      const displayPages = activeCategory ? pages.filter((p) => p.category === activeCategory) : pages;
      const categories = activeCategory ? [activeCategory] : [...new Set(displayPages.map((p) => p.category))];
  
      categoryGrid.innerHTML = categories
        .map((category) => {
          const catPages = displayPages.filter((p) => p.category === category);
          return `
          <section class="mb-12">
            <h2 class="text-2xl font-bold text-lemur-green font-display mb-6">${category}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${catPages
                .map(
                  (p) => `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                  <img src="https://placehold.co/400x200?text=${encodeURIComponent(p.title)}" alt="${p.title}" class="w-full h-40 object-cover">
                  <div class="p-4">
                    <h3 class="text-xl font-semibold text-lemur-green mb-2">${p.title}</h3>
                    <p class="text-sm text-gray-600">By ${p.author} on ${p.date}</p>
                    <button data-id="${p.id}" class="mt-3 bg-lemur-green text-white px-4 py-1 rounded-lg text-sm font-bold hover:bg-accent-green transition flex items-center">${arrowRightIcon}Read More</button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </section>
        `;
        })
        .join('');
  
      document.querySelectorAll('button[data-id]').forEach((btn) => {
        btn.addEventListener('click', () => loadPage(btn.dataset.id));
      });
    }
  
    async function loadPage(id) {
      try {
        const response = await fetch(`/page/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('readToken') || 'read-token-123'}` },
        });
        if (response.ok) {
          const page = await response.json();
          categoryGrid.innerHTML = `
          <article class="prose max-w-full prose-invert">
            <h1 class="text-3xl font-display text-lemur-green">${page.title}</h1>
            <p class="text-gray-600">By ${page.author} on ${page.date}</p>
            <div class="text-bamboo-dark">${page.content}</div>
            <img data-src="https://placehold.co/400" class="lazy w-full h-64 object-cover my-4 rounded-lg" alt="AI Visual">
            <video controls class="w-full my-4 rounded-lg" data-src="/static/media/placeholder.mp4"></video>
          </article>
        `;
          lazyLoadMedia();
          updateNavigation(id);
        }
      } catch (error) {
        console.error('Error loading page:', error);
      }
    }
  
    function lazyLoadMedia() {
      const lazyImages = document.querySelectorAll('img.lazy');
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            obs.unobserve(img);
          }
        });
      });
      lazyImages.forEach((img) => observer.observe(img));
    }
  
    function updateNavigation(id) {
      currentPageIndex = pages.findIndex((p) => p.id === id);
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
  
      const filtered = pages.filter(
        (p) =>
          levenshtein(query, p.title.toLowerCase()) <= threshold ||
          p.category.toLowerCase().includes(query)
      );
  
      activeCategory = null;
  
      const categories = [...new Set(filtered.map((p) => p.category))];
      categoryGrid.innerHTML = categories
        .map((category) => {
          const catPages = filtered.filter((p) => p.category === category);
          return `
          <section class="mb-12">
            <h2 class="text-2xl font-bold text-lemur-green font-display mb-6">${category}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${catPages
                .map(
                  (p) => `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                  <img src="https://placehold.co/400x200?text=${encodeURIComponent(p.title)}" alt="${p.title}" class="w-full h-40 object-cover">
                  <div class="p-4">
                    <h3 class="text-xl font-semibold text-lemur-green mb-2">${p.title}</h3>
                    <p class="text-sm text-gray-600">By ${p.author} on ${p.date}</p>
                    <button data-id="${p.id}" class="mt-3 bg-lemur-green text-white px-4 py-1 rounded-lg text-sm font-bold hover:bg-accent-green transition flex items-center">${arrowRightIcon}Read More</button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </section>
        `;
        })
        .join('');
  
      document.querySelectorAll('button[data-id]').forEach((btn) => {
        btn.addEventListener('click', () => loadPage(btn.dataset.id));
      });
    });
  
    fetchPages();
  });