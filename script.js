// Importando Firebase e Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

const loggedInUser = localStorage.getItem('loggedInUser');

// Adiciona a função de logout ao objeto global window
window.logout = function() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
};

// Função para atualizar o status no Firestore
async function atualizarStatusFirestore(nome, dia, status, viagemData) {
    const motoristaRef = doc(db, 'motoristas', nome);
    await setDoc(motoristaRef, {
        [dia]: { status, viagemData }
    }, { merge: true });
}

// Função para limpar cache
function limparCache() {
    localStorage.clear();
    alert('Cache e dados armazenados foram limpos.');
}

// Adiciona a função de limpar cache ao objeto global window
window.limparCache = limparCache;

// Função para mostrar a seleção de status
function mostrarSelecaoStatus(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    let statusOptions = `
        <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Disponível', 'green', ${dia}, ${linha})">Disponível</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarSelecaoAtendimento('${nome}', ${dia}, ${linha})">Em Atendimento</div>
    `;

    // Verifica se o usuário logado é admin
    if (loggedInUser === 'admin') {
        statusOptions += `
            <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarSelecaoViagem('${nome}', ${dia}, ${linha})">Viagem</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Compensando', 'red', ${dia}, ${linha})">Compensando</div>
        `;
    }

    // Atualiza o conteúdo do elemento de seleção de status
    statusSelecao.innerHTML = statusOptions;
    document.getElementById('status-selecao').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoStatus = mostrarSelecaoStatus;

// Mostra a seleção de atendimento
function mostrarSelecaoAtendimento(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const atendimentoOptions = `
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', '5º Andar', 'red', ${dia}, ${linha})">5º Andar</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Eremita', 'red', ${dia}, ${linha})">Eremita</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Laisa', 'red', ${dia}, ${linha})">Laisa</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Czarina', 'red', ${dia}, ${linha})">Czarina</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Regis', 'red', ${dia}, ${linha})">Regis</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Rodolpho', 'red', ${dia}, ${linha})">Rodolpho</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Robson', 'red', ${dia}, ${linha})">Robson</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Crosara', 'red', ${dia}, ${linha})">Crosara</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Presidente', 'red', ${dia}, ${linha})">Presidente</div>
    `;

    statusSelecao.innerHTML = atendimentoOptions;
    document.getElementById('status-selecao').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

// Adiciona a função de mostrarSelecaoAtendimento ao objeto global window
window.mostrarSelecaoAtendimento = mostrarSelecaoAtendimento;

// Mostra a seleção de viagem
function mostrarSelecaoViagem(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const viagemOptions = `
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, ${linha}, 'SENAI DR')">SENAI DR</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, ${linha}, 'SESI DR')">SESI DR</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, ${linha}, 'Regis')">Regis</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, ${linha}, 'Rodolpho')">Rodolpho</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculos('${nome}', ${dia}, ${linha}, 'Anatole')">Anatole</div>
    `;

    statusSelecao.innerHTML = viagemOptions;
}

// Adiciona a função de mostrarSelecaoViagem ao objeto global window
window.mostrarSelecaoViagem = mostrarSelecaoViagem;

// Mostra a seleção de veículos
function mostrarVeiculos(nome, dia, linha, cliente) {
    const statusSelecao = document.getElementById('status-selecao');
    const veiculoOptions = `
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, ${linha}, '${cliente}', 'Hilux SW4')">Hilux SW4</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, ${linha}, '${cliente}', 'Hilux Carr. Mad.')">Hilux Carr. Mad.</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, ${linha}, '${cliente}', 'Corolla')">Corolla</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, ${linha}, '${cliente}', 'Ranger P')">Ranger P</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, ${linha}, '${cliente}', 'Ranger B')">Ranger B</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, ${linha}, '${cliente}', 'Frontier')">Frontier</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, ${linha}, '${cliente}', 'Compass')">Compass</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, ${linha}, '${cliente}', 'Yaris')">Yaris</div>
    `;

    statusSelecao.innerHTML = veiculoOptions;
}

// Adiciona a função de mostrarVeiculos ao objeto global window
window.mostrarVeiculos = mostrarVeiculos;

// Adiciona o veículo e cidade
function adicionarVeiculo(nome, dia, linha, cliente, veiculo) {
    const statusSelecao = document.getElementById('status-selecao');
    const cidadeInput = `
        <div class="cidade-input">
            <label>Digite a cidade destino:</label>
            <input type="text" id="cidade-destino" placeholder="Cidade destino">
            <button style="background-color: green; color: white;" onclick="finalizarViagem('${nome}', ${dia}, ${linha}, '${cliente}', '${veiculo}')">+</button>
        </div>
    `;

    statusSelecao.innerHTML = cidadeInput;
}

// Finaliza a viagem
async function finalizarViagem(nome, dia, linha, cliente, veiculo) {
    const cidadeDestino = document.getElementById('cidade-destino').value;
    if (!cidadeDestino) {
        alert("Por favor, digite a cidade destino.");
        return;
    }

    // Atualiza o status do motorista
    const viagemData = {
        cidade: cidadeDestino,
        veiculo: veiculo,
        cliente: cliente
    };
    await atualizarStatusFirestore(nome, dia, 'Em Viagem', viagemData); // Atualiza o status no Firestore

    // Atualiza visualmente o motorista
    const motoristaDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .motorista`);

    // Limpa as informações anteriores antes de adicionar novas
    motoristaDiv.innerHTML = `
        <button class="adicionar" onclick="mostrarSelecaoStatus('${nome}', ${dia}, ${linha})">+</button>
        <span style="font-weight: bold;">${nome}</span>
        <div class="status" style="color: yellow; font-weight: bold;">Em Viagem</div>
        <div>Cidade: ${cidadeDestino}</div>
        <div>Veículo: ${veiculo}</div>
        <div>Cliente: ${cliente}</div>
    `;

    fecharSelecaoStatus(); // Fecha todas as seleções
}

// Função para adicionar o status selecionado à célula correspondente
async function adicionarStatus(nome, status, cor, dia, linha) {
    fecharSelecaoStatus();

    // Acessa a célula correta do motorista usando data attributes
    const celula = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"]`);

    if (!celula) {
        console.error('Célula não encontrada para o motorista:', nome);
        return;
    }

    const motoristaDiv = celula.querySelector('.motorista');

    // Limpa o conteúdo anterior antes de adicionar novo status
    motoristaDiv.innerHTML = `
        <button class="adicionar" onclick="mostrarSelecaoStatus('${nome}', ${dia}, ${linha})">+</button>
        <span style="font-weight: bold;">${nome}</span>
        <div class="status" style="color: ${cor}; font-weight: bold;">${status}</div>
    `;

    // Atualiza o status do motorista apenas para o dia específico
    await atualizarStatusFirestore(nome, dia, status, null); // Atualiza o status no Firestore
}

// Adiciona a função adicionarStatus ao objeto global window
window.adicionarStatus = adicionarStatus;

// Inicializa a lista de motoristas
async function inicializarMotoristas() {
    const diaAtual = new Date().getDay();
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const tabela = document.getElementById('tabela-motoristas');

    // Limpa a tabela antes de adicionar motoristas
    tabela.innerHTML = '';

    // Criação do cabeçalho
    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');

    // Se o usuário for admin, exibe todos os dias
    if (loggedInUser === 'admin') {
        dias.forEach(dia => {
            cabecalho.innerHTML += `<div class="celula">${dia.toUpperCase()}</div>`;
        });
    } else {
        // Se o usuário for um motorista, exibe apenas o dia atual
        cabecalho.innerHTML += `<div class="celula">${dias[diaAtual].toUpperCase()}</div>`;
    }

    tabela.appendChild(cabecalho);

    // Lógica para adicionar motoristas
    if (loggedInUser === 'admin') {
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        motoristasSnapshot.forEach(doc => {
            const motorista = doc.id; // Nome do motorista
            const dados = doc.data(); // Dados do motorista

            const linha = document.createElement('div');
            linha.classList.add('linha');
            linha.setAttribute('data-linha', motorista);

            dias.forEach((dia, diaIndex) => {
                const celula = document.createElement('div');
                celula.classList.add('celula');
                celula.setAttribute('data-dia', diaIndex);

                const statusAtual = dados[diaIndex] || { status: 'Disponível', viagemData: null };

                celula.innerHTML = `
                    <div class="motorista">
                        <button class="adicionar" onclick="mostrarSelecaoStatus('${motorista}', ${diaIndex}, '${motorista}')">+</button>
                        <span style="font-weight: bold;">${motorista}</span>
                        <div class="status" style="color: ${statusAtual.status === 'Disponível' ? 'green' : 'red'}; font-weight: bold;">${statusAtual.status}</div>
                        ${statusAtual.viagemData ? `<div>Cidade: ${statusAtual.viagemData.cidade}</div><div>Veículo: ${statusAtual.viagemData.veiculo}</div><div>Cliente: ${statusAtual.viagemData.cliente}</div>` : ''}
                    </div>
                `;
                linha.appendChild(celula);
            });
            tabela.appendChild(linha);
        });
    } else {
        // Apenas o motorista logado é exibido
        const linha = document.createElement('div');
        linha.classList.add('linha');
        linha.setAttribute('data-linha', '0');

        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.setAttribute('data-dia', diaAtual); 

        celula.innerHTML = `
            <div class="motorista">
                <button class="adicionar" onclick="mostrarSelecaoStatus('${loggedInUser}', ${diaAtual}, 0)">+</button>
                <span style="font-weight: bold;">${loggedInUser}</span>
                <div class="status" style="color: green; font-weight: bold;">Disponível</div>
            </div>
        `;
        linha.appendChild(celula);
        tabela.appendChild(linha);
    }
}

// Chama a função após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    inicializarMotoristas();

    // Escutando mudanças em tempo real
    onSnapshot(collection(db, 'motoristas'), (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "modified") {
                const motorista = change.doc.id;
                const dados = change.doc.data();
                atualizarLinhaMotorista(motorista, dados);
            }
        });
    });
});

