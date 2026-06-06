// ============================================
// MODAL DE DETALLES
// ============================================

function openSecopPortal() {
    window.open(SECOP_BASE_URL, '_blank');
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

function showModal(process) {
    console.log('📋 Abriendo modal para:', process?.id_del_proceso);
    
    const modal = document.getElementById('processModal');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalBody) {
        console.error('Modal no encontrado');
        return;
    }
    
    if (!process) {
        console.error('No se recibió proceso');
        return;
    }
    
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
    const pubDate = formatDateLong(process.fecha_de_publicacion_del);
    const deadline = formatDateLong(process.fecha_de_recepcion_de);
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
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeModal);
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}