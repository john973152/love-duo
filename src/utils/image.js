/**
 * 图片占位工具：素材缺失时显示占位块，不崩溃
 */
export function img(src, alt = '', className = '') {
  return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy"
    onerror="this.replaceWith(Object.assign(document.createElement('div'),
      {className:'img-placeholder',textContent:'📷 待替换素材：${src}'}))">`;
}
