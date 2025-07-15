const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Розміри канвасу NES-стилю
canvas.width = 512;
canvas.height = 240;

// Масштабування
function resizeCanvas() {
  const scale = Math.min(
    window.innerWidth / canvas.width,
    window.innerHeight / canvas.height
  );
  canvas.style.width = canvas.width * scale + "px";
  canvas.style.height = canvas.height * scale + "px";
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Гравітація
const gravity = 0.6;

// Спрайти
const marioSprite = new Image();
marioSprite.src = "assets/mario.png";

const coinSprite = new Image();
coinSprite.src = "assets/coin.png";

// Звуки
const jumpSound = new Audio("assets/jump.wav");
const coinSound = new Audio("assets/coin.wav");

// Клавіші
const keys = {
  left: false,
  right: false,
  jump: false,
};

// Мобільне керування
document.getElementById("left").addEventListener("touchstart", () => keys.left = true);
document.getElementById("left").addEventListener("touchend", () => keys.left = false);
document.getElementById("right").addEventListener("touchstart", () => keys.right = true);
document.getElementById("right").addEventListener("touchend", () => keys.right = false);
document.getElementById("jump").addEventListener("touchstart", () => keys.jump = true);
document.getElementById("jump").addEventListener("touchend", () => keys.jump = false);

// Клавіатура
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "Space" || e.code === "ArrowUp") keys.jump = true;
});
document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
  if (e.code === "Space" || e.code === "ArrowUp") keys.jump = false;
});

// Платформи
const platforms = [
  { x: 0, y: 224, width: 512, height: 16 },
  { x: 150, y: 180, width: 64, height: 16 },
  { x: 250, y: 150, width: 64, height: 16 },
];

// Гравець
const player = {
  x: 50,
  y: 0,
  width: 16,
  height: 16,
  vx: 0,
  vy: 0,
  onGround: false,
  direction: 1,
};

// Монети
class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 16;
    this.collected = false;
    this.frame = 0;
  }

  draw() {
    if (this.collected) return;
    ctx.drawImage(
      coinSprite,
      this.frame * 16, 0, 16, 16,
      this.x, this.y, 16, 16
    );
  }

  update() {
    if (this.collected) return;
    this.frame = Math.floor(Date.now() / 100) % 4;

    if (
      player.x < this.x + this.size &&
      player.x + player.width > this.x &&
      player.y < this.y + this.size &&
      player.y + player.height > this.y
    ) {
      this.collected = true;
      coinSound.play();
      score++;
    }
  }
}

const coins = [
  new Coin(180, 160),
  new Coin(260, 120),
  new Coin(340, 160),
];

let score = 0;

// Оновлення гри
function update() {
  // Рух
  if (keys.left) {
    player.vx = -2;
    player.direction = -1;
  } else if (keys.right) {
    player.vx = 2;
    player.direction = 1;
  } else {
    player.vx = 0;
  }

  // Стрибок
  if (keys.jump && player.onGround) {
    player.vy = -10;
    player.onGround = false;
    jumpSound.play();
  }

  // Фізика
  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  // Колізії з платформами
  player.onGround = false;
  for (let plat of platforms) {
    if (
      player.x < plat.x + plat.width &&
      player.x + player.width > plat.x &&
      player.y + player.height < plat.y + 10 &&
      player.y + player.height + player.vy >= plat.y
    ) {
      player.y = plat.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // Межі екрана
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y > canvas.height) {
    alert("Game Over!");
    window.location.reload();
  }

  // Монети
  coins.forEach(coin => coin.update());
}

// Малювання
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Платформи
  ctx.fillStyle = "#228B22";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

  // Монети
  coins.forEach(coin => coin.draw());

  // Mario
  ctx.drawImage(
    marioSprite,
    0, 0, 16, 16, // статичний кадр
    Math.floor(player.x), Math.floor(player.y),
    16, 16
  );

  // Очки
  ctx.fillStyle = "black";
  ctx.font = "10px Arial";
  ctx.fillText("Coins: " + score, 5, 10);
}

// Головний цикл
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

marioSprite.onload = () => {
  gameLoop();
};
// JS код буде додано вручну
