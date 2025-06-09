// Importando Firebase e Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, getDoc, writeBatch, onSnapshot} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

// --- VARIÁVEIS GLOBAIS ---
const loggedInUser = localStorage.getItem('loggedInUser') ? localStorage.getItem('loggedInUser').toUpperCase() : null;
let currentWeekIndex = 4; // Índice da semana atual (0-6)
const totalWeeks = 6; // Total de semanas
// NOVAS VARIÁVEIS PARA O CALENDÁRIO
let selecoesDeViagemMultiSemana = {};
let semanasCacheadas = [];

console.log("Usuário logado:", loggedInUser);

// Redireciona acessos não autorizados
const urlsProtegidas = [
    'https://bloodking1904.github.io/testnoe/index.html',
    'https://bloodking1904.github.io/testnoe/login.js',
    'https://bloodking1904.github.io/testnoe/script.js',
    'https://bloodking1904.github.io/testnoe/styles.css',
];
if (urlsProtegidas.includes(window.location.href) && !loggedInUser) {
    window.location.href = 'login.html';
}

// --- FUNÇÕES DE AUTENTICAÇÃO E CONFIGURAÇÃO INICIAL ---
function verificarAutenticacao() {
    console.log("Verificando autenticação...");
    const isAdmin = loggedInUser === 'ADMIN';
    if (!loggedInUser) {
        console.log("Usuário não está logado. Redirecionando para login.");
        window.location.href = 'login.html';
        return;
    }
    console.log(`Usuário logado: ${loggedInUser}`);
    if (isAdmin) {
        console.log("Usuário é admin. Atualizando conexão a cada 60 segundos.");
        setInterval(() => { console.log("Conexão do admin atualizada."); }, 60000);
    } else {
        setTimeout(() => {
            alert("Sua sessão expirou. Faça login novamente.");
            localStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        }, 5 * 60 * 1000);
    }
}


// --- FUNÇÕES DE CARREGAMENTO E MANUTENÇÃO DE DADOS ---
async function carregarMotoristas() {
    console.log("Chamando carregarMotoristas()...");
    const tabela = document.getElementById('tabela-motoristas');
    tabela.innerHTML = ''; // Limpa a tabela

    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');
    const diasDaSemana = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];
    const dataAtual = new Date();
    const diaDaSemanaAtual = dataAtual.getDay();
    const offset = diaDaSemanaAtual === 0 ? -6 : 1 - diaDaSemanaAtual;
    const segundaAtual = new Date(dataAtual);
    segundaAtual.setDate(dataAtual.getDate() + offset);
    const dataInicioSemana = new Date(segundaAtual);
    dataInicioSemana.setDate(segundaAtual.getDate() + (currentWeekIndex - 4) * 7);

    diasDaSemana.forEach((dia, index) => {
        const celula = document.createElement('div');
        celula.classList.add('celula');
        const dataFormatada = new Date(dataInicioSemana);
        dataFormatada.setDate(dataInicioSemana.getDate() + index);
        const diaFormatado = (`0${dataFormatada.getDate()}`).slice(-2) + '/' + (`0${dataFormatada.getMonth() + 1}`).slice(-2) + '/' + dataFormatada.getFullYear();
        celula.innerHTML = `${dia}<br>${diaFormatado}`;
        cabecalho.appendChild(celula);
    });
    tabela.appendChild(cabecalho);

    await escutarMotoristas();

    if (loggedInUser === 'ADMIN') {
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        motoristasSnapshot.docs.forEach(doc => {
            atualizarTabela(doc.id, doc.data());
        });
    } else {
        const motoristaRef = doc(db, 'motoristas', loggedInUser);
        const motoristaSnapshot = await getDoc(motoristaRef);
        if (motoristaSnapshot.exists()) {
            atualizarTabela(loggedInUser, motoristaSnapshot.data());
        }
    }
}

async function escutarMotoristas() {
    if (loggedInUser === 'ADMIN') {
        onSnapshot(collection(db, 'motoristas'), (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "modified") {
                    atualizarTabela(change.doc.id, change.doc.data());
                }
            });
        });
    } else {
        onSnapshot(doc(db, 'motoristas', loggedInUser), (snapshot) => {
            if (snapshot.exists()) {
                atualizarTabela(loggedInUser, snapshot.data());
            }
        });
    }
}

