const API_BASE_URL = 'https://pascua-production.up.railway.app';

let token = null;
let userId = null;
let html5QrCode = null;
let socket = null;
let currentScannerActive = false;
let celebrationTimeout = null;
let sadTimeout = null;

const authSection = document.getElementById('auth-section');
const mainContent = document.getElementById('main-content');
const authForm = document.getElementById('auth-form');
const registerBtn = document.getElementById('register-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const countSpan = document.getElementById('count');
const totalSpan = document.getElementById('total');
const eggsListDiv = document.getElementById('eggs-list');
const messageDiv = document.getElementById('message');
const celebration = document.getElementById('egg-celebration');
const celebrationText = document.getElementById('celebration-text');
const sadFeedback = document.getElementById('sad-feedback');
const sadText = document.getElementById('sad-text');

function isLocalHost(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

function validateApiConfiguration() {
    const currentHost = window.location.hostname;
    const usingLocalApi = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

    if (!isLocalHost(currentHost) && usingLocalApi) {
        authError.textContent = 'Tu frontend esta publicado, pero API_BASE_URL sigue apuntando a localhost. Configura la URL publica de Railway en Netlify.';
        return false;
    }

    return true;
}

function hideEggCelebration() {
    celebration.classList.add('hidden');
}

function hideSadFeedback() {
    sadFeedback.classList.add('hidden');
}

function showEggCelebration(text) {
    hideSadFeedback();
    celebrationText.textContent = text || 'Haz encontrado el premio';
    celebration.classList.remove('hidden');

    clearTimeout(celebrationTimeout);
    celebrationTimeout = setTimeout(() => {
        hideEggCelebration();
    }, 1900);
}

function showSadFeedback(text) {
    hideEggCelebration();
    sadText.textContent = text || 'No lo haz encontrado, sigue buscando';
    sadFeedback.classList.remove('hidden');

    clearTimeout(sadTimeout);
    sadTimeout = setTimeout(() => {
        hideSadFeedback();
    }, 1800);
}

function setAuthenticated(isAuth) {
    if (isAuth) {
        authSection.style.display = 'none';
        mainContent.style.display = 'block';
        loadProgress();
        startScanner();
        connectWebSocket();
        return;
    }

    authSection.style.display = 'block';
    mainContent.style.display = 'none';
    hideEggCelebration();
    hideSadFeedback();

    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        currentScannerActive = false;
    }

    if (socket) {
        socket.disconnect();
    }

    token = null;
    userId = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
}

function showResultMessage(text, variant) {
    messageDiv.textContent = text;
    messageDiv.className = variant;
}

async function authenticate(endpoint) {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        authError.textContent = 'Completa todos los campos';
        return;
    }

    if (!validateApiConfiguration()) {
        return;
    }

    authError.textContent = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            authError.textContent = data.error || 'Error en la autenticacion';
            return;
        }

        token = data.token;
        userId = String(data.userId);
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        setAuthenticated(true);
    } catch (error) {
        console.error(error);
        authError.textContent = 'Error de conexion';
    }
}

authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    authenticate('login');
});

registerBtn.addEventListener('click', () => {
    authenticate('register');
});

logoutBtn.addEventListener('click', () => {
    setAuthenticated(false);
});

async function loadProgress() {
    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/progress`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) {
            console.error(data.error);
            return;
        }

        countSpan.textContent = data.found;
        totalSpan.textContent = data.total;
        eggsListDiv.innerHTML = '';

        for (let i = 1; i <= data.total; i += 1) {
            const found = data.eggs.includes(i);
            const badge = document.createElement('span');
            badge.className = `egg-badge ${found ? 'found' : ''}`;
            badge.textContent = `Premio ${i}`;
            eggsListDiv.appendChild(badge);
        }
    } catch (error) {
        console.error(error);
    }
}

async function handleScanResult(decodedText) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ qrData: decodedText })
        });

        const data = await response.json();

        if (response.ok && data.resultType === 'winning') {
            showResultMessage(data.message, 'success');
            showEggCelebration('Haz encontrado el premio');
            loadProgress();
            return;
        }

        if (response.ok && data.resultType === 'fake') {
            showResultMessage(data.message, 'error');
            showSadFeedback('No lo haz encontrado, sigue buscando');
            return;
        }

        if (data.resultType === 'claimed' || data.resultType === 'already_scanned' || data.resultType === 'fake_repeat') {
            showResultMessage(data.error, 'error');
            return;
        }

        showResultMessage(data.error || 'Ocurrio un error al escanear', 'error');
    } catch (error) {
        console.error(error);
        showResultMessage('Error de conexion con el servidor', 'error');
    }
}

function startScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('qr-reader');
    }

    if (currentScannerActive) {
        return;
    }

    const qrCodeSuccessCallback = async (decodedText) => {
        if (!currentScannerActive) {
            return;
        }

        await html5QrCode.stop();
        currentScannerActive = false;

        await handleScanResult(decodedText);

        setTimeout(() => {
            if (!token) {
                return;
            }

            html5QrCode
                .start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, qrCodeSuccessCallback)
                .then(() => {
                    currentScannerActive = true;
                })
                .catch((error) => {
                    console.error('Error reiniciando escaner:', error);
                });
        }, 3000);
    };

    html5QrCode
        .start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, qrCodeSuccessCallback)
        .then(() => {
            currentScannerActive = true;
        })
        .catch((error) => {
            console.error('Error al iniciar la camara:', error);
            showResultMessage('No se pudo acceder a la camara. Asegurate de dar permisos.', 'error');
        });
}

function connectWebSocket() {
    if (socket) {
        socket.disconnect();
    }

    socket = io(API_BASE_URL);

    socket.on('connect', () => {
        console.log('Conectado al WebSocket');
        socket.emit('authenticate', userId);
    });

    socket.on('new_scan', (data) => {
        const notif = document.createElement('div');
        notif.textContent = data.message;
        notif.style.position = 'fixed';
        notif.style.bottom = '20px';
        notif.style.right = '20px';
        notif.style.background = 'linear-gradient(135deg, #0d5bd8, #071121)';
        notif.style.border = '1px solid rgba(255, 214, 10, 0.35)';
        notif.style.color = '#fff';
        notif.style.padding = '12px 14px';
        notif.style.borderRadius = '14px';
        notif.style.zIndex = '1000';
        notif.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.35)';
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 4000);

        if (String(data.userId) === String(userId) && data.resultType === 'winning') {
            showEggCelebration(`Huevo ${data.eggNumber} encontrado`);
            loadProgress();
        }
    });

    socket.on('disconnect', () => {
        console.log('WebSocket desconectado');
    });
}

const savedToken = localStorage.getItem('token');
const savedUserId = localStorage.getItem('userId');

validateApiConfiguration();

if (savedToken && savedUserId) {
    token = savedToken;
    userId = savedUserId;
    setAuthenticated(true);
}
