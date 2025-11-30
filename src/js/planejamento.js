// src/js/planejamento.js

let map;
let directionsService;
let directionsRenderer;
let markers = []; 
let usuarioEstaLogado = false; 
let veiculoSelecionado = { id: null, autonomia: 300, eficiencia: 200 }; 

async function initMap() {
    // Importações das bibliotecas do Google Maps
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { Autocomplete } = await google.maps.importLibrary("places");
    const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");

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

// Atualiza a variável global quando o usuário troca de carro no dropdown
function updateSelectedVehicle(event) {
    const selectedValue = event.target.value;
    if (selectedValue) {
        veiculoSelecionado = JSON.parse(selectedValue);
    } else {
        veiculoSelecionado = { id: null, autonomia: 300, eficiencia: 200 }; 
    }
}

// Verifica sessão PHP e carrega os carros
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

// Carrega a lista de carros do usuário no <select>
async function carregarVeiculos(selectElement) {
    try {
        const res = await fetch('api/meus_veiculos.php?action=list_garage');
        const carros = await res.json();
        
        selectElement.innerHTML = '<option value="">Selecione seu Carro</option>';
        if (carros && carros.length > 0) {
            carros.forEach((carro, index) => {
                const option = document.createElement('option');
                // Salva os dados técnicos no value do option para uso no cálculo
                option.value = JSON.stringify({
                    id: carro.id_carro, 
                    autonomia: carro.dur_bat, 
                    eficiencia: carro.eficiencia_wh_km || 200 
                });
                option.textContent = `${carro.nm_marca} ${carro.nm_modelo}`;
                
                // Seleciona o primeiro automaticamente
                if (index === 0) {
                     option.selected = true;
                     veiculoSelecionado = JSON.parse(option.value);
                }
                selectElement.appendChild(option);
            });
        }
    } catch (e) { console.error("Erro ao carregar veículos", e); }
}

// Lógica principal: Calcula rota e salva
function calculateAndDisplayRoute() {
    clearMarkers(); // Limpa marcadores anteriores (se houver função clearMarkers)

    // 1. CAPTURA O TEXTO DO ENDEREÇO
    // Pega o valor .value direto do input HTML (que o Google Autocomplete preencheu)
    const origemTexto = document.getElementById('origin-input').value;
    const destinoTexto = document.getElementById('destination-input').value;
    
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
            
            // Exibir dados na tela (IDs conforme seu HTML)
            document.getElementById('output-distancia').innerText = rota.distance.text;
            document.getElementById('output-duracao').innerText = rota.duration.text;
            
            // Cálculo simplificado de paradas
            const autonomiaReal = veiculoSelecionado.autonomia || 300;
            const paradas = Math.ceil(Math.max(0, distanciaKm - autonomiaReal) / autonomiaReal);
            const tempoRecargaMin = paradas * 40; // Estima 40min por parada
            
            // Exibe recargas na tela
            document.getElementById('output-paradas').innerText = paradas;
            document.getElementById('output-tempo-recarrega').innerText = tempoRecargaMin + " min";

            // 2. SALVAR NO BANCO DE DADOS
            // Só salva se o usuário estiver logado e tiver um carro selecionado
            if (usuarioEstaLogado && veiculoSelecionado.id) {
                
                const dadosViagem = {
                    id_carro: veiculoSelecionado.id,
                    origem: origemTexto,      // Envia o texto da cidade
                    destino: destinoTexto,    // Envia o texto da cidade
                    distancia_km: distanciaKm,
                    tempo_viagem_segundos: tempoSegundos + (tempoRecargaMin * 60), // Soma tempo de recarga
                    paradas: paradas
                };

                salvarViagemNoHistorico(dadosViagem);
            }
            
            // Opcional: Buscar postos de recarga
            // findChargingStations(result); 

        } else {
            alert('Erro ao calcular rota: ' + status);
        }
    });
}

// Função AJAX para enviar ao PHP
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
        markers[i].map = null;
    }
    markers = [];
}

// Inicia
initMap();