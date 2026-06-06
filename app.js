// ============================================
// SECOP LITE - APLICACIÓN PRINCIPAL
// CON CLOUDFLARE WORKER (SIN CORS)
// MODAL CORREGIDO
// ============================================

// ============================================
// CONFIGURACIÓN
// ============================================

const WORKER_URL = 'https://secop-proxy.shoyosb.workers.dev';
const SECOP_BASE_URL = 'https://www.secop.gov.co/CO1BusinessLine/Tendering/ContractNoticeManagement/Index?prevCtxUrl=%2fCO1Marketplace%2f';

// ============================================
// ESTADO GLOBAL
// ============================================

const state = {
    results: [],
    currentPage: 1,
    pageSize: 10,
    isLoading: false,
    departments: [],
    filtersVisible: false,
    currentQuery: '',
    activeTab: 'search',
    favoriteProcesses: []
};

// ============================================
// LISTAS DE OPCIONES PREDEFINIDAS
// ============================================

const modalitiesList = [
    'Licitación pública',
    'Selección Abreviada de Menor Cuantía',
    'Concurso de méritos abierto',
    'Concurso de méritos con precalificación',
    'Contratación directa',
    'Contratación Directa (con ofertas)',
    'Contratación régimen especial',
    'Mínima cuantía',
    'Selección abreviada subasta inversa'
];

const statusesList = [
    'Abierto',
    'Aprobado',
    'Borrador',
    'Cancelado',
    'En aprobación',
    'Evaluación',
    'Publicado',
    'Seleccionado',
    'Suspendido'
];

// ============================================
// LOCALSTORAGE - PROCESOS GUARDADOS
// ============================================

const STORAGE_KEY = 'secop_lite_favorites';

function getFavorites() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

function addFavorite(processId) {
    const favorites = getFavorites();
    if (!favorites.includes(processId)) {
        favorites.push(processId);
        saveFavorites(favorites);
        return true;
    }
    return false;
}

function removeFavorite(processId) {
    let favorites = getFavorites();
    const initialLength = favorites.length;
    favorites = favorites.filter(id => id !== processId);
    if (favorites.length !== initialLength) {
        saveFavorites(favorites);
        return true;
    }
    return false;
}

function isFavorite(processId) {
    const favorites = getFavorites();
    return favorites.includes(processId);
}

function toggleFavorite(processId) {
    if (isFavorite(processId)) {
        removeFavorite(processId);
        return false;
    } else {
        addFavorite(processId);
        return true;
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, duration = 2000) {
    let toast = document.querySelector('.toast-notification');
    if (toast) toast.remove();
    
    toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ SECOP Lite iniciado');
    console.log('🌐 Worker URL:', WORKER_URL);
    
    initEventListeners();
    loadFilterOptions();
    updateFavoritesList();
    initModalEvents();
});

// ============================================
// CONSTRUCCIÓN DE URL PARA EL WORKER
// ============================================

