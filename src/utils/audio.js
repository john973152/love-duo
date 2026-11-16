/**
 * AudioManager —— 全站统一声音系统（电影感 / 温柔浪漫）
 *
 * 架构：
 *   AudioContext（单例）
 *    ├── masterGain ── destination
 *    │     ├── musicGain   场景音乐（程序化钢琴/弦乐主题，或 mp3 文件）
 *    │     ├── ambientGain 环境氛围（暖房底噪，音量极低）
 *    │     └── sfxGain     交互/剧情音效
 *
 * 特性：
 *   - 场景切换 crossfade（audio.scene(id)），离开自动淡出
 *   - 重要音效自动 ducking（音乐短暂压低）
 *   - 同名音效 70ms 内防叠加；高优先级可打断低优先级
 *   - 音乐/音效独立音量 + 开关，localStorage 持久化（默认：音效开、背景音乐关）
 *   - 页面进入后台自动降音，回前台恢复
 *   - 浏览器自动播放限制：首次用户交互后解锁
 *   - 所有播放失败静默降级，绝不影响游戏逻辑
 *
 * 用法：
 *   import { sfx, audio, setupSoundSettings } from '../utils/audio.js';
 *   sfx.click(); sfx.grand();
 *   audio.scene('treasure');        // 进入场景（main.js 统一调用）
 *   audio.playFile('assets/x.mp3'); // 播放用户自定义音乐文件（与主题音乐互斥）
 *   setupSoundSettings();           // 挂载全局声音设置入口（main.js 调用一次）
 */

// ============ 音符工具 ============
const NOTE_FREQ = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function note(n) {
  // 'C4' 'A3' 'F#4' -> Hz
  const m = /^([A-G])(#?)(\d)$/.exec(n);
  if (!m) return 440;
  const semi = NOTE_FREQ[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3], 10) + 1) * 12;
  return 440 * Math.pow(2, (semi - 69) / 12);
}

// ============ 持久化设置 ============
// v2：默认改为「音效开、背景音乐关」（用户偏好；换 key 避免旧 v1 记录覆盖新默认）
const STORE_KEY = 'ld-audio-v2';
function loadPrefs() {
  const DEFAULTS = { music: false, sfx: true, musicVol: 0.65, sfxVol: 0.85 };
  try {
    const legacyMuted = localStorage.getItem('ld-muted') === '1';
    const p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {
      music: p.music === true,                       // 音乐默认关，需显式开启
      sfx: p.sfx !== false && !legacyMuted,          // 音效默认开
      musicVol: typeof p.musicVol === 'number' ? p.musicVol : DEFAULTS.musicVol,
      sfxVol: typeof p.sfxVol === 'number' ? p.sfxVol : DEFAULTS.sfxVol
    };
  } catch { return { ...DEFAULTS }; }
}
function savePrefs(p) { try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch { /* 忽略 */ } }

// ============ 场景 -> 音乐主题映射 ============
const SCENE_MUSIC = {
  home: 'home',
  wheel: 'gentle', quiz: 'gentle', puzzle: 'gentle',
  treasure: 'treasure',
  manual: 'gentle', timeline: 'gentle', order: 'gentle',
  final: 'letter'
};

