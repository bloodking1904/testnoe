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

// Definição das variáveis globais
let currentWeekIndex = 4; // Índice da semana atual (0-6)
const totalWeeks = 6; // Total de semanas

// Função para verificar se o usuário está autenticado
function verificarAutenticacao() {
    console.log("Verificando autenticação...");
    const isAdmin = loggedInUser === 'ADMIN';

    // Se não houver usuário logado, redireciona para a página de login
    if (!loggedInUser) {
        console.log("Usuário não está logado. Redirecionando para login.");
        window.location.href = 'login.html';
        return;
    }

    console.log(`Usuário logado: ${loggedInUser}`);

    // Configurações de tempo de sessão
    if (isAdmin) {
        console.log("Usuário é admin. Atualizando conexão a cada 60 segundos.");
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


// Função para carregar motoristas
async function carregarMotoristas() {
    console.log("Chamando carregarMotoristas()...");
    const tabela = document.getElementById('tabela-motoristas');
    tabela.innerHTML = ''; // Limpa a tabela antes de adicionar motoristas

    // Criar o cabeçalho da tabela
    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');

    // Definir os dias da semana começando de SEGUNDA
    const diasDaSemana = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];

    // Obter a data atual
    const dataAtual = new Date();

    // Calcular o início da semana atual (semana4)
    const diaDaSemanaAtual = dataAtual.getDay();
    const offset = diaDaSemanaAtual === 0 ? -6 : 1 - diaDaSemanaAtual; // Se domingo, ajusta para -6 para pegar a segunda
    const segundaAtual = new Date(dataAtual);
    segundaAtual.setDate(dataAtual.getDate() + offset); // Ajusta para a segunda-feira da semana atual

    // Calcular a data de início da semana com base no currentWeekIndex
    const dataInicioSemana = new Date(segundaAtual);
    dataInicioSemana.setDate(segundaAtual.getDate() + (currentWeekIndex - 4) * 7); // Ajusta para a semana correta

    // Adicionar cabeçalho com as datas
    diasDaSemana.forEach((dia, index) => {
        const celula = document.createElement('div');
        celula.classList.add('celula');

        // Calcular a data para o dia correto da semana
        const dataFormatada = new Date(dataInicioSemana);
        dataFormatada.setDate(dataInicioSemana.getDate() + index); // Adiciona o índice para cada dia
        const diaFormatado = (`0${dataFormatada.getDate()}`).slice(-2) + '/' + (`0${dataFormatada.getMonth() + 1}`).slice(-2) + '/' + dataFormatada.getFullYear(); // Formato DD/MM/AAAA

        celula.innerHTML = `${dia}<br>${diaFormatado}`; // Adiciona o nome do dia e a data
        cabecalho.appendChild(celula);
    });

    tabela.appendChild(cabecalho); // Adiciona o cabeçalho à tabela

    // Escutar as alterações nos motoristas
    await escutarMotoristas();


    // Se o usuário logado for admin, exibe todos os motoristas
    if (loggedInUser === 'ADMIN') {
        const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));
        console.log("Motoristas obtidos do Firestore:", motoristasSnapshot.docs.length); // Log para depuração

        motoristasSnapshot.docs.forEach(doc => {
            const motorista = doc.id; 
            const dados = doc.data();
            console.log("Motorista:", motorista, "Dados:", dados); // Log para depuração
            atualizarTabela(motorista, dados); // Atualiza a tabela com os dados dos motoristas
        });
    } else {
        // Para motoristas, exibe os dados apenas do motorista logado
        const motoristaRef = doc(db, 'motoristas', loggedInUser);
        const motoristaSnapshot = await getDoc(motoristaRef);
        if (motoristaSnapshot.exists()) {
            const dados = motoristaSnapshot.data();
            atualizarTabela(loggedInUser, dados); // Atualiza a tabela com os dados do motorista logado
        } else {
            console.warn("Motorista não encontrado no Firestore:", loggedInUser);
        }
    }
}

