document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica sessão
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (!session.loggedIn) {
                window.location.href = 'login.html';
            } else {
                carregarPerfil(); // Chama a função que busca os dados
            }
        })
        .catch(err => console.error("Erro sessão:", err));

    // 2. Configura o formulário para salvar
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', salvarPerfil);
    }
});

async function carregarPerfil() {
    try {
        const response = await fetch('api/buscar_perfil.php');
        const data = await response.json();
        
        if (data.error) {
            console.error("Erro API:", data.error);
            return;
        }

        // Preenche os inputs com os dados recebidos
        if (data.nome) document.getElementById('nome').value = data.nome;
        if (data.sobrenome) document.getElementById('sobrenome').value = data.sobrenome;
        if (data.email) document.getElementById('email').value = data.email;
        if (data.telefone) document.getElementById('telefone').value = data.telefone;
        if (data.dt_nasc) document.getElementById('dt_nasc').value = data.dt_nasc;

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
}

async function salvarPerfil(e) {
    e.preventDefault();
    
    const dados = {
        nome: document.getElementById('nome').value,
        sobrenome: document.getElementById('sobrenome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        dt_nasc: document.getElementById('dt_nasc').value
    };

    const msgDiv = document.getElementById('perfil-mensagem');
    msgDiv.textContent = "Salvando...";

    try {
        const response = await fetch('api/atualizar_perfil.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            msgDiv.textContent = "Perfil atualizado com sucesso!";
            msgDiv.style.color = "#4CAF50";
        } else {
            msgDiv.textContent = result.error || "Erro ao salvar.";
            msgDiv.style.color = "#ff6b6b";
        }
    } catch (error) {
        console.error(error);
        msgDiv.textContent = "Erro de conexão.";
    }
}