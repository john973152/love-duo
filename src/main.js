/**
 * LITTLE FISH — 应用入口
 * 职责：恢复进度、挂载路由、注册全局导航
 */
import './styles/index.js';
import { STAGES } from './data/content.js';
import { getState, resetProgress, patchState } from './utils/storage.js';
import { setTheme } from './utils/navigation.js';
import { renderHome } from './scenes/home.js';
import { renderStage, stageComplete } from './scenes/stage.js';
import { sfx, audio, setupSoundSettings } from './utils/audio.js';

// 1. 恢复主题与进度
const st = getState();
setTheme(st.theme || 'shopping');
document.title = 'LITTLE FISH — 一周年超级福利节';

// 游戏模块通用的通关入口（弹窗 + 解锁下一关）
window.__complete = (stageId, opts) => stageComplete(stageId, opts);

// 全局按钮点击音（事件委托；加 data-silent 的按钮不响）
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn && !btn.disabled && !btn.hasAttribute('data-silent')) sfx.click();
}, true);

// 调试后门：?unlock=all 开放所有关卡 / ?reset 清空进度
// （正式给小鱼前从链接里去掉即可，不影响正常流程）
{
  const q = new URLSearchParams(location.search);
  if (q.has('reset')) resetProgress();
  if (q.get('unlock') === 'all') {
    const st = getState();
    STAGES.forEach(s => { if (!st.unlockedStages.includes(s.id)) st.unlockedStages.push(s.id); });
    // 直接改 localStorage（getState 返回的是引用，patchState 会合并）
    patchState({ unlockedStages: [...st.unlockedStages] });
    console.log('[LD] 已开放所有关卡');
  }
  if (q.has('reset') || q.get('unlock') === 'all') {
    history.replaceState(null, '', location.pathname);  // 清掉参数，刷新不重复触发
  }
}

// 2. 全局路由：所有模块通过 window.__navigateTo(id) 跳转
window.__navigateTo = (id) => {  const stage = STAGES.find(s => s.id === id);
  if (!stage) return;
  if (id === 'home') return navigateTo('home');
  // 未解锁章节拒绝进入（防止误触最终礼物）
  const state = getState();
  if (!state.unlockedStages.includes(id)) return;
  // 已通关章节关闭：不允许再进入（当前正在进行的那一关除外）
  if (state.completedStages.includes(id) && STAGES[state.currentStage]?.id !== id) return;
  navigateTo(id);
};

async function navigateTo(id) {
  const { navigate } = await import('./utils/navigation.js');
  // 场景音乐/氛围随路由统一调度（进入即 crossfade，首次交互后生效）
  audio.scene(id);
  if (id === 'home') return navigate('home', renderHome);
  navigate(id, el => renderStage(el, id));
}

// 3. 启动：默认进入首页（若中途退出过，首页会显示"继续上次惊喜"入口）
setupSoundSettings();   // 全站唯一声音设置入口（右下角 ♫）
navigateTo('home');
