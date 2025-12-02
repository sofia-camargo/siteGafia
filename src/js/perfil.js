// src/js/perfil.js

function checkSession() {
    fetch('../api/verificar_sessao.php')
        .then(response => {
            // Verifica se a resposta HTTP foi bem sucedida (status 200-299)
            if (!response.ok) {
                throw new Error('Erro no servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // CORREÇÃO: O PHP retorna 'loggedIn' (camelCase), não 'logged_in'
            if (!data.loggedIn) {
                console.warn('Usuário não autenticado. Redirecionando...');
                window.location.href = 'login.html';
            } else {
                console.log('Sessão ativa para o usuário ID: ' + data.userId);
            }
        })
        .catch(error => {
            console.error('Erro ao verificar sessão:', error);
            // IMPORTANTE: Comentamos o redirecionamento forçado no erro 
            // para evitar que você fique preso num loop se o servidor falhar.
            
            // window.location.href = 'login.html'; 
            
            alert('Houve um erro ao verificar sua sessão. Verifique o console (F12) para detalhes.');
        });
}


function carregarEstados() {
    fetch('../api/buscar_estados.php')
        .then(response => response.json())
        .then(estados => {
            const selectEstado = document.getElementById('estado');
            if (selectEstado) {
                selectEstado.innerHTML = '<option value="">Selecione o Estado</option>';
                estados.forEach(estado => {
                    const option = document.createElement('option');
                    option.value = estado.sigla; // Certifique-se que o PHP retorna 'sigla' ou ajuste para 'id_estado'
                    option.textContent = estado.nm_estado; // Certifique-se que o PHP retorna 'nm_estado'
                    selectEstado.appendChild(option);
                });
                // Recarrega o perfil após carregar os estados para pré-selecionar o valor se necessário
                carregarPerfil();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar estados:', error);
        });
}

function logout() {
    fetch('../api/logout.php')
        .then(response => response.json())
        .then(data => {
            // Verifica sucesso (considerando que seu logout.php retorne JSON, senão apenas o status 200 basta)
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error('Erro na requisição de logout:', error);
            // Força a saída mesmo com erro de rede
            window.location.href = 'login.html';
        });
}


function carregarPerfil() {
    fetch('../api/buscar_perfil.php')
        .then(response => {
             if(!response.ok) throw new Error("Erro ao buscar perfil: " + response.status);
             return response.json();
        })
        .then(data => {
            // Ajuste conforme o retorno real do seu buscar_perfil.php
            // Se o PHP retornar direto o objeto do perfil:
            const perfil = data; 
            
            if (perfil && !perfil.error) {
                if(document.getElementById('nome')) document.getElementById('nome').value = perfil.nome || '';
                if(document.getElementById('email')) document.getElementById('email').value = perfil.email || '';
                if(document.getElementById('cpf')) document.getElementById('cpf').value = perfil.cpf || ''; // Se houver
                if(document.getElementById('telefone')) document.getElementById('telefone').value = perfil.telefone || '';
                if(document.getElementById('cep')) document.getElementById('cep').value = perfil.cep || '';
                if(document.getElementById('endereco')) document.getElementById('endereco').value = perfil.endereco || '';
                if(document.getElementById('numero')) document.getElementById('numero').value = perfil.numero || '';
                if(document.getElementById('complemento')) document.getElementById('complemento').value = perfil.complemento || '';
                if(document.getElementById('bairro')) document.getElementById('bairro').value = perfil.bairro || '';
                if(document.getElementById('cidade')) document.getElementById('cidade').value = perfil.cidade || '';
                
                // Preenche o estado no dropdown se existir e estiver carregado
                if(document.getElementById('estado')) document.getElementById('estado').value = perfil.estado || ''; 
            } else {
                console.warn('Perfil não encontrado ou erro:', data.error);
            }
        })
        .catch(error => {
            console.error('Erro na requisição de buscar perfil:', error);
        });
}


function salvarPerfil() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    // Adicione os outros campos conforme necessário para enviar ao PHP
    const telefone = document.getElementById('telefone') ? document.getElementById('telefone').value : '';
    const dt_nasc = document.getElementById('dt_nasc') ? document.getElementById('dt_nasc').value : '';
    // Adicione outros campos se o seu atualizar_perfil.php esperar por eles

    const data = {
        nome: nome,
        email: email,
        telefone: telefone,
        dt_nasc: dt_nasc
        // ... outros campos
    };

    fetch('../api/atualizar_perfil.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) { // Seu PHP retorna 'message' em caso de sucesso
            alert('Perfil atualizado com sucesso! ✅');
        } else if (data.error) {
            alert('Erro ao atualizar perfil: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro na requisição de salvar perfil:', error);
        alert('Erro de conexão ao tentar salvar o perfil.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    checkSession(); 
    
    // Se a página tiver o dropdown de estados, carrega.
    if(document.getElementById('estado')) {
        carregarEstados(); 
    } else {
        // Se não tiver estados para carregar, carrega o perfil direto
        carregarPerfil();
    }

    const formPerfil = document.getElementById('form-perfil'); // ID corrigido conforme seu HTML (form-perfil)
    if (formPerfil) {
        formPerfil.addEventListener('submit', function (event) {
            event.preventDefault();
            salvarPerfil();
        });
    }

    // Botão de excluir conta (se existir)
    const btnDelete = document.querySelector('.delete-btn');
    if(btnDelete) {
        btnDelete.addEventListener('click', () => {
            if(confirm('Tem certeza que deseja excluir sua conta?')) {
                // Implementar lógica de exclusão aqui se necessário
                alert('Funcionalidade em desenvolvimento.');
            }
        });
    }

    // Botão de Logout no menu lateral (se houver ID específico ou classe)
    // No seu HTML não vi um ID específico para logout no menu lateral, 
    // mas se tiver um botão com id="logoutButton", use:
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});