// Função para escutar as alterações nos motoristas
async function escutarMotoristas() {
    const motoristasCollection = collection(db, 'motoristas');
    onSnapshot(motoristasCollection, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "modified") {
                // Atualiza a tabela quando um motorista é modificado
                const motoristaId = change.doc.id;
                const dadosMotorista = change.doc.data();
                atualizarTabela(motoristaId, dadosMotorista);
            }
        });
    });
}

// Função para atualizar dados das semanas
async function atualizarDadosDasSemanas() {
    const motoristasSnapshot = await getDocs(collection(db, 'motoristas'));

    motoristasSnapshot.docs.forEach(async (doc) => {
        const motoristaRef = doc.ref;

        // Obter dados atuais para o motorista
        const dados = await getDoc(motoristaRef);
        const motoristaDados = dados.data();

        // Loop para transferir dados entre as semanas
        for (let i = 0; i < 6; i++) { // De 0 até 5
            // Limpar dados da semana atual
            await setDoc(motoristaRef, {
                [`semana${i}`]: {
                    0: { status: 'Disponível', data: null },
                    1: { status: 'Disponível', data: null },
                    2: { status: 'Disponível', data: null },
                    3: { status: 'Disponível', data: null },
                    4: { status: 'Disponível', data: null },
                    5: { status: 'Disponível', data: null },
                    6: { status: 'Disponível', data: null },
                }
            }, { merge: true });

            // Transferir dados da semana seguinte
            if (i < 5) { // Não transferir dados para a semana 6
                await setDoc(motoristaRef, {
                    [`semana${i}`]: motoristaDados[`semana${i + 1}`]
                }, { merge: true });
            }
        }

        // Para a semana 6, apenas limpar dados
        await setDoc(motoristaRef, {
            [`semana6`]: {
                0: { status: 'Disponível', data: null },
                1: { status: 'Disponível', data: null },
                2: { status: 'Disponível', data: null },
                3: { status: 'Disponível', data: null },
                4: { status: 'Disponível', data: null },
                5: { status: 'Disponível', data: null },
                6: { status: 'Disponível', data: null },
            }
        }, { merge: true });
    });
}

// Função para verificar se uma semana passou e mover os dados
async function verificarSemanaPassada() {
    const dataAtualFirestore = await obterDataAtual(); // Obtém a data atual do Firestore

    const dataAtual = new Date("2025-01-09T18:05:52.396Z"); // Data do sistema 

    // Determinar a última segunda-feira
    const diaDaSemanaAtual = (dataAtual.getDay() + 6) % 7; // Ajuste para que segunda-feira seja 0

    const diasParaSegunda = (diaDaSemanaAtual + 6) % 7; // Para ajustar para a última segunda-feira

    const ultimaSegunda = new Date(dataAtual); // Cria uma nova data com o valor da data atual

    if (diasParaSegunda !== 0) {
        ultimaSegunda.setDate(dataAtual.getDate() - diasParaSegunda); // Ajusta para a última segunda-feira
    }
    // Verifica se 7 dias se passaram desde a última atualização
    if (!dataAtualFirestore || new Date(dataAtualFirestore) < new Date(ultimaSegunda - 7 * 24 * 60 * 60 * 1000)) {
        await atualizarDadosDasSemanas(); // Chama a função para atualizar os dados das semanas
        console.log("Dados das semanas atualizados.");
        // Atualiza a data no Firestore
        await setDoc(doc(db, 'configuracoes', 'dataAtual'), { data: new Date().toISOString() });
        // Define a data atual no Firestore como a data formatada
    } else {
        console.log("A data do Firestore está atual. Nenhuma atualização necessária.");
    }
}

// Função para obter a data atual do Firestore
async function obterDataAtual() {
    const dataRef = doc(db, 'configuracoes', 'dataAtual'); // Referência ao documento que armazena a data
    const dataSnapshot = await getDoc(dataRef);

    if (dataSnapshot.exists()) {
        return dataSnapshot.data().data; // Retorna a data atual armazenada
    } else {
        // Se o documento não existir, cria um com a data atual
        const dataAtual = new Date().toISOString();
        await setDoc(dataRef, { data: dataAtual });
        return dataAtual;
    }
}

