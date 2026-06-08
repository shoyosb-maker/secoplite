// ============================================
// SECOP LITE - ORQUESTADOR PRINCIPAL
// ============================================

function initAppAfterLogin() {
    console.log('🔄 Inicializando aplicación después del login...');
    initEventListeners();
    loadFilterOptions();
    updateFavoritesList();
    initModalEvents();
    initPageSizeSelector();
    
    setTimeout(() => {
        performSearch();
    }, 100);
}

function switchTab(tab) {
    state.activeTab = tab;
    const searchContent = document.getElementById('searchContent');
    const chartsContainer = document.getElementById('chartsContainer');
    const resultsTitle = document.getElementById('resultsTitle');
    const tabSearch = document.getElementById('tabSearchBtn');
    const tabFav = document.getElementById('tabFavoritesBtn');
    
    if (tab === 'search') {
        searchContent.style.display = 'block';
        chartsContainer.style.display = 'block';
        resultsTitle.textContent = 'Procesos de Contratación';
        tabSearch.classList.add('active');
        tabFav.classList.remove('active');
        
        if (state.results.length > 0) {
            const viewMode = document.getElementById('viewToggle')?.value === 'cards' ? 'cards' : 'table';
            if (viewMode === 'cards') {
                if (typeof renderCards === 'function') renderCards();
            } else {
                renderTable();
            }
            renderPagination();
            renderChart();
            updateResultsCount(state.results.length);
        } else {
            renderTable();
            renderPagination();
        }
    } else {
        searchContent.style.display = 'none';
        chartsContainer.style.display = 'none';
        resultsTitle.textContent = '⭐ Mis Procesos Guardados';
        tabFav.classList.add('active');
        tabSearch.classList.remove('active');
        
        renderFavoritesTable();
        document.getElementById('pagination').innerHTML = '';
        
        if (modalityChart) {
            modalityChart.destroy();
            modalityChart = null;
        }
    }
}

function initEventListeners() {
    console.log('🎯 Inicializando event listeners...');
    
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn) searchBtn.addEventListener('click', () => performSearch());
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const filtersPanel = document.getElementById('filtersPanel');
    
    if (toggleBtn && filtersPanel) {
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        newToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (filtersPanel.classList.contains('hidden')) {
                filtersPanel.classList.remove('hidden');
                this.innerHTML = '<span class="material-symbols-outlined">filter_list</span> Ocultar filtros';
            } else {
                filtersPanel.classList.add('hidden');
                this.innerHTML = '<span class="material-symbols-outlined">filter_list</span> Mostrar filtros';
            }
        });
    }
    
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (applyBtn) applyBtn.addEventListener('click', () => applyFilters());
    
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => clearFilters());
    
    const deptSelect = document.getElementById('departmentFilter');
    if (deptSelect) deptSelect.addEventListener('change', () => loadCitiesByDepartment());
    
    const tabSearchBtn = document.getElementById('tabSearchBtn');
    const tabFavoritesBtn = document.getElementById('tabFavoritesBtn');
    if (tabSearchBtn) tabSearchBtn.addEventListener('click', () => switchTab('search'));
    if (tabFavoritesBtn) tabFavoritesBtn.addEventListener('click', () => switchTab('favorites'));
    
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        // Click en fila para abrir modal
        tableBody.addEventListener('click', (e) => {
            if (e.target.closest('.save-btn')) return;
            
            const row = e.target.closest('tr');
            if (!row) return;
            
            const processId = row.getAttribute('data-id');
            if (processId && processId !== 'N/A') {
                const process = state.results.find(p => p.id_del_proceso === processId);
                if (process) showModal(process);
            }
        });
        
        // Click en botón guardar
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.save-btn');
            if (btn) {
                e.stopPropagation();
                const processId = btn.getAttribute('data-id');
                console.log('🔘 Click en guardar para proceso:', processId);
                
                const newState = toggleFavorite(processId);
                
                btn.textContent = newState ? '⭐ Guardado' : '⭐ Guardar';
                if (newState) {
                    btn.classList.add('saved');
                } else {
                    btn.classList.remove('saved');
                }
                
                if (state.activeTab === 'favorites') {
                    renderFavoritesTable();
                }
                updateFavoritesList();
            }
        });
    }
    
    // Event listener para el toggle de vista
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
        viewToggle.addEventListener('change', () => {
            if (state.activeTab === 'search') {
                updateView();
            }
        });
    }
    
    console.log('✅ Todos los event listeners inicializados');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ SECOP Lite iniciado - DOM Listo');
    initLoginSystem();
    checkSession();
    
    if (!state.isLoggedIn) {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    } else {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initAppAfterLogin();
    }
});