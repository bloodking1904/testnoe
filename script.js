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
    document.getElementById('selecao-status').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

// Mostra a seleção de atendimento
function mostrarSelecaoAtendimento(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const atendimentoOptions = `
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', '5º Andar', 'red', ${dia}, ${linha})">5º Andar</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Eremita', 'red', ${dia}, ${linha})">Eremita</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Laisa', 'red', ${dia}, ${linha})">Laisa</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Czarina', 'red', ${dia}, ${linha})">Czarina</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Regis', 'red', ${dia}, ${linha})">Regis</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Rodolpho', 'red', ${dia}, ${linha})">Rodolpho</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Robson', 'red', ${dia}, ${linha})">Robson</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Crosara', 'red', ${dia}, ${linha})">Crosara</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Presidente', 'red', ${dia}, ${linha})">Presidente</div>
    `;

    statusSelecao.innerHTML = atendimentoOptions;
    document.getElementById('selecao-status').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

// Adiciona o status selecionado à célula correspondente
function adicionarStatus(nome, status, cor, dia, linha) {
    fecharSelecaoStatus();

    // Acessa a célula correta do motorista usando data attributes
    const celula = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"]`);

    if (!celula) {
        console.error('Célula não encontrada para o motorista:', nome);
        return;
    }

    const motoristaDiv = celula.querySelector('.motorista');

    // Atualiza o status na célula correta
    let statusDiv = motoristaDiv.querySelector('.status');
    if (statusDiv) {
        statusDiv.remove();
    }

    // Adiciona o novo status à célula
    motoristaDiv.insertAdjacentHTML('beforeend', `
        <div class="status" style="color: ${cor}; font-weight: bold;">${status}</div>
    `);

    // Atualiza o status do motorista apenas para o dia específico
    atualizarStatusLocalStorage(nome, dia, status); // Atualiza o status no localStorage
}

// Atualiza visualmente o status no painel
function atualizarStatusVisual(nome) {
    const motoristaDivs = document.querySelectorAll('.motorista');
    motoristaDivs.forEach(motoristaDiv => {
        const motoristaNome = motoristaDiv.querySelector('span').textContent.toLowerCase();
        const motoristaStatus = JSON.parse(localStorage.getItem('motoristaStatus')) || {};
        const dias = ['0', '1', '2', '3', '4', '5', '6']; // Representa os dias da semana

        if (motoristaNome === nome.toLowerCase()) {
            dias.forEach(dia => {
                const statusAtual = motoristaStatus[motoristaNome] ? motoristaStatus[motoristaNome][dia] : 'Disponível';
                const celulaDia = motoristaDiv.closest('.celula').getAttribute('data-dia');
                if (celulaDia == dia) {
                    const statusDiv = motoristaDiv.querySelector('.status');
                    if (statusDiv) {
                        statusDiv.textContent = statusAtual;
                        statusDiv.style.color = statusAtual === 'Disponível' ? 'green' : 'red'; // Altera a cor do status
                    }
                }
            });
        }
    });
}

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

// Função para fechar a seleção de status
function fecharSelecaoStatus() {
    document.getElementById('selecao-status').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}
