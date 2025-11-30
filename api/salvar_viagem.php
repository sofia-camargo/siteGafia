<?php
// api/salvar_viagem.php
session_start();
header('Content-Type: application/json');

// 1. Verifica se o usuário está logado
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado.']);
    exit;
}

require_once 'conexao.php'; // Seu arquivo de conexão com o banco

// 2. Recebe os dados do JSON enviado pelo JavaScript
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Nenhum dado recebido.']);
    exit;
}

try {
    // 3. Prepara o INSERT (Baseado nos campos da sua View vw_historico_usuario)
    // Ajuste "id_estado" conforme sua lógica (aqui coloquei fixo ou null, pois o JS manda string)
    $sql = "INSERT INTO historico_viagem 
            (id_usuario, id_carro, cidade_origem, cidade_destino, km_viagem, tempo_viagem, qnt_abastecimento, dt_consulta, id_estado) 
            VALUES 
            (:id_usuario, :id_carro, :origem, :destino, :km, :tempo, :recargas, NOW(), 1)"; 
            // OBS: "id_estado" = 1 é um exemplo placeholder. O ideal é descobrir o estado via Google Maps API.

    $stmt = $pdo->prepare($sql);

    // Formata o tempo (Google manda segundos, o banco parece ser Interval ou Time)
    // Se o banco for VARCHAR ou INTEIRO, ajuste aqui. Assumindo INTERVAL do Postgres:
    $tempoFormatado = $input['tempo_viagem_segundos'] . " seconds";

    $stmt->execute([
        ':id_usuario' => $_SESSION['id_usuario'],
        ':id_carro'   => $input['id_carro'],
        ':origem'     => $input['origem'],
        ':destino'    => $input['destino'],
        ':km'         => $input['distancia_km'],
        ':tempo'      => $tempoFormatado, 
        ':recargas'   => $input['paradas']
    ]);

    echo json_encode(['success' => true, 'message' => 'Viagem salva no histórico!']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar: ' . $e->getMessage()]);
}
?>