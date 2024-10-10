// Importando Firebase e Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

    // Renderiza cada motorista uma única vez
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

// Atualizações em tempo real
onSnapshot(collection(db, 'motoristas'), (snapshot) => {
    const tabela = document.getElementById('tabela-motoristas');
    tabela.innerHTML = ''; // Limpa a tabela antes de adicionar novos motoristas

    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');

    // Adiciona cabeçalho para os dias da semana
    dias.forEach(dia => {
        cabecalho.innerHTML += `<div class="celula">${dia.toUpperCase()}</div>`;
    });
    tabela.appendChild(cabecalho);

    snapshot.forEach(doc => {
        // Verifica se o documento existe
        if (doc.exists()) {
            const motorista = doc.id; // Nome do motorista
            const linha = document.createElement('div');
            linha.classList.add('linha');

            dias.forEach((dia, diaIndex) => {
                const celula = document.createElement('div');
                celula.classList.add('celula');
                const motoristaData = doc.data();

                // Verifica se há dados para o dia
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
        } else {
            console.warn(`Documento ${doc.id} não existe.`); // Log se o documento não existe
        }
    });
});

// Chama a função após o carregamento do DOM
document.addEventListener('DOMContentLoaded', inicializarMotoristas);

// Função de logout
function logout() {
    localStorage.removeItem('loggedInUser'); // Remove o usuário logado
    window.location.href = 'login.html'; // Redireciona para a página de login
}

// Função para limpar cache
function limparCache() {
    localStorage.clear(); // Limpa o cache do localStorage
    alert('Cache limpo!'); // Mensagem de confirmação
}
