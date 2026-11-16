/**
 * 视觉特效：彩带、闪光、星星
 */
export function confetti(count = 30) {
  const colors = ['#E83D32', '#FF8A38', '#FFD45A', '#FF6B9D', '#FFFFFF'];
  for (let i = 0; i < count; i++) {
    const d = document.createElement('i');
    d.className = 'confetti';
    d.style.left = Math.random() * 100 + 'vw';
    d.style.background = colors[(Math.random() * colors.length) | 0];
    d.style.animationDuration = (1.4 + Math.random() * 1.4) + 's';
    d.style.animationDelay = (Math.random() * 0.35) + 's';
    d.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.getElementById('fx-layer').appendChild(d);
    setTimeout(() => d.remove(), 3200);
  }
}

export function sparkle(x, y) {
  const s = document.createElement('div');
  s.className = 'sparkle-burst';
  s.style.left = x + 'px';
  s.style.top = y + 'px';
  s.textContent = '✨';
  document.getElementById('fx-layer').appendChild(s);
  setTimeout(() => s.remove(), 700);
}

/** 花瓣飘落（浪漫主题使用） */
export function petals(count = 14, duration = 9000) {
  const chars = ['🌸', '💗', '✿', '❀'];
  let n = 0;
  const timer = setInterval(() => {
    const p = document.createElement('span');
    p.className = 'petal';
    p.textContent = chars[(Math.random() * chars.length) | 0];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.fontSize = (12 + Math.random() * 10) + 'px';
    p.style.animationDuration = (6 + Math.random() * 5) + 's';
    document.getElementById('fx-layer').appendChild(p);
    setTimeout(() => p.remove(), 12000);
    if (++n > count) clearInterval(timer);
  }, duration / count);
}

/** 轻提示 toast（2 秒后自动消失） */
export function toast(msg) {
  let t = document.getElementById('ld-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'ld-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t.__timer);
  t.__timer = setTimeout(() => t.classList.remove('show'), 2000);
}
