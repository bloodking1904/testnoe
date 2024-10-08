const users = {
    admin: '1234',
    reginaldo: '1234',
    gevanildo: '1234',
    jaderson: '1234',
    leandro: '1234',
    paulo: '1234',
    ronaldo: '1234'
};

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
            '0': 'Disponível',
            '1': 'Disponível',
            '2': 'Disponível',
            '3': 'Disponível',
            '4': 'Disponível',
            '5': 'Disponível',
            '6': 'Disponível'
        };
    }
    motoristaStatus[nome][dia] = status;
    localStorage.setItem('motoristaStatus', JSON.stringify(motoristaStatus));
}

// Função para limpar cache
function limparCache() {
    localStorage.clear();
    alert('Cache e dados armazenados foram limpos.');
}

// Mostra a seleção de status
function mostrarSelecaoStatus(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    statusSelecao.innerHTML = '';

    let statusOptions = `
        <div style="display: flex; flex-direction: column;">
            <div class="status" style="background-color: lightgreen; color: black; font-weight: bold; margin: 5px; padding: 10px; cursor: pointer;" onclick="atualizarStatusLocalStorage('${nome}', ${dia}, 'Disponível'); fecharSelecaoStatus();">Disponível</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold; margin: 5px; padding: 10px; cursor: pointer;" onclick="atualizarStatusLocalStorage('${nome}', ${dia}, 'Em Atendimento'); fecharSelecaoStatus();">Em Atendimento</div>
    `;

    if (loggedInUser === 'admin') {
        statusOptions += `
            <div class="status" style="background-color: lightyellow; color: black; font-weight: bold; margin: 5px; padding: 10px; cursor: pointer;" onclick="atualizarStatusLocalStorage('${nome}', ${dia}, 'Em Viagem'); fecharSelecaoStatus();">Em Viagem</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold; margin: 5px; padding: 10px; cursor: pointer;" onclick="atualizarStatusLocalStorage('${nome}', ${dia}, 'Compensando'); fecharSelecaoStatus();">Compensando</div>
        `;
    }

    statusOptions += '</div>';  // Fechar div do flex container

    statusSelecao.innerHTML = statusOptions;
    statusSelecao.style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
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
    fecharBotao.style.backgroundColor = '#dc3545';
    fecharBotao.style.color = 'white';
    fecharBotao.style.border = 'none';
    fecharBotao.style.borderRadius = '5px';
    fecharBotao.style.cursor = 'pointer';

    statusSelecao.appendChild(fecharBotao);
}

// Função para fechar a seleção de status
function fecharSelecaoStatus() {
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Inicializa a lista de motoristas
function inicializarMotoristas() {
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
