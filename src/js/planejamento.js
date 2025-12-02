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
                // Define valor padrão se a eficiência não existir
                const eficiencia = carro.eficiencia_wh_km || 200;
                
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    id: carro.id_carro, 
                    autonomia: carro.dur_bat, 
                    eficiencia: eficiencia 
                });
                option.textContent = `${carro.nm_marca} ${carro.nm_modelo}`;
                
                // Seleciona automaticamente o primeiro carro
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
            const autonomiaBateriaKWh = veiculoSelecionado.autonomia || 300;
            const eficienciaWhKm = veiculoSelecionado.eficiencia || 200;

            // Exibir dados na tela
            document.getElementById('output-distancia').innerText = rota.distance.text;
            document.getElementById('output-duracao').innerText = rota.duration.text;
            
            const consumoKWh = (distanciaKm * eficienciaWhKm) / 1000;
            document.getElementById('output-energia').innerText = `${consumoKWh.toFixed(1)} kWh`;

            const distanciaPorCarga = (autonomiaBateriaKWh * 1000) / eficienciaWhKm;
            const paradas = Math.ceil(Math.max(0, distanciaKm / distanciaPorCarga) - 1);
            const tempoRecargaMin = paradas * 40; 

            const tempoTotalSegundos = tempoSegundos + (tempoRecargaMin * 60);
            const tempoTotalHoras = Math.floor(tempoTotalSegundos / 3600);
            const tempoTotalMin = Math.round((tempoTotalSegundos % 3600) / 60);
            
            const advancedDetails = document.getElementById('advanced-route-details');
            if (advancedDetails) {
                 advancedDetails.style.display = 'block'; 
            }

            document.getElementById('output-paradas').innerText = paradas;
            document.getElementById('output-tempo-recarrega').innerText = tempoRecargaMin + " min";
            document.getElementById('output-tempo-total').innerText = `${tempoTotalHoras}h ${tempoTotalMin}m`;
            document.getElementById('output-recarregar').innerText = (paradas > 0 ? "Sim" : "Não"); 

            // =======================================================
            // LÓGICA DE SALVAMENTO CORRIGIDA
            // =======================================================
            if (usuarioEstaLogado) {
                if (veiculoSelecionado && veiculoSelecionado.id) {
                    console.log("Tentando salvar viagem...");
                    const dadosViagem = {
                        id_carro: veiculoSelecionado.id,
                        origem: origemTexto,     
                        destino: destinoTexto,   
                        distancia_km: distanciaKm,
                        tempo_viagem_segundos: tempoTotalSegundos, 
                        paradas: paradas
                    };
                    salvarViagemNoHistorico(dadosViagem);
                } else {
                    console.warn("Usuário logado, mas nenhum veículo válido selecionado. Viagem não salva.");
                }
            } else {
                console.log("Usuário não logado, viagem não será salva.");
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
        
        if(resultado.success) {
            console.log("Histórico atualizado com sucesso!");
        } else {
            console.warn("Erro ao salvar histórico (API):", resultado.message);
        }
    } catch (error) {
        console.error("Erro de conexão ao salvar histórico:", error);
    }
}

// Inicialização
initMap();