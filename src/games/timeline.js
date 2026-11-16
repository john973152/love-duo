/**
 * ============================================================
 *  第 06 关：365 DAYS — OUR STORY（沉浸式滚动纪念册版）
 *  - PART 01 电影式开场（衬线大标题 + 真实起止日期 + 开场照片）
 *  - PART 02 全部时间点按日期顺序渲染为独立回忆章节，交替 5 种拍立得布局
 *  - PART 03 第一个特殊互动：回忆填空（配置在 CONFIG.capsule.quiz）
 *  - fillDate 节点：她手动补记日期（双通道：手输 + 原生日期选择器）
 *  - PART 07 结尾章节：渐进淡入文案 + 空白拍立得 + 进入下一关
 *  - 动画：IntersectionObserver 显影（只触发一次）+ prefers-reduced-motion 降级
 *  - 进度：复用 timelineViewed / timelineDates / timelineQuizDone，刷新可恢复
 * ============================================================
 */
import { CONFIG } from '../config.js';
import { getState, patchState } from '../utils/storage.js';
import { showModal } from '../components/Modal.js';
import { confetti, toast, petals } from '../utils/fx.js';
import { audio as audioMgr } from '../utils/audio.js';

const C = CONFIG.capsule;

// 默认布局序列（19 个节点）：可被节点自身的 layout / importance 字段覆盖
// （3 张及以上照片/视频的章节自动使用多图拼贴布局，不受此序列影响）
const LAYOUTS = ['C', 'B', 'A', 'B', 'B', 'B', 'B', 'D', 'B', 'B', 'B', 'B', 'B', 'A', 'B', 'C', 'B', 'B', 'F'];
const DIVIDERS = ['✿', '❀', '♡', '✧'];

// ---------- 背景音乐（模块级单例，同一时间只有一条音频） ----------
let bgmAudio = null;
document.addEventListener('scene:changed', () => {
  if (bgmAudio && !bgmAudio.paused) {
    bgmAudio.pause();
    document.querySelectorAll('.cp-music').forEach(b => { b.textContent = '♪'; b.classList.remove('playing'); });
  }
});

