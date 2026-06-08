// ============================================
// TABLA Y PAGINACIÓN (con vista de tarjetas)
// ============================================

function initPageSizeSelector() {
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.value = state.pageSize;
        
        pageSizeSelect.addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value);
            if (!isNaN(newSize) && newSize !== state.pageSize) {
                changePageSize(newSize);
            }
        });
    }
}

function changePageSize(newSize) {
    const firstItemIndex = (state.currentPage - 1) * state.pageSize;
    state.pageSize = newSize;
    const newPage = Math.floor(firstItemIndex / state.pageSize) + 1;
    state.currentPage = Math.min(newPage, Math.ceil(state.results.length / state.pageSize));
    if (state.currentPage < 1) state.currentPage = 1;
    
    const viewMode = document.getElementById('viewToggle')?.value === 'cards' ? 'cards' : 'table';
    if (viewMode === 'cards') {
        renderCards();
    } else {
        renderTable();
    }
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`📄 Mostrando ${state.pageSize} contratos por página`);
}

// Función para obtener texto de tooltip de participabilidad
function getParticipabilidadTooltip(process) {
    const estado = normalizeText(process.estado_del_procedimiento || '');
    const fechaCierre = new Date(process.fecha_de_recepcion_de);
    const hoy = new Date();
    const codProv = (process.codigoproveedor || '').toLowerCase();
    const idAdj = (process.id_adjudicacion || '').toLowerCase();
    
    const razones = [];
    
    if (estado !== 'abierto' && estado !== 'publicado') {
        razones.push(`• Estado: "${process.estado_del_procedimiento || 'desconocido'}" (debe ser Abierto)`);
    }
    if (fechaCierre < hoy) {
        razones.push(`• Fecha de cierre: ${formatDate(fechaCierre)} (ya venció)`);
    }
    if (codProv && codProv !== 'no definido' && /\d/.test(codProv)) {
        razones.push(`• Ya tiene proveedor asignado: ${process.codigoproveedor}`);
    }
    if (idAdj && idAdj !== 'no adjudicado' && idAdj !== '') {
        razones.push(`• Ya está adjudicado: ${process.id_adjudicacion}`);
    }
    
    if (razones.length === 0) {
        return "✅ ¡Este proceso está activo y puedes participar!";
    }
    return "❌ No puedes participar en este proceso:\n" + razones.join('\n');
}

// Función para obtener badge de competencia
function getCompetenciaBadge(respuestas, manifestantes) {
    const total = parseInt(respuestas) || 0;
    if (total === 0) return { text: '🟢 Baja competencia', class: 'competencia-baja' };
    if (total <= 3) return { text: '🟡 Competencia moderada', class: 'competencia-media' };
    return { text: '🔴 Alta competencia', class: 'competencia-alta' };
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    if (state.results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Realiza una búsqueda para ver resultados</td></tr>';
        return;
    }
    
    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageResults = state.results.slice(start, end);
    
    tbody.innerHTML = pageResults.map(process => renderTableRow(process)).join('');
}

