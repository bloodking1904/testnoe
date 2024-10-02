const motoristas = [
    'Reginaldo',
    'Gevanildo',
    'Jaderson',
    'Leandro',
    'Paulo',
    'Ronaldo'
];

let diaAtual;
let linhaAtual;
let motoristasSelecionados = [];
const loggedInUser = localStorage.getItem('loggedInUser');

// Atualiza a lista de motoristas disponíveis
function atualizarListaSelecionados() {
    const listaSelecionados = document.getElementById('motorista-selecao');
    listaSelecionados.innerHTML = '';

    motoristas.forEach(motorista => {
        if (!motoristasSelecionados.includes(motorista)) {
            const motoristaDiv = document.createElement('div');
            motoristaDiv.classList.add('motorista');
            motoristaDiv.textContent = motorista;
            motoristaDiv.style.fontWeight = 'bold';

            motoristaDiv.onclick = () => {
                if (loggedInUser === 'admin' || loggedInUser === motorista.toLowerCase()) {
                    adicionarMotorista(motorista);
                } else {
                    alert('Você só pode alterar suas próprias informações.');
                }
            };

            listaSelecionados.appendChild(motoristaDiv);
        }
    });
}

// Função de logout
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

// Mostra a seleção de motoristas
function mostrarSelecao(dia, linha) {
    diaAtual = dia;
    linhaAtual = linha;
    atualizarListaSelecionados();
    document.getElementById('selecao-motorista').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

// Fecha a seleção de motoristas
function fecharSelecao() {
    document.getElementById('selecao-motorista').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Fecha a seleção de status
function fecharSelecaoStatus() {
    document.getElementById('selecao-status').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Adiciona o motorista selecionado à célula correspondente
function adicionarMotorista(nome, salvar = true) {
    const celula = document.querySelector(`.linha:nth-child(${linhaAtual + 2}) .celula:nth-child(${getDiaIndex(diaAtual) + 1})`);

    if (celula.querySelector('.motorista')) {
        alert('Este campo já está ocupado por um motorista.');
        return;
    }

    motoristasSelecionados.push(nome);

    celula.innerHTML = `
        <div class="motorista">
            <button class="adicionar" onclick="mostrarSelecaoStatus('${nome}', this)">+</button>
            <span style="font-weight: bold;">${nome}</span>
            <button class="remover" onclick="removerMotorista('${nome}', this)">X</button>
        </div>
    `;

    motoristas.splice(motoristas.indexOf(nome), 1);
    atualizarListaSelecionados();
    fecharSelecao();

    if (salvar) {
        salvarMotoristasSelecionados();
       fecharSelecao();
    }
      fecharSelecao();
}

// Remove o motorista e o retorna à lista
function removerMotorista(nome, btn) {
    if (loggedInUser !== 'admin' && loggedInUser !== nome.toLowerCase()) {
        alert('Você só pode remover suas próprias informações.');
        return;
    }

    const celula = btn.parentElement.parentElement;
    celula.innerHTML = '';

    motoristasSelecionados = motoristasSelecionados.filter(m => m !== nome);
    motoristas.push(nome);

    fecharSelecao();
    salvarMotoristasSelecionados();
}

// Mostra a seleção de status
function mostrarSelecaoStatus(nome, btn) {
    if (loggedInUser !== 'admin' && loggedInUser !== nome.toLowerCase()) {
        alert('Você só pode alterar seu próprio status.');
        return;
    }

    fecharSelecao();

    const statusSelecao = document.getElementById('status-selecao');
    statusSelecao.innerHTML = `
        <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Disponível', 'green')">Disponível</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarSelecaoAtendimento('${nome}', this)">Em Atendimento</div>
        <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Em Viagem', 'yellow')">Viagem</div>
    `;
    document.getElementById('selecao-status').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

// Adiciona o status selecionado à célula correspondente
function adicionarStatus(nome, status, cor) {
    fecharSelecaoStatus();

    const celula = document.querySelector(`.linha:nth-child(${linhaAtual + 2}) .celula:nth-child(${getDiaIndex(diaAtual) + 1}) .motorista`);
    const statusDiv = celula.querySelector('.status');

    if (statusDiv) {
        statusDiv.remove();
      fecharSelecao();
    }
     
    celula.insertAdjacentHTML('beforeend', `
        <div class="status" style="color: ${cor}; font-weight: bold;">${status}</div>
    `);
    fecharSelecao();
}

// Mostra a seleção de atendimento
function mostrarSelecaoAtendimento(nome, btn) {
    const statusSelecao = document.getElementById('status-selecao');
    statusSelecao.innerHTML = `
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', '5° Andar', 'red')">5° Andar</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Eremita', 'red')">Eremita</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Laisa', 'red')">Laisa</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Czarina', 'red')">Czarina</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Regis', 'red')">Regis</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Rodolpho', 'red')">Rodolpho</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Robson', 'red')">Robson</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Crosara', 'red')">Crosara</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarStatus('${nome}', 'Presidente', 'red')">Presidente</div>
    `;
    document.getElementById('selecao-status').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

// Retorna o índice do dia
function getDiaIndex(dia) {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias.indexOf(dia);
}

// Inicializa a lista de motoristas
atualizarListaSelecionados();
