const SUPABASE_URL = 'https://xohldcmeialjpbqyjkqh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uuH2LT12UxSJQUPEdpEKSg_muIrzZ8a';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MASTER_COURIERS = {
    SPX: { name: 'Shopee Express' },
    JNT: { name: 'J&T Express' },
    JNTCARGO: { name: 'J&T Cargo' },
    SICEPAT: { name: 'SiCepat' },
    JNE: { name: 'JNE Express' },
    TIKI: { name: 'TIKI' },
    POS: { name: 'Pos Indonesia' },
    ANTERAJA: { name: 'AnterAja' }
};

let currentUser = null;
let collectionData = [];
let myChart = null;
let barChart = null;
let currentFilter = 'SEMUA';
let activeView = 'dashboard';
let html5QrcodeScanner = null;
let activeCourierIdGlobal = null;

// DOM Elements
const authModal = document.getElementById('authModal');
const mainApp = document.getElementById('mainApp');
const pendingScreen = document.getElementById('pendingScreen');

document.addEventListener("DOMContentLoaded", async () => {
    initAuthUI();
    initSidebarMobile();
    await checkSession();

    document.getElementById("colForm").addEventListener("submit", handleSaveResi);
    document.getElementById("colScanBtn").addEventListener("click", toggleScanner);
    
    // Auto-typing subtitle in auth modal
    const subtitleEl = authModal.querySelector('p');
    if (subtitleEl) {
        const fullText = "Sistem logistik pintar untuk bisnis masa depan.";
        let currentText = '';
        let i = 0;
        const typing = setInterval(() => {
            if(i < fullText.length) {
                currentText += fullText[i];
                subtitleEl.innerHTML = currentText + '<span class="animate-pulse text-amber-500">|</span>';
                i++;
            } else clearInterval(typing);
        }, 50);
    }
});

async function fetchLeaderboard() {
    const table = document.getElementById('leaderboardTable');
    if(!table) return;

    table.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-zinc-500 text-xs italic"><i class="fa-solid fa-circle-notch fa-spin text-emerald-500 mb-2 text-xl block mx-auto"></i>Memuat peringkat...</td></tr>`;

    // get users
    const { data: usersData } = await supabaseClient.from('users').select('id, name, username, role').eq('status', 'approved');
    
    // get packages this month
    const startOfMonth = moment().startOf('month').toISOString();
    const { data: allPackages } = await supabaseClient.from('packages').select('user_id').gte('timestamp', startOfMonth);

    if (usersData && allPackages) {
        const counts = {};
        allPackages.forEach(p => {
            if (!p.user_id) return;
            counts[p.user_id] = (counts[p.user_id] || 0) + 1;
        });

        const leaderboard = Object.keys(counts).map(uid => {
            const u = usersData.find(user => user.id === uid);
            if(!u) return null;
            return {
                id: uid,
                name: u.name,
                username: u.username,
                role: u.role,
                count: counts[uid]
            };
        }).filter(item => item !== null && item.role === 'operator') // Only rank operators!
          .sort((a,b) => b.count - a.count).slice(0, 5);

        table.innerHTML = "";
        if (leaderboard.length === 0) {
            table.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-zinc-500 text-xs italic">Belum ada data resi bulan ini.</td></tr>`;
            return;
        }

        leaderboard.forEach((user, index) => {
            const isTop1 = index === 0;
            const rankIcon = isTop1 ? `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-black mx-auto"><i class="fa-solid fa-crown text-xs"></i></div>` 
                                    : `<div class="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 font-bold border border-zinc-700/50 mx-auto">${index + 1}</div>`;
            const nameColor = isTop1 ? 'text-amber-500 font-black' : 'text-white font-bold';
            
            table.insertAdjacentHTML('beforeend', `
                <tr class="hover:bg-zinc-800/30 transition-colors group">
                    <td class="px-5 py-4 text-center align-middle">${rankIcon}</td>
                    <td class="px-5 py-4 align-middle">
                        <div class="flex flex-col">
                            <span class="${nameColor} text-sm flex items-center gap-2">${user.name} ${isTop1 ? '<i class="fa-solid fa-fire text-amber-500 text-xs drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]"></i>' : ''}</span>
                            <span class="text-[10px] text-zinc-500 font-medium">@${user.username}</span>
                        </div>
                    </td>
                    <td class="px-5 py-4 text-right align-middle">
                        <div class="inline-flex items-center justify-center bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-4 py-2 group-hover:border-emerald-500/30 transition-colors">
                            <span class="font-black text-emerald-400 text-sm drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">${user.count}</span>
                            <span class="text-[10px] text-zinc-500 ml-2 uppercase font-bold tracking-wider">Resi</span>
                        </div>
                    </td>
                </tr>
            `);
        });
    } else {
        table.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-rose-500 text-xs italic">Gagal memuat peringkat.</td></tr>`;
    }
}

// --- AUTH & PROFILES ---

