// Importando Firebase e Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, getDoc, writeBatch, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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
let selecoesDeViagemMultiSemana = {}; // NOVA: Armazena seleções do calendário multi-semana
let semanasCacheadas = []; // NOVA: Armazena os dados das semanas para evitar recálculo

console.log("Usuário logado:", loggedInUser);

// Redireciona acessos não autorizados
const urlsProtegidas = [
    'https://bloodking1904.github.io/testnoe/index.html', //
    'https://bloodking1904.github.io/testnoe/login.js', //
    'https://bloodking1904.github.io/testnoe/script.js', //
    'https://bloodking1904.github.io/testnoe/styles.css', //
];

// Verifica se a URL atual está nas URLs protegidas e se o usuário não está logado
if (urlsProtegidas.includes(window.location.href) && !loggedInUser) { //
    window.location.href = 'login.html'; //
}

// --- FUNÇÕES DE AUTENTICAÇÃO E CONFIGURAÇÃO INICIAL ---

function verificarAutenticacao() {
    console.log("Verificando autenticação...");
    const isAdmin = loggedInUser === 'ADMIN';

    if (!loggedInUser) {
        console.log("Usuário não está logado. Redirecionando para login.");
        window.location.href = 'login.html'; //
        return;
    }

    console.log(`Usuário logado: ${loggedInUser}`);

    if (isAdmin) {
        console.log("Usuário é admin. Atualizando conexão a cada 60 segundos.");
        setInterval(() => {
            console.log("Conexão do admin atualizada.");
        }, 60000); // 60 segundos
    } else {
        setTimeout(() => {
            alert("Sua sessão expirou. Faça login novamente.");
            localStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        }, 5 * 60 * 1000); // 5 minutos
    }
}

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

// --- FUNÇÕES DE CARREGAMENTO E ATUALIZAÇÃO DE DADOS ---

async function carregarMotoristas() {
    console.log("Chamando carregarMotoristas()...");
    const tabela = document.getElementById('tabela-motoristas');
    tabela.innerHTML = '';

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
        console.warn(`Dados da semana ${currentWeekIndex} não encontrados para o motorista ${motorista}.`);
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

async function escutarMotoristas() {
    if (loggedInUser === 'ADMIN') {
        const motoristasCollection = collection(db, 'motoristas');
        onSnapshot(motoristasCollection, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "modified") {
                    atualizarTabela(change.doc.id, change.doc.data());
                }
            });
        });
    } else {
        const motoristaRef = doc(db, 'motoristas', loggedInUser);
        onSnapshot(motoristaRef, (snapshot) => {
            if (snapshot.exists()) {
                atualizarTabela(loggedInUser, snapshot.data());
            }
        });
    }
}

