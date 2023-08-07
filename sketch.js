var currentState;
var gameState;
const bubbles = [];
var score = 0;
var timeLeft = 60;
var fr = 60;
let lastSpawnTime = 0;
const bubbleSpawnInterval = 2000;
var restartButton;
var cursorStyle;
var loadingSpinner;
var loadingMessage = "Preparing the game...";

function setup()
{
    createCanvas(windowWidth, windowHeight);
    gameState = {
        loading: "LOADING",
        start: "START",
        playing: "PLAYING",
        paused: "PAUSED",
        gameOver: "GAME_OVER",
        timeUp: "TIME_UP"
    }
    
    loadingSpinner = createDiv();
    loadingSpinner.class("loading-spinner");
    loadingSpinner.position(width / 2, height / 2);
    
    frameRate(fr);
    currentState = gameState.loading;
    restartButton = createButton('Restart');
    restartButton.addClass("hide");
    cursorStyle = "default";
}

window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (currentState === gameState.playing) currentState = gameState.paused;
})

function draw()
{
    background(0);
    fill(255, 0, 255);
    stroke(255, 0, 255);
    
    document.body.style.cursor = cursorStyle;
    loadingSpinner.addClass("hide");
    
    switch (currentState) {
        case gameState.loading:
            cursorStyle = "wait";
            gameLoadingScreen();
            break;
        case gameState.start:
            fill(255);
            textSize(32);
            textAlign(CENTER);
            text("Click to start the game!", width / 2, height / 2);
            cursorStyle = "pointer";
            break;
        case gameState.playing:
            spawnBubbles();
            drawBubbles();
            moveBubbles();
            updateTime();
            displayScore();
            displayTimer();
            cursorStyle = "default";
            break;
        case gameState.paused:
            drawBubbles();
            textAlign(CENTER);
            text("Click anywhere to resume", width/2, height/2);
            cursorStyle = "pointer";
            break;
        case gameState.timeUp:
            endGame();
            break;
        case gameState.gameOver:
            endGame();
            break;
        default:
            return;
    }
}

function resumeGame() {
    currentState = gameState.playing;
}

function gameLoadingScreen() {
    // Display the loading spinner and message
    loadingSpinner.addClass("loading-spinner");
    loadingSpinner.removeClass("hide");
    fill(255);
    textSize(24);
    textAlign(CENTER);
    text(loadingMessage, width / 2, height / 2 + 30);

    setTimeout(() => {
        currentState = gameState.start;
    }, 3000)
}

function mouseClicked() {
    switch (currentState) {
        case gameState.start:
            startGame();
            break;
        case gameState.playing:
            if (mouseButton === LEFT) {
                bubbles.forEach((bubble, index) => {
                    const distance = dist(bubble.x, bubble.y, mouseX, mouseY);
                    if (distance < bubble.radius) {
                        if (bubble.state) {
                            score += bubble.score;
                            bubbles.splice(index, 1);
                        } else {
                            currentState = gameState.gameOver;
                        }
                    }
                });
            }
            if (mouseButton === RIGHT) {
                currentState = gameState.paused;
            }
            
            break;
        case gameState.paused:
            resumeGame();
            break;
        default:
            return;
    }
}

// Start the game
function startGame() {
    currentState = gameState.playing;
}

function endGame() {
    currentState = gameState.gameOver;
    
    var highScore = localStorage.getItem("highScore") || 0;
    if (score > highScore) {
        localStorage.setItem("highScore", score);
        highScore = score;
    }
    
    textAlign(CENTER);
    text("High Score: " + highScore, width/2, height/2 + 50);

    // Create a restart button
    restartButton.position(width / 2 - 50, height / 2);
    restartButton.mousePressed(resetGame);
    restartButton.removeClass("hide");

    // Display the player's score and the restart button
    textAlign(CENTER);
    const gameOverMessage = text('Game Over! Your score: ' + score, width / 2, height / 2 - 30);
}

function updateTime() {
    if (frameCount % fr == 0) {
        timeLeft--;
        if (timeLeft <= 0) {
            currentState = gameState.timeUp;
        }
    }
}

function moveBubbles() {
    bubbles.forEach((bubble, index) => {
        bubble.y -= 2; // Adjust the speed of the bubbles
        if (bubble.y + bubble.radius < 0) {
            bubbles.splice(index, 1); // Remove bubbles that are off the screen
        }
    });
}

function drawBubbles() {
    bubbles.forEach((bubble) => {
        if (bubble.state) {
            fill(51, 170, 255);
        } else {
            fill(255, 170, 51);
        }
        ellipse(bubble.x, bubble.y, bubble.radius);
    });
}

// Spawn bubbles
function spawnBubbles() {
    if (currentState === gameState.playing && millis() - lastSpawnTime > bubbleSpawnInterval - max(frameCount, 1000)) {
        const bubble = {
            x: random(20, width - 20),
            y: height,
            radius: random(10, 30),
            score: round(random(0, 10)) + 1,
            state: random() > 0.1 ? 1 : 0,
        };
        bubbles.push(bubble);
        lastSpawnTime = millis(); // Update the last spawn time
    }
}

// Reset the game
function resetGame() {
    bubbles.length = 0;
    score = 0;
    timeLeft = 60;
    currentState = gameState.start;
    lastSpawnTime = 0;
    frameCount = 0;
    restartButton.addClass("hide");
    startGame();
}

function displayScore() {
    fill(255);
    textSize(18);
    textAlign(LEFT);
    text('Score: ' + score, 20, 30);
}

function displayTimer() {
    fill(255);
    textSize(18);
    textAlign(RIGHT);
    text('Time: ' + timeLeft + 's', width - 20, 30);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}