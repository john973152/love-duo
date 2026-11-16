/**
 * 第 01 关：幸运转盘（拼多多式）
 * 前几次必不中 → 弹出「邀请男朋友助力」→ 助力后下一抽必得终极大奖
 * Canvas 绘制 8 格转盘 + 缓动旋转 + 彩带特效
 */
import { WHEEL } from '../data/content.js';
import { getState, patchState } from '../utils/storage.js';
import { showModal } from '../components/Modal.js';
import { stageComplete } from '../scenes/stage.js';
import { confetti, toast } from '../utils/fx.js';
import { sfx } from '../utils/sfx.js';

const COLORS = ['#FFD45A', '#FFF0DA', '#FFB347', '#FFF6E8'];

function copyText(t) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch { /* noop */ }
    ta.remove();
  };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).catch(fallback);
  else fallback();
}

export function render(el) {
  const st = getState();
  const done = st.completedStages.includes('wheel');
  const already = st.claimedGifts.includes('wheel');
  let attempts = st.wheelAttempts || 0;
  let boosted = st.wheelBoosted || already; // 已通关过则直接必中

  el.innerHTML = `
    <div class="game-wrap">
      <h2 class="game-title">新人专享，首次抽奖 100% 中奖！</h2>
      <p class="game-subtitle" id="wheel-tip">${tipText()}</p>

      <div class="wheel-stage">
        <div class="wheel-pointer">▼</div>
        <div class="wheel-rotor" id="wheel-rotor">
          <canvas id="wheel-canvas" width="600" height="600"></canvas>
        </div>
        <button class="wheel-center" id="spin-btn">
          <span>${done ? '再玩一次' : '开始抽奖'}</span>
        </button>
      </div>

      <div class="wheel-prize-preview">
        ${WHEEL.prizes.map((p, i) => `<span class="prize-chip" style="--i:${i}">${p}</span>`).join('')}
      </div>

      ${already ? `<button class="btn btn-ghost" id="next-btn" style="width:100%;margin-top:18px">继续下一关 ›</button>` : ''}
    </div>`;

  const canvas = el.querySelector('#wheel-canvas');
  const rotor = el.querySelector('#wheel-rotor');
  const spinBtn = el.querySelector('#spin-btn');
  const tipEl = el.querySelector('#wheel-tip');
  drawWheel(canvas, WHEEL.prizes);

  function tipText() {
    if (boosted) return '助力成功 ✨ 这一抽必得终极大奖！';
    if (attempts >= WHEEL.fakeResults.length) return '已有 0 人助力 · 邀请男朋友助力后必得终极大奖';
    return done ? '你已经抽中过奖品啦，可再玩一次' : '每位新用户仅有一次机会，点击开始抽奖';
  }

  let spinning = false;
  let rotation = 0; // 当前角度（deg）

  spinBtn.addEventListener('click', () => {
    if (spinning) return;           // 防止重复点击启动多个动画
    spinning = true;
    spinBtn.disabled = true;
    spinBtn.classList.add('spinning');

    // 抽奖结果：已助力/已通关 → 终极大奖；否则按次数走「必不中」剧本
    const isGrand = boosted || already;
    const target = isGrand
      ? WHEEL.grandPrize
      : WHEEL.fakeResults[Math.min(attempts, WHEEL.fakeResults.length - 1)];

    const seg = 360 / WHEEL.prizes.length;
    const segCenter = target * seg + seg / 2;
    const start = rotation;
    const startMod = ((start % 360) + 360) % 360;
    const delta = (((360 - segCenter) - startMod) % 360 + 360) % 360;
    const total = start + delta + 360 * 5;
    const duration = 3800;
    const t0 = performance.now();
    sfx.whoosh();
    let lastSegIdx = -1;
    let lastTickAt = 0;

    function frame(now) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3.2); // easeOutCubic 变体
      rotation = start + (total - start) * eased;
      rotor.style.transform = `rotate(${rotation}deg)`;
      // 转盘每经过一格（指向新奖品）播放一次咔哒声，高速时自动节流
      const segIdx = Math.floor(rotation / seg);
      if (segIdx !== lastSegIdx && now - lastTickAt > 55) {
        lastSegIdx = segIdx;
        lastTickAt = now;
        sfx.tick();
      }
      if (p < 1) requestAnimationFrame(frame);
      else finish(isGrand, target);
    }
    requestAnimationFrame(frame);

    function finish(grand, target) {
      spinning = false;
      spinBtn.classList.remove('spinning');
      spinBtn.disabled = false;
      if (!grand) {
        attempts += 1;
        patchState({ wheelAttempts: attempts });
      }
      setTimeout(() => showResult(grand, target), 420);
    }
  });

  function showResult(grand, target) {
    if (grand) {
      confetti(40);
      sfx.grand();
      patchState({ claimedGifts: [...new Set([...getState().claimedGifts, 'wheel'])] });
      const firstTime = !getState().completedStages.includes('wheel');
      showModal({
        title: '🎉 ' + WHEEL.winText,
        html: `<div class="prize-big">终极大奖</div>
               <p style="margin-top:10px;font-size:13px;color:var(--c-text-light)">${WHEEL.thenText}</p>`,
        closable: false,
        buttons: [{
          text: firstTime ? '开始认证' : '继续下一关',
          onClick: () => stageComplete('wheel', {
            title: 'VIP 认证通道已开启', text: '请完成身份认证，激活你的专属福利。', ctaText: '去认证 ›'
          })
        }]
      });
      return;
    }

    const inviteBox = `
             <div class="invite-progress">
               <div class="ip-bar"><i style="width:${Math.min(attempts * 25, 50)}%"></i></div>
               <p class="ip-text">已有 0 人助力 · 助力成功后下一抽<b>必得终极大奖</b></p>
             </div>`;
    const inviteBtn = [{ text: '📣 邀请男朋友助力', primary: true, onClick: () => showInvite() }];

    // 第一次：真的中了 52 元券（拼多多式：中了也要助力才能到账）
    if (attempts === 1) {
      sfx.chime();
      confetti(15);
      showModal({
        title: WHEEL.prizeHitTitle.replace('{prize}', WHEEL.prizes[target]),
        html: `<p style="font-size:15px;line-height:1.8">${WHEEL.prizeHitText}</p>` + inviteBox,
        buttons: inviteBtn
      });
      return;
    }

    // 没抽中：拼多多式安慰 + 引导助力
    sfx.wrong();
    const tease = WHEEL.fakeTexts[Math.min(attempts - 1, WHEEL.fakeTexts.length - 1)]
      || WHEEL.fakeTexts[WHEEL.fakeTexts.length - 1];
    showModal({
      title: '💨 差一点点！',
      html: `<p style="font-size:15px;line-height:1.8">${tease}</p>` + inviteBox,
      buttons: inviteBtn
    });
  }

  function showInvite() {
    showModal({
      title: '💌 助力卡',
      html: `<p class="invite-tip">把下面这句话发给噜噜，等他答应后点下方按钮：</p>
             <div class="invite-msg">${WHEEL.inviteText}</div>
             <button class="btn btn-ghost" id="copy-invite" style="width:100%;margin-top:10px">📋 一键复制</button>`,
      buttons: [{
        text: '他已助力，马上再抽！',
        primary: true,
        onClick: () => {
          boosted = true;
          patchState({ wheelBoosted: true });
          tipEl.textContent = tipText();
          confetti(18);
          sfx.chime();
          toast('助力成功！这一抽必得终极大奖 ✨');
        }
      }],
      onMount: (m) => {
        m.el.querySelector('#copy-invite')?.addEventListener('click', () => {
          copyText(WHEEL.inviteText);
          toast('已复制，快去发给噜噜吧～');
        });
      }
    });
  }

  const nextBtn = el.querySelector('#next-btn');
  if (nextBtn) nextBtn.addEventListener('click', () => window.__navigateTo('quiz'));
}

function drawWheel(canvas, prizes) {
  const ctx = canvas.getContext('2d');
  const N = prizes.length, seg = (Math.PI * 2) / N;
  const cx = 300, cy = 300, R = 292;

  ctx.clearRect(0, 0, 600, 600);
  // 外圈
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = '#E83D32'; ctx.fill();

  for (let i = 0; i < N; i++) {
    const a0 = -Math.PI / 2 + i * seg, a1 = a0 + seg;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R - 14, a0, a1);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,61,50,.25)'; ctx.lineWidth = 2; ctx.stroke();

    // 奖品文字
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a0 + seg / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7A3B14';
    ctx.font = 'bold 26px system-ui,-apple-system,"PingFang SC",sans-serif';
    ctx.fillText(prizes[i], R - 46, 0);
    ctx.restore();
  }
  // 中心白圈
  ctx.beginPath(); ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();
}
