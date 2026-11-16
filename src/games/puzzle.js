/**
 * 第 03 关：照片拼图
 * 点击两块碎片交换（微信最稳），3x3 / 3x3 / 4x4，完成后展示原图与文案
 */
import { CONFIG } from '../config.js';
import { getState, patchState } from '../utils/storage.js';
import { showModal } from '../components/Modal.js';
import { confetti } from '../utils/fx.js';

export function render(el) {
  const st = getState();
  let pIdx = st.puzzleCompleted.length >= CONFIG.puzzles.length
    ? 0
    : (CONFIG.puzzles.findIndex((_, i) => !st.puzzleCompleted.includes(i)) + CONFIG.puzzles.length) % CONFIG.puzzles.length;

  paint();

  function paint() {
    const p = CONFIG.puzzles[pIdx];
    const N = p.grid;
    // 生成打乱顺序（确保不是已完成状态）
    let order = shuffle([...Array(N * N).keys()]);
    if (isSolved(order)) order = shuffle(order);

    el.innerHTML = `
      <div class="game-wrap">
        <h2 class="game-title">我们的专属回忆</h2>
        <p class="game-subtitle">第 ${pIdx + 1} / ${CONFIG.puzzles.length} 张 · ${N}×${N}${
          st.puzzleCompleted.includes(pIdx) ? ' · <b style="color:#3BB273">已完成</b>' : ''}</p>

        <div class="puzzle-tabs">
          ${CONFIG.puzzles.map((_, i) => `<span class="ptab ${i === pIdx ? 'on' : ''} ${st.puzzleCompleted.includes(i) ? 'done' : ''}">${i + 1}</span>`).join('')}
        </div>

        <div class="puzzle-board" id="board" style="--n:${N}"></div>
        <p class="puzzle-hint">👆 点两块碎片交换位置，把照片拼回原样</p>
        <div class="puzzle-tools">
          <button class="btn btn-ghost" id="preview-btn">看原图 3 秒</button>
          <button class="btn btn-ghost" id="shuffle-btn">重新打乱</button>
        </div>
      </div>`;

    const board = el.querySelector('#board');
    let selected = null;

    order.forEach((pieceNo, pos) => {
      const cell = document.createElement('button');
      cell.className = 'puzzle-cell';
      cell.dataset.pos = pos;
      cell.dataset.piece = pieceNo;
      const r = Math.floor(pieceNo / N), c = pieceNo % N;
      cell.style.backgroundImage = `url("${p.src}")`;
      cell.style.backgroundSize = `${N * 100}% ${N * 100}%`;
      cell.style.backgroundPosition = `${(c / (N - 1)) * 100}% ${(r / (N - 1)) * 100}%`;
      // 位置由顺序决定（网格流式布局自动摆放）
      cell.addEventListener('click', () => onTap(cell));
      board.appendChild(cell);
    });

    function onTap(cell) {
      if (cell.classList.contains('locked')) return;
      if (!selected) {
        selected = cell; cell.classList.add('sel');
        return;
      }
      if (selected === cell) { cell.classList.remove('sel'); selected = null; return; }

      // 交换背景图（位置不变，交换内容）
      const a = { bg: selected.style.backgroundImage, size: selected.style.backgroundSize, pos: selected.style.backgroundPosition, p: selected.dataset.piece };
      const b = { bg: cell.style.backgroundImage, size: cell.style.backgroundSize, pos: cell.style.backgroundPosition, p: cell.dataset.piece };
      selected.style.backgroundImage = b.bg; selected.style.backgroundSize = b.size;
      selected.style.backgroundPosition = b.pos; selected.dataset.piece = b.p;
      cell.style.backgroundImage = a.bg; cell.style.backgroundSize = a.size;
      cell.style.backgroundPosition = a.pos; cell.dataset.piece = a.p;

      selected.classList.remove('sel');
      selected.classList.add('pop');
      setTimeout(() => selected && selected.classList.remove('pop'), 300);
      cell.classList.add('pop');
      setTimeout(() => cell.classList.remove('pop'), 300);
      selected = null;

      if (checkWin()) win(p);
    }

    function checkWin() {
      const cells = [...board.querySelectorAll('.puzzle-cell')];
      return cells.every((c, i) => Number(c.dataset.piece) === i);
    }

    function win(p) {
      board.querySelectorAll('.puzzle-cell').forEach(c => {
        c.classList.add('locked', 'solved');
        c.style.backgroundImage = `url("${p.src}")`;
      });
      confetti(28);
      const done = [...new Set([...getState().puzzleCompleted, pIdx])];
      patchState({ puzzleCompleted: done });
      setTimeout(() => {
        showModal({
          title: '🧩 拼好啦！',
          html: `<div class="puzzle-fullwrap"><img src="${p.src}" alt=""
                   onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'img-placeholder',textContent:'📷 待替换：${p.src}'}))"></div>
                 <p style="margin-top:14px;font-family:'Kaiti SC',KaiTi,cursive;font-size:15px;color:var(--c-primary)">${p.caption}</p>`,
          buttons: [{
            text: done.length >= CONFIG.puzzles.length ? '打开回忆相册 ›' : '继续拼下一张 ›',
            onClick: () => {
              if (done.length >= CONFIG.puzzles.length) {
                window.__complete('puzzle', {
                  title: '🎉 三张回忆全部拼好',
                  text: '365 天专属回忆相册已为你解锁。', ctaText: '进入下一关 ›'
                });
              } else {
                pIdx = (pIdx + 1) % CONFIG.puzzles.length;
                paint();
              }
            }
          }]
        });
      }, 520);
    }

    el.querySelector('#preview-btn').addEventListener('click', () => {
      board.classList.add('previewing');
      board.style.setProperty('--preview-img', `url("${p.src}")`);
      setTimeout(() => board.classList.remove('previewing'), 3000);
    });
    el.querySelector('#shuffle-btn').addEventListener('click', () => {
      if (checkWin()) return;
      paint();
    });

    // 已完成的关卡：直接展示原图状态
    if (st.puzzleCompleted.includes(pIdx)) {
      [...board.querySelectorAll('.puzzle-cell')].forEach((c, i) => {
        const r = Math.floor(i / N), cc = i % N;
        c.dataset.piece = i;
        c.style.backgroundPosition = `${(cc / (N - 1)) * 100}% ${(r / (N - 1)) * 100}%`;
        c.classList.add('locked', 'solved');
      });
      board.querySelectorAll('.puzzle-cell').forEach(c => c.classList.remove('locked'));
    }
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function isSolved(order) { return order.every((v, i) => v === i); }
