document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica se está logado antes de carregar
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (!session.loggedIn) {
                window.location.href = 'login.html'; 
            } else {
                carregarPerfil(); // Carrega os dados se estiver logado
            }
        });

    // 2. Configura o botão de salvar
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
            console.error(data.error);
            return;
        }

        // Preenche os campos do HTML com os dados do banco
        if (data.nome) document.getElementById('nome').value = data.nome;
        if (data.sobrenome) document.getElementById('sobrenome').value = data.sobrenome;
        if (data.email) document.getElementById('email').value = data.email;
        if (data.telefone) document.getElementById('telefone').value = data.telefone;
        if (data.dt_nasc) document.getElementById('dt_nasc').value = data.dt_nasc;

        // OBS: Os campos de endereço (CEP, Cidade) ficarão vazios 
        // porque eles não existem no seu banco de dados atual.

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
}

async function salvarPerfil(e) {
    e.preventDefault();
    
    // Pega os dados atuais dos campos
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
            msgDiv.textContent = "Dados atualizados com sucesso!";
            msgDiv.style.color = "lightgreen";
        } else {
            msgDiv.textContent = result.error || "Erro ao atualizar.";
            msgDiv.style.color = "salmon";
        }
    } catch (error) {
        console.error(error);
        msgDiv.textContent = "Erro de conexão.";
    }
}