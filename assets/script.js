
let allResources = [];
let categoryHierarchy = {};
let currentCategory1 = 'all';
let currentCategory2 = 'all';
let searchKeyword = '';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 关键：使用相对路径，GitHub Pages也能正常读取
        const response = await fetch('assets/search-data.json');
        const data = await response.json();
        allResources = data.resources;
        categoryHierarchy = data.category_hierarchy;
        
        initCategoryNav();
        initSearchBox();
        renderResources();
    } catch (error) {
        console.error('数据加载失败:', error);
        document.getElementById('resource-list').innerHTML = `
            <div class="empty-state">
                <div>❌ 数据加载失败</div>
                <div style="font-size:0.8rem;margin-top:0.5rem;">请检查文件路径是否正确</div>
            </div>
        `;
    }
});

function initCategoryNav() {
    const navContainer = document.getElementById('category-nav');
    let navHtml = `
        <div class="category1-header active" data-cat1="all">
            <span>全部资源</span>
            <span>${allResources.length}</span>
        </div>
    `;

    Object.keys(categoryHierarchy).sort().forEach(cat1 => {
        const cat2List = categoryHierarchy[cat1];
        const cat1Count = allResources.filter(r => r.category1 === cat1).length;
        
        navHtml += `
            <div class="category1-item">
                <div class="category1-header" data-cat1="${cat1}">
                    <span>${cat1}</span>
                    <span>${cat1Count}</span>
                </div>
                <ul class="category2-list" data-cat1-parent="${cat1}">
                    <li><a class="category2-link" data-cat1="${cat1}" data-cat2="all">全部</a></li>
        `;
        
        cat2List.forEach(cat2 => {
            const cat2Count = allResources.filter(r => r.category1 === cat1 && r.category2 === cat2).length;
            navHtml += `
                <li><a class="category2-link" data-cat1="${cat1}" data-cat2="${cat2}">${cat2} (${cat2Count})</a></li>
            `;
        });
        
        navHtml += `</ul></div>`;
    });

    navContainer.innerHTML = navHtml;

    // 绑定一级分类点击
    document.querySelectorAll('.category1-header').forEach(header => {
        header.addEventListener('click', function() {
            const cat1 = this.dataset.cat1;
            if (cat1 === 'all') {
                document.querySelectorAll('.category1-header').forEach(h => h.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.category2-list').forEach(l => l.classList.remove('show'));
                currentCategory1 = 'all';
                currentCategory2 = 'all';
                renderResources();
                return;
            }

            const cat2List = document.querySelector(`.category2-list[data-cat1-parent="${cat1}"]`);
            document.querySelectorAll('.category1-header').forEach(h => h.classList.remove('active'));
            document.querySelectorAll('.category2-list').forEach(l => l.classList.remove('show'));
            
            this.classList.add('active');
            cat2List.classList.add('show');
            currentCategory1 = cat1;
            currentCategory2 = 'all';
            renderResources();
        });
    });

    // 绑定二级分类点击
    document.querySelectorAll('.category2-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.category2-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            currentCategory1 = this.dataset.cat1;
            currentCategory2 = this.dataset.cat2;
            renderResources();
        });
    });
}

function initSearchBox() {
    const searchBox = document.getElementById('search-box');
    searchBox.addEventListener('input', function(e) {
        searchKeyword = e.target.value.trim().toLowerCase();
        renderResources();
    });
}

function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\]/g, '\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function renderResources() {
    const resourceList = document.getElementById('resource-list');
    const contentTitle = document.getElementById('content-title');
    const resourceCount = document.getElementById('resource-count');

    let filteredResources = allResources;
    if (currentCategory1 !== 'all') {
        filteredResources = filteredResources.filter(item => item.category1 === currentCategory1);
        if (currentCategory2 !== 'all') {
            filteredResources = filteredResources.filter(item => item.category2 === currentCategory2);
        }
    }

    if (searchKeyword) {
        filteredResources = filteredResources.filter(item => 
            item.search_key.includes(searchKeyword)
        );
    }

    if (currentCategory1 === 'all') {
        contentTitle.textContent = '全部资源';
    } else if (currentCategory2 === 'all') {
        contentTitle.textContent = currentCategory1;
    } else {
        contentTitle.textContent = `${currentCategory1} / ${currentCategory2}`;
    }

    resourceCount.textContent = `共 ${filteredResources.length} 个资源`;

    if (filteredResources.length === 0) {
        resourceList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">未找到匹配的资源</div>
            </div>
        `;
        return;
    }

    let html = '';
    filteredResources.forEach(resource => {
        const highlightedFilename = highlightKeyword(resource.filename, searchKeyword);
        const highlightedCategory1 = highlightKeyword(resource.category1, searchKeyword);
        const highlightedCategory2 = highlightKeyword(resource.category2, searchKeyword);
        
        html += `
            <div class="resource-card">
                <div class="resource-filename">${highlightedFilename}</div>
                <div class="resource-category">${highlightedCategory1} / ${highlightedCategory2}</div>
                <a href="${resource.link}" target="_blank" class="resource-link">一键打开网盘</a>
            </div>
        `;
    });

    resourceList.innerHTML = html;
}
