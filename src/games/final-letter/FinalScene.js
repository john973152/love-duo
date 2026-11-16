/**
 * 第六幕：最终纪念画面
 */
import { sfx } from '../../utils/sfx.js';
import { LETTER } from './content.js';
import { img } from '../../utils/image.js';

export function renderFinalScene(root, onBackHome) {
  const M = LETTER.memorial;
  root.innerHTML = `
    <div class="fl-scene fl-memorial">
      <div class="fl-room">
        <div class="fl-glow warm"></div>
        <div class="fl-bokeh">${'<i></i>'.repeat(7)}</div>
        <div class="fl-petals">${'<i></i>'.repeat(10)}</div>
        <div class="fl-hearts">${'<i>❤</i>'.repeat(9)}</div>
        <div class="fl-memo-card">
          <h2 class="fl-memo-title">${M.title}</h2>
          <div class="fl-memo-photo">${img(M.photo, M.title)}</div>
          <p class="fl-memo-sub">${M.sub}</p>
        </div>
        <div class="fl-act1-text shown">
          <p class="fl-hint2">${M.bottom}</p>
          <button class="fl-btn" id="fl-back">${M.btn}</button>
        </div>
      </div>
    </div>`;

  root.querySelector('#fl-back').addEventListener('click', e => {
    sfx.click();
    onBackHome(e);
  });
}
