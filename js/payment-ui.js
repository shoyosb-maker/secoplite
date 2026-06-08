// ============================================
// UI DE PAGOS - BOTONES Y ELEMENTOS
// ============================================

// Agregar botón de "Actualizar plan" en el header
function addSubscriptionButton() {
    const userInfo = document.querySelector('.user-info');
    if (!userInfo) return;
    
    // Verificar si ya existe
    if (document.querySelector('.subscription-btn')) return;
    
    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'subscription-btn';
    upgradeBtn.innerHTML = '<span class="material-symbols-outlined">upgrade</span> Planes';
    upgradeBtn.onclick = () => showPricingModal();
    userInfo.appendChild(upgradeBtn);
}

// Mostrar resumen de suscripción en el dashboard (si existe)
function showSubscriptionSummary() {
    const summaryHTML = `
        <div class="subscription-summary">
            <div class="summary-header">
                <span>💰 Mi Suscripción</span>
                <button onclick="showPricingModal()" class="summary-change-btn">Cambiar plan</button>
            </div>
            <div class="summary-body">
                <div class="summary-plan">Plan ${paymentState.plan.toUpperCase()}</div>
                <div class="summary-status">${paymentState.isSubscribed ? 'Activo' : 'Gratuito'}</div>
                ${!paymentState.isSubscribed ? `<div class="summary-searches">Búsquedas restantes: ${paymentState.searchesRemaining}</div>` : ''}
                ${paymentState.subscriptionEndDate ? `<div class="summary-expiry">Vence: ${paymentState.subscriptionEndDate.toLocaleDateString()}</div>` : ''}
            </div>
        </div>
    `;
    
    // Buscar contenedor para insertar (puede ser en el sidebar o footer)
    const chartsContainer = document.getElementById('chartsContainer');
    if (chartsContainer) {
        let summaryDiv = document.querySelector('.subscription-summary');
        if (!summaryDiv) {
            chartsContainer.insertAdjacentHTML('beforebegin', summaryHTML);
        }
    }
}

// Inicializar UI de pagos
function initPaymentUI() {
    addSubscriptionButton();
    showSubscriptionSummary();
}