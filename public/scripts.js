const ws = new WebSocket('ws://localhost:3001');

const playButton = document.getElementById('play-button');
const roundDisplay = document.getElementById('round');
const correctColorsDisplay = document.getElementById('correct-colors');
const buttons = document.querySelectorAll('.color-button');

let sequence = [];
let playing = false;
let showing = false;

ws.onopen = () => console.log("WebSocket conectado!");
ws.onerror = (error) => console.error("Erro no WebSocket:", error);
ws.onclose = () => console.log("WebSocket desconectado.");

playButton.addEventListener('click', () => {
    if (ws.readyState === WebSocket.OPEN) {
        playButton.style.opacity = "0.5";
        setTimeout(() => playButton.style.opacity = "1", 300);

        ws.send(JSON.stringify({ type: 'start' }));
    } else {
        console.error("WebSocket não está conectado.");
    }
});

buttons.forEach(button => {
    button.addEventListener('click', () => {
        if (!playing || showing) return;
        
        button.classList.add('pulse');
        setTimeout(() => button.classList.remove('pulse'), 500);

        highlightButton(button);

        ws.send(JSON.stringify({ type: 'playerInput', color: button.dataset.color }));
    });
});

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

function updateGameState(newSequence, newRound) {
    sequence = newSequence;
    roundDisplay.textContent = newRound;
    correctColorsDisplay.textContent = 0; 
    playing = true;

    buttons.forEach(btn => btn.style.opacity = "1");

    setTimeout(() => {
        playSequence();
    }, 1000); 
}

function highlightButton(button) {
    button.style.opacity = "0.5";
    setTimeout(() => button.style.opacity = "1", 300);
}

function disableButtons() {
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled'); 
    });
}

function enableButtons() {
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('disabled'); 
    });
}

function playSequence() {
    showing = true;
    disableButtons(); 

    let i = 0;
    const interval = setInterval(() => {
        if (i >= sequence.length) {
            clearInterval(interval);
            showing = false;
            enableButtons(); 
            return;
        }

        buttons.forEach(btn => {
            btn.style.opacity = "1";
            btn.classList.remove('pulse'); 
        });

        const currentButton = document.querySelector(`.${sequence[i]}`);
        if (currentButton) {
            currentButton.classList.add('pulse'); 
            highlightButton(currentButton); 

            setTimeout(() => currentButton.classList.remove('pulse'), 500);
        }

        i++;
    }, 1000);
}

