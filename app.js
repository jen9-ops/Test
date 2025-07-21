/* ========= 1. Шаблоны PowerShell ========= */
const templates = [
  {
    pattern: /создать vhdx (?<size>\d+(?:gb|mb)) в (?<path>.+)/i,
    script: ({ size, path }) => `
# Создаем динамический VHDX
$vhdPath = "${path}\\VirtualDisk.vhdx"
New-VHD  -Path $vhdPath -SizeBytes ${size.toUpperCase()} -Dynamic
Mount-VHD -Path $vhdPath

$disk = (Get-Disk | ? IsOffline -eq $false | Select -Last 1)
Initialize-Disk -Number $disk.Number -PartitionStyle GPT
New-Partition -DiskNumber $disk.Number -UseMaximumSize -AssignDriveLetter |
  Format-Volume -FileSystem NTFS -NewFileSystemLabel "Data"`
  },

  {
    pattern: /зашифровать диск (?<letter>[a-z]): с ключом в (?<keyPath>.+)/i,
    script: ({ letter, keyPath }) =>
      `Enable-BitLocker -MountPoint "${letter.toUpperCase()}:" -RecoveryKeyPath "${keyPath}" -EncryptionMethod XtsAes256`,
  },

  {
    pattern: /показать процессы/i,
    script: () => `Get-Process | Sort-Object CPU -desc | Select -First 25`,
  },

  {
    pattern: /убить процесс (?<name>\S+)/i,
    script: ({ name }) => `Stop-Process -Name "${name}" -Force`,
  },
];

const templateMatch = (q) => {
  for (const t of templates) {
    const m = q.match(t.pattern);
    if (m)
      return typeof t.script === "function"
        ? t.script(m.groups || {})
        : t.script;
  }
  return null;
};

/* ========= 2. Хранилище ========= */
let knowledgeBase = JSON.parse(localStorage.getItem("knowledgeBase") || "[]");
let corpus = JSON.parse(localStorage.getItem("corpus") || "[]");

const saveAll = () => {
  localStorage.setItem("knowledgeBase", JSON.stringify(knowledgeBase));
  localStorage.setItem("corpus", JSON.stringify(corpus));
};

/* ========= 3. Нейронный слой (Transformers.js) ========= */
let gpt = null;
async function loadModel() {
  if (gpt) return; // уже загружена
  const { pipeline } = window.transformers;
  gpt = await pipeline("text-generation", "Xenova/gpt2-small", {
    quantized: true, // ~55 МБ
  });
}

async function neuralScript(prompt) {
  await loadModel();
  const out = await gpt(prompt + "\n```powershell\n", {
    max_new_tokens: 120,
    temperature: 0.3,
    stop: ["```"],
  });
  const code = out[0].generated_text
    .split("```powershell")[1]
    ?.replace("```", "")
    ?.trim();
  return code;
}

/* ========= 4. Вспомогательные утилиты ========= */
const stopW = new Set(
  "и в во не что он на я с со как а то все она но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее сейчас были куда зачем"
    .split(" ")
    .filter(Boolean)
);

const sentences = (t) =>
  t
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/* ========= 5. DOM ссылки ========= */
const trainText = document.getElementById("trainText");
const trainURL = document.getElementById("trainURL");
const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const textInput = document.getElementById("textInput");
const urlInput = document.getElementById("urlInput");

/* ========= 6. UI helpers ========= */
function append(sender, text, cls) {
  const d = document.createElement("div");
  d.className = `msg ${cls}`;
  d.textContent = `${sender}: ${text}`;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  return d; // вернуть DOM-узел
}
function hideSections() {
  trainText.classList.add("hidden");
  trainURL.classList.add("hidden");
}
function showTrainText() {
  hideSections();
  trainText.classList.remove("hidden");
}
function showTrainURL() {
  hideSections();
  trainURL.classList.remove("hidden");
}
function clearChat() {
  chat.innerHTML = "";
}

