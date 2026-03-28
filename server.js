const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do Banco de Dados SQLite
const dbPath = path.resolve(__dirname, 'support.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Erro ao conectar ao SQLite:', err.message);
    else console.log('Conectado ao banco de dados de suporte.');
});

// Criação da tabela de mensagens se não existir
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS support_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        sender TEXT DEFAULT 'user', -- 'user' ou 'support'
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// ROTA API: Enviar uma nova mensagem
app.post('/api/messages', (req, res) => {
    const { name, email, message, sender } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    const query = `INSERT INTO support_messages (name, email, message, sender) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, email, message, sender || 'user'], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, status: 'Mensagem enviada com sucesso!' });
    });
});

// ROTA API: Buscar histórico de mensagens por e-mail (para o chat do usuário)
app.get('/api/messages/:email', (req, res) => {
    const email = req.params.email;
    const query = `SELECT * FROM support_messages WHERE email = ? ORDER BY timestamp ASC`;
    
    db.all(query, [email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ROTA API: Buscar TODAS as mensagens (Para o painel de administração/suporte)
app.get('/api/admin/messages', (req, res) => {
    db.all(`SELECT * FROM support_messages ORDER BY timestamp DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor de suporte rodando em http://localhost:${PORT}`);
});