/* about 页左下角悬浮皮肤：透明渲染，无 UI；默认静止，点击皮肤切换自动旋转，
 * 拖拽旋转 / 滚轮缩放
 * 独立成文件而非内联，因站点 CSP script-src 无 'unsafe-inline' */
(function () {
  var canvas = document.getElementById("mc-skin-canvas");
  if (!canvas) return;

  var viewer = new skinview3d.SkinViewer({
    canvas: canvas,
    width: 420,
    height: 560,
    skin: "/mc-skin/TwilightRain.png",
    model: "auto-detect",
    zoom: 0.8
  });

  // 透明背景：canvas 悬浮于页面深浅主题之上，显式保证不渲染场景背景
  if (viewer.scene) viewer.scene.background = null;

  // skinview3d 按构造参数把 width/height 写成 canvas 内联样式（优先级高于
  // 样式表，会让 CSS 尺寸失效）；清空内联宽高改由 CSS 控制显示尺寸，
  // 渲染缓冲保持高分辨率不变
  canvas.style.width = "";
  canvas.style.height = "";

  // 默认不旋转（autoRotate 默认 false）

  // 点击切换自动旋转：按下与松开位移 < 5px 视为点击，
  // 拖拽旋转松手同样会触发 click，须用位移阈值过滤
  var pressPos = null;
  canvas.addEventListener("pointerdown", function (e) {
    pressPos = [e.clientX, e.clientY];
  });
  canvas.addEventListener("pointerup", function (e) {
    if (!pressPos) return;
    var dx = e.clientX - pressPos[0];
    var dy = e.clientY - pressPos[1];
    pressPos = null;
    if (dx * dx + dy * dy < 25) {
      viewer.autoRotate = !viewer.autoRotate;
    }
  });
})();
