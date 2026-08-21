// ============================================
// AUTENTICACIÓN (login, logout, sesión) - SIN INVITADO
// ============================================

function checkSession() {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            if (session.user) {
                loginUser(session.user.email);
            }
        } catch (e) {
            console.error('Error al restaurar sesión:', e);
        }
    }
}

function saveSession() {
    const session = {
        isLoggedIn: state.isLoggedIn,
        user: state.currentUser
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function loginUser(email) {
    console.log('loginUser llamado con:', email);
    state.isLoggedIn = true;
    state.currentUser = { email, role: 'admin' };
    saveSession();
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userEmailDisplay').textContent = email;
    
    showToast(`✅ Bienvenido, ${email}`);
    
    initAppAfterLogin();
}

function logout() {
    state.isLoggedIn = false;
    state.currentUser = null;
    state.results = [];
    state.currentPage = 1;
    state.activeTab = 'search';
    
    clearSession();
    
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    
    showToast('🔒 Sesión cerrada correctamente');
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validateLogin(email, password) {
    if (DEBUG) console.log('🔐 Validando login:', email);
    const passwordHash = await hashPassword(password);
    const user = VALID_USERS.find(u => u.email === email && u.passwordHash === passwordHash);
    if (user) {
        if (DEBUG) console.log('✅ Usuario válido');
        return user;
    }
    if (DEBUG) console.log('❌ Usuario inválido');
    return null;
}

function initLoginSystem() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                showToast('❌ Por favor ingresa correo y contraseña');
                return;
            }
            
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Verificando...';
            
            const user = await validateLogin(email, password);
            if (user) {
                loginUser(email);
            } else {
                showToast('❌ Credenciales incorrectas');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span class="material-symbols-outlined">login</span> Ingresar a SECOP Lite';
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }
    
    const passwordInput = document.getElementById('loginPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }
}