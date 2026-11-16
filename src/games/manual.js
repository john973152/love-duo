/**
 * 第 05 关：男朋友使用说明书 V2.0
 * 每页带专属动画插画 + 两处长按互动（亲亲开机 / 指纹确认收货）
 */
import { MANUAL } from '../data/content.js';
import { getState } from '../utils/storage.js';
import { confetti } from '../utils/fx.js';

let kissActivated = false; // 会话内记忆：亲亲开机后保持激活状态

export function render(el) {
  let page = 0; // 0 = 封面，1..n = 内容页
  const total = MANUAL.pages.length + 1;
  const done = getState().completedStages.includes('manual');

  paint();

  /* ---------- 每页专属动画插画 ---------- */
  function artHtml(kind) {
    switch (kind) {
      case 'name':
        return `<div class="art art-name">
          <span class="an-heart h1">💗</span>
          <span class="an-heart h2">💛</span>
          <span class="an-heart h3">💗</span>
          <div class="an-avatar">🧑🏻‍💼</div>
          <div class="an-badge">噜噜 · 限量款</div>
          <div class="an-tag">全球仅此一件 ♡</div>
        </div>`;
      case 'params':
        return `<div class="art art-params">${MANUAL.params.map(([k, v], i) =>
          `<div class="pr-row" style="animation-delay:${.15 + i * .12}s"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
      case 'features':
        return `<div class="art art-features">${MANUAL.features.map((f, i) =>
          `<div class="ft-chip" style="animation-delay:${.15 + i * .14}s">${f}</div>`).join('')}
          <div class="ft-more" style="animation-delay:1.1s">……以及一切你能想到的</div></div>`;
      case 'kiss':
        return kissActivated ? `
          <div class="art art-kiss on">
            <div class="ka-couple">🧑🏻‍💼💋👩🏻</div>
            <div class="ka-status">● ONLINE — 待命中</div>
            <div class="ka-bubbles">${'<i>💗</i>'.repeat(6)}</div>
          </div>` : `
          <div class="art art-kiss">
            <button class="ka-btn" id="kiss-btn"><span>💋</span></button>
            <div class="ka-ring"><i id="kiss-fill"></i></div>
            <div class="ka-tip" id="kiss-tip">${MANUAL.kissTip}</div>
          </div>`;
      case 'warning':
        return `<div class="art art-warning">
          <div class="wa-icon">⚠️</div>
          <div class="wa-scan"></div>
          <div class="wa-glitch">想念模式：待触发</div>
        </div>`;
      case 'warranty':
        return `<div class="art art-warranty">
          <div class="we-shield">🛡️</div>
          <div class="we-bar"><i></i></div>
          <div class="we-inf">∞</div>
        </div>`;
      case 'service':
        return `<div class="art art-service">
          <div class="se-headset">🎧</div>
          <div class="se-stamp">随时受理<br>无休</div>
        </div>`;
      case 'seal':
        return `<div class="art art-seal">
          <div class="sy-lock">🔒</div>
          <div class="sy-code">防伪码：520 · 1314</div>
          <div class="sy-stamp">正版认证</div>
        </div>`;
    }
    return '';
  }

  /* ---------- 长按通用逻辑 ---------- */
  function bindHold(btn, fillEl, dur, onDone) {
    let t0 = null, raf = null, finished = false;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      if (fillEl) fillEl.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      if (p >= 1) { if (!finished) { finished = true; onDone(); } stop(); return; }
      raf = requestAnimationFrame(tick);
    };
    const start = e => {
      if (finished) return;
      e.preventDefault();
      btn.classList.add('holding');
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      btn.classList.remove('holding');
      if (!finished && fillEl) fillEl.style.setProperty('--p', '0%');
    };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop);
    btn.addEventListener('touchcancel', stop);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
  }

  /* ---------- 页面渲染 ---------- */
  function paint() {
    const isCover = page === 0;
    const p = isCover ? null : MANUAL.pages[page - 1];
    const last = page === total - 1;

    el.innerHTML = `
      <div class="game-wrap">
        <div class="book" id="book">
          <div class="book-page v2 ${isCover ? 'cover' : ''}" id="book-page">
            ${isCover ? `
              <div class="cover-float">
                <span class="cf h1">💗</span><span class="cf h2">✨</span><span class="cf h3">💛</span>
              </div>
              <div class="cover-avatar">🧑🏻‍💼💗</div>
              <div class="cover-title">${MANUAL.title}</div>
              <div class="cover-sub">${MANUAL.coverSubtitle}</div>
              <div class="cover-edge"></div>
            ` : `
              <div class="page-no">${page} / ${MANUAL.pages.length}</div>
              <h3 class="page-h">${p.h}</h3>
              ${artHtml(p.art)}
              ${p.t ? `<p class="page-t">${p.t}</p>` : ''}
              ${last ? `<button class="fp-btn" id="fingerprint">
                  <i class="fp-ring"><b id="fp-fill"></b></i>
                  <svg class="fp-emoji" viewBox="0 0 64 64" aria-hidden="true">
                    <g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round">
                      <path d="M20 50c-4-9-4-19 0-26"/>
                      <path d="M27 53c-4-10-4-24 1-32"/>
                      <path d="M35 54c-4-11-3-26 2-33"/>
                      <path d="M43 51c-3-9-2-20 2-26"/>
                      <path d="M48 44c-1-5-1-9 1-13"/>
                      <path d="M32 33c-2 6-1 13 2 19"/>
                    </g>
                  </svg>
                </button>
                <div class="fp-tip" id="fp-tip">${MANUAL.confirmText}</div>` : ''}
            `}
          </div>
        </div>

        <div class="book-nav">
          <button class="btn btn-ghost" id="prev" ${page === 0 ? 'disabled style="opacity:.4"' : ''}>‹ 上一页</button>
          <span class="book-dots">${Array.from({ length: total }, (_, i) =>
            `<i class="${i === page ? 'on' : ''}"></i>`).join('')}</span>
          <button class="btn btn-ghost" id="next" ${page === total - 1 ? 'disabled style="opacity:.4"' : ''}>下一页 ›</button>
        </div>

        ${done && !last ? `<button class="btn btn-ghost" id="skip" style="width:100%;margin-top:14px">继续下一关 ›</button>` : ''}
      </div>`;

    const pageEl = el.querySelector('#book-page');
    el.querySelector('#prev')?.addEventListener('click', () => { if (page > 0) { page--; flip(); } });
    el.querySelector('#next')?.addEventListener('click', () => { if (page < total - 1) { page++; flip(); } });
    el.querySelector('#skip')?.addEventListener('click', () => window.__navigateTo('timeline'));
    el.querySelector('#fingerprint')?.addEventListener('click', e => e.preventDefault());

    // 指纹确认收货（最后一页）
    const fp = el.querySelector('#fingerprint');
    if (fp) bindHold(fp, el.querySelector('#fp-fill'), 1300, confirmUse);

    // 亲亲开机（使用方法页）
    const kb = el.querySelector('#kiss-btn');
    if (kb) bindHold(kb, el.querySelector('#kiss-fill'), 900, () => {
      kissActivated = true;
      confetti(14);
      paint();
      const status = el.querySelector('.ka-status');
      if (status) status.textContent = MANUAL.kissDone;
    });

    function flip() {
      pageEl.classList.add('flipping');
      setTimeout(() => { paint(); }, 180);
    }
  }

  /* ---------- 确认收货 → 绑定动画 ---------- */
  function confirmUse() {
    confetti(36);
    el.innerHTML = `
      <div class="game-wrap heart-anim-wrap">
        <div class="bd-card">
          <div class="bd-ring"></div>
          <div class="bd-boy">🧑🏻‍💼</div>
          <div class="bd-hearts">${'<i>💗</i>'.repeat(7)}</div>
          <h2 class="game-title">已确认收货</h2>
          <div class="bd-lines">
            <p>✔ 专属男朋友已永久绑定</p>
            <p>✔ 唯一用户：小鱼</p>
            <p>✔ 感谢你的确认收货 ♡</p>
          </div>
        </div>
        <button class="btn btn-primary" id="go" style="width:100%;margin-top:22px">继续下一关 ›</button>
      </div>`;
    el.querySelector('#go').addEventListener('click', () =>
      window.__complete('manual', { title: '📖 说明书已签收', text: '本产品已绑定唯一用户，不可更换使用对象。', ctaText: '继续下一关 ›' }));
  }
}
