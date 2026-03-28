// --- SERVIÇO DE AUTENTICAÇÃO E BANCO DE DADOS JSON ---
const AuthService = {
    // Gera um hash SHA-256 para a senha (Segurança Complexa)
    async hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Obtém todos os usuários do "Banco JSON"
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    },

    // Salva um novo usuário automaticamente no JSON
    async registerUser(userData) {
        const users = this.getUsers();
        if (users.some(u => u.email === userData.email)) {
            throw new Error('E-mail já cadastrado.');
        }

        // Protege a senha antes de salvar no JSON
        userData.password = await this.hashPassword(userData.password);
        
        // Fallback para UUID caso não esteja em contexto seguro (HTTPS/Localhost)
        userData.id = crypto.randomUUID();
        
        userData.createdAt = new Date().toISOString();
        userData.projects = []; // Inicializa a lista de projetos vazia
        
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        return userData;
    },

    // Atualiza os dados de um usuário existente (ex: novos projetos, pontos)
    updateUser(updatedUserData) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.email === updatedUserData.email);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedUserData };
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(users[index]));
        }
    },

    // Valida login contra o JSON
    async validateLogin(email, password) {
        const users = this.getUsers();
        const hashedPassword = await this.hashPassword(password);
        return users.find(u => u.email === email && u.password === hashedPassword);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const userNavContainer = document.getElementById('user-nav-container');
    if (!userNavContainer) {
        console.error("O contêiner do menu de usuário '#user-nav-container' não foi encontrado. A autenticação não pode ser renderizada.");
        return;
    }

    let currentUser = null;
    try {
        const storedUser = localStorage.getItem('currentUser');
        currentUser = storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        console.error("Erro ao processar dados do usuário. Limpando localStorage.", e);
        localStorage.removeItem('currentUser');
    }

    // Função para renderizar o estado de login/logout
    function renderUserState() {
        userNavContainer.innerHTML = ''; // Limpa o conteúdo anterior

        if (currentUser && currentUser.name) {
            // --- USUÁRIO LOGADO ---
            const userInitial = currentUser.name.charAt(0).toUpperCase();
            const userIcon = document.createElement('div');
            userIcon.className = 'user-icon';
            userIcon.textContent = userInitial;
            userIcon.title = `Logado como ${currentUser.name}`;
            // Estilos para transformar o ícone do usuário em um círculo de perfil
            userIcon.style.width = '40px'; // Tamanho do círculo
            userIcon.style.height = '40px'; // Tamanho do círculo
            userIcon.style.borderRadius = '50%'; // Torna-o circular
            userIcon.style.backgroundColor = '#007bff'; // Cor de fundo padrão (pode ser ajustada)
            userIcon.style.color = '#fff'; // Cor do texto (inicial)
            userIcon.style.display = 'flex';
            userIcon.style.justifyContent = 'center';
            userIcon.style.alignItems = 'center';
            userIcon.style.fontWeight = 'bold';
            userIcon.style.cursor = 'pointer'; // Indica que é clicável
            userIcon.style.fontSize = '1.2em'; // Tamanho da fonte para a inicial
            userIcon.style.flexShrink = '0';

            userNavContainer.append(userIcon);

            userIcon.addEventListener('click', () => {
                window.location.href = 'minha-conta.html';
            });
        } else {
            // --- USUÁRIO DESLOGADO ---
            const loginButton = document.createElement('button');
            loginButton.className = 'login-btn-main';
            loginButton.textContent = 'Entrar';

            // Estilos para o botão "Entrar"
            loginButton.style.backgroundColor = 'transparent';
            loginButton.style.color = '#fff';
            loginButton.style.border = '2px solid #ffc107'; // Borda amarela
            loginButton.style.padding = '8px 16px';
            loginButton.style.borderRadius = '8px';
            loginButton.style.fontWeight = '600';
            loginButton.style.cursor = 'pointer';
            loginButton.style.transition = 'all 0.3s ease';

            userNavContainer.appendChild(loginButton);

            loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'login.html'; // Redireciona para a página de login
            });
        }
    }

    // Renderiza o estado inicial ao carregar a página
    renderUserState();
});