function renderTableRow(process) {
    const getStatusClass = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'abierto' || s === 'activo' || s === 'publicado') return 'status-active';
        if (s === 'adjudicado' || s === 'aprobado' || s === 'seleccionado') return 'status-adjudicado';
        if (s === 'cancelado' || s === 'borrador') return 'status-cancelado';
        return '';
    };
    
    const cleanUnspc = (code) => {
        if (!code || code === 'No definido' || code === 'No Definido' || code === 'UNSPECIFIED') return '';
        return String(code).replace(/^[A-Z0-9]+\./, '').replace(/[^\d]/g, '');
    };
    
    const processId = process.id_del_proceso || 'N/A';
    const entity = process.entidad || 'N/A';
    const title = process.nombre_del_procedimiento || 'Sin título';
    const modality = process.modalidad_de_contratacion || 'N/A';
    const value = formatCurrency(process.precio_base);
    const status = process.estado_del_procedimiento || 'No especificado';
    const statusClass = getStatusClass(process.estado_del_procedimiento);
    const phase = process.fase || 'No especificada';
    const pubDate = formatDate(process.fecha_de_publicacion_del);
    const deadline = formatDate(process.fecha_de_recepcion_de);
    const unspcCode = cleanUnspc(process.codigo_principal_de_categoria);
    const isFav = isFavorite(processId);
    const saveButtonText = isFav ? '⭐ Guardado' : '⭐ Guardar';
    const saveButtonClass = isFav ? 'save-btn saved' : 'save-btn';
    
    // Datos de competencia
    const manifestantes = process.proveedores_que_manifestaron || 0;
    const respuestas = process.conteo_de_respuestas_a_ofertas || 0;
    const visualizaciones = process.visualizaciones_del_procedimiento || 0;
    const competencia = getCompetenciaBadge(respuestas, manifestantes);
    
    const isParticipableProcess = typeof isParticipable === 'function' && isParticipable(process);
    const participableBadge = isParticipableProcess ? '<span class="participable-badge" title="Puedes participar en este proceso">🔴 Participa</span><br>' : '';
    const tooltipTitle = getParticipabilidadTooltip(process);
    
    return `
        <tr class="clickable-row" data-id="${escapeHtml(processId)}" title="${escapeHtml(tooltipTitle)}">
            <td>
                <div class="process-id">${escapeHtml(processId)}</div>
                <div class="process-entity">${escapeHtml(entity)}</div>
                ${participableBadge}
            </td>
            <td>
                <div class="process-title">${escapeHtml(title)}</div>
                <div class="process-modality">${escapeHtml(modality)}</div>
            </td>
            <td class="process-value">${value}</td>
            <td>
                <span class="status-badge ${statusClass}">${escapeHtml(status)}</span>
                ${respuestas > 0 ? `<div class="competencia-badge ${competencia.class}" title="${respuestas} ofertas presentadas, ${manifestantes} manifestaron interés">${competencia.text}</div>` : ''}
            </td>
            <td><span class="phase-badge">${escapeHtml(phase)}</span></td>
            <td>${pubDate}</td>
            <td>${deadline}</td>
            <td>${unspcCode ? `<span class="unspc-badge">${unspcCode}</span>` : 'N/A'}</td>
            <td><button class="${saveButtonClass}" data-id="${escapeHtml(processId)}">${saveButtonText}</button></td>
        </tr>
    `;
}

// Función: Renderizado de tarjetas
function renderCards() {
    const container = document.getElementById('cardsContainer');
    if (!container) return;
    
    if (state.results.length === 0) {
        container.innerHTML = '<div class="empty-state">Realiza una búsqueda para ver resultados</div>';
        return;
    }
    
    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageResults = state.results.slice(start, end);
    
    container.innerHTML = pageResults.map(process => renderCard(process)).join('');
    
    attachCardEvents();
}

