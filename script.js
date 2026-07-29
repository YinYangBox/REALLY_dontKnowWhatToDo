//i didn't clean it, it will stay here for ever >:) for the people that are reading(no one) my commit for correct my other commit it was wronge it is orthographic NOT ortographic, silly me
// for my friends that don't believe me this proyect it's made by Chao Yang Wang, fuck you
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

let deltaTime = 0;
let LastTime = 0;
let velocity = 300;
let bounces = 0;
let dificulty = 1;
let startGame = false;
let mode;
let selectDirection = false;

const formDificulty = document.getElementById("dificulty");
const formMode = document.getElementById("mode");
const arrowSelector = document.getElementById("arrow-selector");


document.addEventListener("dbclick", (event) => {
    event.preventDefault();
});
formMode.addEventListener("submit", (event) => {
    event.preventDefault();
    mode = event.submitter.id === 'one-player' ? 1 : 2;
    formMode.style.display = "none";
    formDificulty.style.display = "flex";
})
formDificulty.addEventListener("submit", (event) => {
    event.preventDefault();
    selectDirection = true;
    formDificulty.style.display = "none";
    dificulty = parseFloat(event.target.dificulty.value);
    if (mode === 1) {
        players.player2 = new BotPlayer("player2", 120*dificulty, 270);
    } else {
        players.player2 = new player("player2", {ArrowUp: -800, ArrowDown: 800}, 270);
    }
});

const keyActivated = {"w":false, "s":false, "ArrowUp":false, "ArrowDown":false};

function bounds(htmlObject) {
    const left = htmlObject.offsetLeft;
    const top = htmlObject.offsetTop;
    const width = htmlObject.offsetWidth;
    const height = htmlObject.offsetHeight;

    return {
        left: left,
        top: top,
        width: width,
        height: height,
        right: left + width,
        bottom: top + height
    };
}

function checkCollision(obj1, obj2) {
    const b1 = bounds(obj1);
    const b2 = bounds(obj2);
    const exist = (
        b1.right >= b2.left &&   
        b1.left <= b2.right &&
        b1.bottom >= b2.top && 
        b1.top <= b2.bottom
    );
    
    if (!exist) {
        return { exist: false, where: { how: "NONE", factor: 0 } };
    }
    
    const overlapX = Math.min(b1.right - b2.left, b2.right - b1.left);
    const overlapY = Math.min(b1.bottom - b2.top, b2.bottom - b1.top);

    const form = (overlapX < overlapY) ? "VERTICAL" : "HORIZONTAL";
    let factor = 0;

    if (form === "VERTICAL") {
        factor = ((b1.top + b1.height / 2) - (b2.top + b2.height / 2)) / ((b2.height + b1.height) / 2);
    } else {
        factor = ((b1.left + b1.width / 2) - (b2.left + b2.width / 2)) / ((b2.width + b1.width) / 2);
    }
    
    factor = Math.max(-1, Math.min(1, factor));

    return {
        exist: true, 
        where: { how: form, factor: factor }
    };
}

function getRandomAngleforBall() {
       do {
    angle = Math.floor(Math.random() * 360);
    }
       while (
    (angle >= 80 && angle <= 100) || 
    (angle >= 260 && angle <= 280));
    return angle;
}

class ball {
    constructor(htmlID, degree =getRandomAngleforBall()) {
        this.html = document.getElementById(htmlID);
        this.directionInDegrees = degree;
        this.x = this.html.offsetLeft;
        this.y = this.html.offsetTop;
    }

    move(degree, v, dt) {
        this.x += dt * v * Math.cos(degree * (Math.PI / 180)); 
        this.y += dt * v * Math.sin(degree * (Math.PI / 180));
        this.html.style.left = `${this.x}px`;
        this.html.style.top = `${this.y}px`;
    }

    resetToCenter() {
        this.x = window.innerWidth / 2 - this.html.offsetWidth / 2;
        this.y = window.innerHeight / 2 - this.html.offsetHeight / 2;
        this.html.style.left = `${this.x}px`;
        this.html.style.top = `${this.y}px`;
        this.directionInDegrees = Math.floor(Math.random() * 360);
        bounces = 0;
    }
}

class player {
    constructor(htmlID, KeysDict, initialTop = undefined) {
        this.html = document.getElementById(htmlID);
        this.scoreHtml = document.getElementById(`${htmlID}-score`);
        this.interactiveKeys = KeysDict;
        this.pendingMovement = 0;
        this.y = initialTop ?? this.html.offsetTop;
        this.html.style.top = `${this.y}px`;
        this.score = 0;
    }

    UpdateMovement(ball, deltaTime) {
        this.pendingMovement = 0;
        Object.keys(this.interactiveKeys).forEach(movement => {
            if (keyActivated[movement] === true) {
                this.pendingMovement += this.interactiveKeys[movement];
            }
        });
    }

    addPoint() {
        this.score++;
        if (this.scoreHtml) {
            this.scoreHtml.textContent = this.score;
        }
    }
}

