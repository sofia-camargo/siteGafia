// src/js/perfil.js

function checkSession() {
    fetch('../api/verificar_sessao.php')
        .then(response => {
            if (!response.ok) throw new Error('Erro servidor: ' + response.status);
            return response.json();
        })
        .then(data => {
            // Se não estiver logado, redireciona
            if (!data.loggedIn) {
                console.warn('Sessão expirada ou inválida.');
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Erro de sessão:', error);
            // Evita redirecionar em caso de erro de rede para não criar loop, 
            // mas avisa o usuário
        });
}

function carregarPerfil() {
    fetch('../api/buscar_perfil.php')
        .then(response => {
             if(!response.ok) throw new Error("Erro API Perfil: " + response.status);
             return response.json();
        })
        .then(perfil => {
            // O PHP retorna o objeto direto, então usamos 'perfil' diretamente.
            
            if (perfil && !perfil.error) {
                // Preenche os campos se o elemento existir no HTML e o dado existir no JSON
                
                // Nome e Sobrenome
                if(document.getElementById('nome')) document.getElementById('nome').value = perfil.nome || '';
                if(document.getElementById('sobrenome')) document.getElementById('sobrenome').value = perfil.sobrenome || '';
                
                // Contato
                if(document.getElementById('email')) document.getElementById('email').value = perfil.email || '';
                if(document.getElementById('telefone')) document.getElementById('telefone').value = perfil.telefone || '';
                
                // Data de Nascimento
                if(document.getElementById('dt_nasc')) document.getElementById('dt_nasc').value = perfil.dt_nasc || '';

                // OBS: O seu PHP atual (buscar_perfil.php) NÃO retorna CEP, Cidade ou País.
                // Eles ficarão em branco até que você altere o PHP para buscar essas colunas no banco.
                if(document.getElementById('cep')) document.getElementById('cep').value = perfil.cep || '';
                if(document.getElementById('cidade')) document.getElementById('cidade').value = perfil.cidade || '';
                
            } else {
                console.warn('Perfil não encontrado:', perfil.error);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar perfil:', error);
        });
}

function salvarPerfil() {
    // Pega os valores atuais dos inputs
    const dados = {
        nome: document.getElementById('nome')?.value,
        sobrenome: document.getElementById('sobrenome')?.value,
        email: document.getElementById('email')?.value,
        telefone: document.getElementById('telefone')?.value,
        dt_nasc: document.getElementById('dt_nasc')?.value
        // Adicione cep/cidade aqui se você implementar no PHP depois
    };

    fetch('../api/atualizar_perfil.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Perfil atualizado com sucesso! ✅');
        } else if (data.error) {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro ao salvar:', error);
        alert('Erro de conexão ao salvar.');
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkSession(); 
    carregarPerfil();

    const form = document.getElementById('form-perfil');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            salvarPerfil();
        });
    }

    // Botão de Logout (se houver no menu)
    const btnLogout = document.querySelector('a[href*="logout.php"]'); 
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            // Deixa o link funcionar normalmente (ir para o PHP), 
            // ou você pode interceptar e fazer fetch se preferir.
        });
    }
});