function atualizarTabela(motorista, dados) {
    const tabela = document.getElementById('tabela-motoristas');
    let linha = Array.from(tabela.children).find(l => l.dataset.linha === motorista);

    if (!linha) {
        linha = document.createElement('div');
        linha.classList.add('linha');
        linha.dataset.linha = motorista;
        tabela.appendChild(linha);
    } else {
        linha.innerHTML = '';
    }

    const semanaAtual = dados[`semana${currentWeekIndex}`];
    if (!semanaAtual) {
        console.warn(`Dados da semana ${currentWeekIndex} não encontrados para ${motorista}.`);
        return;
    }
    for (let dia = 0; dia < 7; dia++) {
        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.dataset.dia = dia;
        const statusAtual = semanaAtual[dia] || { status: 'DR (Por Demanda)', data: null };
        celula.innerHTML = `
            <div class="motorista">
                <button class="adicionar" data-id-motorista="${motorista}" data-dia="${dia}" data-linha="${motorista}"
                    onclick="mostrarSelecaoStatus(this)">+</button>
                <span style="font-weight: bold;">${motorista}</span>
                <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'DR (Por Demanda)' ? 'green' : 'red')}; border: 1px solid black; font-weight: bold;">
                    ${statusAtual.status}
                </div>
                ${statusAtual.data ? `
                    <div style="white-space: nowrap;"><strong>Cidade:</strong> ${statusAtual.data.cidade || 'N/A'}</div>
                    <div style="white-space: break-word;"><strong>Veículo:</strong> ${statusAtual.data.veiculo || 'N/A'}</div>
                    <div><strong>Cliente:</strong> ${statusAtual.data.cliente || 'N/A'}</div>
                ` : ''}
            </div>
        `;
        linha.appendChild(celula);
    }
}

// MODIFICADA: Função de atualização do Firestore para aceitar o índice da semana
async function atualizarStatusFirestore(idMotorista, semana, dia, statusData) {
    try {
        console.log(`Atualizando status para motorista: ${idMotorista}, Semana: ${semana}, Dia: ${dia}`);
        const motoristaRef = doc(db, 'motoristas', idMotorista);
        await setDoc(motoristaRef, {
            [`semana${semana}`]: { [dia]: statusData }
        }, { merge: true });
        console.log("Status atualizado com sucesso.");
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
    }
}

async function atualizarDadosDasSemanas() {
    const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
    for (const docSnapshot of motoristasSnapshot.docs) {
        const motoristaRef = docSnapshot.ref;
        const dados = await getDoc(motoristaRef);
        const motoristaDados = dados.data();
        for (let i = 0; i < 6; i++) {
            const dadosSemanaSeguinte = motoristaDados[`semana${i + 1}`] || {
                0: { status: 'DR (Por Demanda)', data: null }, 1: { status: 'DR (Por Demanda)', data: null },
                2: { status: 'DR (Por Demanda)', data: null }, 3: { status: 'DR (Por Demanda)', data: null },
                4: { status: 'DR (Por Demanda)', data: null }, 5: { status: 'DR (Por Demanda)', data: null },
                6: { status: 'DR (Por Demanda)', data: null },
            };
            await setDoc(motoristaRef, { [`semana${i}`]: dadosSemanaSeguinte }, { merge: true });
        }
        await setDoc(motoristaRef, {
            [`semana6`]: {
                0: { status: 'DR (Por Demanda)', data: null }, 1: { status: 'DR (Por Demanda)', data: null },
                2: { status: 'DR (Por Demanda)', data: null }, 3: { status: 'DR (Por Demanda)', data: null },
                4: { status: 'DR (Por Demanda)', data: null }, 5: { status: 'DR (Por Demanda)', data: null },
                6: { status: 'DR (Por Demanda)', data: null },
            }
        }, { merge: true });
    }
}

async function obterDataAtual() {
    const dataRef = doc(db, 'configuracoes', 'dataAtual');
    const dataSnapshot = await getDoc(dataRef);
    if (dataSnapshot.exists()) {
        return dataSnapshot.data().data;
    } else {
        const dataAtual = new Date().toISOString();
        await setDoc(dataRef, { data: dataAtual });
        return dataAtual;
    }
}

function toggleConfirmarViagemButton() {
    const cidadeInput = document.getElementById('cidade-destino-viagem');
    const confirmarButton = document.getElementById('confirmar-viagem-multi');

    // A verificação `if (cidadeInput && confirmarButton)` garante que o código não quebre
    // caso os elementos não estejam na tela.
    if (cidadeInput && confirmarButton) {
        // O botão será desabilitado se o campo da cidade, sem espaços, estiver vazio.
        confirmarButton.disabled = cidadeInput.value.trim() === '';
    }
}
// Adiciona a função à 'window' para que possa ser chamada pelo 'oninput' no HTML
window.toggleConfirmarViagemButton = toggleConfirmarViagemButton;


async function verificarSemanaPassada() {
    const dataAtualFirestore = await obterDataAtual();
    const dataAtual = new Date();
    const dataFirestore = new Date(dataAtualFirestore);
    console.log("Data do Firestore em date:", dataFirestore);

    const ultimoDiaDaSemanaFirestore = new Date(dataFirestore);
    const diaDaSemana = dataFirestore.getDay();
    const diasParaAdicionar = (7 - diaDaSemana) % 7;
    ultimoDiaDaSemanaFirestore.setDate(dataFirestore.getDate() + diasParaAdicionar);
    console.log("Último dia da semana do Firestore:", ultimoDiaDaSemanaFirestore);

    if (dataAtual > ultimoDiaDaSemanaFirestore) {
        console.log("Uma nova semana passou.");
        document.getElementById('loading').style.display = 'flex';
        await atualizarDadosDasSemanas();
        document.getElementById('loading').style.display = 'none';
        await carregarMotoristas();
        await verificarData();
    } else {
        console.log("Ainda está na mesma semana.");
        await carregarMotoristas();
        await verificarData();
    }
}

