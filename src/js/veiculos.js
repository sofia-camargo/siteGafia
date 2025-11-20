// src/js/veiculos.js

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const listaVeiculosDiv = document.getElementById('lista-veiculos');
    const selectMarca = document.getElementById('select-marca');
    const selectModelo = document.getElementById('select-modelo');
    const selectAno = document.getElementById('select-ano');
    const formAddVeiculo = document.getElementById('form-add-veiculo');

    // --- FUNÇÕES GERAIS DE BUSCA E GESTÃO ---

    // 1. Função Genérica para fazer requisições FETCH
    const fetchData = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Lança um erro se o status HTTP não for 2xx
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error("Erro na requisição:", error);
            return { error: 'Falha ao buscar dados.' };
        }
    };

    // 2. Carregar todos os veículos do usuário (Lista Inicial)
    const carregarVeiculos = async () => {
        const veiculos = await fetchData('api/meus_veiculos.php');
        listaVeiculosDiv.innerHTML = ''; // Limpa o conteúdo anterior

        if (veiculos.error) {
            listaVeiculosDiv.innerHTML = `<p class="error-msg">Erro: ${veiculos.error}</p>`;
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
            card.innerHTML = `
                <h3>${veiculo.nm_marca} ${veiculo.nm_modelo}</h3>
                <p>Ano: ${veiculo.ano_carro}</p>
                <p>Bateria: ${veiculo.dur_bat} kWh</p>
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
        if (!confirm(`Tem certeza que deseja remover o veículo ID ${carroId} da sua garagem?`)) {
            return;
        }

        const response = await fetch('api/meus_veiculos.php', {
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


    // --- LÓGICA DE PREENCHIMENTO EM CASCATA ---

    // 4. Preenche o Select de Marcas
    const preencherMarcas = async () => {
        const marcas = await fetchData('api/marcas.php');
        if (marcas.error) return;

        marcas.forEach(marca => {
            const option = new Option(marca.nm_marca, marca.id_marca);
            selectMarca.add(option);
        });
        selectMarca.disabled = false;
    };

    // 5. Preenche o Select de Modelos
    const preencherModelos = async (marcaId) => {
        // Limpa e desativa os selects dependentes
        selectModelo.innerHTML = '<option value="">Selecione o Modelo</option>';
        selectAno.innerHTML = '<option value="">Selecione o Ano</option>';
        selectModelo.disabled = true;
        selectAno.disabled = true;

        if (!marcaId) return;

        const modelos = await fetchData(`api/modelos.php?marca_id=${marcaId}`);
        if (modelos.error) return;

        modelos.forEach(modelo => {
            const option = new Option(modelo.nm_modelo, modelo.id_modelo);
            selectModelo.add(option);
        });
        selectModelo.disabled = false;
    };

    // 6. Preenche o Select de Anos (Carros)
    const preencherAnos = async (modeloId) => {
        selectAno.innerHTML = '<option value="">Selecione o Ano</option>';
        selectAno.disabled = true;

        if (!modeloId) return;

        const carros = await fetchData(`api/carros.php?modelo_id=${modeloId}`);
        if (carros.error) return;

        carros.forEach(carro => {
            // O valor do option é o ID do carro (id_carro), que será enviado ao PHP
            const option = new Option(`${carro.ano_carro} (${carro.dur_bat} kWh)`, carro.id_carro);
            selectAno.add(option);
        });
        selectAno.disabled = false;
    };


    // --- EVENT LISTENERS ---

    selectMarca.addEventListener('change', (e) => {
        preencherModelos(e.target.value);
    });

    selectModelo.addEventListener('change', (e) => {
        preencherAnos(e.target.value);
    });

    // 7. Evento de submissão do formulário (POST request para adicionar)
    formAddVeiculo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const carroId = selectAno.value;
        if (!carroId) {
            alert('Por favor, selecione a marca, modelo e ano do veículo.');
            return;
        }

        const response = await fetch('api/meus_veiculos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carro_id: carroId })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            formAddVeiculo.reset();
            preencherModelos(null); // Reseta os selects
            carregarVeiculos(); // Recarrega a lista
        } else {
            alert(`Erro ao adicionar: ${result.error}`);
        }
    });

    // --- INICIALIZAÇÃO ---
    preencherMarcas();
    carregarVeiculos();
});