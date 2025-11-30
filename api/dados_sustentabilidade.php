<?php
// api/dados_sustentabilidade.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) { echo json_encode([]); exit; }

try {
    // Consulta a View que criamos
    $sql = "SELECT * FROM vw_sustentabilidade WHERE id_usuario = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $_SESSION['id_usuario']]);
    $dados = $stmt->fetch(PDO::FETCH_ASSOC);

    // Se não tiver dados, retorna zerado
    if (!$dados) {
        echo json_encode(['kg_co2_poupados' => 0, 'arvores_equivalentes' => 0]);
    } else {
        echo json_encode($dados);
    }
} catch (Exception $e) { echo json_encode(['error' => $e->getMessage()]); }
?>