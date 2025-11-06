// src/js/planejamento.js

let map;
let directionsService;
let directionsRenderer;
let markers = []; // Array para guardar os marcadores

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

    document.getElementById('output-route-summary').style.display = 'none';
}

function calcularConsumoEnergia(distanciaEmMetros) {
    
    const taxaConsumoKwhPorKm = 0.2;  // TAXA DE CONSUMO ESTIMADA -  Conectar com o banco
    
    // Converte a distância de metros para quilômetros
    const distanciaEmKm = distanciaEmMetros / 1000;
    
    // Calcula o consumo total
    const consumoTotal = distanciaEmKm * taxaConsumoKwhPorKm;
    
    return consumoTotal;
}

function checkUserLoggedIn() {
    // -----------------------------------------------------------
    // ******* ESSA É A PARTE CRÍTICA E DEPENDE DO SEU BACKEND *******
    // -----------------------------------------------------------
    
    // 1. VERIFICAÇÃO COM TOKEN/COOKIE:
    //  O método mais seguro é verificar se existe um Token JWT ou um Cookie de Sessão válido.
    
    const authToken = localStorage.getItem('authToken'); // Exemplo: verifica token no LocalStorage
    
    if (authToken) {
        // Para uma verificação robusta, você faria um FETCH para o servidor
        // para validar se este token ainda é válido antes de retornar true.
        return true; 
    }
    
    return true; // Retorne true se o usuário estiver logado
    
    return false; // Retorne false se o usuário NÃO estiver logado
}

function calculateAndDisplayRoute() {

    if (!checkUserLoggedIn()) {
        
        alert('Você precisa estar logado para calcular e salvar a sua rota. Por favor, faça o login.');
        
        // Armazena a URL atual para que o login.html saiba para onde retornar
        localStorage.setItem('redirect_url', window.location.href); 
        
        // Redireciona para a página de login
        window.location.href = 'login.html'; 
        
        return; 
    }
    
    clearMarkers();
    const summaryContainer = document.getElementById('output-route-summary');

    summaryContainer.style.display = 'none';
    document.getElementById('output-distancia').innerText = '---'; 
    document.getElementById('output-duracao').innerText = '---'; 
    document.getElementById('output-energia').innerText = '---'; // Limpa o campo de energia


    const request = {
        origin: document.getElementById('origin-input').value,
        destination: document.getElementById('destination-input').value,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status == 'OK') {
            const rota = result.routes[0].legs[0];
            const distanciaTotal = rota.distance.text; 
            const duracaoTotal = rota.duration.text;
            
            const energiaEstimado = calcularConsumoEnergia(rota.distance.value); // Em metros
              
            document.getElementById('output-distancia').innerText = distanciaTotal; 
            document.getElementById('output-duracao').innerText = duracaoTotal;
            
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

async function findChargingStations(routeResult) {
    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
    const centerOfRoute = routeResult.routes[0].bounds.getCenter();

    const request = {
        // A nova API usa uma sintaxe um pouco diferente
        textQuery: 'estação de recarga para veículos elétricos',
        location: centerOfRoute,
        radius: 50000,
    };
    
    const { places } = await Place.searchByText(request);

    if (places.length) {
        places.forEach(place => {
            createMarkerForPlace(place);
        });
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