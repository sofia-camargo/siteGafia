// src/js/planejamento.js

let map;
let directionsService;
let directionsRenderer;
let markers = []; // Array para guardar os marcadores
let usuarioEstaLogado = false; // Variável global para sabermos o status
let veiculoSelecionado = {
    autonomia: 300, // km (Default)
    eficiencia: 200 // Wh/km (Default)
}; // Objeto para armazenar os dados do carro selecionado

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
    
    // Adiciona listener para carregar dados do carro quando o dropdown mudar
    const selectCarro = document.getElementById('select-meu-carro');
    if (selectCarro) {
        selectCarro.addEventListener('change', updateSelectedVehicle);
    }

    // Verifica a sessão do usuário assim que a página carrega
    await checkSession(); 

    const outputSummary = document.getElementById('output-route-summary');
    if (outputSummary) outputSummary.style.display = 'none';
}

// Atualiza o objeto veiculoSelecionado quando o usuário muda a seleção
function updateSelectedVehicle(event) {
    const selectedValue = event.target.value;
    if (selectedValue) {
        veiculoSelecionado = JSON.parse(selectedValue);
        console.log("Veículo selecionado:", veiculoSelecionado);
    } else {
        // Volta para os valores default se nada for selecionado
        veiculoSelecionado = { autonomia: 300, eficiencia: 200 }; 
    }
}

