// ============================================
// MANIFEST EKSPEDISI PRO - Application Logic
// ============================================
// No import needed, using window.supabaseClient from UMD

let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

function checkAuth() {
  const path = window.location.pathname;
  const isAuthPage  = path.includes('login.html');
  const isAdminPage = path.includes('admin.html');
  const isDashboard = path.includes('index.html') || path.endsWith('/') || path.endsWith('manifest-expedisi-pro/');

  // login.html & admin.html punya auth sendiri, skip
  if (isAuthPage || isAdminPage) return;

  // Di dashboard, wajib login
  if (!currentUser && isDashboard) {
    window.location.href = 'login.html';
    return;
  }

  if (currentUser && (currentUser.status === 'pending')) {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
    return;
  }
}

checkAuth();

// ============================================
// EXPEDITION DATABASE
// ============================================

const EXPEDITIONS = {
  'SPX': {
    name: 'Shopee Express (SPX)',
    shortName: 'SPX',
    color: '#ee4d2d',
    icon: '🟠',
    prefixes: ['SPXID', 'SPX', 'SP'],
    bgColor: 'rgba(238, 77, 45, 0.12)',
    borderColor: 'rgba(238, 77, 45, 0.3)',
  },
  'JNE': {
    name: 'JNE Express',
    shortName: 'JNE',
    color: '#d32027',
    icon: '🔴',
    prefixes: ['JNE', 'CGK', 'SOCAG'],
    bgColor: 'rgba(211, 32, 39, 0.12)',
    borderColor: 'rgba(211, 32, 39, 0.3)',
  },
  'J&T': {
    name: 'J&T Express',
    shortName: 'J&T',
    color: '#e31e25',
    icon: '🔴',
    prefixes: ['JT', 'JP', 'JD', 'JX'],
    bgColor: 'rgba(227, 30, 37, 0.12)',
    borderColor: 'rgba(227, 30, 37, 0.3)',
  },
  'SICEPAT': {
    name: 'SiCepat Ekspres',
    shortName: 'SiCepat',
    color: '#c8102e',
    icon: '🔴',
    prefixes: ['SC', 'SCP', 'SICEPAT'],
    bgColor: 'rgba(200, 16, 46, 0.12)',
    borderColor: 'rgba(200, 16, 46, 0.3)',
  },
  'POS': {
    name: 'Pos Indonesia',
    shortName: 'Pos ID',
    color: '#e74c3c',
    icon: '📮',
    prefixes: ['POS', 'PS', 'RI'],
    bgColor: 'rgba(231, 76, 60, 0.12)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  'ANTERAJA': {
    name: 'AnterAja',
    shortName: 'AnterAja',
    color: '#00b14f',
    icon: '🟢',
    prefixes: ['ANT', 'ATJ', '1'],
    bgColor: 'rgba(0, 177, 79, 0.12)',
    borderColor: 'rgba(0, 177, 79, 0.3)',
  },
  'TIKI': {
    name: 'TIKI',
    shortName: 'TIKI',
    color: '#0077b6',
    icon: '🔵',
    prefixes: ['TK', 'TIKI', '03'],
    bgColor: 'rgba(0, 119, 182, 0.12)',
    borderColor: 'rgba(0, 119, 182, 0.3)',
  },
  'LION': {
    name: 'Lion Parcel',
    shortName: 'Lion',
    color: '#dc2626',
    icon: '🦁',
    prefixes: ['LP', 'LION'],
    bgColor: 'rgba(220, 38, 38, 0.12)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  'GOSEND': {
    name: 'GoSend',
    shortName: 'GoSend',
    color: '#00aa13',
    icon: '💚',
    prefixes: ['GK', 'GO', 'GS'],
    bgColor: 'rgba(0, 170, 19, 0.12)',
    borderColor: 'rgba(0, 170, 19, 0.3)',
  },
  'GRAB': {
    name: 'GrabExpress',
    shortName: 'Grab',
    color: '#00b14f',
    icon: '💚',
    prefixes: ['GR', 'GRAB', 'GE'],
    bgColor: 'rgba(0, 177, 79, 0.12)',
    borderColor: 'rgba(0, 177, 79, 0.3)',
  },
  'PAXEL': {
    name: 'Paxel',
    shortName: 'Paxel',
    color: '#5b21b6',
    icon: '🟣',
    prefixes: ['PX', 'PAX', 'PAXEL'],
    bgColor: 'rgba(91, 33, 182, 0.12)',
    borderColor: 'rgba(91, 33, 182, 0.3)',
  },
  'J&T_CARGO': {
    name: 'J&T Cargo',
    shortName: 'J&T Cargo',
    color: '#b91c1c',
    icon: '📦',
    prefixes: ['JC', 'JTCG'],
    bgColor: 'rgba(185, 28, 28, 0.12)',
    borderColor: 'rgba(185, 28, 28, 0.3)',
  },
  'JTR': {
    name: 'JNE Trucking (JTR)',
    shortName: 'JTR',
    color: '#9f1239',
    icon: '🚛',
    prefixes: ['JTR', '42'],
    bgColor: 'rgba(159, 18, 57, 0.12)',
    borderColor: 'rgba(159, 18, 57, 0.3)',
  },
  'NINJA': {
    name: 'Ninja Xpress',
    shortName: 'Ninja',
    color: '#dc2626',
    icon: '🥷',
    prefixes: ['NX', 'NINJA', 'NV'],
    bgColor: 'rgba(220, 38, 38, 0.12)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  'IDEXPRESS': {
    name: 'ID Express',
    shortName: 'ID Exp',
    color: '#ea580c',
    icon: '🟠',
    prefixes: ['IDE', 'IDX', 'ID'],
    bgColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: 'rgba(234, 88, 12, 0.3)',
  },
  'SAP': {
    name: 'SAP Express',
    shortName: 'SAP',
    color: '#0ea5e9',
    icon: '🔵',
    prefixes: ['SAP', 'SEX'],
    bgColor: 'rgba(14, 165, 233, 0.12)',
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  'REX': {
    name: 'REX Express',
    shortName: 'REX',
    color: '#0d9488',
    icon: '🟢',
    prefixes: ['REX', 'RX'],
    bgColor: 'rgba(13, 148, 136, 0.12)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
  },
  'WAHANA': {
    name: 'Wahana Express',
    shortName: 'Wahana',
    color: '#2563eb',
    icon: '🔵',
    prefixes: ['WAH', 'AGT', 'WH'],
    bgColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  'INDAH': {
    name: 'Indah Cargo',
    shortName: 'Indah',
    color: '#059669',
    icon: '📦',
    prefixes: ['ICG', 'INDAH'],
    bgColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  'RPX': {
    name: 'RPX One Stop Logistics',
    shortName: 'RPX',
    color: '#7c3aed',
    icon: '🟣',
    prefixes: ['RPX'],
    bgColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  'SENTRAL': {
    name: 'Sentral Cargo',
    shortName: 'Sentral',
    color: '#ca8a04',
    icon: '📦',
    prefixes: ['STL', 'SENTRAL'],
    bgColor: 'rgba(202, 138, 4, 0.12)',
    borderColor: 'rgba(202, 138, 4, 0.3)',
  },
  'LAZADA': {
    name: 'Lazada Express (LEX)',
    shortName: 'LEX',
    color: '#1a1aff',
    icon: '🔵',
    prefixes: ['LEX', 'LZD', 'LAZ'],
    bgColor: 'rgba(26, 26, 255, 0.12)',
    borderColor: 'rgba(26, 26, 255, 0.3)',
  },
  'TOKOPEDIA': {
    name: 'TokoCabang / Tokopedia',
    shortName: 'Toped',
    color: '#00aa5b',
    icon: '💚',
    prefixes: ['TKP', 'TP'],
    bgColor: 'rgba(0, 170, 91, 0.12)',
    borderColor: 'rgba(0, 170, 91, 0.3)',
  },
  'BORZO': {
    name: 'Borzo (Mr.Speedy)',
    shortName: 'Borzo',
    color: '#f97316',
    icon: '🟠',
    prefixes: ['BRZ', 'BORZO'],
    bgColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  'LALAMOVE': {
    name: 'Lalamove',
    shortName: 'Lalamove',
    color: '#f59e0b',
    icon: '🟡',
    prefixes: ['LLM', 'LALA'],
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  'DELIVEREE': {
    name: 'Deliveree',
    shortName: 'Deliveree',
    color: '#8b5cf6',
    icon: '🟣',
    prefixes: ['DLV', 'DEL'],
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
};

// ============================================
// STATE
// ============================================

let packages = [];
let activityLog = [];
let selectedIds = new Set();
let currentPage = 'dashboard';
let currentExpedition = null;
let scanMode = 'single';
let soundEnabled = true;
let sortField = 'time';
let sortDirection = 'desc';
let tablePage = 1;
const PAGE_SIZE = 20;
let pendingConfirmAction = null;

// ============================================
// INITIALIZATION
// ============================================

async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  // Langkah 1: Load dari localStorage + render awal (instan)
  await loadFromStorage();

  initTheme();
  populateExpeditionNav();
  populateExpeditionFilter();
  updateAllStats();
  renderChart();
  renderActivity();
  refreshCurrentView();

  // Render User Profile di sidebar
  if (currentUser) {
    const name = currentUser.name || currentUser.username || 'User';
    const avatar = document.querySelector('.sidebar-footer-avatar');
    const nameEl = document.querySelector('.sidebar-footer-details strong');
    const roleEl = document.querySelector('.sidebar-footer-details span');

    if (avatar) avatar.textContent = name.substring(0, 2).toUpperCase();
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = (currentUser.role === 'developer') ? '⭐ Super Admin' : '👤 Operator';

    if (currentUser.role === 'developer') {
      const devNav = document.getElementById('navDeveloperPanel');
      if (devNav) devNav.style.display = 'flex';
    }
  }

  // Focus scan input
  setTimeout(() => {
    const input = document.getElementById('resiInput');
    if (input) input.focus();
  }, 100);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      document.getElementById('globalSearch').focus();
    }
  });
}

// ============================================
// STORAGE (SUPABASE PRO)
// ============================================

async function syncPackageToSupabase(action, pkg) {
  try {
    if (!window.supabaseClient) return;
    // Map fields specifically to match both the old and new schema
    // If the database doesn't have the new columns yet, this will STILL throw an error
    // which we will now prominently display to the user.
    const dbPkg = {
      id: pkg.id,
      resi: pkg.resi,
      expedition: pkg.expeditionKey || pkg.expedition,
      timestamp: pkg.scannedAt || new Date().toISOString(),
      // Advanced columns (will cause error if user hasn't run the SQL)
      scanned_by_name: pkg.scanned_by_name,
      printed: pkg.printed || false,
      pickupStatus: pkg.pickupStatus || 'ready'
    };

    let errorObj = null;

    if (action === 'insert') {
      const { error } = await window.supabaseClient.from('packages').insert(dbPkg);
      errorObj = error;
    }
    if (action === 'update') {
      const { error } = await window.supabaseClient.from('packages').update(dbPkg).eq('id', pkg.id);
      errorObj = error;
    }
    if (action === 'delete') {
      const { error } = await window.supabaseClient.from('packages').delete().eq('id', pkg.id);
      errorObj = error;
    }

    if (errorObj) {
      console.error("Supabase Sync Error:", errorObj);
      showToast("❌ Gagal Simpan ke Cloud: Kolom Database Belum Lengkap! Harap jalankan SQL Update.", "error");
    }
  } catch (err) { console.warn('Sync error:', err.message); }
}

async function syncActivityToSupabase(act) {
  try {
    if (!window.supabaseClient) return;
    const dbAct = {
      id: generateId(),
      type: act.type,
      description: act.message, // FIX: Supabase table uses 'description', app uses 'message'
      timestamp: act.timestamp
    };
    const { error } = await window.supabaseClient.from('activities').insert(dbAct);
    if (error) console.error("Activity Sync Error:", error);
  } catch (err) { console.error(err); }
}

function saveToStorage() {
  // Simpan ke localStorage sebagai backup agar tidak hilang saat refresh
  try {
    localStorage.setItem('manifest_packages',    JSON.stringify(packages));
    localStorage.setItem('manifest_activity',    JSON.stringify(activityLog.slice(0, 100)));
  } catch(e) { /* storage penuh, lewati */ }
}

async function loadFromStorage() {
  // ── Langkah 1: Muat dari localStorage dulu (instan, tidak perlu tunggu jaringan)
  try {
    const localPkgs = JSON.parse(localStorage.getItem('manifest_packages') || '[]');
    const localActs = JSON.parse(localStorage.getItem('manifest_activity') || '[]');
    if (localPkgs.length > 0) { packages = localPkgs; activityLog = localActs; }
  } catch(e) {}

  // ── Langkah 2: Ambil data terbaru dari Supabase (sinkronisasi)
  try {
    if (!window.supabaseClient) return;

    // Coba urutan berdasar scannedAt dulu, fallback ke created_at
    let { data: pkgs, error: errPkg } = await window.supabaseClient
      .from('packages')
      .select('*')
      .order('scannedAt', { ascending: false });

    if (errPkg) {
      // Kolom scannedAt belum ada, coba fallback
      const res2 = await window.supabaseClient
        .from('packages')
        .select('*');
      pkgs = res2.data;
    }

    if (pkgs && pkgs.length > 0) {
      // Map data to ensure compatibility with older database schema
      packages = pkgs.map(p => ({
        id: p.id,
        resi: p.resi,
        expeditionKey: p.expeditionKey || p.expedition,
        expeditionName: p.expeditionName || (EXPEDITIONS[p.expedition] ? EXPEDITIONS[p.expedition].name : p.expedition),
        scannedAt: p.scannedAt || p.timestamp,
        printed: p.printed || false,
        pickupStatus: p.pickupStatus || 'ready',
        selected: false,
        scanned_by: p.scanned_by || null,
        scanned_by_name: p.scanned_by_name || 'Admin'
      }));
      // Sort manually just in case fallback was used
      packages.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
      saveToStorage(); // update localStorage dari data cloud
    }

    const { data: acts } = await window.supabaseClient
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (acts && acts.length > 0) activityLog = acts;

  } catch (e) {
    console.warn('Supabase load failed, pakai data lokal:', e);
    // Data dari localStorage sudah dimuat di langkah 1, aman.
  }
}

// ============================================
// CLOCK
// ============================================

function updateClock() {
  const now = new Date();
  const options = {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  };
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
  document.getElementById('clockTime').textContent = 
    `${dateStr} • ${now.toLocaleTimeString('id-ID', options)}`;
}

// ============================================
// EXPEDITION DETECTION
// ============================================

function detectExpedition(resi) {
  const upperResi = resi.toUpperCase().trim();

  // Sort expeditions by prefix length (longer first for accuracy)
  const sortedExpeditions = Object.entries(EXPEDITIONS)
    .flatMap(([key, exp]) => 
      exp.prefixes.map(prefix => ({ key, prefix, len: prefix.length }))
    )
    .sort((a, b) => b.len - a.len);

  for (const { key, prefix } of sortedExpeditions) {
    if (upperResi.startsWith(prefix)) {
      return key;
    }
  }

  return null;
}

// ============================================
// SCAN PROCESSING
// ============================================

function processResi() {
  const input = document.getElementById('resiInput');
  const select = document.getElementById('scanExpeditionSelect');
  const resi = input.value;
  const expOverride = select ? select.value : 'AUTO';
  if (addResi(resi, 'scanFeedback', expOverride)) {
    input.value = '';
  }
  input.focus();
}

function processResiFocus() {
  const input = document.getElementById('resiInputFocus');
  const select = document.getElementById('scanExpeditionSelectFocus');
  const resi = input.value;
  const expOverride = select ? select.value : 'AUTO';
  if (addResi(resi, 'scanFeedbackFocus', expOverride)) {
    input.value = '';
  }
  input.focus();
  updateLastScannedList();
}

function handleScanKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    // Determine which input triggered this
    if (e.target.id === 'resiInputFocus') {
      processResiFocus();
    } else {
      processResi();
    }
  }
}

function addResi(resi, feedbackId, expOverride = 'AUTO') {
  resi = resi.trim();
  if (!resi) return false;

  // Check duplicate - ENHANCED WITH DRAMATIC WARNING
  const existingPkg = packages.find(p => p.resi.toUpperCase() === resi.toUpperCase());
  if (existingPkg) {
    // Show dramatic duplicate warning
    showDuplicateWarning(resi, existingPkg);
    showFeedback(feedbackId, 'error', `🚫 DUPLIKAT! Resi <strong>${resi}</strong> sudah pernah di-scan sebelumnya!`);
    playSound('duplicate');

    // Flash the scan input red
    const inputs = document.querySelectorAll('.scan-input');
    inputs.forEach(inp => {
      inp.classList.add('duplicate-flash');
      setTimeout(() => inp.classList.remove('duplicate-flash'), 1500);
    });

    // Flash the main content
    const mainContent = document.getElementById('mainContent');
    mainContent.classList.add('screen-flash-red');
    setTimeout(() => mainContent.classList.remove('screen-flash-red'), 600);

    addActivityLog('duplicate', `⚠️ TERDEKSI DOBLE RESI ⚠️: Resi <strong>${resi}</strong> sudah ada!`);
    return false;
  }

  let expeditionKey;
  if (expOverride && expOverride !== 'AUTO') {
    expeditionKey = expOverride;
  } else {
    expeditionKey = detectExpedition(resi);
  }

  if (!expeditionKey) {
    showFeedback(feedbackId, 'error', `❌ <strong>Resi tidak dikenali!</strong><br>Pastikan nomor resi benar, atau pilih Ekspedisi secara manual dari Dropdown.`);
    playSound('error');
    const inputs = document.querySelectorAll('.scan-input');
    inputs.forEach(inp => {
      inp.classList.add('duplicate-flash');
      setTimeout(() => inp.classList.remove('duplicate-flash'), 1500);
    });
    return false;
  }

  const expedition = EXPEDITIONS[expeditionKey];

  const pkg = {
    id: generateId(),
    resi: resi.toUpperCase(),
    expeditionKey: expeditionKey,
    expeditionName: expedition.name,
    scannedAt: new Date().toISOString(),
    printed: false,
    pickupStatus: 'ready',
    selected: false,
    scanned_by: currentUser ? currentUser.id : null,
    scanned_by_name: currentUser ? (currentUser.name || currentUser.username) : 'Unknown'
  };

  packages.unshift(pkg);
  syncPackageToSupabase('insert', pkg);

  showFeedback(feedbackId, 'success', `✅ Resi <strong>${resi}</strong> berhasil ditambahkan ke <strong>${expedition.name}</strong>`);
  playSound('success');

  addActivityLog('scan', `Resi <strong>${resi}</strong> di-scan → <strong>${expedition.shortName}</strong>`);

  saveToStorage();
  updateAllStats();
  renderChart();
  renderActivity();
  refreshCurrentView();

  return true;
}

// Duplicate Warning Modal
function showDuplicateWarning(resi, existingPkg) {
  const overlay = document.getElementById('duplicateOverlay');
  const exp = EXPEDITIONS[existingPkg.expeditionKey];
  const scanDate = new Date(existingPkg.scannedAt);

  document.getElementById('duplicateResiText').textContent = resi.toUpperCase();
  document.getElementById('duplicateInfoText').textContent =
    'Resi ini sudah pernah di-scan sebelumnya! Paket tidak boleh di-scan dua kali.';

  document.getElementById('duplicateDetailBox').innerHTML = `
    <div>📦 <strong>Ekspedisi:</strong> ${exp.icon} ${exp.name}</div>
    <div>📅 <strong>Waktu Scan:</strong> ${scanDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} pukul ${scanDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
    <div>📦 <strong>Status Pickup:</strong> ${existingPkg.printed ? '✅ Sudah di Pickup' : '⏳ Belum di Pickup'}</div>
    <div style="margin-top: 8px;">Mendeteksi scan duplikat untuk resi yang sama.</div> ${getPickupLabel(existingPkg.pickupStatus)}</div>
  `;

  overlay.classList.add('active');
}

function closeDuplicateWarning() {
  const overlay = document.getElementById('duplicateOverlay');
  overlay.classList.remove('active');
  // Refocus scan input
  const input = document.getElementById('resiInput') || document.getElementById('resiInputFocus');
  if (input) input.focus();
}

function processBulkResi() {
  const textarea = document.getElementById('bulkInput');
  const select = document.getElementById('scanExpeditionSelect');
  const expOverride = select ? select.value : 'AUTO';
  processBulk(textarea, 'scanFeedback', expOverride);
}

function processBulkResiFocus() {
  const textarea = document.getElementById('bulkInputFocus');
  const select = document.getElementById('scanExpeditionSelectFocus');
  const expOverride = select ? select.value : 'AUTO';
  processBulk(textarea, 'scanFeedbackFocus', expOverride);
}

function processBulk(textarea, feedbackId, expOverride = 'AUTO') {
  const text = textarea.value.trim();
  if (!text) return;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let added = 0;
  let duplicates = 0;

  lines.forEach(resi => {
    if (packages.some(p => p.resi.toUpperCase() === resi.toUpperCase())) {
      duplicates++;
    } else {
      let expeditionKey;
      if (expOverride && expOverride !== 'AUTO') {
        expeditionKey = expOverride;
      } else {
        expeditionKey = detectExpedition(resi);
      }
      
      if (!expeditionKey) {
        // Skip unknown resi in bulk
        return;
      }
      
      const expedition = EXPEDITIONS[expeditionKey];
      const pkgToInsert = {
        id: generateId(),
        resi: resi.toUpperCase(),
        expeditionKey,
        expeditionName: expedition.name,
        scannedAt: new Date().toISOString(),
        printed: false,
        pickupStatus: 'ready',
        selected: false
      };
      packages.unshift(pkgToInsert);
      syncPackageToSupabase('insert', pkgToInsert);
      added++;
    }
  });

  if (added > 0) {
    showFeedback(feedbackId, 'success', `✅ ${added} resi berhasil ditambahkan${duplicates > 0 ? `, ${duplicates} duplikat diabaikan` : ''}`);
    playSound('success');
    addActivityLog('bulk', `Bulk scan: <strong>${added}</strong> resi ditambahkan`);
  } else {
    showFeedback(feedbackId, 'warning', `⚠️ Semua ${duplicates} resi sudah ada dalam daftar`);
    playSound('error');
  }

  textarea.value = '';
  saveToStorage();
  updateAllStats();
  renderChart();
  renderActivity();
  refreshCurrentView();
}

// ============================================
// SCAN MODE
// ============================================

let html5QrcodeScanner = null;

function setScanMode(mode) {
  scanMode = mode;
  const btns = document.querySelectorAll('.scan-mode-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  btns.forEach(btn => {
    if (btn.textContent.toLowerCase() === mode) btn.classList.add('active');
  });

  // Toggle visibility for dashboard scan
  const singleMode = document.getElementById('singleScanMode');
  const bulkMode = document.getElementById('bulkScanMode');
  const cameraMode = document.getElementById('cameraScanMode');
  
  if (singleMode) singleMode.style.display = mode === 'single' ? 'flex' : 'none';
  if (bulkMode) bulkMode.style.display = mode === 'bulk' ? 'block' : 'none';
  if (cameraMode) cameraMode.style.display = mode === 'camera' ? 'block' : 'none';

  // Toggle visibility for focus scan
  const singleFocus = document.getElementById('singleScanModeFocus');
  const bulkFocus = document.getElementById('bulkScanModeFocus');
  const cameraFocus = document.getElementById('cameraScanModeFocus'); // Optional future
  
  if (singleFocus) singleFocus.style.display = mode === 'single' ? 'flex' : 'none';
  if (bulkFocus) bulkFocus.style.display = mode === 'bulk' ? 'block' : 'none';

  if (html5QrcodeScanner && mode !== 'camera') {
    html5QrcodeScanner.clear().catch(error => console.error("Failed to clear scanner", error));
    html5QrcodeScanner = null;
  }

  if (mode === 'camera') {
    startCameraScanner();
  }
}

