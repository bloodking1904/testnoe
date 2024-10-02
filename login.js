const users = {
    admin: '1234',
    reginaldo: '1234',
    gevanildo: '1234',
    jaderson: '1234',
    leandro: '1234',
    paulo: '1234',
    ronaldo: '1234'
};

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.toLowerCase();
    const password = document.getElementById('password').value;

    if (users[username] && users[username] === password) {
        localStorage.setItem('loggedInUser', username);
        window.location.href = 'index.html';
    } else {
        alert('Usuário ou senha incorretos.');
    }
});
