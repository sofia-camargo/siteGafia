// src/js/planejamento.js

let map;
let directionsService;
let directionsRenderer;
let markers = []; 
let usuarioEstaLogado = false; 
let veiculoSelecionado = { id: null, autonomia: 300, eficiencia: 200 }; 

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { Autocomplete } = await google.maps.importLibrary("places");
    const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");

    directionsService = new DirectionsService();
    directionsRenderer = new DirectionsRenderer();

    map = new Map(document.getElementById("map"), {
        zoom: 4,
        center: { lat: -14.235, lng: -51.925 },
        mapId: "GAFIA_MAP_STYLE"
    });

    directionsRenderer.setMap(map);
    
    const originInput = document.getElementById('origin-input');
    const destinationInput = document.getElementById('destination-input');
    
    // Evita erro se o elemento não existir na página
    if (originInput && destinationInput) {
        new Autocomplete(originInput, { componentRestrictions: { country: "br" } });
        new Autocomplete(destinationInput, { componentRestrictions: { country: "br" } });
    }

    const btnCalc = document.getElementById('calculate-route');
    if(btnCalc) btnCalc.addEventListener('click', calculateAndDisplayRoute);
    
    const selectCarro = document.getElementById('select-meu-carro');
    if (selectCarro) selectCarro.addEventListener('change', updateSelectedVehicle);

    await checkSession(); 
}

function updateSelectedVehicle(event) {
    const selectedValue = event.target.value;
    if (selectedValue) {
        veiculoSelecionado = JSON.parse(selectedValue);
    } else {
        veiculoSelecionado = { id: null, autonomia: 300, eficiencia: 200 }; 
    }
}

async function checkSession() { 
    const loginPrompt = document.getElementById('login-prompt'); 
    const selectCarro = document.getElementById('select-meu-carro'); 
    
    try {
        const response = await fetch('api/verificar_sessao.php'); // Verifique se este caminho está correto para sua estrutura
        const session = await response.json();
        
        if (session.loggedIn) {
            usuarioEstaLogado = true;
            if (loginPrompt) loginPrompt.style.display = 'none'; 
            if (selectCarro) {
                selectCarro.style.display = 'block';
                carregarVeiculos(selectCarro);
            }
        } else {
            usuarioEstaLogado = false;
            if (loginPrompt) loginPrompt.style.display = 'block'; 
            if (selectCarro) selectCarro.style.display = 'none'; 
        }
    } catch (error) {
        console.error('Erro sessão:', error);
    }
}

async function carregarVeiculos(selectElement) {
    try {
        const res = await fetch('api/meus_veiculos.php?action=list_garage');
        const carros = await res.json();
        
        selectElement.innerHTML = '<option value="">Selecione seu Carro</option>';
        if (carros && carros.length > 0) {
            carros.forEach((carro, index) => {
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    id: carro.id_carro, 
                    autonomia: carro.dur_bat, 
                    eficiencia: carro.eficiencia_wh_km || 200 
                });
                option.textContent = `${carro.nm_marca} ${carro.nm_modelo}`;
                if (index === 0) {
                     option.selected = true;
                     veiculoSelecionado = JSON.parse(option.value);
                }
                selectElement.appendChild(option);
            });
        }
    } catch (e) { console.error("Erro ao carregar veículos", e); }
}

function calculateAndDisplayRoute() {
    // ... (Mantém a lógica de limpar UI anterior) ...
    
    const request = {
        origin: document.getElementById('origin-input').value,
        destination: document.getElementById('destination-input').value,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status == 'OK') {
            directionsRenderer.setDirections(result);
            
            const rota = result.routes[0].legs[0];
            const distanciaKm = rota.distance.value / 1000;
            const tempoSegundos = rota.duration.value;
            
            // Lógica simples de cálculo de paradas para o exemplo
            const autonomiaReal = veiculoSelecionado.autonomia || 300;
            const paradas = Math.ceil(Math.max(0, distanciaKm - autonomiaReal) / autonomiaReal);
            const tempoRecargaMin = paradas * 40; 
            
            // Exibir resultados na tela...
            // (Seu código de display DOM aqui)

            // SALVAR NO BANCO
            if (usuarioEstaLogado && veiculoSelecionado.id) {
                salvarViagemNoHistorico({
                    id_carro: veiculoSelecionado.id,
                    origem: document.getElementById('origin-input').value,
                    destino: document.getElementById('destination-input').value,
                    distancia_km: distanciaKm,
                    tempo_viagem_segundos: tempoSegundos + (tempoRecargaMin * 60),
                    paradas: paradas
                });
            }
        } else {
            alert('Erro ao calcular rota: ' + status);
        }
    });
}

async function salvarViagemNoHistorico(dados) {
    try {
        const response = await fetch('api/salvar_viagem.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        const resultado = await response.json();
        if(resultado.success) console.log("Salvo no histórico.");
        else console.warn("Erro ao salvar:", resultado.message);
    } catch (error) {
        console.error("Erro requisição salvar:", error);
    }
}

initMap();