async function checkSession() {
    const savedUser = localStorage.getItem('manifestUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        await handleStartApp();
    } else {
        authModal.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
}

async function handleStartApp() {
    if (currentUser.status === 'approved' || currentUser.role === 'admin' || currentUser.role === 'developer') {
        authModal.classList.add('hidden');
        pendingScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        document.getElementById('profileStoreName').innerText = currentUser.name || currentUser.username;
        document.getElementById('profileRole').innerText = currentUser.role === 'operator' ? 'Toko/Seller' : (currentUser.role || 'Mitra Logistik');
        
        if (document.getElementById('welcomeName')) {
            document.getElementById('welcomeName').innerText = currentUser.name || currentUser.username;
        }

        if (currentUser.role === 'admin' || currentUser.role === 'developer') {
            document.getElementById('adminPanelBtnWrapper').classList.remove('hidden');
        }
        
        // Initialize Date Filter to Today
        if (!document.getElementById('filterDate').value) {
            document.getElementById('filterDate').value = moment().format('YYYY-MM-DD');
        }
        
        await fetchData();
        renderSidebarMenu();
        appRouter('dashboard');
    } else {
        authModal.classList.add('hidden');
        mainApp.classList.add('hidden');
        pendingScreen.classList.remove('hidden');
    }
}

let isLoginMode = true;
function initAuthUI() {
    const toggleBtn = document.getElementById('toggleAuthModeBtn');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authIcon = document.getElementById('authIcon');
    
    toggleBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if(isLoginMode) {
            toggleBtn.innerText = "Daftar Sekarang";
            toggleBtn.previousSibling.textContent = "Belum punya akun? ";
            authSubmitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> MASUK SEKARANG';
            authIcon.className = "fa-solid fa-bolt text-white text-3xl";
            document.getElementById('regExtraFields').classList.add('hidden');
            document.getElementById('regName').required = false;
            document.getElementById('regPhone').required = false;
            document.getElementById('regAddress').required = false;
        } else {
            toggleBtn.innerText = "Login Disini";
            toggleBtn.previousSibling.textContent = "Sudah punya akun? ";
            authSubmitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> DAFTAR SEKARANG';
            authIcon.className = "fa-solid fa-store text-white text-3xl";
            document.getElementById('regExtraFields').classList.remove('hidden');
            document.getElementById('regName').required = true;
            document.getElementById('regPhone').required = true;
            document.getElementById('regAddress').required = true;
        }
    });

    const togglePassBtn = document.getElementById('togglePasswordBtn');
    const passInput = document.getElementById('authPassword');
    const passIcon = document.getElementById('togglePasswordIcon');
    togglePassBtn.addEventListener('click', () => {
        if(passInput.type === 'password') {
            passInput.type = 'text'; passIcon.className = 'fa-solid fa-eye-slash';
        } else {
            passInput.type = 'password'; passIcon.className = 'fa-solid fa-eye';
        }
    });

    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const btnText = authSubmitBtn.innerHTML;
        authSubmitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> MEMPROSES...';
        authSubmitBtn.disabled = true;

        if (isLoginMode) {
            const { data, error } = await supabaseClient.from('users').select('*').eq('username', username).eq('password', password).single();
            if(error || !data) {
                Swal.fire({toast: true, position: 'top', showConfirmButton: false, timer: 3000, icon: 'error', title: 'Login Gagal', text: 'Username atau password salah', background: '#18181b', color: '#ef4444'});
            } else {
                currentUser = data;
                localStorage.setItem('manifestUser', JSON.stringify(data));
                await handleStartApp();
            }
        } else {
            // Register
            const name = document.getElementById('regName').value;
            const phone = document.getElementById('regPhone').value;
            const address = document.getElementById('regAddress').value;
            
            const newId = 'user-' + Date.now();
            const newUser = {
                id: newId, name: name, username: username, password: password,
                phone: phone, address: address,
                role: 'operator', status: 'pending', created_at: moment().toISOString()
            };
            const { error } = await supabaseClient.from('users').insert([newUser]);
            if(error) {
                Swal.fire({toast: true, position: 'top', showConfirmButton: false, timer: 3000, icon: 'error', title: 'Gagal', text: error.message, background: '#18181b', color: '#ef4444'});
            } else {
                Swal.fire({icon: 'success', title: 'Berhasil', text: 'Menunggu persetujuan admin', background: '#18181b', color: '#fff'});
                isLoginMode = true; toggleBtn.click();
            }
        }
        authSubmitBtn.innerHTML = btnText;
        authSubmitBtn.disabled = false;
    });

    const logout = () => {
        localStorage.removeItem('manifestUser');
        currentUser = null;
        authModal.classList.remove('hidden');
        mainApp.classList.add('hidden');
        pendingScreen.classList.add('hidden');
    };
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('logoutPendingBtn').addEventListener('click', logout);
}

// --- MAIN APP LOGIC ---