window.verificarSemanaPassada = verificarSemanaPassada;

async function verificarData() {
    const dataAtualFirestore = await obterDataAtual();
    const dataAtualLocal = new Date().toISOString().split('T')[0];
    if (dataAtualFirestore.split('T')[0] !== dataAtualLocal) {
        await setDoc(doc(db, 'configuracoes', 'dataAtual'), { data: new Date().toISOString() });
        console.log("Data atualizada no Firestore.");
    } else {
        console.log("Data do Firestore está atual.");
    }
}


// --- FLUXO DE SELEÇÃO DE STATUS (Mantido o fluxo original até a seleção de veículo) ---
function mostrarSelecaoStatus(element) {
    if (!element) { console.error("Elemento não está definido."); return; }
    const idMotorista = element.dataset.idMotorista;
    if (!idMotorista) { console.error("ID do motorista não encontrado."); return; }
    const dia = element.dataset.dia;
    const linha = String(element.dataset.linha);

    const motoristaRef = doc(db, 'motoristas', idMotorista);
    getDoc(motoristaRef).then((motoristaSnapshot) => {
        const dados = motoristaSnapshot.data();
        const statusAtual = dados[`semana${currentWeekIndex}`] && dados[`semana${currentWeekIndex}`][dia] ? dados[`semana${currentWeekIndex}`][dia].status : 'DR (Por Demanda)';
        if (loggedInUser !== 'ADMIN' && statusAtual === 'Em Viagem') {
            alert("Agenda Bloqueada pelo Administrador.");
            return;
        }
        const statusSelecao = document.getElementById('status-selecao');
        let statusOptions = `
            <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" onclick="adicionarStatus('${idMotorista}', 'DR (Por Demanda)', 'green', ${dia}, '${linha}', null)">DR (Por Demanda)</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarSelecaoAtendimento('${idMotorista}', ${dia}, '${linha}')">Em Atendimento</div>
        `;
        if (statusAtual === 'Em Viagem') {
            statusOptions += `<div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="consultarObservacao('${idMotorista}', ${dia})">OBS. VIAGEM</div>`;
        }
        if (loggedInUser === 'ADMIN') {
            statusOptions += `
                <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarSelecaoViagem('${idMotorista}', ${dia}, '${linha}')">Viagem</div>
                <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${idMotorista}', 'Compensando', 'red', ${dia}, '${linha}', null)">Compensando</div>
            `;
        }
        statusSelecao.innerHTML = statusOptions;
        document.getElementById('overlay').style.display = 'flex';
        document.getElementById('status-selecao').style.display = 'flex';
    });
}
window.mostrarSelecaoStatus = mostrarSelecaoStatus;

function mostrarSelecaoAtendimento(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const atendimentoOptions = `
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarSelecaoSecretarias('${nome}', ${dia}, '${linha}')">SEC.</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Eremita', ${dia}, '${linha}')">Eremita</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Regis', ${dia}, '${linha}')">Regis</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Rodolpho', ${dia}, '${linha}')">Rodolpho</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Robson', ${dia}, '${linha}')">Robson</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Crosara', ${dia}, '${linha}')">Crosara</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Anatole', ${dia}, '${linha}')">Anatole</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Presidente', ${dia}, '${linha}')">Presidente</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'CPL', ${dia}, '${linha}')">CPL</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'SESI - COSUP', ${dia}, '${linha}')">SESI COSUP</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'SENAI - ISI BIOMASSA', ${dia}, '${linha}')">SENAI - ISI BIOMASSA</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Diretoria - Sustentabilidade', ${dia}, '${linha}')">Diretoria - Sustentabilidade</div>
    `;
    statusSelecao.innerHTML = atendimentoOptions;
}
window.mostrarSelecaoAtendimento = mostrarSelecaoAtendimento;

function mostrarSelecaoSecretarias(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const secretariasOptions = `
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Alice', ${dia}, '${linha}')">Alice</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Czarina', ${dia}, '${linha}')">Czarina</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Daiana', ${dia}, '${linha}')">Daiana</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Erika', ${dia}, '${linha}')">Erika</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarVeiculosParaAtendimento('${nome}', 'Julia', ${dia}, '${linha}')">Julia</div>
    `;
    statusSelecao.innerHTML = secretariasOptions;
}
window.mostrarSelecaoSecretarias = mostrarSelecaoSecretarias;

