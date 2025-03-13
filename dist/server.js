"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = 3000;
const WS_PORT = 3001;
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
const wss = new ws_1.WebSocketServer({ port: WS_PORT });
const colors = ['red', 'green', 'blue', 'yellow'];
let gameState = {
    sequence: [],
    playerIndex: 0,
    round: 0,
    correctColors: 0,
};
/**
 * Adiciona uma nova cor à sequência e reseta o índice do jogador.
 */
const addNewColor = () => {
    gameState.sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    gameState.playerIndex = 0;
    gameState.correctColors = 0;
    gameState.round++;
    console.log(`Nova sequência: ${gameState.sequence.join(", ")}`);
};
/**
 * Envia o estado do jogo para todos os clientes conectados.
 */
const broadcastState = () => {
    wss.clients.forEach(client => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'sequence',
                sequence: gameState.sequence,
                round: gameState.round
            }));
        }
    });
};
/**
 * Reinicia o jogo.
 */
const resetGame = () => {
    gameState.sequence = [];
    gameState.round = 0;
    gameState.correctColors = 0;
    addNewColor();
    broadcastState();
};
wss.on('connection', (ws) => {
    console.log('Novo jogador conectado.');
    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());
        console.log("Mensagem recebida do cliente:", data);
        switch (data.type) {
            case 'start':
                console.log("Iniciando o jogo...");
                resetGame();
                break;
            case 'playerInput':
                handlePlayerInput(ws, data.color);
                break;
            default:
                console.error("Tipo de mensagem desconhecido:", data);
        }
    });
});
/**
 * Processa a entrada do jogador e verifica se está correta.
 */
const handlePlayerInput = (ws, color) => {
    console.log(`Jogador clicou em: ${color}`);
    const correctColor = gameState.sequence[gameState.playerIndex];
    if (color === correctColor) {
        gameState.playerIndex++;
        gameState.correctColors++;
        // Envia a atualização para o jogador
        ws.send(JSON.stringify({ type: 'correct', correctColors: gameState.correctColors }));
        // Se o jogador acertou toda a sequência, adiciona uma nova cor
        if (gameState.playerIndex === gameState.sequence.length) {
            setTimeout(() => {
                addNewColor();
                broadcastState();
            }, 1000); // Aguarda 1 segundo antes de resetar o correct colors e avançar o round
        }
    }
    else {
        ws.send(JSON.stringify({ type: 'gameOver', message: 'Você errou! Reinicie o jogo.' }));
    }
};
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`WebSocket rodando na porta ${WS_PORT}`);
});
