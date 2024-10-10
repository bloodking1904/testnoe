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

// Função para renderizar motoristas
function renderizarMotoristas(motoristasSnapshot) {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const tabela = document.getElementById('tabela-motoristas');
    
    // Limpa a tabela antes de adicionar novos motoristas
    tabela.innerHTML = '';

    // Criação do cabeçalho
    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');

    // Adiciona cabeçalho para os dias da semana
    dias.forEach(dia => {
        cabecalho.innerHTML += `<div class="celula">${dia.toUpperCase()}</div>`;
    });
    tabela.appendChild(cabecalho);

    // Renderiza motoristas
    motoristasSnapshot.forEach(doc => {
        if (doc.exists()) {
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
        }
    });
}

// Atualizações em tempo real
onSnapshot(collection(db, 'motoristas'), (snapshot) => {
    renderizarMotoristas(snapshot);
});

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

// Função para mostrar seleção de status
function mostrarSelecaoStatus(motorista, diaIndex) {
    // Aqui você pode implementar a lógica para mostrar as opções de status
    console.log(`Mostrar seleção de status para: ${motorista} no dia ${diaIndex}`);
}

// Chama a função após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a tabela de motoristas uma vez
    getDocs(collection(db, 'motoristas')).then(renderizarMotoristas);
});