async function fetchData() {
    let query = supabaseClient
        .from('packages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);
        
    if (currentUser.role !== 'admin' && currentUser.role !== 'developer') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query;
    
    if (!error) {
        // Normalize old J&T data
        collectionData = (data || []).map(item => {
            if (item.expedition === 'J&T') {
                item.expedition = 'JNT';
            }
            return item;
        });
        updateDashboardStats();
    }
}

function getStatusCategory(status) {
    if (!status) return 'PROSES';
    const s = status.toUpperCase();
    if (s.includes('DELIVERED') || s.includes('TERKIRIM') || s.includes('SUCCESS')) return 'TERKIRIM';
    if (s.includes('RETUR') || s.includes('GAGAL') || s.includes('CANCEL') || s.includes('INVALID')) return 'RETUR';
    return 'PROSES';
}

function getCourierName(exp) {
    if(!exp) return 'Ekspedisi';
    const up = exp.toUpperCase();
    if(MASTER_COURIERS[up]) return MASTER_COURIERS[up].name;
    return exp;
}

function renderSidebarMenu() {
    const menuList = document.getElementById('courierMenuList');
    menuList.innerHTML = '';

    const groupsData = {};
    
    // Calculate stats based on today's date as per React
    const todayStr = document.getElementById('filterDate').value || moment().format('YYYY-MM-DD');

    collectionData.forEach(x => {
        const itemDate = moment(x.timestamp).format('YYYY-MM-DD');
        if (itemDate !== todayStr) return; // Only count today's for the badge

        const exp = (x.expedition || 'UNKNOWN').toUpperCase();
        if(!groupsData[exp]) groupsData[exp] = { total: 0, delivered: 0, process: 0, retur: 0 };
        groupsData[exp].total++;
        const cat = getStatusCategory(x.pickupstatus);
        if(cat === 'TERKIRIM') groupsData[exp].delivered++;
        else if(cat === 'RETUR') groupsData[exp].retur++;
        else groupsData[exp].process++;
    });

    Object.keys(MASTER_COURIERS).forEach(cId => {
        const cName = MASTER_COURIERS[cId].name;
        const data = groupsData[cId] || { total: 0, delivered: 0, process: 0, retur: 0 };
        
        let countBadge = '';
        if (data.total > 0) {
            countBadge = `<span class="bg-amber-500 text-zinc-900 text-[10px] font-black px-2 py-0.5 rounded-full sidebar-text">${data.total}</span>`;
        }
        
        const btnWrapper = document.createElement('div');
        btnWrapper.className = "flex flex-col relative group";
        btnWrapper.innerHTML = `
            <button onclick="toggleCourierDropdown('${cId}', '${cName}')" id="btn-courier-${cId}" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-zinc-400 hover:bg-zinc-800/50 hover:text-white theme-sidebar-link overflow-hidden">
                <div class="flex items-center gap-3">
                    <i class="fa-solid fa-truck-fast text-xs min-w-[20px] text-center"></i>
                    <span class="text-sm sidebar-text whitespace-nowrap">${cName}</span>
                </div>
                <div class="flex items-center gap-2 sidebar-text">
                    ${countBadge}
                    <i id="icon-courier-${cId}" class="fa-solid fa-chevron-down text-[10px] transition-transform duration-300"></i>
                </div>
            </button>
            <div id="dropdown-${cId}" class="overflow-hidden transition-all duration-300 max-h-0 opacity-0 sidebar-text">
                <div class="pl-11 pr-3 py-2 space-y-2 border-l border-zinc-800 ml-5">
                    <div onclick="selectCourierStatus('${cId}', '${cName}', 'TERKIRIM')" class="flex items-center justify-between text-xs text-zinc-500 cursor-pointer hover:text-emerald-400">
                        <span>Terkirim</span>
                        ${data.delivered > 0 ? `<span class="bg-emerald-500/20 text-emerald-400 px-1.5 rounded text-[9px]">${data.delivered}</span>` : ''}
                    </div>
                    <div onclick="selectCourierStatus('${cId}', '${cName}', 'PROSES')" class="flex items-center justify-between text-xs text-zinc-500 cursor-pointer hover:text-amber-400">
                        <span>Proses</span>
                        ${data.process > 0 ? `<span class="bg-amber-500/20 text-amber-400 px-1.5 rounded text-[9px]">${data.process}</span>` : ''}
                    </div>
                    <div onclick="selectCourierStatus('${cId}', '${cName}', 'RETUR')" class="flex items-center justify-between text-xs text-zinc-500 cursor-pointer hover:text-rose-400">
                        <span>Retur</span>
                        ${data.retur > 0 ? `<span class="bg-rose-500/20 text-rose-400 px-1.5 rounded text-[9px]">${data.retur}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        menuList.appendChild(btnWrapper);
    });
}

window.toggleCourierDropdown = function(cId, cName) {
    if (activeCourierIdGlobal === cId) {
        // Toggle off
        document.getElementById(`dropdown-${cId}`).classList.remove('max-h-40', 'mt-1', 'opacity-100');
        document.getElementById(`dropdown-${cId}`).classList.add('max-h-0', 'opacity-0');
        document.getElementById(`icon-courier-${cId}`).classList.remove('rotate-180');
        document.getElementById(`btn-courier-${cId}`).classList.remove('bg-zinc-800/80', 'text-white', 'font-bold');
        document.getElementById(`btn-courier-${cId}`).classList.add('text-zinc-400');
        activeCourierIdGlobal = null;
        appRouter('dashboard');
    } else {
        // Close all other
        Object.keys(MASTER_COURIERS).forEach(id => {
            const dropdown = document.getElementById(`dropdown-${id}`);
            const btn = document.getElementById(`btn-courier-${id}`);
            const icon = document.getElementById(`icon-courier-${id}`);
            if(dropdown) {
                dropdown.classList.remove('max-h-40', 'mt-1', 'opacity-100');
                dropdown.classList.add('max-h-0', 'opacity-0');
                icon.classList.remove('rotate-180');
                btn.classList.remove('bg-zinc-800/80', 'text-white', 'font-bold');
                btn.classList.add('text-zinc-400');
            }
        });
        
        // Open this
        document.getElementById(`dropdown-${cId}`).classList.remove('max-h-0', 'opacity-0');
        document.getElementById(`dropdown-${cId}`).classList.add('max-h-40', 'mt-1', 'opacity-100');
        document.getElementById(`icon-courier-${cId}`).classList.add('rotate-180');
        document.getElementById(`btn-courier-${cId}`).classList.add('bg-zinc-800/80', 'text-white', 'font-bold');
        document.getElementById(`btn-courier-${cId}`).classList.remove('text-zinc-400');
        
        activeCourierIdGlobal = cId;
        appRouter('expedition', cId, cName);
    }
}

window.selectCourierStatus = function(cId, cName, status) {
    appRouter('expedition', cId, cName);
    filterTable(status);
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    }
}