// Função para verificar e atualizar a data se necessário
async function verificarData() {
    const dataAtualFirestore = await obterDataAtual();
    const dataAtualLocal = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    if (dataAtualFirestore.split('T')[0] !== dataAtualLocal) {
        // Se a data do Firestore for diferente da data local, atualize o Firestore
        await setDoc(doc(db, 'configuracoes', 'dataAtual'), { data: new Date().toISOString() });
        console.log("Data atualizada no Firestore.");
    } else {
        console.log("Data do Firestore está atual.");
    }
}



// Adiciona a função de logout ao objeto global window
window.logout = function () {
    console.log("Logout do usuário:", loggedInUser);
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
};

// Função para atualizar a tabela
function atualizarTabela(motorista, dados) {
    const tabela = document.getElementById('tabela-motoristas');
    
    // Verifica se a linha já existe
    let linha = Array.from(tabela.children).find(l => l.dataset.linha === motorista);
    
    if (!linha) {
        // Se a linha não existir, cria uma nova
        linha = document.createElement('div');
        linha.classList.add('linha');
        linha.dataset.linha = motorista;
        tabela.appendChild(linha);
    } else {
        // Se a linha já existir, limpa o conteúdo
        linha.innerHTML = '';
    }

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


// Função para atualizar o status no Firestore
async function atualizarStatusFirestore(idMotorista, dia, statusData) {
    try {
        console.log(`Atualizando status do motorista: ${idMotorista}, Dia: ${dia}, Status: ${statusData.status}`);
        const motoristaRef = doc(db, 'motoristas', idMotorista);

        // Usar merge para atualizar o campo dentro do mapa existente
        await setDoc(motoristaRef, {
            [`semana${currentWeekIndex}`]: { 
                ...await getDoc(motoristaRef).then(snapshot => snapshot.data()[`semana${currentWeekIndex}`]), // Obtém os dados existentes
                [dia]: statusData // Atualiza o dia específico
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

            // Atualiza o status para 'Disponível' para cada semana (de 0 até totalWeeks)
            for (let semana = 0; semana <= totalWeeks; semana++) {
                for (let dia = 0; dia < 7; dia++) {
                    batch.set(motoristaRef, {
                        [`semana${semana}`]: {
                            [dia]: { 
                                status: 'Disponível', 
                                data: null 
                            }
                        }
                    }, { merge: true });
                }
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

    // Prepare data to be sent to Firestore
    const statusData = {
        status: status,
        data: data || null // Ensure data is not undefined
    };

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
            <div><strong>Cidade:</strong> ${data.cidade}</div>
        ` : ''}
    `;

    await atualizarStatusFirestore(idMotorista, dia, statusData); // Passa o objeto statusData
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
        statusSelecao.innerHTML = ''; // Limpa as opções anteriores

        // Criação das opções de status
        let statusOptions = ` 
            <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" 
                onclick="adicionarStatus('${idMotorista}', 'Disponível', 'green', ${dia}, '${linha}')">Disponível</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
                onclick="mostrarSelecaoAtendimento('${idMotorista}', ${dia}, '${linha}')">Em Atendimento</div>
        `;

        // Adiciona o botão "OBS. VIAGEM" se o status for "Em Viagem"
        if (statusAtual === 'Em Viagem') {
            statusOptions += ` 
                <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" 
                    onclick="consultarObservacao('${idMotorista}', ${dia})">OBS. VIAGEM</div>
            `;
        }

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

// Função para mostrar a seleção de atendimento
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
        'Hilux QAE8744',
        'Hilux C.Mad. QAE9273',
        'SW4 ROBSON SMA7I11',
        'Ranger RODOLPHO SLZ5G02',
        'Ranger SERGIO SLZ5G06',
        'Ranger 1° CROSARA SLZ5G03',
        'Ranger 2° CROSARA SLZ5F99',
        'Ranger REGIS SLZ5G10',
        'Compass RWE3G73',
        'Ranger Branca CROSARA RWB2G50',
        'Ranger Branca GABINETE RWB2G51',
        'Yaris CPL REZ0D67',
        'Yaris CPL RWB9D26',
        'Etios CPL QAP2028',
        'Agrale QAH8438',
        'Munk Iveco RWI5B17',
        'AXOR QAO4215',
        'Express DRC 4x2 SLX8B62',
        'Expert Furgão RWB3D79',
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

// Modificação da função para finalizar a viagem
async function finalizarViagem(nome, cliente, veiculo, dia, linha) {
    const cidade = document.getElementById('cidade-destino').value;
    const observacao = document.getElementById('observacao-texto').value; // Captura a observação

    // Prepara o dado para incluir todas as informações necessárias
    const data = {
        cliente: cliente,
        veiculo: veiculo,
        cidade: cidade, // Agora inclui a cidade
        observacao: observacao // Adiciona a observação
    };

    // Atualiza o status no Firestore
    await adicionarStatus(nome, 'Em Viagem', 'yellow', dia, linha, data); // Passa o objeto data

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
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'SENAI')">SENAI</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="mostrarVeiculosViagem('${nome}', ${dia}, '${linha}', 'SESI')">SESI</div>
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
        'Hilux QAE8744',
        'Hilux C.Mad. QAE9273',
        'SW4 ROBSON SMA7I11',
        'Ranger RODOLPHO SLZ5G02',
        'Ranger SERGIO SLZ5G06',
        'Ranger 1° CROSARA SLZ5G03',
        'Ranger 2° CROSARA SLZ5F99',
        'Ranger REGIS SLZ5G10',
        'Compass RWE3G73',
        'Ranger Branca CROSARA RWB2G50',
        'Ranger Branca GABINETE RWB2G51',
        'Yaris CPL REZ0D67',
        'Yaris CPL RWB9D26',
        'Etios CPL QAP2028',
        'Agrale QAH8438',
        'Munk Iveco RWI5B17',
        'AXOR QAO4215',
        'Express DRC 4x2 SLX8B62',
        'Expert Furgão RWB3D79',
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

// Função para adicionar o veículo e cidade
function adicionarVeiculo(nome, dia, linha, cliente, veiculo) {
    const statusSelecao = document.getElementById('status-selecao');

    const cidadeInput = ` 
        <div class="cidade-input">
            <label style="font-size: 2em; font-weight: bold;">Digite a cidade destino:</label><br>
            <input type="text" id="cidade-destino" placeholder="Cidade destino" oninput="toggleConfirmButton()"><br><br>
            <label style="font-size: 2em; font-weight: bold;">Observações:</label><br>
            <textarea id="observacao-texto" placeholder="Digite suas observações aqui..." maxlength="700" rows="3" 
                style="width: 523px; height: 218px; font-size: 14px;"></textarea><br><br>
            <button id="confirmar-viagem" style="background-color: green; color: white; font-size: 1.2em; padding: 8px 16px;" 
                onclick="finalizarViagem('${nome}', '${cliente}', '${veiculo}', ${dia}, '${linha}')" disabled>CONFIRMAR<br>VIAGEM</button>
        </div>
    `;

    statusSelecao.innerHTML = cidadeInput;

    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.adicionarVeiculo = adicionarVeiculo;

// Função para consultar a observação e permitir a edição de cidade, cliente e veículo
async function consultarObservacao(idMotorista, dia) {
    const motoristaRef = doc(db, 'motoristas', idMotorista);
    const motoristaSnapshot = await getDoc(motoristaRef);

    if (motoristaSnapshot.exists()) {
        const dados = motoristaSnapshot.data();
        const statusData = dados[`semana${currentWeekIndex}`]?.[dia]?.data || {}; // Captura os dados ou vazio se não existir

        // Captura os dados para a edição
        const observacao = statusData.observacao || ""; // Captura a observação ou vazio se não existir
        const cidade = statusData.cidade || ""; // Captura a cidade ou vazio se não existir
        const cliente = statusData.cliente || ""; // Captura o cliente ou vazio se não existir
        const veiculo = statusData.veiculo || ""; // Captura o veículo ou vazio se não existir

        const detalhesDiv = document.createElement('div');
        detalhesDiv.innerHTML = ` 
            <div>
                <label style="font-size: 2em; font-weight: bold;">Observações:</label><br>
                <textarea id="observacao-editar" rows="4" maxlength="700"
                style="width: 523px; height: 218px; font-size: 14px;">${observacao}</textarea><br><br>
                <label style="font-size: 2em; font-weight: bold;">Cidade:</label><br>
                <input type="text" id="cidade-editar" value="${cidade}" placeholder="Cidade"><br><br>
                <label style="font-size: 2em; font-weight: bold;">Cliente:</label><br>
                <input type="text" id="cliente-editar" value="${cliente}" placeholder="Cliente"><br><br>
                <label style="font-size: 2em; font-weight: bold;">Veículo:</label><br>
                <input type="text" id="veiculo-editar" value="${veiculo}" placeholder="Veículo"><br><br>
                <button id="editar-observacao" style="background-color: green; color: white; font-size: 2em; padding: 10px 20px;" 
                    onclick="editarObservacao('${idMotorista}', ${dia})">EDITAR</button>
            </div>
        `;
        
        document.getElementById('status-selecao').innerHTML = detalhesDiv.innerHTML;
        document.getElementById('overlay').style.display = 'flex';
        document.getElementById('status-selecao').style.display = 'flex';
    } else {
        console.error("Motorista não encontrado.");
        alert("Motorista não encontrado.");
    }
}

// Função para editar a observação, cidade, cliente e veículo
async function editarObservacao(idMotorista, dia) {
    const novaObservacao = document.getElementById('observacao-editar').value;
    const novaCidade = document.getElementById('cidade-editar').value;
    const novoCliente = document.getElementById('cliente-editar').value;
    const novoVeiculo = document.getElementById('veiculo-editar').value;

    const motoristaRef = doc(db, 'motoristas', idMotorista);
    
    // Atualiza os dados no Firestore
    await setDoc(motoristaRef, {
        [`semana${currentWeekIndex}`]: {
            [dia]: {
                ...await getDoc(motoristaRef).then(snapshot => snapshot.data()[`semana${currentWeekIndex}`][dia]), // Mantém os dados existentes
                data: {
                    observacao: novaObservacao, // Atualiza a observação
                    cidade: novaCidade, // Atualiza a cidade
                    cliente: novoCliente, // Atualiza o cliente
                    veiculo: novoVeiculo // Atualiza o veículo
                }
            }
        }
    }, { merge: true });

    alert("Dados atualizados com sucesso!");
    fecharSelecaoStatus(); // Fecha a seleção
}

// Adiciona a função ao objeto global window
window.consultarObservacao = consultarObservacao;
window.editarObservacao = editarObservacao;


// Função para habilitar ou desabilitar o botão de confirmar
function toggleConfirmButton() {
    const cidadeInput = document.getElementById('cidade-destino');
    const confirmarButton = document.getElementById('confirmar-viagem');
    confirmarButton.disabled = cidadeInput.value.trim() === ''; // Habilita o botão se o campo não estiver vazio
}



// Adiciona a função ao objeto global window
window.toggleConfirmButton = toggleConfirmButton;

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


// Inicializa o sistema ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM totalmente carregado. Inicializando motoristas...");
    await verificarData(); // Verifica e atualiza a data se necessário
    await verificarSemanaPassada(); // Chama a verificação de semana passada
    verificarAutenticacao(); // Chama a verificação de autenticação

    carregarMotoristas().catch(console.error); // Chamada assíncrona

    // Eventos para os botões de navegação
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