export function render(el) {
  const st = getState();
  const viewed = new Set(st.timelineViewed);
  const dates = { ...st.timelineDates };
  const quizDone = !!st.timelineQuizDone;
  const items = CONFIG.timeline;
  const ord = i => String(i + 1).padStart(2, '0');

  // ---------- 照片渲染（视频 / 图片 / 失败占位） ----------
  function photoHTML(p, cls = '', cap = '') {
    const capHtml = cap ? `<span class="cp-ph-cap">${cap}</span>` : '<span class="cp-ph-cap"></span>';
    if (p.endsWith('.mp4')) {
      return `<div class="cp-polaroid ${cls}"><div class="cp-ph-media">
        <video src="${p}" controls playsinline webkit-playsinline preload="metadata"></video>
        </div>${capHtml}</div>`;
    }
    return `<div class="cp-polaroid ${cls}"><div class="cp-ph-media">
      <img src="${p}" alt="" loading="lazy" decoding="async"
        onerror="this.parentElement.innerHTML='<div class=&quot;img-placeholder&quot;>📷 这张照片还在路上</div>'">
      </div>${capHtml}</div>`;
  }

  // ---------- 章节照片布局 ----------
  function photosHTML(t, i, lay) {
    const ps = t.photos;
    const cap = dates[i] || t.date || '';
    // 无照片：空白相框（一周年）
    if (!ps.length) {
      return `<div class="cp-photos cp-lay-f cp-reveal" style="--d:.15s">
          <div class="cp-polaroid cp-blank"><div class="cp-blank-frame">
            <span>💌</span><p>第一周年那天的照片<br>会放在这里</p>
          </div></div></div>`;
    }
    // 1 张：大幅展示
    if (ps.length === 1) {
      return `<div class="cp-photos cp-lay-c cp-reveal" style="--d:.15s">
          ${photoHTML(ps[0], 'pc1', cap)}</div>`;
    }
    // 3 张及以上：多图拼贴（首张带日期角标）
    if (ps.length > 2) {
      return `<div class="cp-photos cp-lay-multi cp-reveal" style="--d:.15s">
          ${ps.map((p, k) => photoHTML(p, 'pm' + ((k % 3) + 1), k === 0 ? cap : '')).join('')}</div>`;
    }
    // 2 张：交替使用既有布局
    const [p1, p2] = ps;
    switch (lay) {
      case 'A': return `<div class="cp-photos cp-lay-a cp-reveal" style="--d:.15s">
          ${photoHTML(p1, 'pa1', cap)}${photoHTML(p2, 'pa2')}</div>`;
      case 'B': return `<div class="cp-photos cp-lay-b cp-reveal" style="--d:.15s">
          ${photoHTML(p1, 'pb-big', cap)}${photoHTML(p2, 'pb-small')}</div>`;
      case 'C': return `<div class="cp-photos cp-lay-c cp-reveal" style="--d:.15s">
          ${photoHTML(p1, 'pc1', cap)}${photoHTML(p2, 'pc2')}</div>`;
      case 'D': return `<div class="cp-photos cp-lay-d cp-reveal" style="--d:.15s">
          ${photoHTML(p1, 'pd1')}${photoHTML(p2, 'pd2', cap)}</div>`;
      case 'E': return `<div class="cp-photos cp-lay-e cp-reveal" style="--d:.15s">
          ${photoHTML(p1, 'pe-hero', cap)}${photoHTML(p2, 'pe-side')}</div>`;
      default: return `<div class="cp-photos cp-lay-a cp-reveal" style="--d:.15s">
          ${photoHTML(p1, 'pa1', cap)}${photoHTML(p2, 'pa2')}</div>`;
    }
  }

  // ---------- 回忆引导 / 填空互动（仅 quiz.nodeId 章节） ----------
  function quizHTML(i) {
    const q = C.quiz;
    if (!q || i !== q.nodeId) return '';
    // questionTemplate 留空：只显示引导语，不出填空题
    if (!q.questionTemplate) {
      return `<div class="cp-quiz cp-leadonly cp-reveal" style="--d:.35s">
          <p class="cp-quiz-lead">${q.lead[0]}</p>
          <p class="cp-quiz-lead2">${q.lead[1]}</p>
        </div>`;
    }
    if (quizDone) return `<p class="cp-quiz-done cp-reveal" style="--d:.4s">♡ ${q.success}</p>`;
    return `<div class="cp-quiz cp-reveal" style="--d:.35s" id="cp-quiz">
        <p class="cp-quiz-lead">${q.lead[0]}</p>
        <p class="cp-quiz-lead2">${q.lead[1]}</p>
        <p class="cp-quiz-q">${q.questionTemplate.replace('____', '<span class="cp-blank-slot"></span>')}</p>
        <div class="cp-quiz-row">
          <input id="cp-quiz-input" type="text" placeholder="写下你的答案…" autocomplete="off">
          <button class="cp-quiz-ok" id="cp-quiz-ok">确认</button>
        </div>
        <p class="cp-quiz-fb" id="cp-quiz-fb"></p>
        <div class="cp-quiz-help">
          <button class="cp-quiz-helpbtn" id="cp-quiz-hint" hidden>💡 看看提示</button>
          <button class="cp-quiz-helpbtn" id="cp-quiz-reveal" hidden>🔍 看看答案</button>
        </div>
      </div>`;
  }

  // ---------- 日期补记（fillDate 节点，非强制） ----------
  function fillDateHTML(t, i) {
    if (!t.fillDate || dates[i]) return '';
    return `<div class="cp-filldate" data-i="${i}">
        <button class="cp-fill-btn cp-reveal" style="--d:.45s">📅 补记这一天的日期</button>
        <div class="cp-fill-panel" hidden>
          <div class="cp-fill-row">
            <input data-k="y" inputmode="numeric" maxlength="4" placeholder="年份"><span>.</span>
            <input data-k="m" inputmode="numeric" maxlength="2" placeholder="月"><span>.</span>
            <input data-k="d" inputmode="numeric" maxlength="2" placeholder="日">
          </div>
          <div class="cp-fill-alt">
            <input type="date" class="cp-fill-native" aria-label="日期选择器">
            <span>👆 也可以直接选日期</span>
          </div>
          <button class="cp-fill-save">把这天存进胶囊 ♡</button>
        </div>
      </div>`;
  }

  // ---------- 章节 ----------
  function chapterHTML(t, i) {
    const lay = t.layout || (t.importance === 'special' ? 'E' : LAYOUTS[i] || 'A');
    const d = dates[i] || t.date || '';
    const dateText = (t.fillDate && !dates[i]) ? (d || '日期待补记') : d;
    const ach = t.achievement || (C.achievements && C.achievements[i]);
    return `<section class="cp-ch ${t.importance === 'special' ? 'cp-special' : ''}" data-i="${i}">
        <div class="cp-chapter-no cp-reveal">CHAPTER ${ord(i)}</div>
        <div class="cp-date cp-reveal" style="--d:.05s">${dateText}</div>
        <h2 class="cp-title cp-reveal" style="--d:.1s">${t.title}</h2>
        ${photosHTML(t, i, lay)}
        ${quizHTML(i)}
        ${t.text ? `<p class="cp-msg cp-reveal" style="--d:.3s">${t.text}</p>` : ''}
        ${ach ? `<p class="cp-achieve cp-reveal" style="--d:.4s">🏆 ${ach}</p>` : ''}
        ${fillDateHTML(t, i)}
        <div class="cp-divider" aria-hidden="true">${DIVIDERS[i % DIVIDERS.length]}</div>
      </section>`;
  }

  // ---------- 开场 ----------
  function introHTML() {
    const it = C.intro;
    const firstPhoto = it.showIntroPhoto && items[0] && items[0].photos[0] && !items[0].photos[0].endsWith('.mp4')
      ? `<figure class="cp-intro-photo cp-reveal" style="--d:.5s">
           <img src="${items[0].photos[0]}" alt="" loading="lazy" decoding="async"
             onerror="this.parentElement.style.display='none'">
         </figure>` : '';
    return `<header class="cp-intro" id="cp-intro">
        <p class="cp-eyebrow cp-reveal">${it.eyebrow}</p>
        <h1 class="cp-365 cp-reveal" style="--d:.1s">${it.bigTitle}<span>${it.bigSub}</span></h1>
        <p class="cp-ourstory cp-reveal" style="--d:.2s">${it.titleEn}</p>
        <p class="cp-titcn cp-reveal" style="--d:.3s">${it.titleCn}</p>
        <div class="cp-dates cp-reveal" style="--d:.4s">
          <span>${it.startDate}</span><i>——</i><span>${it.endDate}</span>
        </div>
        <p class="cp-ask cp-reveal" style="--d:.5s">「${it.ask}」</p>
        ${firstPhoto}
        <div class="cp-scrollhint" aria-hidden="true"><span>${it.scrollHint}</span><i></i></div>
      </header>`;
  }

  // ---------- 结尾 ----------
  function endingHTML() {
    const e = C.ending;
    return `<section class="cp-ending" id="cp-ending">
        ${e.lines.map((g, gi) => `<div class="cp-end-line cp-reveal" style="--d:${gi * .5}s">
            ${g.map(l => `<p>${l}</p>`).join('')}</div>`).join('')}
        <div class="cp-end-final cp-reveal">
          <p class="cp-end-365">${e.finalTitle}</p>
          <p class="cp-end-tbc">${e.finalSub}</p>
          <p class="cp-end-note">${e.finalNote}</p>
        </div>
        <div class="cp-blankwrap cp-reveal">
          <div class="cp-polaroid cp-blank cp-blank-end"><div class="cp-blank-frame"><span>📷</span></div></div>
          ${e.blankNote.map(l => `<p class="cp-blank-note">${l}</p>`).join('')}
        </div>
        <button class="btn cp-cta" id="cp-next">${e.cta}</button>
        <button class="cp-voice-link" id="cp-voice">🎙️ 听一段专属语音</button>
      </section>`;
  }

  el.innerHTML = `<div class="capsule">
      <div class="cp-spots" aria-hidden="true"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div>
      <div class="cp-grain" aria-hidden="true"></div>
      ${introHTML()}
      <main class="cp-chapters">${items.map(chapterHTML).join('')}</main>
      ${endingHTML()}
      <button class="cp-music" id="cp-music" aria-label="背景音乐开关">♪</button>
    </div>`;

  // ================= 交互绑定 =================

  // 1. 显影动画 + 阅读进度（IntersectionObserver，只触发一次）
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  el.querySelectorAll('.cp-reveal').forEach(n => io.observe(n));

  const vio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const i = Number(en.target.dataset.i);
      vio.unobserve(en.target);
      if (viewed.has(i)) return;
      viewed.add(i);
      patchState({ timelineViewed: [...viewed] });
    });
  }, { threshold: .05, rootMargin: '0px 0px -4% 0px' });
  el.querySelectorAll('.cp-ch').forEach(n => vio.observe(n));

  // 2. 回忆填空
  setupQuiz();

  // 3. 日期补记
  el.querySelectorAll('.cp-filldate').forEach(box => setupFillDate(box));

  // 4. 背景音乐开关（统一走 AudioManager 的文件通道，与场景主题音乐互斥）
  const musicBtn = el.querySelector('#cp-music');
  musicBtn.addEventListener('click', () => {
    if (!bgmAudio) {
      bgmAudio = audioMgr.playFile(CONFIG.assets.bgm, { volume: 0.4 });
      if (bgmAudio) bgmAudio.addEventListener('error', () =>
        toast('还没有添加音乐文件 public/assets/audio/bgm.mp3'));
      if (!bgmAudio) { toast('音频暂时不可用'); return; }
    }
    if (bgmAudio.paused) {
      bgmAudio.play().then(() => {
        musicBtn.textContent = '♫';
        musicBtn.classList.add('playing');
        toast('♪ 柔和的背景音乐已开启');
      }).catch(() => {
        toast(bgmAudio.error || bgmAudio.networkState === 3
          ? '还没有添加音乐文件 public/assets/audio/bgm.mp3'
          : '再点一次试试～');
      });
    } else {
      bgmAudio.pause();
      musicBtn.textContent = '♪';
      musicBtn.classList.remove('playing');
    }
  });
  if (bgmAudio && !bgmAudio.paused) { musicBtn.textContent = '♫'; musicBtn.classList.add('playing'); }

  // 5. 视频互斥：同一时间只播一个视频；视频播放时自动暂停背景音乐
  el.querySelectorAll('.cp-ph-media video').forEach(v => {
    v.addEventListener('play', () => {
      el.querySelectorAll('video').forEach(o => { if (o !== v && !o.paused) o.pause(); });
      if (bgmAudio && !bgmAudio.paused) {
        bgmAudio.pause();
        musicBtn.textContent = '♪';
        musicBtn.classList.remove('playing');
      }
    });
  });

  // 5. 结尾：花瓣 + 进入下一关 + 专属语音
  const ending = el.querySelector('#cp-ending');
  const eio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      eio.unobserve(en.target);
      if (!reduceMotion) petals(12, 14000);
    });
  }, { threshold: .25 });
  eio.observe(ending);

  el.querySelector('#cp-next').addEventListener('click', () => {
    if (bgmAudio) bgmAudio.pause();
    window.__complete('timeline', {
      title: '⏳ 时间胶囊已成功开启',
      text: '检测到还有一份来自未来的订单。', ctaText: '去看看未来订单 ›'
    });
  });
  el.querySelector('#cp-voice').addEventListener('click', openVoice);

  // ---------- 填空逻辑 ----------
  function setupQuiz() {
    const q = C.quiz;
    if (!q || quizDone) return;
    const box = el.querySelector('#cp-quiz');
    if (!box) return;
    const input = box.querySelector('#cp-quiz-input');
    const okBtn = box.querySelector('#cp-quiz-ok');
    const fb = box.querySelector('#cp-quiz-fb');
    const hintBtn = box.querySelector('#cp-quiz-hint');
    const revealBtn = box.querySelector('#cp-quiz-reveal');
    let wrongs = 0;

    const norm = s => {
      s = (s || '').trim().toLowerCase().replace(/\s+/g, '');
      if (q.ignorePunctuation !== false) s = s.replace(/[，。！？、,.!?'’"“”:：;；~～·—-]/g, '');
      return s;
    };

    function succeed() {
      box.classList.add('done');
      fb.textContent = q.success;
      input.disabled = true; okBtn.disabled = true;
      hintBtn.hidden = true; revealBtn.hidden = true;
      patchState({ timelineQuizDone: true });
      floatHearts(box);
      confetti(16);
    }

    okBtn.addEventListener('click', () => {
      const v = input.value.trim();
      if (!v) { fb.textContent = '先写点什么嘛～'; return; }
      const pass = q.answers.length ? q.answers.some(a => norm(a) === norm(v)) : true;
      if (pass) return succeed();
      wrongs++;
      fb.textContent = q.wrong[(wrongs - 1) % q.wrong.length];
      if (wrongs >= (q.hintAfter || 2)) hintBtn.hidden = false;
      if (wrongs >= (q.revealAfter || 4)) revealBtn.hidden = false;
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') okBtn.click(); });
    hintBtn.addEventListener('click', () => { fb.textContent = '💡 ' + q.hint; });
    revealBtn.addEventListener('click', () => {
      fb.textContent = q.answers.length
        ? `答案原来是：「${q.answers[0]}」`
        : '答案还没有设置（在 config.js 的 capsule.quiz.answers 里补充）';
    });
  }

  function floatHearts(box) {
    for (let k = 0; k < 6; k++) {
      const h = document.createElement('span');
      h.className = 'cp-float-heart';
      h.textContent = '💗';
      h.style.left = (10 + Math.random() * 80) + '%';
      h.style.animationDelay = (k * .12) + 's';
      box.appendChild(h);
      setTimeout(() => h.remove(), 2200);
    }
  }

  // ---------- 日期补记逻辑 ----------
  function setupFillDate(box) {
    const i = Number(box.dataset.i);
    const btn = box.querySelector('.cp-fill-btn');
    const panel = box.querySelector('.cp-fill-panel');
    btn.addEventListener('click', () => { panel.hidden = !panel.hidden; });

    const native = box.querySelector('.cp-fill-native');
    if (native) native.addEventListener('change', () => {
      const [y, mo, d] = native.value.split('-');
      if (!y) return;
      box.querySelector('[data-k="y"]').value = y;
      box.querySelector('[data-k="m"]').value = +mo;
      box.querySelector('[data-k="d"]').value = +d;
    });

    box.querySelector('.cp-fill-save').addEventListener('click', () => {
      const y = box.querySelector('[data-k="y"]').value.trim();
      const mo = box.querySelector('[data-k="m"]').value.trim();
      const d = box.querySelector('[data-k="d"]').value.trim();
      if (!/^\d{4}$/.test(y) || !/^\d{1,2}$/.test(mo) || !/^\d{1,2}$/.test(d)) {
        toast('日期好像没填对，再检查一下～（例如 2025.11.16）');
        return;
      }
      dates[i] = `${y}.${+mo}.${+d}`;
      patchState({ timelineDates: dates });
      confetti(14);
      toast(`📅 已存进胶囊：${dates[i]}`);
      const dateEl = box.closest('.cp-ch').querySelector('.cp-date');
      if (dateEl) dateEl.textContent = dates[i];
      box.remove();
    });
  }

  // ---------- 专属语音（保留原有功能） ----------
  function openVoice() {
    if (bgmAudio && !bgmAudio.paused) bgmAudio.pause();
    const audio = new Audio(CONFIG.assets.voice);
    const m = showModal({
      title: '🎙️ 专属语音',
      html: `<div class="voice-big">
          <button class="voice-play-big" id="vp">▶</button>
          <p class="voice-tip">点击开始播放（约 30～60 秒）</p>
          <p class="voice-done" id="vd" style="display:none;color:var(--c-primary);font-weight:700;margin-top:8px">语音已播完 ♡</p>
        </div>`,
      buttons: [{ text: '关闭' }]
    });
    const btn = m.el.querySelector('#vp');
    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => { btn.textContent = '⏸'; }).catch(() => {
          m.el.querySelector('.voice-tip').textContent = '语音文件未找到，请检查 assets/audio/voice.mp3';
        });
      } else { audio.pause(); btn.textContent = '▶'; }
    });
    audio.addEventListener('ended', () => {
      btn.textContent = '▶';
      m.el.querySelector('#vd').style.display = 'block';
    });
    m.onCloseCleanup = () => { audio.pause(); };
  }
}
