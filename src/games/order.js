/**
 * 第 07 关：未来订单（多选 3 个愿望 → 生成订单卡片，可长按/截图保存）
 */
import { FUTURE } from '../data/content.js';
import { getState, patchState } from '../utils/storage.js';
import { confetti } from '../utils/fx.js';

export function render(el) {
  let picked = [...(getState().futureChoices || [])];
  const submitted = picked.length === 3 && getState().completedStages.includes('order');

  if (submitted) return renderOrder(picked);

  paint();

  function paint() {
    el.innerHTML = `
      <div class="game-wrap">
        <h2 class="game-title">${FUTURE.title}</h2>
        <p class="game-subtitle">${FUTURE.subtitle}（还差 <b id="left">${3 - picked.length}</b> 个）</p>

        <div class="wish-list">
          ${FUTURE.wishes.map((w, i) => `
            <button class="wish ${picked.includes(i) ? 'on' : ''}" data-i="${i}">
              <span class="wish-box">${picked.includes(i) ? '✓' : ''}</span>
              <span class="wish-text">${w}</span>
            </button>`).join('')}
        </div>

        <button class="btn btn-primary" id="submit" style="width:100%;margin-top:18px"
          ${picked.length === 3 ? '' : 'disabled'}>生成未来订单</button>
        <p class="quiz-note">订单不需要付款，由男朋友亲自配送</p>
      </div>`;

    el.querySelectorAll('.wish').forEach(b => b.addEventListener('click', () => toggle(Number(b.dataset.i))));
    const btn = el.querySelector('#submit');
    if (picked.length === 3) btn.addEventListener('click', submit);
  }

  function toggle(i) {
    if (picked.includes(i)) picked = picked.filter(x => x !== i);
    else {
      if (picked.length >= 3) return;
      picked.push(i);
    }
    patchState({ futureChoices: picked });
    paint();
  }

  function submit() {
    if (picked.length !== 3) return;
    confetti(30);
    renderOrder(picked);
    el.querySelector('#finish')?.addEventListener('click', () =>
      window.__complete('order', {
        title: '📜 未来已预约成功',
        text: '你的所有福利已全部领取完毕。', ctaText: '去领取终极福利 ›'
      }));
  }

  function renderOrder(choices) {
    el.innerHTML = `
      <div class="game-wrap">
        <h2 class="game-title">未来订单</h2>
        <p class="game-subtitle">这张订单永久有效，长按截图保存吧</p>

        <div class="order-card" id="order-card">
          <div class="order-head">LITTLE FISH · 未来订单</div>
          <div class="order-no">订单编号：FOREVER-${String(new Date().getFullYear()).slice(2)}0101</div>
          <ul class="order-items">
            ${choices.map(i => `<li>${FUTURE.wishes[i]}</li>`).join('')}
          </ul>
          <div class="order-meta">
            <p>${FUTURE.orderCard.amount}</p>
            <p>${FUTURE.orderCard.delivery}</p>
            <p>${FUTURE.orderCard.valid}</p>
            <p class="order-status">${FUTURE.orderCard.status}</p>
          </div>
          <div class="order-seal">💗</div>
        </div>

        <button class="btn btn-primary" id="finish" style="width:100%;margin-top:20px">领取终极福利 ›</button>
        <button class="btn btn-ghost" id="rechoose" style="width:100%;margin-top:10px">重新选择愿望</button>
      </div>`;

    el.querySelector('#rechoose').addEventListener('click', () => {
      picked = [];
      patchState({ futureChoices: [] });
      paint();
    });
    el.querySelector('#finish')?.addEventListener('click', () =>
      window.__complete('order', {
        title: '📜 未来已预约成功',
        text: '你的所有福利已全部领取完毕。', ctaText: '去领取终极福利 ›'
      }));
  }
}
