function checkSession() {
    fetch('../api/verificar_sessao.php')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Erro ao verificar sessão:', error);
            // Mesmo em caso de erro de rede, redireciona para login por segurança
            window.location.href = 'login.html'; 
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
                    option.value = estado.sigla;
                    option.textContent = estado.nome;
                    selectEstado.appendChild(option);
                });
                // Recarrega o perfil após carregar os estados para pré-selecionar o valor
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
            if (data.success) {
                window.location.href = 'login.html';
            } else {
                alert('Erro ao fazer logout.');
            }
        })
        .catch(error => {
            console.error('Erro na requisição de logout:', error);
            alert('Erro de conexão ao tentar fazer logout.');
        });
}


function carregarPerfil() {
    fetch('../api/buscar_perfil.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.perfil) {
                const perfil = data.perfil;
                document.getElementById('nome').value = perfil.nome || '';
                document.getElementById('email').value = perfil.email || '';
                document.getElementById('cpf').value = perfil.cpf || '';
                document.getElementById('telefone').value = perfil.telefone || '';
                document.getElementById('cep').value = perfil.cep || '';
                document.getElementById('endereco').value = perfil.endereco || '';
                document.getElementById('numero').value = perfil.numero || '';
                document.getElementById('complemento').value = perfil.complemento || '';
                document.getElementById('bairro').value = perfil.bairro || '';
                document.getElementById('cidade').value = perfil.cidade || '';
                // Preenche o estado no dropdown
                document.getElementById('estado').value = perfil.estado || ''; 
            } else if (!data.session_active) {
                window.location.href = 'login.html'; // Redireciona se a sessão cair
            } else {
                console.error('Erro ao carregar perfil:', data.message);
                // alert('Não foi possível carregar os dados do perfil.');
            }
        })
        .catch(error => {
            console.error('Erro na requisição de buscar perfil:', error);
            // alert('Erro de conexão ao tentar carregar o perfil.');
        });
}


function salvarPerfil() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const cpf = document.getElementById('cpf').value;
    const telefone = document.getElementById('telefone').value;
    const cep = document.getElementById('cep').value;
    const endereco = document.getElementById('endereco').value;
    const numero = document.getElementById('numero').value;
    const complemento = document.getElementById('complemento').value;
    const bairro = document.getElementById('bairro').value;
    const cidade = document.getElementById('cidade').value;
    const estado = document.getElementById('estado').value;

    const data = {
        nome: nome,
        email: email,
        cpf: cpf,
        telefone: telefone,
        cep: cep,
        endereco: endereco,
        numero: numero,
        complemento: complemento,
        bairro: bairro,
        cidade: cidade,
        estado: estado,
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
        if (data.success) {
            alert('Perfil atualizado com sucesso! ✅');
        } else {
            alert('Erro ao atualizar perfil: ' + (data.message || 'Erro desconhecido.'));
        }
    })
    .catch(error => {
        console.error('Erro na requisição de salvar perfil:', error);
        alert('Erro de conexão ao tentar salvar o perfil.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    checkSession(); 
    
    carregarEstados(); 

    document.getElementById('formPerfil').addEventListener('submit', function (event) {
        event.preventDefault();
        salvarPerfil();
    });

    document.getElementById('logoutButton').addEventListener('click', () => {
        logout();
    });
});