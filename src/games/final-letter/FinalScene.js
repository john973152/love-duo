/**
 * 第六幕：最终纪念画面
 * 新增巧思：第一周年照片下方引导她点击"拍照"，用摄像头拍下第二周年开始的第一张合照。
 * 照片压缩后存 localStorage（key 独立于闯关进度，不受每次重开影响），长按可保存到手机相册。
 */
import { sfx } from '../../utils/sfx.js';
import { LETTER } from './content.js';
import { img } from '../../utils/image.js';

const PHOTO_KEY = 'ld-anniv2-photo-v1'; // 二周年合照（dataURL）

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
        <div class="fl-camera-zone" id="fl-cam-zone"></div>
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

  setupCameraZone(root.querySelector('#fl-cam-zone'));
}

/* ================= 第二周年合照 · 拍照巧思 ================= */

function loadSavedPhoto() {
  try { return localStorage.getItem(PHOTO_KEY) || ''; } catch { return ''; }
}
function savePhoto(dataUrl) {
  try { localStorage.setItem(PHOTO_KEY, dataUrl); } catch { /* 容量满则本次会话内仍可看 */ }
}

function setupCameraZone(zone) {
  const saved = loadSavedPhoto();
  if (saved) renderTakenPhoto(zone, saved, { canRetake: true });
  else renderGuide(zone);
}

/** 引导态：小故事 + 拍照按钮 */
function renderGuide(zone) {
  zone.innerHTML = `
    <div class="cam-guide">
      <p class="cam-story">一年前，你把花藏在身后，被我一眼看穿。</p>
      <p class="cam-story">现在，轮到我们了——</p>
      <button class="fl-btn cam-btn" id="cam-open">📷 拍下第二周年的第一张合照</button>
      <p class="cam-note">（请看向你身边的那个人 😳）</p>
    </div>
    <div class="cam-live" hidden>
      <div class="cam-frame"><video id="cam-video" autoplay playsinline muted></video></div>
      <div class="cam-actions">
        <button class="fl-btn cam-btn" id="cam-shot">咔嚓 ✨</button>
        <button class="cam-cancel" id="cam-cancel">先不拍</button>
      </div>
      <p class="cam-note" id="cam-err" style="display:none"></p>
    </div>`;

  zone.querySelector('#cam-open').addEventListener('click', () => openCamera(zone));
  zone.querySelector('#cam-shot').addEventListener('click', () => takeShot(zone));
  zone.querySelector('#cam-cancel').addEventListener('click', () => {
    stopStream(zone);
    zone.querySelector('.cam-live').hidden = true;
    zone.querySelector('.cam-guide').style.display = '';
  });
}

async function openCamera(zone) {
  const guide = zone.querySelector('.cam-guide');
  const live = zone.querySelector('.cam-live');
  const err = zone.querySelector('#cam-err');
  const showErr = msg => {
    guide.style.display = '';
    live.hidden = true;
    err.style.display = '';
    err.textContent = msg;
  };
  if (!navigator.mediaDevices?.getUserMedia) {
    return showErr('这个浏览器不支持摄像头，用手机 Safari/Chrome 打开试试～');
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false
    });
    guide.style.display = 'none';
    live.hidden = false;
    const video = zone.querySelector('#cam-video');
    video.srcObject = stream;
    zone.__stream = stream;
    sfx.click();
  } catch (e) {
    showErr('没有拿到摄像头权限。请在浏览器设置里允许后，再点一次拍照～');
  }
}

function stopStream(zone) {
  zone.__stream?.getTracks().forEach(t => t.stop());
  zone.__stream = null;
  const video = zone.querySelector('#cam-video');
  if (video) video.srcObject = null;
}

/** 拍照：截取视频帧 → 镜像 → 压缩 → 展示/持久化 */
function capture(zone) {
  const video = zone.querySelector('#cam-video');
  if (!video || !video.videoWidth) return null;
  const MAX = 1080;
  let w = video.videoWidth, h = video.videoHeight;
  const scale = Math.min(1, MAX / Math.max(w, h));
  w = Math.round(w * scale); h = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.translate(w, 0); ctx.scale(-1, 1); // 与预览一致的前置镜像
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function takeShot(zone) {
  const dataUrl = capture(zone);
  if (!dataUrl) return;
  stopStream(zone);
  savePhoto(dataUrl);
  sfx.shutter();
  renderTakenPhoto(zone, dataUrl, { canRetake: true, justShot: true });
}

/** 成果态：拍立得展示 + 重拍入口 */
function renderTakenPhoto(zone, dataUrl, { canRetake, justShot }) {
  const today = `${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}`;
  zone.innerHTML = `
    <div class="cam-result ${justShot ? 'just-shot' : ''}">
      <figure class="cam-polaroid">
        <img src="${dataUrl}" alt="我们的第二周年">
        <figcaption>
          <span class="cam-cap">第二周年 · 从这一天开始</span>
          <span class="cam-date">${today}</span>
        </figcaption>
      </figure>
      ${justShot ? '<p class="cam-note">📷 拍好了！长按照片可以保存到手机相册</p>' : '<p class="cam-note">这是我们第二周年的第一张合照 ♡</p>'}
      ${canRetake ? '<button class="cam-retake" id="cam-retake">重新拍一张</button>' : ''}
    </div>
    <div class="cam-live" hidden></div>`;

  zone.querySelector('#cam-retake')?.addEventListener('click', () => renderGuide(zone));
}
