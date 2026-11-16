/**
 * 寻宝房间 · 宝箱终极奖励流程（拼多多风格）
 * 宝箱开启 → 金光爱心 → 商品卡浮现 → 商品详情页 → 付款 → 订单 → 确认收货 → 评价 → 通关
 * 状态存于 treasureRoom.reward：none / paid / received / done，随时可退出重进。
 */
import { TREASURE_REWARD as R, TREASURE_UNITY as U } from '../data/content.js';
import { getState, patchState } from '../utils/storage.js';
import { showModal } from '../components/Modal.js';
import { stageComplete } from '../scenes/stage.js';
import { confetti, toast } from '../utils/fx.js';
import { sfx } from '../utils/sfx.js';

let overlay = null;

function setReward(v) {
  patchState({ treasureRoom: { ...getState().treasureRoom, reward: v } });
}

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'rw-mask';
  overlay.innerHTML = '<div class="rw-page" role="dialog"></div>';
  document.body.appendChild(overlay);
  return overlay;
}

/** 弹 showModal 时把奖励层压到弹窗之下，避免盖住收银台/评价弹窗 */
function lowerOverlay() { if (overlay) overlay.style.zIndex = 50; }
function raiseOverlay() { if (overlay) overlay.style.zIndex = ''; }

/** 同步房间内"我的订单"入口的显隐 */
function syncEntry() {
  const e = document.getElementById('reward-entry');
  if (!e) return;
  const tr = getState().treasureRoom;
  const rw = tr.reward || 'none';
  e.style.display = (tr.chestOpen && rw !== 'none' && rw !== 'done') ? '' : 'none';
}

function closeOverlay() {
  overlay?.remove();
  overlay = null;
  syncEntry();
}

/** 商品图：内嵌 SVG 暖手宝（无外部素材依赖，永不裂图） */
function warmArt() {
  return `
  <svg viewBox="0 0 200 150" aria-label="暖手宝">
    <defs>
      <linearGradient id="rww" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFD3DE"/><stop offset="1" stop-color="#F8A8BF"/>
      </linearGradient>
    </defs>
    <rect x="45" y="30" width="110" height="86" rx="34" fill="url(#rww)" stroke="#E88BA8" stroke-width="3"/>
    <ellipse cx="100" cy="112" rx="40" ry="6" fill="#E88BA8" opacity=".35"/>
    <path d="M100,86 c-12,-11 -22,-18 -22,-27 c0,-7 5.6,-11.4 11.8,-11.4 c4,0 7.6,2 10.2,5.2 c2.6,-3.2 6.2,-5.2 10.2,-5.2 c6.2,0 11.8,4.4 11.8,11.4 c0,9 -10,16 -22,27 Z" fill="#E75A7C"/>
    <circle cx="76" cy="52" r="3" fill="#fff" opacity=".8"/>
    <rect x="88" y="16" width="24" height="9" rx="4" fill="#C0607E"/>
    <rect x="95" y="6" width="10" height="12" rx="3" fill="#C0607E"/>
  </svg>`;
}

/** 商品卡从宝箱浮出（由 treasure.js 在开箱动画后调用） */
export function showRewardCard(hostEl, onOpen) {
  hostEl.querySelector('.rw-card-float')?.remove();
  const card = document.createElement('button');
  card.className = 'rw-card-float';
  card.type = 'button';
  card.innerHTML = `
    <span class="rc-shine">✨</span>
    <span class="rc-reveal">${R.reveal.lines[0]}</span>
    <span class="rc-reveal sub">${R.reveal.lines[1]}</span>
    <span class="rc-art">${warmArt()}</span>
    <span class="rc-name">${R.product.name}</span>
    <span class="rc-tip">—— 轻点拆开惊喜 ——</span>`;
  card.addEventListener('click', () => { card.remove(); openProductPage(); }, { once: true });
  hostEl.appendChild(card);
  sfx.chime();
}

// ---------------- 商品详情页 ----------------
export function openProductPage() {
  sfx.pop();
  const ov = ensureOverlay();
  const p = R.product;
  ov.querySelector('.rw-page').innerHTML = `
    <button class="rw-close" type="button" aria-label="关闭">×</button>
    <div class="rw-gallery">${warmArt()}</div>
    <div class="rw-body">
      <div class="rw-price-row">
        <span class="rw-price"><i>¥</i>${p.price}</span>
        <s class="rw-origin">¥${p.originPrice}</s>
        <span class="rw-sold">${p.sold}</span>
      </div>
      <h3 class="rw-name">${p.name}</h3>
      <p class="rw-tagline">${p.tagline}</p>
      <ul class="rw-highlights">${p.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
      <p class="rw-service">${p.service}</p>
    </div>
    <div class="rw-footer">
      <button class="rw-buy" type="button">立即购买 · 选择付款方式</button>
    </div>`;

  ov.querySelector('.rw-close').addEventListener('click', () => { closeOverlay(); });
  ov.querySelector('.rw-buy').addEventListener('click', () => showPaymentSheet());
}

