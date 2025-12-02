<?php
// api/atualizar_perfil.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Verifica se está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado']);
    exit;
}

// Recebe o JSON do JavaScript
$data = json_decode(file_get_contents('php://input'), true);
$userId = $_SESSION['user_id'];

// Pega os dados enviados (os nomes aqui devem bater com os IDs do HTML)
$nome      = $data['nome'] ?? null;
$sobrenome = $data['sobrenome'] ?? null;
$email     = $data['email'] ?? null;
$telefone  = $data['telefone'] ?? null;
$dt_nasc   = $data['dt_nasc'] ?? null;

// Validação básica
if (!$nome || !$sobrenome || !$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Nome, Sobrenome e Email são obrigatórios.']);
    exit;
}

try {
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
        ':id'        => $userId,
        ':cep'       => $cep,
        ':cidade'    => $cidade
    ]);

    // Atualiza a sessão se necessário
    $_SESSION['user_name'] = $nome;

    echo json_encode(['message' => 'Perfil atualizado com sucesso!']);

} catch (PDOException $e) {
    // Erro comum: Email duplicado
    if ($e->getCode() == '23505') { 
        http_response_code(409);
        echo json_encode(['error' => 'Este e-mail já está em uso por outra conta.']);
    } else {
        http_response_code(500);
        error_log("Erro update perfil: " . $e->getMessage()); // Grava no log do servidor
        echo json_encode(['error' => 'Erro ao atualizar o perfil.']);
    }
}
?>