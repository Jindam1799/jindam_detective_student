/* 한자어 탐정단 — 게임 동작
 * 화면: 시작(이름) → 홈(사건 3개) → 사건 지도(미션 5개 + 도장 카드) → 미션 → 결과 → 도장 카드(선생님 확인)
 * 저장: 이 기기 브라우저 localStorage 'hanja_tamjeong_v1'
 */
(function () {
  'use strict';

  const KEY = 'hanja_tamjeong_v1';
  const $ = s => document.querySelector(s);
  const topEl = $('#top'), stage = $('#stage'), modal = $('#modal'), toastEl = $('#toast');

  const MISSIONS = [
    { key: 'sound', name: '소리 탐정', icon: 'i-ear',
      rule: ['중국어 소리를 잘 들어요.', '어떤 우리말인지 골라요.', '스피커를 누르면 다시 들려요.'] },
    { key: 'char', name: '한자 뜻 찾기', icon: 'i-hanja',
      rule: ['중국 한자를 보고 소리를 들어요.', '힌트 단어에 똑같이 들어 있는 글자예요.', '무슨 뜻인지 골라요.'] },
    { key: 'detect', name: '한자어 탐정', icon: 'i-magnifier',
      rule: ['장면마다 한자어가 4개씩 숨어 있어요.', '한자어만 콕! 눌러요.', '순우리말·외래어는 누르면 안 돼요.'] },
    { key: 'write', name: '따라 읽고 쓰기', icon: 'i-pencil',
      rule: ['소리를 듣고 큰 소리로 따라 말해요.', '획순대로 한 획씩 따라 써요. 순서가 틀리면 다시!', '모르면 「획순 보기」를 눌러요.'] },
    { key: 'react', name: '1초 반응', icon: 'i-bolt',
      rule: ['중국어 질문을 들어요.', '그림을 보고 대답을 빨리 골라요.', '3초 안에 고르면 「툭!」'] }
  ];

  /* ───────── 저장 ───────── */
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && d.v === 1) return Object.assign({ v: 1, name: '', prog: {}, ok: {}, bonus: {}, sound: true }, d);
    } catch (e) {}
    return { v: 1, name: '', prog: {}, ok: {}, bonus: {}, sound: true };
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ───────── 도우미 ───────── */
  let token = 0, timers = [], intervals = [], raf = 0;
  function newScreen() {
    token++; timers.forEach(clearTimeout); intervals.forEach(clearInterval); cancelAnimationFrame(raf);
    timers = []; intervals = [];
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    ACT = {}; closeModal();
  }
  function guard(fn) { const t = token; return (...a) => { if (t === token) fn(...a); }; }
  function later(fn, ms) { const id = setTimeout(guard(fn), ms); timers.push(id); return id; }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const starRow = (n, cls = 'stars') => `<span class="${cls}">${[1, 2, 3].map(i => `<svg class="${i <= n ? 'on' : ''}"><use href="#u-star"/></svg>`).join('')}</span>`;
  const lessonById = id => LESSONS.find(l => l.id === id);
  const mIndex = key => MISSIONS.findIndex(m => m.key === key);
  const prog = id => (S.prog[id] = S.prog[id] || {});
  const doneCount = id => MISSIONS.filter(m => prog(id)[m.key]).length;
  const allDone = id => doneCount(id) === MISSIONS.length;
  const pad = n => String(n).padStart(2, '0');
  const fmtDay = ts => { const d = new Date(ts); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
  const fmtTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  function setTheme(L) {
    const r = document.documentElement.style;
    r.setProperty('--c', L ? L.color : '#FF8A3D');
    r.setProperty('--soft', L ? L.soft : '#FFEBDD');
    r.setProperty('--deep', L ? L.deep : '#E06A1F');
  }
  function toast(msg, ms = 1800) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { toastEl.hidden = true; }, ms);
  }

  /* ───────── 클릭 처리 (한 곳에서) ───────── */
  let ACT = {}, MACT = {};
  const GLOBAL = {
    sound() { S.sound = !S.sound; save(); if (!S.sound && 'speechSynthesis' in window) speechSynthesis.cancel(); renderSoundBtn(); fx('tap'); toast(S.sound ? '소리 켜짐' : '소리 꺼짐 (다시 누르면 켜져요)'); if (S.sound) TTS.speak('你好'); },
    home() { fx('tap'); showHome(); },
    gear() { fx('tap'); askPin(() => teacherMenu()); }
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const a = b.dataset.act;
    const fn = (b.closest('#modal') ? MACT[a] : ACT[a]) || GLOBAL[a];
    if (fn) fn(b, e);
  });
  modal.addEventListener('click', e => { if (e.target === modal && MACT._outside) MACT._outside(); });

  /* ───────── 확대·스크롤 막기 ───────── */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', e => { if (!e.target.closest('canvas, .hw-box')) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault(); });
  document.addEventListener('contextmenu', e => { if (!e.target.closest('input')) e.preventDefault(); });

  /* ───────── 효과음 (Web Audio) ───────── */
  let actx = null;
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, start, dur, type = 'triangle', vol = .18) {
    const c = audio(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + start + .015);
    g.gain.exponentialRampToValueAtTime(.001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination); o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + .05);
  }
  function fx(kind) {
    if (!S.sound) return;
    if (kind === 'tap') tone(620, 0, .08, 'sine', .12);
    else if (kind === 'ok') { tone(784, 0, .14); tone(1047, .1, .22); }
    else if (kind === 'no') { tone(260, 0, .16, 'square', .07); tone(200, .12, .22, 'square', .07); }
    else if (kind === 'tuk') { tone(1047, 0, .1, 'square', .08); tone(1568, .08, .2, 'triangle', .16); }
    else if (kind === 'stamp') { tone(110, 0, .18, 'sine', .4); tone(523, .18, .14); tone(659, .3, .14); tone(784, .42, .3); }
    else if (kind === 'win') { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * .11, .2)); }
  }

  /* ───────── 중국어 음성 (TTS) ───────── */
  const TTS = {
    voice: null,
    pick() {
      if (!('speechSynthesis' in window)) return;
      const vs = speechSynthesis.getVoices();
      const zh = vs.filter(v => /^(zh[-_](CN|Hans)|cmn)/i.test(v.lang));
      const any = vs.filter(v => /^zh/i.test(v.lang));
      const fem = /(Tingting|Ting-Ting|Xiaoxiao|Xiaoyi|Xiaohan|Huihui|Yaoyao|Lili|Shanshan|female|女)/i;
      // 엣지 자연 음성(Xiaoxiao Online) → 여성 음성 → 구글 중국어 → 아무 중국어
      this.voice = zh.find(v => /Natural|Online/i.test(v.name) && fem.test(v.name)) || zh.find(v => fem.test(v.name))
        || zh.find(v => /Google/i.test(v.name)) || zh[0] || any[0] || null;
      this.count = vs.length;
    },
    count: 0, cur: null, warned: false,
    speak(text, onend, rate = .8) {
      const fin = onend ? guard(onend) : null;
      if (!('speechSynthesis' in window) || !S.sound) { if (fin) later(fin, 400); return; }
      if (!this.voice) this.pick();
      if (this.count && !this.voice) noVoiceHelp();
      const ss = speechSynthesis;
      ss.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; u.rate = rate; u.pitch = 1.05;
      try { if (this.voice) u.voice = this.voice; } catch (e) { this.voice = null; }
      this.cur = u; // 크롬: 참조가 없으면 소리가 중간에 사라지는 문제 방지
      let done = false;
      const end = () => { if (done) return; done = true; document.querySelectorAll('.playing').forEach(x => x.classList.remove('playing')); if (fin) fin(); };
      u.onend = end;
      u.onerror = e => { if (e && e.error === 'not-allowed') toast('화면을 한 번 누르면 소리가 나요!'); end(); };
      later(end, 1500 + text.length * 520);
      // 크롬 데스크톱: cancel 직후 바로 speak 하면 소리가 씹히는 문제 → 잠깐 쉬고 말하기
      const tk = token;
      setTimeout(() => { if (tk !== token) return; try { ss.resume(); ss.speak(u); } catch (e) { end(); } }, 60);
    }
  };
  if ('speechSynthesis' in window) {
    TTS.pick();
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', () => TTS.pick());
    else speechSynthesis.onvoiceschanged = () => TTS.pick();
  }
  function noVoiceHelp() {
    if (TTS.warned) return; TTS.warned = true;
    const win = /Windows/i.test(navigator.userAgent);
    openModal(`<div class="ic">${ic('u-speaker')}</div><h2>중국어 목소리가 없어요</h2>
      <p>이 기기·브라우저에는 중국어 음성이 없어서<br>소리가 나지 않아요.</p>
      <div class="tipbox">${win
        ? '① <b>크롬</b>이나 <b>엣지</b>로 열어 주세요. (가장 쉬워요)<br>② 또는 윈도우 <b>설정 → 시간 및 언어 → 언어</b>에서 <b>중국어(간체, 중국)</b>를 추가하고 음성을 받아 주세요.'
        : '<b>크롬</b>이나 <b>사파리</b>로 열어 주세요.<br>그래도 안 되면 기기 설정에서 중국어 음성을 받아 주세요.'}</div>
      <button class="btn big" data-act="x">알겠어요</button>`, { x: closeModal, _outside: closeModal });
  }
  function speakBtn(btn, text, onend) { if (btn) btn.classList.add('playing'); TTS.speak(text, onend); }

  /* 중국어 글꼴: 게임에 나오는 글자만 골라서 가볍게 불러오기 */
  (function loadZhFont() {
    const set = new Set(JSON.stringify(LESSONS).replace(/[\x00-⿿가-힯]/g, ''));
    '字一二三我的生日是月号你在哪里这什么'.split('').forEach(c => set.add(c));
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&display=swap&text=' + encodeURIComponent([...set].join(''));
    document.head.appendChild(link);
  })();

  /* ───────── 위쪽 바 ───────── */
  function header(o = {}) {
    let left = '';
    if (o.back) left = `<button class="tb-btn" data-act="${o.back}" aria-label="뒤로">${ic(o.back === 'home' ? 'u-home' : 'u-back')}</button>`;
    let mid = o.prog
      ? `<div class="tb-prog"><b id="pgLabel">${esc(o.prog)}</b><div class="bar"><i id="pgBar"></i></div></div>`
      : `<div class="tb-title">${o.mascot ? ic('mascot') : ''}<span>${esc(o.title || '')}</span></div>`;
    let right = `<button class="tb-btn" data-act="sound" id="sndBtn" aria-label="소리"></button>`;
    if (o.gear) right += `<button class="tb-btn" data-act="gear" aria-label="선생님">${ic('u-gear')}</button>`;
    topEl.innerHTML = left + mid + right;
    renderSoundBtn();
  }
  function renderSoundBtn() { const b = $('#sndBtn'); if (b) b.innerHTML = ic(S.sound ? 'u-speaker' : 'u-mute'); }
  function setProg(label, v) { const l = $('#pgLabel'), b = $('#pgBar'); if (l) l.textContent = label; if (b) b.style.width = Math.round(v * 100) + '%'; }
  function render(html) { stage.innerHTML = html; }

  /* ───────── 팝업 ───────── */
  function openModal(html, acts) { MACT = acts || {}; modal.innerHTML = `<div class="sheet">${html}</div>`; modal.hidden = false; }
  function closeModal() { modal.hidden = true; modal.innerHTML = ''; MACT = {}; }

  /* ═════════ 시작 화면 ═════════ */
  function showIntro() {
    newScreen(); setTheme(null);
    header({ mascot: true, title: '한자어 탐정단' });
    render(`<section class="screen intro">
      <div class="hero">${ic('mascot', 'bob')}</div>
      <div class="brand-small">중국어가 툭! · 진담중국어</div>
      <h1 class="title">한자어 <em>탐정단</em></h1>
      <p class="sub">우리말 속 한자를 찾으면<br>중국어가 툭!</p>
      <div class="name-box"><input id="nm" maxlength="8" placeholder="탐정 이름을 써요" autocomplete="off" enterkeyhint="go" value="${esc(S.name)}"></div>
      <button class="btn big orange" data-act="start">탐정 시작!</button>
      <p class="foot">© 2026 진담중국어 · All rights reserved.</p>
    </section>`);
    const inp = $('#nm');
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ACT.start(); });
    ACT.start = () => {
      const n = inp.value.trim();
      if (!n) { toast('이름을 먼저 써 주세요!'); inp.focus(); fx('no'); return; }
      inp.blur(); S.name = n; save(); fx('ok'); unlockSpeech(); showHome();
    };
  }
  function unlockSpeech() {
    audio();
    // 아이폰·아이패드: 첫 소리는 손가락 터치 순간에 한 번 내야 이후 소리가 남 (조용한 '。' 한 번)
    if (unlockSpeech.done || !('speechSynthesis' in window)) return;
    unlockSpeech.done = true;
    try { TTS.pick(); const u = new SpeechSynthesisUtterance('。'); u.lang = 'zh-CN'; u.volume = 0; if (TTS.voice) u.voice = TTS.voice; speechSynthesis.speak(u); } catch (e) {}
  }

  /* ═════════ 홈 ═════════ */
  function showHome() {
    if (!S.name) return showIntro();
    newScreen(); setTheme(null);
    header({ mascot: true, title: '한자어 탐정단', gear: true });
    const cases = LESSONS.map(L => {
      const p = prog(L.id), ok = S.ok[L.id];
      const dots = MISSIONS.map(m => `<i class="${p[m.key] ? 'on' : ''}"></i>`).join('');
      const badge = ok ? '<span class="solved ok">확인<br>완료</span>' : allDone(L.id) ? '<span class="solved">해결!</span>' : '';
      return `<button class="case" data-act="lesson" data-id="${L.id}" style="--c:${L.color};--soft:${L.soft};--deep:${L.deep}">
        <span class="case-ic">${ic('i-' + L.icon)}</span>
        <span class="case-no">사건 ${L.no}</span>
        <span class="case-title">${esc(L.title)}</span>
        <span class="case-dots">${dots}</span>${badge}</button>`;
    }).join('');
    render(`<section class="screen home">
      <div class="hello">${ic('mascot')}<div><b>${esc(S.name)} 탐정님!</b><br>오늘은 어떤 사건을 풀까요?</div>
        <button data-act="rename" aria-label="이름 바꾸기">${ic('i-pencil')}</button></div>
      <div class="cases">${cases}</div>
      <p class="foot">© 2026 진담중국어 · 배운 중국어가 1초 안에 툭!</p>
    </section>`);
    ACT.lesson = b => { fx('tap'); unlockSpeech(); showLesson(b.dataset.id); };
    ACT.rename = () => {
      openModal(`<div class="ic">${ic('mascot')}</div><h2>이름 바꾸기</h2>
        <div class="name-box"><input id="nm2" maxlength="8" value="${esc(S.name)}" autocomplete="off"></div>
        <div class="row"><button class="btn white" data-act="no">취소</button><button class="btn orange" data-act="yes">바꾸기</button></div>`,
      { no: closeModal, _outside: closeModal,
        yes() { const v = $('#nm2').value.trim(); if (!v) return; S.name = v; save(); closeModal(); showHome(); } });
    };
  }

  /* ═════════ 사건 지도 ═════════ */
  function showLesson(id) {
    const L = lessonById(id); if (!L) return showHome();
    newScreen(); setTheme(L);
    header({ back: 'home', title: `사건 ${L.no} · ${L.title}` });
    const p = prog(id);
    let nextFound = false;
    const tiles = MISSIONS.map((m, i) => {
      const done = !!p[m.key];
      const open = i === 0 || !!p[MISSIONS[i - 1].key];
      let cls = 'tile';
      if (done) cls += ' done'; else if (open && !nextFound) { cls += ' next'; nextFound = true; } else if (!open) cls += ' locked';
      return `<button class="${cls}" data-act="mission" data-i="${i}">
        <span class="num">${i + 1}</span>${open ? '' : ic('u-lock', 'lk')}
        <span class="ic">${ic(m.icon)}</span><span class="nm">${m.name}</span>
        ${done ? starRow(p[m.key].stars) : '<span class="stars"></span>'}</button>`;
    }).join('');
    const ready = allDone(id);
    const certTile = `<button class="tile cert ${ready ? 'ready' : 'locked'}" data-act="cert">
      ${ready ? '' : ic('u-lock', 'lk')}<span class="ic">${ic('i-stamp')}</span><span class="nm">도장 카드</span>
      <span class="stars"></span></button>`;
    const d = L.dialog;
    render(`<section class="screen lesson">
      <div class="brief">
        <div class="brief-h">${ic('i-magnifier')}${esc(L.question)}</div>
        <div class="talk"><span class="who">A</span><div class="tx"><span class="zh">${d[0].zh}</span><span class="py">${d[0].py}</span><span class="ko">${esc(d[0].ko)}</span></div>
          <button class="say" data-act="say" data-k="0">${ic('u-speaker')}</button></div>
        <div class="talk b"><span class="who">B</span><div class="tx"><span class="zh">${d[1].zh}</span><span class="py">${d[1].py}</span><span class="ko">${esc(d[1].ko)}</span></div>
          <button class="say" data-act="say" data-k="1">${ic('u-speaker')}</button></div>
      </div>
      <div class="path">${tiles}${certTile}</div>
      ${bonusBar(L, ready)}
    </section>`);
    ACT.say = b => speakBtn(null, d[+b.dataset.k].zh);
    ACT.mission = b => {
      const i = +b.dataset.i;
      if (b.classList.contains('locked')) { fx('no'); toast('앞 미션을 먼저 풀어요!'); return; }
      fx('tap'); openRules(L, i);
    };
    ACT.cert = () => {
      if (!ready) { fx('no'); toast('미션 5개를 모두 풀면 도장 카드가 열려요!'); return; }
      fx('tap'); showCert(id);
    };
    ACT.bonus = () => {
      if (!ready) { fx('no'); toast('미션 5개를 모두 풀면 보상 게임이 열려요!'); return; }
      fx('tap'); openCardRules(L);
    };
  }

  /* 사건 지도 아래 「보상 게임」 줄 */
  function bonusBar(L, ready) {
    const b = (S.bonus || {})[L.id];
    const sub = !ready ? '미션 5개를 다 풀면 열려요'
      : b ? `최고 기록 · 뒤집기 ${b.best}번` : '보상이 열렸어요! 눌러서 시작';
    return `<button class="bonus ${ready ? 'ready' : 'locked'}${ready && !b ? ' fresh' : ''}" data-act="bonus">
      <span class="b-ic">${ic('i-cards')}</span>
      <span class="b-t"><b>보상 게임 · 짝꿍 카드</b><small>${sub}</small></span>
      ${ready ? (b ? starRow(b.stars) : '') : ic('u-lock', 'b-lk')}</button>`;
  }

  function openRules(L, i) {
    const m = MISSIONS[i];
    openModal(`<div class="ic">${ic(m.icon)}</div>
      <h2>미션 ${i + 1}. ${m.name}</h2>
      <ul class="rules">${m.rule.map((r, k) => `<li><b>${k + 1}</b>${esc(r)}</li>`).join('')}</ul>
      <div class="row"><button class="btn white" data-act="no">나중에</button><button class="btn big" data-act="go">시작!</button></div>`,
    { no: closeModal, _outside: closeModal, go() { closeModal(); fx('tap'); unlockSpeech(); RUN[m.key](L); } });
  }

  /* ───────── 미션 공통 ───────── */
  function Queue(items) {
    const q = items.slice(); let solved = 0; const total = items.length;
    return {
      get cur() { return q[0]; }, get solved() { return solved; }, total,
      get done() { return q.length === 0; },
      ok() { q.shift(); solved++; },
      bad() { const it = q.shift(); q.splice(Math.min(2, q.length), 0, it); }
    };
  }
  function missionHeader(L, key) {
    header({ back: 'quit', prog: MISSIONS[mIndex(key)].name });
    ACT.quit = () => {
      fx('tap');
      openModal(`<div class="ic">${ic('mascot')}</div><h2>미션을 그만할까요?</h2><p>지금까지 푼 것은 저장되지 않아요.</p>
        <div class="row"><button class="btn white" data-act="stop">그만하기</button><button class="btn" data-act="keep">계속하기</button></div>`,
      { keep: closeModal, _outside: closeModal, stop() { showLesson(L.id); } });
    };
  }
  function starsFor(miss) { return miss === 0 ? 3 : miss <= 2 ? 2 : 1; }

  function finish(L, key, miss, tipHtml, extra) {
    const stars = starsFor(miss);
    const p = prog(L.id);
    const wasDone = allDone(L.id);
    const old = p[key];
    p[key] = { stars: Math.max(stars, old ? old.stars : 0), at: Date.now() };
    save();
    fx('stamp');
    const i = mIndex(key);
    const msg = stars === 3 ? '완벽한 탐정이에요!' : stars === 2 ? '잘했어요! 조금만 더 연습해요.' : '끝까지 해냈어요! 한 번 더 해 볼까요?';
    const last = i === MISSIONS.length - 1 || allDone(L.id);
    const nextBtn = allDone(L.id)
      ? `<button class="btn big" data-act="cert">도장 카드 받기</button>`
      : `<button class="btn big" data-act="next">다음 미션</button>`;
    openModal(`<div class="stamp-big">해결!</div>
      <h2>${MISSIONS[i].name}</h2>
      <div class="stars-big">${[1, 2, 3].map(k => `<svg class="${k <= stars ? 'on' : ''}"><use href="#u-star"/></svg>`).join('')}</div>
      <p>${msg}${extra ? '<br>' + extra : ''}</p>
      ${!wasDone && allDone(L.id) ? `<div class="unlock-note">${ic('i-cards')}<span>보상 게임 <b>「짝꿍 카드」</b>가 열렸어요!</span></div>` : ''}
      ${tipHtml ? `<div class="tipbox">${tipHtml}</div>` : ''}
      <div class="row"><button class="btn white" data-act="map">사건 지도</button>${nextBtn}</div>`,
    {
      map() { showLesson(L.id); },
      next() {
        const n = MISSIONS.findIndex(m => !prog(L.id)[m.key]);
        showLesson(L.id); openRules(L, n < 0 ? Math.min(i + 1, MISSIONS.length - 1) : n);
      },
      cert() { showCert(L.id); }
    });
    if (last && allDone(L.id)) later(() => fx('win'), 700);
  }

  function choiceHtml(opts, render) {
    return `<div class="choices">${opts.map((o, k) => `<button class="choice" data-act="pick" data-k="${k}">${render(o)}</button>`).join('')}</div>`;
  }
  function markChoices(k, right) {
    document.querySelectorAll('.choice').forEach((b, n) => {
      b.disabled = true;
      if (n === right) b.classList.add('ok');
      else if (n === k) b.classList.add('no');
      else b.classList.add('dim');
    });
  }

  const RUN = {};

  /* ═════════ 미션 1. 소리 탐정 ═════════ */
  RUN.sound = function (L) {
    newScreen(); setTheme(L); missionHeader(L, 'sound');
    const S0 = L.sound;
    let items = S0.items.slice();
    if (S0.pick) {
      const must = items.filter(x => S0.must.includes(x.zh));
      const rest = shuffle(items.filter(x => !S0.must.includes(x.zh))).slice(0, S0.pick - must.length);
      items = must.concat(rest);
    }
    const pool = [...new Set(S0.items.map(x => x.ko).concat(S0.extra || []))];
    const Q = Queue(shuffle(items));
    let miss = 0;
    function next() {
      setProg(`소리 탐정 ${Q.solved}/${Q.total}`, Q.solved / Q.total);
      if (Q.done) {
        const ex = S0.items.slice(0, 2).map(x => `${esc(x.ko)} <span class="zh">${x.zh}</span> <span class="py">${x.py}</span>`).join(' · ');
        return finish(L, 'sound', miss, `우리말 한자어와 중국어는 소리가 닮았어요!<br>${ex}`);
      }
      const it = Q.cur;
      const opts = shuffle([it.ko].concat(shuffle(pool.filter(k => k !== it.ko)).slice(0, 3)));
      const right = opts.indexOf(it.ko);
      render(`<section class="screen play wide">
        <div class="q-area">
          <button class="big-speaker" data-act="play" aria-label="다시 듣기">${ic('u-speaker')}</button>
          <div class="hint">소리를 듣고 우리말을 골라요</div>
          <div class="reveal hide" id="rv"><span class="zh">${it.zh}</span><span class="py">${it.py}</span></div>
        </div>
        ${choiceHtml(opts, o => esc(o))}
      </section>`);
      const spk = $('.big-speaker');
      ACT.play = () => speakBtn(spk, it.zh);
      later(() => speakBtn(spk, it.zh), 350);
      ACT.pick = b => {
        const k = +b.dataset.k;
        markChoices(k, right);
        $('#rv').classList.remove('hide');
        if (k === right) { fx('ok'); Q.ok(); later(next, 1300); }
        else { fx('no'); miss++; Q.bad(); later(next, 2000); }
        later(() => speakBtn(spk, it.zh), 250);
      };
    }
    next();
  };

  /* ═════════ 미션 2. 한자 뜻 찾기 ═════════ */
  RUN.char = function (L) {
    newScreen(); setTheme(L); missionHeader(L, 'char');
    const Q = Queue(shuffle(L.chars));
    let miss = 0;
    function next() {
      setProg(`한자 뜻 찾기 ${Q.solved}/${Q.total}`, Q.solved / Q.total);
      if (Q.done) return finish(L, 'char', miss, esc(L.charTip).replace(/([一-鿿]+)/g, '<span class="zh">$1</span>'));
      const it = Q.cur;
      const opts = shuffle([it.hun].concat(shuffle(L.chars.filter(c => c.hun !== it.hun).map(c => c.hun)).slice(0, 3)));
      const right = opts.indexOf(it.hun);
      const same = it.s === it.t;
      render(`<section class="screen play wide">
        <div class="q-area">
          <div class="char-card"><span class="zh">${it.s}</span><span class="py">${it.py}</span>
            <button class="say" data-act="play">${ic('u-speaker')}</button></div>
          <div class="clue">힌트 · <b>${esc(it.ex)}</b> 에 들어 있어요</div>
          <div class="trad reveal hide" id="rv" style="min-height:0">${same
            ? `우리 한자랑 똑같아요! <span class="zh">${it.t}</span>`
            : `우리 한자 <span class="zh">${it.t}</span><span class="ar">→</span>중국 한자 <span class="zh">${it.s}</span>`}</div>
        </div>
        ${choiceHtml(opts, o => esc(o))}
      </section>`);
      ACT.play = () => TTS.speak(it.s);
      later(() => TTS.speak(it.s), 350);
      ACT.pick = b => {
        const k = +b.dataset.k;
        markChoices(k, right);
        $('#rv').classList.remove('hide');
        if (k === right) { fx('ok'); Q.ok(); later(next, 1500); }
        else { fx('no'); miss++; Q.bad(); later(next, 2200); }
      };
    }
    next();
  };

  /* ═════════ 미션 3. 한자어 탐정 ═════════ */
  RUN.detect = function (L) {
    newScreen(); setTheme(L); missionHeader(L, 'detect');
    let si = 0, miss = 0;
    function scene() {
      const sc = L.scenes[si];
      setProg(`한자어 탐정 ${si + 1}/${L.scenes.length}`, si / L.scenes.length);
      const words = shuffle(sc.words);
      const need = words.filter(w => w[1]).length;
      let found = 0;
      render(`<section class="screen play">
        <div class="scene-h"><span class="ic">${ic('i-' + sc.icon)}</span><span class="nm">${esc(sc.name)}</span>
          <span class="found" id="fd">${'<i></i>'.repeat(need)}</span></div>
        <div class="mission-line">한자어 <b>${need}개</b>를 찾아 콕! 눌러요</div>
        <div class="words">${words.map((w, k) => `<button class="word" data-act="tap" data-k="${k}">${esc(w[0])}<small></small></button>`).join('')}</div>
      </section>`);
      const btns = [...document.querySelectorAll('.word')];
      function revealRest() {
        btns.forEach((b, k) => {
          if (b.disabled) return;
          b.disabled = true; b.classList.add('miss');
          b.querySelector('small').textContent = words[k][2] || '';
        });
      }
      ACT.tap = b => {
        const k = +b.dataset.k, w = words[k];
        b.disabled = true;
        const sm = b.querySelector('small');
        if (w[1]) {
          found++; fx('ok');
          b.classList.add('hit'); sm.className = 'zh'; sm.textContent = w[1];
          const dots = document.querySelectorAll('#fd i');
          dots[found - 1].classList.add('on'); dots[found - 1].innerHTML = ic('u-check');
          setProg(`한자어 탐정 ${si + 1}/${L.scenes.length}`, (si + found / need) / L.scenes.length);
          if (found === need) {
            revealRest();
            later(() => { si++; if (si < L.scenes.length) scene(); else done(); }, 1500);
          }
        } else {
          miss++; fx('no');
          b.classList.add('miss', 'now'); sm.textContent = w[2] || '한자어 아님';
        }
      };
    }
    function done() {
      const t = L.trap;
      finish(L, 'detect', miss,
        `한자어라고 다 중국어로 똑같이 통하지는 않아요.<br>
        <span class="o">✔</span> ${esc(t.good[0])} → <span class="zh">${t.good[1]}</span><br>
        <span class="x">✘</span> ${esc(t.bad[0])} → <span class="zh">${t.bad[1]}</span> <span class="py">${t.bad[2]}</span> (전혀 다른 말!)`);
    }
    scene();
  };

  /* ═════════ 미션 4. 따라 읽고 쓰기 (획순 채점) ═════════
   * Hanzi Writer(lib/hanzi-writer.js)로 한 획씩 채점: 순서·방향이 맞는 획만 인정
   * 글자 데이터는 hanzi/<유니코드>.json (저장소 안에 들어 있어 인터넷이 불안정해도 동작)
   */
  const HW_OK = () => typeof window.HanziWriter === 'function';
  function hwLoader(ch, onLoad, onError) {
    fetch('hanzi/' + ch.codePointAt(0).toString(16).toUpperCase() + '.json')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(onLoad).catch(onError);
  }
  RUN.write = function (L) {
    newScreen(); setTheme(L); missionHeader(L, 'write');
    const items = L.words;
    let i = 0, miss = 0;
    function listen() {
      setProg(`따라 읽고 쓰기 ${i}/${items.length}`, i / items.length);
      if (i >= items.length) return finish(L, 'write', miss, esc(L.wordTip).replace(/([一-鿿。？]+)/g, '<span class="zh">$1</span>'));
      const it = items[i];
      render(`<section class="screen play">
        <div class="stepper"><span class="on">① 듣고 따라 말하기</span><span>② 획순대로 쓰기</span></div>
        <div class="say-zone">
          <div><div class="zh">${it.zh}</div><div class="py">${it.py}</div><div class="hint">${esc(it.ko)}</div></div>
          <button class="big-speaker" style="width:min(6.5rem,28vw);height:min(6.5rem,28vw)" data-act="play">${ic('u-speaker')}</button>
          <div class="hint">선생님 목소리를 듣고 큰 소리로 따라 말해요!</div>
        </div>
        <button class="btn big" data-act="said" id="saidBtn" disabled>${ic('u-mic')} 따라 말했어요!</button>
      </section>`);
      const spk = $('.big-speaker'), sb = $('#saidBtn');
      const enable = () => later(() => { sb.disabled = false; }, 500);
      ACT.play = () => speakBtn(spk, it.zh, enable);
      later(() => speakBtn(spk, it.zh, enable), 350);
      later(() => { sb.disabled = false; }, 4000);
      ACT.said = () => { fx('ok'); trace(it); };
    }

    function trace(it) {
      const chars = [...it.zh];
      let ci = 0, writer = null, busy = false, strokes = 0, done = 0, mistakes = 0;
      render(`<section class="screen play writing">
        <div class="wcard"><span class="chips" id="chips">${chars.map((c, n) => `<span class="chip zh" data-n="${n}">${c}</span>`).join('')}</span>
          <span class="meta"><span class="py">${it.py}</span><span class="ko">${esc(it.ko)}</span></span>
          <button class="say" data-act="play">${ic('u-speaker')}</button></div>
        <div class="hw-wrap" id="hww"><div class="hw-box" id="hw"></div></div>
        <div class="hw-status" id="hst">순서대로 한 획씩 써요</div>
        <div class="tools"><button class="btn white" data-act="redo">${ic('u-erase')} 다시</button>
          <button class="btn show-order" data-act="order" id="ordBtn">${ic('i-pencil')} 획순 보기</button></div>
      </section>`);
      ACT.play = () => TTS.speak(it.zh);
      const wrap = $('#hww'), box = $('#hw'), st = $('#hst'), ordBtn = $('#ordBtn');
      const say = (msg, cls = '') => { st.className = 'hw-status ' + cls; st.innerHTML = msg; };
      const size = () => { const r = wrap.getBoundingClientRect(); return Math.max(140, Math.floor(Math.min(r.width, r.height, 680)) - 8); };
      const countText = () => `획 <b>${done}</b> / ${strokes}`;

      if (!HW_OK()) { say('획순 프로그램을 불러오지 못했어요. 새로고침해 주세요.', 'bad'); return; }

      function chips() {
        document.querySelectorAll('#chips .chip').forEach((c, n) => { c.classList.toggle('on', n === ci); c.classList.toggle('ok', n < ci); });
      }
      function startQuiz() {
        if (!writer) return;
        done = 0; busy = false; ordBtn.disabled = false;
        writer.hideCharacter(); writer.showOutline();
        say(`${countText()} · 순서대로 한 획씩 써요`);
        writer.quiz({
          leniency: 1.25, showHintAfterMisses: 2, highlightOnComplete: true, acceptBackwardsStrokes: false,
          onCorrectStroke: guard(d => {
            done = d.strokeNum + 1; fx('tap');
            say(d.strokesRemaining ? `${countText()} · 잘했어요!` : `${countText()}`, 'good');
          }),
          onMistake: guard(d => {
            mistakes++; fx('no');
            const msg = d.isBackwards ? '방향이 반대예요! 처음 쓰는 곳부터 그어요.'
              : d.mistakesOnStroke >= 2 ? '반짝이는 획을 따라 써 봐요!'
              : '순서가 달라요! 다음 획을 찾아봐요.';
            say(`${countText()} · ${msg}`, 'bad');
          }),
          onComplete: guard(sum => {
            if (sum.totalMistakes >= 3) miss++;
            fx('ok'); say(`<b>${chars[ci]}</b> 합격! ${sum.totalMistakes === 0 ? '완벽해요!' : ''}`, 'good');
            ordBtn.disabled = true;
            later(nextChar, 1100);
          })
        });
      }
      function load() {
        chips();
        box.innerHTML = '';
        const s = size();
        box.style.width = box.style.height = s + 'px';
        say('글자를 불러오는 중…');
        writer = HanziWriter.create(box, chars[ci], {
          width: s, height: s, padding: Math.round(s * .07),
          charDataLoader: hwLoader,
          showCharacter: false, showOutline: true,
          strokeColor: '#3B3355', outlineColor: '#E6DDD0', drawingColor: L.deep,
          highlightColor: '#FFC93C', highlightCompleteColor: L.color, radicalColor: null,
          drawingWidth: Math.max(14, Math.round(s / 18)),
          strokeAnimationSpeed: 1.3, delayBetweenStrokes: 350, strokeHighlightSpeed: 1.5,
          onLoadCharDataSuccess: guard(data => { strokes = data.strokes.length; startQuiz(); }),
          onLoadCharDataError: guard(() => say('글자 정보를 불러오지 못했어요.', 'bad'))
        });
      }
      function nextChar() {
        ci++;
        if (ci < chars.length) return load();
        chips(); TTS.speak(it.zh);
        say(`<b>${it.zh}</b> 다 썼어요!`, 'good');
        i++; later(listen, 1200);
      }
      ACT.order = () => {
        if (!writer || busy) return;
        busy = true; ordBtn.disabled = true; fx('tap');
        say('획순을 잘 보세요!', '');
        writer.cancelQuiz();
        writer.hideCharacter({ duration: 0 });
        writer.animateCharacter({ onComplete: guard(() => later(() => { writer.hideCharacter(); startQuiz(); }, 600)) });
      };
      ACT.redo = () => { if (!writer || busy) return; fx('tap'); writer.cancelQuiz(); startQuiz(); };
      const onResize = guard(() => { if (!writer) return; const s = size(); box.style.width = box.style.height = s + 'px'; writer.updateDimensions({ width: s, height: s, padding: Math.round(s * .07) }); });
      window.addEventListener('resize', onResize);
      const t = token; const off = setInterval(() => { if (t !== token) { window.removeEventListener('resize', onResize); clearInterval(off); } }, 1000);
      load();
    }
    listen();
  };

  /* ═════════ 미션 5. 1초 반응 ═════════ */
  const NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const NPY = ['', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ', 'shí'];
  function zhNum(n) {
    if (n <= 10) return [NUM[n], NPY[n]];
    const t = Math.floor(n / 10), o = n % 10;
    const zh = (t > 1 ? NUM[t] : '') + '十' + (o ? NUM[o] : '');
    const py = [(t > 1 ? NPY[t] : ''), 'shí', (o ? NPY[o] : '')].filter(Boolean).join(' ');
    return [zh, py];
  }
  function dateAns(m, d) { const a = zhNum(m), b = zhNum(d); return { zh: `${a[0]}月${b[0]}号`, py: `${a[1]} yuè ${b[1]} hào` }; }

  RUN.react = function (L) {
    newScreen(); setTheme(L); missionHeader(L, 'react');
    const R = L.react;
    let items;
    if (R.dates) {
      items = R.dates.map(([m, d]) => {
        const a = dateAns(m, d);
        return { m, d, a: a.zh, apy: a.py, full: `${R.frame}${a.zh}。` };
      });
    } else items = R.items.map(x => Object.assign({ full: x.a }, x));
    const Q = Queue(shuffle(items));
    let miss = 0, fast = 0;
    const LIMIT = 10000, FAST = 3000;
    function distractors(it) {
      if (!R.dates) return shuffle(items.filter(x => x.a !== it.a)).slice(0, 3).map(x => ({ a: x.a, apy: x.apy }));
      const cand = [];
      const add = (m, d) => { if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && !(m === it.m && d === it.d) && !cand.some(c => c[0] === m && c[1] === d)) cand.push([m, d]); };
      add(it.d, it.m);
      add(it.m, it.d === 10 ? 4 : (it.d % 10 === 0 ? it.d / 10 : it.d + 10 <= 31 ? it.d + 10 : it.d - 10));
      add(it.m === 12 ? 11 : it.m + 1, it.d);
      add(it.m, it.d === 1 ? 7 : it.d - 1);
      while (cand.length < 3) add(1 + (Math.random() * 12 | 0), 1 + (Math.random() * 28 | 0));
      return shuffle(cand).slice(0, 3).map(([m, d]) => { const a = dateAns(m, d); return { a: a.zh, apy: a.py }; });
    }
    function next() {
      setProg(`1초 반응 ${Q.solved}/${Q.total}`, Q.solved / Q.total);
      if (Q.done) {
        const d = L.dialog;
        return finish(L, 'react', miss,
          `선생님께 오늘의 미션 문장을 말해 봐요!<br>A <span class="zh">${d[0].zh}</span><br>B <span class="zh">${d[1].zh}</span>`,
          fast ? `「툭!」 빠른 대답 ${fast}번!` : '');
      }
      const it = Q.cur;
      const opts = shuffle([{ a: it.a, apy: it.apy }].concat(distractors(it)));
      const right = opts.findIndex(o => o.a === it.a);
      const pic = R.dates
        ? `<div class="date-card"><div class="m">${it.m}월</div><div class="d py">${it.d}</div></div>`
        : `<div class="react-pic">${ic('i-' + it.pic)}<span class="lbl">${esc(it.ko)}</span></div>`;
      render(`<section class="screen play wide">
        <div class="q-area" id="qa">
          ${pic}
          <div class="qbubble"><div class="tx"><span class="zh">${R.q}</span><span class="py">${R.qpy}</span></div>
            <button class="say" data-act="play">${ic('u-speaker')}</button></div>
          <div class="timer"><i id="tm"></i></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.6rem;justify-content:center">
          ${R.frame ? `<div class="frame zh">${R.frame}<span class="blank"></span>。</div>` : ''}
          ${choiceHtml(opts, o => `<span class="zh">${o.a}</span><span class="py">${o.apy}</span>`)}
        </div>
      </section>`);
      const tm = $('#tm');
      let t0 = 0, answered = false;
      function tick() {
        if (answered) return;
        const left = Math.max(0, 1 - (performance.now() - t0) / LIMIT);
        tm.style.transform = `scaleX(${left})`;
        if (left < .3) tm.classList.add('warn');
        if (left <= 0) return answer(-1);
        raf = requestAnimationFrame(tick);
      }
      const startTimer = () => { if (t0 || answered) return; t0 = performance.now(); tick(); };
      ACT.play = () => TTS.speak(R.q);
      later(() => TTS.speak(R.q, startTimer), 300);
      function answer(k) {
        if (answered) return; answered = true; cancelAnimationFrame(raf);
        const took = t0 ? performance.now() - t0 : 0;
        markChoices(k, right);
        const qa = $('#qa');
        if (k === right) {
          Q.ok();
          if (took < FAST) { fast++; fx('tuk'); qa.insertAdjacentHTML('beforeend', '<div class="tuk">툭!</div>'); }
          else fx('ok');
        } else { fx('no'); miss++; Q.bad(); }
        later(() => {
          qa.insertAdjacentHTML('beforeend', `<div class="follow">${ic('u-mic')} 따라 말해요! <span class="zh">${it.full}</span></div>`);
          TTS.speak(it.full);
        }, k === right ? 500 : 700);
        later(next, k === right ? 2900 : 3300);
      }
      ACT.pick = b => answer(+b.dataset.k);
    }
    next();
  };


  /* ═════════ 보상 게임: 짝꿍 카드 뒤집기 ═════════
   * data.js 각 사건의 pairs(우리말 ↔ 중국어) 6쌍 = 카드 12장
   * 처음 3초 동안 모두 보여 주고 뒤집음 → 두 장씩 뒤집어 짝 찾기
   * 중국어 카드를 뒤집으면 소리, 짝을 맞히면 다시 한 번 소리
   * 별: 뒤집기 9번 이하 ★3 / 13번 이하 ★2 / 그 이상 ★1
   */
  function openCardRules(L) {
    const b = (S.bonus || {})[L.id];
    const ex = L.pairs[0];
    openModal(`<div class="ic">${ic('i-cards')}</div>
      <h2>보상 게임 · 짝꿍 카드</h2>
      <ul class="rules">
        <li><b>1</b>처음 3초 동안 카드를 잘 기억해요.</li>
        <li><b>2</b><span>두 장씩 뒤집어 짝을 찾아요.<br><span class="zh">${ex.zh}</span> ↔ ${esc(ex.ko)}</span></li>
        <li><b>3</b>적게 뒤집을수록 별이 많아요!</li>
      </ul>
      ${b ? `<p>최고 기록 · 뒤집기 <b style="font-weight:400;color:var(--deep)">${b.best}번</b></p>` : ''}
      <div class="row"><button class="btn white" data-act="no">나중에</button><button class="btn big" data-act="go">시작!</button></div>`,
    { no: closeModal, _outside: closeModal, go() { closeModal(); fx('tap'); unlockSpeech(); RUN.cards(L); } });
  }
  function cardFace(c) {
    const p = c.p;
    if (c.t === 'zh') return `<span class="zh">${p.zh}</span><span class="py">${p.py}</span>`;
    if (/^\d+$/.test(p.ko)) return `<span class="num">${p.ko}</span><span class="rd">${esc(p.read || '')}</span>`;
    return `${p.pic ? ic('i-' + p.pic, 'pic') : ''}<span class="ko">${esc(p.ko)}</span>`;
  }
  RUN.cards = function (L) {
    newScreen(); setTheme(L);
    header({ back: 'quit', prog: '짝꿍 카드' });
    ACT.quit = () => { fx('tap'); showLesson(L.id); };
    const pairs = L.pairs;
    const deck = shuffle(pairs.flatMap((p, n) => [{ n, t: 'zh', p }, { n, t: 'ko', p }]));
    const best = ((S.bonus || {})[L.id] || {}).best;
    let open = [], matched = 0, moves = 0, lock = true;
    render(`<section class="screen play cards-screen">
      <div class="cards-info"><span id="cmsg" class="cmsg">잘 기억해요! <b id="cnt">3</b></span>
        <span class="cmv">뒤집기 <b id="mv">0</b>번${best ? `<small> · 최고 ${best}번</small>` : ''}</span></div>
      <div class="cards">${deck.map((c, k) => `<button class="card open" data-act="flip" data-k="${k}">
        <span class="card-in"><span class="face back">${ic('i-magnifier')}</span>
        <span class="face front ${c.t}">${cardFace(c)}</span></span></button>`).join('')}</div>
    </section>`);
    const cards = [...document.querySelectorAll('.card')];
    const cmsg = $('#cmsg');
    const msg = (h, cls = '') => { cmsg.className = 'cmsg ' + cls; cmsg.innerHTML = h; };
    setProg(`짝꿍 카드 0/${pairs.length}`, 0);
    [2, 1].forEach((n, i) => later(() => { const c = $('#cnt'); if (c) c.textContent = n; }, (i + 1) * 1000));
    later(() => {
      cards.forEach(c => c.classList.remove('open'));
      lock = false; fx('tap');
      msg('카드 두 장을 뒤집어 짝을 찾아요!');
    }, 3000);
    ACT.flip = el => {
      if (lock) return;
      const k = +el.dataset.k, c = deck[k];
      if (el.classList.contains('open') || el.classList.contains('done')) return;
      el.classList.add('open'); fx('tap');
      if (c.t === 'zh') TTS.speak(c.p.zh);
      open.push(k);
      if (open.length < 2) return;
      const [a, b] = open; open = [];
      moves++; $('#mv').textContent = moves; lock = true;
      if (deck[a].n === deck[b].n) {
        const p = deck[a].p;
        later(() => {
          cards[a].classList.add('done'); cards[b].classList.add('done');
          matched++; fx('ok'); TTS.speak(p.zh);
          msg(`짝! ${esc(p.ko)} = <span class="zh">${p.zh}</span>`, 'good');
          setProg(`짝꿍 카드 ${matched}/${pairs.length}`, matched / pairs.length);
          lock = false;
          if (matched === pairs.length) { lock = true; later(done, 1300); }
        }, 450);
      } else {
        later(() => { fx('no'); msg('짝이 아니에요. 잘 기억해 두세요!', 'bad'); }, 450);
        later(() => { cards[a].classList.remove('open'); cards[b].classList.remove('open'); lock = false; }, 1300);
      }
    };
    function done() {
      const n = pairs.length;
      const stars = moves <= n + 3 ? 3 : moves <= n + 7 ? 2 : 1;
      S.bonus = S.bonus || {};
      const old = S.bonus[L.id];
      const isBest = !old || moves < old.best;
      S.bonus[L.id] = { best: old ? Math.min(old.best, moves) : moves, stars: Math.max(stars, old ? old.stars : 0), at: Date.now() };
      save();
      fx('win'); confetti();
      openModal(`<div class="stamp-big" style="font-size:1.7rem">짝꿍<br>완성!</div>
        <h2>뒤집기 ${moves}번</h2>
        <div class="stars-big">${[1, 2, 3].map(k => `<svg class="${k <= stars ? 'on' : ''}"><use href="#u-star"/></svg>`).join('')}</div>
        <p>${isBest && old ? '최고 기록을 깼어요!' : stars === 3 ? '기억력 탐정이에요!' : '다시 하면 더 적게 뒤집을 수 있어요!'}</p>
        <div class="tipbox">짝꿍을 소리 내어 말해 봐요!<br>${pairs.slice(0, 3).map(p => `${esc(p.ko)} → <span class="zh">${p.zh}</span>`).join(' · ')}</div>
        <div class="row"><button class="btn white" data-act="map">사건 지도</button><button class="btn big" data-act="again">다시 하기</button></div>`,
      { map() { showLesson(L.id); }, again() { RUN.cards(L); } });
    }
  };

  /* ═════════ 도장 카드 (선생님 확인) ═════════ */
  function showCert(id) {
    const L = lessonById(id); if (!L || !allDone(id)) return showLesson(id);
    newScreen(); setTheme(L);
    header({ back: 'map', title: '도장 카드' });
    ACT.map = () => showLesson(id);
    const p = prog(id), ok = S.ok[id];
    const doneAt = Math.max(...MISSIONS.map(m => p[m.key].at));
    const d = L.dialog;
    render(`<section class="screen cert-screen">
      <div class="cert">
        <div class="cert-top">${ic('mascot', 'bob')}<div class="t"><small>사건 ${L.no} · ${esc(L.title)}</small><b>사건 해결 카드</b></div></div>
        <div class="cert-name"><b>${esc(S.name)}</b> 탐정이 미션을 모두 풀었어요!</div>
        <div class="cert-list">${MISSIONS.map(m => `<div>${ic(m.icon, 'ic')}<span>${m.name}</span>${starRow(p[m.key].stars, 'st')}</div>`).join('')}</div>
        <div class="cert-say"><div class="tx"><small>선생님 질문 · ${d[0].zh}</small><span class="zh">${d[1].zh}</span></div>
          <button class="say" data-act="say">${ic('u-speaker')}</button></div>
        <div class="cert-meta"><span>해결 ${fmtDay(doneAt)}</span><span class="live" id="clk">${fmtTime(new Date())}</span></div>
        ${ok ? `<div class="t-stamp"><b>선생님<br>확인</b><small>${fmtDay(ok.at).slice(5)}</small></div>` : ''}
      </div>
      <div class="cert-btns row">${ok
        ? `<button class="btn white big" data-act="map">사건 지도</button><button class="btn big mint" data-act="home">다른 사건</button>`
        : `<button class="btn big mint" data-act="teacher">${ic('u-check')} 선생님 확인 받기</button>`}</div>
    </section>`);
    const clk = $('#clk');
    intervals.push(setInterval(() => { clk.textContent = fmtTime(new Date()); }, 1000));
    ACT.say = () => TTS.speak(d[1].zh);
    ACT.teacher = () => {
      fx('tap');
      askPin(() => {
        S.ok[id] = { at: Date.now() }; save();
        fx('stamp'); later(() => fx('win'), 500); confetti(); showCert(id);
      }, '선생님 확인', '학생이 미션 문장을 말하면<br>비밀번호를 눌러 주세요.');
    };
    if (!ok) confetti();
  }

  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti';
    const cols = ['#FF8A3D', '#FFC93C', '#2FBF94', '#4FA3F7', '#FF7AA2', '#8E6CDB'];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = cols[i % cols.length];
      c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      c.style.animationDelay = Math.random() * .5 + 's';
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3800);
  }

  /* ───────── 선생님 비밀번호 ───────── */
  function askPin(onOk, title = '선생님 전용', desc = '선생님 비밀번호를 눌러 주세요.') {
    let v = '';
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="k" data-n="${n}">${n}</button>`).join('')
      + `<button class="fn" data-act="x">닫기</button><button data-act="k" data-n="0">0</button><button class="fn" data-act="del">지우기</button>`;
    openModal(`<h2>${title}</h2><p>${desc}</p><div class="pin-dots" id="pd">${'<i></i>'.repeat(4)}</div><div class="keypad">${keys}</div>`, {
      _outside: closeModal, x: closeModal,
      del() { v = v.slice(0, -1); draw(); },
      k(b) {
        if (v.length >= 4) return;
        v += b.dataset.n; draw(); fx('tap');
        if (v.length === 4) {
          if (v === String(TEACHER_PIN)) { setTimeout(() => { closeModal(); onOk(); }, 150); }
          else { const pd = $('#pd'); pd.classList.add('bad'); fx('no'); setTimeout(() => { v = ''; draw(); pd.classList.remove('bad'); }, 450); }
        }
      }
    });
    function draw() { document.querySelectorAll('#pd i').forEach((d, i) => d.classList.toggle('on', i < v.length)); }
  }

  function teacherMenu() {
    const rows = LESSONS.map(L => {
      const n = doneCount(L.id), ok = S.ok[L.id];
      return `<li><b style="background:${L.color}">${L.no}</b>${esc(L.title)} · 미션 ${n}/5 ${ok ? '· 확인 ✔' : ''}${S.bonus && S.bonus[L.id] ? ` · 카드 ${S.bonus[L.id].best}번` : ''}</li>`;
    }).join('');
    openModal(`<h2>선생님 창구</h2>
      <ul class="rules">${rows}</ul>
      <p style="font-size:1rem">학생: <b style="font-weight:400;color:var(--ink)">${esc(S.name)}</b></p>
      <div class="tipbox" style="font-size:.95rem">중국어 음성: <b>${TTS.voice ? esc(TTS.voice.name) : '찾지 못함'}</b>
        <button class="btn white" style="margin-top:.4rem;width:100%;font-size:1.05rem;padding:.5rem" data-act="test">${ic('u-speaker')} 소리 시험 「你好！」</button></div>
      <button class="btn orange" data-act="newkid">새 학생으로 시작 (기록 지우기)</button>
      <button class="btn white" data-act="x">닫기</button>`, {
      x: closeModal, _outside: closeModal,
      test() { if (!S.sound) { S.sound = true; save(); renderSoundBtn(); } fx('ok'); TTS.speak('你好！欢迎来到汉字侦探团。'); },
      newkid() {
        openModal(`<h2>정말 지울까요?</h2><p>${esc(S.name)} 학생의 도장과 기록이<br>이 기기에서 모두 지워져요.</p>
          <div class="row"><button class="btn white" data-act="x">취소</button><button class="btn" style="--c:var(--red);--deep:#C23940" data-act="go">지우기</button></div>`,
        { x: closeModal, _outside: closeModal, go() { const snd = S.sound; S = { v: 1, name: '', prog: {}, ok: {}, bonus: {}, sound: snd }; save(); showIntro(); } });
      }
    });
  }

  /* ───────── 인앱 브라우저 (카카오톡 등) ───────── */
  (function inApp() {
    const ua = navigator.userAgent || '';
    if (/KAKAOTALK/i.test(ua)) {
      location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
    } else if (/(Instagram|NAVER|Line\/|FBAN|FBAV|DaumApps|everytimeApp|MicroMessenger)/i.test(ua)) {
      setTimeout(() => toast('소리가 안 나면 크롬이나 사파리로 열어 주세요!', 4500), 800);
    }
  })();

  /* ───────── 시작 ───────── */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  window.__HT = { RUN, showLesson, showCert, showHome, get S() { return S; } }; // 테스트용
  S.name ? showHome() : showIntro();
})();