function buildApiUrl(query, filters = {}) {
    const whereConditions = [];
    
    if (query && query.trim() !== '') {
        const searchTerm = query.trim().toUpperCase();
        whereConditions.push(`(upper(nombre_del_procedimiento) LIKE '%${searchTerm}%' OR upper(descripci_n_del_procedimiento) LIKE '%${searchTerm}%')`);
    }
    
    if (filters.entity_name && filters.entity_name.trim() !== '') {
        whereConditions.push(`entidad LIKE '%${filters.entity_name.toUpperCase()}%'`);
    }
    
    if (filters.department && filters.department !== '') {
        whereConditions.push(`departamento_entidad = '${filters.department}'`);
    }
    
    if (filters.city && filters.city !== '') {
        whereConditions.push(`ciudad_entidad = '${filters.city}'`);
    }
    
    if (filters.modality && filters.modality !== '') {
        whereConditions.push(`modalidad_de_contratacion = '${filters.modality}'`);
    }
    
    if (filters.status && filters.status !== '') {
        whereConditions.push(`estado_del_procedimiento = '${filters.status}'`);
    }
    
    if (filters.min_value && filters.min_value !== '') {
        whereConditions.push(`precio_base >= ${filters.min_value}`);
    }
    
    if (filters.max_value && filters.max_value !== '') {
        whereConditions.push(`precio_base <= ${filters.max_value}`);
    }
    
    if (filters.from_date && filters.from_date !== '') {
        whereConditions.push(`fecha_de_publicacion_del >= '${filters.from_date}'`);
    }
    
    if (filters.to_date && filters.to_date !== '') {
        whereConditions.push(`fecha_de_publicacion_del <= '${filters.to_date}'`);
    }
    
    const params = new URLSearchParams();
    params.append('$order', 'fecha_de_publicacion_del DESC');
    params.append('$limit', '500');
    
    if (whereConditions.length > 0) {
        params.append('$where', whereConditions.join(' AND '));
    }
    
    return `${WORKER_URL}?${params.toString()}`;
}

// ============================================
// PETICIÓN A LA API
// ============================================

async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value || '';
    
    state.currentQuery = query;
    showLoading();
    
    try {
        const filters = getFilterValues();
        const url = buildApiUrl(query, filters);
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        const results = Array.isArray(data) ? data : [];
        state.results = results;
        state.currentPage = 1;
        
        updateResultsCount(results.length);
        
        if (state.activeTab === 'search') {
            renderTable();
            renderPagination();
            renderChart();
        } else {
            renderFavoritesTable();
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError('Error al cargar los datos. Verifica tu conexión o que el Worker esté activo.');
        state.results = [];
        renderTable();
        if (modalityChart) {
            modalityChart.destroy();
            modalityChart = null;
        }
    } finally {
        hideLoading();
    }
}

function getFilterValues() {
    return {
        entity_name: document.getElementById('entityFilter')?.value || '',
        department: document.getElementById('departmentFilter')?.value || '',
        city: document.getElementById('cityFilter')?.value || '',
        modality: document.getElementById('modalityFilter')?.value || '',
        status: document.getElementById('statusFilter')?.value || '',
        from_date: document.getElementById('fromDateFilter')?.value || '',
        to_date: document.getElementById('toDateFilter')?.value || '',
        min_value: document.getElementById('minValueFilter')?.value || '',
        max_value: document.getElementById('maxValueFilter')?.value || ''
    };
}

// ============================================
// FUNCIONES DE UI
// ============================================

function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count} proceso${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
}

function showError(message) {
    const tbody = document.getElementById('tableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">❌ ${message}</td></tr>`;
    }
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('hidden');
    state.isLoading = true;
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
    state.isLoading = false;
}

// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================
// RENDERIZADO DE TABLA (CON DATA-ID CORREGIDO)
// ============================================

function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    if (state.results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Realiza una búsqueda para ver resultados</td></tr>';
        return;
    }
    
    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageResults = state.results.slice(start, end);
    
    tbody.innerHTML = pageResults.map(process => renderTableRow(process)).join('');
}