window.appRouter = function(view, courierId = null, courierName = null) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    activeView = view;

    if (view === 'dashboard') {
        document.getElementById('view-dashboard').classList.remove('hidden');
        document.getElementById('topNavTitle').innerText = 'Ringkasan Toko';
        const btnDashboard = document.querySelector(`button[onclick="appRouter('dashboard')"]`);
        if(btnDashboard) {
            document.querySelectorAll('.theme-sidebar-link').forEach(btn => {
                btn.classList.remove('bg-amber-500/10', 'text-amber-500', 'font-bold', 'border-amber-500/20', 'bg-zinc-800/80', 'text-white');
            });
            btnDashboard.classList.add('bg-amber-500/10', 'text-amber-500', 'font-bold', 'border-amber-500/20');
        }
        updateDashboardStats();
    } 
    else if (view === 'admin') {
        document.getElementById('view-admin').classList.remove('hidden');
        document.getElementById('topNavTitle').innerText = 'Admin Panel';
        const btnAdmin = document.getElementById('btn-admin');
        if(btnAdmin) {
            document.querySelectorAll('.theme-sidebar-link').forEach(btn => {
                btn.classList.remove('bg-amber-500/10', 'text-amber-500', 'font-bold', 'border-amber-500/20', 'bg-zinc-800/80', 'text-white');
            });
            btnAdmin.classList.add('bg-amber-500/10', 'text-amber-500', 'font-bold', 'border-amber-500/20');
        }
        fetchAdminData();
        fetchLeaderboard();
    }
    else if (view === 'expedition') {
        document.getElementById('view-expedition').classList.remove('hidden');
        document.getElementById('topNavTitle').innerText = courierName;
        document.getElementById('inputCourierNameLabel').innerText = courierName;
        document.getElementById('colCourierId').value = courierId;
        document.getElementById('colCourierName').value = courierName;
        
        const btnDashboard = document.querySelector(`button[onclick="appRouter('dashboard')"]`);
        if(btnDashboard) btnDashboard.classList.remove('bg-amber-500/10', 'text-amber-500', 'font-bold', 'border-amber-500/20');

        currentFilter = 'SEMUA'; 
        updateFilterUI();
        applyFilters(); // instead of direct renderTable, use applyFilters which reads date and search
    }

    if (window.innerWidth < 768 && view === 'dashboard') {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    }
}

