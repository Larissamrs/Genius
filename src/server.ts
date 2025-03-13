import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';

const app = express();
const PORT = 3000;
const WS_PORT = 3001;

app.use(express.static(path.join(__dirname, '../public')));

const wss = new WebSocketServer({ port: WS_PORT });

type GameState = {
  sequence: string[];
  playerIndex: number;
  round: number;
  correctColors: number;
};

const colors = ['red', 'green', 'blue', 'yellow'];

let gameState: GameState = {
  sequence: [],
  playerIndex: 0,
  round: 0,
  correctColors: 0,
};

const addNewColor = () => {
  gameState.sequence.push(colors[Math.floor(Math.random() * colors.length)]);
  gameState.playerIndex = 0;
  gameState.correctColors = 0;
  gameState.round++;
  console.log(`Nova sequência: ${gameState.sequence.join(", ")}`);
};

const broadcastState = () => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'sequence',
        sequence: gameState.sequence,
        round: gameState.round
      }));
    }
  });
};

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

const handlePlayerInput = (ws: WebSocket, color: string) => {
  console.log(`Jogador clicou em: ${color}`);
  const correctColor = gameState.sequence[gameState.playerIndex];

  if (color === correctColor) {
    gameState.playerIndex++;
    gameState.correctColors++;

    ws.send(JSON.stringify({ type: 'correct', correctColors: gameState.correctColors }));

    if (gameState.playerIndex === gameState.sequence.length) {
        setTimeout(() => {
            addNewColor();
            broadcastState();
        }, 1000); 
    }
  } else {
    ws.send(JSON.stringify({ type: 'gameOver', message: 'Você errou! Reinicie o jogo.' }));
  }
};

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`WebSocket rodando na porta ${WS_PORT}`);
});
