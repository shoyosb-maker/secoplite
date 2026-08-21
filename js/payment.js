// ============================================
// PASARELA DE PAGOS - ESTRUCTURA BASE
// ============================================

// Configuración de la pasarela
const PAYMENT_CONFIG = {
    // Wompi (para cuando se active)
    wompi: {
        enabled: false,
        apiKey: '',  // Producción
        publicKey: '', // Sandbox / Producción
        sandbox: true  // Modo pruebas
    },
    // Planes de suscripción
    plans: {
        basic: {
            name: 'Básico',
            price: 0,
            features: ['50 búsquedas/mes', 'Filtros básicos', '5 favoritos']
        },
        premium: {
            name: 'Premium',
            price: 15000,
            features: ['Búsquedas ilimitadas', 'Todos los filtros', 'Favoritos ilimitados', 'Exportar a Excel', 'Alertas por email']
        },
        enterprise: {
            name: 'Empresarial',
            price: 50000,
            features: ['Todo lo de Premium', 'API personalizada', 'Soporte prioritario', 'Múltiples usuarios']
        }
    },
    // Estados de pago
    status: {
        PENDING: 'pending',
        APPROVED: 'approved',
        DECLINED: 'declined',
        ERROR: 'error'
    }
};

// Estado del usuario (para control de suscripción)
const paymentState = {
    isSubscribed: false,
    plan: 'basic',
    searchesRemaining: 50,
    subscriptionEndDate: null,
    transactionHistory: []
};

// ============================================
// FUNCIONES BASE (sin API real)
// ============================================

// Mostrar modal de selección de plan
function showPricingModal() {
    // Verificar si el modal ya existe
    let modal = document.getElementById('paymentModal');
    if (!modal) {
        createPaymentModal();
        modal = document.getElementById('paymentModal');
    }
    modal.classList.remove('hidden');
    renderPricingPlans();
}