function updateDashboardStats() {
    renderSidebarMenu(); // Refresh counts

    const filterDateForDash = document.getElementById('filterDate').value || moment().format('YYYY-MM-DD');
    let baseData = collectionData;
    if (filterDateForDash) {
        baseData = baseData.filter(item => moment(item.timestamp).format('YYYY-MM-DD') === filterDateForDash);
    }

    const total = baseData.length;
    const delivered = baseData.filter(d => getStatusCategory(d.pickupstatus) === 'TERKIRIM').length;
    const problem = baseData.filter(d => getStatusCategory(d.pickupstatus) === 'RETUR').length;
    const process = total - delivered - problem;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statDelivered').innerText = delivered;
    document.getElementById('statProcess').innerText = process;
    document.getElementById('statProblem').innerText = problem;

    const recentTable = document.getElementById('dashRecentTable');
    recentTable.innerHTML = '';
    
    // Default to today's date for Dashboard if filtering is needed
    const recentData = baseData.slice(0, 8); 
    
    if(recentData.length === 0) {
        recentTable.innerHTML = '<tr><td colspan="2" class="p-6 text-center text-zinc-500 text-xs italic">Belum ada data hari ini.</td></tr>';
    } else {
        recentData.forEach(item => {
            const cat = getStatusCategory(item.pickupstatus);
            let badgeClass = 'bg-amber-500/20 text-amber-400'; 
            if(cat === 'TERKIRIM') badgeClass = 'bg-emerald-500/20 text-emerald-400';
            else if(cat === 'RETUR') badgeClass = 'bg-rose-500/20 text-rose-400';
            
            recentTable.insertAdjacentHTML('beforeend', `
                <tr class="hover:bg-zinc-800/40 cursor-pointer transition-colors" onclick="trackResiFromTable('${item.resi}', '${item.expedition}')">
                    <td class="px-4 py-3">
                        <p class="font-black tracking-widest text-white text-xs">${item.resi}</p>
                        <p class="text-[9px] text-zinc-500 uppercase mt-0.5">${getCourierName(item.expedition)}</p>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="px-2 py-1 rounded text-[9px] font-black tracking-wider ${badgeClass}">${cat}</span>
                    </td>
                </tr>
            `);
        });
    }

    const dashboardVisible = !document.getElementById('view-dashboard').classList.contains('hidden');
    if (dashboardVisible) {
        const ctx = document.getElementById('shippingChart').getContext('2d');
        if (myChart) myChart.destroy(); 
        
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Terkirim', 'Diproses', 'Bermasalah'],
                datasets: [{
                    data: [delivered, process, problem],
                    backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                    borderWidth: 0, hoverOffset: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '78%',
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, color: '#a1a1aa', font: { weight: 'bold', size: 10 } } } }
            }
        });

        // Bar Chart Logic
        const barCtx = document.getElementById('weeklyBarChart');
        if (barCtx) {
            if (barChart) barChart.destroy();

            // Generate last 7 days labels
            const last7Days = Array.from({length: 7}, (_, i) => moment().subtract(6 - i, 'days').format('YYYY-MM-DD'));
            const displayLabels = last7Days.map(date => moment(date).format('DD MMM'));
            
            // Calculate counts per day
            const dailyData = last7Days.map(date => {
                return collectionData.filter(item => moment(item.timestamp).format('YYYY-MM-DD') === date).length;
            });

            barChart = new Chart(barCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: displayLabels,
                    datasets: [{
                        label: 'Resi Diinput',
                        data: dailyData,
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderRadius: 8,
                        barPercentage: 0.6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a1a1aa', stepSize: 1 } },
                        x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 10 } } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#18181b', titleColor: '#f59e0b', bodyColor: '#fff', borderColor: '#27272a', borderWidth: 1, padding: 12 }
                    }
                }
            });
        }
    }
}
// --- AUDIO SYSTEM ---
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSystemSound(type) {
    try {
        if (!audioCtx) audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(1.5, audioCtx.currentTime); 
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
            
            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2); gain2.connect(audioCtx.destination);
                osc2.frequency.setValueAtTime(1200, audioCtx.currentTime);
                gain2.gain.setValueAtTime(1.5, audioCtx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                osc2.start(); osc2.stop(audioCtx.currentTime + 0.1);
            }, 120);
        } else if (type === 'double') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(1.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'cancel' || type === 'error') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(1.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        }
    } catch(e) { console.log('Audio error:', e); }
}

async function handleSaveResi(e) {
    e.preventDefault();
    const courierId = document.getElementById('colCourierId').value;
    const courierName = document.getElementById('colCourierName').value;
    const awbInput = document.getElementById('colAwb');
    const awb = awbInput.value.trim().toUpperCase();
    
    if (collectionData.find(item => item.resi === awb && item.expedition === courierId)) {
        playSystemSound('double');
        Swal.fire({ icon: 'warning', title: 'Resi Dobel!', text: 'Resi sudah terdaftar.', background: '#18181b', color: '#fff' });
        return;
    }

    Swal.fire({
        title: 'Verifikasi...', background: '#18181b', color: '#fff',
        allowOutsideClick: false, didOpen: () => { Swal.showLoading() }
    });

    try {
        let apiStatus = "PROSES";
        const apiKey = "3f4878c780923585911ca5155bbe44dfe6360fa47865ca535033b5d3e04295d4";
        const response = await fetch(`https://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=${courierId}&awb=${awb}`);
        const result = await response.json();

        if (result.status === 200) {
            apiStatus = result.data?.summary?.status?.toUpperCase() || "PROSES";
            if (getStatusCategory(apiStatus) === 'RETUR' && apiStatus.includes('CANCEL')) {
                playSystemSound('cancel');
                Swal.fire({ icon: 'error', title: 'Resi Dibatalkan!', text: 'Ditolak ekspedisi.', background: '#18181b', color: '#ef4444' });
                return; 
            }
            playSystemSound('success');
            Swal.fire({icon: 'success', title: 'Tersimpan!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#18181b', color: '#fff'});
        } else {
            playSystemSound('error');
            Swal.fire({ icon: 'error', title: 'Tidak Valid', text: result.message, background: '#18181b', color: '#ef4444' });
            Swal.fire({icon: 'warning', title: 'Disimpan Offline', text: 'Resi tidak ditemukan saat dilacak, namun tetap disimpan.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#18181b', color: '#fff'});
        }

        const newId = 'pkg_' + Math.random().toString(36).substr(2, 9);
        const newResi = {
            id: newId,
            user_id: currentUser.id,
            resi: awb,
            expedition: courierId,
            expeditionName: courierName,
            pickupstatus: apiStatus,
            timestamp: moment().toISOString(),
            scannedat: moment().toISOString()
        };

        const { data, error } = await supabaseClient.from('packages').insert([newResi]).select();
        if(!error) {
            const insertedData = (data && data.length > 0) ? data[0] : newResi;
            collectionData.unshift(insertedData);
            awbInput.value = "";
            applyFilters();
            updateDashboardStats();
        }

    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#18181b', color: '#ef4444' });
    }
}