function renderTableRow(process) {
    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
    };
    
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-CO');
        } catch {
            return 'N/A';
        }
    };
    
    const getStatusClass = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'abierto' || s === 'activo' || s === 'publicado') return 'status-active';
        if (s === 'adjudicado' || s === 'aprobado') return 'status-adjudicado';
        if (s === 'cancelado' || s === 'borrador') return 'status-cancelado';
        return '';
    };
    
    const cleanUnspc = (code) => {
        if (!code || code === 'No definido') return '';
        return String(code).replace(/^[A-Z0-9]+\./, '').replace(/[^\d]/g, '');
    };
    
    const processId = process.id_del_proceso || 'N/A';
    const entity = process.entidad || 'N/A';
    const title = process.nombre_del_procedimiento || 'Sin título';
    const modality = process.modalidad_de_contratacion || 'N/A';
    const value = formatCurrency(process.precio_base);
    const status = process.estado_del_procedimiento || 'No especificado';
    const statusClass = getStatusClass(process.estado_del_procedimiento);
    const pubDate = formatDate(process.fecha_de_publicacion_del);
    const unspcCode = cleanUnspc(process.codigo_principal_de_categoria);
    const isFav = isFavorite(processId);
    const saveButtonText = isFav ? '⭐ Guardado' : '⭐ Guardar';
    const saveButtonClass = isFav ? 'save-btn saved' : 'save-btn';
    
    return `
        <tr class="clickable-row" data-id="${escapeHtml(processId)}">
            <td>
                <div class="process-id">${escapeHtml(processId)}</div>
                <div class="process-entity">${escapeHtml(entity)}</div>
            </td>
            <td>
                <div class="process-title">${escapeHtml(title)}</div>
                <div class="process-modality">${escapeHtml(modality)}</div>
            </td>
            <td class="process-value">${value}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(status)}</span></td>
            <td>${pubDate}</td>
            <td>${unspcCode ? `<span class="unspc-badge">${unspcCode}</span>` : 'N/A'}</td>
            <td><button class="${saveButtonClass}" data-id="${escapeHtml(processId)}">${saveButtonText}</button></td>
        </tr>
    `;
}

// ============================================
// PAGINACIÓN
// ============================================

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(state.results.length / state.pageSize);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    html += `<button ${state.currentPage === 1 ? 'disabled' : ''} data-page="${state.currentPage - 1}">‹ Anterior</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= state.currentPage - 2 && i <= state.currentPage + 2)) {
            html += `<button class="${state.currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === state.currentPage - 3 || i === state.currentPage + 3) {
            html += `<button disabled>...</button>`;
        }
    }
    
    html += `<button ${state.currentPage === totalPages ? 'disabled' : ''} data-page="${state.currentPage + 1}">Siguiente ›</button>`;
    container.innerHTML = html;
    
    container.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                state.currentPage = page;
                renderTable();
                renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

// ============================================
// FILTROS Y CARGA DE OPCIONES
// ============================================

function applyFilters() {
    performSearch();
}

function clearFilters() {
    const filterIds = ['entityFilter', 'departmentFilter', 'cityFilter', 'modalityFilter', 
                       'statusFilter', 'fromDateFilter', 'toDateFilter', 'minValueFilter', 'maxValueFilter'];
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    const citySelect = document.getElementById('cityFilter');
    if (citySelect) {
        citySelect.innerHTML = '<option value="">Todas las ciudades</option>';
        citySelect.disabled = false;
    }
    
    performSearch();
}

