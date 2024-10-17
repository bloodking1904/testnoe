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

// Função de logout
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

// Função para atualizar o status no Firestore
async function atualizarStatusFirestore(idMotorista, dia, status, viagemData) {
    try {
        const motoristaRef = doc(db, 'motoristas', idMotorista);
        await setDoc(motoristaRef, { [dia]: { status, viagemData } }, { merge: true });
        console.log("Status atualizado com sucesso.");
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
    }
}

// Função para mostrar a seleção de status
function mostrarSelecaoStatus(element) {
    const idMotorista = element.dataset.idMotorista;
    const dia = element.dataset.dia;
    const linha = String(element.dataset.linha);

    const statusSelecao = document.getElementById('status-selecao');
    let statusOptions = `
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Disponível', 'green', ${dia}, '${linha}')">Disponível</div>
        <div class="status" onclick="mostrarSelecaoAtendimento('${idMotorista}', ${dia}, '${linha}')">Atendimento</div>
        <div class="status" onclick="mostrarSelecaoViagem('${idMotorista}', ${dia}, '${linha}')">Viagem</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Compensando', 'red', ${dia}, '${linha}')">Compensando</div>
        <div class="status" onclick="fecharSelecao()">Fechar</div>
    `;

    statusSelecao.innerHTML = statusOptions;
    statusSelecao.style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

// Função para mostrar a seleção de atendimento
function mostrarSelecaoAtendimento(idMotorista, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const atendimentoOptions = `
        <div class="status" onclick="adicionarStatus('${idMotorista}', '5º Andar', 'red', ${dia}, '${linha}')">5º Andar</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Eremita', 'red', ${dia}, '${linha}')">Eremita</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Laisa', 'red', ${dia}, '${linha}')">Laisa</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Czarina', 'red', ${dia}, '${linha}')">Czarina</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Regis', 'red', ${dia}, '${linha}')">Regis</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Rodolpho', 'red', ${dia}, '${linha}')">Rodolpho</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Robson', 'red', ${dia}, '${linha}')">Robson</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Crosara', 'red', ${dia}, '${linha}')">Crosara</div>
        <div class="status" onclick="adicionarStatus('${idMotorista}', 'Presidente', 'red', ${dia}, '${linha}')">Presidente</div>
        <div class="status" onclick="fecharSelecao()">Fechar</div>
    `;

    statusSelecao.innerHTML = atendimentoOptions;
}

// Função para mostrar a seleção de viagem
function mostrarSelecaoViagem(idMotorista, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const viagemOptions = `
        <div class="status" onclick="mostrarVeiculos('${idMotorista}', ${dia}, '${linha}', 'SENAI DR')">SENAI DR</div>
        <div class="status" onclick="mostrarVeiculos('${idMotorista}', ${dia}, '${linha}', 'SESI DR')">SESI DR</div>
        <div class="status" onclick="mostrarVeiculos('${idMotorista}', ${dia}, '${linha}', 'Regis')">Regis</div>
        <div class="status" onclick="mostrarVeiculos('${idMotorista}', ${dia}, '${linha}', 'Rodolpho')">Rodolpho</div>
        <div class="status" onclick="mostrarVeiculos('${idMotorista}', ${dia}, '${linha}', 'Anatole')">Anatole</div>
        <div class="status" onclick="fecharSelecao()">Fechar</div>
    `;

    statusSelecao.innerHTML = viagemOptions;
}

// Função para mostrar a seleção de veículos
function mostrarVeiculos(idMotorista, dia, linha, cliente) {
    const statusSelecao = document.getElementById('status-selecao');
    const veiculoOptions = `
        <div class="status" onclick="adicionarVeiculo('${idMotorista}', ${dia}, '${linha}', '${cliente}', 'Hilux SW4')">Hilux SW4</div>
        <div class="status" onclick="adicionarVeiculo('${idMotorista}', ${dia}, '${linha}', '${cliente}', 'Hilux Carr. Mad.')">Hilux Carr. Mad.</div>
        <div class="status" onclick="adicionarVeiculo('${idMotorista}', ${dia}, '${linha}', '${cliente}', 'Corolla')">Corolla</div>
        <div class="status" onclick="adicionarVeiculo('${idMotorista}', ${dia}, '${linha}', '${cliente}', 'Ranger P')">Ranger P</div>
        <div class="status" onclick="adicionarVeiculo('${idMotorista}', ${dia}, '${linha}', '${cliente}', 'Ranger B')">Ranger B</div>
        <div class="status" onclick="adicionarVeiculo('${idMotorista}', ${dia}, '${linha}', '${cliente}', 'Frontier')">Frontier</div>
        <div class="status" onclick="adicionarVeiculo('${idMotorista}', ${dia}, '${linha}', '${cliente}', 'Compass')">Compass</div>
        <div class="status" onclick="adicionarVeiculo('${idMotorista}', ${dia}, '${linha}', '${cliente}', 'Yaris')">Yaris</div>
        <div class="status" onclick="fecharSelecao()">Fechar</div>
    `;

    statusSelecao.innerHTML = veiculoOptions;
}

// Função para adicionar o veículo e cidade
function adicionarVeiculo(idMotorista, dia, linha, cliente, veiculo) {
    const statusSelecao = document.getElementById('status-selecao');
    const cidadeInput = `
        <div class="cidade-input">
            <label>Digite a cidade destino:</label>
            <input type="text" id="cidade-destino" placeholder="Cidade destino">
            <button style="background-color: green; color: white;" onclick="finalizarViagem('${idMotorista}', ${dia}, ${linha}, '${cliente}', '${veiculo}')">+</button>
            <button onclick="fecharSelecao()">Fechar</button>
        </div>
    `;

    statusSelecao.innerHTML = cidadeInput;
}

// Finaliza a viagem
async function finalizarViagem(idMotorista, dia, linha, cliente, veiculo) {
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
    await adicionarStatus(idMotorista, 'Em Viagem', 'yellow', dia, linha, viagemData); // Atualiza o status

    // Atualiza visualmente o motorista
    const motoristaDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .motorista`);

    // Limpa as informações anteriores antes de adicionar novas
    motoristaDiv.innerHTML = `
        <button class="adicionar" onclick="mostrarSelecaoStatus(this)">+</button>
        <span style="font-weight: bold;">${idMotorista}</span>
        <div class="status" style="color: yellow; font-weight: bold;">Em Viagem</div>
        <div>Cidade: ${cidadeDestino}</div>
        <div>Veículo: ${veiculo}</div>
        <div>Cliente: ${cliente}</div>
        <button onclick="fecharSelecao()">Fechar</button>
    `;

    fecharSelecao(); // Fecha a tela de seleção
}

// Adiciona o status selecionado à célula correspondente
async function adicionarStatus(idMotorista, status, cor, dia, linha, viagemData) {
    fecharSelecao();

    // Acessa a célula correta do motorista usando data attributes
    const celula = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"]`);

    if (!celula) {
        console.error('Célula não encontrada para o motorista:', idMotorista);
        return;
    }

    const motoristaDiv = celula.querySelector('.motorista');

    // Limpa o conteúdo anterior antes de adicionar novo status
    motoristaDiv.innerHTML = `
        <button class="adicionar" data-id-motorista="${idMotorista}" data-dia="${dia}" data-linha="${linha}" 
            onclick="mostrarSelecaoStatus(this)">+</button>
        <span style="font-weight: bold;">${idMotorista}</span>
        <div class="status" style="color: ${cor}; font-weight: bold;">${status}</div>
    `;

    // Se houver dados de viagem, armazena as informações
    if (viagemData) {
        motoristaDiv.innerHTML += `
            <div>Cidade: ${viagemData.cidade}</div>
            <div>Veículo: ${viagemData.veiculo}</div>
            <div>Cliente: ${viagemData.cliente}</div>
        `;
    }

    // Atualiza o status do motorista apenas para o dia específico
    await atualizarStatusFirestore(idMotorista, dia, status, viagemData); // Atualiza o status no Firestore
}

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
function fecharSelecao() {
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

window.fecharSelecao = fecharSelecao;
