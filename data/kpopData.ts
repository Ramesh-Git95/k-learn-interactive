// Original Korean lyrics inspired by K-Pop themes.
// All content is original and created for educational purposes.

export interface KPopWord {
  korean: string;
  romanization: string;
  english: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'particle' | 'expression';
}

export interface KPopLine {
  korean: string;
  romanization: string;
  english: string;
  words: KPopWord[];
}

export interface KPopSong {
  id: string;
  artistId: string;
  title: string;
  titleKorean: string;
  theme: string;
  isFree: boolean;
  lines: KPopLine[];
}

export interface KPopArtist {
  id: string;
  name: string;
  genre: string;
  emoji: string;
  gradient: string;
  accentColor: string;
  songs: KPopSong[];
}

export const kpopArtists: KPopArtist[] = [
  // ─── BTS ──────────────────────────────────────────────────────────────────
  {
    id: 'bts',
    name: 'BTS',
    genre: 'Hip-hop · Pop',
    emoji: '💜',
    gradient: 'linear-gradient(135deg, #6D28D9, #4C1D95)',
    accentColor: '#7C3AED',
    songs: [
      {
        id: 'bts-1',
        artistId: 'bts',
        title: 'My Path',
        titleKorean: '나의 길',
        theme: 'Self-belief & finding your way',
        isFree: true,
        lines: [
          {
            korean: '나는 내 길을 걷고 싶어',
            romanization: 'naneun nae gireul geotgo sipeo',
            english: 'I want to walk my own path',
            words: [
              { korean: '나는', romanization: 'naneun', english: 'I (topic)', type: 'noun' },
              { korean: '내', romanization: 'nae', english: 'my', type: 'noun' },
              { korean: '길을', romanization: 'gireul', english: 'path (object)', type: 'noun' },
              { korean: '걷고 싶어', romanization: 'geotgo sipeo', english: 'want to walk', type: 'verb' },
            ],
          },
          {
            korean: '두려워도 멈추지 않을 거야',
            romanization: 'duryeowo do meomchuji aneul geoya',
            english: 'Even if I\'m scared, I won\'t stop',
            words: [
              { korean: '두려워도', romanization: 'duryeowodo', english: 'even if scared', type: 'adjective' },
              { korean: '멈추지', romanization: 'meomchuji', english: 'stop (negative form)', type: 'verb' },
              { korean: '않을 거야', romanization: 'aneul geoya', english: 'won\'t (future)', type: 'expression' },
            ],
          },
          {
            korean: '꿈을 향해 달려가',
            romanization: 'kkumeul hyanghae dallyeoga',
            english: 'Run toward your dream',
            words: [
              { korean: '꿈을', romanization: 'kkumeul', english: 'dream (object)', type: 'noun' },
              { korean: '향해', romanization: 'hyanghae', english: 'toward', type: 'particle' },
              { korean: '달려가', romanization: 'dallyeoga', english: 'run / go running', type: 'verb' },
            ],
          },
          {
            korean: '너도 할 수 있어, 믿어',
            romanization: 'neodo hal su isseo, mideo',
            english: 'You can do it too, believe',
            words: [
              { korean: '너도', romanization: 'neodo', english: 'you too', type: 'noun' },
              { korean: '할 수 있어', romanization: 'hal su isseo', english: 'can do', type: 'expression' },
              { korean: '믿어', romanization: 'mideo', english: 'believe', type: 'verb' },
            ],
          },
          {
            korean: '오늘도 최선을 다하자',
            romanization: 'oneuldo choesseoneul dahaja',
            english: 'Let\'s give our best today too',
            words: [
              { korean: '오늘도', romanization: 'oneuldo', english: 'today too', type: 'adverb' },
              { korean: '최선을', romanization: 'choesseoneul', english: 'best effort (object)', type: 'noun' },
              { korean: '다하자', romanization: 'dahaja', english: 'let\'s give our all', type: 'verb' },
            ],
          },
        ],
      },
      {
        id: 'bts-2',
        artistId: 'bts',
        title: 'Stars Above',
        titleKorean: '별 위에서',
        theme: 'Hope & the universe',
        isFree: false,
        lines: [
          {
            korean: '하늘의 별처럼 빛나고 싶어',
            romanization: 'haneul-ui byeolcheoreom bichnago sipeo',
            english: 'I want to shine like the stars in the sky',
            words: [
              { korean: '하늘의', romanization: 'haneul-ui', english: 'sky\'s / of the sky', type: 'noun' },
              { korean: '별처럼', romanization: 'byeolcheoreom', english: 'like a star', type: 'noun' },
              { korean: '빛나고 싶어', romanization: 'bichnago sipeo', english: 'want to shine', type: 'verb' },
            ],
          },
          {
            korean: '어둠 속에서도 희망을 봐',
            romanization: 'eodum sogeseo do huimangeul bwa',
            english: 'Even in the darkness, I see hope',
            words: [
              { korean: '어둠 속에서도', romanization: 'eodum sogeseo do', english: 'even in the darkness', type: 'noun' },
              { korean: '희망을', romanization: 'huimangeul', english: 'hope (object)', type: 'noun' },
              { korean: '봐', romanization: 'bwa', english: 'see / look', type: 'verb' },
            ],
          },
          {
            korean: '우리 함께라면 뭐든 가능해',
            romanization: 'uri hamkke ramyeon mwodeun ganeunghae',
            english: 'If we\'re together, anything is possible',
            words: [
              { korean: '우리', romanization: 'uri', english: 'we / us', type: 'noun' },
              { korean: '함께라면', romanization: 'hamkkeramyeon', english: 'if (we are) together', type: 'adverb' },
              { korean: '뭐든', romanization: 'mwodeun', english: 'anything / whatever', type: 'expression' },
              { korean: '가능해', romanization: 'ganeunghae', english: 'is possible', type: 'adjective' },
            ],
          },
          {
            korean: '포기하지 마, 아직 끝이 아니야',
            romanization: 'pogihaji ma, ajik kkeuchi aniya',
            english: "Don't give up, it's not over yet",
            words: [
              { korean: '포기하지 마', romanization: 'pogihaji ma', english: "don't give up", type: 'expression' },
              { korean: '아직', romanization: 'ajik', english: 'yet / still', type: 'adverb' },
              { korean: '끝이 아니야', romanization: 'kkeuchi aniya', english: "it's not the end", type: 'expression' },
            ],
          },
        ],
      },
      {
        id: 'bts-3',
        artistId: 'bts',
        title: 'Home',
        titleKorean: '집',
        theme: 'Comfort & belonging',
        isFree: false,
        lines: [
          {
            korean: '네 곁에 있을 때 집 같아',
            romanization: 'ne gyeote isseul ttae jip gata',
            english: 'Being by your side feels like home',
            words: [
              { korean: '네 곁에', romanization: 'ne gyeote', english: 'by your side', type: 'noun' },
              { korean: '있을 때', romanization: 'isseul ttae', english: 'when (I am)', type: 'expression' },
              { korean: '집 같아', romanization: 'jip gata', english: 'feels like home', type: 'expression' },
            ],
          },
          {
            korean: '따뜻한 미소로 날 반겨줘',
            romanization: 'ttatteutan misoro nal bangyeojwo',
            english: 'Welcome me with your warm smile',
            words: [
              { korean: '따뜻한', romanization: 'ttatteutan', english: 'warm', type: 'adjective' },
              { korean: '미소로', romanization: 'misoro', english: 'with a smile', type: 'noun' },
              { korean: '날', romanization: 'nal', english: 'me (object)', type: 'noun' },
              { korean: '반겨줘', romanization: 'bangyeojwo', english: 'welcome (for me)', type: 'verb' },
            ],
          },
          {
            korean: '어디에 있어도 네가 생각나',
            romanization: 'eodie isseodo nega saenggangna',
            english: 'No matter where I am, I think of you',
            words: [
              { korean: '어디에 있어도', romanization: 'eodie isseodo', english: 'no matter where I am', type: 'expression' },
              { korean: '네가', romanization: 'nega', english: 'you (subject)', type: 'noun' },
              { korean: '생각나', romanization: 'saenggangna', english: 'comes to mind / I think of', type: 'verb' },
            ],
          },
        ],
      },
    ],
  },

  // ─── BLACKPINK ────────────────────────────────────────────────────────────
  {
    id: 'blackpink',
    name: 'BLACKPINK',
    genre: 'K-pop · Dance',
    emoji: '🌸',
    gradient: 'linear-gradient(135deg, #BE185D, #1F2937)',
    accentColor: '#EC4899',
    songs: [
      {
        id: 'bp-1',
        artistId: 'blackpink',
        title: 'Flame',
        titleKorean: '불꽃',
        theme: 'Confidence & power',
        isFree: true,
        lines: [
          {
            korean: '나는 강해, 두렵지 않아',
            romanization: 'naneun ganghae, duryeopji ana',
            english: "I'm strong, I'm not afraid",
            words: [
              { korean: '나는', romanization: 'naneun', english: 'I (topic)', type: 'noun' },
              { korean: '강해', romanization: 'ganghae', english: 'am strong', type: 'adjective' },
              { korean: '두렵지 않아', romanization: 'duryeopji ana', english: "not afraid / don't fear", type: 'expression' },
            ],
          },
          {
            korean: '내 눈을 봐, 비켜',
            romanization: 'nae nuneul bwa, bikyeo',
            english: 'Look into my eyes, step aside',
            words: [
              { korean: '내 눈을', romanization: 'nae nuneul', english: 'my eyes (object)', type: 'noun' },
              { korean: '봐', romanization: 'bwa', english: 'look / see', type: 'verb' },
              { korean: '비켜', romanization: 'bikyeo', english: 'step aside / move', type: 'verb' },
            ],
          },
          {
            korean: '불꽃처럼 타오르는 내 마음',
            romanization: 'bulkkotcheoreom taoreuneun nae maeum',
            english: 'My heart blazing like a flame',
            words: [
              { korean: '불꽃처럼', romanization: 'bulkkotcheoreom', english: 'like a flame', type: 'noun' },
              { korean: '타오르는', romanization: 'taoreuneun', english: 'blazing / burning', type: 'verb' },
              { korean: '내 마음', romanization: 'nae maeum', english: 'my heart / my feelings', type: 'noun' },
            ],
          },
          {
            korean: '세상이 뭐래도 나는 나야',
            romanization: 'sesangi mworaeado naneun naya',
            english: 'No matter what the world says, I am me',
            words: [
              { korean: '세상이', romanization: 'sesangi', english: 'the world (subject)', type: 'noun' },
              { korean: '뭐래도', romanization: 'mworaeado', english: 'no matter what (it) says', type: 'expression' },
              { korean: '나는 나야', romanization: 'naneun naya', english: 'I am me', type: 'expression' },
            ],
          },
        ],
      },
      {
        id: 'bp-2',
        artistId: 'blackpink',
        title: 'Crown',
        titleKorean: '왕관',
        theme: 'Independence & self-worth',
        isFree: false,
        lines: [
          {
            korean: '내 왕관을 아무도 빼앗을 수 없어',
            romanization: 'nae wangkwaneul amudo ppaeasseul su eopseo',
            english: 'Nobody can take my crown',
            words: [
              { korean: '내 왕관을', romanization: 'nae wangkwaneul', english: 'my crown (object)', type: 'noun' },
              { korean: '아무도', romanization: 'amudo', english: 'nobody / no one', type: 'noun' },
              { korean: '빼앗을 수 없어', romanization: 'ppaeasseul su eopseo', english: "can't take away", type: 'expression' },
            ],
          },
          {
            korean: '혼자서도 완벽해, 필요 없어',
            romanization: 'honjaseodo wanbyeokhae, pilyo eopseo',
            english: "I'm perfect alone, I don't need (anyone)",
            words: [
              { korean: '혼자서도', romanization: 'honjaseodo', english: 'even alone', type: 'adverb' },
              { korean: '완벽해', romanization: 'wanbyeokhae', english: 'am perfect', type: 'adjective' },
              { korean: '필요 없어', romanization: 'pilyo eopseo', english: "don't need / unnecessary", type: 'expression' },
            ],
          },
          {
            korean: '나의 가치를 알아봐',
            romanization: 'naui gachireul arabwa',
            english: 'Recognize my worth',
            words: [
              { korean: '나의', romanization: 'naui', english: 'my / mine', type: 'noun' },
              { korean: '가치를', romanization: 'gachireul', english: 'worth / value (object)', type: 'noun' },
              { korean: '알아봐', romanization: 'arabwa', english: 'recognize / find out', type: 'verb' },
            ],
          },
        ],
      },
    ],
  },

  // ─── NewJeans ─────────────────────────────────────────────────────────────
  {
    id: 'newjeans',
    name: 'NewJeans',
    genre: 'R&B · Pop',
    emoji: '🐰',
    gradient: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
    accentColor: '#38BDF8',
    songs: [
      {
        id: 'nj-1',
        artistId: 'newjeans',
        title: 'Every Morning',
        titleKorean: '매일 아침',
        theme: 'Youthful crush & daily moments',
        isFree: true,
        lines: [
          {
            korean: '매일 아침 너를 생각해',
            romanization: 'maeil achim neoreul saenggakhae',
            english: 'I think of you every morning',
            words: [
              { korean: '매일', romanization: 'maeil', english: 'every day', type: 'adverb' },
              { korean: '아침', romanization: 'achim', english: 'morning', type: 'noun' },
              { korean: '너를', romanization: 'neoreul', english: 'you (object)', type: 'noun' },
              { korean: '생각해', romanization: 'saenggakhae', english: 'think of / think about', type: 'verb' },
            ],
          },
          {
            korean: '카페에서 커피 한 잔 마시며',
            romanization: 'kapee-eseo keopi han jan masimyeo',
            english: 'While drinking a cup of coffee at the café',
            words: [
              { korean: '카페에서', romanization: 'kapee-eseo', english: 'at the café', type: 'noun' },
              { korean: '커피', romanization: 'keopi', english: 'coffee', type: 'noun' },
              { korean: '한 잔', romanization: 'han jan', english: 'one cup', type: 'expression' },
              { korean: '마시며', romanization: 'masimyeo', english: 'while drinking', type: 'verb' },
            ],
          },
          {
            korean: '연락해도 될까요?',
            romanization: 'yeollakhaedo doelkkayo?',
            english: 'Would it be okay if I contacted you?',
            words: [
              { korean: '연락해도', romanization: 'yeollakhaedo', english: 'even if (I) contact', type: 'verb' },
              { korean: '될까요?', romanization: 'doelkkayo?', english: 'would it be okay? / may I?', type: 'expression' },
            ],
          },
          {
            korean: '같이 걷고 싶은 이 거리',
            romanization: 'gachi geotgo sipeun i geori',
            english: 'These streets I want to walk with you',
            words: [
              { korean: '같이', romanization: 'gachi', english: 'together / with (someone)', type: 'adverb' },
              { korean: '걷고 싶은', romanization: 'geotgo sipeun', english: 'want to walk', type: 'verb' },
              { korean: '이 거리', romanization: 'i geori', english: 'these streets / this street', type: 'noun' },
            ],
          },
          {
            korean: '오늘도 설레는 마음이야',
            romanization: 'oneuldo seolreneun maeumiya',
            english: 'My heart is fluttering again today',
            words: [
              { korean: '오늘도', romanization: 'oneuldo', english: 'today too / again today', type: 'adverb' },
              { korean: '설레는', romanization: 'seolreneun', english: 'fluttering / excited', type: 'adjective' },
              { korean: '마음이야', romanization: 'maeumiya', english: 'it\'s my heart / my feelings', type: 'noun' },
            ],
          },
        ],
      },
      {
        id: 'nj-2',
        artistId: 'newjeans',
        title: 'Blue Skies',
        titleKorean: '파란 하늘',
        theme: 'Carefree summer days',
        isFree: false,
        lines: [
          {
            korean: '파란 하늘 아래 우리 둘이',
            romanization: 'paran haneul arae uri duri',
            english: 'The two of us under the blue sky',
            words: [
              { korean: '파란', romanization: 'paran', english: 'blue', type: 'adjective' },
              { korean: '하늘 아래', romanization: 'haneul arae', english: 'under the sky', type: 'noun' },
              { korean: '우리 둘이', romanization: 'uri duri', english: 'the two of us', type: 'noun' },
            ],
          },
          {
            korean: '아이스크림 먹으면서 웃어',
            romanization: 'aiseukeurim meogeumyeonseo useo',
            english: 'Laughing while eating ice cream',
            words: [
              { korean: '아이스크림', romanization: 'aiseukeurim', english: 'ice cream', type: 'noun' },
              { korean: '먹으면서', romanization: 'meogeumyeonseo', english: 'while eating', type: 'verb' },
              { korean: '웃어', romanization: 'useo', english: 'laugh / smile', type: 'verb' },
            ],
          },
          {
            korean: '이 순간이 영원하면 좋겠어',
            romanization: 'i sungani yeongwonhamyeon jokesseo',
            english: 'I wish this moment could last forever',
            words: [
              { korean: '이 순간이', romanization: 'i sungani', english: 'this moment (subject)', type: 'noun' },
              { korean: '영원하면', romanization: 'yeongwonhamyeon', english: 'if it lasts forever', type: 'adjective' },
              { korean: '좋겠어', romanization: 'jokesseo', english: 'would be good / I wish', type: 'expression' },
            ],
          },
        ],
      },
    ],
  },

  // ─── aespa ────────────────────────────────────────────────────────────────
  {
    id: 'aespa',
    name: 'aespa',
    genre: 'K-pop · Futurepop',
    emoji: '🤖',
    gradient: 'linear-gradient(135deg, #059669, #1E1B4B)',
    accentColor: '#10B981',
    songs: [
      {
        id: 'ae-1',
        artistId: 'aespa',
        title: 'Digital World',
        titleKorean: '디지털 세계',
        theme: 'Virtual reality & identity',
        isFree: true,
        lines: [
          {
            korean: '우리는 새로운 세계에 있어',
            romanization: 'urineun saeroun segyee isseo',
            english: 'We are in a new world',
            words: [
              { korean: '우리는', romanization: 'urineun', english: 'we (topic)', type: 'noun' },
              { korean: '새로운', romanization: 'saeroun', english: 'new', type: 'adjective' },
              { korean: '세계에', romanization: 'segyee', english: 'in the world', type: 'noun' },
              { korean: '있어', romanization: 'isseo', english: 'are / exist', type: 'verb' },
            ],
          },
          {
            korean: '현실과 가상의 경계가 없어',
            romanization: 'hyeonsilgwa gasangui gyeonggaega eopseo',
            english: 'There is no boundary between reality and virtual',
            words: [
              { korean: '현실과', romanization: 'hyeonsilgwa', english: 'reality and', type: 'noun' },
              { korean: '가상의', romanization: 'gasangui', english: "virtual / of the virtual", type: 'adjective' },
              { korean: '경계가 없어', romanization: 'gyeonggaega eopseo', english: 'there is no boundary', type: 'expression' },
            ],
          },
          {
            korean: '나의 아바타와 함께 달려',
            romanization: 'naui abatawar hamkke dallyeo',
            english: 'Running together with my avatar',
            words: [
              { korean: '나의', romanization: 'naui', english: 'my', type: 'noun' },
              { korean: '아바타와', romanization: 'abatawa', english: 'with my avatar', type: 'noun' },
              { korean: '함께', romanization: 'hamkke', english: 'together', type: 'adverb' },
              { korean: '달려', romanization: 'dallyeo', english: 'run', type: 'verb' },
            ],
          },
          {
            korean: '데이터 속에서 진짜 나를 찾아',
            romanization: 'deiteo sogeseo jinjja nareul chaja',
            english: 'Finding the real me inside the data',
            words: [
              { korean: '데이터 속에서', romanization: 'deiteo sogeseo', english: 'inside the data', type: 'noun' },
              { korean: '진짜', romanization: 'jinjja', english: 'real / true', type: 'adjective' },
              { korean: '나를', romanization: 'nareul', english: 'me (object)', type: 'noun' },
              { korean: '찾아', romanization: 'chaja', english: 'find / search for', type: 'verb' },
            ],
          },
        ],
      },
      {
        id: 'ae-2',
        artistId: 'aespa',
        title: 'Signal',
        titleKorean: '신호',
        theme: 'Connection across dimensions',
        isFree: false,
        lines: [
          {
            korean: '나에게 신호를 보내줘',
            romanization: 'naege sinhoreul bonaejwo',
            english: 'Send me a signal',
            words: [
              { korean: '나에게', romanization: 'naege', english: 'to me', type: 'noun' },
              { korean: '신호를', romanization: 'sinhoreul', english: 'signal (object)', type: 'noun' },
              { korean: '보내줘', romanization: 'bonaejwo', english: 'send (for me)', type: 'verb' },
            ],
          },
          {
            korean: '어디에서든 들을 수 있어',
            romanization: 'eodieseodon deureul su isseo',
            english: 'I can hear it from anywhere',
            words: [
              { korean: '어디에서든', romanization: 'eodieseodon', english: 'from anywhere', type: 'adverb' },
              { korean: '들을 수 있어', romanization: 'deureul su isseo', english: 'can hear', type: 'expression' },
            ],
          },
          {
            korean: '연결된 우리의 마음',
            romanization: 'yeongyeoldoen uriui maeum',
            english: 'Our connected hearts',
            words: [
              { korean: '연결된', romanization: 'yeongyeoldoen', english: 'connected', type: 'verb' },
              { korean: '우리의', romanization: 'uriui', english: 'our', type: 'noun' },
              { korean: '마음', romanization: 'maeum', english: 'heart / mind', type: 'noun' },
            ],
          },
          {
            korean: '시간과 공간을 넘어서',
            romanization: 'sigangwa gongganeul neomeoseo',
            english: 'Beyond time and space',
            words: [
              { korean: '시간과', romanization: 'sigangwa', english: 'time and', type: 'noun' },
              { korean: '공간을', romanization: 'gongganeul', english: 'space (object)', type: 'noun' },
              { korean: '넘어서', romanization: 'neomeoseo', english: 'beyond / crossing over', type: 'verb' },
            ],
          },
        ],
      },
    ],
  },
];
