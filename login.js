document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    
    if (!loginForm) {
        console.error("Formulário de login 'login-form' não encontrado.");
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = e.target.email.value;
        const password = e.target.password.value;

        if (errorMessage) {
            errorMessage.textContent = '';
        }

        // Lógica de login Admin e Equipe
        if ((email === 'adm@gamil.com' || email === 'adm@gmail.com') && password === '1234') {
            const adminUser = { name: 'Administrador', email: email, role: 'admin' };
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            window.location.href = 'admin.html';
            return;
        }

        // Lógica de login Suporte
        if (email === 'suporte@gmail.com' && password === '1234') {
            const supportUser = { name: 'Suporte Técnico', email: email, role: 'support' };
            localStorage.setItem('currentUser', JSON.stringify(supportUser));
            window.location.href = 'suporte.html';
            return;
        }
        
        // Busca usuário no JSON criptografado
        const user = await AuthService.validateLogin(email, password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'index.html'; // Redireciona para a página inicial
        } else {
            alert('E-mail ou senha incorretos.');
            if (errorMessage) {
                errorMessage.textContent = '';
            }
        }
    });
});