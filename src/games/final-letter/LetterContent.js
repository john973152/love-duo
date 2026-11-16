/**
 * 第三幕 + 第四幕：信纸阅读场景
 * - 长信可滚动（手机优先），段落进入视口才逐字呈现
 * - 点击信纸可跳过当前段落打字机（不跳过内容）
 * - 拍立得照片随滚动浮现，配快门音效
 */
import { sfx } from '../../utils/sfx.js';
import { LETTER } from './content.js';
import { img } from '../../utils/image.js';

export function renderReading(root, { onAllRead }) {
  const S = LETTER.signature;
  root.insertAdjacentHTML('beforeend', `
    <div class="fl-reading">
      <div class="fl-paper">
        <div class="fl-paper-lines"></div>
        <div class="fl-letter-body" id="fl-body"></div>
      </div>
    </div>`);

  const body = root.querySelector('#fl-body');
  const textIdx = [];

  LETTER.sections.forEach((sec, i) => {
    if (sec.type === 'text') {
      const p = document.createElement('p');
      p.className = 'fl-line';
      p.dataset.text = sec.text;
      body.appendChild(p);
      textIdx.push(p);
    } else {
      const fig = document.createElement('figure');
      fig.className = 'fl-polaroid';
      fig.innerHTML = `
        <div class="pl-frame">
          <div class="pl-img">${img(sec.src, sec.caption)}</div>
          <figcaption>
            <span class="pl-cap">${sec.caption}</span>
            ${sec.date ? `<span class="pl-date">${sec.date}</span>` : ''}
          </figcaption>
        </div>`;
      body.appendChild(fig);
    }
  });

  const sig = document.createElement('div');
  sig.className = 'fl-signature';
  sig.innerHTML = `
    <p class="fl-sig-line">${S.lines[0]}</p>
    <p class="fl-sig-line">${S.lines[1]}</p>
    <div class="fl-keep-wrap" style="display:none">
      <button class="fl-btn" id="fl-keep">${S.keepBtn}</button>
    </div>`;
  body.appendChild(sig);

  // ---- 滚动进度控制：进入视口的段落开始打字机 ----
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const t = en.target;
      if (t.classList.contains('fl-line') && !t.dataset.started) {
        t.dataset.started = '1';
        typewriter(t);
      } else if (t.classList.contains('fl-polaroid') && !t.dataset.shown) {
        t.dataset.shown = '1';
        t.classList.add('shown');
        sfx.shutter();
      }
    });
  }, { root: root.querySelector('.fl-reading'), threshold: 0.25 });

  body.querySelectorAll('.fl-line, .fl-polaroid').forEach(n => io.observe(n));

  // 点击信纸 → 立刻补完当前正在打字的段落
  const paper = root.querySelector('.fl-paper');
  paper.addEventListener('click', () => {
    const typing = body.querySelector('.fl-line.typing');
    if (typing) finishTyping(typing);
  });

  // 落款进入视口 → 淡入 + 珍藏按钮
  const sigIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      sig.classList.add('shown');
      sfx.piano();
      setTimeout(() => { sig.querySelector('.fl-keep-wrap').style.display = ''; }, 1600);
      sigIO.disconnect();
    });
  }, { root: root.querySelector('.fl-reading'), threshold: 0.4 });
  sigIO.observe(sig);

  root.querySelector('#fl-keep').addEventListener('click', () => {
    io.disconnect(); sigIO.disconnect();
    onAllRead();
  });

  return () => { io.disconnect(); sigIO.disconnect(); };
}

/** 打字机逐字呈现（安静模式：不逐字发音，让用户专注阅读） */
function typewriter(p) {
  const text = p.dataset.text;
  p.classList.add('typing');
  let i = 0;
  p.__timer = setInterval(() => {
    i++;
    p.textContent = text.slice(0, i);
    if (i >= text.length) finishTyping(p);
  }, 65);
}

function finishTyping(p) {
  clearInterval(p.__timer);
  p.textContent = p.dataset.text;
  p.classList.remove('typing');
  p.classList.add('typed');
}
