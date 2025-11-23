// src/js/cadastro.js

// Unificando tudo em um único listener 'DOMContentLoaded'
document.addEventListener('DOMContentLoaded', () => {

  /* // --- LÓGICA PARA CARREGAR OS ESTADOS (Mantido comentado como no seu original) ---
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

  carregarEstados();
  */

  // --- LÓGICA PARA ENVIAR O FORMULÁRIO DE CADASTRO ---
  const formCadastro = document.getElementById('form-cadastro');

  if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
      event.preventDefault();

      const userData = {
        nome: document.getElementById('nome').value,
        sobrenome: document.getElementById('sobrenome').value,
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

  // --- LÓGICA DO POPOVER DE SENHA + BARRA DE FORÇA ---

  // 1) Seletores
  const passwordInput = document.getElementById('senha');
  const popover = document.getElementById('password-popover');
  const strengthBar = document.getElementById('password-strength');
  const strengthLabel = document.querySelector('.password-strength-label');
  const checkboxToggle = document.getElementById('toggleSenha');

  if (!passwordInput || !popover || !strengthBar || !checkboxToggle) {
    console.warn('Elementos do formulário de senha não encontrados.');
    return;
  }

  // 2) Validações (pontuação)
  const validations = [
    { test: pass => pass.length >= 8 }, // comprimento
    { test: pass => /\d/.test(pass) },      // número
    { test: pass => /[a-z]/.test(pass) },   // minúscula
    { test: pass => /[A-Z]/.test(pass) },   // maiúscula
    { test: pass => /[\W_]/.test(pass) }    // símbolo
  ];

  // 3) Abrir/Fechar com animação (sem usar display:none)
  const openPopover = () => {
    if (!popover.classList.contains('is-open')) {
      popover.classList.add('is-open');
      popover.setAttribute('aria-hidden', 'false');
      // mede altura real do conteúdo e aplica
      popover.style.maxHeight = popover.scrollHeight + 'px';
    } else {
      // se já está aberto e o conteúdo mudou, atualiza a altura
      popover.style.maxHeight = popover.scrollHeight + 'px';
    }
  };

  const closePopover = () => {
    // recolhe para 0 com transição
    popover.style.maxHeight = '0px';
    popover.classList.remove('is-open');
    popover.setAttribute('aria-hidden', 'true');
  };

  // 4) Eventos: foco, blur, digitação
  passwordInput.addEventListener('focus', () => {
    openPopover();
  });

  passwordInput.addEventListener('input', () => {
    const pass = passwordInput.value;
    let totalScore = 0;

    // garantir que barra/label estejam visíveis
    strengthBar.style.display = 'block';
    strengthLabel.style.display = 'block';

    validations.forEach(v => { if (v.test(pass)) totalScore += 20; });

    strengthBar.value = pass.length === 0 ? 0 : totalScore;

    if (pass.length === 0) {
      strengthBar.className = '';
    } else if (totalScore < 40) {
      strengthBar.className = 'weak';
    } else if (totalScore < 80) {
      strengthBar.className = 'medium';
    } else {
      strengthBar.className = 'strong';
    }

    // enquanto digita, mantenha a altura certinha caso o conteúdo do popover mude
    if (popover.classList.contains('is-open')) {
      // usa rAF para pegar o layout após atualizar a DOM
      requestAnimationFrame(() => {
        popover.style.maxHeight = popover.scrollHeight + 'px';
      });
    } else {
      openPopover();
    }
  });

  passwordInput.addEventListener('blur', () => {
    // se o campo estiver vazio, fecha o popover ao sair
    if (!passwordInput.value.trim()) {
      closePopover();
    }
  });

  // 5) Checkbox: mostrar/ocultar senha
  checkboxToggle.addEventListener('change', () => {
    passwordInput.setAttribute('type', checkboxToggle.checked ? 'text' : 'password');
    // atualiza altura se o popover estiver aberto
    if (popover.classList.contains('is-open')) {
      requestAnimationFrame(() => {
        popover.style.maxHeight = popover.scrollHeight + 'px';
      });
    }
  });

});
