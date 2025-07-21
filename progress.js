/* ===== настройка цели ===== */
const TARGET_SENTENCES = 1000;   // «100 % обучения» (меняйте под свои масштабы)

/* обновление бейджа */
function updateProgress(){
  const pct = Math.min(100, Math.round((corpus.length / TARGET_SENTENCES) * 100));
  document.getElementById('progress').textContent = pct + ' %';
}

/* вызывать один раз при загрузке */
updateProgress();

/* добавьте вызов в местах, где растёт corpus */
function trainFromText(){
  /* ...старый код... */
  saveAll();
  updateProgress();             // ← после сохранения
  append('ИИ',`Обучено предложений: ${s.length}`,'bot');
}

async function trainFromURL(){
  /* ...старый код... */
  saveAll();
  updateProgress();             // ←
  append('ИИ',`С URL обучено: ${s.length}`,'bot');
}

function importData(e){
  /* ...когда память восстанавливается... */
  saveAll();
  updateProgress();             // ←
  append('ИИ','Память восстановлена!','bot');
}
