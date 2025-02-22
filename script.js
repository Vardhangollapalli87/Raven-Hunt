window.onload = function() {
    const canv5 = document.getElementById('canvas5');
    const ctx = canv5.getContext('2d');
    canv5.width = window.innerWidth;
    canv5.height = window.innerHeight;

    const collCanvas = document.getElementById('collision');
    const collCtx = collCanvas.getContext('2d', { willReadFrequently: true });
    collCanvas.width = window.innerWidth;
    collCanvas.height = window.innerHeight;

    let ravens = [];
    let explosions = [];
    let particles = [];
    let timeToNextRaven = 0;
    let ravenInterval = 600;
    let lastTime = 0;
    let gameOver = false;
    let gameFrame = 0;
    let score = 0;
    ctx.font = '50px Impact';

    class Raven {
        constructor() {
            this.image = new Image();
            this.image.src = 'raven.png';
            this.spriteWidth = 271;
            this.spriteHeight = 194;
            this.sizeModifier = Math.random() * 1.5 + 1.5;
            this.width = this.spriteWidth / this.sizeModifier;
            this.height = this.spriteHeight / this.sizeModifier;
            this.x = canv5.width;
            this.y = Math.random() * (canv5.height - this.height);
            this.directionX = Math.floor(Math.random() * 4 + 1);
            this.directionY = Math.random() * 5 - 2.5;
            this.frame = 0;
            this.maxFrame = 5;
            this.timeSinceFlap = 0;
            this.flapInterval = Math.random() * 50 + 50;
            this.markedForDeletion = false;
            this.randomColors = [
                Math.floor(Math.random() * 255),
                Math.floor(Math.random() * 255),
                Math.floor(Math.random() * 255)
            ];
            this.color = `rgb(${this.randomColors[0]},${this.randomColors[1]},${this.randomColors[2]})`;
        }

        update(deltaTime) {
            if (this.y < 0 || this.y > canv5.height - this.height) {
                this.directionY *= -1;
            }
            this.x -= this.directionX;
            this.y += this.directionY;
            this.timeSinceFlap += deltaTime;

            if (this.timeSinceFlap > this.flapInterval) {
                this.frame = this.frame > this.maxFrame ? 0 : this.frame + 1;
                this.timeSinceFlap = 0;
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(this.x, this.y, this.width, this.color));
                }
            }

            if (this.x < 0 - this.width) {
                this.markedForDeletion = true;
                gameOver = true;
            }
        }

        draw() {
            collCtx.fillStyle = this.color;
            collCtx.fillRect(this.x, this.y, this.width, this.height);
            ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }
    }

    class Explosion {
        constructor(x, y, size) {
            this.image = new Image();
            this.image.src = 'boom.png';
            this.spriteWidth = 200;
            this.spriteHeight = 179;
            this.size = size;
            this.x = x;
            this.y = y;
            this.frame = 0;
            this.sound = new Audio();
            this.sound.src = 'Fire impact 1.wav';
            this.timeSinceLastFrame = 0;
            this.frameInterval = 100;
            this.markedForDeletion = false;
    
            // Wait for image to load before using it
            this.image.onload = () => {
                this.ready = true;
            };
        }
    
        update(deltaTime) {
            if (this.frame === 0 && this.ready) this.sound.play();
            this.timeSinceLastFrame += deltaTime;
            if (this.timeSinceLastFrame > this.frameInterval) {
                this.frame++;
                if (this.frame > 5) this.markedForDeletion = true;
            }
        }
    
        draw() {
            if (this.ready) {
                ctx.drawImage(
                    this.image,
                    this.frame * this.spriteWidth,
                    0,
                    this.spriteWidth,
                    this.spriteHeight,
                    this.x,
                    this.y,
                    this.size,
                    this.size
                );
            }
        }
    }
    

    class Particle {
        constructor(x, y, size, color) {
            this.size = size;
            this.x = x + this.size / 2 + (Math.random() * 50 + 25);
            this.y = y + this.size / 3;
            this.radius = Math.random() * this.size / 10;
            this.maxRadius = Math.random() * 20 + 15;
            this.markedForDeletion = false;
            this.speedX = Math.random() * 1 + 0.5;
            this.color = color;
        }

        update() {
            this.x += this.speedX;
            this.radius += 0.3;
            if (this.radius > this.maxRadius - 5) this.markedForDeletion = true;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = 1 - this.radius / this.maxRadius;
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function animate(timeStamp) {
        ctx.clearRect(0, 0, canv5.width, canv5.height);
        collCtx.clearRect(0, 0, canv5.width, canv5.height);
        let deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        timeToNextRaven += deltaTime;

        if (timeToNextRaven > ravenInterval) {
            ravens.push(new Raven());
            timeToNextRaven = 0;
            ravens.sort((a, b) => a.width - b.width);
        }

        drawScore();
        [...ravens, ...explosions, ...particles].forEach(e => e.update(deltaTime));
        [...ravens, ...explosions, ...particles].forEach(e => e.draw());
        ravens = ravens.filter(e => !e.markedForDeletion);
        explosions = explosions.filter(e => !e.markedForDeletion);
        particles = particles.filter(e => !e.markedForDeletion);
        gameFrame++;

        if (!gameOver) requestAnimationFrame(animate);
        else drawGameOver();
    }

    function drawGameOver() {
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canv5.width / 2, canv5.height / 2);
    }

    function drawScore() {
        ctx.fillStyle = 'orange';
        ctx.fillText('Score: ' + score, 50, 70);
    }

    window.addEventListener('click', event => {
        const detectPixelColor = collCtx.getImageData(event.x, event.y, 1, 1).data;
        ravens.forEach(e => {
            if (e.randomColors[0] === detectPixelColor[0]) {
                explosions.push(new Explosion(e.x, e.y, e.width));
                e.markedForDeletion = true;
                score++;
            }
        });
    });

    animate(0);
};
