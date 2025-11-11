document.addEventListener('DOMContentLoaded', async () => {
    
    // Seletores para os menus da index.html
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

// === CARROSSEL DE DESTAQUES (loop infinito) ===
const track = document.querySelector(".carousel-track");
const btnPrev = document.querySelector(".carousel-btn.prev");
const btnNext = document.querySelector(".carousel-btn.next");

if (track && btnPrev && btnNext) {
  const cards = Array.from(track.children);
  const gap = 16; // mesmo gap do CSS

  // Clona o primeiro e último card para simular loop
  const firstClone = cards[0].cloneNode(true);
  const lastClone = cards[cards.length - 1].cloneNode(true);

  track.appendChild(firstClone);
  track.insertBefore(lastClone, cards[0]);

  // Ajusta posição inicial para o "primeiro card real"
  const cardWidth = cards[0].offsetWidth + gap;
  track.scrollLeft = cardWidth;

  let isTransitioning = false;

  const moveCarousel = (direction) => {
    if (isTransitioning) return;
    isTransitioning = true;

    const scrollAmount = direction === "next" ? cardWidth : -cardWidth;
    track.scrollBy({ left: scrollAmount, behavior: "smooth" });

    // Espera a animação do scroll terminar
    setTimeout(() => {
      // se chegou no clone do final → volta para o real
      if (direction === "next" && track.scrollLeft >= (cardWidth * (cards.length))) {
        track.scrollLeft = cardWidth; // volta pro primeiro real
      }
      // se chegou no clone do início → volta para o real do fim
      else if (direction === "prev" && track.scrollLeft <= 0) {
        track.scrollLeft = cardWidth * (cards.length - 1);
      }
      isTransitioning = false;
    }, 400);
  };

  btnNext.addEventListener("click", () => moveCarousel("next"));
  btnPrev.addEventListener("click", () => moveCarousel("prev"));
  setInterval(() => moveCarousel("next"), 500);
}
// autoplay a cada 5 segundos

});