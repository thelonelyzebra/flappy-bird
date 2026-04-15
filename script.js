const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startButton = document.getElementById('start-button');

const config = {
    gravity: 0.45,
    flapStrength: -9.4,
    pipeSpeed: 2.8,
    pipeGap: 165,
    pipeWidth: 78,
    spawnRate: 110,
    floorHeight: 100,
    birdRadius: 18,
};

const state = {
    running: false,
    gameOver: false,
    frame: 0,
    score: 0,
    bestScore: Number(localStorage.getItem('flappyBirdBest')) || 0,
    bird: {
        x: 98,
        y: 290,
        vy: 0,
        rotation: 0,
    },
    pipes: [],
};

function saveBestScore() {
    if (state.score > state.bestScore) {
        state.bestScore = state.score;
        localStorage.setItem('flappyBirdBest', String(state.bestScore));
    }
}

function resetGame() {
    state.running = false;
    state.gameOver = false;
    state.frame = 0;
    state.score = 0;
    state.bird = { x: 98, y: 290, vy: 0, rotation: 0 };
    state.pipes = [];
    scoreEl.textContent = '0';
    bestScoreEl.textContent = String(state.bestScore);
    showOverlay('Ready?', 'Tap or press Space to start flying.', 'Start Game');
    draw();
}

function showOverlay(title, text, buttonText) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startButton.textContent = buttonText;
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    overlay.classList.add('hidden');
}

function startGame() {
    if (state.running) return;
    state.running = true;
    state.gameOver = false;
    state.pipes = [];
    state.frame = 0;
    state.bird = { x: 98, y: 290, vy: 0, rotation: 0 };
    state.score = 0;
    scoreEl.textContent = '0';
    bestScoreEl.textContent = String(state.bestScore);
    hideOverlay();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    state.running = false;
    state.gameOver = true;
    saveBestScore();
    showOverlay('Game Over', `Your score: ${state.score}. Tap to play again.`, 'Play Again');
}

function createPipe() {
    const minHeight = 60;
    const maxTop = canvas.height - config.floorHeight - config.pipeGap - minHeight;
    const topHeight = minHeight + Math.random() * (maxTop - minHeight);
    const x = canvas.width + 16;
    state.pipes.push({ x, topHeight, passed: false });
}

function updatePipes() {
    state.pipes.forEach((pipe) => {
        pipe.x -= config.pipeSpeed;
    });
    state.pipes = state.pipes.filter((pipe) => pipe.x + config.pipeWidth > -20);
}

function checkCollisions() {
    const bird = state.bird;
    const radius = config.birdRadius;
    if (bird.y + radius >= canvas.height - config.floorHeight) {
        return true;
    }
    if (bird.y - radius <= 0) {
        return true;
    }

    for (const pipe of state.pipes) {
        const pipeX = pipe.x;
        const pipeY = pipe.topHeight;
        const gapTop = pipeY;
        const gapBottom = pipeY + config.pipeGap;
        const closestX = Math.max(pipeX, Math.min(bird.x, pipeX + config.pipeWidth));
        const closestY = Math.max(gapTop, Math.min(bird.y, gapBottom));

        if (bird.x + radius > pipeX && bird.x - radius < pipeX + config.pipeWidth) {
            if (bird.y - radius < gapTop || bird.y + radius > gapBottom) {
                return true;
            }
        }
    }
    return false;
}

function updateScore() {
    state.pipes.forEach((pipe) => {
        if (!pipe.passed && pipe.x + config.pipeWidth < state.bird.x) {
            pipe.passed = true;
            state.score += 1;
            scoreEl.textContent = String(state.score);
        }
    });
}

function updateBird() {
    state.bird.vy += config.gravity;
    state.bird.y += state.bird.vy;
    state.bird.rotation = Math.min(1.2, state.bird.vy * 0.08);
}

function gameLoop() {
    if (!state.running) return;
    state.frame += 1;
    if (state.frame % config.spawnRate === 0) {
        createPipe();
    }
    updateBird();
    updatePipes();
    updateScore();
    if (checkCollisions()) {
        endGame();
    }
    draw();
    if (state.running) {
        requestAnimationFrame(gameLoop);
    }
}

function flap() {
    if (!state.running && !state.gameOver) {
        startGame();
        return;
    }
    if (state.gameOver) {
        resetGame();
        startGame();
        return;
    }
    state.bird.vy = config.flapStrength;
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#7dd3fc');
    gradient.addColorStop(0.65, '#38bdf8');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cloudColor = 'rgba(255,255,255,0.22)';
    ctx.fillStyle = cloudColor;
    ctx.beginPath();
    ctx.ellipse(110, 145, 52, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(162, 145, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(330, 110, 44, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(370, 110, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawFloor() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, canvas.height - config.floorHeight, canvas.width, config.floorHeight);
    ctx.fillStyle = '#334155';
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.fillRect(x, canvas.height - config.floorHeight, 24, 14);
    }
}

function drawBird() {
    const bird = state.bird;
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(state.bird.rotation);

    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, config.birdRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(6, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(16, 6);
    ctx.lineTo(16, 12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawPipes() {
    state.pipes.forEach((pipe) => {
        const x = pipe.x;
        const topHeight = pipe.topHeight;
        const bottomY = topHeight + config.pipeGap;

        ctx.fillStyle = '#16a34a';
        ctx.fillRect(x, 0, config.pipeWidth, topHeight);
        ctx.fillRect(x, bottomY, config.pipeWidth, canvas.height - config.floorHeight - bottomY);

        ctx.fillStyle = '#15803d';
        ctx.fillRect(x + 10, topHeight - 20, config.pipeWidth - 20, 24);
        ctx.fillRect(x + 10, bottomY - 12, config.pipeWidth - 20, 24);
    });
}

function draw() {
    drawBackground();
    drawPipes();
    drawFloor();
    drawBird();
}

function handleInput(event) {
    const isSpace = event.type === 'keydown' && event.code === 'Space';
    const isEnter = event.type === 'keydown' && event.code === 'Enter';
    if (event.type === 'click' || event.type === 'pointerdown' || isSpace || isEnter) {
        event.preventDefault();
        flap();
    }
}

canvas.addEventListener('pointerdown', handleInput);
startButton.addEventListener('click', startGame);
document.addEventListener('keydown', handleInput);

resetGame();