class BotPlayer extends player {
    constructor(htmlID, baseSpeed = 350, initialTop = undefined) {
        super(htmlID, {}, initialTop);
        
        this.baseSpeed = baseSpeed;
        this.reactionTimer = 0;
        this.isWaiting = false;
        this.deadZone = 15;
    }

    startReaction(dificulty) {
        this.isWaiting = true;
        this.reactionTimer = Math.max(0.05, 0.5 - (dificulty*0.1));
    }

    UpdateMovement(ball, deltaTime) {
        if (ball.directionInDegrees < 270 && ball.directionInDegrees > 90) {
            return;
        }
        if (this.isWaiting) {
            this.reactionTimer -= deltaTime;
            if (this.reactionTimer <= 0) {
                this.isWaiting = false; 
            }
            this.pendingMovement = 0;
            return;
        }

        const ballCenter = ball.y + (ball.html.offsetHeight / 2);
        const botCenter = this.y + (this.html.offsetHeight / 2);

        if (Math.abs(ballCenter - botCenter) > this.deadZone) {
            this.pendingMovement = (ballCenter < botCenter) ? -this.baseSpeed : this.baseSpeed;
        } else {
            this.pendingMovement = 0;
        }
    }
}


const ball1 = new ball("The-ball");

const players = {
    player1: new player("player1", {w: -800, s: 800}, 270),
    player2: new player("player2", {ArrowUp: -800, ArrowDown: 800}, 270),
};

document.addEventListener("keydown", (event) => {
    if (event.key in keyActivated) {
        keyActivated[event.key] = true;
    }
});

document.addEventListener("keyup", (event) => {
    if (event.key in keyActivated) {
        keyActivated[event.key] = false;
    }
});


function Game(ActualTime) {
    if (selectDirection) {
        startGame = false;
        Object.values(players).forEach(player => {
            player.html.style.top = "300px";
            player.pendingMovement = 0;
            player.y = 300;
        });
        ball1.resetToCenter();
        arrowSelector.style.display = "block";
        ball1.directionInDegrees = getRandomAngleforBall();
        arrowSelector.classList.remove("rotate")
        void arrowSelector.offsetWidth;
        arrowSelector.style.setProperty("--deg", `${ball1.directionInDegrees + 817}deg`)
        arrowSelector.classList.add("rotate");
        selectDirection = false;
        setTimeout(() => {
            arrowSelector.style.display = "none";
            startGame = true;
        }, 3000);
    }
    if (!LastTime || !startGame) {
        LastTime = ActualTime;
        requestAnimationFrame(Game);
        return;
    }

    deltaTime = (ActualTime - LastTime) / 1000;
    LastTime = ActualTime;  

    if (deltaTime > 0.1) deltaTime = 0.1;

    ball1.move(ball1.directionInDegrees, velocity + (200*(1-Math.exp(-0.12*bounces)) * dificulty), deltaTime);


    if (ball1.y < 0) {
        bounces++;
        ball1.y = 0;
        ball1.directionInDegrees = (360 - ball1.directionInDegrees) % 360;
    }
    if (ball1.y > (window.innerHeight - ball1.html.offsetHeight)) {
        bounces++;
        ball1.y = window.innerHeight - ball1.html.offsetHeight;
        ball1.directionInDegrees = (360 - ball1.directionInDegrees) % 360;
    }

    if (ball1.x < 0) { 
        players.player2.addPoint();
        selectDirection = true;
    }
    if (ball1.x > (window.innerWidth - ball1.html.offsetWidth)) { 
        players.player1.addPoint();
        selectDirection = true;
    }

    Object.values(players).forEach(player => {
        player.UpdateMovement(ball1, deltaTime);
        
        player.y += player.pendingMovement * deltaTime;

        if (player.y < 0) {
            player.y = 0;
        } else if (player.y > window.innerHeight - player.html.offsetHeight) {
            player.y = window.innerHeight - player.html.offsetHeight;
        }

        player.html.style.top = `${player.y}px`;

        const collision = checkCollision(ball1.html, player.html);
        if (collision.exist) {
            bounces++;
            const b = bounds(ball1.html);
            const p = bounds(player.html);

            if (collision.where.how === "VERTICAL") {
                if (b.left + b.width / 2 < p.left + p.width / 2) {
                    ball1.x = p.left - b.width;
                    ball1.directionInDegrees = (180 - (collision.where.factor * 45) + 360) % 360;
                } else {
                    ball1.x = p.right;
                    ball1.directionInDegrees = ((collision.where.factor * 45) + 360) % 360;
                }
                ball1.html.style.left = `${ball1.x}px`;

            } else {
                if (b.top + b.height / 2 < p.top + p.height / 2) {
                    ball1.y = p.top - b.height; 
                } else {
                    ball1.y = p.bottom; 
                }
                ball1.directionInDegrees = (360 - ball1.directionInDegrees + (collision.where.factor * 45)) % 360;
                ball1.html.style.top = `${ball1.y}px`;
            }
        }
    });

    requestAnimationFrame(Game);
}
requestAnimationFrame(Game);