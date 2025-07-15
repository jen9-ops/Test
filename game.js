const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Встановлюємо фізичний розмір канвасу (NES стиль)
canvas.width = 512;
canvas.height = 240;

// Масштабування гри на весь екран (зберігаючи пропорції)
function resizeCanvas() {
  const aspect = canvas.width / canvas.height;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = Math.min(w / canvas.width, h / canvas.height);

  canvas.style.width = canvas.width * scale + 'px';
  canvas.style.height = canvas.height * scale + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// Гравітація
const gravity = 0.6;

// Імпорт спрайта Mario
const marioSprite = new Image();
marioSprite.src = 'assets/mario.png';

// Рух
const keys = {
  left: false,
  right: false,
  jump: false
};

// Гравець
const player = {
  x: 50,
  y: 0,
  width: 16,
  height: 16,
  vx: 0,
  vy: 0,
  onGround: false,
  frame: 0,
  direction: 1 // 1 = вправо, -1 = вліво
};

// Прості платформи (тимчасово)
const platforms = [
  { x: 0, y: 224, width: 512, height: 16 },  // земля
  { x: 150, y: 180, width: 64, height: 16 },
  { x: 250, y: 150, width: 64, height: 16 },
];

// Керування з клавіатури
document.addEventListener("keydown", e => {
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "Space" || e.code === "ArrowUp") keys.jump = true;
});

document.addEventListener("keyup", e => {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
  if (e.code === "Space" || e.code === "ArrowUp") keys.jump = false;
});

// 📱 Мобільне керування
document.getElementById("left").addEventListener("touchstart", () => keys.left = true);
document.getElementById("left").addEventListener("touchend", () => keys.left = false);

document.getElementById("right").addEventListener("touchstart", () => keys.right = true);
document.getElementById("right").addEventListener("touchend", () => keys.right = false);

document.getElementById("jump").addEventListener("touchstart", () => keys.jump = true);
document.getElementById("jump").addEventListener("touchend", () => keys.jump = false);

// Оновлення гри
function update() {
  // Горизонтальний рух
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
  }

  // Фізика
  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  // Колізія з платформами
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
}

// Малювання гри
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Платформи
  ctx.fillStyle = "#228B22";
  for (let plat of platforms) {
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  }

  // Mario
  ctx.drawImage(
    marioSprite,
    player.frame * 16, 0, 16, 16, // Кадр спрайта
    Math.floor(player.x), Math.floor(player.y),
    16, 16
  );
}

// Головний цикл
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Запуск
marioSprite.onload = () => {
  gameLoop();
};
