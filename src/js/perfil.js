// src/js/perfil.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica a sessão e carrega o perfil se estiver logado
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (!session.loggedIn) {
                // Se não estiver logado, manda para o login
                window.location.href = 'login.html'; 
            } else {
                // Se estiver logado, carrega os dados nos inputs
                carregarPerfil();
            }
        })
        .catch(err => console.error("Erro ao verificar sessão:", err));

    // Lógica de salvar (Update) continua aqui...
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', atualizarPerfil);
    }
});

// Função para buscar dados e preencher o formulário
async function carregarPerfil() {
    try {
        const response = await fetch('api/buscar_perfil.php');
        const data = await response.json();
        
        if (data.error) {
            console.error("Erro da API:", data.error);
            return;
        }

        // PREENCHIMENTO DOS CAMPOS
        // O ID do elemento HTML deve bater com o ID usado no getElementById
        setVal('nome', data.nome);
        setVal('sobrenome', data.sobrenome);
        setVal('email', data.email);
        setVal('telefone', data.telefone);
        setVal('dt_nasc', data.dt_nasc);

        // Nota: Seu banco de dados atual (CreateSQL.txt) não tem colunas para
        // CEP, Cidade ou País na tabela de usuários, apenas 'id_estado'.
        // Por isso, não estamos preenchendo esses campos visuais ainda.

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
}

// Função auxiliar para evitar erros se o campo não existir no HTML
function setVal(id, valor) {
    const el = document.getElementById(id);
    if (el) {
        el.value = valor || ''; // Se o valor for null, deixa vazio
    }
}

// Função para salvar as alterações (Update)
async function atualizarPerfil(e) {
    e.preventDefault();
    
    const dadosAtualizados = {
        nome: document.getElementById('nome').value,
        sobrenome: document.getElementById('sobrenome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        dt_nasc: document.getElementById('dt_nasc').value
    };

    const mensagemEl = document.getElementById('perfil-mensagem');
    if(mensagemEl) {
        mensagemEl.textContent = "Salvando...";
        mensagemEl.style.color = "#ccc";
    }

    try {
        const response = await fetch('api/atualizar_perfil.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });
        
        const result = await response.json();
        
        if(mensagemEl) {
            if (response.ok) {
                mensagemEl.textContent = result.message;
                mensagemEl.style.color = "#4CAF50"; // Verde
            } else {
                mensagemEl.textContent = result.error || "Erro ao salvar.";
                mensagemEl.style.color = "#ff6b6b"; // Vermelho
            }
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        if(mensagemEl) mensagemEl.textContent = "Erro de conexão.";
    }
}