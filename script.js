// Importando Firebase e Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, onSnapshot, getDocs, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAUId3pGxpNtb_MK8zwZoxnAu-3RLhjwxk",
    authDomain: "bd-painel-motoristas.firebaseapp.com",
    projectId: "bd-painel-motoristas",
    storageBucket: "bd-painel-motoristas.appspot.com",
    messagingSenderId: "773975140156",
    appId: "1:773975140156:web:85ffefe92d32ab79e76039",
    measurementId: "G-G6LKNW06JL"
};

// Inicializando Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase e Firestore inicializados com sucesso.");

// Converte o nome do usuário para maiúsculas
const loggedInUser = localStorage.getItem('loggedInUser') ? localStorage.getItem('loggedInUser').toUpperCase() : null;
console.log("Usuário logado:", loggedInUser);

// Redireciona acessos não autorizados
const urlsProtegidas = [
    'https://bloodking1904.github.io/testnoe/index.html',
    'https://bloodking1904.github.io/testnoe/login.js',
    'https://bloodking1904.github.io/testnoe/script.js',
    'https://bloodking1904.github.io/testnoe/styles.css',
];

// Verifica se a URL atual está nas URLs protegidas e se o usuário não está logado
if (urlsProtegidas.includes(window.location.href) && !loggedInUser) {
    window.location.href = 'login.html';
}

// Função para verificar se o usuário está autenticado
function verificarAutenticacao() {
    const isAdmin = loggedInUser === 'ADMIN';

    // Se não houver usuário logado, redireciona para a página de login
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    // Configurações de tempo de sessão
    if (isAdmin) {
        // Atualiza a conexão do admin a cada 60 segundos
        setInterval(() => {
            console.log("Conexão do admin atualizada.");
        }, 60000); // 60 segundos
    } else {
        // Para motoristas, define um temporizador de 5 minutos
        setTimeout(() => {
            alert("Sua sessão expirou. Faça login novamente.");
            localStorage.removeItem('loggedInUser'); // Remove o usuário logado
            window.location.href = 'login.html'; // Redireciona para a página de login
        }, 5 * 60 * 1000); // 5 minutos
    }
}

// Executa a verificação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    // Outras inicializações podem ser colocadas aqui
});

// Adiciona a função de logout ao objeto global window
window.logout = function () {
    console.log("Logout do usuário:", loggedInUser);
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
};

// Função para atualizar o status no Firestore
async function atualizarStatusFirestore(idMotorista, dia, status, viagemData) {
    try {
        console.log(`Atualizando status do motorista: ${idMotorista}, Dia: ${dia}, Status: ${status}`);
        const motoristaRef = doc(db, 'motoristas', idMotorista);
        
        // Atualizar o status e a viagemData no campo apropriado
        await setDoc(motoristaRef, { 
            [dia]: { 
                status: status, 
                viagemData: viagemData || null // Garante que viagemData não seja undefined
            }
        }, { merge: true });
        
        console.log("Status atualizado com sucesso.");
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
    }
}

// Adiciona a função para confirmar o reset de status
window.confirmarResetarStatus = function () {
    if (confirm("Tem certeza que deseja resetar o status de todos os motoristas?")) {
        resetarStatusTodosMotoristas();
    }
};

// Função para resetar o status de todos os motoristas
async function resetarStatusTodosMotoristas() {
    try {
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        const batch = writeBatch(db); // Usar batch para atualizar vários documentos de forma eficiente

        motoristasSnapshot.docs.forEach(doc => {
            const motoristaRef = doc.ref;

            // Atualiza o status para 'Disponível' para cada dia da semana (0 a 6)
            for (let dia = 0; dia <= 6; dia++) {
                batch.set(motoristaRef, {
                    [dia]: {
                        status: 'Disponível', // Define o status para 'Disponível'
                        viagemData: null // Define viagemData como null
                    }
                }, { merge: true });
            }
        });

        await batch.commit(); // Executa todas as operações em um único lote
        alert("Status de todos os motoristas foi resetado para 'Disponível'.");
        console.log("Status de todos os motoristas resetados com sucesso.");

        // Chama a função para atualizar visualmente os motoristas
        await inicializarMotoristas(); // Atualiza a tabela de motoristas
    } catch (error) {
        console.error("Erro ao resetar status:", error);
        alert("Ocorreu um erro ao resetar o status dos motoristas.");
    }
}

