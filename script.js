/* Estilos Gerais */
body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
}

.header {
    text-align: center;
    margin-bottom: 20px;
}

h1 {
    margin: 0;
    font-size: 24px;
    color: #333;
}

button {
    margin-top: 10px;
    padding: 10px 20px;
    color: white; /* Cor da fonte */
    border: none; /* Removendo a borda */
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s;
}

button.entrar-button {
    background-color: blue; /* Mantendo azul para o botão Entrar */
}

button.limpar-cache-button {
    background-color: blue; /* Mantendo azul para o botão Limpar Cache */
}

button.sair-button {
    background-color: red; /* Mudando para vermelho para o botão Sair */
}

button:hover {
    background-color: darkred; /* Alterando a cor do hover para um tom mais escuro de vermelho para o botão Sair */
}

button.entrar-button:hover, button.limpar-cache-button:hover {
    background-color: darkblue; /* Alterando a cor do hover para um tom mais escuro de azul para Entrar e Limpar Cache */
}

/* Estilos para a Página Principal */
.tabela {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.celula {
    background: #e0e0e0;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.celula:hover {
    background: #ccc;
}

.linha {
    display: contents;
}

.cabecalho {
    font-weight: bold;
}

.overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
}

.selecao-status {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 5px;
    z-index: 200;
}

.motorista {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.adicionar {
    background: green;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.8em;
    margin-bottom: 5px;
}

.status {
    cursor: pointer;
    padding: 10px;
    border: 1px solid #ccc;
    margin: 5px;
    text-align: center;
    width: 100%;
}

/* Media Queries para Responsividade */
@media (max-width: 768px) {
    .tabela {
        grid-template-columns: repeat(4, 1fr);
    }
    .celula {
        padding: 15px;
    }
}

@media (max-width: 480px) {
    .tabela {
        grid-template-columns: 1fr;
    }
    .linha.cabecalho {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
    }
    .linha:not(.cabecalho) {
        display: grid;
        grid-template-columns: 1fr;
    }
    .celula {
        padding: 10px;
    }
}
