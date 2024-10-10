// Importando Firebase e Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

// Função para inicializar motoristas
async function inicializarMotoristas() {
    const diaAtual = new Date().getDay(); // Obtém o dia atual
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const tabela = document.getElementById('tabela-motoristas');

    // Limpa a tabela antes de adicionar motoristas
    tabela.innerHTML = '';

    // Criação do cabeçalho
    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');

    // Adiciona cabeçalho para os dias da semana
    dias.forEach(dia => {
        cabecalho.innerHTML += `<div class="celula">${dia.toUpperCase()}</div>`;
    });
    tabela.appendChild(cabecalho);

    // Lógica para adicionar motoristas
    const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
    motoristasSnapshot.forEach(doc => {
        const motorista = doc.id; // Nome do motorista
        const linha = document.createElement('div');
        linha.classList.add('linha');

        dias.forEach((dia, diaIndex) => {
            const celula = document.createElement('div');
            celula.classList.add('celula');
            const motoristaData = doc.data();
            const statusAtual = motoristaData[diaIndex] || { status: 'Disponível', viagemData: null };

            celula.innerHTML = `
                <div class="motorista">
                    <button class="adicionar" onclick="mostrarSelecaoStatus('${motorista}', ${diaIndex})">+</button>
                    <span style="font-weight: bold;">${motorista}</span>
                    <div class="status" style="color: ${statusAtual.status === 'Disponível' ? 'green' : 'red'}; font-weight: bold;">${statusAtual.status}</div>
                    ${statusAtual.viagemData ? `<div>Cidade: ${statusAtual.viagemData.cidade}</div><div>Veículo: ${statusAtual.viagemData.veiculo}</div><div>Cliente: ${statusAtual.viagemData.cliente}</div>` : ''}
                </div>
            `;
            linha.appendChild(celula);
        });
        tabela.appendChild(linha);
    });
}

// Função para atualizar status dos motoristas
async function atualizarStatusFirestore(nome, dia, status, viagemData) {
    const motoristaRef = doc(db, 'motoristas', nome);
    await setDoc(motoristaRef, {
        [dia]: { status, viagemData }
    }, { merge: true }); // Usar merge para não sobrescrever outros dados
}

// Função para mostrar opções de status
function mostrarSelecaoStatus(nome, dia) {
    const statusSelecao = document.getElementById('status-selecao');
    const statusOptions = `
        <div class="status" onclick="adicionarStatus('${nome}', 'Disponível', 'green', ${dia})">Disponível</div>
        <div class="status" onclick="adicionarStatus('${nome}', 'Em Atendimento', 'red', ${dia})">Em Atendimento</div>
        <div class="status" onclick="adicionarStatus('${nome}', 'Compensando', 'orange', ${dia})">Compensando</div>
        <div class="status" onclick="adicionarStatus('${nome}', 'Em Viagem', 'yellow', ${dia})">Em Viagem</div>
    `;
    
    statusSelecao.innerHTML = statusOptions;
    statusSelecao.style.display = 'flex';
}

// Função para adicionar status selecionado
async function adicionarStatus(nome, status, cor, dia) {
    const viagemData = null; // Aqui você pode adicionar lógica para capturar dados de viagem, se necessário
    await atualizarStatusFirestore(nome, dia, status, viagemData);
    fecharSelecaoStatus(); // Fecha a seleção de status
}

// Função para fechar a seleção de status
function fecharSelecaoStatus() {
    document.getElementById('status-selecao').style.display = 'none';
}

// Atualizações em tempo real
onSnapshot(collection(db, 'motoristas'), (snapshot) => {
    snapshot.docChanges().forEach(change => {
        if (change.type === "modified" || change.type === "added") {
            inicializarMotoristas(); // Atualiza a tabela quando há mudanças
        }
    });
});

// Chama a função após o carregamento do DOM
document.addEventListener('DOMContentLoaded', inicializarMotoristas);
