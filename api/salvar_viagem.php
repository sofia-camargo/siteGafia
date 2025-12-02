<?php
// api/salvar_viagem.php
session_start();
require_once 'db_connection.php';
header('Content-Type: application/json');

// 1. Verifica login
if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Usuário não logado.']);
    exit;
}

// 2. Recebe dados
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nenhum dado recebido.']);
    exit;
}

try {
    // CORREÇÃO: 
    // 1. Nome da tabela corrigido para 'historico_viagem'
    // 2. Nome da coluna corrigido para 'qnt_abastecimento' (singular)
    // 3. Removido 'id_estado' conforme solicitado
    
    $sql = "INSERT INTO historico_viagem 
            (id_usuario, id_carro, cidade_origem, cidade_destino, km_viagem, tempo_viagem, qnt_abastecimento, dt_consulta) 
            VALUES 
            (:id_usuario, :id_carro, :origem, :destino, :km, :tempo, :recargas, NOW())";

    $stmt = $pdo->prepare($sql);
    
    // Tratamento para garantir que o tempo não venha nulo
    $segundos = isset($input['tempo_viagem_segundos']) ? (int)$input['tempo_viagem_segundos'] : 0;
    $tempoIntervalo = $segundos . " seconds";

    $stmt->execute([
        ':id_usuario' => $_SESSION['id_usuario'],
        ':id_carro'   => $input['id_carro'],
        ':origem'     => $input['origem'],   
        ':destino'    => $input['destino'],  
        ':km'         => $input['distancia_km'],
        ':tempo'      => $tempoIntervalo,
        ':recargas'   => $input['paradas']
    ]);

    echo json_encode(['success' => true, 'message' => 'Viagem salva com sucesso!']);

} catch (PDOException $e) {
    http_response_code(500);
    // Retorna o erro detalhado para ajudar no debug (pode remover em produção)
    echo json_encode([
        'success' => false, 
        'message' => 'Erro SQL ao salvar: ' . $e->getMessage()
    ]);
}
?>