function showPaymentSheet() {
  lowerOverlay(); // 收银台弹窗要显示在商品页之上
  const m = showModal({
    title: '💰 收银台 · 选择付款方式',
    closable: true,
    onClose: raiseOverlay,
    html: `<p class="rw-pay-tip">本商品已由男朋友全额承包，随便选～</p>`,
    buttons: R.payments.map(pay => ({
      text: pay.name,
      className: 'btn rw-pay-btn',
      onClick: () => { m.close(); paySuccess(); }
    }))
  });
  // 附加描述文字
  const btns = m.el.querySelectorAll('.rw-pay-btn');
  R.payments.forEach((pay, i) => {
    const desc = document.createElement('span');
    desc.className = 'rw-pay-desc';
    desc.textContent = pay.desc;
    btns[i]?.appendChild(desc);
  });
}

function paySuccess() {
  sfx.coin();
  const ov = ensureOverlay();
  ov.querySelector('.rw-page').innerHTML = `
    <div class="rw-paying">
      <div class="rw-check"><i></i></div>
      <p class="rw-pay-ok">${R.paySuccess}</p>
      <p class="rw-pay-sub">正在为你生成专属订单…</p>
    </div>`;
  setTimeout(() => {
    setReward('paid');
    raiseOverlay();
    openOrderPage();
    syncEntry();
  }, 1600);
}

// ---------------- 订单详情页 ----------------
export function openOrderPage() {
  const o = R.order;
  const step = getState().treasureRoom.reward || 'paid';
  const ov = ensureOverlay();
  ov.querySelector('.rw-page').innerHTML = `
    <button class="rw-close" type="button" aria-label="关闭">×</button>
    <div class="rw-order-head">
      <p class="rw-status">${step === 'received' ? '已签收 · 快去评价吧' : o.status}</p>
      <p class="rw-eta">预计送达：${o.eta}</p>
    </div>
    <div class="rw-card">
      <div class="rw-mini-art">${warmArt()}</div>
      <div class="rw-card-info">
        <p class="rw-card-name">${R.product.name}</p>
        <p class="rw-card-spec">×1 · 冬季限定 · 周年纪念款</p>
      </div>
    </div>
    <div class="rw-card rw-courier">
      <p class="rw-row"><span>配送员</span><b>${o.courierName}</b></p>
      <p class="rw-row"><span>联系方式</span><b>-${o.courierNote}</b></p>
      <p class="rw-row"><span>订单编号</span><b>${o.no}</b></p>
    </div>
    <div class="rw-card rw-timeline">
      ${o.timeline.map((n, i) => `
        <div class="rw-node ${i < 3 ? 'done' : ''}">
          <i class="rw-dot"></i>
          <div><p class="rw-nt">${n.t}</p><p class="rw-nd">${n.d}</p></div>
        </div>`).join('')}
    </div>
    <div class="rw-footer">
      ${step === 'paid' ? `<button class="rw-buy" id="rw-confirm" type="button">${o.confirmBtn}</button>` : ''}
      ${step === 'received' ? `<button class="rw-buy" id="rw-review" type="button">${o.reviewBtn}</button>` : ''}
      <button class="rw-back" id="rw-back" type="button">${o.backBtn}</button>
    </div>`;

  ov.querySelector('.rw-close').addEventListener('click', closeOverlay);
  ov.querySelector('#rw-back').addEventListener('click', closeOverlay);
  ov.querySelector('#rw-confirm')?.addEventListener('click', () => {
    sfx.chime();
    setReward('received');
    toast(o.confirmToast);
    confetti(15);
    openOrderPage(); // 重渲染：出现评价按钮
    syncEntry();
  });
  ov.querySelector('#rw-review')?.addEventListener('click', openReviewModal);
}

// ---------------- 商品评价 ----------------
export function openReviewModal() {
  const rv = R.review;
  lowerOverlay(); // 评价弹窗要显示在订单页之上
  const m = showModal({
    title: rv.title,
    closable: false,
    onClose: raiseOverlay,
    html: `<p class="rw-review-tip">${rv.tip}</p>`,
    buttons: [
      { text: rv.best, id: 'rw-best', className: 'btn', onClick: () => finishReview(m) },
      ...rv.others.map(label => ({
        text: label, className: 'btn btn-ghost rw-other', close: false,
        onClick: () => { sfx.wrong(); toast(rv.otherHint); }
      }))
    ]
  });
}

function finishReview(m) {
  setReward('done');
  sfx.grand();
  confetti(40);
  toast(R.review.successText);
  m.close();
  closeOverlay();
  document.getElementById('reward-entry')?.style.setProperty('display', 'none');
  setTimeout(() => stageComplete('treasure', { ...U.chest.done }), 400);
}
