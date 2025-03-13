"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importações
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = http.createServer(app);
const io = new socket_io_1.Server(server);
app.use(express_1.default.static("public"));
// Estado do jogo
let gameState = {
    sequence: [],
    userSequence: [],
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
        if (!gameState.gameActive)
            return;
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
function checkUserInput(socket) {
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
