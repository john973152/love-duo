/**
 * 第一幕 + 第二幕：信封出现、拆信动画、收藏（第五幕）
 * 纯 DOM/CSS 3D 实现，所有视觉细节见 styles.css
 */
import { sfx } from '../../utils/sfx.js';
import { LETTER } from './content.js';

export function renderEnvelope(root, onOpened) {
  const E = LETTER.envelope;
  root.innerHTML = `
    <div class="fl-scene fl-act1">
      <div class="fl-room">
        <div class="fl-glow"></div>
        <div class="fl-dust">${'<i></i>'.repeat(14)}</div>
        <div class="fl-petals">${'<i></i>'.repeat(8)}</div>
        <div class="fl-desk"></div>
        <div class="fl-env-wrap">
          <div class="fl-env" id="fl-env">
            <div class="fl-env-back"></div>
            <div class="fl-paper-peek"><span>💌</span></div>
            <div class="fl-env-front"></div>
            <div class="fl-env-flap"></div>
            <div class="fl-seal" id="fl-seal"><span>❤</span></div>
            <div class="fl-env-addr">
              <p class="fl-env-to">${E.to}</p>
              <p class="fl-env-sub">${E.sub}</p>
            </div>
          </div>
        </div>
        <div class="fl-act1-text">
          <p class="fl-hint1">${E.hint1}</p>
          <p class="fl-hint2">${E.hint2}</p>
          <button class="fl-btn" id="fl-open">${E.btn}</button>
        </div>
      </div>
    </div>`;

  root.querySelector('#fl-open').addEventListener('click', () => {
    sfx.paper(0.3, 0.07);
    openSequence(root, onOpened);
  });
}

/** 第二幕：镜头推进 → 火漆裂纹 → 翻盖 → 信纸抽出 → 展开切换阅读 */
function openSequence(root, onOpened) {
  const env = root.querySelector('#fl-env');
  const wrap = root.querySelector('.fl-env-wrap');
  const act1Text = root.querySelector('.fl-act1-text');
  act1Text.classList.add('fade-out');

  const steps = [
    [200,  () => { wrap.classList.add('zooming'); sfx.paper(0.4, 0.06); }],
    [1500, () => { env.classList.add('cracking'); sfx.crack(); }],
    [2300, () => { env.classList.add('cracked'); burstHearts(root.querySelector('.fl-seal')); }],
    [3300, () => { env.classList.add('opened'); sfx.paper(0.5, 0.09); }],
    [4400, () => { env.classList.add('pulling'); sfx.paper(0.7, 0.10); }],
    [6000, () => onOpened()]
  ];
  steps.forEach(([t, fn]) => setTimeout(fn, t));
}

/** 火漆破开时的爱心粒子 */
function burstHearts(seal) {
  for (let i = 0; i < 10; i++) {
    const h = document.createElement('i');
    h.className = 'fl-heart-burst';
    h.textContent = '❤';
    h.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
    h.style.setProperty('--dy', `${-40 - Math.random() * 120}px`);
    h.style.setProperty('--rot', `${(Math.random() - 0.5) * 90}deg`);
    h.style.animationDelay = `${Math.random() * 0.25}s`;
    seal.appendChild(h);
  }
}

/** 第五幕：珍藏（信纸折回信封 → 邮戳 → 缩成纪念卡片） */
export function playKeepSequence(root, onDone) {
  sfx.paper(0.6, 0.09);
  const reading = root.querySelector('.fl-reading');
  reading?.classList.add('folding');

  setTimeout(() => {
    root.querySelector('.fl-act1')?.remove();
    const keep = document.createElement('div');
    keep.className = 'fl-scene fl-keep';
    keep.innerHTML = `
      <div class="fl-room">
        <div class="fl-glow"></div>
        <div class="fl-dust">${'<i></i>'.repeat(10)}</div>
        <div class="fl-env-wrap small">
          <div class="fl-env stamped">
            <div class="fl-env-back"></div>
            <div class="fl-env-front"></div>
            <div class="fl-env-flap closed"></div>
            <div class="fl-seal"><span>❤</span></div>
            <div class="fl-postmark">
              <span class="pm-ring"></span>
              <span class="pm-text">一周年纪念<br>ANNIVERSARY</span>
            </div>
          </div>
        </div>
        <p class="fl-keep-tip">已存入我们的纪念册 ✨</p>
      </div>`;
    root.appendChild(keep);
    sfx.chime();

    setTimeout(() => {
      keep.querySelector('.fl-env-wrap').classList.add('shrink');
      sfx.piano();
    }, 1600);

    setTimeout(onDone, 3800);
  }, 1400);
}
