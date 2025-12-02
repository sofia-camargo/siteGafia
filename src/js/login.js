// src/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    if (formLogin) {
        formLogin.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;

            try {
                const response = await fetch('api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (response.ok) {
                    // ALTERAÇÃO AQUI: Verifica se é admin para redirecionar corretamente
                    if (data.is_admin === true || data.is_admin === "true" || data.is_admin === 1) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    alert(`Erro: ${data.error}`);
                }

            } catch (error) {
                console.error('Erro de comunicação:', error);
                alert('Ocorreu um erro de comunicação com o servidor.');
            }
        });
    }
});