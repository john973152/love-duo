/**
 * 第 05 关：秘密房间（H5 原生版 · 移动端优先）
 * 纯 SVG + CSS 动画实现，秒开、微信稳定、竖屏友好。
 * JavaScript 是唯一权威状态源：谜题校验 / 存档 / 弹窗 / 道具栏。
 * 存档结构（treasureRoom）与旧版完全兼容。
 */
import { TREASURE_UNITY as U, TREASURE_REWARD as RW } from '../data/content.js';
import { getState, patchState } from '../utils/storage.js';
import { showModal } from '../components/Modal.js';
import { confetti, toast, sparkle } from '../utils/fx.js';
import { sfx } from '../utils/sfx.js';
import { showRewardCard, openProductPage, openOrderPage } from './treasure-reward.js';

const CLUE_NAMES = { lamp: '💡 灯下纸条', drawer: '🪙 抽屉硬币', photo: '🖼️ 照片背面', shelf: '🔖 暗格书签' };
const VB_W = 400, VB_H = 560;

// 书架三本书：槽位左边缘（viewBox 单位）
const SLOT_X = [40, 64, 88];
// 书架初始顺序（打乱；正确答案是 heart → star → moon）
const INITIAL_ORDER = ['star', 'moon', 'heart'];

export function render(el) {
  const room = () => getState().treasureRoom;

  el.innerHTML = `
    <div class="game-wrap treasure-h5">
      <h2 class="game-title">${U.title}</h2>
      <p class="game-subtitle">${U.subtitle}（已收集线索 <span id="t-clue-count">0</span>/4）</p>

      <div class="room-viewport" id="room-vp">
        <div class="zoom-back" id="zoom-back">↩ 轻点空白处返回全景</div>
        ${roomSVG()}
      </div>

      <div class="u-inventory" id="t-inventory">
        <span class="u-chip" data-inv="key" style="display:none">🔑 银色小钥匙</span>
        <span class="u-chip" data-inv="lamp" style="display:none">${CLUE_NAMES.lamp}</span>
        <span class="u-chip" data-inv="drawer" style="display:none">${CLUE_NAMES.drawer}</span>
        <span class="u-chip" data-inv="photo" style="display:none">${CLUE_NAMES.photo}</span>
        <span class="u-chip" data-inv="shelf" style="display:none">${CLUE_NAMES.shelf}</span>
      </div>

      <button class="reward-entry" id="reward-entry" data-silent type="button" style="display:none">${RW.entryText}</button>
    </div>`;

  const vp = el.querySelector('#room-vp');
  const svg = el.querySelector('svg.room-svg');
  const scene = el.querySelector('#t-scene');

  // ---------------- 书架 ----------------
  let bookSlots = room().bookshelfSolved ? [...U.books.correct] : [...INITIAL_ORDER];
  let picked = -1, swapping = false;

  // ---------------- 镜头推进 ----------------
  function zoomTo(cx, cy, s) {
    scene.style.transform = `translate(${VB_W / 2 - s * cx}px, ${VB_H / 2 - s * cy}px) scale(${s})`;
    vp.classList.add('zoomed');
  }
  function resetZoom() {
    scene.style.transform = '';
    vp.classList.remove('zoomed');
  }
  const zoomOf = g => {
    const [cx, cy, s] = (g.dataset.zoom || '').split(',').map(Number);
    return { cx, cy, s: s || 2.2 };
  };

  // ---------------- 点击分发 ----------------
  svg.addEventListener('click', e => {
    const g = e.target.closest('g[data-id], g[data-book]');
    if (!g) { if (vp.classList.contains('zoomed')) resetZoom(); return; }
    if (g.classList.contains('locked-out')) return;
    sparkle(...screenCenter(g));
    if (g.dataset.book !== undefined) return onBookTap(g);
    switch (g.dataset.id) {
      case 'diary': return openRiddle();
      case 'lamp': return onLamp(g);
      case 'clue_lamp': return openClue('lamp');
      case 'drawer': return onDrawer(g);
      case 'clue_drawer': return openClue('drawer');
      case 'doll': return onDoll(g);
      case 'envelope': return onEnvelope(g);
      case 'photo1': return openPhoto();
      case 'bookshelf':
        if (!room().bookshelfSolved) toast('书脊上有三个小图案…把书摆成合适的顺序试试？');
        return;
      case 'clue_shelf': return openClue('shelf');
      case 'chest': return onChest();
      case 'rug': return onRug(g);
    }
  });

  function screenCenter(g) {
    const b = g.getBoundingClientRect();
    return [b.left + b.width / 2, b.top + b.height / 2];
  }

  // ---------------- 机关一：台灯谜语（整蛊开放题：第一次必被拒绝，换个答案即通过） ----------------
  function openRiddle() {
    if (room().diaryDone) { toast('日记本已经读过啦，去点亮台灯吧～'); return; }
    zoomTo(74, 323, 2.4);
    sfx.paper(0.4, 0.06);   // 翻开日记的纸张声
    const m = showModal({
      title: '📖 神秘日记',
      closable: false,
      onClose: resetZoom,
      html: `
        <p class="u-modal-line">「欢迎来到秘密房间。」</p>
        <p class="u-modal-line">「回答我一个问题，我就让你点亮台灯。」</p>
        <p class="u-modal-question">${U.riddle.question}</p>
        <input id="u-riddle-input" class="u-input" maxlength="20" placeholder="写下你的答案…" autocomplete="off">
        <p class="u-feedback" id="u-riddle-fb"></p>`,
      buttons: [
        { text: '确认', id: 'u-riddle-ok', close: false, onClick: () => submit() }
      ]
    });
    const box = m.el;
    const input = box.querySelector('#u-riddle-input');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    const norm = s => (s || '').replace(/[\s，。？！、,.?!]/g, '');
    function setFb(text, bad = true) {
      const fb = box.querySelector('#u-riddle-fb');
      fb.textContent = text;
      fb.classList.toggle('bad', bad);
    }
    function submit() {
      const val = (input.value || '').trim();
      if (!val) return setFb('先写点什么嘛～');
      const first = room().riddleFirst;
      if (!first) {
        // 第一次回答：无论答什么都拒绝，并悄悄记下来
        patchState({ treasureRoom: { ...room(), riddleFirst: norm(val) } });
        sfx.wrong();
        setFb(U.riddle.firstWrong[Math.floor(Math.random() * U.riddle.firstWrong.length)]);
        input.value = '';
        input.focus();
      } else if (norm(val) === first) {
        // 第二次还答一样的：继续拒绝
        sfx.wrong();
        setFb(U.riddle.repeatWrong);
        input.value = '';
        input.focus();
      } else {
        // 换了答案：通过！
        patchState({ treasureRoom: { ...room(), diaryDone: true } });
        sfx.correct();
        toast('💡 ' + U.riddle.success);
        updateHints();
        m.close();
      }
    }
  }

  // ---------------- 机关二：台灯 ----------------
  function onLamp(g) {
    if (!room().diaryDone) {
      shake(g); toast('台灯好像没反应…先看看桌上的日记本吧。'); return;
    }
    if (room().lampOn) { toast('台灯正亮着呢，看看灯下的纸条～'); return; }
    patchState({ treasureRoom: { ...room(), lampOn: true } });
    sfx.pop();
    applyRoom();
    updateHints();
  }

  // ---------------- 机关三：床头柜抽屉 ----------------
  function onDrawer(g) {
    if (room().drawerOpen) { openClue('drawer'); return; } // 抽屉开着时点柜子=直接看硬币
    if (!room().dollDone) { shake(g); toast('床头柜锁住了…好像需要一把钥匙。'); return; }
    patchState({ treasureRoom: { ...room(), drawerOpen: true } });
    sfx.wood();   // 木质抽屉滑动声
    zoomTo(342, 380, 2.2);
    applyRoom();
    updateHints();
    setTimeout(resetZoom, 1600);
  }

  // ---------------- 机关四：玩偶与信封 ----------------
  function onDoll(g) {
    if (room().dollDone) { toast('玩偶已经被你翻过啦，信封还在旁边～'); return; }
    g.classList.remove('wiggle'); void g.getBoundingClientRect(); g.classList.add('wiggle');
    sfx.pop();
    setTimeout(() => {
      svg.querySelector('[data-id="envelope"]')?.classList.add('revealed');
      toast('玩偶后面掉出来一个信封！');
      updateHints();
    }, 600);
  }
  function onEnvelope(g) {
    if (room().dollDone) { toast('信封已经拆过啦。'); return; }
    g.classList.add('opening');
    setTimeout(() => g.classList.add('opened'), 650);
    sfx.unlock();   // 拆信封 + 金属扣件感
    patchState({ treasureRoom: { ...room(), dollDone: true } });
    setTimeout(() => {
      toast('🔑 获得道具：银色小钥匙！');
      updateInventory(); updateHints();
    }, 700);
  }

  // ---------------- 机关五：照片墙（调查 + 翻面） ----------------
  function openPhoto() {
    const { cx, cy } = zoomOf(svg.querySelector('[data-id="photo1"]'));
    zoomTo(cx, cy, 2.6);
    setTimeout(() => {
      const backText = U.photoBack[0] || '照片背面空空的…';
      const m = showModal({
        title: '🖼️ 拍立得照片',
        onClose: resetZoom,
        html: `
          <div class="ph-flip">
            <div class="ph-card" id="ph-card">
              <div class="ph-face ph-front"><img src="${U.photos[0]}" alt="我们的照片"
                onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'img-placeholder',textContent:'📷 待替换：${U.photos[0]}'}))"></div>
              <div class="ph-face ph-back"><p>${backText}</p><p class="u-clue-line">${U.clues.photo}</p></div>
            </div>
            <p class="ph-tip">轻点照片，看看背面写了什么 ✍️</p>
          </div>`,
        buttons: [{ text: '收好照片', onClick: () => {
          if (!room().photoClue) {
            patchState({ treasureRoom: { ...room(), photoClue: true, cluesFound: addClue('photo') } });
            updateInventory(); updateHints();
          }
        } }]
      });
      m.el.querySelector('#ph-card').addEventListener('click', () => {
        m.el.querySelector('#ph-card').classList.toggle('flipped');
        sfx.tick();
      });
    }, 650);
  }

  // ---------------- 机关六：书架 ----------------
  function onBookTap(g) {
    if (room().bookshelfSolved) { toast('书已经摆对啦，暗格都打开了～'); return; }
    if (swapping) return;
    const slot = bookSlots.indexOf(g.dataset.book);
    zoomTo(80, 152, 2.4);
    if (picked === -1) {
      picked = slot;
      svg.querySelector(`.t-book[data-slot="${slot}"]`)?.classList.add('selected');
      return;
    }
    if (picked === slot) {
      picked = -1;
      g.classList.remove('selected');
      return;
    }
    // 交换两本书
    swapping = true;
    const a = svg.querySelector(`.t-book[data-slot="${picked}"]`);
    a.classList.remove('selected');
    [bookSlots[picked], bookSlots[slot]] = [bookSlots[slot], bookSlots[picked]];
    a.dataset.slot = slot; g.dataset.slot = picked;
    a.style.transform = `translate(${SLOT_X[slot]}px, 0)`;
    g.style.transform = `translate(${SLOT_X[picked]}px, 0)`;
    sfx.tick();
    picked = -1;
    setTimeout(() => {
      swapping = false;
      if (bookSlots.join() === U.books.correct.join()) onShelfSolved();
    }, 520);
  }

  function onShelfSolved() {
    patchState({ treasureRoom: { ...room(), bookshelfSolved: true } });
    sfx.correct();
    toast('✨ ' + U.books.solved);
    applyRoom();
    updateHints();
  }

  // ---------------- 线索弹窗（可随时点开重新查看） ----------------
  function openClue(key) {
    const already = room().cluesFound.includes(key);
    sfx.chime();
    showModal({
      title: '✨ ' + (already ? '线索回顾' : '发现线索'),
      html: `<p class="u-clue-line">${U.clues[key]}</p>`,
      buttons: [{ text: already ? '再看一遍' : '记下了！', onClick: () => {
        if (already) return;
        patchState({ treasureRoom: { ...room(), cluesFound: addClue(key) } });
        updateInventory(); updateHints();
        if (room().cluesFound.length >= 4) {
          confetti(20);
          toast('四位密码集齐啦！快回到暗门前去开箱！');
        }
      } }]
    });
  }

  function addClue(key) {
    const list = [...room().cluesFound];
    if (!list.includes(key)) list.push(key);
    return list;
  }

  // ---------------- 机关七：地毯、暗门与宝箱 ----------------
  function onRug(g) {
    if (room().chestOpen) { onChest(); return; }
    if (room().rugLifted) { onChest(); return; }
    // 任何时候掀开地毯都能发现暗门和宝箱——先见宝箱，后找密码
    zoomTo(196, 500, 1.7);
    sfx.cloth();  // 布料摩擦声（掀地毯）
    svg.querySelector('[data-id="rug"]')?.classList.add('lifted');
    svg.querySelector('.trapdoor')?.classList.add('revealed');
    svg.querySelector('.chest')?.classList.add('risen');
    patchState({ treasureRoom: { ...room(), rugLifted: true } });
    updateHints();
    setTimeout(() => {
      toast('地毯下面竟然藏着一扇暗门！里面有个上锁的宝箱…');
      openPassword();
    }, 1400);
  }

  function onChest() {
    const rw = room().reward || 'none';
    if (room().chestOpen) {
      // 宝箱已开：按奖励进度路由
      if (rw === 'none') { showRewardCard(el.querySelector('#room-vp')); return; }
      if (rw === 'paid' || rw === 'received') { openOrderPage(); return; }
      toast('宝箱已经打开啦～'); // done：通关弹窗流程已走完
      return;
    }
    zoomTo(196, 495, 1.8);
    setTimeout(openPassword, 380);
  }

  function openPassword() {
    const m = showModal({
      title: '🔒 ' + U.chest.title,
      closable: true, // 可随时返回退出，回去再找密码
      onClose: () => { if (!room().chestOpen) resetZoom(); },
      html: `
        <p class="u-modal-line">${U.chest.desc}</p>
        <input id="u-pwd-input" class="u-input u-input-pwd" inputmode="numeric" maxlength="4" placeholder="····" autocomplete="off">
        <p class="u-feedback" id="u-pwd-fb"></p>`,
      buttons: [
        { text: '开箱！', id: 'u-pwd-ok', close: false, onClick: () => submit() },
        { text: '先回去逛逛', className: 'btn-ghost' }
      ]
    });
    const input = m.el.querySelector('#u-pwd-input');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    function submit() {
      const val = (input.value || '').trim();
      if (val === U.chest.password) {
        patchState({ treasureRoom: { ...room(), chestOpen: true } });
        sfx.coin();
        m.close();
        openChestAnim();
      } else {
        // 密码错误：不给任何提示，只清空输入框
        input.value = '';
        input.classList.remove('shake'); void input.getBoundingClientRect();
        input.classList.add('shake');
      }
    }
  }

  function openChestAnim() {
    const chest = svg.querySelector('.chest');
    chest?.classList.add('opening');
    sfx.win();
    // 金光（chest-glow）+ 彩带 + 爱心粒子
    setTimeout(() => { confetti(40); spawnHearts(); }, 700);
    // 商品卡从宝箱浮现 → 点击进入商品详情页
    setTimeout(() => showRewardCard(el.querySelector('#room-vp')), 1500);
  }

  /** 宝箱上方飘起爱心粒子 */
  function spawnHearts() {
    const vp = el.querySelector('#room-vp');
    for (let i = 0; i < 14; i++) {
      const h = document.createElement('span');
      h.className = 'rw-heart';
      h.textContent = Math.random() > .5 ? '❤' : '💗';
      h.style.left = (28 + Math.random() * 44) + '%';
      h.style.animationDelay = (Math.random() * .9) + 's';
      h.style.fontSize = (12 + Math.random() * 14) + 'px';
      vp.appendChild(h);
      setTimeout(() => h.remove(), 3200);
    }
  }

  // ---------------- 状态应用 / 提示 / 道具栏 ----------------
  function applyRoom() {
    const r = room();
    svg.querySelector('.lamp-glow')?.classList.toggle('on', r.lampOn);
    svg.querySelector('[data-id="clue_lamp"]')?.classList.toggle('revealed', r.lampOn);
    svg.querySelector('.drawer-front')?.classList.toggle('open', r.drawerOpen);
    svg.querySelector('[data-id="clue_drawer"]')?.classList.toggle('revealed', r.drawerOpen);
    svg.querySelector('[data-id="envelope"]')?.classList.toggle('revealed', r.dollDone);
    if (r.dollDone) svg.querySelector('[data-id="envelope"]')?.classList.add('opened');
    // 书架
    svg.querySelectorAll('.t-book').forEach(b => {
      const s = bookSlots.indexOf(b.dataset.book);
      b.dataset.slot = s;
      b.style.transform = `translate(${SLOT_X[s]}px, 0)`;
      b.classList.toggle('solved-book', r.bookshelfSolved);
    });
    svg.querySelector('.shelf-slot')?.classList.toggle('revealed', r.bookshelfSolved);
    svg.querySelector('[data-id="clue_shelf"]')?.classList.toggle('revealed', r.bookshelfSolved);
    // 暗门与宝箱
    if (r.rugLifted || r.chestOpen) {
      svg.querySelector('[data-id="rug"]')?.classList.add('lifted');
      svg.querySelector('.trapdoor')?.classList.add('revealed');
      const chest = svg.querySelector('.chest');
      chest?.classList.add('risen');
      if (r.chestOpen) chest?.classList.add('opening');
    }
    // 奖励订单入口（宝箱已开且奖励流程进行中才显示）
    const entry = el.querySelector('#reward-entry');
    if (entry) {
      const rw = r.reward || 'none';
      entry.style.display = (r.chestOpen && rw !== 'none' && rw !== 'done') ? '' : 'none';
    }
  }

  function updateHints() {
    const r = room();
    const want = {
      diary: !r.diaryDone,
      lamp: r.diaryDone && !r.lampOn,
      clue_lamp: r.lampOn && !r.cluesFound.includes('lamp'),
      doll: !r.dollDone,
      envelope: !r.dollDone && svg.querySelector('[data-id="envelope"]')?.classList.contains('revealed'),
      drawer: r.dollDone && !r.drawerOpen,
      clue_drawer: r.drawerOpen && !r.cluesFound.includes('drawer'),
      photo1: !r.photoClue,
      clue_shelf: r.bookshelfSolved && !r.cluesFound.includes('shelf'),
      rug: !r.rugLifted && !r.chestOpen,
      chest: r.rugLifted && !r.chestOpen
    };
    Object.entries(want).forEach(([id, on]) => {
      svg.querySelector(`[data-id="${id}"]`)?.classList.toggle('hint', !!on);
    });
    svg.querySelectorAll('.t-book').forEach(b =>
      b.classList.toggle('hint', !r.bookshelfSolved));
  }

  function updateInventory() {
    const r = room();
    el.querySelector('#t-clue-count').textContent = r.cluesFound.length;
    const map = {
      key: r.dollDone,
      lamp: r.cluesFound.includes('lamp'),
      drawer: r.cluesFound.includes('drawer'),
      photo: r.cluesFound.includes('photo'),
      shelf: r.cluesFound.includes('shelf')
    };
    Object.entries(map).forEach(([k, on]) => {
      const chip = el.querySelector(`[data-inv="${k}"]`);
      if (chip) chip.style.display = on ? '' : 'none';
    });
  }

  function shake(g) {
    g.classList.remove('shake'); void g.getBoundingClientRect();
    g.classList.add('shake');
  }

  // 初始化
  el.querySelector('#reward-entry')?.addEventListener('click', () => openOrderPage());
  applyRoom();
  updateInventory();
  updateHints();
}

