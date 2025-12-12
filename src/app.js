// src/app.js
import { supabase } from './config.js';

// Configuração Inicial
const ZOOM_LEVEL = 18; // Bem perto (nível rua)
let map, userMarker, accuracyCircle;
let currentUserPosition = null;

// 1. Iniciar o Mapa (Leaflet)
function initMap() {
    // Cria o mapa focado em Ottawa (padrão) até o GPS pegar
    map = L.map('map', { zoomControl: false }).setView([45.4215, -75.6972], 13);

    // Adiciona a camada de Satélite (Esri World Imagery) - Grátis e bonito
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    // Adiciona rótulos de ruas por cima do satélite (opcional, ajuda a se achar)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
}

// 2. Rastrear GPS
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
            const accuracy = position.coords.accuracy; // Precisão em metros

            currentUserPosition = { lat, lng };

            // Atualiza status visual
            statusBox.innerHTML = `✅ GPS Ativo (Precisão: ${Math.round(accuracy)}m)`;
            statusBox.className = 'status-box active';
            
            // Libera o botão
            actionBtn.removeAttribute('disabled');
            actionBtn.innerText = "📍 Fazer Check-in Aqui";

            // Desenha/Atualiza o marcador no mapa
            updateUserMarker(lat, lng, accuracy);
        },
        (error) => {
            console.error(error);
            statusBox.innerHTML = "⚠️ Sinal GPS fraco ou bloqueado";
            statusBox.className = 'status-box error';
        },
        {
            enableHighAccuracy: true, // Força usar o GPS hardware
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// 3. Atualizar Posição Visual no Mapa
function updateUserMarker(lat, lng, accuracy) {
    // Se for a primeira vez, cria o marcador
    if (!userMarker) {
        userMarker = L.marker([lat, lng]).addTo(map);
        accuracyCircle = L.circle([lat, lng], { radius: accuracy, color: '#3388ff', fillOpacity: 0.2 }).addTo(map);
        map.setView([lat, lng], ZOOM_LEVEL); // Voa para o usuário
    } else {
        // Se já existe, só move
        userMarker.setLatLng([lat, lng]);
        accuracyCircle.setLatLng([lat, lng]);
        accuracyCircle.setRadius(accuracy);
    }
}

// 4. Ação do Botão (Salvar no Banco)
document.getElementById('action-btn').addEventListener('click', async () => {
    if (!currentUserPosition) return;

    // Pergunta o nome do local (Simples por enquanto)
    const nomeLocal = prompt("Nome deste local (ex: Obra Shopping):");
    
    if (nomeLocal) {
        const btn = document.getElementById('action-btn');
        btn.innerText = "Salvando...";
        
        // Envia para o Supabase
        const { data, error } = await supabase
            .from('locais')
            .insert([
                { 
                    nome: nomeLocal, 
                    latitude: currentUserPosition.lat, 
                    longitude: currentUserPosition.lng,
                    raio: 100 // Padrão 100m
                }
            ]);

        if (error) {
            alert("Erro ao salvar: " + error.message);
            console.error(error);
            btn.innerText = "Tentar Novamente";
        } else {
            alert("✅ Local salvo com sucesso!");
            btn.innerText = "📍 Fazer Check-in Aqui";
        }
    }
});

// Inicia tudo
initMap();
startTracking();