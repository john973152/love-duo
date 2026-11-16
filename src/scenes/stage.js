/**
 * 章节调度器：根据 stage id 加载对应游戏模块并渲染
 */
import { STAGES } from '../data/content.js';
import { getState, completeStage } from '../utils/storage.js';
import { showModal } from '../components/Modal.js';
import { sfx } from '../utils/sfx.js';

const GAME_ICONS = {
  wheel: '🎡', quiz: '📝', puzzle: '🧩', treasure: '🔍',
  manual: '📖', timeline: '⏳', order: '📜', final: '🎬'
};

export async function renderStage(el, stageId) {
  const stage = STAGES.find(s => s.id === stageId);
  const st = getState();

  // 已完成章节允许重新查看；未完成且未解锁的拒绝
  if (!st.unlockedStages.includes(stageId)) {
    el.innerHTML = `<div class="stage-stub"><div class="big-ico">🔒</div><p>该福利尚未解锁</p></div>`;
    return;
  }

  el.innerHTML = `<div class="stage-stub"><div class="big-ico">💗</div></div>`;
  try {
    const mod = await import(`../games/${stage.game}.js`);
    mod.render(el);
  } catch (err) {
    console.error('[stage load error]', stageId, err);
    el.innerHTML = `<div class="stage-stub"><div class="big-ico">😵</div>
      <p>章节加载失败，请刷新重试</p></div>`;
  }
}

/** 游戏通用完成弹窗（各游戏模块调用） */
export function stageComplete(stageId, { title = '🎉 恭喜完成！', text = '', ctaText = '继续下一关' } = {}) {
  const idx = STAGES.findIndex(s => s.id === stageId);
  const next = STAGES[idx + 1];
  completeStage(stageId);
  sfx.win();
  showModal({
    title, closable: false,
    html: text,
    buttons: [{ text: ctaText, onClick: () => window.__navigateTo(next ? next.id : 'final') }]
  });
}
