// Configuração do Servidor
const API_URL = 'http://localhost:3000/api';

// Lista de problemas e respostas (FAQ Automática)
const faqData = [
    { q: "Problema com login", a: "Verifique se o email e senha estão corretos. Caso tenha esquecido sua senha, utilize a opção \"Esqueci minha senha\" para redefinir o acesso." },
    { q: "Pedido não chegou", a: "Pedidos podem levar até o prazo informado no momento da compra. Verifique o código de rastreio no seu email ou na área do usuário." },
    { q: "Pagamento recusado", a: "Verifique os dados do cartão, saldo disponível ou tente outro método de pagamento." },
    { q: "Não recebi confirmação por email", a: "Verifique sua caixa de spam ou lixo eletrônico. Caso não encontre, solicite o reenvio da confirmação." },
    { q: "Problema ao cadastrar conta", a: "Certifique-se de que todos os campos obrigatórios foram preenchidos corretamente e que o email não está em uso." },
    { q: "Site não está carregando corretamente", a: "Atualize a página, limpe o cache do navegador ou tente acessar por outro navegador." },
    { q: "Quero cancelar meu pedido", a: "O cancelamento pode ser solicitado na área \"Meus Pedidos\" dentro do prazo permitido." },
    { q: "Troca ou devolução de produto", a: "Acesse a área de pedidos e selecione a opção \"Solicitar troca ou devolução\" dentro do prazo de garantia." },
    { q: "Alterar endereço de entrega", a: "Endereços podem ser alterados apenas antes do envio do pedido na área do usuário." },
    { q: "Falar com atendente humano", a: "O suporte humano está disponível de Segunda a Sexta, das 08:00 às 18:00. Por favor, envie sua mensagem e um atendente falará com você em breve." }
];

// Inicialização na página de suporte
document.addEventListener('DOMContentLoaded', async () => {
    const chatInput = document.getElementById('chat-input');
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    const guestFields = document.getElementById('guest-fields');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && guestFields) guestFields.style.display = 'none';
    else if (guestFields) guestFields.style.display = 'flex';

    // Inicia o chat carregando histórico ou menu
    await initSupportChat();
    
    // Verifica novas mensagens a cada 5 segundos
    setInterval(loadMessages, 5000);
});

async function initSupportChat() {
    const hasMessages = await loadMessages();
    if (!hasMessages) {
        renderWelcomeMenu();
    }
}

// --- FUNÇÕES DE IDENTIFICAÇÃO ---

function getCurrentEmail() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.email) return user.email;
    const guestEmailField = document.getElementById('guest-email');
    return guestEmailField ? guestEmailField.value.trim() : "visitante_temp@saude.com";
}

function getCurrentName() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.name) return user.name;
    const guestNameField = document.getElementById('guest-name');
    return guestNameField ? guestNameField.value.trim() : "Visitante";
}

function renderWelcomeMenu() {
    const box = document.getElementById('chat-messages');
    if (!box) return;

    const menuText = "Olá! Como podemos te ajudar hoje? Clique em um dos problemas abaixo para ver a solução ou envie uma mensagem.";
    
    let html = `<div class="msg support">${menuText}</div>`;
    html += `<div class="faq-accordion">`;
    
    faqData.forEach((item, index) => {
        html += `
            <div class="faq-item">
                <button class="faq-question" onclick="window.toggleFaq(${index})">
                    ${item.q}
                    <span class="faq-icon">▼</span>
                </button>
                <div id="faq-answer-${index}" class="faq-answer">
                    ${item.a}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
}

window.toggleFaq = function(index) {
    const answer = document.getElementById(`faq-answer-${index}`);
    if (!answer) return;
    
    const icon = answer.previousElementSibling.querySelector('.faq-icon');
    const isOpen = answer.classList.contains('active');

    // Fecha outros abertos para manter a organização
    document.querySelectorAll('.faq-answer').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.faq-icon').forEach(el => el.style.transform = 'rotate(0deg)');

    if (!isOpen) {
        answer.classList.add('active');
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
};

async function loadMessages() {
    const email = getCurrentEmail();
    if (!email) return false;

    try {
        const response = await fetch(`${API_URL}/messages/${email}`);
        const messages = await response.json();
        renderMessages(messages);
        return messages.length > 0;
    } catch (err) { 
        return false; 
    }
}

function renderMessages(messages) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    if (messages.length === 0) return;

    const isShowingMenu = box.querySelector('.faq-accordion');

    const newHTML = messages.map(m => `
        <div class="msg ${m.sender === 'user' ? 'user' : 'support'}">
            <small style="display:block; font-size:0.7rem; opacity:0.8; margin-bottom:3px;">${m.sender === 'user' ? 'Você' : 'Atendimento'}</small>
            ${m.message.replace(/\n/g, '<br>')}
        </div>
    `).join('');

    if (isShowingMenu || box.dataset.lastCount != messages.length) {
        box.innerHTML = newHTML;
        box.dataset.lastCount = messages.length;
        box.scrollTop = box.scrollHeight;
    }
}

// Torna a função de envio disponível globalmente
window.sendMessage = async function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const name = getCurrentName();
    const email = getCurrentEmail();
    
    input.value = '';

    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: text, sender: 'user' })
    });

    await loadMessages();
    // Removida resposta automática conforme solicitação
};