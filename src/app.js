import { supabase } from './config.js';

let map, userMarker, accuracyCircle;
let currentPos = null;
let knownSites = []; 
let currentSite = null; 
let currentRecordId = null; // ID do registro aberto no banco
let isWorking = false; 

// --- 1. INICIALIZAÇÃO ---
async function init() {
    initMap();
    await checkCurrentStatus(); // Verifica se já tem ponto aberto
    await loadKnownSites(); 
    startGPS();
}

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([0, 0], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri'
    }).addTo(map);
}

// --- 2. VERIFICAÇÃO DE STATUS (MEMÓRIA DO APP) ---
async function checkCurrentStatus() {
    // Busca o último registro que NÃO tem saída (ou seja, está aberto)
    const { data, error } = await supabase
        .from('registros')
        .select('*')
        .is('saida', null)
        .order('entrada', { ascending: false })
        .limit(1);

    if (data && data.length > 0) {
        // ACHOU UM TRABALHO ABERTO!
        const registro = data[0];
        isWorking = true;
        currentRecordId = registro.id;
        updateMainButton("🛑 Parar Trabalho", true);
        console.log("Retomando trabalho aberto:", registro.local_nome);
    }
}

// --- 3. GESTÃO DE LOCAIS ---
async function loadKnownSites() {
    const { data } = await supabase.from('locais').select('*');
    if (data) {
        knownSites = data;
        knownSites.forEach(site => {
            L.circle([site.latitude, site.longitude], {
                color: 'yellow', fillColor: '#f03', fillOpacity: 0.1, radius: site.raio || 100
            }).addTo(map).bindPopup(`🏗️ ${site.nome}`);
        });
    }
}

// Botão Criar Obra (Gestor)
document.getElementById('btn-create-site').addEventListener('click', async () => {
    if (!currentPos) return alert("Aguarde o GPS...");
    const nome = prompt("Nome da Nova Obra:");
    if (!nome) return;

    const { error } = await supabase.from('locais').insert([{
        nome: nome,
        latitude: currentPos.lat,
        longitude: currentPos.lng,
        raio: 100
    }]);

    if (!error) {
        alert("✅ Obra criada!");
        loadKnownSites();
    } else {
        alert("Erro: " + error.message);
    }
});

// --- 4. GEOFENCE E GPS ---
function startGPS() {
    const status = document.getElementById('status-indicator');
    navigator.geolocation.watchPosition(pos => {
        currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const acc = pos.coords.accuracy;

        status.innerHTML = `✅ GPS Ativo (${Math.round(acc)}m)`;
        status.className = 'status-box active';

        if (!userMarker) {
            userMarker = L.marker([currentPos.lat, currentPos.lng]).addTo(map);
            accuracyCircle = L.circle([currentPos.lat, currentPos.lng], { radius: acc }).addTo(map);
            map.setView([currentPos.lat, currentPos.lng], 18);
        } else {
            userMarker.setLatLng([currentPos.lat, currentPos.lng]);
            accuracyCircle.setLatLng([currentPos.lat, currentPos.lng]);
            accuracyCircle.setRadius(acc);
        }

        checkGeofence(currentPos.lat, currentPos.lng);
        
        // Ativa o botão se estiver travado
        const btn = document.getElementById('action-btn');
        if (btn.disabled) {
            btn.removeAttribute('disabled');
            if (!isWorking) btn.innerText = "📍 Check-in Manual";
        }

    }, err => console.error(err), { enableHighAccuracy: true });
}

function checkGeofence(lat, lng) {
    // Se já está trabalhando, a gente verifica se ele SAIU da obra
    if (isWorking) {
        // Lógica futura de saída automática...
        return; 
    }

    let foundSite = null;
    knownSites.forEach(site => {
        const from = turf.point([lng, lat]);
        const to = turf.point([site.longitude, site.latitude]);
        const distance = turf.distance(from, to, { units: 'meters' });
        if (distance < (site.raio || 100)) foundSite = site;
    });

    if (foundSite && currentSite !== foundSite) {
        currentSite = foundSite;
        showGeofenceAlert(foundSite);
        updateMainButton("📍 Entrar em: " + foundSite.nome, false);
    }
}