// ============ 程序化音乐主题 ============
// 每个主题：bpm、和弦进行（半音起拍）、琶音形态、pad（弦乐垫）、性格参数
const THEMES = {
  // 首页：极简温暖，几乎是氛围
  home: {
    bpm: 54, key: 0, vol: 0.5,
    chords: [['C3', 'G3', 'E4'], ['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3']],
    arp: [0, 1, 2, 1], pad: true, padVol: 0.045, bell: false
  },
  // 普通关卡：轻快但不闹，木质与水晶感
  gentle: {
    bpm: 62, key: 0, vol: 0.55,
    chords: [['C3', 'E3', 'G3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['G2', 'B2', 'D3']],
    arp: [0, 1, 2, 1, 2, 1], pad: true, padVol: 0.05, bell: true
  },
  // 寻宝房间：轻微神秘 + 温暖期待（小调色彩，不恐怖）
  treasure: {
    bpm: 56, key: 0, vol: 0.5,
    chords: [['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['D3', 'A3', 'F4'], ['E3', 'B3', 'G#4']],
    arp: [0, 2, 1, 2], pad: true, padVol: 0.06, bell: true
  },
  // 奖励时刻：从安静转向温暖明亮
  reward: {
    bpm: 60, key: 0, vol: 0.6,
    chords: [['C3', 'G3', 'E4'], ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3'], ['C3', 'G3', 'E4']],
    arp: [0, 1, 2, 1, 0, 2], pad: true, padVol: 0.06, bell: true
  },
  // 最后一封信：钢琴独奏，慢、克制、有呼吸（全站最重要）
  letter: {
    bpm: 46, key: 0, vol: 0.62,
    chords: [['C3', 'G3', 'E4'], ['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3'],
             ['A2', 'E3', 'C4'], ['F2', 'C3', 'F3'], ['C3', 'G3', 'E4'], ['C3', 'G3', 'C4']],
    arp: [0, 1, 2, 1, 2, 1, 0], pad: true, padVol: 0.035, bell: false
  }
};

// ============ 管理器 ============
let _ctx = null;
let master, musicBus, ambientBus, sfxBus;
let prefs = loadPrefs();
let _unlocked = false;              // 用户是否已交互（自动播放限制）
let _scene = null;                  // 当前场景 id
let _music = null;                  // 当前音乐引擎 { theme, stop() }
let _musicFile = null;              // 文件音乐 Audio 元素
let _ambient = null;                // 环境音引擎
let _duckUntil = 0;                 // ducking 截止时间
let _lastSfx = {};                  // 防叠加时间戳
let _bgVisible = true;

// 浏览器自动播放限制处理：模块加载即注册首次交互监听（交互后解锁并启动场景音频）
function _kick() {
  _unlocked = true;
  const a = ac();
  if (a && a.state === 'suspended') a.resume().catch(() => {});
  if (_scene) startSceneAudio(_scene);
}
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', _kick, { once: true, capture: true });
  window.addEventListener('keydown', _kick, { once: true, capture: true });
}

function ac() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      _ctx = new AC();
      master = _ctx.createGain();
      musicBus = _ctx.createGain();
      ambientBus = _ctx.createGain();
      sfxBus = _ctx.createGain();
      // 关键：总线从 0 淡入，避免 Context 刚创建时增益默认为 1，
      // 第一批音符以全音量冲出来形成"爆炸声"
      master.gain.value = 1;
      musicBus.gain.value = 0;
      ambientBus.gain.value = 0;
      sfxBus.gain.value = 0;
      musicBus.connect(master); ambientBus.connect(master); sfxBus.connect(master);
      master.connect(_ctx.destination);
      applyVolumes();
      // 页面后台降音
      document.addEventListener('visibilitychange', () => {
        _bgVisible = document.visibilityState === 'visible';
        applyVolumes();
      });
    } catch { return null; }
  }
  if (_ctx.state === 'suspended' && _unlocked) _ctx.resume().catch(() => {});
  return _ctx;
}

function applyVolumes() {
  if (!_ctx) return;
  const bgFactor = _bgVisible ? 1 : 0.15;          // 后台降音到 15%
  const duck = _ctx.currentTime < _duckUntil ? 0.35 : 1;  // ducking 压低音乐
  musicBus.gain.setTargetAtTime(prefs.music ? prefs.musicVol * 0.30 * bgFactor * duck : 0, _ctx.currentTime, 0.25);
  ambientBus.gain.setTargetAtTime(prefs.music ? 0.07 * bgFactor : 0, _ctx.currentTime, 0.4);
  sfxBus.gain.setTargetAtTime(prefs.sfx ? prefs.sfxVol : 0, _ctx.currentTime, 0.05);
}

/** 音乐/重要音效播放时短暂压低背景音乐（ducking） */
function duck(ms = 1400) {
  if (!_ctx) return;
  _duckUntil = _ctx.currentTime + ms / 1000;
  applyVolumes();
  clearTimeout(duck._t);
  duck._t = setTimeout(applyVolumes, ms + 300);
}

// ============ 基础音色（全部柔和化：sine/triangle + 低通 + 慢释放） ============
function tone({ freq = 440, type = 'sine', dur = 0.3, delay = 0, vol = 0.12, slide = 0, attack = 0.015, bus = null, filter = 0 }) {
  if (!prefs.sfx && bus !== musicBus && bus !== ambientBus) return;
  const a = ac(); if (!a) return;
  try {
    const t = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (filter) {
      const f = a.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = filter;
      g.connect(f); out = f;
    }
    o.connect(g);
    out.connect(bus || sfxBus);
    o.start(t);
    o.stop(t + dur + 0.1);
  } catch { /* 静默降级 */ }
}

/** 柔和噪声（纸/布/空气声的原料） */
function noise({ dur = 0.3, delay = 0, vol = 0.08, lp = 1200, hp = 0, attack = 0.02, release = null }) {
  if (!prefs.sfx) return;
  const a = ac(); if (!a) return;
  try {
    const t0 = a.currentTime + delay;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = lp;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    let out = f;
    if (hp) {
      const h = a.createBiquadFilter();
      h.type = 'highpass'; h.frequency.value = hp;
      f.connect(h); out = h;
    }
    out.connect(g).connect(sfxBus);
    src.start(t0);
  } catch { /* 静默降级 */ }
}

/** 钢琴式音符（sine 基音 + 轻微八度泛音，慢释放） */
function pianoNote(freq, { dur = 1.6, delay = 0, vol = 0.11, bus = null }) {
  tone({ freq, type: 'sine', dur, delay, vol, attack: 0.02, bus });
  tone({ freq: freq * 2, type: 'sine', dur: dur * 0.6, delay, vol: vol * 0.25, attack: 0.02, bus });
  tone({ freq: freq * 3.01, type: 'sine', dur: dur * 0.35, delay, vol: vol * 0.08, attack: 0.02, bus });
}

// ============ 场景音乐引擎（程序化） ============
function startMusicEngine(themeName) {
  stopMusicEngine();
  const th = THEMES[themeName];
  if (!th) return;
  const a = ac(); if (!a) return;

  // 每个引擎独立总线：切场景时旧引擎所有已排音符一起快速淡出，
  // 不会和新场景的音乐叠加轰鸣
  const engineBus = a.createGain();
  engineBus.connect(musicBus);

  const state = { chordIdx: 0, step: 0, timer: null, stopped: false };
  const stepDur = 60 / th.bpm / 2; // 八分音符

  const playChordPad = (chord) => {
    if (!th.pad) return;
    const offset = nextTime - a.currentTime;   // 对齐节拍位置（delay 以 currentTime 为基准）
    chord.forEach((n, i) => {
      const f = note(n);
      // 弦乐垫：两个轻微失谐的正弦叠加，极慢起音
      [0, 0.7].forEach(det => {
        tone({ freq: f + det, type: 'sine', dur: stepDur * th.arp.length * 2.2, delay: offset + i * 0.12,
               vol: th.padVol / chord.length * (det ? 0.6 : 1), attack: 1.2, bus: engineBus, filter: 1600 });
      });
    });
  };

  // 预约式调度：每 250ms 排未来一小段，保证节奏稳定
  let nextTime = a.currentTime + 0.35;
  const schedule = () => {
    if (state.stopped) return;
    // 防积压：定时器被后台节流后 nextTime 会落在 currentTime 之后很远处，
    // 若不钳制，积压的音符会在恢复瞬间全部齐响（听起来像爆炸）
    if (nextTime < a.currentTime + 0.05) nextTime = a.currentTime + 0.05;
    while (nextTime < a.currentTime + 0.6) {
      const chord = th.chords[state.chordIdx % th.chords.length];
      if (state.step % th.arp.length === 0) playChordPad(chord);
      const noteIdx = th.arp[state.step % th.arp.length];
      const f = note(chord[noteIdx]) * 2;
      pianoNote(f, { dur: stepDur * 3, vol: th.vol * 0.55, bus: engineBus });
      if (th.bell && state.step % th.arp.length === Math.floor(th.arp.length / 2)) {
        tone({ freq: f * 2, type: 'sine', dur: 1.2, delay: nextTime - a.currentTime + stepDur * 0.5, vol: th.vol * 0.12, attack: 0.03, bus: engineBus });
      }
      state.step++;
      if (state.step % th.arp.length === 0) state.chordIdx++;
      nextTime += stepDur;
    }
  };
  state.timer = setInterval(schedule, 250);
  schedule();
  _music = {
    theme: themeName,
    stop: () => {
      state.stopped = true;
      clearInterval(state.timer);
      // 旧引擎 0.15s 时间常数淡出，已排音符不再发声
      try {
        engineBus.gain.setTargetAtTime(0, a.currentTime, 0.15);
        setTimeout(() => { try { engineBus.disconnect(); } catch { /* 忽略 */ } }, 1500);
      } catch { /* 忽略 */ }
    }
  };
}

function stopMusicEngine() {
  if (_music) { try { _music.stop(); } catch { /* 忽略 */ } _music = null; }
}

// ============ 环境音（暖房底噪：极低频噪声 + 缓慢起伏） ============
function startAmbient() {
  if (_ambient) return;
  const a = ac(); if (!a) return;
  try {
    const len = a.sampleRate * 4;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {          // 布朗噪声（比白噪更暖更低）
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    const src = a.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 320;
    const g = a.createGain(); g.gain.value = 1;
    // 极慢起伏（呼吸感）
    const lfo = a.createOscillator(); lfo.frequency.value = 0.07;
    const lg = a.createGain(); lg.gain.value = 0.35;
    lfo.connect(lg).connect(g.gain);
    src.connect(f).connect(g).connect(ambientBus);
    src.start();
    lfo.start();
    _ambient = { stop: () => { try { src.stop(); lfo.stop(); } catch { /* 忽略 */ } } };
  } catch { /* 忽略 */ }
}
function stopAmbient() {
  if (_ambient) { try { _ambient.stop(); } catch { /* 忽略 */ } _ambient = null; }
}

// ============ 对外 API ============
export const audio = {
  /** 进入场景：自动 crossfade 到对应主题音乐 + 环境（main.js 统一调用） */
  scene(id) {
    _scene = id;
    if (!_unlocked) return;                 // 等首次交互后 startSceneAudio
    startSceneAudio(id);
  },

  /** 播放用户自定义音乐文件（如时间胶囊的 bgm.mp3；与主题音乐互斥，fade 切换） */
  playFile(src, { volume = 0.5 } = {}) {
    const a = ac(); if (!a || !src) return null;
    stopMusicEngine();
    if (_musicFile) { try { _musicFile.pause(); } catch { /* 忽略 */ } _musicFile = null; }
    if (_ambient) stopAmbient();
    const el = new Audio(src);
    el.loop = true;
    el.volume = prefs.music ? Math.min(volume, prefs.musicVol) : 0;
    el.play().catch(() => { /* 文件不存在或需交互，静默 */ });
    _musicFile = el;
    return el;
  },

  /** 停止文件音乐并回到场景主题 */
  stopFile() {
    if (_musicFile) { try { _musicFile.pause(); } catch { /* 忽略 */ } _musicFile = null; }
    if (_scene && _unlocked) startSceneAudio(_scene);
  },

  setMusicVolume(v) { prefs.musicVol = Math.max(0, Math.min(1, v)); savePrefs(prefs); applyVolumes(); },
  setSfxVolume(v) { prefs.sfxVol = Math.max(0, Math.min(1, v)); savePrefs(prefs); applyVolumes(); },
  setMusicOn(on) { prefs.music = !!on; savePrefs(prefs); applyVolumes(); if (!on) { stopMusicEngine(); stopAmbient(); } else if (_scene) startSceneAudio(_scene); },
  setSfxOn(on) { prefs.sfx = !!on; savePrefs(prefs); applyVolumes(); },
  getPrefs() { return { ...prefs }; },

  /** 离开页面/卸载时清理 */
  destroy() { stopMusicEngine(); stopAmbient(); if (_musicFile) { try { _musicFile.pause(); } catch { /* 忽略 */ } } },

  /** 调试探针：返回当前音频系统状态 */
  _dbg: () => ({ scene: _scene, unlocked: _unlocked, music: _music?.theme || null, file: !!_musicFile, ambient: !!_ambient, ctx: _ctx?.state || 'none' }),

  _test: { THEMES, note } // 供测试用
};

// 调试句柄（控制台可用 __ldAudio._dbg() 查看状态）
if (typeof window !== 'undefined') window.__ldAudio = audio;

function startSceneAudio(id) {
  const theme = SCENE_MUSIC[id];
  stopFile(/** 不回到场景 */ true);
  // 音乐默认关：关闭时不启动引擎/环境音（开了再启动），避免空转调度
  if (!prefs.music) { stopMusicEngine(); stopAmbient(); applyVolumes(); return; }
  if (theme) {
    if (!_music || _music.theme !== theme) startMusicEngine(theme);
    startAmbient();
  } else {
    stopMusicEngine();
  }
  applyVolumes();
}
function stopFile(keepScene) {
  if (_musicFile) { try { _musicFile.pause(); } catch { /* 忽略 */ } _musicFile = null; }
  if (!keepScene && _scene && _unlocked) startSceneAudio(_scene);
}

// ============ 音效库（全柔和重设计） ============
// 优先级：'low' | 'normal' | 'important'（触发 ducking）
export const sfx = {
  /** 按钮轻点：木质触碰 */
  click() {
    _play('click', 'low', () => {
      tone({ freq: 190, type: 'sine', dur: 0.05, vol: 0.10 });
      noise({ dur: 0.03, vol: 0.05, lp: 1500, attack: 0.004 });
    });
  },

  /** 弹窗出现：柔和气泡 */
  pop() {
    _play('pop', 'low', () => {
      tone({ freq: 360, type: 'sine', dur: 0.22, vol: 0.09, slide: 240, attack: 0.03, filter: 2000 });
    });
  },

  /** 答对/小成功：温柔钢琴双音 */
  correct() {
    _play('correct', 'normal', () => {
      pianoNote(note('E5'), { dur: 0.5, vol: 0.09 });
      pianoNote(note('G5'), { dur: 0.8, delay: 0.14, vol: 0.10 });
    });
  },

  /** 无效操作：极柔下行（几乎不抢注意力） */
  wrong() {
    _play('wrong', 'low', () => {
      tone({ freq: 330, type: 'sine', dur: 0.25, vol: 0.07, slide: -40, attack: 0.04, filter: 1200 });
      tone({ freq: 262, type: 'sine', dur: 0.35, delay: 0.16, vol: 0.07, slide: -30, attack: 0.04, filter: 1200 });
    });
  },

  /** 关卡通过：柔和钢琴琶音 */
  win() {
    _play('win', 'important', () => {
      const seq = ['C5', 'E5', 'G5', 'A5'];
      seq.forEach((n, i) => pianoNote(note(n), { dur: 0.7, delay: i * 0.13, vol: 0.10 }));
      pianoNote(note('C6'), { dur: 1.4, delay: 0.56, vol: 0.07 });
      duck(1800);
    });
  },

  /** 终极大奖/最终奖励：温暖钢琴琶音 + 轻柔星光 */
  grand() {
    _play('grand', 'emotional', () => {
      pianoNote(note('C3'), { dur: 2.2, vol: 0.06 });
      ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => pianoNote(note(n), { dur: 1.6, delay: 0.18 + i * 0.22, vol: 0.10 }));
      tone({ freq: note('E6'), type: 'sine', dur: 2.2, delay: 1.1, vol: 0.045, attack: 0.05 });
      duck(2600);
    });
  },

  /** 发现线索：柔和高音钢琴 + 微光 */
  chime() {
    _play('chime', 'important', () => {
      pianoNote(note('G6'), { dur: 1.0, vol: 0.07 });
      tone({ freq: note('C7'), type: 'sine', dur: 1.4, delay: 0.15, vol: 0.04, attack: 0.04 });
      duck(1000);
    });
  },

  /** 道具/硬币获得：轻柔金属水晶碰 */
  coin() {
    _play('coin', 'normal', () => {
      tone({ freq: note('B5'), type: 'triangle', dur: 0.12, vol: 0.06, filter: 3000 });
      tone({ freq: note('E6'), type: 'sine', dur: 0.5, delay: 0.08, vol: 0.06 });
    });
  },

  /** 解锁/钥匙：轻微金属扣件 */
  unlock() {
    _play('unlock', 'normal', () => {
      tone({ freq: 620, type: 'triangle', dur: 0.07, vol: 0.06, filter: 2400 });
      tone({ freq: 830, type: 'sine', dur: 0.3, delay: 0.09, vol: 0.05 });
      noise({ dur: 0.08, delay: 0.02, vol: 0.04, lp: 3200, attack: 0.006 });
    });
  },

  /** 抽屉/机关木质滑动 */
  wood() {
    _play('wood', 'normal', () => {
      noise({ dur: 0.4, vol: 0.06, lp: 700, attack: 0.06 });
      tone({ freq: 130, type: 'sine', dur: 0.35, vol: 0.05, slide: 30, attack: 0.05 });
    });
  },

  /** 布料摩擦（掀地毯等） */
  cloth() {
    _play('cloth', 'normal', () => {
      noise({ dur: 0.55, vol: 0.07, lp: 900, hp: 180, attack: 0.08 });
    });
  },

  /** 机关咔哒：极轻木嗒 */
  tick() {
    _play('tick', 'low', () => {
      noise({ dur: 0.018, vol: 0.035, lp: 2600, attack: 0.003 });
    });
  },

  /** 镜头/转场：空气掠过 */
  whoosh() {
    _play('whoosh', 'low', () => {
      noise({ dur: 0.5, vol: 0.05, lp: 900, hp: 220, attack: 0.12 });
    });
  },

  /** 纸张摩擦（翻页/拆信/抽出） */
  paper(dur = 0.5, vol = 0.08) {
    _play('paper', 'low', () => {
      noise({ dur, vol: vol * 0.8, lp: 1400, hp: 300, attack: 0.05 });
    });
  },

  /** 火漆印章：蜡封柔裂 */
  crack() {
    _play('crack', 'important', () => {
      noise({ dur: 0.06, vol: 0.07, lp: 3600, hp: 800, attack: 0.003 });
      tone({ freq: 660, type: 'sine', dur: 0.16, delay: 0.05, vol: 0.05, slide: -260 });
      noise({ dur: 0.25, delay: 0.08, vol: 0.045, lp: 1300, attack: 0.02 });
      duck(900);
    });
  },

  /** 拍立得：轻柔快门（不用刺耳机械声） */
  shutter() {
    _play('shutter', 'normal', () => {
      noise({ dur: 0.03, vol: 0.06, lp: 2800, attack: 0.003 });
      noise({ dur: 0.05, delay: 0.08, vol: 0.04, lp: 1600, attack: 0.004 });
      tone({ freq: 1100, type: 'sine', dur: 0.1, delay: 0.1, vol: 0.03 });
    });
  },

  /** 温柔钢琴琶音（落款/结局） */
  piano() {
    _play('piano', 'emotional', () => {
      ['C4', 'E4', 'G4', 'C5', 'E5'].forEach((n, i) => pianoNote(note(n), { dur: 2.0, delay: i * 0.26, vol: 0.10 }));
      pianoNote(note('G5'), { dur: 2.6, delay: 1.45, vol: 0.07 });
      duck(3000);
    });
  }
};

/** 防叠加 + 优先级调度：70ms 内同名忽略 */
function _play(name, _prio, fn) {
  const now = performance.now();
  if (_lastSfx[name] && now - _lastSfx[name] < 70) return;
  _lastSfx[name] = now;
  if (!prefs.sfx) return;
  try { fn(); } catch { /* 音效失败绝不影响逻辑 */ }
}

// ============ 全站统一声音设置入口（全站唯一，main.js 挂载一次） ============

/** 挂载右下角声音设置按钮 + 弹出面板（音乐/音效开关 + 音量滑块） */
export function setupSoundSettings() {
  if (document.getElementById('snd-fab')) return; // 防重复初始化

  const style = document.createElement('style');
  style.textContent = `
    #snd-fab{position:fixed;right:14px;bottom:14px;z-index:900;width:44px;height:44px;border-radius:50%;
      border:1px solid rgba(192,138,88,.35);background:rgba(255,251,243,.88);box-shadow:0 4px 14px rgba(120,80,40,.18);
      font-size:19px;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px);
      transition:transform .2s;}
    #snd-fab:active{transform:scale(.92)}
    #snd-panel{position:fixed;right:14px;bottom:66px;z-index:900;width:230px;padding:14px 16px;border-radius:14px;
      background:rgba(255,251,243,.96);border:1px solid rgba(192,138,88,.3);box-shadow:0 10px 30px rgba(120,80,40,.22);
      font-family:inherit;display:none;backdrop-filter:blur(6px)}
    #snd-panel.open{display:block}
    #snd-panel .snd-row{display:flex;align-items:center;justify-content:space-between;margin:10px 0 4px;font-size:13px;color:#7a5b3f}
    #snd-panel .snd-row:first-child{margin-top:0}
    #snd-panel label{display:flex;align-items:center;gap:6px;cursor:pointer}
    #snd-panel input[type=checkbox]{accent-color:#c98a5e;width:15px;height:15px}
    #snd-panel input[type=range]{width:100%;accent-color:#c98a5e;margin:2px 0 6px}
    #snd-panel .snd-title{font-size:13px;font-weight:600;color:#8a6040;margin-bottom:2px;letter-spacing:.05em}
  `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.id = 'snd-fab';
  fab.type = 'button';
  fab.setAttribute('data-silent', '');           // 不触发全局点击音
  fab.title = '声音设置';
  const panel = document.createElement('div');
  panel.id = 'snd-panel';

  const p = audio.getPrefs();
  panel.innerHTML = `
    <div class="snd-title">♫ 声音设置</div>
    <div class="snd-row"><label><input type="checkbox" id="snd-music" ${p.music ? 'checked' : ''}>背景音乐</label></div>
    <input type="range" id="snd-music-vol" min="0" max="100" value="${Math.round(p.musicVol * 100)}">
    <div class="snd-row"><label><input type="checkbox" id="snd-sfx" ${p.sfx ? 'checked' : ''}>音效</label></div>
    <input type="range" id="snd-sfx-vol" min="0" max="100" value="${Math.round(p.sfxVol * 100)}">
  `;

  const icon = () => { const q = audio.getPrefs(); fab.textContent = (q.music || q.sfx) ? '♫' : '🔇'; };
  icon();

  fab.addEventListener('click', () => panel.classList.toggle('open'));
  panel.querySelector('#snd-music').addEventListener('change', e => { audio.setMusicOn(e.target.checked); icon(); });
  panel.querySelector('#snd-sfx').addEventListener('change', e => { audio.setSfxOn(e.target.checked); icon(); });
  panel.querySelector('#snd-music-vol').addEventListener('input', e => audio.setMusicVolume(e.target.value / 100));
  panel.querySelector('#snd-sfx-vol').addEventListener('input', e => audio.setSfxVolume(e.target.value / 100));
  // 点面板外关闭
  document.addEventListener('pointerdown', e => {
    if (!panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) panel.classList.remove('open');
  });

  document.body.appendChild(panel);
  document.body.appendChild(fab);
}
