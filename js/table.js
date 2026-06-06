// ============================================
// TABLA Y PAGINACIÓN
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
    
    renderTable();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`📄 Mostrando ${state.pageSize} contratos por página`);
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
    
    console.log(`🎨 Renderizando fila para proceso: ${processId}, isFav: ${isFav}, texto: ${saveButtonText}`);
    
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
            <td><span class="phase-badge">${escapeHtml(phase)}</span></td>
            <td>${pubDate}</td>
            <td>${deadline}</td>
            <td>${unspcCode ? `<span class="unspc-badge">${unspcCode}</span>` : 'N/A'}</td>
            <td><button class="${saveButtonClass}" data-id="${escapeHtml(processId)}" data-testid="save-btn-${escapeHtml(processId)}">${saveButtonText}</button></td>
        </tr>
    `;
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
                renderTable();
                renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}