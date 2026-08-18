/* about 页左下角悬浮皮肤：透明渲染，无 UI，拖拽旋转 / 滚轮缩放，自动旋转
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

  viewer.autoRotate = true;
  viewer.autoRotateSpeed = 0.8;
})();
