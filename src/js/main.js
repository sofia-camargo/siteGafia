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

    // A lógica de carrossel JS foi removida
    // pois sua index.html usa um carrossel 100% CSS
    // com a classe '.infinite-carousel'.
});