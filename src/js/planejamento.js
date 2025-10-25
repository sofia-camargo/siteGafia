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
    // directionsRenderer.setPanel(document.getElementById('directions-panel')); - Removido temporariamente - Sua função é
    //calcular e exibir a rota no painel, mas estamos focando na exibição no mapa.
    const originInput = document.getElementById('origin-input');
    const destinationInput = document.getElementById('destination-input');
    new Autocomplete(originInput);
    new Autocomplete(destinationInput);

    document.getElementById('calculate-route').addEventListener('click', calculateAndDisplayRoute);
}

function calculateAndDisplayRoute() {
    clearMarkers();
    
    // Referência ao novo contêiner de resumo da rota
    const summaryContainer = document.getElementById('output-route-summary');

    // 1. Oculta o painel de resumo e limpa os campos em cada nova tentativa
    summaryContainer.style.display = 'none';
    document.getElementById('output-distancia').innerText = '---'; 
    document.getElementById('output-duracao').innerText = '---'; 
    
    // REMOVIDO: document.getElementById('directions-panel').innerHTML = ''; 
    // Esta linha foi removida pois impedia o directionsRenderer de funcionar.


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

            // 2. Exibe a distância e a duração no HTML para o usuário
            document.getElementById('output-distancia').innerText = distanciaTotal; 
            document.getElementById('output-duracao').innerText = duracaoTotal;
            summaryContainer.style.display = 'block'; // Torna o contêiner visível

            // Esta linha agora funcionará e irá reescrever o directions-panel
            directionsRenderer.setDirections(result); 
            findChargingStations(result);
        } else {
            // Se falhar, garante que o contêiner permaneça oculto
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
    
    // A nova API usa um método diferente para a busca
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
        markers[i].map = null; // A nova forma de remover marcadores
    }
    markers = [];
}

// Inicia o mapa
initMap();