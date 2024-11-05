// Importando Firebase e Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

// Definição das variáveis globais
let currentWeekIndex = 1; // Índice da semana atual (0-5)
const totalWeeks = 6; // Total de semanas

// Função para carregar motoristas
async function carregarMotoristas() {
    const tabela = document.getElementById('tabela-motoristas');
    tabela.innerHTML = ''; // Limpa a tabela antes de adicionar motoristas

    const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
    console.log("Motoristas obtidos do Firestore:", motoristasSnapshot.docs.length); // Log para depuração
    motoristasSnapshot.docs.forEach(doc => {
        const motorista = doc.id; 
        const dados = doc.data();
        atualizarTabela(motorista, dados);
    });
}

// Adiciona a função de logout ao objeto global window
window.logout = function () {
    console.log("Logout do usuário:", loggedInUser);
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
};

// Inicializa os motoristas ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM totalmente carregado. Inicializando motoristas...");
    carregarMotoristas().catch(console.error); // Chamada assíncrona
});

// Função para atualizar a tabela
function atualizarTabela(motorista, dados) {
    const tabela = document.getElementById('tabela-motoristas');
    const linha = document.createElement('div');
    linha.classList.add('linha');
    linha.dataset.linha = motorista;

    // Acessa a semana atual
    const semanaAtual = dados[`semana${currentWeekIndex}`];

    if (!semanaAtual) {
        console.warn(`Dados da semana ${currentWeekIndex} não encontrados para o motorista ${motorista}.`);
        return; // Sai da função se semanaAtual não estiver definido
    }

    for (let dia = 0; dia < 7; dia++) {
        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.dataset.dia = dia;

        const statusAtual = semanaAtual[dia] || { status: 'Disponível', data: null };

        celula.innerHTML = `
            <div class="motorista">
                <button class="adicionar" data-id-motorista="${motorista}" data-dia="${dia}" data-linha="${motorista}"
                    onclick="mostrarSelecaoStatus(this)">+</button>
                <span style="font-weight: bold;">${motorista}</span>
                <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'Disponível' ? 'green' : 'red')}; border: 1px solid black; font-weight: bold;">
                    ${statusAtual.status}
                </div>
            </div>
        `;

        linha.appendChild(celula);
    }

    tabela.appendChild(linha);
}

// Função para navegar para a semana anterior
async function semanaAnterior() {
    if (currentWeekIndex > 1) {
        currentWeekIndex--;
    }
    await carregarMotoristas();
}

// Função para navegar para a próxima semana
async function proximaSemana() {
    if (currentWeekIndex < totalWeeks) {
        currentWeekIndex++;
    }
    await carregarMotoristas();
}

// Eventos de clique nas setas
document.getElementById('seta-esquerda').addEventListener('click', semanaAnterior);
document.getElementById('seta-direita').addEventListener('click', proximaSemana);

// Inicializa os motoristas ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarMotoristas().catch(console.error);
});

