// src/js/planejamento.js

let map;
let directionsService;
let directionsRenderer;
let markers = []; // Array para guardar os marcadores
let usuarioEstaLogado = false; // Variável global para sabermos o status

async function initMap() {
    // Importa as bibliotecas necessárias da API
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { Autocomplete } = await google.maps.importLibrary("places");
    const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");

    directionsService = new DirectionsService();
    directionsRenderer = new DirectionsRenderer();

    map = new Map(document.getElementById("map"), {
        zoom: 4,
        center: { lat: -14.235, lng: -51.925 }, // Centro do Brasil
        mapId: "GAFIA_MAP_STYLE" // Um ID para o estilo de mapa
    });

    directionsRenderer.setMap(map);
    
    const originInput = document.getElementById('origin-input');
    const destinationInput = document.getElementById('destination-input');
    new Autocomplete(originInput);
    new Autocomplete(destinationInput);

    document.getElementById('calculate-route').addEventListener('click', calculateAndDisplayRoute);

    // Verifica a sessão do usuário assim que a página carrega
    await checkSession(); 

    document.getElementById('output-route-summary').style.display = 'none';
}

// Verifica a sessão PHP (substitui a versão com token)
async function checkSession() { 
    const loginPrompt = document.getElementById('login-prompt'); // Novo ID
    const selectCarro = document.getElementById('select-meu-carro'); // Novo ID
    
    try {
        const response = await fetch('api/verificar_sessao.php'); 
        const session = await response.json();
        
        if (session.loggedIn) {
            usuarioEstaLogado = true;
            if (loginPrompt) loginPrompt.style.display = 'none'; // Esconde link de login
            if (selectCarro) selectCarro.style.display = 'block'; // Mostra seletor de carro

            // Carrega os veículos do usuário no dropdown
            try {
                const resCarros = await fetch('api/meus_veiculos.php'); // API da garagem
                const meusCarros = await resCarros.json();
                if (meusCarros && meusCarros.length > 0) {
                    meusCarros.forEach(carro => {
                        const option = document.createElement('option');
                        // Salvamos os dados do carro no 'value' como JSON
                        option.value = JSON.stringify({
                            id: carro.id_carro,
                            autonomia: carro.dur_bat || 300, // IMPORTANTE: dur_bat precisa estar no DB
                            eficiencia: carro.eficiencia_wh_km || 200 // IMPORTANTE: adicione esta coluna
                        });
                        option.textContent = `${carro.nm_marca} ${carro.nm_modelo} (${carro.ano_carro})`;
                        selectCarro.appendChild(option);
                    });
                } else {
                    selectCarro.innerHTML = '<option value="">Você não tem veículos na garagem</option>';
                }
            } catch (e) {
                console.error("Erro ao carregar veículos da garagem", e);
                selectCarro.innerHTML = '<option value="">Erro ao carregar veículos</option>';
            }

        } else {
            usuarioEstaLogado = false;
            if (loginPrompt) loginPrompt.style.display = 'block'; // Mostra link de login
            if (selectCarro) selectCarro.style.display = 'none'; // Esconde seletor de carro
        }
    } catch (error) {
        console.error('Falha na comunicação com o servidor de autenticação:', error);
        usuarioEstaLogado = false;
    }
}

// --- NOVA FUNÇÃO ---
// Calcula a penalidade de consumo baseada no peso (passageiros)
function getPenalidadePorPeso() {
    // Certifique-se de adicionar <input type="number" id="passageiros"> ao seu HTML
    const inputPassageiros = document.getElementById('passageiros');
    const passageiros = inputPassageiros ? parseInt(inputPassageiros.value) || 1 : 1;
    
    const pesoMedioPorPassageiro = 75; // kg
    // -1 pois o motorista (1) já está implícito
    const pesoAdicional = (passageiros > 0 ? passageiros - 1 : 0) * pesoMedioPorPassageiro; 
    
    // Estimativa: ~1.5% a mais de consumo a cada 75kg
    const penalidadePercentual = (pesoAdicional / 75) * 0.015; // 0.015 = 1.5%
    
    // Retorna um multiplicador (ex: 1.015 para 1 passageiro extra)
    return 1 + penalidadePercentual; 
}

