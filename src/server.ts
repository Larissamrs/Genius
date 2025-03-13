// Importações
import express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Estado do jogo
let gameState = {
    sequence: [] as string[],
    userSequence: [] as string[],
    colors: ["yellow", "green", "red", "blue"],
    round: 0,
    gameActive: false
};

// Inicia o jogo
io.on("connection", (socket) => {
    console.log("Novo jogador conectado");

    socket.on("startGame", () => {
        resetGame();
        addColorToSequence();
    });

    socket.on("userClick", (color) => {
        if (!gameState.gameActive) return;
        gameState.userSequence.push(color);
        checkUserInput(socket);
    });
});

// Reinicia o jogo
function resetGame() {
    gameState.sequence = [];
    gameState.userSequence = [];
    gameState.round = 0;
    gameState.gameActive = true;
    io.emit("updateStatus", { round: gameState.round, correctInputs: 0 });
}

// Adiciona uma nova cor à sequência
function addColorToSequence() {
    gameState.gameActive = false; // Desabilita entrada do usuário temporariamente
    io.emit("disableInput");
    
    const randomColor = gameState.colors[Math.floor(Math.random() * 4)];
    gameState.sequence.push(randomColor);
    gameState.userSequence = [];
    gameState.round++;

    io.emit("showSequence", gameState.sequence);
    io.emit("updateStatus", { round: gameState.round, correctInputs: 0 });

    setTimeout(() => {
        gameState.gameActive = true;
        io.emit("enableInput");
    }, gameState.sequence.length * 1000);
}

// Verifica a entrada do usuário
function checkUserInput(socket: any) {
    const index = gameState.userSequence.length - 1;
    
    if (gameState.userSequence[index] !== gameState.sequence[index]) {
        gameState.gameActive = false;
        io.emit("gameOver");
        io.emit("disableInput");
        return;
    }

    io.emit("updateStatus", { round: gameState.round, correctInputs: gameState.userSequence.length });

    if (gameState.userSequence.length === gameState.sequence.length) {
        setTimeout(() => addColorToSequence(), 1000);
    }
}

server.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});