// Adiciona a função ao objeto global window
window.resetarStatusTodosMotoristas = resetarStatusTodosMotoristas;

// Função para mostrar a seleção de status
function mostrarSelecaoStatus(element) {
    if (!element) {
        console.error("Elemento não está definido.");
        return;
    }

    const idMotorista = element.dataset.idMotorista;
    if (!idMotorista) {
        console.error("ID do motorista não encontrado.");
        return;
    }

    const dia = element.dataset.dia;
    const linha = String(element.dataset.linha);

    const statusSelecao = document.getElementById('status-selecao');

    let statusOptions = `
        <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" 
            onclick="adicionarStatus('${idMotorista}', 'Disponível', 'green', ${dia}, '${linha}')">Disponível</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
            onclick="mostrarSelecaoAtendimento('${idMotorista}', ${dia}, '${linha}')">Em Atendimento</div>
    `;

    if (loggedInUser === 'ADMIN') {
        statusOptions += `
            <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" 
                onclick="mostrarSelecaoViagem('${idMotorista}', ${dia}, '${linha}')">Viagem</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
                onclick="adicionarStatus('${idMotorista}', 'Compensando', 'red', ${dia}, '${linha}')">Compensando</div>
        `;
    }

    statusSelecao.innerHTML = statusOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
    console.log("Opções de status exibidas.");
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoStatus = mostrarSelecaoStatus;

// Mostra a seleção de atendimento
function mostrarSelecaoAtendimento(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');

    const atendimentoOptions = `
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', '5º Andar', 'red', ${dia}, '${linha}')">5º Andar</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Eremita', 'red', ${dia}, '${linha}')">Eremita</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Laisa', 'red', ${dia}, '${linha}')">Laisa</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Czarina', 'red', ${dia}, '${linha}')">Czarina</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Regis', 'red', ${dia}, '${linha}')">Regis</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Rodolpho', 'red', ${dia}, '${linha}')">Rodolpho</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Robson', 'red', ${dia}, '${linha}')">Robson</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Crosara', 'red', ${dia}, '${linha}')">Crosara</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Anatole', 'red', ${dia}, '${linha}')">Anatole</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Presidente', 'red', ${dia}, '${linha}')">Presidente</div>
    `;

    statusSelecao.innerHTML = atendimentoOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoAtendimento = mostrarSelecaoAtendimento;

// Mostra a seleção de viagem
function mostrarSelecaoViagem(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const viagemOptions = `
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, '${linha}', 'SENAI DR')">SENAI DR</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, '${linha}', 'SESI DR')">SESI DR</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, '${linha}', 'Regis')">Regis</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, '${linha}', 'Rodolpho')">Rodolpho</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, '${linha}', 'Anatole')">Anatole</div>
    `;

    statusSelecao.innerHTML = viagemOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoViagem = mostrarSelecaoViagem;

// Mostra a seleção de veículos
function mostrarVeiculos(nome, dia, linha, cliente) {
    const statusSelecao = document.getElementById('status-selecao');
    const veiculoOptions = `
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', 'Hilux SW4')">Hilux SW4</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', 'Hilux Carr. Mad.')">Hilux Carr. Mad.</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', 'Corolla')">Corolla</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', 'Ranger P')">Ranger P</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', 'Ranger B')">Ranger B</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', 'Frontier')">Frontier</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', 'Compass')">Compass</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', 'Yaris')">Yaris</div>
    `;

    statusSelecao.innerHTML = veiculoOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarVeiculos = mostrarVeiculos;

// Adiciona o veículo e cidade
function adicionarVeiculo(nome, dia, linha, cliente, veiculo) {
    const statusSelecao = document.getElementById('status-selecao');
    const cidadeInput = `
        <div class="cidade-input">
            <label>Digite a cidade destino:</label>
            <input type="text" id="cidade-destino" placeholder="Cidade destino">
            <button style="background-color: green; color: white;" onclick="finalizarViagem('${nome}', ${dia}, '${linha}', '${cliente}', '${veiculo}')">+</button>
        </div>
    `;

    statusSelecao.innerHTML = cidadeInput;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.adicionarVeiculo = adicionarVeiculo;

// Finaliza a viagem
function finalizarViagem(nome, dia, linha, cliente, veiculo) {
    const cidadeDestino = document.getElementById('cidade-destino').value;
    if (!cidadeDestino) {
        alert("Por favor, digite a cidade destino.");
        return;
    }

    const viagemData = {
        cidade: cidadeDestino,
        veiculo: veiculo,
        cliente: cliente
    };

    // Atualiza o status no Firestore
    adicionarStatus(nome, 'Em Viagem', 'yellow', dia, linha, viagemData); // Atualiza o status

    // Atualiza visualmente o motorista
    const motoristaDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .motorista`);

    if (motoristaDiv) {
        motoristaDiv.innerHTML = `
            <button class="adicionar" data-id-motorista="${nome}" data-dia="${dia}" data-linha="${linha}" 
                onclick="mostrarSelecaoStatus(this)" style="font-size: 1.5em; padding: 10px; background-color: green; color: white; border: none; border-radius: 5px; width: 40px; height: 40px;">+</button>
            <span style="font-weight: bold;">${nome}</span>
            <div class="status" style="color: yellow; border: 1px solid black; font-weight: bold;">Em Viagem</div>
            <div style="white-space: nowrap;"><strong>Cidade:</strong> ${cidadeDestino}</div>
            <div style="white-space: nowrap;"><strong>Veículo:</strong> ${veiculo}</div>
            <div><strong>Cliente:</strong> ${cliente}</div>
        `;
    } else {
        console.error("Div do motorista não encontrada ao atualizar visualmente.");
    }

    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';

    fecharSelecaoStatus(); // Fecha todas as seleções 
}

// Adiciona a função finalizar viagem ao objeto global window
window.finalizarViagem = finalizarViagem;

// Função para adicionar o status selecionado à célula correspondente
async function adicionarStatus(idMotorista, status, cor, dia, linha, viagemData) {
    console.log(`Adicionando status: ${status} para o motorista: ${idMotorista}, Dia: ${dia}, Linha: ${linha}`);
    fecharSelecaoStatus();

    const celula = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"]`);

    if (!celula) {
        console.error('Célula não encontrada para o motorista:', idMotorista);
        return;
    }

    const motoristaDiv = celula.querySelector('.motorista');

    motoristaDiv.innerHTML = `
        <button class="adicionar" data-id-motorista="${idMotorista}" data-dia="${dia}" data-linha="${linha}" 
            onclick="mostrarSelecaoStatus(this)">+</button>
        <span style="font-weight: bold;">${idMotorista}</span>
        <div class="status" style="color: ${cor}; font-weight: bold;">${status}</div>
    `;

    await atualizarStatusFirestore(idMotorista, dia, status, viagemData);
    console.log("Status adicionado com sucesso.");
}

window.adicionarStatus = adicionarStatus;

// Inicializa a lista de motoristas
async function inicializarMotoristas() {
    console.log("Inicializando motoristas...");
    const diaAtual = new Date().getDay();
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const tabela = document.getElementById('tabela-motoristas');

    tabela.innerHTML = '';

    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');

    if (loggedInUser === 'ADMIN') {
        dias.forEach(dia => {
            const celula = document.createElement('div');
            celula.classList.add('celula');
            celula.textContent = dia.toUpperCase();
            cabecalho.appendChild(celula);
        });
    } else {
        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.textContent = dias[diaAtual].toUpperCase();
        cabecalho.appendChild(celula);
    }

    tabela.appendChild(cabecalho);
    console.log("Cabeçalho da tabela criado.");

    const motoristaRef = doc(db, 'motoristas', loggedInUser);
    const motoristaSnapshot = await getDoc(motoristaRef);

    if (motoristaSnapshot.exists()) {
        const dados = motoristaSnapshot.data();
        const linha = document.createElement('div');
        linha.classList.add('linha');
        linha.dataset.linha = loggedInUser; 

        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.dataset.dia = diaAtual;

        const statusAtual = dados[diaAtual] || { status: 'Disponível', viagemData: null };

        celula.innerHTML = `
            <div class="motorista">
                <button class="adicionar" data-id-motorista="${loggedInUser}" data-dia="${diaAtual}" data-linha="${loggedInUser}"
                    onclick="mostrarSelecaoStatus(this)">+</button>
                <span style="font-weight: bold;">${loggedInUser}</span>
                <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'Disponível' ? 'green' : 'red')}; font-weight: bold;">
                    ${statusAtual.status}
                </div>
                ${statusAtual.viagemData ? `<div style="white-space: nowrap;"><strong>Cidade:</strong> ${statusAtual.viagemData.cidade}</div>
                <div style="white-space: nowrap;"><strong>Veículo:</strong> ${statusAtual.viagemData.veiculo}</div>
                <div><strong>Cliente:</strong> ${statusAtual.viagemData.cliente}</div>` : ''}
            </div>
        `;

        linha.appendChild(celula);
        tabela.appendChild(linha);
    } else {
        console.log("Motorista não encontrado no Firestore. Verifique se o ID está correto e se o motorista existe.");
    }

    console.log("Tabela de motoristas inicializada.");

  
    // Log para verificar os IDs das linhas
    console.log("IDs das linhas na tabela:", [...tabela.children].map(l => l.getAttribute('data-linha')));
}
    
 


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM totalmente carregado. Inicializando motoristas...");
    inicializarMotoristas();

    onSnapshot(collection(db, 'motoristas'), (snapshot) => {
        console.log("Mudanças detectadas no Firestore.");
        snapshot.docChanges().forEach(change => {
            if (change.type === "modified") {
                const motorista = change.doc.id;
                const dados = change.doc.data();
                console.log("Motorista modificado:", motorista, "Novos dados:", dados);
                atualizarLinhaMotorista(motorista, dados);
            }
        });
    });
});

// Função para atualizar a linha de um motorista específico
function atualizarLinhaMotorista(motorista, dados) {
    console.log("Atualizando linha para motorista:", motorista);
    const tabela = document.getElementById('tabela-motoristas');
    const linha = Array.from(tabela.children).find(l => l.getAttribute('data-linha') === motorista);

    if (linha) {
        const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diaAtual = new Date().getDay(); 

        const celula = linha.querySelector(`.celula[data-dia="${diaAtual}"]`);
        const statusAtual = dados[diaAtual] || { status: 'Disponível', viagemData: null };

        if (celula) {
            celula.innerHTML = `
                <div class="motorista">
                    <button class="adicionar" data-id-motorista="${motorista}" data-dia="${diaAtual}" data-linha="${motorista}" 
                        onclick="mostrarSelecaoStatus(this)">+</button>
                    <span style="font-weight: bold;">${motorista}</span>
                    <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'Disponível' ? 'green' : 'red')}; border: 1px solid black; font-weight: bold;">
                        ${statusAtual.status}
                    </div>
                    ${statusAtual.viagemData ? `<div style="white-space: nowrap;"><strong>Cidade:</strong> ${statusAtual.viagemData.cidade}</div><div style="white-space: nowrap;"><strong>Veículo:</strong> ${statusAtual.viagemData.veiculo}</div><div><strong>Cliente:</strong> ${statusAtual.viagemData.cliente}</div>` : ''}
                </div>
            `;
        } else {
            console.error(`Célula não encontrada para o motorista ${motorista} no dia ${dias[diaAtual]}`);
        }
    } else {
        console.error(`Linha para o motorista ${motorista} não encontrada.`);
    }
}

// Adiciona a função de limpar cache ao objeto global window
window.atualizarLinhaMotorista = atualizarLinhaMotorista;

// Função para fechar a seleção de status
function fecharSelecaoStatus() {
    console.log("Fechando seleção de status.");
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

window.fecharSelecaoStatus = fecharSelecaoStatus;
