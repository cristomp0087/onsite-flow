import { supabase } from './config.js';

// --- CONFIGURAÇÃO INICIAL ---
const ZOOM_LEVEL = 18;
let map, userMarker, accuracyCircle;
let currentUserPosition = null;

// --- 1. MAPA & GPS ---

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([45.4215, -75.6972], 13);
    
    // Satélite
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    }).addTo(map);
    
    // Ruas por cima
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
}

function startTracking() {
    const statusBox = document.getElementById('status-indicator');
    const actionBtn = document.getElementById('action-btn');

    if (!navigator.geolocation) {
        statusBox.innerHTML = "❌ GPS não suportado";
        return;
    }

    navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            currentUserPosition = { lat, lng };

            statusBox.innerHTML = `✅ GPS Ativo (Precisão: ${Math.round(accuracy)}m)`;
            statusBox.className = 'status-box active';
            
            actionBtn.removeAttribute('disabled');
            actionBtn.innerText = "📍 Fazer Check-in Aqui";

            updateUserMarker(lat, lng, accuracy);
        },
        (error) => {
            console.error(error);
            statusBox.innerHTML = "⚠️ Sinal GPS fraco";
            statusBox.className = 'status-box error';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function updateUserMarker(lat, lng, accuracy) {
    if (!userMarker) {
        userMarker = L.marker([lat, lng]).addTo(map);
        accuracyCircle = L.circle([lat, lng], { radius: accuracy, color: '#3388ff', fillOpacity: 0.2 }).addTo(map);
        map.setView([lat, lng], ZOOM_LEVEL);
    } else {
        userMarker.setLatLng([lat, lng]);
        accuracyCircle.setLatLng([lat, lng]);
        accuracyCircle.setRadius(accuracy);
    }
}

// Botão de Check-in
document.getElementById('action-btn').addEventListener('click', async () => {
    if (!currentUserPosition) return;
    const nomeLocal = prompt("Nome deste local (ex: Obra Shopping):");
    
    if (nomeLocal) {
        const btn = document.getElementById('action-btn');
        btn.innerText = "Salvando...";
        
        // Salva na tabela 'locais'
        const { error: erroLocal } = await supabase
            .from('locais')
            .insert([{ 
                nome: nomeLocal, 
                latitude: currentUserPosition.lat, 
                longitude: currentUserPosition.lng,
                raio: 100
            }]);

        // Salva na tabela 'registros' (cria o log inicial)
        const { error: erroReg } = await supabase
            .from('registros')
            .insert([{
                local_nome: nomeLocal,
                entrada: new Date(), // Hora atual
                usuario: 'Eu (Teste)' // Futuramente pegaremos do login
            }]);

        if (erroLocal || erroReg) {
            alert("Erro ao salvar.");
            btn.innerText = "Tentar Novamente";
        } else {
            alert("✅ Check-in realizado!");
            btn.innerText = "📍 Fazer Check-in Aqui";
            loadReports(); // Atualiza a lista se estiver aberta
        }
    }
});

// --- 2. RELATÓRIOS (ABA 2) ---

async function loadReports() {
    const listContainer = document.getElementById('report-list');
    listContainer.innerHTML = '<p style="text-align:center; margin-top:20px; color:#999">Carregando...</p>';

    const { data, error } = await supabase
        .from('registros')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !data) {
        listContainer.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar ou lista vazia.</p>';
        return;
    }

    listContainer.innerHTML = ''; // Limpa

    data.forEach(reg => {
        const card = createReportCard(reg);
        listContainer.appendChild(card);
    });
}

function createReportCard(reg) {
    const div = document.createElement('div');
    div.className = 'report-card';

    const dataDia = new Date(reg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    let textoHoras = "⏱️ Em andamento...";
    let totalHoras = 0;

    if (reg.entrada && reg.saida) {
        const entrada = new Date(reg.entrada);
        const saida = new Date(reg.saida);
        const diffHrs = (saida - entrada) / (1000 * 60 * 60);
        totalHoras = diffHrs.toFixed(1);
        textoHoras = `⏱️ ${totalHoras}h trabalhadas`;
    } else if (reg.entrada) {
        const entrada = new Date(reg.entrada);
        textoHoras = `⏱️ Iniciado às ${entrada.getHours()}:${String(entrada.getMinutes()).padStart(2,'0')}`;
    }

    div.innerHTML = `
        <div class="report-header">
            <span>📍 ${reg.local_nome || 'Local'}</span>
            <span>${dataDia}</span>
        </div>
        <div class="report-time">${textoHoras}</div>
        <div style="font-size: 0.85em; color: #888; margin-top:5px;">👤 ${reg.usuario || 'Usuário'}</div>
        <button class="share-btn">📤 Compartilhar</button>
    `;

    div.querySelector('.share-btn').onclick = () => shareReport(reg, totalHoras);
    return div;
}

function shareReport(reg, totalHoras) {
    const texto = `📍 *Relatório OnSite*\n🏢 ${reg.local_nome}\n📅 ${new Date(reg.created_at).toLocaleDateString('pt-BR')}\n⏱️ Status: ${totalHoras > 0 ? totalHoras + 'h' : 'Em andamento'}`;
    
    if (navigator.share) {
        navigator.share({ title: 'Relatório', text: texto }).catch(console.error);
    } else {
        navigator.clipboard.writeText(texto);
        alert('Copiado para área de transferência!');
    }
}

// --- 3. SISTEMA DE ABAS ---

// Tornamos a função global para o HTML poder chamar
window.switchTab = function(tab) {
    if (tab === 'map') {
        document.getElementById('map-screen').style.display = 'block';
        document.getElementById('report-screen').classList.remove('visible');
        document.querySelectorAll('.nav-item')[0].classList.add('active');
        document.querySelectorAll('.nav-item')[1].classList.remove('active');
    } else {
        document.getElementById('map-screen').style.display = 'none';
        document.getElementById('report-screen').classList.add('visible');
        document.querySelectorAll('.nav-item')[0].classList.remove('active');
        document.querySelectorAll('.nav-item')[1].classList.add('active');
        loadReports(); // Carrega dados ao abrir a aba
    }
}

// Inicia tudo
initMap();
startTracking();