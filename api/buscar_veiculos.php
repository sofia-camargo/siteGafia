<?php
// api/buscar_veiculos.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// 1. CORREÇÃO: Padronização da sessão para 'id_usuario'
if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado. Usuário não logado.']);
    exit;
}

$userId = $_SESSION['id_usuario'];

try {
    
    $sql = "SELECT 
                c.id_carro, 
                c.ano_carro, 
                c.dur_bat,           -- Necessário para calcular autonomia
                m.nm_marca, 
                mo.nm_modelo
            FROM carro c
            JOIN marca m ON c.id_marca = m.id_marca
            JOIN modelo mo ON c.id_modelo = mo.id_modelo
            WHERE c.id_usuario = :userid"; // Vínculo direto agora

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':userid' => $userId]);
    $veiculos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($veiculos);

} catch (PDOException $e) {
    http_response_code(500);
    // Log do erro real no servidor para debug
    error_log("Erro em buscar_veiculos: " . $e->getMessage());
    echo json_encode(['error' => 'Erro ao buscar veículos.']);
}
?>