async function atualizarDadosDasSemanas() {
    const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
    for (const doc of motoristasSnapshot.docs) {
        const motoristaRef = doc.ref;
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

// --- FUNÇÕES DE LÓGICA DE STATUS (NOVO FLUXO MULTI-SEMANA) ---

// MODIFICADA: Esta função agora inicia o fluxo de seleção de múltiplos dias.
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
    const linha = String(element.dataset.linha);
    // Para simplificar, o novo fluxo não verifica mais o status anterior aqui.
    // Apenas administradores podem usar esta função de qualquer maneira.
    if (loggedInUser === 'ADMIN') {
        adicionarViagem(idMotorista, linha);
    } else {
        alert("Apenas administradores podem alterar o status.");
    }
}
window.mostrarSelecaoStatus = mostrarSelecaoStatus;


// NOVA: Abre o pop-up de confirmação de dados da viagem/status.
function adicionarViagem(nome, linha) {
    selecoesDeViagemMultiSemana = {}; // Reseta a seleção
    const statusSelecao = document.getElementById('status-selecao');

    const confirmacaoHtml = `
        <div class="cidade-input">
            <label>Status a ser aplicado:</label>
            <select id="status-viagem-select" class="status-select" style="width: 100%; padding: 8px; margin-bottom: 10px;">
                <option value="Em Viagem">Em Viagem</option>
                <option value="Compensando">Compensando</option>
                <option value="DR (Por Demanda)">DR (Por Demanda)</option>
            </select>

            <label for="cidade-destino">Cidade destino:</label>
            <input type="text" id="cidade-destino" placeholder="Cidade destino" style="width: calc(100% - 16px); padding: 8px; margin-bottom: 10px;">
            
            <label for="veiculo-viagem">Veículo:</label>
            <input type="text" id="veiculo-viagem" placeholder="Veículo utilizado" style="width: calc(100% - 16px); padding: 8px; margin-bottom: 10px;">

            <label for="cliente-viagem">Cliente:</label>
            <input type="text" id="cliente-viagem" placeholder="Cliente atendido" style="width: calc(100% - 16px); padding: 8px; margin-bottom: 10px;">
            
            <label for="observacao-texto">Observações:</label>
            <textarea id="observacao-texto" placeholder="Digite suas observações..." rows="3" style="width: calc(100% - 16px); padding: 8px; margin-bottom: 10px;"></textarea>
            
            <div class="action-buttons-container" style="display: flex; justify-content: space-between; margin-top: 10px;">
                <button id="periodo-viagem" onclick="mostrarCalendario()">Selecionar Período</button>
                <button id="confirmar-viagem" onclick="finalizarPeriodoViagem('${nome}', '${linha}')">Confirmar</button>
            </div>
        </div>
    `;

    statusSelecao.innerHTML = confirmacaoHtml;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// NOVA: Processa e salva os dados para todos os dias selecionados.
async function finalizarPeriodoViagem(nome, linha) {
    if (Object.keys(selecoesDeViagemMultiSemana).length === 0) {
        alert("Nenhum dia selecionado.");
        return;
    }

    const statusSelecionado = document.getElementById('status-viagem-select').value;
    const cidade = document.getElementById('cidade-destino').value;
    const veiculo = document.getElementById('veiculo-viagem').value;
    const cliente = document.getElementById('cliente-viagem').value;
    const observacao = document.getElementById('observacao-texto').value;
    
    const loadingDiv = document.getElementById('loading');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');
    loadingDiv.style.display = 'flex';

    let totalOperacoes = 0;
    Object.values(selecoesDeViagemMultiSemana).forEach(dias => totalOperacoes += dias.length);
    let operacoesConcluidas = 0;

    for (const semanaKey in selecoesDeViagemMultiSemana) {
        const semanaIdx = parseInt(semanaKey.split('_')[1]);
        const diasNestaSemana = selecoesDeViagemMultiSemana[semanaKey];

        for (const diaIndex of diasNestaSemana) {
            const statusData = {
                status: statusSelecionado,
                data: { cidade: cidade, observacao: observacao, cliente: cliente, veiculo: veiculo }
            };
            
            await atualizarStatusFirestore(nome, semanaIdx, diaIndex, statusData);
            
            operacoesConcluidas++;
            const percentual = Math.round((operacoesConcluidas / totalOperacoes) * 100);
            progressBar.style.width = percentual + '%';
            progressBar.textContent = percentual + '%';
            progressStatus.textContent = `Atualizando ${operacoesConcluidas} de ${totalOperacoes}...`;
        }
    }

    loadingDiv.style.display = 'none';
    fecharSelecaoStatus();
    await carregarMotoristas();
}
window.finalizarPeriodoViagem = finalizarPeriodoViagem;


// MODIFICADA: Função de atualização do Firestore para aceitar o índice da semana.
async function atualizarStatusFirestore(idMotorista, semana, dia, statusData) {
    try {
        console.log(`Atualizando status do motorista: ${idMotorista}, Semana: ${semana}, Dia: ${dia}`);
        const motoristaRef = doc(db, 'motoristas', idMotorista);
        await setDoc(motoristaRef, {
            [`semana${semana}`]: {
                [dia]: statusData
            }
        }, { merge: true });
        console.log("Status atualizado com sucesso.");
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
    }
}


// --- FUNÇÕES DO CALENDÁRIO (NOVAS) ---

async function getSemanas() {
    if (semanasCacheadas.length > 0) {
        return semanasCacheadas;
    }
    const dataAtualSistema = new Date();
    const diaDaSemanaAtualSistema = dataAtualSistema.getDay();
    const offsetParaSegunda = diaDaSemanaAtualSistema === 0 ? -6 : 1 - diaDaSemanaAtualSistema;
    const segundaAtualParaCalculo = new Date(dataAtualSistema);
    segundaAtualParaCalculo.setDate(dataAtualSistema.getDate() + offsetParaSegunda);
    
    const dataInicioSemana0 = new Date(segundaAtualParaCalculo);
    dataInicioSemana0.setDate(segundaAtualParaCalculo.getDate() - 7 * 4);

    for (let i = 0; i <= totalWeeks; i++) {
        const dataInicioSemanaLoop = new Date(dataInicioSemana0);
        dataInicioSemanaLoop.setDate(dataInicioSemana0.getDate() + (i * 7));
        const dataFimSemanaLoop = new Date(dataInicioSemanaLoop);
        dataFimSemanaLoop.setDate(dataInicioSemanaLoop.getDate() + 6);
        semanasCacheadas.push({ inicio: dataInicioSemanaLoop, fim: dataFimSemanaLoop });
    }
    return semanasCacheadas;
}

function getFormattedDate(date) {
    const dia = (`0${date.getDate()}`).slice(-2);
    const mes = (`0${date.getMonth() + 1}`).slice(-2);
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

async function mostrarCalendario() {
    const calendar = document.getElementById('calendario');
    const calendarHeader = document.getElementById('header-data');
    const calendarWeekdaysDiv = document.getElementById('calendarWeekdays');
    const calendarDaysDiv = document.getElementById('calendarDays');

    calendarWeekdaysDiv.innerHTML = '';
    calendarDaysDiv.innerHTML = '';
    calendar.style.display = 'block';

    const semanas = await getSemanas();
    if (currentWeekIndex < 0 || currentWeekIndex >= semanas.length) return;

    const { inicio, fim } = semanas[currentWeekIndex];
    calendarHeader.textContent = `De ${getFormattedDate(inicio)} a ${getFormattedDate(fim)}`;

    ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].forEach(diaNome => {
        const dayNameElement = document.createElement('div');
        dayNameElement.textContent = diaNome;
        calendarWeekdaysDiv.appendChild(dayNameElement);
    });

    const diasSelecionadosNestaSemana = selecoesDeViagemMultiSemana[`semana_${currentWeekIndex}`] || [];

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(inicio);
        currentDate.setDate(inicio.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.textContent = currentDate.getDate();
        dayElement.classList.add('calendar-day');
        dayElement.dataset.dayIndex = i;
        dayElement.dataset.weekIndex = currentWeekIndex;

        if (diasSelecionadosNestaSemana.includes(i)) {
            dayElement.classList.add('selected');
        }

        dayElement.addEventListener('click', function() {
            const weekIdx = parseInt(this.dataset.weekIndex);
            const dayIdx = parseInt(this.dataset.dayIndex);
            const weekKey = `semana_${weekIdx}`;

            this.classList.toggle('selected');

            if (!selecoesDeViagemMultiSemana[weekKey]) {
                selecoesDeViagemMultiSemana[weekKey] = [];
            }

            const indexNaSelecao = selecoesDeViagemMultiSemana[weekKey].indexOf(dayIdx);

            if (this.classList.contains('selected')) {
                if (indexNaSelecao === -1) selecoesDeViagemMultiSemana[weekKey].push(dayIdx);
            } else {
                if (indexNaSelecao !== -1) selecoesDeViagemMultiSemana[weekKey].splice(indexNaSelecao, 1);
            }
            
            if (selecoesDeViagemMultiSemana[weekKey].length === 0) {
                delete selecoesDeViagemMultiSemana[weekKey];
            }
        });
        calendarDaysDiv.appendChild(dayElement);
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

// --- FUNÇÕES UTILITÁRIAS E DE LIMPEZA ---

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

async function resetarStatusTodosMotoristas() {
    try {
        document.getElementById('loading').style.display = 'flex';
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        const batch = writeBatch(db);
        motoristasSnapshot.docs.forEach(doc => {
            const motoristaRef = doc.ref;
            for (let semana = 0; semana <= totalWeeks; semana++) {
                for (let dia = 0; dia < 7; dia++) {
                    batch.set(motoristaRef, {
                        [`semana${semana}`]: {
                            [dia]: { status: 'DR (Por Demanda)', data: null }
                        }
                    }, { merge: true });
                }
            }
        });
        await batch.commit();
        document.getElementById('loading').style.display = 'none';
        console.log("Status de todos os motoristas resetados com sucesso.");
        await carregarMotoristas();
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        console.error("Erro ao resetar status:", error);
        alert("Ocorreu um erro ao resetar o status dos motoristas.");
    }
}

function fecharSelecaoStatus() {
    console.log("Fechando seleção de status.");
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    fecharCalendario(); // Garante que o calendário feche também
}
window.fecharSelecaoStatus = fecharSelecaoStatus;


// --- INICIALIZAÇÃO DA PÁGINA ---

document.addEventListener('DOMContentLoaded', async () => {
    verificarAutenticacao();
    console.log("DOM totalmente carregado. Inicializando motoristas...");
    await verificarSemanaPassada();

    document.getElementById('overlay').addEventListener('click', fecharSelecaoStatus);

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
});
