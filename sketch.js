var currentState;
var gameState;
const bubbles = [];
const particles = [];
var score = 0;
var timeLeft = 60;
var fr = 60;
let lastSpawnTime = 0;
const bubbleSpawnInterval = 2000;
var restartButton;
var cursorStyle;
var loadingSpinner;
var loadingMessage = "Preparing the game...";
var popSound;
var gameOverSound;
var backgroundMusic;

const specialBubbleTypes = {
  normal: "NORMAL",
  bouncing: "BOUNCING",
  fast: "FAST",
};

class Particle {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.c = c || color(51, 170, 255);
    this.velocity = p5.Vector.random2D().mult(random(1, 2)); // Random velocity
    this.acceleration = createVector(0, 0.05); // Gravity-like acceleration
    this.lifespan = 255; // Particle lifespan
  }

  update() {
    this.velocity.add(this.acceleration);
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.lifespan -= 5;
  }

  display() {
    noStroke();
    this.c.setAlpha(this.lifespan);
    fill(this.c);
    ellipse(this.x, this.y, 5);
  }

  isFinished() {
    return this.lifespan <= 0;
  }
}

function preload() {
    soundFormats('mp3', 'ogg');
    popSound = loadSound("sound_effects/pop.mp3");
    gameOverSound = loadSound("sound_effects/game_over.mp3");
    backgroundMusic = loadSound("sound_effects/background_music.mp3");
}

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
            displayScores();
            displayTimer();
            drawParticles(); // Draw the particle explosion animation
            cursorStyle = "default";
            break;
        case gameState.paused:
            drawBubbles();
            drawParticles();
            textAlign(CENTER);
            text("Click anywhere to resume", width/2, height/2);
            cursorStyle = "pointer";
            break;
        case gameState.timeUp:
            endGame();
            break;
        case gameState.gameOver:
            drawParticles();
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
    }, 500)
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
                            
                            popSound.play();
                            
                            // Add particles for explosion animation
                            for (let i = 0; i < 10; i++) {
                                particles.push(new Particle(bubble.x, bubble.y));
                            }

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

// Display particles for explosion animation
function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }
}

// Start the game
function startGame() {
    currentState = gameState.playing;
    backgroundMusic.loop();
}

function endGame() {
    bubbles.forEach((bubble) => {
        for (let i = 0; i < 10; i++) {
            particles.push(new Particle(bubble.x, bubble.y, bubble.state ? color(51, 170, 255) : color(255, 170, 51)));
        }
    })
    bubbles.length = 0;
    currentState = gameState.gameOver;
    
    updateHighScore();
    
    textAlign(CENTER);
    text("High Score: " + getHighScore(), width/2, height/2 + 50);

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
        if (bubble.type === specialBubbleTypes.bouncing) {
            // Handle bouncing bubble behavior
            bubble.x += bubble.velocityX;
            bubble.y += bubble.velocityY;

            if (bubble.x + bubble.radius > width || bubble.x - bubble.radius < 0) {
                bubble.velocityX *= -1;
            }
            if (bubble.y + bubble.radius > height || bubble.y - bubble.radius < 0) {
                bubble.velocityY *= -1;
            }
        } else {
            // Normal bubble behavior
            bubble.y -= bubble.velocity;
        }

        if (bubble.y + bubble.radius < 0) {
            bubbles.splice(index, 1);
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
        const type = random() > 0.1 ? specialBubbleTypes.normal : random(Object.values(specialBubbleTypes));
        let velocityX = random(-2, 2);
        let velocityY = random(-2, 2);

        if (type === specialBubbleTypes.fast) {
          velocityX *= 2;
          velocityY *= 2;
        }
        const bubble = {
            x: random(20, width - 20),
            y: height,
            radius: random(10, 30),
            score: round(random(0, 10)) + 1,
//            state: random() > 0.1 ? 1 : 0,
            state: type !== specialBubbleTypes.normal,
            type: type,
            velocity: type === specialBubbleTypes.fast ? 4 : 2,
            velocityX: velocityX,
            velocityY: velocityY,
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

function displayScores() {
  textSize(20);
  textAlign(LEFT);
  fill(255);
  text(`Score: ${score}`, 20, 30);
  text(`High Score: ${getHighScore()}`, 20, 60);
}

// Update high score in localStorage
function updateHighScore() {
  const currentHighScore = getHighScore();
  if (score > currentHighScore) {
    localStorage.setItem("highScore", score);
  }
}

// Get high score from localStorage
function getHighScore() {
  return parseInt(localStorage.getItem("highScore")) || 0;
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