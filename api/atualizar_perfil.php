<?php
// api/atualizar_perfil.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Verifica login
if (!isset($_SESSION['id_usuario']) && !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = $_SESSION['id_usuario'] ?? $_SESSION['user_id'];

// Captura os dados enviados pelo JS
$nome      = $data['nome'] ?? null;
$sobrenome = $data['sobrenome'] ?? null;
$email     = $data['email'] ?? null;
$telefone  = $data['telefone'] ?? null;
$dt_nasc   = $data['dt_nasc'] ?? null;
$cep       = $data['cep'] ?? null;
$cidade    = $data['cidade'] ?? null;

// Validação básica
if (!$nome || !$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Nome e Email são obrigatórios.']);
    exit;
}

try {
    // CORREÇÃO:
    // Atualiza a tabela 'usuarios' usando os nomes de coluna corretos
    // Inclui telefone e dt_nasc que faltavam
    $sql = "UPDATE usuarios SET 
                nome = :nome, 
                sobrenome = :sobrenome, 
                email = :email, 
                telefone = :telefone,
                dt_nasc = :dt_nasc,
                cep = :cep,
                cidade = :cidade
            WHERE id_usuario = :id";
            
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([
        ':nome'      => $nome,
        ':sobrenome' => $sobrenome,
        ':email'     => $email,
        ':telefone'  => $telefone,
        ':dt_nasc'   => $dt_nasc,
        ':cep'       => $cep,
        ':cidade'    => $cidade,
        ':id'        => $userId
    ]);

    // Atualiza o nome na sessão para refletir a mudança imediatamente
    $_SESSION['user_name'] = $nome;
    
    echo json_encode(['message' => 'Perfil atualizado com sucesso!']);

} catch (PDOException $e) {
    // Código de erro para violação de chave única (ex: email duplicado)
    if ($e->getCode() == '23505') { 
        http_response_code(409);
        echo json_encode(['error' => 'Este e-mail já está em uso.']);
    } else {
        http_response_code(500);
        // Log do erro real para ajudar no debug se necessário
        error_log("Erro ao atualizar perfil: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao atualizar o perfil.']);
    }
}
?>