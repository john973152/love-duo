/**
 * 场景导航：负责章节切换动画 + 主题切换 + 头部渲染
 */
import { STAGES } from '../data/content.js';
import { getState, goToStage } from './storage.js';

const container = () => document.getElementById('scene-container');

/** 平滑切换场景：淡出 → 替换内容 → 淡入 */
export async function navigate(stageId, renderFn) {
  const el = container();
  el.classList.add('scene-leave');
  await wait(260);
  el.innerHTML = '';
  // 通知各模块场景已切换（例如：时间胶囊背景音乐在此暂停，避免离开关卡后继续播放）
  document.dispatchEvent(new CustomEvent('scene:changed'));
  el.classList.remove('scene-leave');
  el.classList.add('scene-enter');
  renderFn(el);
  await nextFrame();
  el.classList.remove('scene-enter');
  renderHeader(stageId);
  window.scrollTo(0, 0);
}

function renderHeader(stageId) {
  const header = document.getElementById('app-header');
  const st = getState();
  const idx = STAGES.findIndex(s => s.id === stageId);
  if (stageId === 'home') { header.innerHTML = ''; header.classList.remove('show'); return; }
  header.classList.add('show');
  const done = st.completedStages.length;
  header.innerHTML = `
    ${idx > 0 ? `<button class="back-btn" data-nav="home" aria-label="返回首页">‹</button>` : ''}
    <div class="header-info">
      <span class="header-name">${STAGES[idx].name}</span>
      <span class="header-progress">${done}/${STAGES.length - 1} 已完成</span>
    </div>
    <div class="header-bar"><i style="width:${(done / (STAGES.length - 1)) * 100}%"></i></div>
  `;
  header.querySelectorAll('[data-nav]').forEach(b =>
    b.addEventListener('click', () => window.__navigateTo(b.dataset.nav)));
}

export function setTheme(theme) {
  document.body.classList.toggle('theme-shopping', theme === 'shopping');
  document.body.classList.toggle('theme-romantic', theme === 'romantic');
  getState().theme = theme;
}

/** 全局入口：main.js 注入真正的导航实现 */
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
export { goToStage };
