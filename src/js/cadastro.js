// src/js/cadastro.js

// Espera todo o conteúdo da página carregar antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA CARREGAR OS ESTADOS ---
    const selectEstado = document.getElementById('estado');

    async function carregarEstados() {
        // Verifica se o elemento <select> realmente existe na página
        if (!selectEstado) return;

        try {
            const response = await fetch('api/estados.php');
            if (!response.ok) {
                // Se a resposta não for OK (ex: 404 ou 500), lança um erro
                throw new Error(`Erro na rede: ${response.statusText}`);
            }
            const estados = await response.json();

            estados.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado.id_estado;
                option.textContent = estado.nm_estado;
                selectEstado.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar estados:', error);
            const option = document.createElement('option');
            option.value = "";
            option.textContent = 'Erro ao carregar estados';
            selectEstado.appendChild(option);
        }
    }

    // Chama a função para popular a lista de estados
    carregarEstados();

    // --- LÓGICA PARA ENVIAR O FORMULÁRIO DE CADASTRO ---
    const formCadastro = document.getElementById('form-cadastro');

    if (formCadastro) {
        formCadastro.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o recarregamento da página

            // Pega os dados do formulário
            const userData = {
                // ... (resto dos campos)
                estado: document.getElementById('estado').value,
                // ... (etc)
            };
            
            // O resto da sua lógica de submit...
        });
    }
});