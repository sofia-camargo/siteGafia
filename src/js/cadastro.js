// src/js/cadastro.js

document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA CARREGAR OS ESTADOS ---
    const selectEstado = document.getElementById('estado');

    async function carregarEstados() {
        if (!selectEstado) return;

        try {
            // O caminho do fetch foi corrigido aqui
            const response = await fetch('./api/buscar_estados.php');
            if (!response.ok) {
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

    carregarEstados();

    // --- LÓGICA PARA ENVIAR O FORMULÁRIO DE CADASTRO ---
    const formCadastro = document.getElementById('form-cadastro');

    if (formCadastro) {
        formCadastro.addEventListener('submit', async (event) => {
            event.preventDefault();

            const userData = {
                nome: document.getElementById('nome').value,
                sobrenome: document.getElementById('sobrenome').value,
                nascimento: document.getElementById('nascimento').value,
                cpf: document.getElementById('cpf').value,
                telefone: document.getElementById('telefone').value,
                estado: document.getElementById('estado').value,
                email: document.getElementById('email').value,
                senha: document.getElementById('senha').value
            };

            try {
                const response = await fetch('./api/cadastro.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Cadastro realizado com sucesso!');
                    window.location.href = 'login.html';
                } else {
                    alert(`Erro: ${data.error}`);
                }
            } catch (error) {
                console.error('Erro de comunicação:', error);
                alert('Ocorreu um erro de comunicação com o servidor. Tente novamente.');
            }
        });
    }
});