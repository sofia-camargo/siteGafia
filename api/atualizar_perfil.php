<?php
// api/atualizar_perfil.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Verifica se está logado
if (!isset($_SESSION['id_usuario']) && !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = $_SESSION['id_usuario'] ?? $_SESSION['user_id'];

// Recebe os dados do front-end
$nome      = $data['nome'] ?? null;
$sobrenome = $data['sobrenome'] ?? null;
$email     = $data['email'] ?? null;
$cep       = $data['cep'] ?? null;     // Adicionado
$cidade    = $data['cidade'] ?? null;  // Adicionado

// Validação básica
if (!$nome || !$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Nome e Email são obrigatórios.']);
    exit;
}

try {
    // CORREÇÃO: Atualiza apenas as colunas que existem na imagem enviada
    $sql = "UPDATE usuarios SET 
                nm_usuario = :nome, 
                sobrenome_usuario = :sobrenome, 
                email = :email, 
                cep = :cep,
                cidade = :cidade
            WHERE id_usuario = :id";
            
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([
        ':nome'      => $nome,
        ':sobrenome' => $sobrenome,
        ':email'     => $email,
        ':cep'       => $cep,
        ':cidade'    => $cidade,
        ':id'        => $userId
    ]);

    // Atualiza a sessão com o novo nome para o "Olá, [Nome]"
    $_SESSION['user_name'] = $nome;

    echo json_encode(['message' => 'Perfil atualizado com sucesso!']);

} catch (PDOException $e) {
    if ($e->getCode() == '23505') { 
        http_response_code(409);
        echo json_encode(['error' => 'Este e-mail já está em uso.']);
    } else {
        http_response_code(500);
        error_log("Erro update perfil: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao atualizar o perfil.']);
    }
}
?>