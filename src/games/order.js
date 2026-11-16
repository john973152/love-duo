/**
 * 第 07 关：未来订单（多选 3 个愿望 → 生成订单卡片，可长按/截图保存）
 * 愿望支持自定义：点"+"自己输入，与预设愿望一样可选。
 * 存档格式：futureChoices = 愿望文本数组；futureCustom = 自定义愿望文本数组。
 * 兼容旧存档（数字索引）自动迁移为文本。
 */
import { FUTURE } from '../data/content.js';
import { getState, patchState } from '../utils/storage.js';
import { confetti } from '../utils/fx.js';

/** 旧存档兼容：数字索引 → 文本 */
function normalizeChoices(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(v => typeof v === 'number' ? FUTURE.wishes[v] : v).filter(Boolean);
}

export function render(el) {
  let picked = normalizeChoices(getState().futureChoices);
  let custom = [...(getState().futureCustom || [])];
  const submitted = picked.length === 3 && getState().completedStages.includes('order');

  if (submitted) return renderOrder(picked);

  let adding = false;

  paint();

  function paint() {
    el.innerHTML = `
      <div class="game-wrap">
        <h2 class="game-title">${FUTURE.title}</h2>
        <p class="game-subtitle">${FUTURE.subtitle}（还差 <b id="left">${3 - picked.length}</b> 个）</p>

        <div class="wish-list">
          ${FUTURE.wishes.map(w => wishBtn(w, false)).join('')}
          ${custom.map(w => wishBtn(w, true)).join('')}
          <button class="wish wish-add ${adding ? 'adding' : ''}" id="add-wish" ${picked.length >= 3 ? 'disabled' : ''}>
            <span class="wish-box">＋</span>
            <span class="wish-text">${adding ? '写好点确认就加进来啦' : '添加我自己的愿望'}</span>
          </button>
        </div>

        ${adding ? `
          <div class="wish-input-row" id="wish-input-row">
            <input id="wish-input" type="text" maxlength="30" placeholder="写下一个想和我一起做的事…"
              autocomplete="off" enterkeyhint="done">
            <button class="btn btn-primary" id="wish-confirm">确认</button>
          </div>` : ''}

        <button class="btn btn-primary" id="submit" style="width:100%;margin-top:18px"
          ${picked.length === 3 ? '' : 'disabled'}>生成未来订单</button>
        <p class="quiz-note">订单不需要付款，由男朋友亲自配送</p>
      </div>`;

    function wishBtn(text, isCustom) {
      const on = picked.includes(text);
      return `
        <div class="wish-row">
          <button class="wish ${on ? 'on' : ''}" data-wish="${escapeAttr(text)}">
            <span class="wish-box">${on ? '✓' : ''}</span>
            <span class="wish-text">${escapeHtml(text)}</span>
          </button>
          ${isCustom ? `<button class="wish-del" data-del="${escapeAttr(text)}" aria-label="删除">✕</button>` : ''}
        </div>`;
    }

    el.querySelectorAll('.wish[data-wish]').forEach(b =>
      b.addEventListener('click', () => toggle(b.dataset.wish)));
    el.querySelectorAll('.wish-del').forEach(b =>
      b.addEventListener('click', () => removeCustom(b.dataset.del)));

    const addBtn = el.querySelector('#add-wish');
    addBtn?.addEventListener('click', () => {
      if (adding) return;
      adding = true;
      paint();
      const input = el.querySelector('#wish-input');
      input?.focus();
    });

    const confirmBtn = el.querySelector('#wish-confirm');
    if (confirmBtn) {
      const input = el.querySelector('#wish-input');
      const commit = () => {
        const text = (input.value || '').trim();
        if (!text) return;
        if (custom.includes(text) || FUTURE.wishes.includes(text)) {
          input.value = '';
          input.placeholder = '这条已经有啦，换一个～';
          return;
        }
        if (picked.length >= 3) return;
        custom.push(text);
        picked.push(text);
        patchState({ futureCustom: custom, futureChoices: picked });
        adding = false;
        paint();
      };
      confirmBtn.addEventListener('click', commit);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); });
    }

    const btn = el.querySelector('#submit');
    if (picked.length === 3) btn.addEventListener('click', submit);
  }

  function toggle(text) {
    if (picked.includes(text)) picked = picked.filter(x => x !== text);
    else {
      if (picked.length >= 3) return;
      picked.push(text);
    }
    patchState({ futureChoices: picked });
    paint();
  }

  function removeCustom(text) {
    custom = custom.filter(x => x !== text);
    picked = picked.filter(x => x !== text);
    patchState({ futureCustom: custom, futureChoices: picked });
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
            ${choices.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
