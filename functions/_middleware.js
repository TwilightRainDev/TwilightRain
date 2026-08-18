// 301: twilightrain.pages.dev -> https://twilightrain.com（保留路径与查询串）
// 仅精确匹配 pages.dev 主域；preview 部署（<hash>.twilightrain.pages.dev）不受影响。
// 背景：_redirects 规则无法区分来源域名（会连同目标域名一起重定向导致循环），
// 故 hosts 判断放在 Pages Functions 中间件层。
// 参考: https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/
const TARGET_ORIGIN = "https://twilightrain.com";

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  if (url.hostname === "twilightrain.pages.dev") {
    return Response.redirect(TARGET_ORIGIN + url.pathname + url.search, 301);
  }
  return next();
}