function startCameraScanner() {
  if (!html5QrcodeScanner) {
    html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 100 } },
      /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  }
}

let expQrcodeScanner = null;

function toggleExpeditionCamera(key) {
  const container = document.getElementById('reader-expedition');
  
  if (expQrcodeScanner) {
    // If running, stop it
    expQrcodeScanner.clear().then(() => {
      expQrcodeScanner = null;
      container.style.display = 'none';
    }).catch(err => console.error("Failed to clear expedition scanner", err));
    return;
  }

  // Show container and start
  container.style.display = 'block';
  expQrcodeScanner = new Html5QrcodeScanner(
    "reader-expedition",
    { fps: 10, qrbox: { width: 250, height: 100 } },
    false
  );
  
  expQrcodeScanner.render((decodedText) => {
    playSound('beep');
    addResi(decodedText, 'scanFeedback', key); // Use explicitly passed key!
    
    // Pause briefly
    expQrcodeScanner.pause();
    setTimeout(() => {
      if (expQrcodeScanner) expQrcodeScanner.resume();
    }, 2000);
  }, onScanFailure);
}

function onScanSuccess(decodedText, decodedResult) {
  playSound('beep');
  
  const input = document.getElementById('resiInput');
  if (input) {
    input.value = decodedText;
    processResi(); // Auto enter
  }
  
  // Pause scanner to prevent rapid firing
  if (html5QrcodeScanner) html5QrcodeScanner.pause();
  
  // Resume after 2 seconds
  setTimeout(() => {
    if (html5QrcodeScanner) html5QrcodeScanner.resume();
  }, 2000);
}

