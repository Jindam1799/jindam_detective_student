/* 한자어 탐정단 — 수업 데이터
 * 활동지 1장 = 사건 1개. 새 활동지를 만들면 LESSONS 배열에 같은 모양으로 하나 더 추가하면 됩니다.
 * scenes.words: ['우리말', '한자(한자어일 때)', '아니면 이유'] → 한자 칸이 비어 있으면 한자어가 아님
 */

// 선생님 확인·기록 지우기 비밀번호 (숫자 4자리, 꼭 바꿔서 쓰세요)
const TEACHER_PIN = '1799';

const LESSONS = [
  /* ───────────── 사건 1. 우리 학교 ───────────── */
  {
    id: 'school', no: 1, title: '우리 학교', icon: 'school',
    color: '#4FA3F7', soft: '#E4F1FF', deep: '#2B78CC',
    question: '우리 학교에 한자어가 숨어 있다고?',
    dialog: [
      { zh: '喂？你在哪里？', py: 'Wéi? Nǐ zài nǎlǐ?', ko: '여보세요? 너는 어디에 있니?' },
      { zh: '我在学校。', py: 'Wǒ zài xuéxiào.', ko: '나는 학교에 있어요.' }
    ],
    sound: {
      items: [
        { zh: '学校', py: 'xuéxiào', ko: '학교' },
        { zh: '教室', py: 'jiàoshì', ko: '교실' },
        { zh: '图书馆', py: 'túshūguǎn', ko: '도서관' },
        { zh: '学生', py: 'xuésheng', ko: '학생' },
        { zh: '校长', py: 'xiàozhǎng', ko: '교장' },
        { zh: '食堂', py: 'shítáng', ko: '식당' }
      ],
      extra: ['운동장', '화장실', '교과서', '선생님', '친구']
    },
    chars: [
      { s: '学', t: '學', py: 'xué', hun: '배울 학', ex: '학교 · 학생' },
      { s: '校', t: '校', py: 'xiào', hun: '학교 교', ex: '학교 · 교장' },
      { s: '教', t: '教', py: 'jiào', hun: '가르칠 교', ex: '교실 · 교과서' },
      { s: '室', t: '室', py: 'shì', hun: '방 실', ex: '교실 · 화장실' },
      { s: '图', t: '圖', py: 'tú', hun: '그림 도', ex: '도서관' },
      { s: '馆', t: '館', py: 'guǎn', hun: '집 관', ex: '도서관' }
    ],
    charTip: '학교의 校 xiào와 교실의 教 jiào는 다른 글자! 우리말 소리는 같아도 중국어 소리는 달라요.',
    scenes: [
      { name: '학교 곳곳', icon: 'school', words: [
        ['교실', '教室'], ['놀이터', '', '순우리말'], ['운동장', '運動場'],
        ['화장실', '化粧室'], ['텃밭', '', '순우리말'], ['도서관', '圖書館'] ] },
      { name: '내 가방 속', icon: 'backpack', words: [
        ['공책', '空冊'], ['지우개', '', '순우리말'], ['필통', '筆筒'],
        ['크레파스', '', '외래어'], ['연필', '鉛筆'], ['교과서', '敎科書'] ] },
      { name: '우리 반 사람들', icon: 'people', words: [
        ['학생', '學生'], ['언니', '', '순우리말'], ['친구', '親舊'],
        ['교장', '校長'], ['짝', '', '순우리말'], ['반장', '班長'] ] },
      { name: '급식 시간', icon: 'tray', words: [
        ['급식', '給食'], ['숟가락', '', '순우리말'], ['식판', '食板'],
        ['우유', '牛乳'], ['젓가락', '', '순우리말'], ['반찬', '飯饌'] ] }
    ],
    trap: { good: ['도서관', '图书馆'], bad: ['운동장', '操场', 'cāochǎng'] },
    words: [
      { zh: '学校', py: 'xuéxiào', ko: '학교' },
      { zh: '教室', py: 'jiàoshì', ko: '교실' },
      { zh: '图书馆', py: 'túshūguǎn', ko: '도서관' },
      { zh: '食堂', py: 'shítáng', ko: '(학교) 급식실' },
      { zh: '家', py: 'jiā', ko: '집' },
      { zh: '在', py: 'zài', ko: '~에 있다' }
    ],
    wordTip: '在 zài = 있을 재 (재학생의 「재」) → 我在学校。',
    pairs: [ // 보상 게임 짝꿍 카드 (우리말 ↔ 중국어 6쌍)
      { zh: '学校', py: 'xuéxiào', ko: '학교', pic: 'school' },
      { zh: '教室', py: 'jiàoshì', ko: '교실', pic: 'classroom' },
      { zh: '图书馆', py: 'túshūguǎn', ko: '도서관', pic: 'library' },
      { zh: '食堂', py: 'shítáng', ko: '급식실', pic: 'tray' },
      { zh: '家', py: 'jiā', ko: '집', pic: 'house' },
      { zh: '学生', py: 'xuésheng', ko: '학생', pic: 'people' }
    ],
    react: {
      q: '你在哪里？', qpy: 'Nǐ zài nǎlǐ?', qko: '너는 어디에 있니?',
      items: [
        { pic: 'school', ko: '학교', a: '我在学校。', apy: 'Wǒ zài xuéxiào.' },
        { pic: 'classroom', ko: '교실', a: '我在教室。', apy: 'Wǒ zài jiàoshì.' },
        { pic: 'library', ko: '도서관', a: '我在图书馆。', apy: 'Wǒ zài túshūguǎn.' },
        { pic: 'tray', ko: '급식실', a: '我在食堂。', apy: 'Wǒ zài shítáng.' },
        { pic: 'house', ko: '집', a: '我在家。', apy: 'Wǒ zài jiā.' }
      ]
    }
  },

  /* ───────────── 사건 2. 달력·생일 ───────────── */
  {
    id: 'birthday', no: 2, title: '내 생일', icon: 'cake',
    color: '#FF7AA2', soft: '#FFE7EF', deep: '#D44A78',
    question: '달력에 한자어가 숨어 있다고?',
    dialog: [
      { zh: '你的生日是几月几号？', py: 'Nǐ de shēngrì shì jǐ yuè jǐ hào?', ko: '너의 생일은 몇 월 며칠이니?' },
      { zh: '我的生日是五月八号。', py: 'Wǒ de shēngrì shì wǔ yuè bā hào.', ko: '내 생일은 5월 8일이에요.' }
    ],
    sound: {
      pick: 9,   // 문제 수 (아래에서 섞어서 뽑음, must는 꼭 나옴)
      must: ['十一', '二十', '三十一', '生日'],
      items: [
        { zh: '一', py: 'yī', ko: '일' }, { zh: '二', py: 'èr', ko: '이' },
        { zh: '三', py: 'sān', ko: '삼' }, { zh: '四', py: 'sì', ko: '사' },
        { zh: '五', py: 'wǔ', ko: '오' }, { zh: '六', py: 'liù', ko: '육' },
        { zh: '七', py: 'qī', ko: '칠' }, { zh: '八', py: 'bā', ko: '팔' },
        { zh: '九', py: 'jiǔ', ko: '구' }, { zh: '十', py: 'shí', ko: '십' },
        { zh: '十一', py: 'shí yī', ko: '십일' }, { zh: '二十', py: 'èr shí', ko: '이십' },
        { zh: '三十一', py: 'sān shí yī', ko: '삼십일' }, { zh: '生日', py: 'shēngrì', ko: '생일' }
      ],
      extra: ['일요일', '월요일', '십이', '삼십']
    },
    chars: [
      { s: '生', t: '生', py: 'shēng', hun: '날 생', ex: '생일 · 학생' },
      { s: '日', t: '日', py: 'rì', hun: '날 일', ex: '생일 · 일요일' },
      { s: '月', t: '月', py: 'yuè', hun: '달 월', ex: '월요일 · 1월' },
      { s: '号', t: '號', py: 'hào', hun: '번호 호', ex: '번호' },
      { s: '一', t: '一', py: 'yī', hun: '하나 일', ex: '일 · 이 · 삼' },
      { s: '十', t: '十', py: 'shí', hun: '열 십', ex: '십 · 이십' }
    ],
    charTip: '숫자 一~十과 生 · 日 · 月은 우리 한자와 중국 한자가 똑같아요! 號만 号로 바뀌어요.',
    scenes: [
      { name: '달력', icon: 'calendar', words: [
        ['월요일', '月曜日'], ['오늘', '', '순우리말'], ['일요일', '日曜日'],
        ['주말', '週末'], ['어제', '', '순우리말'], ['내일', '來日'] ] },
      { name: '생일 파티', icon: 'cake', words: [
        ['생일', '生日'], ['케이크', '', '외래어'], ['선물', '膳物'],
        ['축하', '祝賀'], ['노래', '', '순우리말'], ['풍선', '風船'] ] },
      { name: '숫자 세기', icon: 'numbers', words: [
        ['일', '一'], ['하나', '', '순우리말'], ['삼', '三'],
        ['십', '十'], ['열', '', '순우리말'], ['백', '百'] ] },
      { name: '학교의 하루', icon: 'clock', words: [
        ['학년', '學年'], ['짝', '', '순우리말'], ['번호', '番號'],
        ['시간', '時間'], ['모둠', '', '순우리말'], ['숙제', '宿題'] ] }
    ],
    trap: { good: ['생일', '生日'], bad: ['월요일', '星期一', 'xīngqīyī'] },
    words: [
      { zh: '一', py: 'yī', ko: '1' }, { zh: '二', py: 'èr', ko: '2' },
      { zh: '三', py: 'sān', ko: '3' }, { zh: '四', py: 'sì', ko: '4' },
      { zh: '五', py: 'wǔ', ko: '5' }, { zh: '六', py: 'liù', ko: '6' },
      { zh: '七', py: 'qī', ko: '7' }, { zh: '八', py: 'bā', ko: '8' },
      { zh: '九', py: 'jiǔ', ko: '9' }, { zh: '十', py: 'shí', ko: '10' }
    ],
    wordTip: '날짜를 말할 때는 日가 아니라 号 hào! → 五月八号 5월 8일',
    pairs: [ // 보상 게임 짝꿍 카드 (숫자 ↔ 중국어 6쌍)
      { zh: '三', py: 'sān', ko: '3', read: '삼' },
      { zh: '五', py: 'wǔ', ko: '5', read: '오' },
      { zh: '八', py: 'bā', ko: '8', read: '팔' },
      { zh: '十', py: 'shí', ko: '10', read: '십' },
      { zh: '二十', py: 'èr shí', ko: '20', read: '이십' },
      { zh: '生日', py: 'shēngrì', ko: '생일', pic: 'cake' }
    ],
    react: {
      q: '你的生日是几月几号？', qpy: 'Nǐ de shēngrì shì jǐ yuè jǐ hào?', qko: '너의 생일은 몇 월 며칠이니?',
      frame: '我的生日是',
      dates: [[5, 8], [3, 10], [11, 20], [12, 31], [7, 1], [9, 15]]
    }
  },

  /* ───────────── 사건 3. 동네 간판 ───────────── */
  {
    id: 'sign', no: 3, title: '동네 간판', icon: 'street',
    color: '#2FBF94', soft: '#DDF6EE', deep: '#1B9370',
    question: '우리 동네 간판에 한자어가 숨어 있다고?',
    dialog: [
      { zh: '这是什么？', py: 'Zhè shì shénme?', ko: '이건 뭐예요?' },
      { zh: '这是银行。', py: 'Zhè shì yínháng.', ko: '이건 은행이에요.' }
    ],
    sound: {
      items: [
        { zh: '银行', py: 'yínháng', ko: '은행' },
        { zh: '医院', py: 'yīyuàn', ko: '의원 (병원)' },
        { zh: '公园', py: 'gōngyuán', ko: '공원' },
        { zh: '书店', py: 'shūdiàn', ko: '서점' },
        { zh: '市场', py: 'shìchǎng', ko: '시장' },
        { zh: '出口', py: 'chūkǒu', ko: '출구' }
      ],
      extra: ['입구', '주차장', '교실', '시청']
    },
    chars: [
      { s: '园', t: '園', py: 'yuán', hun: '동산 원', ex: '공원' },
      { s: '院', t: '院', py: 'yuàn', hun: '집 원', ex: '병원 · 의원' },
      { s: '店', t: '店', py: 'diàn', hun: '가게 점', ex: '서점' },
      { s: '场', t: '場', py: 'chǎng', hun: '마당 장', ex: '시장 · 주차장' },
      { s: '室', t: '室', py: 'shì', hun: '방 실', ex: '교실' },
      { s: '口', t: '口', py: 'kǒu', hun: '입 구', ex: '출구 · 입구' }
    ],
    charTip: '園 → 园, 場 → 场. 모양은 달라도 뜻은 같아요! 장소 이름은 끝 글자를 보면 보여요.',
    scenes: [
      { name: '거리 간판', icon: 'street', words: [
        ['병원', '病院'], ['빵집', '', '외래어+우리말'], ['은행', '銀行'],
        ['카페', '', '외래어'], ['서점', '書店'], ['주차장', '駐車場'] ] },
      { name: '학교 · 교실', icon: 'classroom', words: [
        ['교실', '教室'], ['지우개', '', '순우리말'], ['칠판', '漆板'],
        ['책상', '冊床'], ['가위', '', '순우리말'], ['시간표', '時間表'] ] },
      { name: '우리 집', icon: 'house', words: [
        ['냉장고', '冷藏庫'], ['이불', '', '순우리말'], ['세탁기', '洗濯機'],
        ['거실', '居室'], ['숟가락', '', '순우리말'], ['전화', '電話'] ] },
      { name: '마트', icon: 'cart', words: [
        ['입구', '入口'], ['카트', '', '외래어'], ['출구', '出口'],
        ['계산대', '計算臺'], ['바나나', '', '외래어'], ['우유', '牛乳'] ] }
    ],
    trap: { good: ['은행', '银行'], bad: ['냉장고', '冰箱', 'bīngxiāng'] },
    words: [
      { zh: '医院', py: 'yīyuàn', ko: '병원 · 의원' },
      { zh: '银行', py: 'yínháng', ko: '은행' },
      { zh: '公园', py: 'gōngyuán', ko: '공원' },
      { zh: '书店', py: 'shūdiàn', ko: '서점' },
      { zh: '市场', py: 'shìchǎng', ko: '시장' },
      { zh: '出口', py: 'chūkǒu', ko: '출구' }
    ],
    wordTip: '화장실은 化妆室가 아니라 洗手间 xǐshǒujiān! → 洗手间在哪里？',
    pairs: [ // 보상 게임 짝꿍 카드 (우리말 ↔ 중국어 6쌍)
      { zh: '银行', py: 'yínháng', ko: '은행', pic: 'bank' },
      { zh: '医院', py: 'yīyuàn', ko: '병원', pic: 'hospital' },
      { zh: '公园', py: 'gōngyuán', ko: '공원', pic: 'park' },
      { zh: '书店', py: 'shūdiàn', ko: '서점', pic: 'bookstore' },
      { zh: '市场', py: 'shìchǎng', ko: '시장', pic: 'market' },
      { zh: '出口', py: 'chūkǒu', ko: '출구', pic: 'exit' }
    ],
    react: {
      q: '这是什么？', qpy: 'Zhè shì shénme?', qko: '이건 뭐예요?',
      items: [
        { pic: 'bank', ko: '은행', a: '这是银行。', apy: 'Zhè shì yínháng.' },
        { pic: 'hospital', ko: '병원', a: '这是医院。', apy: 'Zhè shì yīyuàn.' },
        { pic: 'park', ko: '공원', a: '这是公园。', apy: 'Zhè shì gōngyuán.' },
        { pic: 'bookstore', ko: '서점', a: '这是书店。', apy: 'Zhè shì shūdiàn.' },
        { pic: 'market', ko: '시장', a: '这是市场。', apy: 'Zhè shì shìchǎng.' },
        { pic: 'exit', ko: '출구', a: '这是出口。', apy: 'Zhè shì chūkǒu.' }
      ]
    }
  }
];
