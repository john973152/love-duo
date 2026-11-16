/**
 * 通用弹窗组件：所有弹窗可关闭
 */
import { sfx } from '../utils/sfx.js';

export function showModal({ title = '', html = '', buttons = [], closable = true, onClose = null, onMount = null }) {
  sfx.pop();
  const root = document.getElementById('modal-root');
  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = `
    <div class="modal-box" role="dialog">
      ${closable ? '<button class="modal-close" aria-label="关闭">×</button>' : ''}
      ${title ? `<h3 class="modal-title">${title}</h3>` : ''}
      <div class="modal-body">${html}</div>
      <div class="modal-actions"></div>
    </div>`;
  const actions = mask.querySelector('.modal-actions');
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = `btn ${b.className || 'btn-primary'}`;
    if (b.id) btn.id = b.id;
    btn.textContent = b.text;
    btn.addEventListener('click', () => { if (b.onClick) b.onClick(); if (b.close !== false) close(); });
    actions.appendChild(btn);
  });
  function close() {
    mask.classList.add('closing');
    setTimeout(() => mask.remove(), 200);
    onClose && onClose();
  }
  if (closable) {
    mask.querySelector('.modal-close').addEventListener('click', close);
    mask.addEventListener('click', e => { if (e.target === mask) close(); });
  }
  root.appendChild(mask);
  onMount && onMount({ close, el: mask });
  return { close, el: mask };
}
