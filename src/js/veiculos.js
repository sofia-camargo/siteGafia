// src/js/veiculos.js

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const listaVeiculosDiv = document.getElementById('lista-veiculos');
    const formAddVeiculo = document.getElementById('form-add-veiculo');
    
    // Novos elementos para a busca
    const inputPesquisa = document.getElementById('input-pesquisa-carro');
    const sugestoesDiv = document.getElementById('sugestoes-veiculos');
    const selectedCarroIdInput = document.getElementById('selected-carro-id');
    const btnAdicionar = document.getElementById('btn-adicionar');
    
    let debounceTimer; // Timer para atrasar a pesquisa enquanto o usuário digita

    // --- FUNÇÕES GERAIS DE BUSCA E GESTÃO ---

    // 1. Função Genérica para fazer requisições FETCH
    const fetchData = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error("Erro na requisição:", error);
            // Retorna uma estrutura consistente em caso de erro
            return { error: 'Falha ao buscar dados.' };
        }
    };

    // 2. Carregar todos os veículos do usuário (Lista Inicial)
    const carregarVeiculos = async () => {
        // Chamada para o endpoint list_garage
        const veiculos = await fetchData('api/meus_veiculos.php?action=list_garage'); 
        listaVeiculosDiv.innerHTML = ''; 

        if (veiculos.error) {
            listaVeiculosDiv.innerHTML = `<p class="error-msg">Erro ao carregar garagem: ${veiculos.error}</p>`;
            return;
        }

        if (veiculos.length === 0) {
            listaVeiculosDiv.innerHTML = '<p>Você ainda não tem veículos na sua garagem.</p>';
            return;
        }

        // Renderiza cada veículo como um "card"
        veiculos.forEach(veiculo => {
            const card = document.createElement('div');
            card.className = 'card veiculo-card';
            
            // Usamos os valores dur_bat e eficiencia_wh_km para exibir detalhes
            const eficiencia = veiculo.eficiencia_wh_km ? `(${veiculo.eficiencia_wh_km} Wh/km)` : '';
            
            card.innerHTML = `
                <h3>${veiculo.nm_marca} ${veiculo.nm_modelo}</h3>
                <p>Ano: ${veiculo.ano_carro}</p>
                <p>Bateria: ${veiculo.dur_bat} kWh ${eficiencia}</p>
                <button class="btn btn-danger btn-sm" data-carro-id="${veiculo.id_carro}">Remover</button>
            `;
            listaVeiculosDiv.appendChild(card);
        });

        // Adiciona listeners para os botões de remover
        document.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', removerVeiculo);
        });
    };

    // 3. Remover um veículo (DELETE request)
    const removerVeiculo = async (event) => {
        const carroId = event.target.dataset.carroId;
        if (!confirm(`Tem certeza que deseja remover este veículo da sua garagem?`)) {
            return;
        }

        const response = await fetch('api/meus_veiculos.php?action=delete_veiculo', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carro_id: carroId })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            carregarVeiculos(); // Recarrega a lista
        } else {
            alert(`Erro ao remover: ${result.error}`);
        }
    };


    // LÓGICA DE PESQUISA (AUTOCOMPLETE)

    // 4. Função para buscar sugestões no PHP (com debounce)
    const buscarSugestoes = async (query) => {
        sugestoesDiv.innerHTML = ''; // Limpa sugestões antigas
        sugestoesDiv.style.display = 'none';

        if (query.length < 3) return;

        // Requisição para o novo endpoint de busca unificada
        const carros = await fetchData(`api/meus_veiculos.php?action=search_veiculos&q=${encodeURIComponent(query)}`);
        
        if (carros.error || carros.length === 0) {
            sugestoesDiv.innerHTML = '<div style="padding: 0.5rem; color: #777;">Nenhum veículo encontrado.</div>';
            sugestoesDiv.style.display = 'block';
            return;
        }

        // Renderiza as sugestões
        carros.forEach(carro => {
            const eficiencia = carro.eficiencia_wh_km ? `(${carro.eficiencia_wh_km} Wh/km)` : '';
            const item = document.createElement('div');
            item.className = 'sugestao-item'; // Você pode estilizar esta classe no seu CSS
            item.style.cssText = 'padding: 0.75rem; cursor: pointer; border-bottom: 1px solid #eee;';
            item.innerHTML = `
                <strong>${carro.nm_marca} ${carro.nm_modelo}</strong>, ${carro.ano_carro} 
                <span style="float: right; color: #555; font-size: 0.9em;">${carro.dur_bat} kWh ${eficiencia}</span>
            `;
            // Armazena o ID do carro no elemento
            item.dataset.carroId = carro.id_carro;
            item.dataset.carroNome = `${carro.nm_marca} ${carro.nm_modelo} ${carro.ano_carro}`;
            
            // Adiciona o listener de clique para selecionar o veículo
            item.addEventListener('click', selecionarSugestao);
            sugestoesDiv.appendChild(item);
        });

        sugestoesDiv.style.display = 'block';
    };

    // 5. Função para selecionar um veículo da lista de sugestões
    const selecionarSugestao = (event) => {
        const target = event.target.closest('.sugestao-item');
        
        const carroId = target.dataset.carroId;
        const carroNome = target.dataset.carroNome;
        
        // 1. Define o ID do carro no campo oculto
        selectedCarroIdInput.value = carroId;
        
        // 2. Preenche o campo de pesquisa com o nome completo
        inputPesquisa.value = carroNome; 
        
        // 3. Oculta as sugestões e habilita o botão de adicionar
        sugestoesDiv.innerHTML = '';
        sugestoesDiv.style.display = 'none';
        btnAdicionar.disabled = false;
    };

    // --- EVENT LISTENERS ---

    // Listener de digitação no campo de pesquisa
    inputPesquisa.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Desabilita o botão e limpa o ID selecionado se o texto for alterado
        btnAdicionar.disabled = true;
        selectedCarroIdInput.value = '';
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            buscarSugestoes(query);
        }, 300); // 300ms de atraso para evitar requisições excessivas
    });
    
    document.addEventListener('click', (e) => {
        if (!inputPesquisa.contains(e.target) && !sugestoesDiv.contains(e.target)) {
            sugestoesDiv.style.display = 'none';
        }
    });

    formAddVeiculo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const carroId = selectedCarroIdInput.value;
        if (!carroId) {
            alert('Por favor, pesquise e selecione um veículo válido na lista de sugestões.');
            return;
        }
        
        btnAdicionar.disabled = true; // Desabilita para evitar cliques duplos

        const response = await fetch('api/meus_veiculos.php?action=add_veiculo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carro_id: carroId })
        });

        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            // Reseta o formulário após sucesso
            formAddVeiculo.reset();
            selectedCarroIdInput.value = ''; 
            carregarVeiculos(); // Recarrega a lista
        } else {
            alert(`Erro ao adicionar: ${result.error}`);
        }
        
        // Reabilita o botão no final, se o formulário não tiver sido resetado
        btnAdicionar.disabled = false; 
    });

    // --- INICIALIZAÇÃO ---
    carregarVeiculos();
});