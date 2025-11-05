// src/js/cadastro.js

// CORREÇÃO: Unificando tudo em um único listener 'DOMContentLoaded'
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA CARREGAR OS ESTADOS ---
    const selectEstado = document.getElementById('estado');

    async function carregarEstados() {
        if (!selectEstado) return;

        try {
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

    carregarEstados(); // Chama a função

    // --- LÓGICA PARA ENVIAR O FORMULÁRIO DE CADASTRO ---
    const formCadastro = document.getElementById('form-cadastro');

    if (formCadastro) {
        formCadastro.addEventListener('submit', async (event) => {
            event.preventDefault();

            // CORREÇÃO: Removidos campos que não existem no HTML (nascimento, cpf, telefone)
            const userData = {
                nome: document.getElementById('nome').value,
                sobrenome: document.getElementById('sobrenome').value,
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

    // --- LÓGICA DO POP-OVER DE SENHA (USANDO HTML EXISTENTE) ---
    // CORREÇÃO: Este bloco foi reescrito para usar os IDs do seu HTML, 
    // em vez de tentar criar novos elementos.

    // 1. Seleciona os elementos que JÁ EXISTEM no HTML
    const passwordInput = document.getElementById('senha');
    const popover = document.getElementById('password-popover');
    const strengthBar = document.getElementById('password-strength');
    const strengthLabel = document.querySelector('.password-strength-label'); // Label da barra
    
    // 2. Seleciona o checkbox de "Mostrar Senha"
    const checkboxToggle = document.getElementById('toggleSenha');

    // Se os elementos não existirem, não faz nada
    if (!passwordInput || !popover || !strengthBar || !checkboxToggle) {
        console.warn('Elementos do formulário de senha não encontrados.');
        return; // Para a execução se algo faltar
    }

    // 3. Regras de validação (para calcular a pontuação)
    const validations = [
        { test: pass => pass.length >= 12 }, // 1. Comprimento
        { test: pass => /\d/.test(pass) },      // 2. Número
        { test: pass => /[a-z]/.test(pass) },   // 3. Minúscula
        { test: pass => /[A-Z]/.test(pass) },   // 4. Maiúscula
        { test: pass => /[\W_]/.test(pass) }   // 5. Símbolo
    ];

    // 4. LÓGICA DOS EVENTOS DE SENHA

    // Mostrar o "balão" ao focar no campo
    passwordInput.addEventListener('focus', () => {
        popover.classList.remove('hidden');
    });

    // Esconder o "balão" ao clicar fora
    passwordInput.addEventListener('blur', () => {
        popover.classList.add('hidden');
    });

    // Mostrar a barra (que está dentro do balão) e calcular a força AO DIGITAR
    passwordInput.addEventListener('input', () => {
        const pass = passwordInput.value;
        let totalScore = 0;

        // Mostra a barra e o label (eles já estão no HTML,
        // mas o JS de 'focus' já mostra o popover inteiro)
        strengthBar.style.display = 'block';
        strengthLabel.style.display = 'block';

        // Calcula a pontuação
        validations.forEach(v => {
            if (v.test(pass)) {
                totalScore += 20; // 20 pontos por regra (total 100)
            }
        });

        // Atualiza o valor e a cor da barra
        strengthBar.value = totalScore;
        
        if (pass.length === 0) {
             strengthBar.value = 0;
             strengthBar.className = ''; // Reseta classes de cor
        } else if (totalScore < 40) {
            strengthBar.className = 'weak';
        } else if (totalScore < 80) {
            strengthBar.className = 'medium';
        } else {
            strengthBar.className = 'strong';
        }
    });

    // 5. LÓGICA DO CHECKBOX "MOSTRAR SENHA"
    // ADICIONADO: Isso estava faltando no seu JS
    checkboxToggle.addEventListener('change', () => {
        // Muda o tipo do input de senha
        passwordInput.setAttribute('type', checkboxToggle.checked ? 'text' : 'password');
    });

}); // Fim do 'DOMContentLoaded'