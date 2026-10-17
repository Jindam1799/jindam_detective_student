/* 카카오톡·인스타그램·네이버·밴드 등 앱 안의 브라우저(인앱 브라우저)로 열면
 * 소리·저장이 잘 안 되므로 크롬(없으면 기본 브라우저)으로 다시 열기.
 * - 안드로이드: intent:// 로 크롬 앱을 직접 열기 (크롬이 없으면 기본 브라우저)
 * - 아이폰·아이패드: googlechromes:// 로 크롬 열기 → 크롬이 없으면 사파리(카카오톡) 또는 안내 화면
 * - 자동으로 안 되면 「크롬으로 열기 / 주소 복사」 안내 화면을 보여 줌
 * 게임 화면보다 먼저 실행되도록 index.html <head>에서 불러옴
 */
(function () {
  'use strict';
  var ua = navigator.userAgent || '';
  var IN_APP = /KAKAOTALK|kakaostory|Instagram|NAVER\(inapp|NAVER|Line\/|FBAN|FBAV|FB_IAB|DaumApps|DaumDevice|everytimeApp|BAND\/|MicroMessenger|TikTok|musical_ly|Snapchat|Twitter|; wv\)/i;
  if (!IN_APP.test(ua)) return;

  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  var isKakao = /KAKAOTALK/i.test(ua);
  var isLine = /Line\//i.test(ua);
  var url = location.href;
  var noScheme = url.replace(/^https?:\/\//, '');
  var KEY = 'ht_open_chrome_try';

  function chromeIntent() {
    return 'intent://' + noScheme + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(url) + ';end';
  }
  function anyBrowserIntent() {
    return 'intent://' + noScheme + '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';
  }
  function openChrome() {
    if (isAndroid) { location.href = chromeIntent(); return; }
    if (isIOS) {
      location.href = 'googlechromes://' + noScheme;
      // 크롬이 없으면 1.5초 뒤 사파리로 (카카오톡은 바로 사파리로 넘기는 주소가 있음)
      setTimeout(function () {
        if (document.hidden) return;
        if (isKakao) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
      }, 1500);
      return;
    }
    if (isKakao) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
  }

  // 라인은 주소 뒤에 표시만 붙이면 외부 브라우저로 열림
  if (isLine && !/openExternalBrowser=1/.test(url)) {
    location.replace(url + (url.indexOf('?') < 0 ? '?' : '&') + 'openExternalBrowser=1');
    return;
  }

  // 같은 창에서 계속 다시 넘기지 않도록 한 번만 자동 시도
  var tried = false;
  try { tried = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1'); } catch (e) {}
  if (!tried) openChrome();

  // 자동으로 안 넘어가면 안내 화면
  function guide() {
    if (document.getElementById('ic-guide')) return;
    var how = isIOS
      ? '오른쪽 아래 <b>공유 버튼</b> 또는 <b>⋯</b> → <b>Safari로 열기</b>'
      : '오른쪽 위 <b>⋮</b> → <b>다른 브라우저로 열기</b>';
    var css = '#ic-guide{position:fixed;inset:0;z-index:9999;background:#FFF7EC;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Jua,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#3B3355}'
      + '#ic-guide .box{width:100%;max-width:360px;text-align:center;display:flex;flex-direction:column;gap:14px}'
      + '#ic-guide h2{font-weight:400;font-size:26px;line-height:1.25;margin:0}'
      + '#ic-guide p{font-size:17px;line-height:1.5;color:#857C9C;margin:0}'
      + '#ic-guide b{font-weight:400;color:#E06A1F}'
      + '#ic-guide button{font:inherit;font-size:20px;border:0;border-radius:18px;padding:15px;cursor:pointer}'
      + '#ic-guide .go{background:#FF8A3D;color:#fff;box-shadow:0 5px 0 #E06A1F}'
      + '#ic-guide .cp{background:#fff;color:#3B3355;box-shadow:0 5px 0 #E7D5BC;border:2px solid #E7D5BC}'
      + '#ic-guide .stay{background:none;color:#B3A99A;font-size:15px;padding:6px;text-decoration:underline}'
      + '#ic-guide .step{background:#fff;border-radius:16px;padding:12px;font-size:16px;line-height:1.5;border:2px dashed #E7D5BC}'
      + '#ic-guide img{width:92px;height:92px;margin:0 auto;display:block;border-radius:22px}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'ic-guide';
    d.innerHTML = '<div class="box">'
      + '<img src="icons/icon-192.png" alt="">'
      + '<h2>크롬에서 열어 주세요!</h2>'
      + '<p>앱 안에서 열면 중국어 소리가 안 나거나<br>도장 기록이 사라질 수 있어요.</p>'
      + '<button class="go" id="ic-go">크롬으로 열기</button>'
      + '<button class="cp" id="ic-cp">주소 복사하기</button>'
      + '<div class="step">자동으로 안 열리면<br>' + how + '</div>'
      + '<button class="stay" id="ic-stay">그냥 여기서 할래요</button>'
      + '</div>';
    document.body.appendChild(d);
    document.getElementById('ic-go').onclick = function () {
      openChrome();
      if (isAndroid) setTimeout(function () { if (!document.hidden) location.href = anyBrowserIntent(); }, 1500);
    };
    document.getElementById('ic-cp').onclick = function () {
      var b = this;
      function done() { b.textContent = '복사했어요! 크롬 주소창에 붙여 넣어요'; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fallback);
      else fallback();
      function fallback() {
        var t = document.createElement('textarea'); t.value = url; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); done(); } catch (e) { b.textContent = url; }
        t.remove();
      }
    };
    document.getElementById('ic-stay').onclick = function () { d.remove(); };
  }
  function later() { setTimeout(function () { if (!document.hidden) guide(); }, tried ? 0 : 2000); }
  if (document.body) later(); else document.addEventListener('DOMContentLoaded', later);
  // 크롬으로 넘어갔다가 다시 돌아온 경우에도 안내 화면을 보여 줌
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(guide, 300); });
})();