// =========================================================
// 场景 SVG（竖屏 5:7，桌面端以卡片形式呈现，手机端铺满宽度）
// =========================================================
function roomSVG() {
  return `
<svg class="room-svg" viewBox="0 0 400 560" preserveAspectRatio="xMidYMid meet" aria-label="秘密房间">
  <defs>
    <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF4E4"/><stop offset="1" stop-color="#FFE4C4"/>
    </linearGradient>
    <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E9C79E"/><stop offset="1" stop-color="#D9AE7E"/>
    </linearGradient>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2E3A63"/><stop offset="1" stop-color="#56629A"/>
    </linearGradient>
    <radialGradient id="lampG" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#FFD98A" stop-opacity=".85"/>
      <stop offset="1" stop-color="#FFD98A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moonG" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#FFF6D8" stop-opacity=".9"/>
      <stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="goldG" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#FFE9A8" stop-opacity=".95"/>
      <stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <g id="t-scene">
    <!-- 墙面与地板 -->
    <rect width="400" height="432" fill="url(#wallG)"/>
    <rect y="432" width="400" height="128" fill="url(#floorG)"/>
    <g stroke="#C89B6C" stroke-width="2" opacity=".5">
      <line x1="0" y1="470" x2="400" y2="470"/><line x1="0" y1="512" x2="400" y2="512"/>
    </g>
    <rect y="428" width="400" height="7" fill="#B98A5F" opacity=".55"/>
    <path d="M-5,18 Q100,44 200,22 T405,20" fill="none" stroke="#C9975D" stroke-width="2"/>
    <g>
      <circle class="bulb" cx="30" cy="30" r="5" fill="#FFD866"/>
      <circle class="bulb b2" cx="90" cy="38" r="5" fill="#FF9FB2"/>
      <circle class="bulb b3" cx="150" cy="32" r="5" fill="#9FE0FF"/>
      <circle class="bulb b4" cx="390" cy="28" r="5" fill="#FFD866"/>
      <circle class="bulb b5" cx="392" cy="40" r="4" fill="#FF9FB2"/>
    </g>

    <!-- 窗户与夜空 -->
    <g>
      <rect x="243" y="42" width="115" height="150" rx="8" fill="#C08A58"/>
      <rect x="251" y="50" width="99" height="134" rx="4" fill="url(#skyG)"/>
      <circle cx="322" cy="88" r="26" fill="url(#moonG)"/>
      <circle cx="322" cy="88" r="14" fill="#FFF3C9"/>
      <circle cx="317" cy="84" r="3" fill="#F0E2A8" opacity=".8"/>
      <circle cx="326" cy="92" r="2.2" fill="#F0E2A8" opacity=".8"/>
      <g fill="#FFFFFF">
        <circle class="star s1" cx="266" cy="72" r="1.8"/><circle class="star s2" cx="286" cy="104" r="1.5"/>
        <circle class="star s3" cx="334" cy="126" r="1.8"/><circle class="star s4" cx="270" cy="136" r="1.4"/>
        <circle class="star s5" cx="302" cy="158" r="1.6"/><circle class="star s6" cx="336" cy="64" r="1.3"/>
      </g>
      <rect x="296" y="50" width="4" height="134" fill="#C08A58"/>
      <rect x="251" y="114" width="99" height="4" fill="#C08A58"/>
      <path class="curtain" d="M243,42 q10,72 -6,150 h-14 V42 Z" fill="#F2A48D" opacity=".9"/>
      <path class="curtain c2" d="M358,42 q-8,72 6,150 h12 V42 Z" fill="#F2A48D" opacity=".9"/>
    </g>

    <!-- 浮尘 -->
    <g fill="#FFDFAE">
      <circle class="dust d1" cx="120" cy="330" r="2.5"/><circle class="dust d2" cx="210" cy="300" r="2"/>
      <circle class="dust d3" cx="300" cy="330" r="2.5"/><circle class="dust d4" cx="70" cy="290" r="1.8"/>
    </g>

    <!-- 书架（机关六） -->
    <g data-id="bookshelf" data-zoom="80,152,2.4">
      <rect x="20" y="96" width="122" height="158" rx="7" fill="#C08A58"/>
      <rect x="28" y="104" width="106" height="142" rx="4" fill="#B97F50"/>
      <rect x="28" y="176" width="106" height="7" rx="2" fill="#8A6040"/>
      <rect x="28" y="240" width="106" height="6" rx="2" fill="#8A6040"/>
      <!-- 装饰书 -->
      <rect x="114" y="130" width="12" height="46" rx="2" fill="#7FA8E8"/>
      <rect x="30" y="206" width="14" height="34" rx="2" fill="#F08A7E" opacity=".85"/>
      <!-- 暗格 -->
      <g class="shelf-slot">
        <rect x="52" y="210" width="58" height="26" rx="4" fill="#4A3222"/>
        <g data-id="clue_shelf" data-zoom="80,220,2.8" style="cursor:pointer">
          <rect class="hit" x="50" y="200" width="62" height="40" fill="#fff" fill-opacity="0"/>
          <rect x="72" y="214" width="12" height="22" rx="2" fill="#F06292"/>
          <rect x="75" y="206" width="6" height="12" rx="2" fill="#FFD866"/>
        </g>
      </g>
      <!-- 三本书（由 JS 摆放） -->
      <g class="t-book" data-book="heart" data-slot="0" style="cursor:pointer;transition:transform .5s cubic-bezier(.34,1.3,.64,1)">
        <rect class="hit" x="-7" y="124" width="34" height="60" fill="#fff" fill-opacity="0" pointer-events="all"/>
        <rect x="0" y="132" width="20" height="48" rx="2" fill="#F0A8A0"/>
        <rect x="2" y="134" width="4" height="44" rx="2" fill="#E8896B"/>
        <path d="M10,166 c-4,-4 -7,-6.5 -7,-9.5 c0,-2.4 2,-4 4.2,-4 c1.2,0 2.2,.6 2.8,1.5 c.6,-.9 1.6,-1.5 2.8,-1.5 c2.2,0 4.2,1.6 4.2,4 c0,3 -3,5.5 -7,9.5 Z" fill="#C94F4F"/>
      </g>
      <g class="t-book" data-book="star" data-slot="1" style="cursor:pointer;transition:transform .5s cubic-bezier(.34,1.3,.64,1)">
        <rect class="hit" x="-7" y="124" width="34" height="60" fill="#fff" fill-opacity="0" pointer-events="all"/>
        <rect x="0" y="132" width="20" height="48" rx="2" fill="#F5D090"/>
        <rect x="2" y="134" width="4" height="44" rx="2" fill="#E8B44F"/>
        <path d="M10,152 l2.6,5.4 6,.8 -4.3,4.2 1,6 -5.3,-2.8 -5.3,2.8 1,-6 -4.3,-4.2 6,-.8 Z" fill="#C98A2A"/>
      </g>
      <g class="t-book" data-book="moon" data-slot="2" style="cursor:pointer;transition:transform .5s cubic-bezier(.34,1.3,.64,1)">
        <rect class="hit" x="-7" y="124" width="34" height="60" fill="#fff" fill-opacity="0" pointer-events="all"/>
        <rect x="0" y="132" width="20" height="48" rx="2" fill="#C4B4EC"/>
        <rect x="2" y="134" width="4" height="44" rx="2" fill="#9F8AD8"/>
        <path d="M14,163 a7.5,7.5 0 1,1 -4.5,-13.5 a6,6 0 1,0 4.5,13.5 Z" fill="#7A5FC0"/>
      </g>
    </g>

    <!-- 照片墙（机关五，只挂一张） -->
    <g data-id="photo1" data-zoom="196,115,2.6" style="cursor:pointer">
      <rect class="hit" x="164" y="80" width="64" height="70" fill="#fff" fill-opacity="0" pointer-events="all"/>
      <g transform="rotate(-3 196 115)">
        <rect x="168" y="84" width="56" height="62" rx="3" fill="#FFFDF6" stroke="#C08A58" stroke-width="2.5"/>
        <image href="${U.photos[0]}" x="172" y="88" width="48" height="46" preserveAspectRatio="xMidYMid slice"
          onerror="this.style.display='none'"/>
        <path d="M172,148 q24,-18 48,0 Z" fill="#F2A48D" opacity=".55"/>
      </g>
      <path class="tape" d="M186,80 l20,-4 2,8 -20,4 Z" fill="#FFE396" opacity=".9"/>
    </g>

    <!-- 书桌（日记 + 台灯） -->
    <g>
      <rect x="24" y="336" width="146" height="11" rx="3" fill="#C08A58"/>
      <rect x="30" y="347" width="134" height="32" rx="4" fill="#D9A86C"/>
      <rect x="30" y="347" width="134" height="8" rx="4" fill="#E3B67C"/>
      <circle cx="97" cy="364" r="2.6" fill="#8A6040"/>
      <rect x="28" y="379" width="8" height="53" fill="#B98A5F"/>
      <rect x="158" y="379" width="8" height="53" fill="#B98A5F"/>
    </g>
    <!-- 台灯 -->
    <g data-id="lamp" data-zoom="143,312,2.4" style="cursor:pointer">
      <rect class="hit" x="112" y="284" width="62" height="56" fill="#fff" fill-opacity="0" pointer-events="all"/>
      <circle class="lamp-glow" cx="143" cy="312" r="62" fill="url(#lampG)"/>
      <rect x="141" y="300" width="4" height="34" fill="#8A6040"/>
      <ellipse cx="143" cy="335" rx="14" ry="3.6" fill="#8A6040"/>
      <path d="M128,302 h30 l-6,-16 h-18 Z" fill="#F5C168"/>
      <ellipse cx="143" cy="302" rx="16" ry="3.4" fill="#FFE396"/>
    </g>
    <!-- 日记本 -->
    <g data-id="diary" data-zoom="74,323,2.6" style="cursor:pointer">
      <rect class="hit" x="38" y="300" width="70" height="40" fill="#fff" fill-opacity="0" pointer-events="all"/>
      <rect x="44" y="312" width="58" height="22" rx="3" fill="#E8896B"/>
      <rect x="44" y="312" width="58" height="6" rx="3" fill="#F2997B"/>
      <line x1="50" y1="323" x2="96" y2="323" stroke="#FFF4E4" stroke-width="2"/>
      <path d="M88,318 q6,5 0,10" fill="none" stroke="#FFF4E4" stroke-width="2"/>
    </g>
    <!-- 灯下纸条（机关二线索） -->
    <g data-id="clue_lamp" data-zoom="114,330,3" style="cursor:pointer">
      <rect class="hit" x="96" y="314" width="40" height="30" fill="#fff" fill-opacity="0"/>
      <g class="paper-note">
        <rect x="104" y="324" width="22" height="13" rx="1.5" fill="#FFFDF6" stroke="#E8C79E" stroke-width="1.5"/>
        <line x1="107" y1="328" x2="123" y2="328" stroke="#D9A86C" stroke-width="1.2"/>
        <line x1="107" y1="331.5" x2="119" y2="331.5" stroke="#D9A86C" stroke-width="1.2"/>
        <text x="115" y="336.5" text-anchor="middle" font-size="6" fill="#C94F4F" font-weight="bold">1</text>
      </g>
    </g>

    <!-- 床头柜与抽屉（机关三） -->
    <g data-id="drawer" data-zoom="342,380,2.2" style="cursor:pointer">
      <rect class="hit" x="294" y="340" width="96" height="92" fill="#fff" fill-opacity="0" pointer-events="all"/>
      <rect x="298" y="346" width="88" height="10" rx="3" fill="#B98A5F"/>
      <rect x="302" y="356" width="80" height="72" rx="5" fill="#C08A58"/>
      <rect class="drawer-front" x="308" y="364" width="68" height="26" rx="4" fill="#D9A86C" stroke="#8A6040" stroke-width="1.5"/>
      <circle cx="342" cy="377" r="3.4" fill="#7A4A18"/>
      <rect x="308" y="396" width="68" height="26" rx="4" fill="#D9A86C" opacity=".6"/>
      <circle cx="342" cy="409" r="3.4" fill="#7A4A18" opacity=".6"/>
      <rect x="306" y="428" width="6" height="6" fill="#B98A5F"/><rect x="378" y="428" width="6" height="6" fill="#B98A5F"/>
      <g data-id="clue_drawer" data-zoom="342,380,3" style="cursor:pointer">
        <circle class="hit" cx="342" cy="377" r="24" fill="#fff" fill-opacity="0"/>
        <g class="coin">
          <circle cx="342" cy="377" r="7" fill="#F5C168" stroke="#C98A2A" stroke-width="1.5"/>
          <text x="342" y="380.5" text-anchor="middle" font-size="8" fill="#8A6040" font-weight="bold">1</text>
        </g>
      </g>
    </g>

    <!-- 毛绒玩偶与信封（机关四） -->
    <g data-id="doll" data-zoom="226,398,2.2" style="cursor:pointer">
      <rect class="hit" x="196" y="356" width="60" height="76" fill="#fff" fill-opacity="0" pointer-events="all"/>
      <circle cx="216" cy="374" r="9" fill="#C9975D"/><circle cx="238" cy="374" r="9" fill="#C9975D"/>
      <circle cx="216" cy="374" r="4" fill="#F3D3AE"/><circle cx="238" cy="374" r="4" fill="#F3D3AE"/>
      <ellipse cx="227" cy="392" rx="17" ry="15" fill="#D9A86C"/>
      <circle cx="227" cy="382" r="10" fill="#D9A86C"/>
      <ellipse cx="227" cy="386" rx="3.8" ry="3" fill="#F3D3AE"/>
      <circle cx="223.6" cy="380" r="1.4" fill="#4A3222"/><circle cx="230.4" cy="380" r="1.4" fill="#4A3222"/>
      <path d="M225,384 q2,2 4,0" stroke="#4A3222" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="221" cy="404" rx="7" ry="5" fill="#C9975D"/>
      <ellipse cx="233" cy="404" rx="7" ry="5" fill="#C9975D"/>
    </g>
    <g data-id="envelope" data-zoom="268,420,3" style="cursor:pointer">
      <rect class="hit" x="242" y="398" width="52" height="42" fill="#fff" fill-opacity="0"/>
      <g class="envelope-body">
        <rect x="250" y="408" width="38" height="26" rx="2.5" fill="#FFFDF6" stroke="#E8C79E" stroke-width="1.5"/>
        <path class="env-flap" d="M250,410 l19,13 19,-13" fill="none" stroke="#E8C79E" stroke-width="1.5"/>
        <circle cx="269" cy="427" r="4.5" fill="#F2A48D"/>
        <path d="M266,426 q3,-4 6,0" fill="none" stroke="#fff" stroke-width="1.2"/>
      </g>
    </g>

    <!-- 暗门（机关七：掀开地毯后露出） -->
    <g class="trapdoor">
      <rect x="130" y="450" width="132" height="90" rx="7" fill="#8A6040"/>
      <rect x="138" y="458" width="116" height="76" rx="4" fill="#3A2414"/>
      <rect x="138" y="458" width="116" height="76" rx="4" fill="none" stroke="#6B4426" stroke-width="2"/>
      <circle cx="150" cy="530" r="3.5" fill="#F5C168" stroke="#C98A2A" stroke-width="1.2"/>
      <circle cx="242" cy="530" r="3.5" fill="#F5C168" stroke="#C98A2A" stroke-width="1.2"/>
    </g>
    <!-- 宝箱（机关七） -->
    <g class="chest" data-id="chest" style="cursor:pointer">
      <rect class="hit" x="138" y="436" width="116" height="88" fill="#fff" fill-opacity="0" pointer-events="all"/>
      <circle class="chest-glow" cx="196" cy="498" r="72" fill="url(#goldG)"/>
      <g class="chest-lid">
        <path d="M148,470 v-14 a10,10 0 0,1 10,-10 h76 a10,10 0 0,1 10,10 v14 Z" fill="#B97F50"/>
        <rect x="148" y="464" width="96" height="7" rx="2" fill="#8A6040"/>
      </g>
      <rect x="146" y="472" width="100" height="48" rx="5" fill="#C08A58"/>
      <rect x="150" y="476" width="92" height="8" rx="3" fill="#D9A86C"/>
      <rect x="188" y="472" width="16" height="16" rx="3" fill="#F5C168" stroke="#C98A2A" stroke-width="1.5"/>
      <circle cx="196" cy="480" r="3" fill="#8A6040"/>
    </g>
    <g data-id="rug" data-zoom="196,500,1.7" style="cursor:pointer">
      <rect class="hit" x="80" y="466" width="236" height="84" fill="#fff" fill-opacity="0" pointer-events="all"/>
      <g class="rug">
        <ellipse cx="196" cy="508" rx="118" ry="34" fill="#F2A48D" opacity=".75"/>
        <ellipse cx="196" cy="508" rx="94" ry="25" fill="#F6BCA6" opacity=".7"/>
        <ellipse cx="196" cy="508" rx="64" ry="16" fill="#F2A48D" opacity=".55"/>
      </g>
    </g>

    <!-- 猫咪 -->
    <g class="cat">
      <ellipse cx="296" cy="500" rx="24" ry="12" fill="#F5C168"/>
      <circle cx="317" cy="492" r="10.5" fill="#F5C168"/>
      <path class="cat-tail" d="M274,500 q-15,-4 -13,-19" stroke="#F5C168" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M310,484 l3,-7 5,6 Z" fill="#F5C168"/><path d="M320,483 l3,-7 5,6 Z" fill="#F5C168"/>
      <path d="M312,493 q2,2 4,0 M318,493 q2,2 4,0" stroke="#8A6040" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </g>

    <!-- 花盆与礼物盒 -->
    <g>
      <g stroke="#7FA86B" stroke-width="2.5" fill="none">
        <path d="M44,466 q-6,-22 2,-38"/><path d="M44,466 q10,-24 4,-40"/><path d="M44,466 q-14,-16 -12,-34"/>
      </g>
      <circle cx="47" cy="424" r="7" fill="#F49CB0"/><circle cx="49" cy="422" r="3" fill="#FBD3DC"/>
      <circle cx="32" cy="432" r="6.4" fill="#F6B26B"/><circle cx="33" cy="430" r="2.6" fill="#FDE3C2"/>
      <circle cx="57" cy="434" r="6.4" fill="#E88FB4"/><circle cx="58" cy="432" r="2.6" fill="#FBD9E6"/>
      <path d="M31,466 h27 l-4,42 h-19 Z" fill="#9FB8E8"/>
      <path d="M35,466 l6,42" stroke="#C7D6F2" stroke-width="2.5" fill="none"/>
    </g>
    <g>
      <rect x="330" y="496" width="46" height="38" rx="4" fill="#F06292"/>
      <rect x="330" y="508" width="46" height="9" fill="#E84A80"/>
      <rect x="349" y="496" width="8" height="38" fill="#FFD866"/>
      <path d="M353,496 q-12,-14 -2,-16 q8,-1 4,15 Z" fill="#FFD866"/>
      <path d="M353,496 q12,-14 2,-16 q-8,-1 -4,15 Z" fill="#FFD866"/>
    </g>
  </g>
</svg>`;
}