function onScanFailure(error) {
  // Ignore
}

// ============================================
// FULLSCREEN
// ============================================

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(page, expeditionKey) {
  currentPage = page;
  currentExpedition = expeditionKey || null;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

  // Show target page
  if (page === 'expedition' && expeditionKey) {
    document.getElementById('page-expedition').style.display = 'block';
    renderExpeditionDetail(expeditionKey);
  } else {
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.style.display = 'block';
  }

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeNav) activeNav.classList.add('active');
  if (expeditionKey) {
    const expNav = document.querySelector(`.nav-item[data-expedition="${expeditionKey}"]`);
    if (expNav) expNav.classList.add('active');
  }

  // Update header title
  const titles = {
    'dashboard': '<span>📊</span> Dashboard',
    'scan': '<span>📷</span> Scan Resi',
    'all-packages': '<span>📋</span> Semua Paket',
    'unprinted': '<span>🖨️</span> Belum di Pickup',
    'printed': '<span>✅</span> Sudah di Pickup',
    'activity': '<span>📝</span> Riwayat Aktivitas',
  };
  document.getElementById('headerTitle').innerHTML = titles[page] || 
    (expeditionKey ? `<span>${EXPEDITIONS[expeditionKey]?.icon || '📦'}</span> ${EXPEDITIONS[expeditionKey]?.name || 'Ekspedisi'}` : 'Dashboard');

  // Refresh view data
  refreshCurrentView();

  // Close mobile sidebar
  closeSidebar();
}

function refreshCurrentView() {
  switch (currentPage) {
    case 'all-packages': renderAllPackagesTable(); break;
    case 'unprinted': renderUnprintedTable(); break;
    case 'printed': renderPrintedTable(); break;
    case 'expedition': renderExpeditionDetail(currentExpedition); break;
    case 'scan': updateLastScannedList(); break;
    case 'activity': renderFullActivity(); break;
  }
}

// ============================================
// SIDEBAR
// ============================================

function populateExpeditionNav() {
  const container = document.getElementById('expedisiNavList');
  if (container) container.innerHTML = '';

  const scanSelect1 = document.getElementById('scanExpeditionSelect');
  const scanSelect2 = document.getElementById('scanExpeditionSelectFocus');
  let optionsHtml = '<option value="AUTO">✨ Auto Detect (Otomatis)</option>';

  Object.entries(EXPEDITIONS).forEach(([key, exp]) => {
    // Populate Navigation
    if (container) {
      const count = packages.filter(p => p.expeditionKey === key).length;
      const item = document.createElement('div');
      item.className = 'nav-item';
      item.setAttribute('data-page', 'expedition');
      item.setAttribute('data-expedition', key);
      item.onclick = () => navigateTo('expedition', key);
      item.innerHTML = `
        <span class="expedisi-dot" style="background: ${exp.color}"></span>
        <span>${exp.shortName}</span>
        ${count > 0 ? `<span class="nav-item-badge">${count}</span>` : ''}
      `;
      container.appendChild(item);
    }
    
    // Build options string for select dropdowns
    optionsHtml += `<option value="${key}">${exp.icon} ${exp.name}</option>`;
  });

  if (scanSelect1) scanSelect1.innerHTML = optionsHtml;
  if (scanSelect2) scanSelect2.innerHTML = optionsHtml;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// ============================================
// STATISTICS
// ============================================

function updateAllStats() {
  const today = new Date().toDateString();
  const todayPackages = packages.filter(p => new Date(p.scannedAt).toDateString() === today);

  animateNumber('stat-total', todayPackages.length);
  animateNumber('stat-printed', todayPackages.filter(p => p.printed).length);
  animateNumber('stat-unprinted', todayPackages.filter(p => !p.printed).length);

  const activeExpeditions = new Set(todayPackages.map(p => p.expeditionKey));
  animateNumber('stat-expedisi', activeExpeditions.size);

  // Badges
  document.getElementById('badge-total').textContent = packages.length;
  document.getElementById('badge-unprinted').textContent = packages.filter(p => !p.printed).length;
  document.getElementById('badge-printed').textContent = packages.filter(p => p.printed).length;

  // Update sidebar expedition counts
  populateExpeditionNav();
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const duration = 500;
  const steps = 20;
  const increment = (target - current) / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    if (step >= steps) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.round(current + increment * step);
    }
  }, duration / steps);
}

// ============================================
// FILTERS
// ============================================

function populateExpeditionFilter() {
  const select = document.getElementById('filterExpedisi');
  select.innerHTML = '<option value="all">Semua Ekspedisi</option>';
  Object.entries(EXPEDITIONS).forEach(([key, exp]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = exp.name;
    select.appendChild(opt);
  });
}