/* ========= 7. Backup / Restore ========= */
function exportData() {
  const blob = new Blob([JSON.stringify({ knowledgeBase, corpus })], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bot-memory.json";
  a.click();
  URL.revokeObjectURL(url);
}
function importData(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target.result);
      if (Array.isArray(d.knowledgeBase) && Array.isArray(d.corpus)) {
        knowledgeBase = d.knowledgeBase;
        corpus = d.corpus;
        saveAll();
        append("ИИ", "Память восстановлена!", "bot");
      } else throw "format";
    } catch (err) {
      alert("Ошибка импорта: " + err);
    }
  };
  r.readAsText(f);
}

/* ========= 8. Обучение ========= */
function trainFromText() {
  const t = textInput.value.trim();
  if (!t) return alert("Текст?");
  const s = sentences(t);
  s.forEach((x) => {
    knowledgeBase.push({ request: x.toLowerCase(), answer: x });
    corpus.push(x);
  });
  saveAll();
  append("ИИ", `Обучено предложений: ${s.length}`, "bot");
}
async function trainFromURL() {
  const u = urlInput.value.trim();
  if (!u) return alert("URL?");
  try {
    const proxy = "https://api.allorigins.win/get?url=" + encodeURIComponent(u);
    const res = await fetch(proxy);
    const data = await res.json();
    const doc = new DOMParser().parseFromString(data.contents, "text/html");
    const text = [...doc.querySelectorAll("p")]
      .map((p) => p.textContent.trim())
      .join(" ");
    const s = sentences(text);
    s.forEach((x) => {
      knowledgeBase.push({ request: x.toLowerCase(), answer: x });
      corpus.push(x);
    });
    saveAll();
    append("ИИ", `С URL обучено: ${s.length}`, "bot");
  } catch (e) {
    alert("Ошибка URL: " + e.message);
  }
}

/* ========= 9. Анализ ========= */
function analysis() {
  if (!corpus.length) return "Корпус пуст!";
  let total = 0,
    freq = {};
  corpus.forEach((s) =>
    s
      .toLowerCase()
      .split(/[^\p{L}0-9]+/u)
      .forEach((w) => {
        if (!w || stopW.has(w)) return;
        total++;
        freq[w] = (freq[w] || 0) + 1;
      })
  );
  const avg = (total / corpus.length).toFixed(1);
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w, c]) => `${w}(${c})`)
    .join(", ");
  return `Всего предложений: ${corpus.length}\nСредняя длина: ${avg} слов\nТоп-10 слов: ${top}`;
}
function showAnalysis() {
  append("ИИ", analysis(), "bot");
  hideSections();
}

/* ========= 10. Основной ask ========= */
const sim = (a, b) => {
  const w1 = a.split(/\s+/),
    w2 = b.split(/\s+/);
  return w1.filter((x) => w2.includes(x)).length / Math.max(w1.length, w2.length);
};
const kb = (q) => {
  let best = null,
    s = 0;
  knowledgeBase.forEach((e) => {
    const sc = sim(q, e.request);
    if (sc > s) {
      s = sc;
      best = e;
    }
  });
  return s > 0.35 ? best.answer : null;
};

async function ask() {
  const q = userInput.value.trim();
  if (!q) return;
  userInput.value = "";
  append("Ты", q, "user");

  // 1. шаблоны
  let ans = templateMatch(q.toLowerCase());

  // 2. база знаний
  if (!ans) ans = kb(q.toLowerCase());

  // 3. нейросеть
  if (!ans) {
    const thinking = append("ИИ", "⚙️ Думаю…", "bot");
    ans = await neuralScript(`Напиши PowerShell-скрипт: ${q}`);
    thinking.textContent = `ИИ: ${ans || "🤷 Не удалось сгенерировать"}`;
    return;
  }

  append("ИИ", ans, "bot");
}

/* ========= 11. Экспорт функций в глобал (для кнопок) ========= */
window.showTrainText = showTrainText;
window.showTrainURL = showTrainURL;
window.showAnalysis = showAnalysis;
window.exportData = exportData;
window.importData = importData;
window.trainFromText = trainFromText;
window.trainFromURL = trainFromURL;
window.clearChat = clearChat;
window.ask = ask;
