<?php
// api/salvar_viagem.php
session_start();
require_once 'db_connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado.']);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Sem dados.']);
    exit;
}

try {
    // CORREÇÃO: Tabela 'historico_viagem', Coluna 'qnt_abastecimento' (singular conforme CreateSQL)
    $sql = "INSERT INTO historico_viagem 
            (id_usuario, id_carro, cidade_origem, cidade_destino, km_viagem, tempo_viagem, qnt_abastecimento, dt_consulta) 
            VALUES 
            (:id_usuario, :id_carro, :origem, :destino, :km, :tempo, :recargas, NOW())";

    $stmt = $pdo->prepare($sql);
    
    $tempoIntervalo = ($input['tempo_viagem_segundos'] ?? 0) . " seconds";

    $stmt->execute([
        ':id_usuario' => $_SESSION['id_usuario'],
        ':id_carro'   => $input['id_carro'],
        ':origem'     => $input['origem'],   
        ':destino'    => $input['destino'],  
        ':km'         => $input['distancia_km'],
        ':tempo'      => $tempoIntervalo,
        ':recargas'   => $input['paradas']
    ]);

    echo json_encode(['success' => true, 'message' => 'Salvo!']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro SQL: ' . $e->getMessage()]);
}
?>