function mostrarVeiculosParaAtendimento(nome, cliente, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const veiculos = [
        'Corolla QAD9618', 'Corolla RWC4D25', 'Corolla REW2E59', 'Corolla REW0H84',
        'Corolla OON5341', 'Hilux QAE8744', 'Hilux C.Mad. QAE9273', 'SW4 ROBSON SMA7I11',
        'Ranger RODOLPHO SLZ5G02', 'Ranger SERGIO SLZ5G06', 'Ranger 1° CROSARA SLZ5G03',
        'Ranger 2° CROSARA SLZ5F99', 'Ranger REGIS SLZ5G10', 'Compass RWE3G73',
        'Ranger Branca CROSARA RWB2G50', 'Ranger Branca GABINETE RWB2G51',
        'Yaris CPL REZ0D67', 'Yaris CPL RWB9D26', 'Etios CPL QAP2028', 'Agrale QAH8438',
        'Munk Iveco RWI5B17', 'AXOR QAO4215', 'Express DRC 4x2 SLX8B62',
        'Expert Furgão RWB3D79', 'Caminhão Baú Senai HSI6390', 'Trailer Odontológico',
    ];
    let veiculoOptions = '<div class="veiculo-grid">';
    veiculos.forEach(veiculo => {
        veiculoOptions += `<div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="finalizarAtendimento('${nome}', '${cliente}', '${veiculo}', ${dia}, '${linha}')">${veiculo}</div>`;
    });
    veiculoOptions += '</div>';
    statusSelecao.innerHTML = veiculoOptions;
}
window.mostrarVeiculosParaAtendimento = mostrarVeiculosParaAtendimento;

async function adicionarStatus(idMotorista, status, cor, dia, linha, data) {
    const statusData = { status, data: data || null };
    await atualizarStatusFirestore(idMotorista, currentWeekIndex, dia, statusData);
    await carregarMotoristas();
    fecharSelecaoStatus();
}
window.adicionarStatus = adicionarStatus;

function finalizarAtendimento(nome, cliente, veiculo, dia, linha) {
    const data = { cliente, veiculo, cidade: 'Campo Grande', observacao: '' };
    adicionarStatus(nome, 'Em Atendimento', 'orange', dia, linha, data);
}
window.finalizarAtendimento = finalizarAtendimento;

function mostrarSelecaoViagem(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const viagemOptions = `
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'SENAI')">SENAI</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'SESI')">SESI</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'Regis')">Regis</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'Rodolpho')">Rodolpho</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'Anatole')">Anatole</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'AREA MEIO')">AREA MEIO</div>
    `;
    statusSelecao.innerHTML = viagemOptions;
}
window.mostrarSelecaoViagem = mostrarSelecaoViagem;

function mostrarVeiculosViagem(nome, dia, linha, cliente) {
    const statusSelecao = document.getElementById('status-selecao');
    const veiculos = [
        'Corolla QAD9618', 'Corolla RWC4D25', 'Corolla REW2E59', 'Corolla REW0H84',
        'Corolla OON5341', 'Hilux QAE8744', 'Hilux C.Mad. QAE9273', 'SW4 ROBSON SMA7I11',
        'Ranger RODOLPHO SLZ5G02', 'Ranger SERGIO SLZ5G06', 'Ranger 1° CROSARA SLZ5G03',
        'Ranger 2° CROSARA SLZ5F99', 'Ranger REGIS SLZ5G10', 'Compass RWE3G73',
        'Ranger Branca CROSARA RWB2G50', 'Ranger Branca GABINETE RWB2G51',
        'Yaris CPL REZ0D67', 'Yaris CPL RWB9D26', 'Etios CPL QAP2028', 'Agrale QAH8438',
        'Munk Iveco RWI5B17', 'AXOR QAO4215', 'Express DRC 4x2 SLX8B62',
        'Expert Furgão RWB3D79', 'Caminhão Baú Senai HSI6390', 'Trailer Odontológico',
    ];
    let veiculoOptions = '<div class="veiculo-grid">';
    veiculos.forEach(veiculo => {
        veiculoOptions += `<div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', '${veiculo}')">${veiculo}</div>`;
    });
    veiculoOptions += '</div>';
    statusSelecao.innerHTML = veiculoOptions;
}
window.mostrarVeiculosViagem = mostrarVeiculosViagem;

async function finalizarViagem(nome, cliente, veiculo, dia, linha) {
    const cidade = document.getElementById('cidade-destino').value;
    const observacao = document.getElementById('observacao-texto').value;
    const data = { cliente, veiculo, cidade, observacao };
    await adicionarStatus(nome, 'Em Viagem', 'yellow', dia, linha, data);
}
window.finalizarViagem = finalizarViagem;


// --- PONTO DE MUDANÇA: NOVA LÓGICA DO CALENDÁRIO ---

/**
 * FUNÇÃO MODIFICADA
 * Abre o pop-up com a seleção de período, agora com validação no campo da cidade.
 */
