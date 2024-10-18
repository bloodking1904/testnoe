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

console.log("Firebase e Firestore inicializados com sucesso.");

const loggedInUser = localStorage.getItem('loggedInUser');
console.log("Usuário logado:", loggedInUser);

// Adiciona a função de logout ao objeto global window
window.logout = function() {
    console.log("Logout do usuário:", loggedInUser);
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
};

// Função para atualizar o status no Firestore
async function atualizarStatusFirestore(idMotorista, dia, status, viagemData) {
    try {
        console.log(`Atualizando status do motorista: ${idMotorista}, Dia: ${dia}, Status: ${status}`);
        const motoristaRef = doc(db, 'motoristas', idMotorista);
        await setDoc(motoristaRef, { [dia]: { status, viagemData } }, { merge: true });
        console.log("Status atualizado com sucesso.");
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
    }
}

// Função para limpar cache
function limparCache() {
    console.log("Limpando cache...");
    localStorage.clear();
    alert('Cache e dados armazenados foram limpos.');
}

// Adiciona a função de limpar cache ao objeto global window
window.limparCache = limparCache;

// Função para mostrar a seleção de status
function mostrarSelecaoStatus(element) {
    const idMotorista = element.dataset.idMotorista;
    const dia = element.dataset.dia;
    const linha = String(element.dataset.linha); // Garantindo que linha seja uma string

    const statusSelecao = document.getElementById('status-selecao');

    let statusOptions = `
        <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" 
            onclick="adicionarStatus('${idMotorista}', 'Disponível', 'green', ${dia}, '${linha}')">Disponível</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
            onclick="mostrarSelecaoAtendimento('${idMotorista}', ${dia}, '${linha}')">Em Atendimento</div>
    `;

    if (loggedInUser === 'admin') {
        statusOptions += `
            <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" 
                onclick="mostrarSelecaoViagem('${idMotorista}', ${dia}, '${linha}')">Viagem</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
                onclick="adicionarStatus('${idMotorista}', 'Compensando', 'red', ${dia}, '${linha}')">Compensando</div>
        `;
    }

    statusSelecao.innerHTML = statusOptions;
    document.getElementById('status-selecao').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
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
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Presidente', 'red', ${dia}, '${linha}')">Presidente</div>
    `;

    statusSelecao.innerHTML = atendimentoOptions;
    document.getElementById('status-selecao').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
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
}

// Adiciona a função ao objeto global window -------------------------
window.adicionarVeiculo = adicionarVeiculo;

// Finaliza a viagem
function finalizarViagem(nome, dia, linha, cliente, veiculo) {
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
    adicionarStatus(nome, 'Em Viagem', 'yellow', dia, linha, viagemData); // Atualiza o status
    atualizarStatusLocalStorage(nome, dia, 'Em Viagem', viagemData); // Atualiza no localStorage

    // Atualiza visualmente o motorista
    const motoristaDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .motorista`);

    // Limpa as informações anteriores antes de adicionar novas
    motoristaDiv.innerHTML = `
        <button class="adicionar" onclick="mostrarSelecaoStatus('${nome}', ${dia}, '${linha}')">+</button>
        <span style="font-weight: bold;">${nome}</span>
        <div class="status" style="color: yellow; font-weight: bold;">Em Viagem</div>
        <div>Cidade: ${cidadeDestino}</div>
        <div>Veículo: ${veiculo}</div>
        <div>Cliente: ${cliente}</div>
    `;

    fecharSelecaoStatus(); // Fecha todas as seleções
}

// Adiciona a função ao objeto global window -------------------------
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

    if (loggedInUser === 'admin') {
        dias.forEach(dia => {
            cabecalho.innerHTML += `<div class="celula">${dia.toUpperCase()}</div>`;
        });
    } else {
        cabecalho.innerHTML += `<div class="celula">${dias[diaAtual].toUpperCase()}</div>`;
    }

    tabela.appendChild(cabecalho);
    console.log("Cabeçalho da tabela criado.");

    if (loggedInUser === 'admin') {
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        console.log("Motoristas obtidos do Firestore.");
        
        motoristasSnapshot.forEach(doc => {
            const motorista = doc.id; 
            const dados = doc.data(); 
            console.log("Motorista:", motorista, "Dados:", dados);

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
                        <button class="adicionar" data-id-motorista="${motorista}" data-dia="${diaIndex}" data-linha="${motorista}" 
                            onclick="mostrarSelecaoStatus(this)">+</button>
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
        const linha = document.createElement('div');
        linha.classList.add('linha');
        linha.setAttribute('data-linha', '0');

        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.setAttribute('data-dia', diaAtual); 

        celula.innerHTML = `
            <div class="motorista">
                <button class="adicionar" data-id-motorista="${loggedInUser}" data-dia="${diaAtual}" data-linha="0" 
                    onclick="mostrarSelecaoStatus(this)">+</button>
                <span style="font-weight: bold;">${loggedInUser}</span>
                <div class="status" style="color: green; font-weight: bold;">Disponível</div>
            </div>
        `;
        linha.appendChild(celula);
        tabela.appendChild(linha);
    }

    console.log("Tabela de motoristas inicializada.");
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
        dias.forEach((dia, diaIndex) => {
            const celula = linha.querySelector(`.celula[data-dia="${diaIndex}"]`);
            const statusAtual = dados[diaIndex] || { status: 'Disponível', viagemData: null };

            celula.innerHTML = `
                <div class="motorista">
                    <button class="adicionar" data-id-motorista="${motorista}" data-dia="${diaIndex}" data-linha="${motorista}" 
                        onclick="mostrarSelecaoStatus(this)">+</button>
                    <span style="font-weight: bold;">${motorista}</span>
                    <div class="status" style="color: ${statusAtual.status === 'Disponível' ? 'green' : 'red'}; font-weight: bold;">${statusAtual.status}</div>
                    ${statusAtual.viagemData ? `<div>Cidade: ${statusAtual.viagemData.cidade}</div><div>Veículo: ${statusAtual.viagemData.veiculo}</div><div>Cliente: ${statusAtual.viagemData.cliente}</div>` : ''}
                </div>
            `;
        });
    } else {
        console.error(`Linha para o motorista ${motorista} não encontrada.`);
    }
}

// Função para fechar a seleção de status
function fecharSelecaoStatus() {
    console.log("Fechando seleção de status.");
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

window.fecharSelecaoStatus = fecharSelecaoStatus;
