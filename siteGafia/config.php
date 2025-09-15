<?php 
	// para conexão com o banco de dados PostgreSQL
	$host = 'dpg-cvriq3be5dus738a7r3g-a.oregon-postgres.render.com';
	$dbname = 'dbgafia_tp8h';
	$user = 'dbgafia_tp8h_user';
	$password = 'YcBpnDhYNSD1OzYdr2Rijt3jEEiZJhOa';
	$port = '5432';

	//Cria uma linha de conexão
	$conn_string = "host={$host} port={$port} dbname={$dbname} user={$user} password={$password} sslmode=require";

	//Tentando conectar
	$dbconn = pg_connect($conn_string);

	if ($dbconn) {
		echo "Banco conectado com sucesso!";
	} else {
		echo "Erro ao se conectar com o banco.";
	}


 ?>