// --- FUNÇÃO MODIFICADA ---
// Agora calcula o consumo base (kWh) aplicando a penalidade de peso
function calcularConsumoEnergia(distanciaEmMetros) {
    
    // **** DADO DO BANCO (PUXAR DO CARRO SELECIONADO) ****
    // Substituir pela eficiência (Wh/km) do carro selecionado pelo usuário
    const eficienciaCarroWhPorKm = 200; // Ex: 0.2 kWh/km = 200 Wh/km
    const taxaConsumoKwhPorKm = eficienciaCarroWhPorKm / 1000;
    
    // Pega o multiplicador de peso
    const multiplicadorPeso = getPenalidadePorPeso();
    
    const distanciaEmKm = distanciaEmMetros / 1000;
    
    // Calcula o consumo total aplicando a penalidade
    const consumoTotal = distanciaEmKm * taxaConsumoKwhPorKm * multiplicadorPeso;
    
    return consumoTotal; // Retorna o total de kWh
}

// --- NOVA FUNÇÃO ---
// Calcula paradas necessárias
function calcularDadosAvancados(distanciaKm) {
    // **** DADO DO BANCO (PUXAR DO CARRO SELECIONADO) ****
    // Substituir pela autonomia (dur_bat) do carro selecionado
    const autonomiaTotalCarroKm = 300; // Ex: 300 km
    
    // Certifique-se de adicionar <input type="number" id="bateria-atual"> ao seu HTML
    const inputBateria = document.getElementById('bateria-atual');
    const bateriaAtual = inputBateria ? parseInt(inputBateria.value) || 100 : 100;

    // Calcula a autonomia real com base na bateria e peso
    const autonomiaRealKm = (autonomiaTotalCarroKm * (bateriaAtual / 100)) / getPenalidadePorPeso();

    let paradas = 0;
    let recargaNecessaria = "Não";

    if (distanciaKm > autonomiaRealKm) {
        recargaNecessaria = "Sim";
        // Cálculo simples: (distância restante) / (autonomia total)
        const distanciaRestante = distanciaKm - autonomiaRealKm;
        paradas = Math.ceil(distanciaRestante / autonomiaTotalCarroKm);
    }

    // Atualiza a interface
    document.getElementById('output-recarregar').innerText = recargaNecessaria;
    document.getElementById('output-paradas').innerText = paradas;
    
    // Simples estimativa de tempo
    const tempoRecargaPorParadaMin = 40; // 40 minutos
    document.getElementById('output-tempo-recarrega').innerText = (paradas * tempoRecargaPorParadaMin) + " minutos";
}
    clearMarkers();
    const summaryContainer = document.getElementById('output-route-summary');
    const advancedDetails = document.getElementById('advanced-route-details'); // Novo ID
    const loginPrompt = document.getElementById('login-prompt'); // Novo ID

    // Limpa os campos
    summaryContainer.style.display = 'none';
    advancedDetails.style.display = 'none'; // Esconde o grupo avançado
    
    document.getElementById('output-distancia').innerText = '---'; 
    document.getElementById('output-duracao').innerText = '---'; 
    document.getElementById('output-energia').innerText = '---';
    document.getElementById('output-recarregar').innerText = '---';
    document.getElementById('output-paradas').innerText = '---';
    document.getElementById('output-tempo-recarrega').innerText = '---';

    const request = {
        origin: document.getElementById('origin-input').value,
        destination: document.getElementById('destination-input').value,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status == 'OK') {
            const rota = result.routes[0].legs[0];
            
            const energiaEstimado = calcularConsumoEnergia(rota.distance.value);
              
            document.getElementById('output-distancia').innerText = rota.distance.text; 
            document.getElementById('output-duracao').innerText = rota.duration.text;
            document.getElementById('output-energia').innerText = energiaEstimado.toFixed(2) + ' kWh'; 
            summaryContainer.style.display = 'block'; 
           
            directionsRenderer.setDirections(result); 
            findChargingStations(result);
        } else {
            summaryContainer.style.display = 'none'; 
            alert('Não foi possível calcular a rota. Erro: ' + status);
        }
    });
}

// --- Funções do Google Maps (sem alteração) ---
async function findChargingStations(routeResult) {
    const { Place } = await google.maps.importLibrary("places");
    const centerOfRoute = routeResult.routes[0].bounds.getCenter();
    
    const request = {
        textQuery: 'estação de recarga para veículos elétricos',
        location: centerOfRoute,
        radius: 50000,
    };
    
    const {places} = await Place.searchByText(request);
    
    console.log("Locais de carregamento encontrados:", places); 

    if (places.length) {
        places.forEach(place => {
            createMarkerForPlace(place);
        });
    } else {
        console.log('Nenhuma estação de recarga encontrada ao longo da rota.');
    }
}

async function createMarkerForPlace(place) {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const marker = new AdvancedMarkerElement({
        map: map,
        position: place.location,
        title: place.displayName
    });
    markers.push(marker);
}

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].map = null;
    }
    markers = [];
}

// Inicia o mapa
initMap();
