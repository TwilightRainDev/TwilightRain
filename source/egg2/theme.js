/*
 * 彩蛋页共用的主题开关。
 *
 * 站内的设置页把偏好写在 localStorage 的 theme-preference（auto / light / dark），
 * 这里照同一套来：有明确偏好就照办，auto 或没设置就跟系统。
 * 只写 <html data-theme>，配色全在样式里，脚本不碰别的。
 */
(function () {
  var KEY = 'theme-preference';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function pref() {
    try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; }
  }

  function apply() {
    var p = pref();
    var actual = (p === 'dark' || p === 'light') ? p : (mq && mq.matches ? 'dark' : 'light');
    if (document.documentElement.getAttribute('data-theme') !== actual) {
      document.documentElement.setAttribute('data-theme', actual);
    }
  }

  apply();

  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }

  // 站内改了偏好：别的标签页改完这里同步；同一页从设置页返回时也对一次
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); });
  window.addEventListener('pageshow', apply);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) apply(); });
})();
