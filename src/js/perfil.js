document.addEventListener('DOMContentLoaded', () => {
    // 1. Protege a página e carrega os dados
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (!session.loggedIn) {
                window.location.href = 'login.html'; // Redireciona se não houver sessão
            } else {
                carregarPerfil();
            }
        });

    // 2. Evento de submissão do formulário
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Coleta os dados de TODOS os campos (incluindo email e data de nascimento)
            const dadosAtualizados = {
                nome: document.getElementById('nome').value,
                sobrenome: document.getElementById('sobrenome').value,
                email: document.getElementById('email').value,      // Adicionado
                telefone: document.getElementById('telefone').value,
                dt_nasc: document.getElementById('dt_nasc').value   // Adicionado
            };

            const mensagemEl = document.getElementById('perfil-mensagem');
            mensagemEl.textContent = "Salvando...";
            mensagemEl.style.color = "#ccc";

            try {
                const response = await fetch('api/atualizar_perfil.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizados)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    mensagemEl.textContent = result.message;
                    mensagemEl.style.color = "#4CAF50"; // Verde (Sucesso)
                } else {
                    mensagemEl.textContent = result.error || "Erro ao salvar.";
                    mensagemEl.style.color = "#ff6b6b"; // Vermelho (Erro)
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                mensagemEl.textContent = "Erro de conexão com o servidor.";
                mensagemEl.style.color = "#ff6b6b";
            }
        });
    }
});

async function carregarPerfil() {
    try {
        const response = await fetch('api/buscar_perfil.php');
        const data = await response.json();
        
        if(data.error) {
            console.error(data.error);
            return;
        }

        // Preenche o formulário com os dados do utilizador
        // Usamos verificações (if) para evitar erros caso algum campo não exista no HTML
        if(document.getElementById('nome')) document.getElementById('nome').value = data.nome || '';
        if(document.getElementById('sobrenome')) document.getElementById('sobrenome').value = data.sobrenome || '';
        if(document.getElementById('email')) document.getElementById('email').value = data.email || '';
        if(document.getElementById('telefone')) document.getElementById('telefone').value = data.telefone || '';
        
        // Preenche a data de nascimento
        if(document.getElementById('dt_nasc')) document.getElementById('dt_nasc').value = data.dt_nasc || '';

        // Nota: Removi o CPF daqui pois retiramos ele do HTML para edição, 
        // já que geralmente não se permite alterar CPF após cadastro.

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
}