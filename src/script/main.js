// Script para o Ano no Rodapé
document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// Script para o Modo Escuro
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('mode-toggle');
    const body = document.body;
    const sunIcon = toggleButton.querySelector('.sun-icon');
    const moonIcon = toggleButton.querySelector('.moon-icon');

    // Carrega o modo salvo no localStorage ou a preferência do sistema
    const currentMode = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (currentMode === 'dark') {
        body.classList.add('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        body.classList.remove('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }

    toggleButton.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark');
        if (isDarkMode) {
            body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    });
});