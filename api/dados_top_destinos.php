<?php
// api/dados_top_destinos.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) { echo json_encode([]); exit; }

try {
    // Pega as top 5 cidades
    $sql = "SELECT cidade_destino, total_visitas FROM vw_top_destinos WHERE id_usuario = :id LIMIT 5";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $_SESSION['id_usuario']]);
    $lista = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($lista);
} catch (Exception $e) { echo json_encode(['error' => $e->getMessage()]); }
?>