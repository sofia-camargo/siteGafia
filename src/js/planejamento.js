// src/js/planejamento.js

let map;
let directionsService;
let directionsRenderer;
let markers = []; 
let usuarioEstaLogado = false; 
let veiculoSelecionado = { id: null, autonomia: 300, eficiencia: 200 }; 

const OCM_API_KEY = "c1b598ab-8144-43d6-9c74-e191d034ab21";

async function initMap() {
    // Importações das bibliotecas do Google Maps
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { Autocomplete } = await google.maps.importLibrary("places");
    const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");
    // O import das bibliotecas do Google Maps está no planejamento.html

    directionsService = new DirectionsService();
    directionsRenderer = new DirectionsRenderer();

    // Inicializa o Mapa
    map = new Map(document.getElementById("map"), {
        zoom: 4,
        center: { lat: -14.235, lng: -51.925 }, // Centro do Brasil
        mapId: "GAFIA_MAP_STYLE"
    });

    directionsRenderer.setMap(map);
    
    // Configura os inputs de endereço
    const originInput = document.getElementById('origin-input');
    const destinationInput = document.getElementById('destination-input');
    
    if (originInput && destinationInput) {
        // Autocomplete restrito ao Brasil
        new Autocomplete(originInput, { componentRestrictions: { country: "br" } });
        new Autocomplete(destinationInput, { componentRestrictions: { country: "br" } });
    }

    // Botão de Calcular
    const btnCalc = document.getElementById('calculate-route');
    if(btnCalc) btnCalc.addEventListener('click', calculateAndDisplayRoute);
    
    // Dropdown de Seleção de Carro
    const selectCarro = document.getElementById('select-meu-carro');
    if (selectCarro) selectCarro.addEventListener('change', updateSelectedVehicle);

    // Verifica se o usuário está logado ao carregar a página
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
        const response = await fetch('api/verificar_sessao.php'); 
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
        console.error('Erro ao verificar sessão:', error);
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

// ==========================================================
// FUNÇÃO NOVA: BUSCAR E EXIBIR PONTOS DE RECARGA (OCM)
// ==========================================================

async function findChargingStations(bounds) {
    clearMarkers(); // Limpa marcadores anteriores
    
    // Obtém as coordenadas do centro da rota
    const centerLat = (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2;
    const centerLng = (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2;
    
    // Define um raio de busca (em KM)
    const distanceKm = 1000; // 1000km de raio (Para cobrir o Brasil)

    // A API da OCM permite buscar por raio em torno de um ponto
    const ocmUrl = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${centerLat}&longitude=${centerLng}&distance=${distanceKm}&maxresults=100&verbose=false&countrycode=BR&key=${OCM_API_KEY}`;
    
    if (OCM_API_KEY === "SUA_CHAVE_OCM_AQUI") {
        console.warn("ATENÇÃO: A chave OCM não foi atualizada. A busca por pontos de recarga pode falhar.");
    }
    
    try {
        const response = await fetch(ocmUrl);
        const data = await response.json();

        console.log(`OCM: Encontrados ${data.length} pontos de recarga.`);

        if (data && data.length > 0) {
            data.forEach(poi => {
                if (poi.AddressInfo && poi.AddressInfo.Latitude && poi.AddressInfo.Longitude) {
                    
                    const position = { lat: poi.AddressInfo.Latitude, lng: poi.AddressInfo.Longitude };
                    
                    // Cria uma string simples com informações do ponto
                    let infoWindowContent = `
                        <strong>${poi.AddressInfo.Title || 'Ponto de Recarga'}</strong><br>
                        ${poi.AddressInfo.AddressLine1 || ''} - ${poi.AddressInfo.StateOrProvince || ''}<br>
                        Status: ${poi.StatusType ? poi.StatusType.Title : 'Desconhecido'}
                    `;
                    
                    // Cria o marcador
                    const marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        title: poi.AddressInfo.Title || 'Ponto de Recarga',
                        icon: {
                            url: 'https://maps.google.com/mapfiles/kml/pal4/icon58.png', // Ícone de recarga (simples)
                            scaledSize: new google.maps.Size(32, 32)
                        }
                    });

                    // Adiciona um InfoWindow ao clicar
                    const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });
                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });

                    markers.push(marker); // Armazena o marcador para poder limpar depois
                }
            });
        }
    } catch (error) {
        console.error("Erro ao buscar pontos de recarga na OCM:", error);
    }
}


function calculateAndDisplayRoute() {
    clearMarkers(); 

    // 1. CAPTURA O TEXTO DO ENDEREÇO
    const originInput = document.getElementById('origin-input');
    const destinationInput = document.getElementById('destination-input');
    const origemTexto = originInput.value;
    const destinoTexto = destinationInput.value;
    
    if(!origemTexto || !destinoTexto) {
        alert("Por favor, preencha origem e destino.");
        return;
    }

    const request = {
        origin: origemTexto,
        destination: destinoTexto,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status == 'OK') {
            directionsRenderer.setDirections(result);
            
            const rota = result.routes[0].legs[0];
            const distanciaKm = rota.distance.value / 1000;
            const tempoSegundos = rota.duration.value;
            
            // Variáveis do Veículo
            const autonomiaBateriaKWh = veiculoSelecionado.autonomia || 300; // kWh
            const eficienciaWhKm = veiculoSelecionado.eficiencia || 200; // Wh/km

            // Exibir dados básicos
            document.getElementById('output-distancia').innerText = rota.distance.text;
            document.getElementById('output-duracao').innerText = rota.duration.text;
            
            // Cálculo e Exibição do Consumo
            const consumoKWh = (distanciaKm * eficienciaWhKm) / 1000;
            document.getElementById('output-energia').innerText = `${consumoKWh.toFixed(1)} kWh`;

            // Cálculo de paradas
            const distanciaPorCarga = (autonomiaBateriaKWh * 1000) / eficienciaWhKm;
            const paradas = Math.ceil(Math.max(0, distanciaKm / distanciaPorCarga) - 1);
            const tempoRecargaMin = paradas * 40; 

            // Cálculo do tempo total
            const tempoTotalSegundos = tempoSegundos + (tempoRecargaMin * 60);
            const tempoTotalHoras = Math.floor(tempoTotalSegundos / 3600);
            const tempoTotalMin = Math.round((tempoTotalSegundos % 3600) / 60);
            
            // Torna o bloco de detalhes visível
            const advancedDetails = document.getElementById('advanced-route-details');
            if (advancedDetails) {
                 advancedDetails.style.display = 'block'; 
            }

            // Exibe recargas e tempos
            document.getElementById('output-paradas').innerText = paradas;
            document.getElementById('output-tempo-recarrega').innerText = tempoRecargaMin + " min";
            document.getElementById('output-tempo-total').innerText = `${tempoTotalHoras}h ${tempoTotalMin}m`;
            document.getElementById('output-recarregar').innerText = (paradas > 0 ? "Sim" : "Não"); 

            // 2. SALVAR NO BANCO DE DADOS
            if (usuarioEstaLogado && veiculoSelecionado.id) {
                const dadosViagem = {
                    id_carro: veiculoSelecionado.id,
                    origem: origemTexto,     
                    destino: destinoTexto,   
                    distancia_km: distanciaKm,
                    tempo_viagem_segundos: tempoTotalSegundos, 
                    paradas: paradas
                };
                salvarViagemNoHistorico(dadosViagem);
            }
            
            // 3. NOVO: Buscar postos de recarga usando os limites da rota
            const bounds = result.routes[0].bounds;
            findChargingStations(bounds); 

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
        
        if(resultado.success) {
            console.log("Histórico atualizado com sucesso.");
        } else {
            console.warn("Aviso ao salvar histórico:", resultado.message);
        }
    } catch (error) {
        console.error("Erro de conexão ao salvar histórico:", error);
    }
}

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null); // Usar setMap(null) para remover do mapa
    }
    markers = [];
}

// Inicia
initMap();