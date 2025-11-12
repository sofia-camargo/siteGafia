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