function adicionarVeiculo(nome, dia, linha, cliente, veiculo) {
    selecoesDeViagemMultiSemana = {}; // Reseta seleções anteriores
    const statusSelecao = document.getElementById('status-selecao');

    // Cria a nova interface dentro do pop-up com as alterações de validação
    const cidadeInput = `
        <div class="cidade-input" style="text-align: left; width: 100%;">
            <label style="font-weight: bold; display: block; margin-bottom: 5px;">Cidade Destino:</label>
            <input 
                type="text" 
                id="cidade-destino-viagem" 
                oninput="toggleConfirmarViagemButton()" 
                placeholder="Ex: Dourados" 
                style="width: 100%; box-sizing: border-box; padding: 8px; margin-bottom: 10px;"
            >

            <label style="font-weight: bold; display: block; margin-bottom: 5px;">Observações:</label>
            <textarea id="observacao-texto-viagem" placeholder="Digite as observações..." rows="4" style="width: 100%; box-sizing: border-box; padding: 8px; margin-bottom: 15px;"></textarea>

            <div class="action-buttons-container" style="display: flex; justify-content: space-between; margin-top: 15px;">
                <button class="sair-button" style="background-color: #007bff;" onclick="mostrarCalendario()">Selecionar Período</button>
                <button 
                    id="confirmar-viagem-multi" 
                    class="sair-button" 
                    style="background-color: #28a745;" 
                    onclick="finalizarPeriodoViagem('${nome}', '${cliente}', '${veiculo}')" 
                    disabled
                >CONFIRMAR</button>
            </div>
        </div>
    `;

    statusSelecao.innerHTML = cidadeInput;
}
window.adicionarVeiculo = adicionarVeiculo;

// NOVA: Processa e salva os dados para todos os dias selecionados no calendário.
async function finalizarPeriodoViagem(motorista, cliente, veiculo) {
    if (Object.keys(selecoesDeViagemMultiSemana).length === 0) {
        alert("Nenhum dia foi selecionado no calendário.");
        return;
    }
    const cidade = document.getElementById('cidade-destino-viagem').value;
    const observacao = document.getElementById('observacao-texto-viagem').value;

    // --- Referências aos elementos do Loader ---
    const loadingDiv = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');
    
    // --- Prepara e exibe o Loader ---
    loadingMessage.textContent = "Salvando viagem...";
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    progressStatus.textContent = '';
    loadingDiv.style.display = 'flex';

    // --- Lógica de Progresso ---
    let totalOperacoes = Object.values(selecoesDeViagemMultiSemana).reduce((acc, curr) => acc + curr.length, 0);
    let operacoesConcluidas = 0;

    for (const semanaKey in selecoesDeViagemMultiSemana) {
        const semanaIdx = parseInt(semanaKey.split('_')[1]);
        for (const diaIndex of selecoesDeViagemMultiSemana[semanaKey]) {
            const statusData = {
                status: 'Em Viagem',
                data: { cidade, observacao, cliente, veiculo }
            };
            await atualizarStatusFirestore(motorista, semanaIdx, diaIndex, statusData);
            
            // --- Atualiza o progresso a cada dia salvo ---
            operacoesConcluidas++;
            const percentual = Math.round((operacoesConcluidas / totalOperacoes) * 100);
            progressBar.style.width = percentual + '%';
            progressBar.textContent = percentual + '%';
            progressStatus.textContent = `Processando dia ${operacoesConcluidas} de ${totalOperacoes}...`;
        }
    }
    
    console.log("Viagem de múltiplos dias salva com sucesso.");
    loadingMessage.textContent = "Concluído!";
    
    // Aguarda um instante para o usuário ver a conclusão antes de fechar
    setTimeout(async () => {
        loadingDiv.style.display = 'none';
        fecharSelecaoStatus();
        await carregarMotoristas(); // Atualiza a visualização
    }, 500);
}
window.finalizarPeriodoViagem = finalizarPeriodoViagem;


// --- FUNÇÕES DO CALENDÁRIO (NOVAS) ---

async function getSemanas() {
    if (semanasCacheadas.length > 0) return semanasCacheadas;
    const dataAtual = new Date();
    const diaDaSemana = dataAtual.getDay();
    const offset = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
    const segunda = new Date(dataAtual);
    segunda.setDate(dataAtual.getDate() + offset);
    const inicioRef = new Date(segunda);
    inicioRef.setDate(segunda.getDate() - 7 * 4);
    for (let i = 0; i <= totalWeeks; i++) {
        const inicioSemana = new Date(inicioRef);
        inicioSemana.setDate(inicioRef.getDate() + (i * 7));
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        semanasCacheadas.push({ inicio: inicioSemana, fim: fimSemana });
    }
    return semanasCacheadas;
}

