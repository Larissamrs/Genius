const ws = new WebSocket('ws://localhost:3001');

const playButton = document.getElementById('play-button');
const roundDisplay = document.getElementById('round');
const correctColorsDisplay = document.getElementById('correct-colors');
const buttons = document.querySelectorAll('.color-button');

let sequence = [];
let playing = false;
let showing = false;

// Espera a conexão ser estabelecida antes de enviar mensagens
ws.onopen = () => console.log("WebSocket conectado!");
ws.onerror = (error) => console.error("Erro no WebSocket:", error);
ws.onclose = () => console.log("WebSocket desconectado.");

// Iniciar o jogo ao clicar no botão Play
playButton.addEventListener('click', () => {
    if (ws.readyState === WebSocket.OPEN) {
        // Adiciona efeito visual no clique
        playButton.style.opacity = "0.5";
        setTimeout(() => playButton.style.opacity = "1", 300);

        ws.send(JSON.stringify({ type: 'start' }));
    } else {
        console.error("WebSocket não está conectado.");
    }
});

// Captura os cliques dos botões de cor (bloqueados enquanto mostra a sequência)
buttons.forEach(button => {
    button.addEventListener('click', () => {
        if (!playing || showing) return; // Evita cliques enquanto mostra a sequência

        // Efeito visual do clique
        highlightButton(button);

        // Envia a cor clicada para o servidor
        ws.send(JSON.stringify({ type: 'playerInput', color: button.dataset.color }));
    });
});

// Processa mensagens do servidor
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Mensagem recebida:", data);

    switch (data.type) {
        case 'sequence':
            updateGameState(data.sequence, data.round);
            break;
        case 'correct':
            correctColorsDisplay.textContent = data.correctColors;
            break;
        case 'gameOver':
            alert("Você perdeu! Clique em Play para reiniciar.");
            playing = false;
            break;
        default:
            console.error("Tipo de mensagem desconhecido:", data);
    }
};

// Atualiza o estado do jogo na UI
function updateGameState(newSequence, newRound) {
    sequence = newSequence;
    roundDisplay.textContent = newRound;
    correctColorsDisplay.textContent = 0; // Reinicia os acertos
    playing = true;
    playSequence();
}

// Destaca um botão por um curto período
function highlightButton(button) {
    button.style.opacity = "0.5";
    setTimeout(() => button.style.opacity = "1", 300);
}

// Bloqueia cliques nos botões e altera o cursor
function disableButtons() {
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled'); // Adiciona a classe para mudar o cursor
    });
}

// Libera os botões para clique e restaura o cursor
function enableButtons() {
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('disabled'); // Remove a classe para restaurar o cursor
    });
}

// Mostra a sequência ao jogador e bloqueia cliques temporariamente
function playSequence() {
    showing = true;
    disableButtons(); // Desativa botões enquanto a sequência é mostrada

    let i = 0;
    const interval = setInterval(() => {
        if (i >= sequence.length) {
            clearInterval(interval);
            showing = false;
            enableButtons(); // Reativa os botões após mostrar a sequência
            return;
        }

        // Reseta todas as cores antes de destacar a atual
        buttons.forEach(btn => btn.style.opacity = "1");

        // Destaca apenas a cor da vez
        const currentButton = document.querySelector(`.${sequence[i]}`);
        if (currentButton) {
            highlightButton(currentButton);
        }

        i++;
    }, 1000);
}
