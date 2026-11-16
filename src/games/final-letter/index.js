/**
 * ============================================================
 *  最终关卡：最后一封信 · To My Love
 *  六幕结构：信件出现 → 拆信 → 阅读(照片穿插) → 落款 → 珍藏 → 纪念画面
 *  内容全部来自 ./content.js，动画与文案分离
 * ============================================================
 */
import './styles.css';
import { LETTER } from './content.js';
import { audio } from '../../utils/audio.js';
import { completeStage } from '../../utils/storage.js';
import { renderEnvelope, playKeepSequence } from './EnvelopeAnimation.js';
import { renderReading } from './LetterContent.js';
import { renderFinalScene } from './FinalScene.js';

let cleanupPrev = null; // 上一次实例的清理函数（重进关卡时不叠加监听）

export function render(el) {
  cleanupPrev?.();
  cleanupPrev = null;

  const root = document.createElement('div');
  root.className = 'fl-root';
  // 声音控制使用全站统一入口（右下角 ♫ 按钮），本关卡不再单独放静音按钮
  root.innerHTML = `<div id="fl-stage"></div>`;
  el.innerHTML = '';
  el.appendChild(root);

  // BGM：若用户配置了真实音乐文件则用文件（与场景主题互斥），否则交给
  // main.js 的 audio.scene('final') 播放程序化「最后一封信」钢琴主题
  if (LETTER.bgm) audio.playFile(LETTER.bgm);

  const stage = root.querySelector('#fl-stage');

  // 第一、二幕：信封
  renderEnvelope(stage, () => {
    // 移除第一幕场景，让阅读场景顶到视口
    const act1 = stage.querySelector('.fl-act1');
    act1?.classList.add('fl-fade-away');
    setTimeout(() => act1?.remove(), 700);

    // 第三、四、五幕：信纸阅读
    const cleanupReading = renderReading(stage, {
      onAllRead: () => {
        // 珍藏动画 → 第六幕纪念画面
        playKeepSequence(stage, () => {
          cleanupReading?.();
          completeStage('final'); // 标记通关（不弹通用完成框，用纪念画面收尾）
          renderFinalScene(stage, () => {
            // 重新浏览入口：回首页纪念内容，不重置任何进度
            window.__navigateTo('home');
          });
        });
      }
    });
    cleanupPrev = cleanupReading || cleanupPrev;
  });
}