function renderCard(process) {
    const formatCurrencyShort = (value) => {
        const num = Number(value) || 0;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
        return `$${num.toLocaleString('es-CO')}`;
    };
    
    const cleanUnspc = (code) => {
        if (!code || code === 'No definido') return '';
        return String(code).replace(/^[A-Z0-9]+\./, '').replace(/[^\d]/g, '');
    };
    
    const processId = process.id_del_proceso || 'N/A';
    const entity = process.entidad || 'N/A';
    const title = process.nombre_del_procedimiento || 'Sin título';
    const value = formatCurrencyShort(process.precio_base);
    const status = process.estado_del_procedimiento || 'No especificado';
    const statusClass = status === 'Abierto' ? 'status-active' : '';
    const phase = process.fase || 'No especificada';
    const pubDate = formatDate(process.fecha_de_publicacion_del);
    const deadline = formatDate(process.fecha_de_recepcion_de);
    const isFav = isFavorite(processId);
    const saveButtonText = isFav ? '⭐ Guardado' : '⭐ Guardar';
    const saveButtonClass = isFav ? 'save-btn saved' : 'save-btn';
    const isParticipableProcess = typeof isParticipable === 'function' && isParticipable(process);
    const tooltipTitle = getParticipabilidadTooltip(process);
    
    // Datos de competencia
    const manifestantes = process.proveedores_que_manifestaron || 0;
    const respuestas = process.conteo_de_respuestas_a_ofertas || 0;
    const visualizaciones = process.visualizaciones_del_procedimiento || 0;
    const competencia = getCompetenciaBadge(respuestas, manifestantes);
    
    return `
        <div class="card-item" data-id="${escapeHtml(processId)}" title="${escapeHtml(tooltipTitle)}">
            <div class="card-header">
                <div class="card-title">${escapeHtml(title)}</div>
                ${isParticipableProcess ? '<span class="participable-badge-card">🔴 Participa</span>' : ''}
            </div>
            <div class="card-body">
                <div class="card-entity">🏢 ${escapeHtml(entity)}</div>
                <div class="card-meta-grid">
                    <span>📅 Pub: ${pubDate}</span>
                    <span>⏰ Cierre: ${deadline}</span>
                    <span>💰 ${value}</span>
                    <span>📋 ${escapeHtml(phase)}</span>
                </div>
                <div class="card-status">
                    <span class="status-badge ${statusClass}">${escapeHtml(status)}</span>
                </div>
                <div class="card-competencia">
                    <div class="competencia-item">
                        <span>📊 Ofertas:</span>
                        <strong>${respuestas}</strong>
                    </div>
                    <div class="competencia-item">
                        <span>👥 Interesados:</span>
                        <strong>${manifestantes}</strong>
                    </div>
                    <div class="competencia-item">
                        <span>👁️ Vistas:</span>
                        <strong>${visualizaciones}</strong>
                    </div>
                </div>
                ${respuestas > 0 ? `<div class="competencia-badge-small ${competencia.class}">${competencia.text}</div>` : ''}
            </div>
            <div class="card-footer">
                <button class="${saveButtonClass}" data-id="${escapeHtml(processId)}">${saveButtonText}</button>
                <button class="card-details-btn" data-id="${escapeHtml(processId)}">Ver detalles</button>
            </div>
        </div>
    `;
}

function attachCardEvents() {
    document.querySelectorAll('.card-item').forEach(card => {
        card.removeEventListener('click', handleCardClick);
        card.addEventListener('click', handleCardClick);
    });
    
    document.querySelectorAll('.card-details-btn').forEach(btn => {
        btn.removeEventListener('click', handleCardDetailsClick);
        btn.addEventListener('click', handleCardDetailsClick);
    });
}

function handleCardClick(event) {
    if (event.target.closest('.save-btn')) return;
    if (event.target.closest('.card-details-btn')) return;
    
    const card = event.target.closest('.card-item');
    if (!card) return;
    
    const processId = card.getAttribute('data-id');
    if (processId && processId !== 'N/A') {
        const process = state.results.find(p => p.id_del_proceso === processId);
        if (process) showModal(process);
    }
}

function handleCardDetailsClick(event) {
    event.stopPropagation();
    const btn = event.target.closest('.card-details-btn');
    if (!btn) return;
    
    const processId = btn.getAttribute('data-id');
    if (processId && processId !== 'N/A') {
        const process = state.results.find(p => p.id_del_proceso === processId);
        if (process) showModal(process);
    }
}

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
                const viewMode = document.getElementById('viewToggle')?.value === 'cards' ? 'cards' : 'table';
                if (viewMode === 'cards') {
                    renderCards();
                } else {
                    renderTable();
                }
                renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

function updateView() {
    const viewMode = document.getElementById('viewToggle')?.value === 'cards' ? 'cards' : 'table';
    const tableContainer = document.querySelector('.table-container');
    const cardsContainer = document.getElementById('cardsContainer');
    
    if (viewMode === 'cards') {
        if (tableContainer) tableContainer.style.display = 'none';
        if (cardsContainer) {
            cardsContainer.style.display = 'grid';
            renderCards();
        }
    } else {
        if (tableContainer) tableContainer.style.display = 'block';
        if (cardsContainer) cardsContainer.style.display = 'none';
        renderTable();
    }
}