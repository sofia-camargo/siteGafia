<?php
// api/historico_completo.php
require_once 'db_connection.php'; // Garanta que este arquivo conecta corretamente ao banco
session_start(); 

// Define que a resposta será sempre JSON
header('Content-Type: application/json');

// VERIFICAÇÃO DE SEGURANÇA
// Se não tiver a sessão 'id_usuario', bloqueia o acesso
if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado. Usuário não logado.']);
    exit;
}

$idUsuario = $_SESSION['id_usuario'];

try {
    // Consulta a View de histórico detalhado
    $sql = "SELECT 
                dt_consulta,
                cidade_origem,
                cidade_destino,
                km_viagem,
                tempo_viagem,
                qnt_abastecimento,
                nm_marca,
                nm_modelo,
                ano_carro
            FROM vw_historico_usuario 
            WHERE id_usuario = :id_usuario
            ORDER BY dt_consulta DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_usuario' => $idUsuario]);
    
    // Pega todos os resultados
    $historico = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Retorna para o JavaScript
    echo json_encode($historico);

} catch (PDOException $e) {
    http_response_code(500);
    // Log do erro no servidor (não mostra detalhes técnicos pro usuário)
    error_log("Erro SQL em historico_completo: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar o histórico.']);
}
?>