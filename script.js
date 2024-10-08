const motoristas = [
    { nome: 'Gevanildo', status: 'Disponível' },
    { nome: 'Jaderson', status: 'Disponível' },
    { nome: 'Leandro', status: 'Disponível' },
    { nome: 'Paulo', status: 'Disponível' },
    { nome: 'Reginaldo', status: 'Disponível' },
    { nome: 'Ronaldo', status: 'Disponível' }
];

const loggedInUser = localStorage.getItem('loggedInUser');

// Função de logout
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

// Função para atualizar o status no localStorage
function atualizarStatusLocalStorage(nome, dia, status) {
    const motoristaStatus = JSON.parse(localStorage.getItem('motoristaStatus')) || {};
    if (!motoristaStatus[nome]) {
        motoristaStatus[nome] = {
            '0': 'Disponível', // Domingo
            '1': 'Disponível', // Segunda
            '2': 'Disponível', // Terça
            '3': 'Disponível', // Quarta
            '4': 'Disponível', // Quinta
            '5': 'Disponível', // Sexta
            '6': 'Disponível'  // Sábado
        };
    }
    motoristaStatus[nome][dia] = status; // Atualiza o status para o dia específico
    localStorage.setItem('motoristaStatus', JSON.stringify(motoristaStatus));
}

// Função para limpar cache
function limparCache() {
    localStorage.clear(); // Limpa todos os dados do localStorage
    alert('Cache e dados armazenados foram limpos.'); // Mensagem de confirmação
}

// Mostra a seleção de status
function mostrarSelecaoStatus(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    let statusOptions = `
        <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Disponível', 'green', ${dia}, ${linha})">Disponível</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarSelecaoAtendimento('${nome}', ${dia}, ${linha})">Em Atendimento</div>
    `;

    if (loggedInUser === 'admin') {
        statusOptions += `
            <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Em Viagem', 'yellow', ${dia}, ${linha})">Viagem</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Compensando', 'red', ${dia}, ${linha})">Compensando</div>
        `;
    }

    statusSelecao.innerHTML = statusOptions;
    statusSelecao.style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';

    // Centraliza a seleção de status na tela
    statusSelecao.scrollIntoView({ behavior: 'smooth', block: 'center' });
    adicionarBotaoFechar();
}

// Adiciona o botão Fechar
function adicionarBotaoFechar() {
    const statusSelecao = document.getElementById('status-selecao');
    const fecharBotao = document.createElement('button');
    
    fecharBotao.innerText = 'Fechar';
    fecharBotao.onclick = fecharSelecaoStatus;
    fecharBotao.style.marginTop = '10px';
    fecharBotao.style.padding = '10px 20px';
    fecharBotao.style.backgroundColor = '#dc3545'; // Cor do botão fechar
    fecharBotao.style.color = 'white';
    fecharBotao.style.border = 'none';
    fecharBotao.style.borderRadius = '5px';
    fecharBotao.style.cursor = 'pointer';
    
    statusSelecao.appendChild(fecharBotao);
}

// Modifique a função para fechar a seleção de status
function fecharSelecaoStatus() {
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Adiciona o retângulo de fundo
const overlay = document.createElement('div');
overlay.id = 'overlay';
overlay.className = 'overlay';
overlay.style.display = 'none';
overlay.style.position = 'fixed';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
overlay.style.zIndex = '999'; // Coloca o overlay acima de outros elementos
document.body.appendChild(overlay);

// Inicializa a lista de motoristas
function inicializarMotoristas() {
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
        motoristas.forEach((motorista, linhaIndex) => {
            const linha = document.createElement('div');
            linha.classList.add('linha');
            linha.setAttribute('data-linha', linhaIndex); 

            dias.forEach((dia, diaIndex) => {
                const celula = document.createElement('div');
                celula.classList.add('celula');
                celula.setAttribute('data-dia', diaIndex); 

                const motoristaStatus = JSON.parse(localStorage.getItem('motoristaStatus')) || {};
                const statusAtual = motoristaStatus[motorista.nome] ? motoristaStatus[motorista.nome][diaIndex] : motorista.status;

                celula.innerHTML = `
                    <div class="motorista">
                        <button class="adicionar" onclick="mostrarSelecaoStatus('${motorista.nome}', ${diaIndex}, ${linhaIndex})">+</button>
                        <span style="font-weight: bold;">${motorista.nome.charAt(0).toUpperCase() + motorista.nome.slice(1)}</span>
                        <div class="status" style="color: ${statusAtual === 'Disponível' ? 'green' : 'red'}; font-weight: bold;">${statusAtual}</div>
                    </div>
                `;
                linha.appendChild(celula);
            });
            tabela.appendChild(linha);
        });
    } else {
        // Apenas o motorista logado é exibido
        const motorista = motoristas.find(m => m.nome.toLowerCase() === loggedInUser.toLowerCase());
        const linha = document.createElement('div');
        linha.classList.add('linha');
        linha.setAttribute('data-linha', '0');

        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.setAttribute('data-dia', diaAtual); 

        const motoristaStatus = JSON.parse(localStorage.getItem('motoristaStatus')) || {};
        const statusAtual = motoristaStatus[motorista.nome] ? motoristaStatus[motorista.nome][diaAtual] : motorista.status;

        celula.innerHTML = `
            <div class="motorista">
                <button class="adicionar" onclick="mostrarSelecaoStatus('${loggedInUser}', ${diaAtual}, 0)">+</button>
                <span style="font-weight: bold;">${motorista.nome.charAt(0).toUpperCase() + motorista.nome.slice(1)}</span>
                <div class="status" style="color: ${statusAtual === 'Disponível' ? 'green' : 'red'}; font-weight: bold;">${statusAtual}</div>
            </div>
        `;
        linha.appendChild(celula);
        tabela.appendChild(linha);
    }
}

document.addEventListener('DOMContentLoaded', inicializarMotoristas);