window.deleteResi = async function(id) {
    const result = await Swal.fire({
        title: 'Hapus Resi?', text: "Data tidak bisa dikembalikan!", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#3f3f46', confirmButtonText: 'Ya, Hapus!', background: '#18181b', color: '#fff'
    });
    if (result.isConfirmed) {
        const { error } = await supabaseClient.from('packages').delete().eq('id', id);
        if (!error) {
            collectionData = collectionData.filter(item => item.id !== id);
            applyFilters(); updateDashboardStats();
            Swal.fire({icon: 'success', title: 'Terhapus!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1000, background: '#18181b', color: '#fff'});
        }
    }
}

window.filterTable = function(status) {
    currentFilter = status; 
    updateFilterUI();
    applyFilters();
}

function updateFilterUI() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = "filter-btn text-zinc-500 hover:text-zinc-300 hover:bg-white/5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all";
        if(btn.innerText.toUpperCase() === currentFilter || (currentFilter === 'SEMUA' && btn.innerText.toUpperCase() === 'SEMUA')) {
            btn.className = "filter-btn active bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all";
        }
    });
}

window.clearDateFilter = function() {
    document.getElementById('filterDate').value = "";
    applyFilters();
}

window.applyFilters = function() {
    const activeCourierId = document.getElementById('colCourierId').value;
    const filterDate = document.getElementById('filterDate').value;
    const searchInput = document.getElementById('searchInput').value.toUpperCase();
    const dateDisplay = document.getElementById('dateDisplay');
    const clearDateBtn = document.getElementById('clearDateBtn');

    if (filterDate) {
        dateDisplay.innerText = moment(filterDate).locale('id').format('DD MMMM YYYY');
        clearDateBtn.classList.remove('hidden');
    } else {
        dateDisplay.innerText = "Pilih Tanggal...";
        clearDateBtn.classList.add('hidden');
    }

    const tbody = document.getElementById('tableBodyCollection');
    const emptyState = document.getElementById('emptyState');
    
    let filteredData = collectionData.filter(item => item.expedition === activeCourierId);
    
    if(currentFilter !== 'SEMUA') {
        filteredData = filteredData.filter(item => getStatusCategory(item.pickupstatus) === currentFilter);
    }

    if (filterDate) {
        filteredData = filteredData.filter(item => moment(item.timestamp).format('YYYY-MM-DD') === filterDate);
    }

    if (searchInput) {
        filteredData = filteredData.filter(item => item.resi.toUpperCase().includes(searchInput));
    }
    
    tbody.innerHTML = "";
    if (filteredData.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filteredData.forEach(item => {
            const cat = getStatusCategory(item.pickupstatus);
            
            let badgeClass = 'border-amber-500/30 text-amber-500';
            let catColor = 'border-amber-500/30 text-amber-500';
            if(cat === 'TERKIRIM') { 
                badgeClass = 'border-emerald-500/30 text-emerald-400'; 
                catColor = 'border-emerald-500/30 text-emerald-400';
            } else if(cat === 'RETUR') { 
                badgeClass = 'border-rose-500/30 text-rose-400';
                catColor = 'border-rose-500/30 text-rose-400';
            }
            
            const tr = `
                <tr class="hover:bg-white/[0.03] transition-colors duration-300 group">
                    <td class="px-6 py-5">
                        <p class="font-bold tracking-widest text-white text-sm group-hover:text-amber-400 transition-colors cursor-pointer" onclick="trackResiFromTable('${item.resi}', '${item.expedition}')">${item.resi}</p>
                        <p class="text-[10px] font-medium tracking-wide text-zinc-500 uppercase mt-1.5 flex items-center gap-1.5">
                            <i class="fa-solid fa-box text-zinc-600"></i> ${getCourierName(item.expedition)}
                        </p>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex flex-col gap-1.5">
                            <p class="text-xs font-bold text-zinc-200 uppercase">${item.pickupstatus || 'PROSES'}</p>
                            <div class="text-[10px] text-zinc-500 flex flex-col gap-1">
                                <span class="flex items-center gap-1.5"><i class="fa-solid fa-history"></i> ${moment(item.timestamp).format('DD MMM YYYY, HH:mm')}</span>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-3 py-1.5 rounded-md text-[10px] font-black tracking-wider border ${catColor}">
                            ${cat}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button 
                                onclick="trackResiFromTable('${item.resi}', '${item.expedition}')"
                                title="Lacak Realtime"
                                class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-zinc-950 transition-all">
                                <i class="fa-solid fa-map-location-dot text-xs"></i>
                            </button>
                            <button 
                                onclick="deleteResi('${item.id}')"
                                title="Hapus Data"
                                class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all">
                                <i class="fa-solid fa-trash-alt text-xs"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', tr);
        });
    }
}

// TRACKING MODAL
window.trackResiFromTable = async function(awb, courierId) {
    const modal = document.getElementById('trackModal');
    const modalContent = document.getElementById('modalContent');
    const modalTimeline = document.getElementById('modalTimeline');
    const loader = document.getElementById('modalLoader');
    
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modalContent.classList.remove('translate-y-full', 'md:scale-95'); }, 10);
    
    document.getElementById('modalTitle').innerText = awb;
    document.getElementById('modalSubTitle').innerText = getCourierName(courierId);
    modalTimeline.innerHTML = "";
    loader.classList.remove('hidden');

    const resiData = collectionData.find(item => item.resi === awb);

    try {
        const apiKey = "3f4878c780923585911ca5155bbe44dfe6360fa47865ca535033b5d3e04295d4";
        const response = await fetch(`https://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=${courierId}&awb=${awb}`);
        const result = await response.json();
        loader.classList.add('hidden');

        if (result.status === 200) {
            const historyData = result.data?.history || [];
            if (historyData.length === 0) {
                modalTimeline.innerHTML = `<div class="bg-amber-500/10 text-amber-500 p-4 rounded-2xl border border-amber-500/20 text-sm"><i class="fa-solid fa-info-circle mr-2"></i> Riwayat belum tersedia.</div>`;
            } else {
                historyData.forEach((item, index) => {
                    const isFirst = index === 0;
                    const tItem = `
                        <div class="relative pb-8 fade-in" style="animation-delay: ${index * 0.1}s">
                            <div class="absolute left-[-35px] w-4 h-4 rounded-full border-2 ${isFirst ? 'bg-amber-500 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-zinc-900 border-zinc-600'}"></div>
                            <div class="ml-2">
                                <p class="text-[10px] text-amber-500 font-bold uppercase tracking-widest">${item.date}</p>
                                <p class="mt-1 text-sm ${isFirst ? 'font-bold text-white' : 'text-zinc-400'} leading-relaxed">${item.desc}</p>
                            </div>
                        </div>
                    `;
                    modalTimeline.insertAdjacentHTML('beforeend', tItem);
                });
            }
            
            if(resiData && result.data?.summary?.status && resiData.pickupstatus !== result.data.summary.status) {
                const newStatus = result.data.summary.status;
                const { error } = await supabaseClient.from('packages').update({pickupstatus: newStatus}).eq('id', resiData.id);
                if (!error) {
                    resiData.pickupstatus = newStatus;
                    if(document.getElementById('colCourierId').value !== "") applyFilters();
                    updateDashboardStats(); 
                }
            }
        } else {
            modalTimeline.innerHTML = `<div class="bg-rose-500/10 text-rose-400 p-4 rounded-2xl border border-rose-500/20 text-sm"><i class="fa-solid fa-circle-exclamation mr-2"></i> ${result.message}</div>`;
        }
    } catch (error) {
        loader.classList.add('hidden');
        modalTimeline.innerHTML = `<div class="bg-zinc-800/50 text-zinc-400 p-4 rounded-2xl border border-zinc-700 text-sm"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Gagal menghubungi server.</div>`;
    }
}

window.closeModal = function() {
    const modal = document.getElementById('trackModal'); const modalContent = document.getElementById('modalContent');
    modal.classList.add('opacity-0'); modalContent.classList.add('translate-y-full', 'md:scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

// --- ADMIN PANEL LOGIC ---

async function fetchAdminData() {
    const pendingTable = document.getElementById('adminPendingTable');
    const activeTable = document.getElementById('adminActiveTable');
    
    pendingTable.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-zinc-500"><i class="fa-solid fa-circle-notch fa-spin text-xl text-amber-500 mb-2"></i></td></tr>`;
    activeTable.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-zinc-500"><i class="fa-solid fa-circle-notch fa-spin text-xl text-amber-500 mb-2"></i></td></tr>`;

    const { data: users, error } = await supabaseClient
        .from('users')
        .select('*')
        .order('name', { ascending: true });

    if (error || !users) {
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'error', title: 'Gagal Memuat Data', background: '#18181b', color: '#ef4444' });
        return;
    }

    const pendingUsers = users.filter(u => u.status === 'pending');
    const activeUsers = users.filter(u => u.status === 'approved' && u.id !== currentUser.id);

    document.getElementById('adminPendingCount').innerText = pendingUsers.length;
    document.getElementById('adminActiveCount').innerText = activeUsers.length;

    pendingTable.innerHTML = "";
    if (pendingUsers.length === 0) {
        pendingTable.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-zinc-500"><p class="font-medium">Tidak ada toko yang menunggu persetujuan.</p></td></tr>`;
    } else {
        pendingUsers.forEach(u => {
            pendingTable.insertAdjacentHTML('beforeend', `
                <tr class="hover:bg-zinc-800/30 transition-colors">
                    <td class="px-6 py-4">
                        <p class="font-black text-white text-sm">${u.name}</p>
                        <p class="text-[10px] text-zinc-500 mt-1">@${u.username}</p>
                        ${u.phone ? `<p class="text-[10px] text-zinc-400 mt-1.5"><i class="fa-brands fa-whatsapp text-emerald-500 mr-1"></i>${u.phone}</p>` : ''}
                        ${u.address ? `<p class="text-[10px] text-zinc-400 mt-0.5 leading-relaxed truncate max-w-[200px]" title="${u.address}"><i class="fa-solid fa-map-location-dot text-rose-400 mr-1"></i>${u.address}</p>` : ''}
                        <p class="text-[10px] text-zinc-500 mt-1.5"><i class="fa-solid fa-clock mr-1"></i>Menunggu Antrean</p>
                    </td>
                    <td class="px-6 py-4 align-top">
                        <p class="text-xs text-zinc-300 font-bold uppercase">${u.role === 'operator' ? 'Toko/Seller' : u.role}</p>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="rejectUser('${u.id}', '${u.name}')" class="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold tracking-wider whitespace-nowrap shadow-lg shadow-rose-500/10">
                                <i class="fa-solid fa-xmark mr-1"></i> TOLAK
                            </button>
                            <button onclick="approveUser('${u.id}', '${u.name}')" class="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 transition-all text-xs font-bold tracking-wider whitespace-nowrap shadow-lg shadow-emerald-500/10">
                                <i class="fa-solid fa-check-circle mr-1"></i> SETUJUI
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        });
    }

    activeTable.innerHTML = "";
    if (activeUsers.length === 0) {
        activeTable.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-zinc-500"><p class="font-medium">Belum ada pengguna aktif lainnya.</p></td></tr>`;
    } else {
        activeUsers.forEach(u => {
            activeTable.insertAdjacentHTML('beforeend', `
                <tr class="hover:bg-zinc-800/30 transition-colors">
                    <td class="px-6 py-4">
                        <p class="font-black text-white text-sm">${u.name}</p>
                        <p class="text-[10px] text-zinc-500 mt-1">@${u.username}</p>
                        ${u.phone ? `<p class="text-[10px] text-zinc-400 mt-1.5"><i class="fa-brands fa-whatsapp text-emerald-500 mr-1"></i>${u.phone}</p>` : ''}
                        ${u.address ? `<p class="text-[10px] text-zinc-400 mt-0.5 leading-relaxed truncate max-w-[200px]" title="${u.address}"><i class="fa-solid fa-map-location-dot text-rose-400 mr-1"></i>${u.address}</p>` : ''}
                        <p class="text-[10px] text-emerald-500 mt-1.5"><i class="fa-solid fa-circle-check mr-1"></i>Aktif Beroperasi</p>
                    </td>
                    <td class="px-6 py-4 align-top">
                        <p class="text-xs text-zinc-300 font-bold uppercase">${u.role === 'operator' ? 'Toko/Seller' : u.role}</p>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="rejectUser('${u.id}', '${u.name}')" class="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold tracking-wider whitespace-nowrap shadow-lg shadow-rose-500/10">
                            <i class="fa-solid fa-trash mr-1"></i> HAPUS
                        </button>
                    </td>
                </tr>
            `);
        });
    }
}

window.approveUser = async function(id, name) {
    const { error } = await supabaseClient.from('users').update({ status: 'approved' }).eq('id', id);
    if (!error) {
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Disetujui!', text: `${name} sekarang bisa mengakses aplikasi.`, background: '#18181b', color: '#10b981' });
        fetchAdminData();
    }
}

window.rejectUser = async function(id, name) {
    const result = await Swal.fire({
        title: `Hapus ${name}?`, text: "Data ini akan dihapus permanen.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#3f3f46', confirmButtonText: 'Ya, Hapus!', background: '#18181b', color: '#fff'
    });
    if (result.isConfirmed) {
        const { error } = await supabaseClient.from('users').delete().eq('id', id);
        if (!error) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Terhapus!', background: '#18181b', color: '#ef4444' });
            fetchAdminData();
        }
    }
}

window.exportToCSV = function() {
    const activeCourierId = document.getElementById('colCourierId').value;
    const dataToExport = collectionData.filter(item => item.expedition === activeCourierId);
    if(dataToExport.length === 0) return Swal.fire({title: 'Kosong', background: '#18181b', color: '#fff'});

    let csvContent = "data:text/csv;charset=utf-8,No Resi,Tanggal Input,Status Terakhir\n";
    dataToExport.forEach(row => { csvContent += `${row.resi},${moment(row.timestamp).format('YYYY-MM-DD')},${row.pickupstatus}\n`; });
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `Data_${activeCourierId}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function toggleScanner() {
    const readerDiv = document.getElementById("colReader");
    if (readerDiv.classList.contains("hidden")) {
        readerDiv.classList.remove("hidden");
        html5QrcodeScanner = new Html5QrcodeScanner("colReader", { fps: 10, qrbox: 250 });
        html5QrcodeScanner.render((decodedText) => {
            document.getElementById("colAwb").value = decodedText;
            html5QrcodeScanner.clear().then(() => {
                readerDiv.classList.add("hidden");
                document.getElementById("colForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            });
        }, () => {});
    } else {
        if(html5QrcodeScanner) {
            html5QrcodeScanner.clear().then(() => readerDiv.classList.add("hidden"));
        } else {
            readerDiv.classList.add("hidden");
        }
    }
}

function initSidebarMobile() {
    const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('sidebarOverlay');
    document.getElementById('openSidebar').addEventListener('click', () => { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); });
    const closeMenu = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };
    document.getElementById('closeSidebar').addEventListener('click', closeMenu); overlay.addEventListener('click', closeMenu);
}

window.toggleDesktopSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.contains('w-20');
    
    if (isCollapsed) {
        sidebar.classList.remove('w-20');
        sidebar.classList.add('w-64');
        document.querySelectorAll('.sidebar-text').forEach(el => el.classList.remove('hidden'));
        document.getElementById('brandLogo').classList.remove('hidden');
    } else {
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-20');
        document.querySelectorAll('.sidebar-text').forEach(el => el.classList.add('hidden'));
        document.getElementById('brandLogo').classList.add('hidden');
    }
}