function showGeofenceAlert(site) {
    const box = document.getElementById('geofence-alert');
    document.getElementById('geo-msg').innerText = `Entrou na área: ${site.nome}`;
    box.style.display = 'block';
    document.getElementById('btn-confirm-geo').onclick = () => {
        doCheckIn(site.nome);
        box.style.display = 'none';
    };
}

// --- 5. AÇÕES (ENTRADA / SAÍDA) ---
const mainBtn = document.getElementById('action-btn');

mainBtn.addEventListener('click', () => {
    if (isWorking) {
        doCheckOut();
    } else {
        const localNome = currentSite ? currentSite.nome : prompt("Nome do Local (Manual):");
        if (localNome) doCheckIn(localNome);
    }
});

async function doCheckIn(nomeLocal) {
    mainBtn.innerText = "⏳ Abrindo ponto...";
    
    // Cria novo registro
    const { data, error } = await supabase.from('registros').insert([{
        local_nome: nomeLocal,
        usuario: 'Usuário Teste',
        entrada: new Date(),
        saida: null
    }]).select(); // .select() retorna o dado criado (precisamos do ID)

    if (!error && data) {
        isWorking = true;
        currentRecordId = data[0].id; // Guarda o ID para poder fechar depois
        updateMainButton("🛑 Parar Trabalho", true);
        alert(`✅ Turno iniciado em: ${nomeLocal}`);
    } else {
        alert("Erro: " + (error ? error.message : "Erro desconhecido"));
        updateMainButton("📍 Check-in Manual", false);
    }
}

async function doCheckOut() {
    const conf = confirm("Deseja encerrar o turno e calcular as horas?");
    if (!conf) return;

    mainBtn.innerText = "⏳ Fechando...";

    // Atualiza o registro existente (usa o ID guardado)
    const { error } = await supabase
        .from('registros')
        .update({ saida: new Date() })
        .eq('id', currentRecordId);

    if (!error) {
        isWorking = false;
        currentRecordId = null;
        currentSite = null;
        updateMainButton("📍 Check-in Manual", false);
        alert("⏹️ Turno fechado com sucesso!");
        if(window.loadReports) window.loadReports(); // Atualiza relatório na hora
    } else {
        alert("Erro ao fechar: " + error.message);
        updateMainButton("🛑 Parar Trabalho", true);
    }
}

function updateMainButton(text, active) {
    mainBtn.innerText = text;
    if (active) mainBtn.classList.add('working');
    else mainBtn.classList.remove('working');
}

// --- 6. RELATÓRIOS E CÁLCULOS ---
window.loadReports = async () => {
    const list = document.getElementById('report-list');
    list.innerHTML = "<p style='text-align:center'>Carregando...</p>";
    
    const { data } = await supabase
        .from('registros')
        .select('*')
        .order('entrada', { ascending: false }); // Do mais novo pro mais velho
    
    list.innerHTML = "";
    
    if (data && data.length > 0) {
        data.forEach(reg => {
            const card = createReportCard(reg);
            list.appendChild(card);
        });
    } else {
        list.innerHTML = "<p style='text-align:center; color:#999'>Nenhum registro.</p>";
    }
};

function createReportCard(reg) {
    const div = document.createElement('div');
    div.className = 'report-card';
    
    const dataDia = new Date(reg.entrada).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'});
    const horaEntrada = new Date(reg.entrada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    
    let conteudoHora = "";
    
    if (reg.saida) {
        // CÁLCULO DE HORAS
        const inicio = new Date(reg.entrada);
        const fim = new Date(reg.saida);
        const horaSaida = fim.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        
        // Diferença em milissegundos
        const diffMs = fim - inicio;
        // Converte para horas e minutos
        const totalMinutos = Math.floor(diffMs / 60000);
        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        
        conteudoHora = `
            <div style="color:#666; font-size:0.9em">
                ${horaEntrada} - ${horaSaida}
            </div>
            <div style="font-weight:bold; color:#000; font-size:1.1em; margin-top:4px">
                ⏱️ Total: ${horas}h ${minutos}m
            </div>
        `;
    } else {
        conteudoHora = `
            <div style="color:#2ecc71; font-weight:bold;">
                🟢 Em andamento desde ${horaEntrada}
            </div>
        `;
    }

    div.innerHTML = `
        <div class="report-header">
            <span>📍 ${reg.local_nome}</span>
            <span>${dataDia}</span>
        </div>
        ${conteudoHora}
    `;
    return div;
}

init();