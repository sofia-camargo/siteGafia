// VALORES DO SEU HISTÓRICO
let totalViagens = 27;
let recargasFeitas = 12;
let kmRodados = 350; 
let tempoTotalMin = 480; // 8 horas

// LIMITES (você pode ajustar)
let maxViagens = 50;
let maxRecargas = 20;
let maxKm = 500;
let maxTempoMin = 600; // 10 horas

// Converte cada dado em porcentagem
function calcPorcentagem(valor, max) {
    return Math.min(Math.round((valor / max) * 100), 100);
}

// DONUTS
function atualizarDonut(id, porcentagem) {
    const donut = document.getElementById(id);
    const texto = donut.querySelector("span");

    // Atualiza o texto
    texto.textContent = porcentagem + "%";

    // Converte porcentagem em ângulo (0–360)
    const angulo = (porcentagem / 100) * 360;

    // Atualiza o CSS
    donut.style.setProperty("--progress", angulo + "deg");
}

// Atualiza cada donut
atualizarDonut("donut-viagens", calcPorcentagem(totalViagens, maxViagens));
atualizarDonut("donut-recargas", calcPorcentagem(recargasFeitas, maxRecargas));
atualizarDonut("donut-km", calcPorcentagem(kmRodados, maxKm));
atualizarDonut("donut-tempo", calcPorcentagem(tempoTotalMin, maxTempoMin));
