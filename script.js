let deltaTime = 0;
let LastTime = 0;
let velocity = 300;
let bounces = 0;

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

class ball {
    constructor(htmlID, degree = Math.floor(Math.random() * 360)) {
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

    UpdateMovement() {
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

const ball1 = new ball("The-ball");

const players = {
    player1: new player("player1", {w: -800, s: 800}, 270),
    player2: new player("player2", {ArrowUp: -800, ArrowDown: 800}, 270) 
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

["dragstart", "mousedown"].forEach(evento => document.addEventListener(evento, (event) => {
    event.preventDefault();
}));

function Game(ActualTime) {
    if (!LastTime) {
        LastTime = ActualTime;
        requestAnimationFrame(Game);
        return;
    }

    deltaTime = (ActualTime - LastTime) / 1000;
    LastTime = ActualTime;  

    if (deltaTime > 0.1) deltaTime = 0.1;

    ball1.move(ball1.directionInDegrees, velocity + (bounces * 50), deltaTime);

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
        ball1.resetToCenter();
    }
    if (ball1.x > (window.innerWidth - ball1.html.offsetWidth)) { 
        players.player1.addPoint();
        ball1.resetToCenter();
    }

    Object.values(players).forEach(player => {
        player.UpdateMovement();
        
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