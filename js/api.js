// ============================================
// API Y PETICIONES
// ============================================

// Función auxiliar para normalizar texto
function normalizeText(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Función para determinar si un proceso es participable (VIGENTE)
function isParticipable(proceso) {
    // 1. Verificar estado - SOLO "Abierto" o equivalente
    const estado = normalizeText(proceso.estado_del_procedimiento || '');
    if (estado !== 'abierto' && estado !== 'publicado' && estado !== 'en convocatoria') {
        return false;
    }
    
    // 2. Verificar fecha de cierre - DEBE SER FUTURA
    const fechaCierre = new Date(proceso.fecha_de_recepcion_de);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (isNaN(fechaCierre) || fechaCierre < hoy) {
        return false;
    }
    
    // 3. Verificar que no tenga proveedor asignado
    const codProv = (proceso.codigoproveedor || '').toLowerCase();
    if (codProv && codProv !== 'no definido' && codProv !== '' && /\d/.test(codProv)) {
        return false;
    }
    
    // 4. Verificar que no esté adjudicado
    const idAdj = (proceso.id_adjudicacion || '').toLowerCase();
    if (idAdj && idAdj !== 'no adjudicado' && idAdj !== '') {
        return false;
    }
    
    return true;
}

// Función para calcular métricas de resultados
function calculateMetrics(results) {
    const total = results.length;
    const entidades = new Set(results.map(p => p.entidad).filter(Boolean)).size;
    const valorTotal = results.reduce((sum, p) => {
        const val = parseFloat(p.precio_base) || 0;
        return sum + val;
    }, 0);
    
    return { total, entidades, valorTotal };
}

// Función para ordenar resultados según el selector
function sortResults(results, sortOrder) {
    const sorted = [...results];
    
    switch(sortOrder) {
        case 'fecha_cierre_asc':
            sorted.sort((a, b) => {
                const fechaA = new Date(a.fecha_de_recepcion_de);
                const fechaB = new Date(b.fecha_de_recepcion_de);
                if (isNaN(fechaA)) return 1;
                if (isNaN(fechaB)) return -1;
                return fechaA - fechaB;
            });
            break;
            
        case 'fecha_cierre_desc':
            sorted.sort((a, b) => {
                const fechaA = new Date(a.fecha_de_recepcion_de);
                const fechaB = new Date(b.fecha_de_recepcion_de);
                if (isNaN(fechaA)) return 1;
                if (isNaN(fechaB)) return -1;
                return fechaB - fechaA;
            });
            break;
            
        case 'fecha_publicacion_desc':
            sorted.sort((a, b) => {
                const fechaA = new Date(a.fecha_de_publicacion_del);
                const fechaB = new Date(b.fecha_de_publicacion_del);
                if (isNaN(fechaA)) return 1;
                if (isNaN(fechaB)) return -1;
                return fechaB - fechaA;
            });
            break;
            
        case 'precio_desc':
            sorted.sort((a, b) => {
                const precioA = parseFloat(a.precio_base) || 0;
                const precioB = parseFloat(b.precio_base) || 0;
                return precioB - precioA;
            });
            break;
            
        case 'precio_asc':
            sorted.sort((a, b) => {
                const precioA = parseFloat(a.precio_base) || 0;
                const precioB = parseFloat(b.precio_base) || 0;
                return precioA - precioB;
            });
            break;
            
        default:
            sorted.sort((a, b) => {
                const fechaA = new Date(a.fecha_de_publicacion_del);
                const fechaB = new Date(b.fecha_de_publicacion_del);
                if (isNaN(fechaA)) return 1;
                if (isNaN(fechaB)) return -1;
                return fechaB - fechaA;
            });
            break;
    }
    
    return sorted;
}

function buildApiUrl(query, filters = {}) {
    const whereConditions = [];
    const limitSelect = document.getElementById('resultLimit');
    const limit = limitSelect ? parseInt(limitSelect.value) : 500;
    
    // Filtro VIGENTE en la API
    if (filters.onlyActive === true) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        whereConditions.push(`estado_del_procedimiento = 'Abierto' AND fecha_de_recepcion_de >= '${todayStr}'`);
    }
    
    // Filtro por categorías UNSPSC
    if (filters.unspcCodes && filters.unspcCodes.length > 0) {
        const unspcConditions = filters.unspcCodes.map(code => 
            `(codigo_principal_de_categoria LIKE '%25${code}%25' OR categorias_adicionales LIKE '%25${code}%25')`
        );
        whereConditions.push(`(${unspcConditions.join(' OR ')})`);
    }
    
    // Búsqueda por texto
    if (query && query.trim() !== '') {
        const searchTerm = query.trim().toUpperCase();
        whereConditions.push(`(upper(nombre_del_procedimiento) LIKE '%25${searchTerm}%25' OR upper(descripci_n_del_procedimiento) LIKE '%25${searchTerm}%25')`);
    }
    
    // Filtros existentes
    if (filters.entity_name && filters.entity_name.trim() !== '') {
        whereConditions.push(`entidad LIKE '%25${filters.entity_name.toUpperCase()}%25'`);
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
    
    // Filtros por valor
    if (filters.min_value && filters.min_value !== '') {
        whereConditions.push(`precio_base >= ${filters.min_value}`);
    }
    if (filters.max_value && filters.max_value !== '') {
        whereConditions.push(`precio_base <= ${filters.max_value}`);
    }
    
    // Filtros por fecha de PUBLICACIÓN
    if (filters.from_date && filters.from_date !== '') {
        whereConditions.push(`fecha_de_publicacion_del >= '${filters.from_date}'`);
    }
    if (filters.to_date && filters.to_date !== '') {
        whereConditions.push(`fecha_de_publicacion_del <= '${filters.to_date}'`);
    }
    
    // Filtros por fecha de CIERRE DE OFERTAS (DEADLINE)
    if (filters.from_deadline && filters.from_deadline !== '') {
        whereConditions.push(`fecha_de_recepcion_de >= '${filters.from_deadline}'`);
    }
    if (filters.to_deadline && filters.to_deadline !== '') {
        whereConditions.push(`fecha_de_recepcion_de <= '${filters.to_deadline}'`);
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
    // Obtener códigos UNSPSC seleccionados
    const selectedUnspc = [];
    document.querySelectorAll('#unspc-filter input[type="checkbox"]:checked').forEach(cb => {
        selectedUnspc.push(cb.value);
    });
    
    return {
        entity_name: document.getElementById('entityFilter')?.value || '',
        department: document.getElementById('departmentFilter')?.value || '',
        city: document.getElementById('cityFilter')?.value || '',
        modality: document.getElementById('modalityFilter')?.value || '',
        phase: document.getElementById('phaseFilter')?.value || '',
        status: document.getElementById('statusFilter')?.value || '',
        from_date: document.getElementById('fromDateFilter')?.value || '',
        to_date: document.getElementById('toDateFilter')?.value || '',
        from_deadline: document.getElementById('fromDeadlineFilter')?.value || '',
        to_deadline: document.getElementById('toDeadlineFilter')?.value || '',
        min_value: document.getElementById('minValueFilter')?.value || '',
        max_value: document.getElementById('maxValueFilter')?.value || '',
        onlyActive: document.getElementById('onlyActiveFilter')?.checked || false,
        unspcCodes: selectedUnspc
    };
}

// Función para renderizar métricas
function renderMetrics(results) {
    const metrics = calculateMetrics(results);
    const metricsContainer = document.getElementById('resultsMetrics');
    if (!metricsContainer) return;
    
    const formatCurrencyShort = (value) => {
        const num = Number(value) || 0;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
        return `$${num.toLocaleString('es-CO')}`;
    };
    
    metricsContainer.innerHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon">📊</div>
                <div class="metric-value">${metrics.total}</div>
                <div class="metric-label">Procesos encontrados</div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">🏢</div>
                <div class="metric-value">${metrics.entidades}</div>
                <div class="metric-label">Entidades distintas</div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">💰</div>
                <div class="metric-value">${formatCurrencyShort(metrics.valorTotal)}</div>
                <div class="metric-label">Valor total estimado</div>
            </div>
        </div>
    `;
}

async function performSearch() {
    console.log('🔍 performSearch llamado');
    
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value || '';
    const onlyActiveFilter = document.getElementById('onlyActiveFilter')?.checked || false;
    const sortOrder = document.getElementById('sortOrder')?.value || 'fecha_publicacion_desc';
    const resultLimit = document.getElementById('resultLimit')?.value || 500;
    
    console.log('📌 Filtro solo vigentes:', onlyActiveFilter);
    
    state.currentQuery = query;
    showLoading();
    
    const viewMode = document.getElementById('viewToggle')?.value === 'cards' ? 'cards' : 'table';
    
    try {
        const filters = getFilterValues();
        const url = buildApiUrl(query, filters);
        console.log('🌐 Fetching URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        let data = await response.json();
        console.log('📊 Datos recibidos de API:', Array.isArray(data) ? data.length : 'No es array');
        
        if (data.error) throw new Error(data.error);
        
        let results = Array.isArray(data) ? data : [];
        
        // Aplicar filtro participable COMPLETO en JavaScript
        if (onlyActiveFilter === true) {
            const antes = results.length;
            results = results.filter(proceso => isParticipable(proceso));
            console.log(`🔴 Filtro vigente aplicado: ${antes} → ${results.length} procesos`);
            
            if (results.length === 0) {
                showToast('📭 No hay procesos vigentes con los filtros actuales. Prueba quitando el filtro.');
            } else {
                showToast(`🔴 Mostrando ${results.length} procesos vigentes donde aún puedes participar`);
            }
        }
        
        // Aplicar ordenamiento
        results = sortResults(results, sortOrder);
        
        state.results = results;
        state.currentPage = 1;
        
        // Renderizar métricas
        renderMetrics(results);
        
        updateResultsCount(results.length);
        
        if (state.activeTab === 'search') {
            if (viewMode === 'cards') {
                if (typeof renderCards === 'function') renderCards();
            } else {
                renderTable();
            }
            renderPagination();
            if (typeof renderChart === 'function') renderChart();
        } else {
            renderFavoritesTable();
        }
        
        if (results.length === 0 && !onlyActiveFilter) {
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