// Verifica a sessão PHP
async function checkSession() { 
    const loginPrompt = document.getElementById('login-prompt'); 
    const selectCarro = document.getElementById('select-meu-carro'); 
    
    try {
        const response = await fetch('api/verificar_sessao.php'); 
        const session = await response.json();
        
        if (session.loggedIn) {
            usuarioEstaLogado = true;
            if (loginPrompt) loginPrompt.style.display = 'none'; // Esconde link de login
            if (selectCarro) selectCarro.style.display = 'block'; // Mostra seletor de carro

            // Carrega os veículos do usuário no dropdown
            try {
                const resCarros = await fetch('api/meus_veiculos.php?action=list_garage');
                const meusCarros = await resCarros.json();
                
                // Limpa opções antigas e adiciona a primeira opção
                selectCarro.innerHTML = '<option value="">Selecione seu Carro</option>';
                
                if (meusCarros && meusCarros.length > 0) {
                    meusCarros.forEach((carro, index) => {
                        const option = document.createElement('option');
                        // Salvamos os dados do carro no 'value' como JSON
                        option.value = JSON.stringify({
                            id: carro.id_carro,
                            autonomia: carro.dur_bat || 300, // IMPORTANTE: dur_bat precisa estar no DB
                            eficiencia: carro.eficiencia_wh_km || 200 // IMPORTANTE: adicione esta coluna
                        });
                        option.textContent = `${carro.nm_marca} ${carro.nm_modelo} (${carro.ano_carro})`;
                        
                        // Seleciona o primeiro carro por padrão e atualiza a variável global
                        if (index === 0) {
                             option.selected = true;
                             veiculoSelecionado = JSON.parse(option.value);
                        }
                        
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

// Calcula a penalidade de consumo baseada no peso (passageiros)
function getPenalidadePorPeso() {
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

// Calcula o consumo base (kWh) aplicando a penalidade de peso
function calcularConsumoEnergia(distanciaEmMetros) {
    // Puxa a eficiência do veículo selecionado (Wh/km)
    const eficienciaCarroWhPorKm = veiculoSelecionado.eficiencia; 
    const taxaConsumoKwhPorKm = eficienciaCarroWhPorKm / 1000;
    
    // Pega o multiplicador de peso
    const multiplicadorPeso = getPenalidadePorPeso();
    
    const distanciaEmKm = distanciaEmMetros / 1000;
    
    // Calcula o consumo total aplicando a penalidade
    const consumoTotal = distanciaEmKm * taxaConsumoKwhPorKm * multiplicadorPeso;
    
    return consumoTotal; // Retorna o total de kWh
}

// Calcula paradas necessárias e o tempo de recarga total
function calcularDadosAvancados(distanciaKm) {
    // Puxa a autonomia total do veículo selecionado (km)
    const autonomiaTotalCarroKm = veiculoSelecionado.autonomia; 
    
    const inputBateria = document.getElementById('bateria-atual');
    const bateriaAtual = inputBateria ? parseInt(inputBateria.value) || 100 : 100;

    // Calcula a autonomia real com base na bateria e peso
    const autonomiaInicialKm = (autonomiaTotalCarroKm * (bateriaAtual / 100)) / getPenalidadePorPeso();

    let paradas = 0;
    let recargaNecessaria = "Não";
    let tempoRecargaTotalMin = 0; // Inicializa em 0

    if (distanciaKm > autonomiaInicialKm) {
        recargaNecessaria = "Sim";
        
        // Distância restante após usar a bateria inicial
        let distanciaParaCobrir = distanciaKm - autonomiaInicialKm; 
        
        // O veículo fará recargas completas (usando a autonomia total do carro)
        paradas = Math.ceil(distanciaParaCobrir / autonomiaTotalCarroKm); 
    }

    const tempoRecargaPorParadaMin = 40; // 40 minutos (estimativa)
    tempoRecargaTotalMin = paradas * tempoRecargaPorParadaMin;
    
    document.getElementById('output-recarregar').innerText = recargaNecessaria;
    document.getElementById('output-paradas').innerText = paradas;
    document.getElementById('output-tempo-recarrega').innerText = tempoRecargaTotalMin + " minutos";

    // Mostra o bloco de detalhes avançados se o usuário estiver logado
    const advancedDetails = document.getElementById('advanced-route-details');
    if (usuarioEstaLogado && advancedDetails) {
        advancedDetails.style.display = 'block';
    }
    
    // Retorna as paradas e o tempo de recarga para o cálculo do tempo total
    return { paradas: paradas, tempoRecargaTotalMin: tempoRecargaTotalMin }; 
}

// Função auxiliar para formatar segundos em um formato legível (Ex: 1 hora e 30 minutos)
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let output = [];
    if (hours > 0) {
        output.push(`${hours} hora${hours > 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
        output.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);
    }
    
    // Retorna a saída, ou um valor padrão se for muito curto
    if (output.length === 0) {
        return "< 1 minuto";
    }

    return output.join(' e ');
}

function calculateAndDisplayRoute() {
    clearMarkers();
    const summaryContainer = document.getElementById('output-route-summary');
    const advancedDetails = document.getElementById('advanced-route-details'); 

    // Limpa e esconde os campos
    if (summaryContainer) summaryContainer.style.display = 'none';
    if (advancedDetails) advancedDetails.style.display = 'none';
    
    document.getElementById('output-distancia').innerText = '---'; 
    document.getElementById('output-duracao').innerText = '---'; 
    document.getElementById('output-energia').innerText = '---';
    document.getElementById('output-recarregar').innerText = '---';
    document.getElementById('output-paradas').innerText = '---';
    document.getElementById('output-tempo-recarrega').innerText = '---';
    document.getElementById('output-tempo-total').innerText = '---'; 

    const request = {
        origin: document.getElementById('origin-input').value,
        destination: document.getElementById('destination-input').value,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status == 'OK') {
            const rota = result.routes[0].legs[0];
            const distanciaEmMetros = rota.distance.value;
            const distanciaEmKm = distanciaEmMetros / 1000;
            const tempoConducaoSegundos = rota.duration.value; // Duração da condução (em segundos)
            
            const energiaEstimado = calcularConsumoEnergia(distanciaEmMetros);
                
            document.getElementById('output-distancia').innerText = rota.distance.text; 
            document.getElementById('output-duracao').innerText = rota.duration.text;
            document.getElementById('output-energia').innerText = energiaEstimado.toFixed(2) + ' kWh'; 
            if (summaryContainer) summaryContainer.style.display = 'block'; 
            
            const { paradas: paradasNecessarias, tempoRecargaTotalMin } = calcularDadosAvancados(distanciaEmKm); 
    
            const tempoRecargaSegundos = tempoRecargaTotalMin * 60;
            const tempoTotalViagemSegundos = tempoConducaoSegundos + tempoRecargaSegundos;
            
            // Exibe o tempo total formatado
            document.getElementById('output-tempo-total').innerText = formatTime(tempoTotalViagemSegundos);
            
            directionsRenderer.setDirections(result); 
            
            // Se houver paradas necessárias, busca estações usando Open Charge Map
            // (ou busca mesmo sem paradas para informar ao usuário, conforme sua preferência)
            findChargingStations(result);
            
        } else {
            if (summaryContainer) summaryContainer.style.display = 'none'; 
            alert('Não foi possível calcular a rota. Erro: ' + status);
        }
    });
}

// --- FUNÇÃO PARA BUSCAR PONTOS DE CARREGAMENTO (OPEN CHARGE MAP) ---
async function findChargingStations(routeResult) {
    // *** Sua chave de API do Open Charge Map ***
    const OCM_API_KEY = "c1b598ab-8144-43d6-9c74-e191d034ab21"; 
    
    // Configurações de busca
    const DISTANCE_KM = 5;       // Raio de busca em torno do ponto
    const MAX_RESULTS = 5;       // Máximo de resultados por ponto amostrado
    const SAMPLE_STEP = 50;      // Amostrar 1 ponto a cada 50 pontos da rota

    clearMarkers(); 
    
    const processedOcmIds = new Set();
    const routePath = routeResult.routes[0].overview_path; 
    const fetchPromises = [];

    // Cria requisições assíncronas ao longo do trajeto
    for (let i = 0; i < routePath.length; i += SAMPLE_STEP) {
        const point = routePath[i];
        const latitude = point.lat();
        const longitude = point.lng();

        const OCM_URL = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${latitude}&longitude=${point.lng()}&distance=${DISTANCE_KM}&maxresults=${MAX_RESULTS}&key=${OCM_API_KEY}`;
        
        fetchPromises.push(fetch(OCM_URL));
    }
    
    try {
        const responses = await Promise.all(fetchPromises);
        let allStations = [];

        for (const response of responses) {
            if (response.ok) {
                const stations = await response.json();
                
                stations.forEach(station => {
                    // Evita duplicatas usando o ID único da estação
                    if (!processedOcmIds.has(station.ID)) {
                        processedOcmIds.add(station.ID);
                        allStations.push(station);
                    }
                });
            } else {
                console.error(`Falha em uma requisição OCM: ${response.status}`);
            }
        }
        
        console.log(`Total de ${allStations.length} estações únicas encontradas ao longo do trajeto.`);
        
        if (allStations.length > 0) {
            allStations.forEach(station => {
                const placeData = {
                    location: { 
                        lat: station.AddressInfo.Latitude, 
                        lng: station.AddressInfo.Longitude 
                    },
                    displayName: station.AddressInfo.Title 
                };
                createMarkerForPlace(placeData);
            });
        }
    } catch (error) {
        console.error('Erro ao processar as buscas de estações:', error);
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