// Função para atualizar o status no Firestore
async function atualizarStatusFirestore(idMotorista, dia, status, data) {
    try {
        console.log(`Atualizando status do motorista: ${idMotorista}, Dia: ${dia}, Status: ${status}`);
        const motoristaRef = doc(db, 'motoristas', idMotorista);

        // Atualizar o status no campo apropriado, respeitando a estrutura existente
        await setDoc(motoristaRef, {
            [`semana${currentWeekIndex}.${dia}`]: {
                status: status,
                data: data || null // Garante que data não seja undefined
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
            for (let dia = 0; dia < 7; dia++) {
                batch.set(motoristaRef, {
                    [`semana${currentWeekIndex}.${dia}`]: { 
                        status: 'Disponível', 
                        data: null 
                    }
                }, { merge: true });
            }
        });

        await batch.commit(); // Executa todas as operações em um único lote
        alert("Status de todos os motoristas foi resetado para 'Disponível'.");
        console.log("Status de todos os motoristas resetados com sucesso.");

        // Chama a função para atualizar visualmente os motoristas
        await carregarMotoristas(); // Atualiza a tabela de motoristas
    } catch (error) {
        console.error("Erro ao resetar status:", error);
        alert("Ocorreu um erro ao resetar o status dos motoristas.");
    }
}

// Adiciona a função ao objeto global window
window.resetarStatusTodosMotoristas = resetarStatusTodosMotoristas;

// Função para adicionar o status selecionado à célula correspondente
async function adicionarStatus(idMotorista, status, cor, dia, linha, data) {
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
        ${data && data.cliente && data.veiculo ? `
            <div><strong>Cliente:</strong> ${data.cliente}</div>
            <div><strong>Veículo:</strong> ${data.veiculo}</div>
        ` : ''}
    `;

    await atualizarStatusFirestore(idMotorista, dia, status, data);
    console.log("Status adicionado com sucesso.");
}

window.adicionarStatus = adicionarStatus;

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

    // Verifica o status do motorista antes de abrir a seleção
    const motoristaRef = doc(db, 'motoristas', idMotorista);
    getDoc(motoristaRef).then((motoristaSnapshot) => {
        const dados = motoristaSnapshot.data();
        const statusAtual = dados[`semana${currentWeekIndex}`][dia] ? dados[`semana${currentWeekIndex}`][dia].status : 'Disponível'; // Obtém o status atual para o dia específico

        // Verifica se o usuário logado é um motorista e se o status é "Em Viagem"
        if (loggedInUser !== 'ADMIN' && statusAtual === 'Em Viagem') {
            alert("Agenda Bloqueada pelo Administrador."); // Mensagem de alerta
            return; // Interrompe a execução da função
        }

        const statusSelecao = document.getElementById('status-selecao');
        let statusOptions = `
            <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" 
                onclick="adicionarStatus('${idMotorista}', 'Disponível', 'green', ${dia}, '${linha}')">Disponível</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
                onclick="mostrarSelecaoAtendimento('${idMotorista}', ${dia}, '${linha}')">Em Atendimento</div>
        `;

        // Apenas admins podem ver as opções de viagem e compensando
        if (loggedInUser === 'ADMIN') {
            statusOptions += `
                <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" 
                    onclick="mostrarSelecaoViagem('${idMotorista}', ${dia}, '${linha}')">Viagem</div>
                <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
                    onclick="adicionarStatus('${idMotorista}', 'Compensando', 'red', ${dia}, '${linha}')">Compensando</div>
            `;
        }

        statusSelecao.innerHTML = statusOptions;

        // Exibir o overlay e a caixa de seleção
        document.getElementById('overlay').style.display = 'flex';
        document.getElementById('status-selecao').style.display = 'flex';

        console.log("Opções de status exibidas.");
    }).catch(error => {
        console.error("Erro ao obter o status do motorista:", error);
    });
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoStatus = mostrarSelecaoStatus;

// Mostra a seleção de atendimento
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
    `;

    statusSelecao.innerHTML = atendimentoOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoAtendimento = mostrarSelecaoAtendimento;

// Função para mostrar a seleção de secretarias
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
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoSecretarias = mostrarSelecaoSecretarias;

// Função para mostrar a seleção de veículos para atendimento
function mostrarVeiculosParaAtendimento(nome, cliente, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const veiculos = [
        'Corolla QAD9618',
        'Corolla RWC4D25',
        'Corolla REW2E59',
        'Corolla REW0H84',
        'Corolla OON5341',
        'Etios QAP2028',
        'Hilux QAE8744',
        'Hilux SW4 SMA7I11',
        'Hilux C.Mad. QAE9273',
        'Ranger Preta SLZ5G02',
        'Ranger Preta SLZ5F99',
        'Ranger Preta SLZ5G06',
        'Ranger Preta SLZ5G03',
        'Ranger Preta SLZ5G10',
        'Compass RWE3G73',
        'Ranger Branca RWB2G50',
        'Ranger Branca RWB2G51',
        'Yaris REZ0D67',
        'Yaris RWB9D26',
        'Agrale QAH8438',
        'Munk Iveco RWI5B17',
        'AXOR QAO4215',
    ];

    let veiculoOptions = '<div class="veiculo-grid">'; // Inicia a grid
    veiculos.forEach(veiculo => {
        veiculoOptions += `
            <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" 
                onclick="finalizarAtendimento('${nome}', '${cliente}', '${veiculo}', ${dia}, '${linha}')">${veiculo}</div>
        `;
    });
    veiculoOptions += '</div>'; // Fecha a grid

    statusSelecao.innerHTML = veiculoOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarVeiculosParaAtendimento = mostrarVeiculosParaAtendimento;

// Função para finalizar a viagem
function finalizarViagem(nome, cliente, veiculo, dia, linha, cidade) {
    // Prepara o data para incluir todas as informações necessárias
    const data = {
        cliente: cliente,
        veiculo: veiculo,
        cidade: cidade // Agora inclui a cidade
    };

    // Atualiza o status no Firestore
    adicionarStatus(nome, 'Em Viagem', 'yellow', dia, linha, data); // Passa o objeto data

    // Atualiza visualmente o motorista
    const motoristaDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .motorista`);

    if (motoristaDiv) {
        motoristaDiv.innerHTML = `
            <button class="adicionar" data-id-motorista="${nome}" data-dia="${dia}" data-linha="${linha}" 
                onclick="mostrarSelecaoStatus(this)" style="font-size: 1.5em; padding: 10px; background-color: green; color: white; border: none; border-radius: 5px; width: 40px; height: 40px;">+</button>
            <span style="font-weight: bold;">${nome}</span>
            <div class="status" style="color: yellow; border: 1px solid black; font-weight: bold;">Em Viagem</div>
            <div><strong>Veículo:</strong> ${veiculo}</div>
            <div><strong>Cliente:</strong> ${cliente}</div>
            <div><strong>Cidade:</strong> ${cidade}</div> <!-- Exibe cidade -->
        `;
    } else {
        console.error("Div do motorista não encontrada ao atualizar visualmente.");
    }

    fecharSelecaoStatus(); // Fecha todas as seleções 
}

// Adiciona a função finalizar viagem ao objeto global window
window.finalizarViagem = finalizarViagem;

// Função para finalizar o atendimento
function finalizarAtendimento(nome, cliente, veiculo, dia, linha) {
    // Prepara o data para incluir apenas as informações necessárias
    const data = {
        cliente: cliente,
        veiculo: veiculo
    };

    // Atualiza o status no Firestore
    adicionarStatus(nome, 'Em Atendimento', 'orange', dia, linha, data); // Passa o objeto data

    // Atualiza visualmente o motorista
    const motoristaDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .motorista`);

    if (motoristaDiv) {
        motoristaDiv.innerHTML = `
            <button class="adicionar" data-id-motorista="${nome}" data-dia="${dia}" data-linha="${linha}" 
                onclick="mostrarSelecaoStatus(this)" style="font-size: 1.5em; padding: 10px; background-color: green; color: white; border: none; border-radius: 5px; width: 40px; height: 40px;">+</button>
            <span style="font-weight: bold;">${nome}</span>
            <div class="status" style="color: orange; border: 1px solid black; font-weight: bold;">Em Atendimento</div>
            <div><strong>Veículo:</strong> ${veiculo}</div>
            <div><strong>Cliente:</strong> ${cliente}</div>
        `;
    } else {
        console.error("Div do motorista não encontrada ao atualizar visualmente.");
    }

    fecharSelecaoStatus(); // Fecha todas as seleções 
}

// Adiciona a função finalizar atendimento ao objeto global window
window.finalizarAtendimento = finalizarAtendimento;

// Função para mostrar a seleção de viagem
function mostrarSelecaoViagem(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const viagemOptions = `
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'SENAI DR')">SENAI DR</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'SESI DR')">SESI DR</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'Regis')">Regis</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'Rodolpho')">Rodolpho</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'Anatole')">Anatole</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'AREA MEIO')">AREA MEIO</div>
    `;

    statusSelecao.innerHTML = viagemOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoViagem = mostrarSelecaoViagem;

// Função para mostrar a seleção de veículos para viagem
function mostrarVeiculosViagem(nome, dia, linha, cliente) {
    const statusSelecao = document.getElementById('status-selecao');
    const veiculos = [
        'Corolla QAD9618',
        'Corolla RWC4D25',
        'Corolla REW2E59',
        'Corolla REW0H84',
        'Corolla OON5341',
        'Etios QAP2028',
        'Hilux QAE8744',
        'Hilux SW4 SMA7I11',
        'Hilux C.Mad. QAE9273',
        'Ranger Preta SLZ5G02',
        'Ranger Preta SLZ5F99',
        'Ranger Preta SLZ5G06',
        'Ranger Preta SLZ5G03',
        'Ranger Preta SLZ5G10',
        'Compass RWE3G73',
        'Ranger Branca RWB2G50',
        'Ranger Branca RWB2G51',
        'Yaris REZ0D67',
        'Yaris RWB9D26',
        'Agrale QAH8438',
        'Munk Iveco RWI5B17',
        'AXOR QAO4215',
    ];

    let veiculoOptions = '<div class="veiculo-grid">'; // Inicia a grid
    veiculos.forEach(veiculo => {
        veiculoOptions += `
            <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" 
                onclick="adicionarVeiculo('${nome}', ${dia}, '${linha}', '${cliente}', '${veiculo}')">${veiculo}</div>
        `;
    });
    veiculoOptions += '</div>'; // Fecha a grid

    statusSelecao.innerHTML = veiculoOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarVeiculosViagem = mostrarVeiculosViagem;

// Modificação na função para adicionar veículo e cidade
function adicionarVeiculo(nome, dia, linha, cliente, veiculo) {
    const statusSelecao = document.getElementById('status-selecao');

    const cidadeInput = `
        <div class="cidade-input">
            <label>Digite a cidade destino:</label>
            <input type="text" id="cidade-destino" placeholder="Cidade destino" oninput="toggleConfirmButton()">
            <button id="confirmar-viagem" style="background-color: green; color: white; white-space: break-word;" 
                onclick="finalizarViagem('${nome}', '${cliente}', '${veiculo}', ${dia}, '${linha}', document.getElementById('cidade-destino').value)" disabled>CONFIRMAR<br>VIAGEM</button>
        </div>
    `;

    statusSelecao.innerHTML = cidadeInput;

    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Função para habilitar ou desabilitar o botão de confirmar
function toggleConfirmButton() {
    const cidadeInput = document.getElementById('cidade-destino');
    const confirmarButton = document.getElementById('confirmar-viagem');
    confirmarButton.disabled = cidadeInput.value.trim() === ''; // Habilita o botão se o campo não estiver vazio
}

// Adiciona a função ao objeto global window
window.adicionarVeiculo = adicionarVeiculo;

// Adiciona a função ao objeto global window
window.toggleConfirmButton = toggleConfirmButton;

// Inicializa a lista de motoristas
async function inicializarMotoristas() {
    console.log("Inicializando motoristas...");
    const dias = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO']; // Dias da semana em letras maiúsculas
    const tabela = document.getElementById('tabela-motoristas');

    tabela.innerHTML = ''; // Limpa a tabela antes de adicionar motoristas

    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');

    // Adiciona cabeçalho para todos os dias da semana
    dias.forEach((dia, index) => {
        const celula = document.createElement('div');
        celula.classList.add('celula');
        const dataAtual = new Date();
        dataAtual.setDate(dataAtual.getDate() + (index - dataAtual.getDay() + 1)); // Ajusta para o dia correto
        const dataFormatada = (`0${dataAtual.getDate()}`).slice(-2) + '/' + (`0${dataAtual.getMonth() + 1}`).slice(-2) + '/' + dataAtual.getFullYear(); // Formato DD/MM/AAAA
        celula.innerHTML = `${dia}<br>${dataFormatada}`; // Adiciona o nome do dia e a data
        cabecalho.appendChild(celula);
    });

    tabela.appendChild(cabecalho);
    console.log("Cabeçalho da tabela criado.");

    // Se o usuário logado for admin, exibe todos os motoristas
    if (loggedInUser === 'ADMIN') {
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        console.log("Motoristas obtidos do Firestore.");

        motoristasSnapshot.docs.forEach(doc => {
            const motorista = doc.id; 
            const dados = doc.data();

            console.log("Motorista:", motorista, "Dados:", dados);

            const linha = document.createElement('div');
            linha.classList.add('linha');
            linha.dataset.linha = motorista;

            dias.forEach((dia, diaIndex) => {
                const celula = document.createElement('div');
                celula.classList.add('celula');
                celula.dataset.dia = diaIndex;

                const statusAtual = dados[diaIndex] || { status: 'Disponível', data: null };

                celula.innerHTML = `
                    <div class="motorista">
                        <button class="adicionar" data-id-motorista="${motorista}" data-dia="${diaIndex}" data-linha="${motorista}"
                            onclick="mostrarSelecaoStatus(this)">+</button>
                        <span style="font-weight: bold;">${motorista}</span>
                        <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'Disponível' ? 'green' : 'red')}; border: 1px solid black; font-weight: bold;">
                            ${statusAtual.status}
                        </div>
                        ${statusAtual.data ? `
                            <div style="white-space: nowrap;"><strong>Cidade:</strong> ${statusAtual.data.cidade}</div>
                            <div style="white-space: break-word;"><strong>Veículo:</strong> ${statusAtual.data.veiculo}</div>
                            <div><strong>Cliente:</strong> ${statusAtual.data.cliente}</div>
                        ` : ''}
                    </div>
                `;

                linha.appendChild(celula);
            });

            tabela.appendChild(linha);
        });
    } else {
        // Para motoristas, exibe os dias da semana
        const motoristaRef = doc(db, 'motoristas', loggedInUser);
        const motoristaSnapshot = await getDoc(motoristaRef);
        const dados = motoristaSnapshot.data();

        const linha = document.createElement('div');
        linha.classList.add('linha');
        linha.dataset.linha = loggedInUser;

        dias.forEach((dia, diaIndex) => {
            const celula = document.createElement('div');
            celula.classList.add('celula');
            celula.dataset.dia = diaIndex;

            const statusAtual = dados[diaIndex] || { status: 'Disponível', data: null };

            celula.innerHTML = `
                <div class="motorista">
                    <button class="adicionar" data-id-motorista="${loggedInUser}" data-dia="${diaIndex}" data-linha="${loggedInUser}"
                        onclick="mostrarSelecaoStatus(this)">+</button>
                    <span style="font-weight: bold;">${loggedInUser}</span>
                    <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'Disponível' ? 'green' : 'red')}; border: 1px solid black; font-weight: bold;">
                        ${statusAtual.status}
                    </div>
                    ${statusAtual.data ? `
                        <div style="white-space: nowrap;"><strong>Cidade:</strong> ${statusAtual.data.cidade}</div>
                        <div style="white-space: break-word;"><strong>Veículo:</strong> ${statusAtual.data.veiculo}</div>
                        <div><strong>Cliente:</strong> ${statusAtual.data.cliente}</div>
                    ` : ''}
                </div>
            `;

            linha.appendChild(celula);
        });

        tabela.appendChild(linha);
    }

    console.log("Tabela de motoristas inicializada.");
    console.log("IDs das linhas na tabela:", [...tabela.children].map(l => l.getAttribute('data-linha')));
}

// Inicializa os motoristas ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM totalmente carregado. Inicializando motoristas...");
    carregarMotoristas().catch(console.error); // Chamada assíncrona
});

// Função para atualizar a linha de um motorista específico
function atualizarLinhaMotorista(motorista, dados) {
    console.log("Atualizando linha para motorista:", motorista);
    const tabela = document.getElementById('tabela-motoristas');
    const linha = Array.from(tabela.children).find(l => l.getAttribute('data-linha') === motorista);

    if (linha) {
        const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']; // Ordem dos dias alterada
        const diaAtual = (new Date().getDay() + 6) % 7; // Ajusta o dia atual para começar na segunda-feira

        const celula = linha.querySelector(`.celula[data-dia="${diaAtual}"]`);
        const statusAtual = dados[diaAtual] || { status: 'Disponível', data: null };

        if (celula) {
            celula.innerHTML = `
                <div class="motorista">
                    <button class="adicionar" data-id-motorista="${motorista}" data-dia="${diaAtual}" data-linha="${motorista}" 
                        onclick="mostrarSelecaoStatus(this)">+</button>
                    <span style="font-weight: bold;">${motorista}</span>
                    <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'Disponível' ? 'green' : 'red')}; border: 1px solid black; font-weight: bold;">
                        ${statusAtual.status}
                    </div>
                    ${statusAtual.data ? `<div style="white-space: nowrap;"><strong>Cidade:</strong> ${statusAtual.data.cidade}</div><div style="white-space: break-word;"><strong>Veículo:</strong> ${statusAtual.data.veiculo}</div><div><strong>Cliente:</strong> ${statusAtual.data.cliente}</div>` : ''}
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

// Fechar a seleção de status ao clicar fora da caixa
document.getElementById('overlay').addEventListener('click', function() {
    fecharSelecaoStatus();
});

// Função para fechar a seleção de status
function fecharSelecaoStatus() {
    console.log("Fechando seleção de status.");
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

window.fecharSelecaoStatus = fecharSelecaoStatus;
