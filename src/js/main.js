// src/js/main.js

document.addEventListener('DOMContentLoaded', async () => {
    
    // Seletores para os menus 
    const navGuest = document.getElementById('nav-guest');
    const navUser = document.getElementById('nav-user');
    const userGreeting = document.getElementById('user-greeting');

    try {
        // 1. Faz uma chamada à API para verificar a sessão
        const response = await fetch('api/verificar_sessao.php');
        const session = await response.json();

        // 2. Verifica a resposta da sessão
        if (session.loggedIn) {
            // Se o utilizador tem sessão iniciada...
            if (navGuest) navGuest.style.display = 'none';  // Esconde o menu de visitante
            if (navUser) navUser.style.display = 'flex';   // Mostra o menu de utilizador
            
            // Personaliza a saudação
            if (userGreeting) userGreeting.textContent = `Olá, ${session.userName}!`;

            // --- ALTERAÇÃO: Lógica para mostrar botão Admin ---
            if (session.isAdmin) {
                // Verifica se o menu navUser existe E se o botão ainda não foi criado
                if (navUser && !document.getElementById('btn-admin-link')) {
                    const adminLink = document.createElement('a');
                    adminLink.id = 'btn-admin-link';
                    adminLink.href = 'admin.html';
                    adminLink.innerHTML = '<i class="fa-solid fa-lock"></i> Painel Admin';
                    adminLink.style.color = '#ffd700'; // Dourado para destacar
                    
                    // Insere o botão no menu do usuário (antes do botão Sair, se quiser)
                    navUser.insertBefore(adminLink, navUser.lastElementChild);
                }
            }
            // ------------------------------------------------

        } else {
            // Se o utilizador NÃO tem sessão iniciada...
            if (navGuest) navGuest.style.display = 'flex';  // Mostra o menu de visitante
            if (navUser) navUser.style.display = 'none';   // Esconde o menu de utilizador
        }
    } catch (error) {
        console.error('Erro ao verificar a sessão:', error);
        // Em caso de erro, mostra o menu de visitante por segurança
        if (navGuest) navGuest.style.display = 'flex';
        if (navUser) navUser.style.display = 'none';
    }

    // --- LÓGICA DO BOTÃO DE VOLTAR DINÂMICO ---
    const btnVoltar = document.getElementById('btn-voltar-dinamico');

    if (btnVoltar) {
        // Remove listeners antigos
        const novoBtn = btnVoltar.cloneNode(true);
        btnVoltar.parentNode.replaceChild(novoBtn, btnVoltar);

        // Adiciona o novo evento de clique
        novoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Verifica a sessão novamente no momento do clique
            fetch('api/verificar_sessao.php')
                .then(res => res.json())
                .then(session => {
                    if (session.loggedIn) {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                })
                .catch(() => {
                    window.location.href = 'index.html';
                });
        });
    }
});