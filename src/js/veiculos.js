// Substitua o conteúdo de src/js/veiculos.js por isto:

document.addEventListener('DOMContentLoaded', () => {
    // Seletores dos dropdowns
    const selectMarca = document.getElementById('select-marca');
    const selectModelo = document.getElementById('select-modelo');
    const selectAno = document.getElementById('select-ano');
    const form = document.getElementById('form-add-veiculo');

    // Proteção de página
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (!session.loggedIn) {
                window.location.href = 'login.html';
            } else {
                carregarMeusVeiculos(); // Carrega a garagem do usuário
                carregarMarcas(); // Inicia o processo dos dropdowns
            }
        });

    // 1. Carregar Marcas
    async function carregarMarcas() {
        try {
            const res = await fetch('api/get_marcas.php');
            const marcas = await res.json();
            
            selectMarca.innerHTML = '<option value="">Selecione a Marca</option>';
            marcas.forEach(marca => {
                selectMarca.innerHTML += `<option value="${marca.id_marca}">${marca.nm_marca}</option>`;
            });
        } catch (e) {
            console.error('Erro ao carregar marcas', e);
        }
    }

    // 2. Evento: Ao mudar a Marca, carregar Modelos
    selectMarca.addEventListener('change', async () => {
        const marcaId = selectMarca.value;
        selectModelo.disabled = true;
        selectAno.disabled = true;
        selectModelo.innerHTML = '<option value="">Carregando...</option>';
        
        if (!marcaId) return;

        try {
            const res = await fetch(`api/get_modelos.php?id_marca=${marcaId}`);
            const modelos = await res.json();
            
            selectModelo.innerHTML = '<option value="">Selecione o Modelo</option>';
            modelos.forEach(modelo => {
                selectModelo.innerHTML += `<option value="${modelo.id_modelo}">${modelo.nm_modelo}</option>`;
            });
            selectModelo.disabled = false;
        } catch (e) {
            console.error('Erro ao carregar modelos', e);
        }
    });

    // 3. Evento: Ao mudar o Modelo, carregar Anos (e o id_carro)
    selectModelo.addEventListener('change', async () => {
        const modeloId = selectModelo.value;
        selectAno.disabled = true;
        selectAno.innerHTML = '<option value="">Carregando...</option>';

        if (!modeloId) return;

        try {
            // Cuidado: o nome do seu arquivo pode estar 'get_ano_idCarrp.php'
            const res = await fetch(`api/get_ano_idCarrp.php?id_modelo=${modeloId}`);
            const anos = await res.json();
            
            selectAno.innerHTML = '<option value="">Selecione o Ano</option>';
            anos.forEach(carro => {
                // O valor da opção é o id_carro, o texto é o ano
                selectAno.innerHTML += `<option value="${carro.id_carro}">${carro.ano_carro}</option>`;
            });
            selectAno.disabled = false;
        } catch (e) {
            console.error('Erro ao carregar anos', e);
        }
    });

    // 4. Evento: Submissão do Formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // O ID do carro vem do dropdown de ano/id
        const carroId = selectAno.value; 

        if (!carroId) {
            alert('Por favor, selecione marca, modelo e ano do veículo.');
            return;
        }

        try {
            const response = await fetch('api/meus_veiculos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carro_id: carroId })
            });
            const result = await response.json();
            alert(result.message || result.error);
            
            if (response.ok) {
                carregarMeusVeiculos(); // Recarrega a lista da garagem
                // Limpa os selects
                form.reset();
                selectModelo.disabled = true;
                selectAno.disabled = true;
            }
        } catch (error) {
            alert('Erro de comunicação ao adicionar veículo.');
        }
    });
});

// Função para carregar a garagem (você já tinha, só copiei aqui)
async function carregarMeusVeiculos() {
    const lista = document.getElementById('lista-veiculos');
    lista.innerHTML = '<p class="muted">A carregar sua garagem...</p>';

    try {
        const response = await fetch('api/meus_veiculos.php'); // Método GET (padrão)
        const veiculos = await response.json();
        
        lista.innerHTML = ''; 
        if (veiculos.length === 0) {
            lista.innerHTML = '<p class="muted">Você ainda não tem veículos na sua garagem.</p>';
            return;
        }

        veiculos.forEach(v => {
            const card = document.createElement('article');
            card.className = 'card';
            // Adicionamos o 'data-id' para o botão de excluir (veja item 6)
            card.innerHTML = `
                <h3>${v.nm_marca} ${v.nm_modelo}</h3>
                <p>Ano: ${v.ano_carro}</p>
                <button class="btn-excluir" data-id="${v.id_carro}" style="color: red; background: none; border: none; cursor: pointer; font-size: 0.9rem; padding: 5px;">Excluir</button>
            `;
            lista.appendChild(card);
        });
        
        // Adiciona os eventos de clique aos novos botões de excluir (veja item 6)
        adicionarEventosExcluir();

    } catch (error) {
        lista.innerHTML = '<p class="muted">Ocorreu um erro ao carregar seus veículos.</p>';
    }
}

// (Funções do Item 6: Excluir Veículo)
function adicionarEventosExcluir() {
    document.querySelectorAll('.btn-excluir').forEach(button => {
        button.addEventListener('click', async (e) => {
            const carroId = e.target.dataset.id;
            if (confirm('Tem certeza que deseja remover este veículo da sua garagem?')) {
                try {
                    const res = await fetch('api/meus_veiculos.php', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ carro_id: carroId })
                    });
                    const result = await res.json();
                    alert(result.message || result.error);
                    if (res.ok) {
                        carregarMeusVeiculos(); // Recarrega a lista
                    }
                } catch (err) {
                    alert('Erro ao comunicar com o servidor.');
                }
            }
        });
    });
}