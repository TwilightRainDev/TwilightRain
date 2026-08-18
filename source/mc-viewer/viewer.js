/* mc-viewer 初始化脚本：独立成文件而非内联，因站点 CSP script-src 无 'unsafe-inline' */
(function () {
  var canvas = document.getElementById("viewer-canvas");

  var viewer = new skinview3d.SkinViewer({
    canvas: canvas,
    width: 420,
    height: 560,
    skin: "TwilightRain.png",
    model: "auto-detect",
    nameTag: "TwilightRain",
    zoom: 0.8
  });

  viewer.autoRotate = true;
  viewer.autoRotateSpeed = 0.8;

  // 自动旋转
  var rotateBtn = document.querySelector('[data-toggle="rotate"]');
  rotateBtn.addEventListener("click", function () {
    viewer.autoRotate = !viewer.autoRotate;
    rotateBtn.classList.toggle("active", viewer.autoRotate);
  });

  // 行走动画
  var walkBtn = document.querySelector('[data-toggle="walk"]');
  walkBtn.addEventListener("click", function () {
    if (viewer.animation) {
      viewer.animation = null;
    } else {
      viewer.animation = new skinview3d.WalkingAnimation();
    }
    walkBtn.classList.toggle("active", !!viewer.animation);
  });

  // 臂型：自动 / 宽臂 / 窄臂
  var modelBtns = document.querySelectorAll("[data-model]");
  modelBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var model = btn.getAttribute("data-model");
      if (model === "auto") {
        viewer.loadSkin("TwilightRain.png", { model: "auto-detect" });
      } else {
        viewer.playerObject.modelType = model;
      }
      modelBtns.forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
    });
  });
})();
