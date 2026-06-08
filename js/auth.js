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

function validateLogin(email, password) {
    console.log('🔐 Validando login:', email, password);
    const user = VALID_USERS.find(u => u.email === email && u.password === password);
    if (user) {
        console.log('✅ Usuario válido');
        return user;
    }
    console.log('❌ Usuario inválido');
    return null;
}

function initLoginSystem() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            console.log('📝 Credenciales ingresadas:', email, password);
            
            if (!email || !password) {
                showToast('❌ Por favor ingresa correo y contraseña');
                return;
            }
            
            const user = validateLogin(email, password);
            if (user) {
                loginUser(email);
            } else {
                showToast('❌ Credenciales incorrectas');
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