function getFilteredPackages() {
  let filtered = [...packages];

  const expFilter = document.getElementById('filterExpedisi')?.value;
  const statusFilter = document.getElementById('filterStatus')?.value;
  const pickupFilter = document.getElementById('filterPickup')?.value;
  const dateFrom = document.getElementById('filterDateFrom')?.value;
  const dateTo = document.getElementById('filterDateTo')?.value;

  if (expFilter && expFilter !== 'all') {
    filtered = filtered.filter(p => p.expeditionKey === expFilter);
  }
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(p => statusFilter === 'printed' ? p.printed : !p.printed);
  }
  if (pickupFilter && pickupFilter !== 'all') {
    filtered = filtered.filter(p => p.pickupStatus === pickupFilter);
  }
  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    filtered = filtered.filter(p => new Date(p.scannedAt) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter(p => new Date(p.scannedAt) <= to);
  }

  // Sort
  filtered.sort((a, b) => {
    let valA, valB;
    switch (sortField) {
      case 'resi': valA = a.resi; valB = b.resi; break;
      case 'expedisi': valA = a.expeditionName; valB = b.expeditionName; break;
      case 'print': valA = a.printed ? 1 : 0; valB = b.printed ? 1 : 0; break;
      case 'pickup': valA = a.pickupStatus; valB = b.pickupStatus; break;
      default: valA = a.scannedAt; valB = b.scannedAt;
    }
    if (sortDirection === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  return filtered;
}

function applyFilters() {
  tablePage = 1;
  renderAllPackagesTable();
}

function resetFilters() {
  document.getElementById('filterExpedisi').value = 'all';
  document.getElementById('filterStatus').value = 'all';
  document.getElementById('filterPickup').value = 'all';
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  // Reset calendar picker buttons
  const fromText = document.getElementById('filterDateFromText');
  const toText = document.getElementById('filterDateToText');
  const fromBtn = document.getElementById('filterDateFromBtn');
  const toBtn = document.getElementById('filterDateToBtn');
  if (fromText) fromText.textContent = 'Pilih Tanggal';
  if (toText) toText.textContent = 'Pilih Tanggal';
  if (fromBtn) fromBtn.classList.remove('has-value');
  if (toBtn) toBtn.classList.remove('has-value');
  tablePage = 1;
  renderAllPackagesTable();
}

function sortTable(field) {
  if (sortField === field) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDirection = 'asc';
  }
  renderAllPackagesTable();
}

// ============================================
// TABLE RENDERING
// ============================================

function renderAllPackagesTable() {
  const filtered = getFilteredPackages();
  const tbody = document.getElementById('packageTableBody');
  const empty = document.getElementById('tableEmpty');
  const pagination = document.getElementById('tablePagination');

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (tablePage > totalPages) tablePage = totalPages || 1;

  const start = (tablePage - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  document.getElementById('tableCount').textContent = `${filtered.length} paket`;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    pagination.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  pagination.style.display = 'flex';

  tbody.innerHTML = pageData.map((pkg, i) => {
    const exp = EXPEDITIONS[pkg.expeditionKey];
    const scanDate = new Date(pkg.scannedAt);
    const isSelected = selectedIds.has(pkg.id);

    return `
      <tr data-id="${pkg.id}" style="animation: slideDown 0.2s ease ${i * 0.02}s both;">
        <td>
          <div class="custom-checkbox ${isSelected ? 'checked' : ''}" 
               onclick="toggleSelect('${pkg.id}')"></div>
        </td>
        <td>${start + i + 1}</td>
        <td><span class="resi-number">${pkg.resi}</span></td>
        <td>
          <span class="expedisi-badge" style="background: ${exp.bgColor}; color: ${exp.color}; border: 1px solid ${exp.borderColor};">
            ${exp.icon} ${exp.shortName}
          </span>
        </td>
        <td>
          <div class="time-stamp">
            <span class="date">${scanDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>${scanDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${pkg.printed ? 'printed' : 'unprinted'}" 
                onclick="togglePrint('${pkg.id}')">
            ${pkg.printed ? '✅ Sudah di Pickup' : '⏳ Belum di Pickup'}
          </span>
        </td>
        <td>
          <div class="action-btn-group">
            <button class="row-action-btn" onclick="window.openDetailModal('${pkg.id}')" title="Detail & Tracking" style="background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.4);color:#60a5fa;">
              🔍
            </button>
            <button class="row-action-btn" onclick="togglePrint('${pkg.id}')" title="Toggle Pickup">
              ${pkg.printed ? '⏳ Batal' : '✅ Tandai'}
            </button>
            <button class="row-action-btn delete" onclick="confirmDelete('${pkg.id}')" title="Hapus">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Pagination
  document.getElementById('paginationInfo').textContent = 
    `Menampilkan ${start + 1}-${Math.min(start + PAGE_SIZE, filtered.length)} dari ${filtered.length} paket`;

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('paginationControls');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button class="pagination-btn" onclick="goToPage(${tablePage - 1})" ${tablePage === 1 ? 'disabled' : ''}>◀</button>
  `;

  const maxVisible = 5;
  let startP = Math.max(1, tablePage - Math.floor(maxVisible / 2));
  let endP = Math.min(totalPages, startP + maxVisible - 1);
  if (endP - startP < maxVisible - 1) startP = Math.max(1, endP - maxVisible + 1);

  if (startP > 1) {
    html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
    if (startP > 2) html += `<button class="pagination-btn" disabled>...</button>`;
  }

  for (let i = startP; i <= endP; i++) {
    html += `<button class="pagination-btn ${i === tablePage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<button class="pagination-btn" disabled>...</button>`;
    html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  html += `
    <button class="pagination-btn" onclick="goToPage(${tablePage + 1})" ${tablePage === totalPages ? 'disabled' : ''}>▶</button>
  `;

  container.innerHTML = html;
}

function goToPage(page) {
  tablePage = page;
  renderAllPackagesTable();
}

// ============================================
// UNPRINTED TABLE
// ============================================

function renderUnprintedTable() {
  const unprinted = packages.filter(p => !p.printed);
  const tbody = document.getElementById('unprintedTableBody');
  const empty = document.getElementById('unprintedEmpty');

  document.getElementById('unprintedCount').textContent = `${unprinted.length} paket`;

  if (unprinted.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = unprinted.map((pkg, i) => {
    const exp = EXPEDITIONS[pkg.expeditionKey];
    const scanDate = new Date(pkg.scannedAt);
    return `
      <tr>
        <td>${i + 1}</td>
        <td><span class="resi-number">${pkg.resi}</span></td>
        <td>
          <span class="expedisi-badge" style="background: ${exp.bgColor}; color: ${exp.color}; border: 1px solid ${exp.borderColor};">
            ${exp.icon} ${exp.shortName}
          </span>
        </td>
        <td>
          <div class="time-stamp">
            <span class="date">${scanDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>${scanDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </td>
        <td>
        <div class="action-btn-group">
          <button class="row-action-btn" onclick="window.openDetailModal('${pkg.id}')" title="Detail & Tracking" style="background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.4);color:#60a5fa;">🔍</button>
          <button class="row-action-btn" onclick="togglePrint('${pkg.id}')" title="Tandai di Pickup">✅</button>
          <button class="row-action-btn" onclick="confirmDelete('${pkg.id}')" title="Hapus">🗑️</button>
        </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================
// PRINTED TABLE
// ============================================

function renderPrintedTable() {
  const printed = packages.filter(p => p.printed);
  const tbody = document.getElementById('printedTableBody');
  const empty = document.getElementById('printedEmpty');

  document.getElementById('printedCount').textContent = `${printed.length} paket`;

  if (printed.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = printed.map((pkg, i) => {
    const exp = EXPEDITIONS[pkg.expeditionKey];
    const scanDate = new Date(pkg.scannedAt);
    return `
      <tr>
        <td>${i + 1}</td>
        <td><span class="resi-number">${pkg.resi}</span></td>
        <td>
          <span class="expedisi-badge" style="background: ${exp.bgColor}; color: ${exp.color}; border: 1px solid ${exp.borderColor};">
            ${exp.icon} ${exp.shortName}
          </span>
        </td>
        <td>
          <div class="time-stamp">
            <span class="date">${scanDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>${scanDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </td>
        <td>
          <span class="pickup-badge ${pkg.pickupStatus}" onclick="cyclePickupStatus('${pkg.id}')">
            ${getPickupLabel(pkg.pickupStatus)}
          </span>
        </td>
        <td>
        <div class="action-btn-group">
          <button class="row-action-btn" onclick="togglePrint('${pkg.id}')" title="Batalkan Pickup">⏳</button>
          <button class="row-action-btn" onclick="confirmDelete('${pkg.id}')" title="Hapus">🗑️</button>
        </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================
// EXPEDITION DETAIL
// ============================================

function getFilteredExpPackages(key) {
  let filtered = packages.filter(p => p.expeditionKey === key);

  // Apply date filters
  const dateFrom = document.getElementById('expFilterDateFrom')?.value;
  const dateTo = document.getElementById('expFilterDateTo')?.value;
  const statusFilter = document.getElementById('expFilterStatus')?.value;
  const searchQuery = document.getElementById('expFilterSearch')?.value?.trim().toUpperCase();

  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    filtered = filtered.filter(p => new Date(p.scannedAt) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter(p => new Date(p.scannedAt) <= to);
  }
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(p => statusFilter === 'printed' ? p.printed : !p.printed);
  }
  if (searchQuery) {
    filtered = filtered.filter(p => p.resi.includes(searchQuery));
  }

  return filtered;
}

function resetExpFilters() {
  const dateFrom = document.getElementById('expFilterDateFrom');
  const dateTo = document.getElementById('expFilterDateTo');
  const statusFilter = document.getElementById('expFilterStatus');
  const searchFilter = document.getElementById('expFilterSearch');
  if (dateFrom) dateFrom.value = '';
  if (dateTo) dateTo.value = '';
  if (statusFilter) statusFilter.value = 'all';
  if (searchFilter) searchFilter.value = '';
  // Reset calendar picker buttons
  const fromText = document.getElementById('expFilterDateFromText');
  const toText = document.getElementById('expFilterDateToText');
  const fromBtn = document.getElementById('expFilterDateFromBtn');
  const toBtn = document.getElementById('expFilterDateToBtn');
  if (fromText) fromText.textContent = 'Pilih Tanggal';
  if (toText) toText.textContent = 'Pilih Tanggal';
  if (fromBtn) fromBtn.classList.remove('has-value');
  if (toBtn) toBtn.classList.remove('has-value');
  if (currentExpedition) renderExpeditionDetail(currentExpedition);
}

function renderExpeditionDetail(key) {
  const exp = EXPEDITIONS[key];
  if (!exp) return;

  const allExpPackages = packages.filter(p => p.expeditionKey === key);
  const filteredExpPackages = getFilteredExpPackages(key);

  // Header
  document.getElementById('expeditionHeader').innerHTML = `
    <div class="expedition-icon-lg" style="background: ${exp.bgColor}; color: ${exp.color}; border: 2px solid ${exp.borderColor};">
      ${exp.icon}
    </div>
    <div class="expedition-info" style="flex: 1;">
      <h2 style="color: ${exp.color}; display: flex; align-items: center; gap: 10px;">
        ${exp.name} 
      </h2>
      <p>${allExpPackages.length} paket terdaftar${filteredExpPackages.length !== allExpPackages.length ? ` (${filteredExpPackages.length} ditampilkan)` : ''}</p>
    </div>
    
    <!-- EMBEDDED SCAN BAR -->
    <div style="flex: 1; max-width: 400px; display: flex; align-items: center; gap: 8px;">
      <div class="scan-input-container" style="flex: 1; margin: 0; min-height: 44px; font-size: 14px;">
        <input type="text" class="scan-input" id="expDetailScanInput"
               placeholder="Scan resi ${exp.shortName}..." 
               onkeydown="if(event.key==='Enter') { event.preventDefault(); addResi(this.value, 'scanFeedback', '${key}'); this.value=''; }">
        <span class="scan-input-icon" style="font-size: 16px;">📷</span>
      </div>
      <button class="scan-btn" onclick="const i = document.getElementById('expDetailScanInput'); addResi(i.value, 'scanFeedback', '${key}'); i.value='';" style="padding: 10px 16px; font-size: 14px; min-height: 44px; white-space: nowrap;">
        ⚡ Tambah
      </button>
      <button class="scan-mode-btn" onclick="toggleExpeditionCamera('${key}')" style="padding: 10px; min-height: 44px; border-radius: 8px;" title="Buka Kamera di sini">
        📷
      </button>
    </div>
  `;

  // Stats (always show total, not filtered)
  document.getElementById('exp-stat-total').textContent = allExpPackages.length;
  document.getElementById('exp-stat-printed').textContent = allExpPackages.filter(p => p.printed).length;
  document.getElementById('exp-stat-unprinted').textContent = allExpPackages.filter(p => !p.printed).length;

  document.getElementById('expName').textContent = exp.shortName;
  document.getElementById('expTableCount').textContent = `${filteredExpPackages.length} paket`;

  // Focus scan input automatically when opening the tab
  setTimeout(() => {
    const detailScanInput = document.getElementById('expDetailScanInput');
    if (detailScanInput) detailScanInput.focus();
  }, 100);

  const tbody = document.getElementById('expTableBody');
  const empty = document.getElementById('expEmpty');

  if (filteredExpPackages.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    if (allExpPackages.length > 0) {
      empty.innerHTML = `
        <span class="empty-icon">🔍</span>
        <h4>Tidak ada hasil ditemukan</h4>
        <p>Coba ubah filter tanggal atau kata kunci pencarian</p>
      `;
    } else {
      empty.innerHTML = `
        <span class="empty-icon">📦</span>
        <h4>Belum ada paket</h4>
        <p>Scan resi ekspedisi ini untuk menambahkan</p>
      `;
    }
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = filteredExpPackages.map((pkg, i) => {
    const scanDate = new Date(pkg.scannedAt);
    return `
      <tr>
        <td>${i + 1}</td>
        <td><span class="resi-number">${pkg.resi}</span></td>
        <td>
          <div class="time-stamp">
            <span class="date">${scanDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>${scanDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${pkg.printed ? 'printed' : 'unprinted'}" 
                onclick="togglePrint('${pkg.id}')">
            ${pkg.printed ? '✅ Sudah di Pickup' : '⏳ Belum di Pickup'}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="row-action-btn" onclick="togglePrint('${pkg.id}')" title="Toggle Pickup">
            ${pkg.printed ? '⏳' : '✅'}
            </button>
            <button class="row-action-btn delete" onclick="confirmDelete('${pkg.id}')" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function markAllExpPrinted() {
  if (!currentExpedition) return;
  let count = 0;
  packages.forEach(p => {
    if (p.expeditionKey === currentExpedition && !p.printed) {
      p.printed = true;
      syncPackageToSupabase('update', p);
      count++;
    }
  });
  if (count > 0) {
    saveToStorage();
    renderExpeditionDetail(currentExpedition);
    showToast('success', 'Berhasil', `${count} paket ditandai sudah di pickup`);
    addActivityLog('print', `${count} paket <strong>${EXPEDITIONS[currentExpedition].shortName}</strong> ditandai di pickup`);
  } else {
    showToast('info', 'Info', 'Tidak ada paket yang perlu ditandai');
  }
}

function exportExpCSV() {
  if (!currentExpedition) return;
  const expPackages = packages.filter(p => p.expeditionKey === currentExpedition);
  downloadCSV(expPackages, `manifest_${EXPEDITIONS[currentExpedition].shortName}`);
}

// ============================================
// ACTIONS
// ============================================

function togglePrint(id) {
  const pkg = packages.find(p => p.id === id);
  if (!pkg) return;
  pkg.printed = !pkg.printed;
  syncPackageToSupabase('update', pkg);
  saveToStorage();
  updateAllStats();
  if (currentPage === 'all-packages') renderAllPackagesTable();
  if (currentPage === 'expedisi') renderExpeditionDetail(currentExpedition);
  
  showToast('success', 'Status Diperbarui', 
    `Resi <strong>${pkg.resi}</strong> ${pkg.printed ? 'ditandai sudah di pickup' : 'dibatalkan status pickup-nya'}`);
  playSound('click');
}

function cyclePickupStatus(id) {
  const pkg = packages.find(p => p.id === id);
  if (!pkg) return;
  const states = ['ready', 'picked', 'pending'];
  const currentIdx = states.indexOf(pkg.pickupStatus);
  pkg.pickupStatus = states[(currentIdx + 1) % states.length];
  syncPackageToSupabase('update', pkg);
  addActivityLog('pickup', `Resi <strong>${pkg.resi}</strong> status pickup: <strong>${getPickupLabel(pkg.pickupStatus)}</strong>`);
  playSound('click');
  saveToStorage();
  refreshCurrentView();
}

function getPickupLabel(status) {
  switch (status) {
    case 'ready': return '🚚 Siap Pickup';
    case 'picked': return '✅ Sudah Pickup';
    case 'pending': return '⏳ Pending';
    default: return '❓ Unknown';
  }
}

function toggleSelect(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  renderAllPackagesTable();
}

function selectAll() {
  const filtered = getFilteredPackages();
  const allSelected = filtered.every(p => selectedIds.has(p.id));
  if (allSelected) {
    filtered.forEach(p => selectedIds.delete(p.id));
  } else {
    filtered.forEach(p => selectedIds.add(p.id));
  }
  renderAllPackagesTable();
}

function markSelectedPrinted() {
  let count = 0;
  selectedIds.forEach(id => {
    const pkg = packages.find(p => p.id === id);
    if (pkg && !pkg.printed) {
      pkg.printed = true;
      syncPackageToSupabase('update', pkg);
      count++;
    }
  });
  if (count > 0) {
    saveToStorage();
    renderAllPackagesTable();
    updateAllStats();
    showToast('success', 'Berhasil', `${count} paket ditandai sudah di pickup`);
    addActivityLog('print', `${count} paket terpilih ditandai di pickup`);
    selectedIds.clear();
  }
}

function markSelectedPickup() {
  let count = 0;
  selectedIds.forEach(id => {
    const pkg = packages.find(p => p.id === id);
    if (pkg && pkg.pickupStatus !== 'picked') {
      pkg.pickupStatus = 'picked';
      syncPackageToSupabase('update', pkg);
      count++;
    }
  });
  if (count > 0) {
    showToast('success', 'Berhasil', `${count} paket ditandai sudah pickup`);
    addActivityLog('pickup', `${count} paket terpilih ditandai pickup`);
    selectedIds.clear();
    saveToStorage();
    refreshCurrentView();
  }
}

function markAllPrinted() {
  const unprinted = packages.filter(p => !p.printed);
  unprinted.forEach(p => {
    p.printed = true;
    syncPackageToSupabase('update', p);
  });
  if (unprinted.length > 0) {
    saveToStorage();
    renderAllPackagesTable();
    updateAllStats();
    showToast('success', 'Berhasil', `${unprinted.length} paket ditandai sudah di pickup`);
    addActivityLog('print', `Semua paket (${unprinted.length}) ditandai di pickup`);
  }
}

// ============================================
// DELETE
// ============================================

function confirmDelete(id) {
  pendingConfirmAction = () => {
    const deletedPkg = packages.find(p => p.id === id);
    if(deletedPkg) syncPackageToSupabase('delete', deletedPkg);
    packages = packages.filter(p => p.id !== id);
    showToast('info', 'Dihapus', 'Paket berhasil dihapus');
    addActivityLog('delete', 'Paket dihapus dari daftar');
    saveToStorage();
    updateAllStats();
    renderChart();
    refreshCurrentView();
  };
  document.getElementById('modalTitle').textContent = 'Hapus Paket';
  document.getElementById('modalMessage').textContent = 'Apakah anda yakin ingin menghapus paket ini?';
  document.getElementById('modalConfirmBtn').textContent = 'Hapus';
  document.getElementById('confirmModal').classList.add('active');
}

function deleteSelected() {
  if (selectedIds.size === 0) {
    showToast('warning', 'Perhatian', 'Pilih paket terlebih dahulu');
    return;
  }
  pendingConfirmAction = () => {
    const count = selectedIds.size;
    selectedIds.forEach(id => {
      const deletedPkg = packages.find(p => p.id === id);
      if(deletedPkg) syncPackageToSupabase('delete', deletedPkg);
    });
    packages = packages.filter(p => !selectedIds.has(p.id));
    selectedIds.clear();
    showToast('info', 'Dihapus', `${count} paket berhasil dihapus`);
    addActivityLog('delete', `${count} paket dihapus dari daftar`);
    saveToStorage();
    updateAllStats();
    renderChart();
    refreshCurrentView();
  };
  document.getElementById('modalTitle').textContent = 'Hapus Paket Terpilih';
  document.getElementById('modalMessage').textContent = `Apakah anda yakin ingin menghapus ${selectedIds.size} paket terpilih?`;
  document.getElementById('modalConfirmBtn').textContent = 'Hapus Semua';
  document.getElementById('confirmModal').classList.add('active');
}

function confirmAction() {
  if (pendingConfirmAction) {
    pendingConfirmAction();
    pendingConfirmAction = null;
  }
  closeModal();
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('active');
}

// ============================================
// SEARCH
// ============================================

function handleGlobalSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  if (!query) {
    refreshCurrentView();
    return;
  }

  // Search within current context
  if (currentPage === 'all-packages') {
    renderAllPackagesTable();
  }
}

// Override filter to include search
const originalGetFiltered = getFilteredPackages;
getFilteredPackages = function() {
  let filtered = originalGetFiltered();
  const query = document.getElementById('globalSearch')?.value?.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(p => 
      p.resi.toLowerCase().includes(query) || 
      p.expeditionName.toLowerCase().includes(query)
    );
  }
  return filtered;
};

// ============================================
// CHART
// ============================================

function renderChart() {
  const container = document.getElementById('chartBars');
  const expCounts = {};

  Object.keys(EXPEDITIONS).forEach(key => {
    const count = packages.filter(p => p.expeditionKey === key).length;
    if (count > 0) expCounts[key] = count;
  });

  const sorted = Object.entries(expCounts).sort((a, b) => b[1] - a[1]);
  const max = sorted.length > 0 ? sorted[0][1] : 1;

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="table-empty" style="padding: 30px;">
        <span class="empty-icon">📊</span>
        <h4>Belum ada data</h4>
        <p>Scan resi untuk melihat chart</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sorted.slice(0, 10).map(([key, count]) => {
    const exp = EXPEDITIONS[key];
    const pct = Math.max(5, (count / max) * 100);
    return `
      <div class="chart-bar-row">
        <span class="chart-bar-label">${exp.icon} ${exp.shortName}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width: ${pct}%; background: linear-gradient(90deg, ${exp.color}, ${exp.color}88);">
            ${count}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// ACTIVITY LOG
// ============================================

function addActivityLog(type, message) {
  const entry = {
    type,
    message,
    timestamp: new Date().toISOString()
  };
  activityLog.unshift(entry);
  syncActivityToSupabase(entry);
  if (activityLog.length > 200) activityLog = activityLog.slice(0, 200);
}

function renderActivity() {
  const container = document.getElementById('recentActivity');
  const recent = activityLog.slice(0, 8);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="table-empty" style="padding: 30px;">
        <span class="empty-icon">📝</span>
        <h4>Belum ada aktivitas</h4>
        <p>Mulai scan resi untuk melihat aktivitas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = recent.map(entry => {
    const colors = {
      scan: '#10b981', bulk: '#3b82f6', print: '#8b5cf6',
      unprint: '#f59e0b', pickup: '#06b6d4', delete: '#ef4444',
      duplicate: '#ef4444', export: '#3b82f6'
    };
    const time = new Date(entry.timestamp);
    return `
      <div class="activity-item">
        <div class="activity-dot" style="background: ${colors[entry.type] || '#64748b'}"></div>
        <div class="activity-content">
          <div class="activity-text">${entry.message}</div>
          <div class="activity-time">${time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFullActivity() {
  const container = document.getElementById('fullActivityLog');

  if (activityLog.length === 0) {
    container.innerHTML = `
      <div class="table-empty" style="padding: 30px;">
        <span class="empty-icon">📝</span>
        <h4>Belum ada aktivitas</h4>
        <p>Mulai scan resi untuk melihat aktivitas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activityLog.map(entry => {
    const colors = {
      scan: '#10b981', bulk: '#3b82f6', print: '#8b5cf6',
      unprint: '#f59e0b', pickup: '#06b6d4', delete: '#ef4444',
      duplicate: '#ef4444', export: '#3b82f6'
    };
    const time = new Date(entry.timestamp);
    return `
      <div class="activity-item">
        <div class="activity-dot" style="background: ${colors[entry.type] || '#64748b'}"></div>
        <div class="activity-content">
          <div class="activity-text">${entry.message}</div>
          <div class="activity-time">${time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} - ${time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// LAST SCANNED (Scan page)
// ============================================

function updateLastScannedList() {
  const container = document.getElementById('lastScannedList');
  if (!container) return;
  const recent = packages.slice(0, 15);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="table-empty" style="padding: 30px;">
        <span class="empty-icon">📷</span>
        <h4>Belum ada resi</h4>
        <p>Scan resi pertama anda</p>
      </div>
    `;
    return;
  }

  container.innerHTML = recent.map(pkg => {
    const exp = EXPEDITIONS[pkg.expeditionKey];
    const time = new Date(pkg.scannedAt);
    return `
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 6px; background: var(--bg-glass);">
        <span class="expedisi-badge" style="background: ${exp.bgColor}; color: ${exp.color}; border: 1px solid ${exp.borderColor}; font-size: 11px;">
          ${exp.icon} ${exp.shortName}
        </span>
        <span class="resi-number" style="flex: 1; font-size: 13px;">${pkg.resi}</span>
        <span style="font-size: 11px; color: var(--text-muted);">${time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        <span class="status-badge ${pkg.printed ? 'printed' : 'unprinted'}" onclick="togglePrint('${pkg.id}')" style="font-size: 11px; padding: 3px 8px;">
          ${pkg.printed ? '✅' : '⏳'}
        </span>
        <button class="btn-icon" onclick="openDetailModal('${pkg.id}')">📸</button>
      </div>
    `;
  }).join('');
}

// ============================================
// EXPORT
// ============================================

function exportCSV() {
  downloadCSV(packages, 'manifest_all');
}

function downloadCSV(data, filename) {
  if (data.length === 0) {
    showToast('warning', 'Perhatian', 'Tidak ada data untuk di-export');
    return;
  }

  const headers = ['No', 'Nomor Resi', 'Ekspedisi', 'Waktu Scan', 'Status Pickup'];
  const rows = data.map((pkg, i) => [
    i + 1,
    pkg.resi,
    pkg.expeditionName,
    new Date(pkg.scannedAt).toLocaleString('id-ID'),
    pkg.printed ? 'Sudah di Pickup' : 'Belum di Pickup'
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('success', 'Export Berhasil', `${data.length} paket berhasil di-export ke CSV`);
  addActivityLog('export', `Export CSV: ${data.length} paket`);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showFeedback(elementId, type, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `scan-feedback ${type}`;
  el.innerHTML = message;
  el.style.display = 'flex';

  setTimeout(() => {
    el.style.display = 'none';
  }, 4000);
}

// ============================================
// SOUND
// ============================================

let audioContext;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();

    if (type === 'duplicate') {
      // ALARM SOUND - Loud, attention-grabbing 3-tone alarm
      playDuplicateAlarm(ctx);
      return;
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'success') {
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else if (type === 'click') {
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    // Audio not supported
  }
}

// DRAMATIC DUPLICATE ALARM SOUND
function playDuplicateAlarm(ctx) {
  const t = ctx.currentTime;

  // Beep 1 - High pitch
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(880, t);
  gain1.gain.setValueAtTime(0.15, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(t);
  osc1.stop(t + 0.15);

  // Beep 2 - Higher pitch
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(1100, t + 0.2);
  gain2.gain.setValueAtTime(0.15, t + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(t + 0.2);
  osc2.stop(t + 0.35);

  // Beep 3 - Highest pitch, longer
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'square';
  osc3.frequency.setValueAtTime(1400, t + 0.4);
  osc3.frequency.setValueAtTime(800, t + 0.6);
  osc3.frequency.setValueAtTime(1400, t + 0.8);
  gain3.gain.setValueAtTime(0.18, t + 0.4);
  gain3.gain.setValueAtTime(0.12, t + 0.7);
  gain3.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
  osc3.connect(gain3);
  gain3.connect(ctx.destination);
  osc3.start(t + 0.4);
  osc3.stop(t + 1.0);

  // Low warning buzz
  const osc4 = ctx.createOscillator();
  const gain4 = ctx.createGain();
  osc4.type = 'sawtooth';
  osc4.frequency.setValueAtTime(150, t);
  gain4.gain.setValueAtTime(0.06, t);
  gain4.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
  osc4.connect(gain4);
  gain4.connect(ctx.destination);
  osc4.start(t);
  osc4.stop(t + 1.0);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('soundToggle');
  btn.textContent = soundEnabled ? '🔔' : '🔕';
  showToast('info', 'Sound', soundEnabled ? 'Sound diaktifkan' : 'Sound dimatikan');
}

// ============================================
// PACKAGE DETAIL & PHOTO MODAL
// ============================================
let currentDetailPackageId = null;

function openDetailModal(id) {
  const pkg = packages.find(p => p.id === id);
  if (!pkg) return;

  currentDetailPackageId = id;
  window.__currentDetailPkgId = id; // expose globally for tracking

  // Title
  document.getElementById('detailModalTitle').textContent = `Detail: ${pkg.resi}`;

  // Ekspedisi
  const expKey = pkg.expeditionKey || pkg.expedisi || '';
  const expData = EXPEDITIONS[expKey];
  document.getElementById('detailExpedisi').textContent = expData ? expData.name : (pkg.expeditionName || expKey);

  // Waktu — support both old (timestamp) and new (scannedAt) fields
  const rawTime = pkg.scannedAt || pkg.timestamp || null;
  if (rawTime) {
    try {
      const d = new Date(rawTime);
      document.getElementById('detailWaktu').textContent = d.toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch(e) {
      document.getElementById('detailWaktu').textContent = rawTime;
    }
  } else {
    document.getElementById('detailWaktu').textContent = '-';
  }

  // Di-scan oleh
  const scannedByEl = document.getElementById('detailScannedBy');
  if (scannedByEl) scannedByEl.textContent = pkg.scanned_by_name || 'Tidak diketahui';

  // Status Pickup
  const pickupEl = document.getElementById('detailPickupStatus');
  if (pickupEl) {
    const statusMap = { ready: '📦 Siap Pickup', picked: '✅ Sudah Diambil', pending: '⏳ Tertunda' };
    pickupEl.textContent = pkg.printed ? '✅ Sudah di Pickup' : (statusMap[pkg.pickupStatus] || '📦 Belum Pickup');
  }

  // Reset tracking area
  const trackResult = document.getElementById('trackingResult');
  const trackBadge = document.getElementById('trackingBadge');
  if (trackResult) {
    trackResult.style.justifyContent = 'center';
    trackResult.innerHTML = '<span style="color:var(--text-muted);font-size:13px">Klik "Lacak Sekarang" untuk melihat status paket terkini dari ekspedisi</span>';
  }
  if (trackBadge) trackBadge.style.display = 'none';

  // Barcode
  if (typeof JsBarcode !== 'undefined') {
    try {
      JsBarcode("#barcodeSvg", pkg.resi, {
        format: "CODE128",
        lineColor: isLightMode ? "#0f172a" : "#ffffff",
        background: "transparent",
        width: 2, height: 60,
        displayValue: true, fontSize: 16, margin: 0
      });
    } catch(e) { console.warn('Barcode error:', e); }
  }

  // Photo
  const previewImg = document.getElementById('photoPreviewImage');
  const placeholder = document.getElementById('photoPlaceholder');
  const btnRemove = document.getElementById('btnRemovePhoto');
  const btnUpload = document.getElementById('btnUploadPhoto');

  if (pkg.photoBase64) {
    previewImg.src = pkg.photoBase64;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
    btnRemove.style.display = 'inline-block';
    btnUpload.innerHTML = '🔄 Ganti Foto';
  } else {
    previewImg.src = '';
    previewImg.style.display = 'none';
    placeholder.style.display = 'flex';
    btnRemove.style.display = 'none';
    btnUpload.innerHTML = '📸 Ambil / Unggah Foto';
  }

  document.getElementById('detailModal').classList.add('active');

  // Auto-track immediately when modal opens
  if (window.trackCurrentResi) {
    setTimeout(() => {
      window.trackCurrentResi();
    }, 300);
  }
}
window.openDetailModal = openDetailModal;

function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('active');
  currentDetailPackageId = null;
  // Clear file input
  document.getElementById('photoInput').value = '';
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Compress image using Canvas to save localStorage space
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; // Max width for compression
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to JPEG with 0.6 quality
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
      
      // Save to package
      const pkgIndex = packages.findIndex(p => p.id === currentDetailPackageId);
      if (pkgIndex !== -1) {
        packages[pkgIndex].photoBase64 = compressedDataUrl;
        saveToStorage();
        
        // Update UI
        openDetailModal(currentDetailPackageId);
        
        // Re-render table to show icon
        if (currentPage === 'all-packages') renderAllPackagesTable();
        if (currentPage === 'expedisi') renderExpeditionDetail(currentExpedition);
        
        showToast('success', 'Foto', 'Foto berhasil disimpan');
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  if (!currentDetailPackageId) return;
  
  const pkgIndex = packages.findIndex(p => p.id === currentDetailPackageId);
  if (pkgIndex !== -1) {
    packages[pkgIndex].photoBase64 = null;
    saveToStorage();
    
    // Update UI
    openDetailModal(currentDetailPackageId);
    
    // Re-render table to remove icon
    if (currentPage === 'all-packages') renderAllPackagesTable();
    if (currentPage === 'expedisi') renderExpeditionDetail(currentExpedition);
    
    showToast('info', 'Foto', 'Foto berhasil dihapus');
  }
}

// ============================================
// THEME TOGGLE
// ============================================
let isLightMode = localStorage.getItem('theme') === 'light';

function initTheme() {
  if (isLightMode) {
    document.body.classList.add('light-theme');
    document.getElementById('themeToggle').textContent = '🌞';
  }
}

function toggleTheme() {
  isLightMode = !isLightMode;
  if (isLightMode) {
    document.body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
    document.getElementById('themeToggle').textContent = '🌞';
    showToast('info', 'Tema', 'Mode Terang diaktifkan');
  } else {
    document.body.classList.remove('light-theme');
    localStorage.setItem('theme', 'dark');
    document.getElementById('themeToggle').textContent = '🌙';
    showToast('info', 'Tema', 'Mode Gelap diaktifkan');
  }
}

// ============================================
// UTILITIES
// ============================================

function generateId() {
  return 'pkg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

// ============================================
// CUSTOM CALENDAR DATE PICKER
// ============================================

const CAL_MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const CAL_DAYS_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const CAL_MONTHS_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

let calCurrentMonth;
let calCurrentYear;
let calSelectedDate = null;
let calTargetInputId = null;

function openCalendar(targetInputId) {
  calTargetInputId = targetInputId;

  // Read existing value
  const existing = document.getElementById(targetInputId)?.value;
  if (existing) {
    const d = new Date(existing);
    calSelectedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    calCurrentMonth = d.getMonth();
    calCurrentYear = d.getFullYear();
  } else {
    calSelectedDate = null;
    const now = new Date();
    calCurrentMonth = now.getMonth();
    calCurrentYear = now.getFullYear();
  }

  renderCalendar();
  document.getElementById('calOverlay').classList.add('active');
}

function renderCalendar() {
  // Update header
  if (calSelectedDate) {
    document.getElementById('calHeaderYear').textContent = calSelectedDate.getFullYear();
    const dayName = CAL_DAYS_SHORT_ID[calSelectedDate.getDay()];
    const monthName = CAL_MONTHS_SHORT_ID[calSelectedDate.getMonth()];
    document.getElementById('calHeaderDate').textContent =
      `${dayName}, ${calSelectedDate.getDate()} ${monthName}`;
  } else {
    document.getElementById('calHeaderYear').textContent = calCurrentYear;
    document.getElementById('calHeaderDate').textContent = 'Pilih tanggal';
  }

  // Update nav title
  document.getElementById('calNavTitle').textContent =
    `${CAL_MONTHS_ID[calCurrentMonth]} ${calCurrentYear}`;

  // Generate days
  const container = document.getElementById('calDays');
  container.innerHTML = '';

  const firstDay = new Date(calCurrentYear, calCurrentMonth, 1);
  // getDay() returns 0=Sunday. We want Sunday first (M column = Minggu)
  let startDay = firstDay.getDay(); // 0=Sun,1=Mon...
  const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  // Empty cells before first day
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    container.appendChild(empty);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dayBtn = document.createElement('button');
    dayBtn.className = 'cal-day';
    dayBtn.textContent = d;

    const dateObj = new Date(calCurrentYear, calCurrentMonth, d);
    const dateStr = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;

    // Today highlight
    if (dateStr === todayStr) {
      dayBtn.classList.add('today');
    }

    // Selected highlight
    if (calSelectedDate) {
      const selStr = `${calSelectedDate.getFullYear()}-${calSelectedDate.getMonth()}-${calSelectedDate.getDate()}`;
      if (dateStr === selStr) {
        dayBtn.classList.add('selected');
      }
    }

    dayBtn.onclick = () => calSelectDay(d);
    container.appendChild(dayBtn);
  }
}

function calSelectDay(day) {
  calSelectedDate = new Date(calCurrentYear, calCurrentMonth, day);
  renderCalendar();
  playSound('click');
}

function calPrevMonth() {
  calCurrentMonth--;
  if (calCurrentMonth < 0) {
    calCurrentMonth = 11;
    calCurrentYear--;
  }
  renderCalendar();
}

function calNextMonth() {
  calCurrentMonth++;
  if (calCurrentMonth > 11) {
    calCurrentMonth = 0;
    calCurrentYear++;
  }
  renderCalendar();
}

function calSet() {
  if (!calSelectedDate || !calTargetInputId) {
    calCancel();
    return;
  }

  // Format: YYYY-MM-DD for hidden input
  const y = calSelectedDate.getFullYear();
  const m = String(calSelectedDate.getMonth() + 1).padStart(2, '0');
  const d = String(calSelectedDate.getDate()).padStart(2, '0');
  const isoVal = `${y}-${m}-${d}`;

  document.getElementById(calTargetInputId).value = isoVal;

  // Update button text
  const textEl = document.getElementById(calTargetInputId + 'Text');
  const btnEl = document.getElementById(calTargetInputId + 'Btn');
  if (textEl) {
    textEl.textContent = `${calSelectedDate.getDate()} ${CAL_MONTHS_SHORT_ID[calSelectedDate.getMonth()]} ${y}`;
  }
  if (btnEl) btnEl.classList.add('has-value');

  closeCalendar();

  // Trigger filters
  if (calTargetInputId.startsWith('exp')) {
    if (currentExpedition) renderExpeditionDetail(currentExpedition);
  } else {
    applyFilters();
  }
}

function calClear() {
  if (!calTargetInputId) { closeCalendar(); return; }

  document.getElementById(calTargetInputId).value = '';

  const textEl = document.getElementById(calTargetInputId + 'Text');
  const btnEl = document.getElementById(calTargetInputId + 'Btn');
  if (textEl) textEl.textContent = 'Pilih Tanggal';
  if (btnEl) btnEl.classList.remove('has-value');

  closeCalendar();

  // Trigger filters
  if (calTargetInputId.startsWith('exp')) {
    if (currentExpedition) renderExpeditionDetail(currentExpedition);
  } else {
    applyFilters();
  }
}

function calCancel() {
  closeCalendar();
}

function closeCalendar() {
  document.getElementById('calOverlay').classList.remove('active');
  calTargetInputId = null;
}

// ============================================
// ADVANCED EXPORT & DATA SAFETY (v4.0)
// ============================================

function toggleDropdown(id) {
  document.getElementById(id).classList.toggle('show');
}

window.onclick = function(event) {
  if (!event.target.matches('.btn-export') && !event.target.closest('.btn-export')) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      let openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function exportExcel() {
  if (packages.length === 0) {
    showToast('warning', 'Export Gagal', 'Tidak ada data untuk diexport');
    return;
  }
  
  const wsData = packages.map((pkg, index) => ({
    'No': index + 1,
    'Nomor Resi': pkg.resi,
    'Ekspedisi': EXPEDITIONS[pkg.expedition] ? EXPEDITIONS[pkg.expedition].name : pkg.expedition,
    'Waktu Scan': formatDate(new Date(pkg.timestamp)),
    'Status Pickup': pkg.printed ? 'Sudah Pickup' : 'Belum Pickup',
    'Catatan Foto': pkg.photoUrl ? 'Ada Foto' : 'Tidak Ada Foto'
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Manifest Resi");
  
  XLSX.writeFile(wb, `Manifest_Ekspedisi_${new Date().getTime()}.xlsx`);
  showToast('success', 'Export Berhasil', 'Data Excel berhasil diunduh');
}

function exportPDF() {
  if (packages.length === 0) {
    showToast('warning', 'Export Gagal', 'Tidak ada data untuk dicetak');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Laporan Manifest Ekspedisi", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text("Dibuat pada: " + formatDate(new Date()), 14, 30);

  const tableColumn = ["No", "Nomor Resi", "Ekspedisi", "Waktu Scan", "Status Pickup"];
  const tableRows = [];

  packages.forEach((pkg, index) => {
    const row = [
      index + 1,
      pkg.resi,
      EXPEDITIONS[pkg.expedition] ? EXPEDITIONS[pkg.expedition].name : pkg.expedition,
      formatDate(new Date(pkg.timestamp)),
      pkg.printed ? 'Sudah' : 'Belum'
    ];
    tableRows.push(row);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`Manifest_Report_${new Date().getTime()}.pdf`);
  showToast('success', 'Export Berhasil', 'Dokumen PDF berhasil diunduh');
}

function backupDatabase() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
    packages,
    activityLog
  }));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `Backup_ManifestDB_${new Date().getTime()}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  showToast('success', 'Backup Selesai', 'File database berhasil diunduh ke perangkat Anda');
}

function restoreDatabase(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.packages && Array.isArray(data.packages)) {
        packages = data.packages;
        activityLog = data.activityLog || [];
        saveToStorage();
        init(); // Re-render everything
        showToast('success', 'Restore Berhasil', 'Database berhasil dikembalikan');
      } else {
        throw new Error("Invalid Format");
      }
    } catch (err) {
      showToast('error', 'Restore Gagal', 'File backup tidak valid atau rusak');
    }
    event.target.value = ''; // Reset input
  };
  reader.readAsText(file);
}

// ============================================
// BARCODE GENERATOR
// ============================================
function renderBarcode(resi) {
  const svgNode = document.getElementById('barcodeSvg');
  if (svgNode && window.JsBarcode) {
    JsBarcode(svgNode, resi, {
      format: "CODE128",
      lineColor: "var(--text-main)",
      width: 2,
      height: 60,
      displayValue: true,
      background: "transparent"
    });
  }
}

// ============================================
// INITIALIZATION KICKSTART
// ============================================
document.addEventListener('DOMContentLoaded', init);

// ============================================
// BINDERBYTE TRACKING API
// ============================================
const BINDERBYTE_API_KEY = '3f4878c780923585911ca5155bbe44dfe6360fa47865ca535033b5d3e04295d4';

// Mapping kode ekspedisi internal → kode BinderByte
const BINDERBYTE_COURIER_MAP = {
  'SPX':      'spx',
  'SICEPAT':  'sicepat',
  'J&T':      'jnt',
  'JNT':      'jnt',
  'JNE':      'jne',
  'NINJA':    'ninja',
  'IDEXPRESS':'ide',
  'POS':      'pos',
  'ANTERAJA': 'anteraja',
  'TIKI':     'tiki',
  'NINJA':    'ninja',
  'LION':     'lion',
  'WAHANA':   'wahana',
  'SAP':      'sap',
  'KURIR_LAIN': null,
};

// Status warna & label dari BinderByte
const TRACKING_STATUS_MAP = {
  'DELIVERED':    { label: 'Terkirim ✅',    bg: 'rgba(16,185,129,0.2)',  color: '#10b981', border: 'rgba(16,185,129,0.4)' },
  'ON_PROCESS':   { label: 'Dalam Proses 📦', bg: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: 'rgba(59,130,246,0.4)' },
  'ON_DELIVERY':  { label: 'Dalam Pengiriman 🚚', bg: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: 'rgba(245,158,11,0.4)' },
  'NOT_FOUND':    { label: 'Tidak Ditemukan ❓', bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: 'rgba(100,116,139,0.4)' },
  'RETURNED':     { label: 'Retur / Dikembalikan ↩️', bg: 'rgba(239,68,68,0.2)', color: '#f87171', border: 'rgba(239,68,68,0.4)' },
  'CANCELLED':    { label: 'Dibatalkan ❌', bg: 'rgba(239,68,68,0.2)', color: '#f87171', border: 'rgba(239,68,68,0.4)' },
};

// ── Tracking: gunakan currentDetailPackageId (sudah diset di openDetailModal)

// Fungsi tracking utama
window.trackCurrentResi = async function() {
  // Cari package berdasarkan id yang disimpan saat modal dibuka
  const pkgId = window.__currentDetailPkgId || currentDetailPackageId;
  const pkg = packages.find(p => p.id === pkgId);
  if (!pkg) return;

  const courierCode = BINDERBYTE_COURIER_MAP[pkg.expeditionKey];
  const btn = document.getElementById('btnTrack');
  const resultEl = document.getElementById('trackingResult');
  const badgeEl  = document.getElementById('trackingBadge');

  if (!courierCode) {
    resultEl.innerHTML = '<span style="color:#f59e0b">⚠️ Kurir ini belum didukung oleh API tracking.</span>';
    return;
  }

  // Loading state
  btn.disabled = true;
  btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite"></span> Melacak...';
  resultEl.style.justifyContent = 'center';
  resultEl.innerHTML = '<span style="color:var(--text-muted)">⏳ Menghubungi server ekspedisi...</span>';

  try {
    const url = `https://api.binderbyte.com/v1/track?api_key=${BINDERBYTE_API_KEY}&courier=${courierCode}&awb=${encodeURIComponent(pkg.resi)}`;
    const res  = await fetch(url);
    const json = await res.json();

    if (json.status !== 200 || !json.data) {
      resultEl.style.justifyContent = 'center';
      resultEl.innerHTML = `<span style="color:#f59e0b">⚠️ ${json.message || 'Data resi tidak ditemukan di server ekspedisi.'}</span>`;
      btn.disabled = false; btn.innerHTML = '🛰️ Coba Lagi';
      return;
    }

    const summary  = json.data.summary;
    const history  = json.data.history || [];
    const statusKey = (summary.status || 'NOT_FOUND').toUpperCase().replace(/ /g,'_');
    const statusInfo = TRACKING_STATUS_MAP[statusKey] || TRACKING_STATUS_MAP['NOT_FOUND'];

    // Update badge
    if (badgeEl) {
      badgeEl.textContent = statusInfo.label;
      badgeEl.style.display = '';
      badgeEl.style.background = statusInfo.bg;
      badgeEl.style.color = statusInfo.color;
      badgeEl.style.border = `1px solid ${statusInfo.border}`;
    }

    // Auto deteksi Cancel/Return → peringatan merah mencolok
    if (statusKey === 'CANCELLED' || statusKey === 'RETURNED') {
      showToast('warning', `⚠️ PERHATIAN! ${pkg.resi} — ${statusInfo.label}`);
    }

    // ── Render: Info Ringkas
    const summaryHtml = `
      <div class="tracking-summary-grid">
        <div class="tracking-summary-item">
          <div class="label">PENGIRIM</div>
          <div class="value">${summary.shipper || '-'}</div>
        </div>
        <div class="tracking-summary-item">
          <div class="label">PENERIMA</div>
          <div class="value">${summary.receiver || '-'}</div>
        </div>
        <div class="tracking-summary-item">
          <div class="label">TGL KIRIM</div>
          <div class="value">${summary.date || '-'}</div>
        </div>
      </div>`;

    // ── Render: Timeline seperti SPX
    const timelineHtml = history.map((h, i) => {
      const isFirst = i === 0;
      const dotColor = isFirst ? statusInfo.color : (i < 3 ? '#475569' : '#1e293b');
      const dotBorder = isFirst ? statusInfo.color : '#334155';
      const desc = h.desc || h.description || '-';
      const dateStr = h.date || '';
      const timeStr = h.time || '';
      const city = h.city_name || h.city || '';
      
      const datePart = dateStr.split(' ')[0] || dateStr;
      const timePart = dateStr.includes(' ') ? dateStr.split(' ')[1] : timeStr;

      return `
        <div class="timeline-item ${isFirst ? 'is-first' : ''}">
          <div class="timeline-time">
            <div class="time" style="color: ${isFirst ? statusInfo.color : 'var(--text-muted)'}">${timePart}</div>
            <div class="date">${datePart}</div>
          </div>
          <div class="timeline-dot-wrapper">
            <div class="timeline-dot" style="background: ${isFirst ? statusInfo.color : 'transparent'}; border-color: ${dotBorder}; box-shadow: ${isFirst ? '0 0 8px ' + statusInfo.color + '60' : 'none'}"></div>
            ${i < history.length - 1 ? '<div class="timeline-line"></div>' : ''}
          </div>
          <div class="timeline-content">
            <div class="timeline-desc">${desc}</div>
            ${city ? `<div class="timeline-city">📍 ${city}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    resultEl.style.justifyContent = 'flex-start';
    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="tracking-container">
        ${summaryHtml}
        <div class="tracking-timeline-scroll">
          ${timelineHtml || '<div class="empty-timeline">Tidak ada histori tersedia</div>'}
        </div>
      </div>`;

  } catch(e) {
    resultEl.style.justifyContent = 'center';
    resultEl.innerHTML = `<span style="color:#ef4444">❌ Gagal terhubung: ${e.message}</span>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🛰️ Lacak Sekarang';
  }
};
window.trackCurrentResi = window.trackCurrentResi;


// ============================================
// SUPABASE AUTH & ADMIN LOGIC
// ============================================

window.toggleAuthView = function(view) {
  document.getElementById('loginView').style.display = view === 'login' ? 'block' : 'none';
  document.getElementById('registerView').style.display = view === 'register' ? 'block' : 'none';
}

window.handleLogin = async function() {
  const userEl = document.getElementById('loginUsername');
  const passEl = document.getElementById('loginPassword');
  if(!userEl || !passEl) return;
  const username = userEl.value.trim();
  const password = passEl.value.trim();
  
  if(!username || !password) return showToast('error', 'Error', 'Isi semua field');
  
  const { data, error } = await window.supabaseClient.from('users').select('*').eq('username', username).eq('password', password).single();
  
  if (error || !data) {
    return showToast('error', 'Login Gagal', 'Username atau password salah');
  }
  
  if (data.status === 'pending') {
    return showToast('warning', 'Akses Ditolak', 'Akun Anda masih menunggu persetujuan Developer');
  }
  
  localStorage.setItem('currentUser', JSON.stringify(data));
  showToast('success', 'Berhasil', 'Login sukses, mengalihkan...');
  setTimeout(() => window.location.href = data.role === 'developer' ? 'admin.html' : 'index.html', 1000);
}

window.handleRegister = async function() {
  const nameEl = document.getElementById('regName');
  const userEl = document.getElementById('regUsername');
  const passEl = document.getElementById('regPassword');
  if(!nameEl || !userEl || !passEl) return;
  
  const name = nameEl.value.trim();
  const username = userEl.value.trim();
  const password = passEl.value.trim();
  
  if(!name || !username || !password) return showToast('error', 'Error', 'Isi semua field');
  
  const { data: existing } = await window.supabaseClient.from('users').select('id').eq('username', username).single();
  if (existing) {
    return showToast('error', 'Gagal', 'Username sudah dipakai');
  }
  
  const { error } = await window.supabaseClient.from('users').insert({
    name, username, password, role: 'operator', status: 'pending'
  });
  
  if (error) {
    return showToast('error', 'Gagal', 'Terjadi kesalahan sistem');
  }
  
  showToast('success', 'Berhasil', 'Pendaftaran sukses! Menunggu persetujuan Developer.');
  toggleAuthView('login');
}

window.logout = function() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

window.loadAdminUsers = async function() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  
  const { data, error } = await window.supabaseClient.from('users').select('*').order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading users:', error);
    tbody.innerHTML = `<tr><td colspan="4" style="padding:20px;text-align:center;color:red;">Error: ${error.message}</td></tr>`;
    return;
  }
  
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:20px;text-align:center;color:#64748b;">Belum ada user yang mendaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  let shown = 0;
  data.forEach(user => {
    // Hanya sembunyikan developer/admin dari daftar
    const role = user.role || 'operator';
    if (role === 'developer') return;
    
    shown++;
    const status = user.status || 'approved';
    const tr = document.createElement('tr');
    let actionBtn = '';
    if (status === 'pending') {
      actionBtn = `<button class="btn-approve" onclick="approveUser('${user.id}')">✅ Terima</button>
                   <button class="btn-reject" onclick="deleteUser('${user.id}')">❌ Tolak (Hapus)</button>`;
    } else {
      actionBtn = `<button class="btn-reject" onclick="deleteUser('${user.id}')">🗑️ Hapus Akun</button>`;
    }
    
    tr.innerHTML = `
      <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${user.name || '-'}</td>
      <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${user.username || '-'}</td>
      <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${status === 'pending' ? '⏳ Pending' : '✅ Approved'}</td>
      <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${actionBtn}</td>
    `;
    tbody.appendChild(tr);
  });
  
  if (shown === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:20px;text-align:center;color:#64748b;">Tidak ada user operator yang terdaftar.</td></tr>`;
  }
}

window.approveUser = async function(id) {
  await window.supabaseClient.from('users').update({ status: 'approved' }).eq('id', id);
  showToast('success', 'Berhasil', 'User disetujui');
  loadAdminUsers();
}

window.deleteUser = async function(id) {
  if(confirm('Hapus user ini?')) {
    await window.supabaseClient.from('users').delete().eq('id', id);
    showToast('success', 'Berhasil', 'User dihapus');
    loadAdminUsers();
  }
}

window.checkAuth = checkAuth;

// ============================================
// EXPORT SEMUA FUNGSI KE WINDOW (MODULE SCOPE FIX)
// ============================================
window.init = init;
window.backupDatabase = backupDatabase;
window.restoreDatabase = restoreDatabase;
window.setScanMode = setScanMode;
window.handleScanKeydown = handleScanKeydown;
window.processResi = processResi;
window.processBulkResi = processBulkResi;
window.processResiFocus = processResiFocus;
window.processBulkResiFocus = processBulkResiFocus;
window.applyFilters = applyFilters;
window.openCalendar = openCalendar;
window.resetFilters = resetFilters;
window.selectAll = selectAll;
window.markSelectedPrinted = markSelectedPrinted;
window.deleteSelected = deleteSelected;
window.sortTable = sortTable;
window.markAllPrinted = markAllPrinted;
window.renderExpeditionDetail = renderExpeditionDetail;
window.resetExpFilters = resetExpFilters;
window.markAllExpPrinted = markAllExpPrinted;
window.exportExpCSV = exportExpCSV;
window.closeDuplicateWarning = closeDuplicateWarning;
window.calPrevMonth = calPrevMonth;
window.calNextMonth = calNextMonth;
window.calClear = calClear;
window.calCancel = calCancel;
window.calSet = calSet;
window.closeModal = closeModal;
window.confirmAction = confirmAction;
window.closeDetailModal = closeDetailModal;
window.handlePhotoUpload = handlePhotoUpload;
window.removePhoto = removePhoto;
window.togglePrint = togglePrint;
window.confirmDelete = confirmDelete;
window.navigateTo = navigateTo;
window.toggleFullscreen = toggleFullscreen;
window.logout = logout;
window.cyclePickupStatus = cyclePickupStatus;
window.downloadCSV = downloadCSV;
window.exportExcel = exportExcel;
window.exportPDF = exportPDF;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.markSelectedPickup = markSelectedPickup;
window.printResi = printResi;
window.toggleSound = toggleSound;

// ============================================
// FITUR BARU: PRINT STRUK & SOUND TOGGLE
// ============================================

function printResi() {
  if (!currentDetailPackageId) return;
  const pkg = packages.find(p => p.id === currentDetailPackageId);
  if (!pkg) return;
  
  // Create an iframe to print just the receipt
  let printFrame = document.getElementById('printFrame');
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'printFrame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
  }
  
  const expData = EXPEDITIONS[pkg.expedisi] || { name: pkg.expedisi };
  const scanDate = new Date(pkg.timestamp);
  const dateStr = scanDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = scanDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Extract svg HTML for barcode
  const svgEl = document.getElementById('barcodeSvg');
  const barcodeHtml = svgEl ? svgEl.outerHTML : `<p>${pkg.resi}</p>`;
  
  const html = `
    <html>
    <head>
      <title>Print Struk ${pkg.resi}</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .title { font-size: 18px; font-weight: bold; margin: 0; }
        .subtitle { font-size: 12px; margin: 5px 0 0; }
        .row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; }
        .barcode { text-align: center; margin: 20px 0; }
        .barcode svg { max-width: 100%; height: auto; }
        .footer { text-align: center; font-size: 12px; border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; }
        @media print { body { width: 100%; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">MANIFEST EKSPEDISI</h1>
        <p class="subtitle">BUKTI SCAN / PICKUP</p>
      </div>
      
      <div class="row"><span>Waktu:</span><span>${dateStr}</span></div>
      <div class="row"><span>Jam:</span><span>${timeStr}</span></div>
      <div class="row"><span>Kurir:</span><span>${expData.name}</span></div>
      <div class="row"><span>Status:</span><span>${pkg.printed ? 'Sudah Pickup' : 'Belum Pickup'}</span></div>
      
      <div class="barcode">
        ${barcodeHtml}
        <div style="margin-top: 5px; font-weight: bold;">${pkg.resi}</div>
      </div>
      
      <div class="footer">
        Dicetak pada: ${new Date().toLocaleString('id-ID')}<br>
        Terima kasih atas kepercayaannya.
      </div>
      
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
  
  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  
  addActivityLog('print', `Resi <strong>${pkg.resi}</strong> dicetak via Thermal Printer`);
  
  // Optionally auto-mark as printed when they click print
  if (!pkg.printed) {
    pkg.printed = true;
    syncPackageToSupabase('update', pkg);
    saveToStorage();
    updateAllStats();
    refreshCurrentView();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    btn.innerHTML = soundEnabled ? '🔊' : '🔇';
    btn.title = soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara';
  }
  showToast('info', 'Pengaturan Suara', `Suara notifikasi ${soundEnabled ? 'diaktifkan' : 'dimatikan'}`);
}



