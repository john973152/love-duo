/**
 * 第 02 关：恋爱答题（配置驱动，答错不失败）
 */
import { QUIZ } from '../data/content.js';
import { getState, patchState } from '../utils/storage.js';
import { showModal } from '../components/Modal.js';
import { confetti } from '../utils/fx.js';
import { sfx } from '../utils/sfx.js';

export function render(el) {
  const st = getState();
  let idx = 0;
  const retryCount = {};

  function paint() {
    const q = QUIZ.questions[idx];
    const isOpen = !q.options || q.options.length === 0;
    const opts = isOpen ? QUIZ.openOptions : q.options;

    el.innerHTML = `
      <div class="game-wrap">
        <h2 class="game-title">${QUIZ.title}</h2>
        <div class="quiz-progress">
          ${QUIZ.questions.map((_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}
        </div>
        <div class="card" style="padding:20px 16px">
          <div class="quiz-q"><span class="idx">Q${idx + 1}.</span> ${q.q}${q.snake ? '<span class="quiz-snake">🐍</span>' : ''}</div>
          <div id="opts" class="${q.bigA ? 'quiz-bigA' : ''}">
            ${opts.map((o, i) => `<button class="quiz-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join('')}
          </div>
          <div id="feedback"></div>
          <div id="next-wrap"></div>
        </div>
        <p class="quiz-note">答错了也没关系，男朋友允许你重新作答 ♡</p>
      </div>`;

    el.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => answer(Number(btn.dataset.i), isOpen, q));
    });
  }

  function answer(i, isOpen, q) {
    const fb = el.querySelector('#feedback');
    const nextWrap = el.querySelector('#next-wrap');
    const btn = el.querySelector(`.quiz-opt[data-i="${i}"]`);

    if (isOpen) {
      // 情感开放题：任意选择都算对
      el.querySelectorAll('.quiz-opt').forEach(b => b.classList.add('disabled'));
      btn.classList.add('correct');
      sfx.correct();
      fb.innerHTML = `<div class="quiz-feedback ok">男朋友：答对了！这道题没有标准答案，因为你怎么想都对 💗</div>`;
      confetti(12);
      showNext();
      return;
    }

    const correct = i === q.answer;
    if (correct) {
      el.querySelectorAll('.quiz-opt').forEach(b => b.classList.add('disabled'));
      btn.classList.add('correct');
      sfx.correct();
      fb.innerHTML = `<div class="quiz-feedback ok">✅ 认证通过，记忆芯片读取成功～<br>${q.praise || ''}</div>`;
      confetti(12);
      showNext();
    } else {
      retryCount[idx] = (retryCount[idx] || 0) + 1;
      btn.classList.add('wrong');
      sfx.wrong();
      setTimeout(() => btn.classList.remove('wrong'), 400);
      fb.innerHTML = `<div class="quiz-feedback err">
        ${q.hint || '哎呀，好像不太对呢。'}<br>${retryCount[idx] >= 2 ? QUIZ.wrongEgg : '再想一想吧～'}
      </div>`;
    }
  }

  function showNext() {
    const nextWrap = el.querySelector('#next-wrap');
    nextWrap.innerHTML = `<button class="btn btn-primary" style="width:100%;margin-top:12px">
      ${idx < QUIZ.questions.length - 1 ? '下一题 ›' : '生成认证卡 ›'}</button>`;
    nextWrap.querySelector('button').addEventListener('click', () => {
      if (idx < QUIZ.questions.length - 1) { idx++; paint(); }
      else showVipCard();
    });
  }

  function showVipCard() {
    patchState({ quizCompleted: true });
    const c = QUIZ.vipCard;
    el.innerHTML = `
      <div class="game-wrap">
        <h2 class="game-title">认证完成 🎉</h2>
        <div class="vip-cert">
          <div class="cert-shine"></div>
          <div class="cert-head">👑 ${c.title}</div>
          <div class="cert-row"><span>${c.user}</span></div>
          <div class="cert-row"><span>${c.level}</span></div>
          <div class="cert-row"><span>${c.privilege}</span></div>
          <div class="cert-row"><span>${c.valid}</span></div>
          <div class="cert-seal">LITTLE FISH</div>
        </div>
        <button class="btn btn-primary" id="go-next" style="width:100%;margin-top:22px">进入下一关 ›</button>
      </div>`;
    confetti(30);
    sfx.chime();
    el.querySelector('#go-next').addEventListener('click', () =>
      window.__complete('quiz', { title: '认证成功', text: 'VIP 专属福利已激活，继续解锁你的回忆吧。', ctaText: '继续 ›' }));
  }

  paint();
}