async function loadCitiesByDepartment() {
    const deptSelect = document.getElementById('departmentFilter');
    const citySelect = document.getElementById('cityFilter');
    const selectedDept = deptSelect?.value;
    
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Cargando ciudades...</option>';
    citySelect.disabled = true;
    
    if (!selectedDept || selectedDept === '') {
        citySelect.innerHTML = '<option value="">Todas las ciudades</option>';
        citySelect.disabled = false;
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('$select', 'distinct ciudad_entidad');
        params.append('$where', `departamento_entidad = '${selectedDept}'`);
        params.append('$limit', '500');
        
        const url = `${WORKER_URL}?${params.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            const cities = [...new Set(data.map(item => item.ciudad_entidad).filter(c => c && c !== 'No Definido'))].sort();
            citySelect.innerHTML = '<option value="">Todas las ciudades</option>';
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando ciudades:', error);
        citySelect.innerHTML = '<option value="">Error al cargar ciudades</option>';
    } finally {
        citySelect.disabled = false;
    }
}

async function loadFilterOptions() {
    console.log('📦 Cargando opciones de filtros...');
    
    const modalitySelect = document.getElementById('modalityFilter');
    if (modalitySelect) {
        modalitiesList.forEach(modality => {
            const option = document.createElement('option');
            option.value = modality;
            option.textContent = modality;
            modalitySelect.appendChild(option);
        });
    }
    
    const statusSelect = document.getElementById('statusFilter');
    if (statusSelect) {
        statusesList.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });
    }
    
    await loadDepartments();
}

async function loadDepartments() {
    try {
        const params = new URLSearchParams();
        params.append('$select', 'distinct departamento_entidad');
        params.append('$limit', '100');
        
        const url = `${WORKER_URL}?${params.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            const departments = [...new Set(data.map(item => item.departamento_entidad).filter(d => d && d !== 'No Definido'))].sort();
            state.departments = departments;
            
            const deptSelect = document.getElementById('departmentFilter');
            if (deptSelect) {
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept;
                    option.textContent = dept;
                    deptSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando departamentos:', error);
    }
}

// ============================================
// FAVORITOS (PESTAÑA)
// ============================================

function updateFavoritesList() {
    const favoritesIds = getFavorites();
    state.favoriteProcesses = state.results.filter(p => favoritesIds.includes(p.id_del_proceso));
}

function renderFavoritesTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    const favoritesIds = getFavorites();
    const favoriteProcesses = state.results.filter(p => favoritesIds.includes(p.id_del_proceso));
    
    if (favoriteProcesses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">⭐ No tienes procesos guardados. Busca y guarda tus procesos favoritos.</td></tr>';
        document.getElementById('resultsCount').textContent = '0 procesos guardados';
        return;
    }
    
    tbody.innerHTML = favoriteProcesses.map(process => renderTableRow(process)).join('');
    document.getElementById('resultsCount').textContent = `${favoriteProcesses.length} proceso${favoriteProcesses.length !== 1 ? 's' : ''} guardado${favoriteProcesses.length !== 1 ? 's' : ''}`;
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
            renderTable();
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

// ============================================
// GRÁFICOS ESTADÍSTICOS
// ============================================

let modalityChart = null;

function processChartData(results) {
    const modalityCount = {};
    results.forEach(process => {
        let modality = process.modalidad_de_contratacion;
        if (!modality || modality === 'No Definido') modality = 'No especificada';
        modalityCount[modality] = (modalityCount[modality] || 0) + 1;
    });
    
    const sorted = Object.entries(modalityCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { labels: sorted.map(item => item[0]), data: sorted.map(item => item[1]) };
}

function renderChart() {
    const canvas = document.getElementById('modalityChart');
    if (!canvas) return;
    
    if (state.results.length === 0) {
        if (modalityChart) { modalityChart.destroy(); modalityChart = null; }
        return;
    }
    
    const chartData = processChartData(state.results);
    if (chartData.labels.length === 0) return;
    
    if (modalityChart) modalityChart.destroy();
    
    const ctx = canvas.getContext('2d');
    modalityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Cantidad de procesos',
                data: chartData.data,
                backgroundColor: 'rgba(1, 45, 29, 0.7)',
                borderColor: '#012d1d',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw} procesos` } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, title: { display: true, text: 'Cantidad de procesos' } },
                x: { title: { display: true, text: 'Modalidad de contratación' }, ticks: { maxRotation: 45, minRotation: 45 } }
            }
        }
    });
}

// ============================================
// MODAL DE DETALLES DEL PROCESO (CORREGIDO)
// ============================================

function showCopyTooltip(text, x, y) {
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.textContent = text;
    tooltip.style.left = `${x - 30}px`;
    tooltip.style.top = `${y - 40}px`;
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        if (tooltip.parentNode) tooltip.remove();
    }, 1000);
}

async function copyToClipboard(text, event) {
    try {
        await navigator.clipboard.writeText(text);
        const rect = event.target.getBoundingClientRect();
        showCopyTooltip('✅ Referencia copiada', rect.left + rect.width / 2, rect.top);
    } catch (err) {
        console.error('Error al copiar:', err);
        alert('No se pudo copiar la referencia');
    }
}

function openSecopPortal() {
    window.open(SECOP_BASE_URL, '_blank');
}

function showModal(process) {
    console.log('📋 Abriendo modal para:', process?.id_del_proceso);
    
    const modal = document.getElementById('processModal');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalBody) {
        console.error('Modal no encontrado en el DOM');
        return;
    }
    
    if (!process) {
        console.error('No se recibió proceso para mostrar');
        return;
    }
    
    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
    };
    
    const formatDate = (dateStr) => {
        if (!dateStr) return 'No disponible';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return String(dateStr);
        }
    };
    
    const cleanUnspc = (code) => {
        if (!code || code === 'No definido') return null;
        return String(code).replace(/^[A-Z0-9]+\./, '').replace(/[^\d]/g, '');
    };
    
    const processId = process.id_del_proceso || 'No disponible';
    const reference = process.referencia_del_proceso || 'No disponible';
    const entity = process.entidad || 'No disponible';
    const title = process.nombre_del_procedimiento || 'Sin título';
    const description = process.descripci_n_del_procedimiento || 'No disponible';
    const value = formatCurrency(process.precio_base);
    const modality = process.modalidad_de_contratacion || 'No especificada';
    const status = process.estado_del_procedimiento || 'No especificado';
    const phase = process.fase || 'No especificada';
    const pubDate = formatDate(process.fecha_de_publicacion_del);
    const deadline = formatDate(process.fecha_de_recepcion_de);
    const url = process.urlproceso || null;
    
    const mainUnspc = cleanUnspc(process.codigo_principal_de_categoria);
    let additionalUnspc = [];
    if (process.categorias_adicionales && process.categorias_adicionales !== 'No definido') {
        additionalUnspc = String(process.categorias_adicionales).split(',').map(c => cleanUnspc(c.trim())).filter(c => c);
    }
    const allUnspcCodes = [...(mainUnspc ? [mainUnspc] : []), ...additionalUnspc];
    
    modalBody.innerHTML = `
        <div class="modal-info-grid">
            <div class="modal-info-card">
                <div class="modal-info-label">📌 ID del Proceso</div>
                <div class="modal-info-value mono">${escapeHtml(processId)}</div>
            </div>
            <div class="modal-info-card">
                <div class="modal-info-label">🔢 Referencia</div>
                <div class="reference-group">
                    <span class="reference-value mono">${escapeHtml(reference)}</span>
                    <button class="btn-secop-link" id="copyReferenceBtn">
                        <span class="material-symbols-outlined" style="font-size: 0.9rem;">content_copy</span>
                        Copiar
                    </button>
                    <button class="btn-secop-link" id="openSecopBtn">
                        <span class="material-symbols-outlined" style="font-size: 0.9rem;">open_in_new</span>
                        Ir a SECOP
                    </button>
                </div>
            </div>
            <div class="modal-info-card full-width">
                <div class="modal-info-label">🏢 Entidad</div>
                <div class="modal-info-value">${escapeHtml(entity)}</div>
            </div>
            <div class="modal-info-card full-width">
                <div class="modal-info-label">📝 Título</div>
                <div class="modal-info-value">${escapeHtml(title)}</div>
            </div>
            <div class="modal-info-card full-width">
                <div class="modal-info-label">📄 Descripción</div>
                <div class="modal-info-value">${escapeHtml(description)}</div>
            </div>
            <div class="modal-info-card">
                <div class="modal-info-label">💰 Cuantía</div>
                <div class="modal-info-value currency">${value}</div>
            </div>
            <div class="modal-info-card">
                <div class="modal-info-label">📋 Modalidad</div>
                <div class="modal-info-value">${escapeHtml(modality)}</div>
            </div>
            <div class="modal-info-card">
                <div class="modal-info-label">⚡ Estado</div>
                <div class="modal-info-value">${escapeHtml(status)}</div>
            </div>
            <div class="modal-info-card">
                <div class="modal-info-label">🔄 Fase</div>
                <div class="modal-info-value">${escapeHtml(phase)}</div>
            </div>
            <div class="modal-info-card">
                <div class="modal-info-label">📅 Publicación</div>
                <div class="modal-info-value">${pubDate}</div>
            </div>
            <div class="modal-info-card">
                <div class="modal-info-label">⏰ Cierre</div>
                <div class="modal-info-value">${deadline}</div>
            </div>
        </div>
        
        ${allUnspcCodes.length > 0 ? `
        <div class="modal-section">
            <div class="modal-section-title">
                <span>🏷️</span> Códigos UNSPSC
            </div>
            <div>
                ${allUnspcCodes.map(code => `<span class="modal-tag">${escapeHtml(code)}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${url ? `
        <div class="modal-section">
            <div class="modal-section-title">
                <span>🔗</span> Enlace oficial
            </div>
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="modal-link">
                <span class="material-symbols-outlined" style="font-size: 1rem;">open_in_new</span>
                Ver proceso en SECOP II
            </a>
        </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    const copyBtn = document.getElementById('copyReferenceBtn');
    const openSecopBtn = document.getElementById('openSecopBtn');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(reference, e);
        });
    }
    
    if (openSecopBtn) {
        openSecopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openSecopPortal();
        });
    }
}

function closeModal() {
    const modal = document.getElementById('processModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function initModalEvents() {
    const closeBtn = document.getElementById('closeModalBtn');
    const footerCloseBtn = document.getElementById('modalCloseFooterBtn');
    const modal = document.getElementById('processModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (footerCloseBtn) {
        footerCloseBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// ============================================
// EVENTOS (CORREGIDO - MODAL FUNCIONA)
// ============================================

function initEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn) searchBtn.addEventListener('click', () => performSearch());
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const filtersPanel = document.getElementById('filtersPanel');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            state.filtersVisible = !state.filtersVisible;
            if (state.filtersVisible) {
                filtersPanel.classList.remove('hidden');
                toggleBtn.innerHTML = '<span class="material-symbols-outlined">filter_list</span> Ocultar filtros';
            } else {
                filtersPanel.classList.add('hidden');
                toggleBtn.innerHTML = '<span class="material-symbols-outlined">filter_list</span> Mostrar filtros';
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
        // EVENTO CORREGIDO: Abre el modal al hacer clic en la fila
        tableBody.addEventListener('click', (e) => {
            // Si se hizo clic en el botón guardar, NO abrir modal
            if (e.target.closest('.save-btn')) {
                return;
            }
            
            // Buscar la fila más cercana
            const row = e.target.closest('tr');
            if (!row) return;
            
            // Obtener el ID del proceso desde el atributo data-id
            const processId = row.getAttribute('data-id');
            
            if (processId && processId !== 'N/A') {
                // Buscar el proceso completo en state.results
                const process = state.results.find(p => p.id_del_proceso === processId);
                if (process) {
                    console.log('✅ Abriendo modal para:', processId);
                    showModal(process);
                } else {
                    console.error('❌ Proceso no encontrado en state.results:', processId);
                }
            }
        });
        
        // Clic en botón guardar
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.save-btn');
            if (btn) {
                e.stopPropagation();
                const processId = btn.getAttribute('data-id');
                const newState = toggleFavorite(processId);
                
                btn.textContent = newState ? '⭐ Guardado' : '⭐ Guardar';
                if (newState) {
                    btn.classList.add('saved');
                    showToast('✅ Proceso guardado en favoritos');
                } else {
                    btn.classList.remove('saved');
                    showToast('❌ Proceso eliminado de favoritos');
                }
                
                if (state.activeTab === 'favorites') {
                    renderFavoritesTable();
                }
                
                updateFavoritesList();
            }
        });
    }
}