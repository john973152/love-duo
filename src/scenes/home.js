/**
 * 首页 —— LITTLE FISH 一周年超级福利节（电商促销风格）
 */
import { HOME, STAGES } from '../data/content.js';
import { CONFIG } from '../config.js';
import { getState, goToStage, resetProgress, completeStage } from '../utils/storage.js';
import { toast } from '../utils/fx.js';
import { showModal } from '../components/Modal.js';
import { img } from '../utils/image.js';

const STAGE_ICONS = ['🏪', '🎡', '📝', '🧩', '🔍', '📖', '⏳', '📜', '🎬'];

export function renderHome(el) {
  const st = getState();
  const canResume = st.completedStages.length > 0 && st.completedStages.length < STAGES.length - 1;
  const nextStage = STAGES[Math.min(st.currentStage, STAGES.length - 1)];

  el.innerHTML = `
    <div class="shop-topbar">
      <div class="shop-logo">LITTLE <span class="duo">FISH</span></div>
      <div class="shop-search">
        🔍 <input id="egg-search" placeholder="${HOME.searchPlaceholder}" />
      </div>
      <button class="shop-cs" id="cs-btn" aria-label="客服">🧸</button>
    </div>

    <section class="promo-banner">
      <span class="promo-tag">限时免费领</span>
      <h1>${CONFIG.eventName}</h1>
      <p class="sub">${CONFIG.siteName} 年度唯一超级 VIP 专属福利</p>
      <div class="countdown">⏰ 活动期限：永久有效</div>
    </section>

    <section class="vip-card">
      <div class="vip-title">👑 ${HOME.vipText} <span class="badge">超级 VIP</span></div>
      <div style="font-size:13px;margin:8px 0;color:var(--c-text-light)">${HOME.participants}</div>
      <p style="font-size:14px;font-weight:600">${HOME.announcement.split('\n')[2]}</p>
      <ul class="vip-list">
        ${HOME.benefitList.map(b => `<li>${b}</li>`).join('')}
      </ul>
      <p class="warm-tip">${HOME.warmTip}</p>
    </section>

    <!-- 章节导航：7 项隐藏福利进度 -->
    <section class="stage-nav">
      <h4>🎁 我的隐藏福利（共 7 项）</h4>
      <div class="stage-grid">
        ${STAGES.filter(s => s.game && s.game !== 'final').map((s, i) => `
          <button class="stage-item ${itemState(s)}" data-stage="${s.id}">
            <span class="ico">${STAGE_ICONS[i + 1]}</span>
            <span>${s.name}</span>
          </button>`).join('')}
      </div>
    </section>

    ${canResume ? `
      <button class="btn btn-ghost cta-resume" data-stage="${nextStage.id}" style="width:100%;margin-bottom:10px">
        ▶ 继续上次的惊喜（${nextStage.name}）
      </button>` : ''}

    <button class="cta-big" id="claim-btn">${HOME.ctaText}</button>

    <footer class="footer-note">
      — LITTLE FISH 专属福利 · 仅限一位幸运用户 —
      <span class="rule-hidden" id="hidden-rule">活动规则：${HOME.hiddenRule}</span>
    </footer>
  `;

  // ---- 交互绑定 ----
  // 立即领取：进入下一未完成章节
  el.querySelector('#claim-btn').addEventListener('click', () => {
    const target = STAGES.find(s => s.game && !st.completedStages.includes(s.id));
    window.__navigateTo(target ? target.id : 'final');
  });

  // 章节导航点击
  el.querySelectorAll('[data-stage]').forEach(b =>
    b.addEventListener('click', () => {
      if (b.classList.contains('done')) {
        toast('该福利已领取，不可重复参与哦～');
        return;
      }
      window.__navigateTo(b.dataset.stage);
    }));

  // 活动规则弹窗（含隐藏彩蛋规则）
  el.querySelector('#hidden-rule').addEventListener('click', () => showModal({
    title: '活动规则',
    html: [...HOME.benefitList, HOME.warmTip, `活动规则：${HOME.hiddenRule}`].join('\n'),
    buttons: [{ text: '我知道了' }]
  }));

  // 搜索框彩蛋
  const search = el.querySelector('#egg-search');
  search.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const kw = search.value.trim();
    const egg = HOME.searchEggs.find(x => kw.includes(x.keyword));
    showModal({
      title: '搜索结果',
      html: egg ? egg.reply : `没有找到「${kw || '…'}」相关的商品。\n不过你的男朋友正在努力上线中。`,
      buttons: [{ text: '哈哈，好的' }]
    });
    search.value = '';
  });

  // 客服机器人
  el.querySelector('#cs-btn').addEventListener('click', () => {
    showModal({
      title: '🧸 专属客服',
      html: HOME.customerService.map(c =>
        `<div style="text-align:left;margin-bottom:10px">
           <b>Q：${c.q}</b><br>
           <span style="color:var(--c-text-light)">A：${c.a}</span>
         </div>`).join(''),
      buttons: [{ text: '谢谢客服小姐姐' }]
    });
  });

  // 重新开始入口（长按底部 "仅限一位幸运用户" 触发，二次确认）
  const note = el.querySelector('.footer-note');
  let holdTimer = null;
  note.addEventListener('touchstart', startHold);
  note.addEventListener('touchend', cancelHold);
  note.addEventListener('mousedown', startHold);
  note.addEventListener('mouseup', cancelHold);
  function startHold() { holdTimer = setTimeout(askReset, 1200); }
  function cancelHold() { clearTimeout(holdTimer); }
  function askReset() {
    showModal({
      title: '⚠️ 重新开始',
      html: '确定要清空所有进度，从头开始这段惊喜吗？\n（此操作无法恢复）',
      buttons: [
        { text: '取消', className: 'btn-ghost' },
        { text: '确认重新开始', onClick: () => { resetProgress(); location.reload(); } }
      ]
    });
  }
}

function itemState(s) {
  const st = getState();
  if (st.completedStages.includes(s.id)) return 'done';
  if (st.unlockedStages.includes(s.id)) return 'current';
  return 'locked';
}
