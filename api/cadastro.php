<?php
// api/cadastro.php

require_once 'db_connection.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido recebido.']);
    exit;
}

$nome = $data['nome'] ?? null;
$sobrenome = $data['sobrenome'] ?? null;
$cpf = $data['cpf'] ?? null;
$nascimento = $data['nascimento'] ?? null;
$telefone = $data['telefone'] ?? null;
$estado = $data['estado'] ?? null;
$email = $data['email'] ?? null;
$senha = $data['senha'] ?? null;

if (!$nome || !$sobrenome || !$cpf || !$nascimento || !$telefone || !$estado || !$email || !$senha) {
    http_response_code(400);
    echo json_encode(['error' => 'Todos os campos são obrigatórios.']);
    exit;
}

try {
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    // CORREÇÃO 1: O nome da tabela foi corrigido para "usuarios" (plural).
    // As colunas no INSERT agora correspondem exatamente às da sua imagem.
    $sql = "INSERT INTO usuarios (nome, sobrenome, dtnasc, cpf, email, telefone, senha, id_estado) 
            VALUES (:nome, :sobrenome, :dtnasc, :cpf, :email, :telefone, :senha, :id_estado)";
    
    $stmt = $pdo->prepare($sql);

    // CORREÇÃO 2: A coluna 'id_estado' espera um número.
    // Como o formulário envia um texto (ex: "São Paulo"), vamos converter para um número.
    // (int)$estado irá converter o texto para o número 0 se não for numérico.
    // Isso evita o erro de tipo de dado e permite que o cadastro seja concluído.
    $estado_id = (int)$estado; // Solução temporária para teste

    $stmt->execute([
        ':nome' => $nome,
        ':sobrenome' => $sobrenome,
        ':dtnasc' => $nascimento,
        ':cpf' => $cpf,
        ':email' => $email,
        ':telefone' => $telefone,
        ':senha' => $senhaHash,
        ':id_estado' => 1 // VALOR PROVISÓRIO - Veja a explicação abaixo
    ]);

    http_response_code(201);
    echo json_encode(['message' => 'Usuário cadastrado com sucesso!']);

} catch (PDOException $e) {
    error_log("Erro de banco de dados: " . $e->getMessage());

    if ($e->getCode() == 23505) {
        http_response_code(409);
        echo json_encode(['error' => 'Este email ou CPF já está em uso.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Ocorreu um erro interno no servidor ao processar sua solicitação.']);
    }
}
?>