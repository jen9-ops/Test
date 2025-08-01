// Утилиты
function showMessage(text, type = 'info', duration = 1500) {
  const container = document.getElementById('alerts');
  const div = document.createElement('div');
  div.className = `alert alert-${type} py-2 mb-2`;
  div.role = 'alert';
  div.style.minWidth = '200px';
  div.textContent = text;
  container.appendChild(div);
  setTimeout(() => {
    div.classList.add('fade');
    div.style.transition = 'opacity .4s';
    div.style.opacity = '0';
  }, duration);
  setTimeout(() => div.remove(), duration + 500);
}

// Инициализация CodeMirror
const htmlEditor = CodeMirror.fromTextArea(document.getElementById('editor-html'), {
  mode: 'htmlmixed',
  theme: 'material',
  lineNumbers: true,
  autoCloseBrackets: true,
  matchBrackets: true,
  lineWrapping: true
});
const cssEditor = CodeMirror.fromTextArea(document.getElementById('editor-css'), {
  mode: 'css',
  theme: 'material',
  lineNumbers: true,
  autoCloseBrackets: true,
  matchBrackets: true,
  lineWrapping: true
});
const jsEditor = CodeMirror.fromTextArea(document.getElementById('editor-js'), {
  mode: 'javascript',
  theme: 'material',
  lineNumbers: true,
  autoCloseBrackets: true,
  matchBrackets: true,
  lineWrapping: true
});

const consoleBox = document.getElementById('console');

// Загрузка из localStorage
function loadSaved() {
  htmlEditor.setValue(localStorage.getItem('editor_html') || '<h1>Привіт, світ!</h1>');
  cssEditor.setValue(localStorage.getItem('editor_css') || 'body { font-family: sans-serif; }');
  jsEditor.setValue(localStorage.getItem('editor_js') || "console.log('JS працює');");
}
loadSaved();

// Автосохранение (дебаунс)
let saveTimer;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem('editor_html', htmlEditor.getValue());
    localStorage.setItem('editor_css', cssEditor.getValue());
    localStorage.setItem('editor_js', jsEditor.getValue());
    showMessage('Автозбережено', 'success', 800);
  }, 600);
}
htmlEditor.on('change', scheduleSave);
cssEditor.on('change', scheduleSave);
jsEditor.on('change', scheduleSave);

// Перенос рядків
document.getElementById('wrapToggle').addEventListener('change', e => {
  const wrap = e.target.checked;
  [htmlEditor, cssEditor, jsEditor].forEach(ed => ed.setOption('lineWrapping', wrap));
});

// Кнопки
document.getElementById('runBtn').addEventListener('click', () => {
  consoleBox.textContent = '';
  consoleBox.classList.remove('d-none');

  const html = htmlEditor.getValue();
  const css = `<style>${cssEditor.getValue()}</style>`;
  const userJs = jsEditor.getValue();

  // Улучшенный скрипт для ловли ошибок и unhandledrejection
  const payload = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${css}
</head>
<body>
${html}
<script>
  const sendMsg = msg => {
    if (window.opener) window.opener.postMessage(msg, '*');
  };

  window.onerror = function(msg, url, line, col, err) {
    sendMsg('[JS Error] ' + msg + ' (' + line + ':' + col + ')');
  };

  window.addEventListener('unhandledrejection', e => {
    let reason = e.reason;
    let text = '[Unhandled Rejection] ';
    if (reason && reason.message) text += reason.message;
    else text += String(reason);
    sendMsg(text);
  });

  try {
    ${userJs}
  } catch (e) {
    sendMsg('[JS Exception] ' + e.message);
  }
<\/script>
</body>
</html>`;

  const w = window.open();
  if (!w) {
    showMessage('Спливаюче вікно заблоковано. Скопіюй вручну.', 'warning', 2200);
    const blob = new Blob([payload], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    consoleBox.textContent += 'Відкрий вручну: ' + url + '\n';
    return;
  }
  w.document.open();
  w.document.write(payload);
  w.document.close();
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const html = htmlEditor.getValue();
  const css = `<style>${cssEditor.getValue()}</style>`;
  const js = `<script>${jsEditor.getValue()}<\/script>`;
  const content = `<!DOCTYPE html><html><head>${css}</head><body>${html}${js}</body></html>`;
  const blob = new Blob([content], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'index.html';
  a.click();
  showMessage('Збережено як index.html', 'primary', 1300);
});

document.getElementById('loadLastBtn').addEventListener('click', () => {
  loadSaved();
  showMessage('Завантажено останнє з локального сховища', 'info', 1200);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  htmlEditor.setValue('');
  cssEditor.setValue('');
  jsEditor.setValue('');
  consoleBox.textContent = '';
});

// Імпорт HTML
document.getElementById('importHtml').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const fr = new FileReader();
  fr.onload = ev => htmlEditor.setValue(ev.target.result);
  fr.readAsText(file);
});

// Переключатель консоли
document.getElementById('toggleConsoleBtn').addEventListener('click', () => {
  consoleBox.classList.toggle('d-none');
});

// Получение сообщений (ошибок) из второй вкладки
window.addEventListener('message', e => {
  consoleBox.classList.remove('d-none');
  consoleBox.textContent += e.data + '\n';
});