// Crear el modal de pagos en el DOM
function createPaymentModal() {
    const modalHTML = `
        <div id="paymentModal" class="payment-modal hidden">
            <div class="payment-modal-content">
                <div class="payment-modal-header">
                    <h2>💰 Planes y Suscripciones</h2>
                    <button class="payment-modal-close" onclick="closePaymentModal()">&times;</button>
                </div>
                <div class="payment-modal-body">
                    <div id="pricingPlansContainer" class="pricing-plans-grid">
                        <!-- Los planes se renderizan aquí -->
                    </div>
                    <div id="paymentStatus" class="payment-status hidden"></div>
                </div>
                <div class="payment-modal-footer">
                    <button class="payment-footer-btn" onclick="closePaymentModal()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar al DOM
    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);
}

// Renderizar los planes de suscripción
function renderPricingPlans() {
    const container = document.getElementById('pricingPlansContainer');
    if (!container) return;
    
    const plans = PAYMENT_CONFIG.plans;
    container.innerHTML = Object.keys(plans).map(planKey => {
        const plan = plans[planKey];
        const isCurrentPlan = paymentState.plan === planKey;
        const buttonText = isCurrentPlan ? 'Plan actual' : (plan.price === 0 ? 'Gratis' : `Suscripción por $${plan.price.toLocaleString()} COP/mes`);
        const buttonDisabled = isCurrentPlan ? 'disabled' : '';
        
        return `
            <div class="pricing-plan-card ${isCurrentPlan ? 'current-plan' : ''}">
                <div class="plan-name">${plan.name}</div>
                <div class="plan-price">${plan.price === 0 ? 'GRATIS' : `$${plan.price.toLocaleString()} COP`}<span class="plan-period">/mes</span></div>
                <ul class="plan-features">
                    ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
                </ul>
                <button class="plan-select-btn" onclick="selectPlan('${planKey}')" ${buttonDisabled}>
                    ${buttonText}
                </button>
            </div>
        `;
    }).join('');
}

// Seleccionar un plan (simula pago)
function selectPlan(planKey) {
    const plan = PAYMENT_CONFIG.plans[planKey];
    
    if (plan.price === 0) {
        // Plan gratuito, activar inmediatamente
        activatePlan(planKey);
        showToast(`✅ Plan ${plan.name} activado correctamente`);
        closePaymentModal();
        return;
    }
    
    // Mostrar simulación de pago
    showPaymentSimulation(plan);
}

// Simular proceso de pago (antes de integrar Wompi)
function showPaymentSimulation(plan) {
    const statusDiv = document.getElementById('paymentStatus');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `
        <div class="payment-loading">
            <div class="spinner"></div>
            <p>Procesando pago de $${plan.price.toLocaleString()} COP...</p>
        </div>
    `;
    statusDiv.classList.remove('hidden');
    
    // Simular tiempo de procesamiento
    setTimeout(() => {
        statusDiv.innerHTML = `
            <div class="payment-success">
                <span class="success-icon">✅</span>
                <p>¡Pago simulado exitosamente!</p>
                <small>Plan ${plan.name} activado. En producción se integrará con Wompi.</small>
            </div>
        `;
        
        // Activar el plan después del "pago"
        setTimeout(() => {
            activatePlan(plan.name.toLowerCase());
            showToast(`✅ Plan ${plan.name} activado correctamente`);
            setTimeout(() => closePaymentModal(), 1500);
        }, 1500);
    }, 2000);
}

// Activar un plan de suscripción
function activatePlan(planKey) {
    const plan = PAYMENT_CONFIG.plans[planKey];
    
    paymentState.plan = planKey;
    paymentState.isSubscribed = planKey !== 'basic';
    
    if (planKey === 'premium' || planKey === 'enterprise') {
        paymentState.searchesRemaining = -1; // Ilimitado
        paymentState.subscriptionEndDate = new Date();
        paymentState.subscriptionEndDate.setMonth(paymentState.subscriptionEndDate.getMonth() + 1);
    } else {
        paymentState.searchesRemaining = 50;
        paymentState.subscriptionEndDate = null;
    }
    
    // Guardar en localStorage
    localStorage.setItem('secop_payment_state', JSON.stringify({
        plan: paymentState.plan,
        isSubscribed: paymentState.isSubscribed,
        searchesRemaining: paymentState.searchesRemaining,
        subscriptionEndDate: paymentState.subscriptionEndDate
    }));
    
    // Actualizar UI
    updatePaymentUI();
}

// Cargar estado de suscripción guardado
function loadPaymentState() {
    const saved = localStorage.getItem('secop_payment_state');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            paymentState.plan = data.plan || 'basic';
            paymentState.isSubscribed = data.isSubscribed || false;
            paymentState.searchesRemaining = data.searchesRemaining || 50;
            paymentState.subscriptionEndDate = data.subscriptionEndDate ? new Date(data.subscriptionEndDate) : null;
        } catch(e) {
            console.error('Error cargando estado de pago:', e);
        }
    }
    updatePaymentUI();
}

// Actualizar elementos de UI relacionados con pagos
function updatePaymentUI() {
    // Actualizar badge de suscripción en el header
    const userInfo = document.querySelector('.user-info');
    if (userInfo && paymentState.isSubscribed) {
        let badge = document.querySelector('.subscription-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'subscription-badge';
            userInfo.insertBefore(badge, userInfo.querySelector('#userEmailDisplay')?.nextSibling);
        }
        badge.textContent = `⭐ ${paymentState.plan.toUpperCase()}`;
        badge.style.display = 'inline-block';
    }
    
    // Mostrar búsquedas restantes si es plan básico
    if (!paymentState.isSubscribed && paymentState.searchesRemaining <= 10) {
        showToast(`⚠️ Te quedan ${paymentState.searchesRemaining} búsquedas gratis. Considera actualizar a Premium.`, 5000);
    }
}

// Cerrar modal de pagos
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.add('hidden');
    const statusDiv = document.getElementById('paymentStatus');
    if (statusDiv) statusDiv.classList.add('hidden');
}

// Verificar si el usuario puede realizar una búsqueda
function canPerformSearch() {
    if (paymentState.isSubscribed) return true;
    if (paymentState.searchesRemaining > 0) return true;
    
    showToast('❌ Has alcanzado el límite de búsquedas gratis. Actualiza a Premium para continuar.', 5000);
    showPricingModal();
    return false;
}

// Decrementar contador de búsquedas (llamar después de cada búsqueda)
function decrementSearchCount() {
    if (!paymentState.isSubscribed && paymentState.searchesRemaining > 0) {
        paymentState.searchesRemaining--;
        localStorage.setItem('secop_payment_state', JSON.stringify({
            plan: paymentState.plan,
            isSubscribed: paymentState.isSubscribed,
            searchesRemaining: paymentState.searchesRemaining,
            subscriptionEndDate: paymentState.subscriptionEndDate
        }));
        updatePaymentUI();
    }
}

// ============================================
// INTEGRACIÓN FUTURA CON WOMPI
// ============================================

// Función preparada para integrar con Wompi
async function processWompiPayment(plan) {
    if (!PAYMENT_CONFIG.wompi.enabled) {
        // Fallback a simulación
        showPaymentSimulation(plan);
        return;
    }
    
    // TODO: Implementar cuando se tenga la API key de Wompi
    // const response = await fetch('https://api.wompi.co/v1/transactions', {
    //     method: 'POST',
    //     headers: { 'Authorization': `Bearer ${PAYMENT_CONFIG.wompi.apiKey}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ amount_in_cents: plan.price * 100, currency: 'COP', ... })
    // });
}

// Función para abrir checkout de Wompi
function openWompiCheckout(plan, transactionId) {
    // TODO: Implementar redirección a checkout de Wompi
    console.log('Abriendo checkout de Wompi para plan:', plan.name);
}