function getFormattedDate(date) {
    const dia = (`0${date.getDate()}`).slice(-2);
    const mes = (`0${date.getMonth() + 1}`).slice(-2);
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

/**
 * FUNÇÃO CORRIGIDA
 * Mostra o calendário e desabilita as datas fora do período total de semanas.
 */
async function mostrarCalendario() {
    const calendar = document.getElementById('calendario');
    const calendarHeader = document.getElementById('header-data');
    const weekdaysDiv = document.getElementById('calendarWeekdays');
    const daysDiv = document.getElementById('calendarDays');
    weekdaysDiv.innerHTML = '';
    daysDiv.innerHTML = '';
    calendar.style.display = 'block';

    const semanas = await getSemanas();
    if (currentWeekIndex < 0 || currentWeekIndex >= semanas.length) return;

    // Determina o intervalo de datas válido (do início da semana 0 ao fim da última semana)
    const dataInicioValida = semanas[0].inicio;
    const dataFimValida = semanas[totalWeeks].fim; // totalWeeks é sua variável global

    const { inicio } = semanas[currentWeekIndex];
    calendarHeader.textContent = `De ${getFormattedDate(semanas[currentWeekIndex].inicio)} a ${getFormattedDate(semanas[currentWeekIndex].fim)}`;
    ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].forEach(d => weekdaysDiv.innerHTML += `<div>${d}</div>`);
    const diasSelecionados = selecoesDeViagemMultiSemana[`semana_${currentWeekIndex}`] || [];

    for (let i = 0; i < 7; i++) {
        const dataDia = new Date(inicio);
        dataDia.setDate(inicio.getDate() + i);
        const dayElement = document.createElement('div');
        dayElement.textContent = dataDia.getDate();
        dayElement.classList.add('calendar-day');
        dayElement.dataset.dayIndex = i;

        // --- LÓGICA DE VALIDAÇÃO DA DATA ---
        if (dataDia < dataInicioValida || dataDia > dataFimValida) {
            dayElement.classList.add('disabled'); // Adiciona a classe para desabilitar
        } else {
            // Adiciona o evento de clique apenas para dias válidos
            if (diasSelecionados.includes(i)) {
                dayElement.classList.add('selected');
            }
            dayElement.onclick = () => {
                const weekKey = `semana_${currentWeekIndex}`;
                if (!selecoesDeViagemMultiSemana[weekKey]) selecoesDeViagemMultiSemana[weekKey] = [];
                const dayIdx = parseInt(dayElement.dataset.dayIndex);
                const selectionIndex = selecoesDeViagemMultiSemana[weekKey].indexOf(dayIdx);

                if (selectionIndex === -1) {
                    selecoesDeViagemMultiSemana[weekKey].push(dayIdx);
                    dayElement.classList.add('selected');
                } else {
                    selecoesDeViagemMultiSemana[weekKey].splice(selectionIndex, 1);
                    dayElement.classList.remove('selected');
                }
            };
        }
        daysDiv.appendChild(dayElement);
    }
}
window.mostrarCalendario = mostrarCalendario;

function navegarSemana(direcao) {
    if (currentWeekIndex + direcao >= 0 && currentWeekIndex + direcao <= totalWeeks) {
        currentWeekIndex += direcao;
        mostrarCalendario();
    }
}
window.navegarSemana = navegarSemana;

function fecharCalendario() {
    document.getElementById('calendario').style.display = 'none';
}
window.fecharCalendario = fecharCalendario;

// --- FUNÇÕES UTILITÁRIAS E DE INICIALIZAÇÃO ---

/**
 * NOVA FUNÇÃO UNIFICADA
 * Fecha TODOS os pop-ups abertos (status, histórico) e o overlay.
 * Também garante que o calendário seja fechado junto.
 */