// Função para atualizar a linha de um motorista específico
function atualizarLinhaMotorista(motorista, dados) {
    const tabela = document.getElementById('tabela-motoristas');
    const linha = Array.from(tabela.children).find(l => l.getAttribute('data-linha') === motorista);

    if (linha) {
        const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        dias.forEach((dia, diaIndex) => {
            const celula = linha.querySelector(`.celula[data-dia="${diaIndex}"]`);
            const statusAtual = dados[diaIndex] || { status: 'Disponível', viagemData: null };

            celula.innerHTML = `
                <div class="motorista">
                    <button class="adicionar" onclick="mostrarSelecaoStatus('${motorista}', ${diaIndex}, '${motorista}')">+</button>
                    <span style="font-weight: bold;">${motorista}</span>
                    <div class="status" style="color: ${statusAtual.status === 'Disponível' ? 'green' : 'red'}; font-weight: bold;">${statusAtual.status}</div>
                    ${statusAtual.viagemData ? `<div>Cidade: ${statusAtual.viagemData.cidade}</div><div>Veículo: ${statusAtual.viagemData.veiculo}</div><div>Cliente: ${statusAtual.viagemData.cliente}</div>` : ''}
                </div>
            `;
        });
    }
}

// Função para fechar a seleção de status
function fecharSelecaoStatus() {
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}
