// ============================================
// API Y PETICIONES
// ============================================

function buildApiUrl(query, filters = {}) {
    const whereConditions = [];
    
    // Sin límites para admin
    const limit = 500;
    
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
    
    if (filters.phase && filters.phase !== '') {
        whereConditions.push(`fase = '${filters.phase}'`);
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
    params.append('$limit', limit.toString());
    
    if (whereConditions.length > 0) {
        params.append('$where', whereConditions.join(' AND '));
    }
    
    const finalUrl = `${WORKER_URL}?${params.toString()}`;
    console.log('🔗 URL construida:', finalUrl);
    return finalUrl;
}

function getFilterValues() {
    return {
        entity_name: document.getElementById('entityFilter')?.value || '',
        department: document.getElementById('departmentFilter')?.value || '',
        city: document.getElementById('cityFilter')?.value || '',
        modality: document.getElementById('modalityFilter')?.value || '',
        phase: document.getElementById('phaseFilter')?.value || '',
        status: document.getElementById('statusFilter')?.value || '',
        from_date: document.getElementById('fromDateFilter')?.value || '',
        to_date: document.getElementById('toDateFilter')?.value || '',
        min_value: document.getElementById('minValueFilter')?.value || '',
        max_value: document.getElementById('maxValueFilter')?.value || ''
    };
}

async function performSearch() {
    console.log('🔍 performSearch llamado');
    
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value || '';
    
    state.currentQuery = query;
    showLoading();
    
    try {
        const filters = getFilterValues();
        const url = buildApiUrl(query, filters);
        console.log('🌐 Fetching URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('📊 Datos recibidos:', Array.isArray(data) ? data.length : 'No es array');
        
        if (data.error) throw new Error(data.error);
        
        const results = Array.isArray(data) ? data : [];
        state.results = results;
        state.currentPage = 1;
        
        updateResultsCount(results.length);
        
        if (state.activeTab === 'search') {
            renderTable();
            renderPagination();
            if (typeof renderChart === 'function') renderChart();
        } else {
            renderFavoritesTable();
        }
        
        if (results.length === 0) {
            showToast('📭 No se encontraron resultados. Prueba con otros términos.');
        }
        
    } catch (error) {
        console.error('❌ Error detallado:', error);
        showError('Error al cargar los datos: ' + error.message);
        state.results = [];
        renderTable();
        if (typeof modalityChart !== 'undefined' && modalityChart) {
            modalityChart.destroy();
            modalityChart = null;
        }
    } finally {
        hideLoading();
    }
}