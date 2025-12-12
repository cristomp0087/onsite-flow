// src/app.js
import { supabase } from './config.js';

let map, userMarker, currentPos;

// 1. INICIAR MAPA
function initMap() {
    map = L.map('map', { zoomControl: false }).setView([0, 0], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri'
    }).addTo(map);
}

// 2. PEGAR GPS
function startGPS() {
    const status = document.getElementById('status-indicator');
    const btn = document.getElementById('action-btn');

    navigator.geolocation.watchPosition(pos => {
        currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const acc = pos.coords.accuracy;

        status.innerHTML = `✅ GPS Ativo (Precisão: ${Math.round(acc)}m)`;
        status.className = 'status-box active';
        btn.removeAttribute('disabled');
        btn.innerText = "📍 Fazer Check-in";

        if (!userMarker) {
            userMarker = L.marker([currentPos.lat, currentPos.lng]).addTo(map);
            map.setView([currentPos.lat, currentPos.lng], 18);
        } else {
            userMarker.setLatLng([currentPos.lat, currentPos.lng]);
        }
    }, err => {
        console.error(err);
        status.innerHTML = "❌ Erro no GPS";
    }, { enableHighAccuracy: true });
}

// 3. SALVAR NO SUPABASE
document.getElementById('action-btn').addEventListener('click', async () => {
    const nome = prompt("Nome do Local:");
    if (!nome) return;

    document.getElementById('action-btn').innerText = "Salvando...";

    // Salva Local
    await supabase.from('locais').insert([{
        nome: nome,
        latitude: currentPos.lat,
        longitude: currentPos.lng,
        raio: 100
    }]);

    // Salva Registro
    const { error } = await supabase.from('registros').insert([{
        local_nome: nome,
        usuario: 'Teste Mobile',
        entrada: new Date()
    }]);

    if (error) {
        alert("Erro: " + error.message);
    } else {
        alert("✅ Salvo com sucesso!");
        loadReports(); // Atualiza lista
    }
    document.getElementById('action-btn').innerText = "📍 Fazer Check-in";
});

// 4. CARREGAR RELATÓRIOS
async function loadReports() {
    const list = document.getElementById('report-list');
    list.innerHTML = "Carregando...";
    
    const { data } = await supabase.from('registros').select('*').order('created_at', { ascending: false });
    
    list.innerHTML = "";
    if (data) {
        data.forEach(reg => {
            const div = document.createElement('div');
            div.className = 'report-card';
            div.innerHTML = `<b>📍 ${reg.local_nome}</b><br><small>${new Date(reg.created_at).toLocaleString()}</small>`;
            list.appendChild(div);
        });
    }
}

// 5. TROCAR ABAS
document.getElementById('tab-map').onclick = () => {
    document.getElementById('map-screen').style.display = 'block';
    document.getElementById('report-screen').classList.remove('visible');
    document.getElementById('tab-map').classList.add('active');
    document.getElementById('tab-report').classList.remove('active');
};

document.getElementById('tab-report').onclick = () => {
    document.getElementById('map-screen').style.display = 'none';
    document.getElementById('report-screen').classList.add('visible');
    document.getElementById('tab-map').classList.remove('active');
    document.getElementById('tab-report').classList.add('active');
    loadReports();
};

// RODAR TUDO
initMap();
startGPS();