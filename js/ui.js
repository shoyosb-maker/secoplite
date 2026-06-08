// ============================================
// UTILIDADES DE UI (toast, loading, tooltip)
// ============================================

function showToast(message, duration = 3000) {
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

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO');
    } catch {
        return 'N/A';
    }
}

function formatDateLong(dateStr) {
    if (!dateStr) return 'No disponible';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return String(dateStr);
    }
}

function formatCurrency(value) {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
}

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

function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count} proceso${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
}

function showError(message) {
    const tbody = document.getElementById('tableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">❌ ${message}</td></tr>`;
    }
}