function fecharTodosPopups() {
    // Esconde todos os elementos de pop-up
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('historico-popup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    
    // Chama a função para fechar o calendário, caso ele esteja aberto
    fecharCalendario();
}
// Mantemos as chamadas antigas por compatibilidade, agora elas usam a nova função.
window.fecharPopup = fecharTodosPopups;
window.fecharSelecaoStatus = fecharTodosPopups;

async function consultarObservacao(idMotorista, dia) {
    const motoristaRef = doc(db, 'motoristas', idMotorista);
    const motoristaSnapshot = await getDoc(motoristaRef);
    if (motoristaSnapshot.exists()) {
        const dados = motoristaSnapshot.data();
        const statusData = dados[`semana${currentWeekIndex}`]?.[dia]?.data || {};
        const { observacao = "", cidade = "", cliente = "", veiculo = "" } = statusData;
        const detalhesDiv = document.createElement('div');
        detalhesDiv.innerHTML = `
            <div>
                <label style="font-size: 2em; font-weight: bold;">Observações:</label><br>
                <textarea id="observacao-editar" rows="4" maxlength="700" style="width: 523px; height: 218px; font-size: 14px;">${observacao}</textarea><br><br>
                <label style="font-size: 2em; font-weight: bold;">Cidade:</label><br>
                <input type="text" id="cidade-editar" value="${cidade}" placeholder="Cidade"><br><br>
                <label style="font-size: 2em; font-weight: bold;">Cliente:</label><br>
                <input type="text" id="cliente-editar" value="${cliente}" placeholder="Cliente"><br><br>
                <label style="font-size: 2em; font-weight: bold;">Veículo:</label><br>
                <input type="text" id="veiculo-editar" value="${veiculo}" placeholder="Veículo"><br><br>
                <button id="editar-observacao" style="background-color: green; color: white; font-size: 2em; padding: 10px 20px;" onclick="editarObservacao('${idMotorista}', ${dia})">EDITAR</button>
            </div>
        `;
        document.getElementById('status-selecao').innerHTML = detalhesDiv.innerHTML;
        document.getElementById('overlay').style.display = 'flex';
        document.getElementById('status-selecao').style.display = 'flex';
    } else {
        alert("Motorista não encontrado.");
    }
}
window.consultarObservacao = consultarObservacao;



async function editarObservacao(idMotorista, dia) {
    const motoristaRef = doc(db, 'motoristas', idMotorista);
    const dadosAnteriores = await getDoc(motoristaRef).then(snapshot => snapshot.data()[`semana${currentWeekIndex}`][dia]);
    const data = {
        ...dadosAnteriores.data,
        observacao: document.getElementById('observacao-editar').value,
        cidade: document.getElementById('cidade-editar').value,
        cliente: document.getElementById('cliente-editar').value,
        veiculo: document.getElementById('veiculo-editar').value,
    };
    await setDoc(motoristaRef, {
        [`semana${currentWeekIndex}`]: { [dia]: { status: dadosAnteriores.status, data: data } }
    }, { merge: true });
    alert("Dados atualizados com sucesso!");
    fecharSelecaoStatus();
    await carregarMotoristas();
}
window.editarObservacao = editarObservacao;

function toggleConfirmButton() {
    const cidadeInput = document.getElementById('cidade-destino');
    if (cidadeInput) {
       document.getElementById('confirmar-viagem').disabled = cidadeInput.value.trim() === '';
    }
}
window.toggleConfirmButton = toggleConfirmButton;

window.logout = function () {
    console.log("Logout do usuário:", loggedInUser);
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
};

window.confirmarResetarStatus = function () {
    if (confirm("Tem certeza que deseja resetar o status de todos os motoristas?")) {
        resetarStatusTodosMotoristas();
    }
};

// --- FUNÇÕES DE CONTROLE DE POP-UP (NOVAS) ---
function mostrarPopup(popupId) {
    document.getElementById(popupId).style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}
window.mostrarPopup = mostrarPopup;



async function resetarStatusTodosMotoristas() {
    // --- Referências aos elementos do Loader ---
    const loadingDiv = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');

    try {
        // --- Prepara e exibe o Loader ---
        loadingMessage.textContent = "Resetando status...";
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        progressStatus.textContent = '';
        loadingDiv.style.display = 'flex';
        
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        const totalMotoristas = motoristasSnapshot.docs.length;
        let motoristasProcessados = 0;

        const statusReset = { status: 'DR (Por Demanda)', data: null };
        
        // Processa um motorista de cada vez para permitir a atualização da UI
        for (const doc of motoristasSnapshot.docs) {
            const batch = writeBatch(db);
            for (let semana = 0; semana <= totalWeeks; semana++) {
                let semanaUpdate = {};
                for (let dia = 0; dia < 7; dia++) {
                    semanaUpdate[dia] = statusReset;
                }
                batch.set(doc.ref, { [`semana${semana}`]: semanaUpdate }, { merge: true });
            }
            await batch.commit(); // Salva o lote para o motorista atual
            
            // --- Atualiza o progresso a cada motorista resetado ---
            motoristasProcessados++;
            const percentual = Math.round((motoristasProcessados / totalMotoristas) * 100);
            progressBar.style.width = percentual + '%';
            progressBar.textContent = percentual + '%';
            progressStatus.textContent = `Resetando motorista ${motoristasProcessados} de ${totalMotoristas}...`;
        }

        console.log("Status de todos os motoristas resetados com sucesso.");
        loadingMessage.textContent = "Concluído!";

        setTimeout(async () => {
            loadingDiv.style.display = 'none';
            await carregarMotoristas();
        }, 500);

    } catch (error) {
        console.error("Erro ao resetar status:", error);
        alert("Ocorreu um erro ao resetar o status dos motoristas.");
        loadingDiv.style.display = 'none';
    }
}
window.resetarStatusTodosMotoristas = resetarStatusTodosMotoristas;


// Inicializa o sistema ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    verificarAutenticacao();
    console.log("DOM totalmente carregado. Inicializando motoristas...");
    await verificarSemanaPassada();

    document.getElementById('overlay').addEventListener('click', fecharTodosPopups);

    document.getElementById('seta-esquerda').addEventListener('click', () => {
        if (currentWeekIndex > 0) {
            currentWeekIndex--;
            carregarMotoristas().catch(console.error);
        }
    });
    document.getElementById('seta-direita').addEventListener('click', () => {
        if (currentWeekIndex < totalWeeks) {
            currentWeekIndex++;
            carregarMotoristas().catch(console.error);
        }
    });


// --- FUNÇÕES DE EXPORTAÇÃO PARA CSV (NOVAS) ---

/**
 * Função principal que coleta os dados e inicia a geração do CSV.
 */
async function exportHistoryToCSV() {
    const startDateInput = document.getElementById('start-date').value;
    const endDateInput = document.getElementById('end-date').value;

    if (!startDateInput || !endDateInput) {
        alert("Por favor, selecione as datas de início e fim para gerar o histórico.");
        return;
    }

    // Adiciona a hora para garantir que o período completo seja considerado
    const startDate = new Date(startDateInput + 'T00:00:00');
    const endDate = new Date(endDateInput + 'T23:59:59');

    if (startDate > endDate) {
        alert("A data de início não pode ser posterior à data de fim.");
        return;
    }

    document.getElementById('loading').style.display = 'flex';

    try {
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        const historyRecords = [];
        const semanas = await getSemanas(); // Reutiliza a função que calcula as datas das semanas

        // Itera sobre cada documento de motorista
        for (const motoristaDoc of motoristasSnapshot.docs) {
            const motoristaNome = motoristaDoc.id;
            const motoristaDados = motoristaDoc.data();

            // Itera sobre todas as semanas possíveis (0 a 6)
            for (let semanaIdx = 0; semanaIdx < semanas.length; semanaIdx++) {
                const semanaDados = motoristaDados[`semana${semanaIdx}`];

                if (semanaDados) {
                    // Itera sobre cada dia da semana (0 a 6)
                    for (let diaIdx = 0; diaIdx < 7; diaIdx++) {
                        const diaDados = semanaDados[diaIdx];

                        // Considera um registro válido se o status NÃO for "DR (Por Demanda)"
                        if (diaDados && diaDados.status && diaDados.status !== 'DR (Por Demanda)') {
                            // Calcula a data exata deste registro
                            const inicioSemana = semanas[semanaIdx].inicio;
                            const dataDoAtendimento = new Date(inicioSemana);
                            dataDoAtendimento.setDate(inicioSemana.getDate() + diaIdx);

                            // Verifica se o registro está dentro do período selecionado
                            if (dataDoAtendimento >= startDate && dataDoAtendimento <= endDate) {
                                const record = {
                                    Data: getFormattedDate(dataDoAtendimento),
                                    Motorista: motoristaNome,
                                    Status: diaDados.status,
                                    Cliente: diaDados.data?.cliente || '',
                                    Veiculo: diaDados.data?.veiculo || '',
                                    Cidade: diaDados.data?.cidade || '',
                                    Observacao: diaDados.data?.observacao || ''
                                };
                                historyRecords.push(record);
                            }
                        }
                    }
                }
            }
        }

        document.getElementById('loading').style.display = 'none';

        if (historyRecords.length === 0) {
            alert("Nenhum atendimento encontrado para o período selecionado.");
            return;
        }

        // Ordena os registros por data antes de gerar o CSV
        historyRecords.sort((a, b) => new Date(a.Data.split('/').reverse().join('-')) - new Date(b.Data.split('/').reverse().join('-')));
        
        generateAndDownloadCSV(historyRecords);

    } catch (error) {
        console.error("Erro ao gerar o histórico:", error);
        alert("Ocorreu um erro ao gerar o histórico. Verifique o console para mais detalhes.");
        document.getElementById('loading').style.display = 'none';
    }
}

/**
 * Função auxiliar que formata os dados e dispara o download do arquivo CSV.
 */
function generateAndDownloadCSV(records) {
    const headers = ["Data", "Motorista", "Status", "Cliente", "Veiculo", "Cidade", "Observacao"];
    
    // Função para garantir que o texto com vírgulas ou aspas não quebre o CSV
    const escapeCSV = (str) => {
        if (str === null || str === undefined) return '';
        let result = String(str).replace(/"/g, '""'); // Escapa aspas duplas
        if (result.includes(',') || result.includes('"') || result.includes('\n')) {
            result = `"${result}"`; // Envolve com aspas duplas
        }
        return result;
    };

    // Monta o conteúdo do CSV
    let csvContent = headers.join(',') + '\r\n';
    records.forEach(record => {
        const row = headers.map(header => escapeCSV(record[header]));
        csvContent += row.join(',') + '\r\n';
    });

    // Cria um "Blob" (Binary Large Object) e simula o clique em um link para baixar
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF para compatibilidade com Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_atendimentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Adicione esta linha para conectar o botão de download à função
document.getElementById('download-csv-btn').addEventListener('click', exportHistoryToCSV);
    
});
