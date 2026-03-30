const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3001';

let adminToken = localStorage.getItem('adminToken');
let adminEmail = localStorage.getItem('adminEmail') || 'Emmanueldavidparabavis@gmail.com';
let socket = null;
let toastTimeout = null;

const authSection = document.getElementById('admin-auth-section');
const adminContent = document.getElementById('admin-content');
const authForm = document.getElementById('admin-auth-form');
const authError = document.getElementById('admin-auth-error');
const emailInput = document.getElementById('admin-email');
const passwordInput = document.getElementById('admin-password');
const logoutBtn = document.getElementById('admin-logout-btn');
const refreshBtn = document.getElementById('refresh-admin-btn');
const adminSessionEmail = document.getElementById('admin-session-email');
const latestScanTitle = document.getElementById('latest-scan-title');
const latestScanCopy = document.getElementById('latest-scan-copy');
const totalScans = document.getElementById('total-scans');
const winningScans = document.getElementById('winning-scans');
const fakeScans = document.getElementById('fake-scans');
const claimedPrizes = document.getElementById('claimed-prizes');
const adminList = document.getElementById('admin-list');
const liveIndicator = document.getElementById('live-indicator');
const toast = document.getElementById('admin-toast');
const toastTitle = document.getElementById('admin-toast-title');
const toastCopy = document.getElementById('admin-toast-copy');

emailInput.value = adminEmail;

function formatDate(dateValue) {
    return new Date(dateValue).toLocaleString('es-BO', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

function setLoggedOutState() {
    authSection.style.display = 'block';
    adminContent.style.display = 'none';
    authError.textContent = '';

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    adminToken = null;
}

function showToast(scan) {
    toastTitle.textContent = scan.scannerEmail;
    toastCopy.textContent = scan.resultType === 'winning'
        ? `Escaneo el huevo premio N°${scan.winningNumber}`
        : `Escaneo el huevo N°${scan.eggNumber}`;

    toast.classList.remove('hidden');
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hidden');
    }, 4500);
}

function updateLatestScan(scan) {
    latestScanTitle.textContent = `${scan.scannerEmail} escaneo el huevo ${scan.resultType === 'winning' ? `premio N°${scan.winningNumber}` : `N°${scan.eggNumber}`}`;
    latestScanCopy.textContent = `${scan.resultType === 'winning' ? 'Escaneo ganador' : 'Escaneo sin premio'} registrado el ${formatDate(scan.scannedAt)}.`;
}

function renderScans(scans) {
    if (!scans.length) {
        adminList.innerHTML = '<article class="admin-empty-state">Todavia no hay escaneos registrados.</article>';
        return;
    }

    adminList.innerHTML = scans.map((scan) => `
        <article class="admin-scan-item ${scan.is_winning ? 'is-winning' : ''}">
            <div class="admin-scan-main">
                <p class="admin-scan-email">${scan.user_email}</p>
                <h4>${scan.is_winning ? `Huevo premio N°${scan.winning_number}` : `Huevo N°${scan.egg_number}`}</h4>
                <p class="admin-scan-meta">QR: ${scan.qr_code_data}</p>
            </div>
            <div class="admin-scan-side">
                <span class="admin-result-badge ${scan.is_winning ? 'winning' : 'fake'}">${scan.is_winning ? 'Premio' : 'Sin premio'}</span>
                <time>${formatDate(scan.scanned_at)}</time>
            </div>
        </article>
    `).join('');
}

function renderOverview(data) {
    totalScans.textContent = data.summary.totalScans;
    winningScans.textContent = data.summary.winningScans;
    fakeScans.textContent = data.summary.fakeScans;
    claimedPrizes.textContent = data.summary.claimedPrizes;
    renderScans(data.scans);

    if (data.scans[0]) {
        updateLatestScan({
            scannerEmail: data.scans[0].user_email,
            eggNumber: data.scans[0].egg_number,
            winningNumber: data.scans[0].winning_number,
            resultType: data.scans[0].is_winning ? 'winning' : 'fake',
            scannedAt: data.scans[0].scanned_at
        });
    }
}

async function loadOverview() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/overview`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                setLoggedOutState();
            }
            authError.textContent = data.error || 'No se pudo cargar el panel';
            return;
        }

        renderOverview(data);
    } catch (error) {
        console.error(error);
        authError.textContent = 'Error de conexion con el panel admin';
    }
}

function connectSocket() {
    if (socket) {
        socket.disconnect();
    }

    socket = io(API_BASE_URL);

    socket.on('connect', () => {
        liveIndicator.textContent = 'En linea';
        socket.emit('authenticate', { token: adminToken });
    });

    socket.on('disconnect', () => {
        liveIndicator.textContent = 'Reconectando';
    });

    socket.on('admin_scan', (scan) => {
        updateLatestScan(scan);
        showToast(scan);
        loadOverview();
    });
}

function setLoggedInState() {
    authSection.style.display = 'none';
    adminContent.style.display = 'block';
    adminSessionEmail.textContent = `Sesion iniciada como ${adminEmail}`;
    loadOverview();
    connectSocket();
}

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        authError.textContent = 'Completa correo y contrasena';
        return;
    }

    authError.textContent = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            authError.textContent = data.error || 'No se pudo iniciar sesion';
            return;
        }

        adminToken = data.token;
        adminEmail = data.admin.email;
        localStorage.setItem('adminToken', adminToken);
        localStorage.setItem('adminEmail', adminEmail);
        passwordInput.value = '';
        setLoggedInState();
    } catch (error) {
        console.error(error);
        authError.textContent = 'Error de conexion';
    }
});

logoutBtn.addEventListener('click', () => {
    setLoggedOutState();
});

refreshBtn.addEventListener('click', () => {
    loadOverview();
});

if (adminToken) {
    setLoggedInState();
}
