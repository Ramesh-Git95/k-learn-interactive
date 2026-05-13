export interface DramaWord {
  korean: string;
  romanization: string;
  english: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Drama {
  id: string;
  title: string;
  titleEnglish: string;
  year: number;
  genres: string[];
  description: string;
  gradient: string;
  emoji: string;
  words: DramaWord[];
}

export const dramas: Drama[] = [
  {
    id: 'squid-game',
    title: '오징어 게임',
    titleEnglish: 'Squid Game',
    year: 2021,
    genres: ['Thriller', 'Survival'],
    description: '456 debt-ridden contestants compete in deadly children\'s games for a ₩45.6 billion prize.',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    emoji: '🦑',
    words: [
      { korean: '게임', romanization: 'ge-im', english: 'game', context: '게임을 시작하겠습니다. (We will begin the game.)', difficulty: 'beginner' },
      { korean: '참가자', romanization: 'cham-ga-ja', english: 'participant', context: '456명의 참가자가 있어요. (There are 456 participants.)', difficulty: 'intermediate' },
      { korean: '살아남다', romanization: 'sa-ra-nam-da', english: 'to survive', context: '살아남아야 해요. (You have to survive.)', difficulty: 'intermediate' },
      { korean: '탈락', romanization: 'tal-lak', english: 'elimination', context: '탈락하면 죽어요. (Elimination means death.)', difficulty: 'intermediate' },
      { korean: '규칙', romanization: 'gyu-chik', english: 'rule', context: '규칙을 따라야 해요. (You must follow the rules.)', difficulty: 'beginner' },
      { korean: '돈', romanization: 'don', english: 'money', context: '돈이 필요해요. (I need money.)', difficulty: 'beginner' },
      { korean: '배신하다', romanization: 'bae-sin-ha-da', english: 'to betray', context: '왜 나를 배신했어요? (Why did you betray me?)', difficulty: 'advanced' },
      { korean: '동맹', romanization: 'dong-maeng', english: 'alliance', context: '우리 동맹을 맺어요. (Let\'s form an alliance.)', difficulty: 'advanced' },
      { korean: '목숨', romanization: 'mok-sum', english: 'one\'s life', context: '목숨을 걸어요. (I\'m risking my life.)', difficulty: 'intermediate' },
      { korean: '공평하다', romanization: 'gong-pyeong-ha-da', english: 'to be fair', context: '게임은 공평해요. (The game is fair.)', difficulty: 'advanced' },
      { korean: '이기다', romanization: 'i-gi-da', english: 'to win', context: '이길 수 있어요. (I can win.)', difficulty: 'beginner' },
      { korean: '마지막', romanization: 'ma-ji-mak', english: 'last / final', context: '마지막 게임이에요. (This is the final game.)', difficulty: 'beginner' },
    ],
  },
  {
    id: 'crash-landing',
    title: '사랑의 불시착',
    titleEnglish: 'Crash Landing on You',
    year: 2019,
    genres: ['Romance', 'Drama'],
    description: 'A South Korean heiress crash-lands in North Korea and falls in love with a military officer.',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    emoji: '🪂',
    words: [
      { korean: '불시착', romanization: 'bul-si-chak', english: 'emergency landing', context: '북한에 불시착했어요. (I crash-landed in North Korea.)', difficulty: 'advanced' },
      { korean: '사랑', romanization: 'sa-rang', english: 'love', context: '사랑에 빠졌어요. (I fell in love.)', difficulty: 'beginner' },
      { korean: '비밀', romanization: 'bi-mil', english: 'secret', context: '비밀을 지켜야 해요. (I have to keep the secret.)', difficulty: 'beginner' },
      { korean: '보호하다', romanization: 'bo-ho-ha-da', english: 'to protect', context: '당신을 보호할게요. (I will protect you.)', difficulty: 'intermediate' },
      { korean: '그리워하다', romanization: 'geu-ri-wo-ha-da', english: 'to miss someone', context: '매일 그리워해요. (I miss you every day.)', difficulty: 'advanced' },
      { korean: '운명', romanization: 'un-myeong', english: 'fate / destiny', context: '우리는 운명이에요. (We are fated for each other.)', difficulty: 'intermediate' },
      { korean: '기적', romanization: 'gi-jeok', english: 'miracle', context: '기적이 일어났어요. (A miracle happened.)', difficulty: 'intermediate' },
      { korean: '이별', romanization: 'i-byeol', english: 'farewell / parting', context: '이별이 너무 슬퍼요. (Farewell is too sad.)', difficulty: 'intermediate' },
      { korean: '탈출', romanization: 'tal-chul', english: 'escape', context: '탈출해야 해요. (We have to escape.)', difficulty: 'intermediate' },
      { korean: '기다리다', romanization: 'gi-da-ri-da', english: 'to wait', context: '꼭 기다릴게요. (I will definitely wait.)', difficulty: 'beginner' },
      { korean: '다시 만나다', romanization: 'da-si man-na-da', english: 'to meet again', context: '다시 만날 거예요. (We will meet again.)', difficulty: 'intermediate' },
      { korean: '약속', romanization: 'yak-sok', english: 'promise', context: '이건 우리만의 약속이에요. (This is our promise.)', difficulty: 'beginner' },
    ],
  },
  {
    id: 'goblin',
    title: '도깨비',
    titleEnglish: 'Goblin',
    year: 2016,
    genres: ['Fantasy', 'Romance'],
    description: 'An immortal goblin searches for his human bride — the only one who can end his eternal life.',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
    emoji: '🕯️',
    words: [
      { korean: '도깨비', romanization: 'do-kae-bi', english: 'goblin', context: '나는 도깨비예요. (I am the goblin.)', difficulty: 'intermediate' },
      { korean: '신부', romanization: 'sin-bu', english: 'bride', context: '도깨비 신부예요. (She is the goblin\'s bride.)', difficulty: 'beginner' },
      { korean: '저승사자', romanization: 'jeo-seung-sa-ja', english: 'grim reaper', context: '저승사자가 왔어요. (The grim reaper has come.)', difficulty: 'advanced' },
      { korean: '영원', romanization: 'yeong-won', english: 'eternity', context: '영원히 살아요. (I live for eternity.)', difficulty: 'intermediate' },
      { korean: '외롭다', romanization: 'oe-rop-da', english: 'to be lonely', context: '너무 외로웠어요. (I was so lonely.)', difficulty: 'intermediate' },
      { korean: '기억', romanization: 'gi-eok', english: 'memory', context: '기억이 없어요. (I have no memories.)', difficulty: 'beginner' },
      { korean: '사라지다', romanization: 'sa-ra-ji-da', english: 'to disappear', context: '곧 사라질 거예요. (I will disappear soon.)', difficulty: 'intermediate' },
      { korean: '칼', romanization: 'kal', english: 'sword', context: '칼을 뽑을 수 있어요? (Can you pull out the sword?)', difficulty: 'beginner' },
      { korean: '환생', romanization: 'hwan-saeng', english: 'reincarnation', context: '환생을 믿어요? (Do you believe in reincarnation?)', difficulty: 'advanced' },
      { korean: '첫사랑', romanization: 'cheot-sa-rang', english: 'first love', context: '당신이 내 첫사랑이에요. (You are my first love.)', difficulty: 'intermediate' },
      { korean: '불멸', romanization: 'bul-myeol', english: 'immortality', context: '불멸은 축복이 아니에요. (Immortality is not a blessing.)', difficulty: 'advanced' },
      { korean: '눈물', romanization: 'nun-mul', english: 'tears', context: '눈물이 나와요. (Tears are coming out.)', difficulty: 'beginner' },
    ],
  },
  {
    id: 'itaewon-class',
    title: '이태원 클라쓰',
    titleEnglish: 'Itaewon Class',
    year: 2020,
    genres: ['Drama', 'Business'],
    description: 'An ex-convict opens a bar-restaurant in Itaewon, fuelled by an unbreakable will and a dream of revenge.',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    emoji: '🍺',
    words: [
      { korean: '복수', romanization: 'bok-su', english: 'revenge', context: '복수할 거예요. (I will take revenge.)', difficulty: 'intermediate' },
      { korean: '성공', romanization: 'seong-gong', english: 'success', context: '반드시 성공할 거예요. (I will definitely succeed.)', difficulty: 'beginner' },
      { korean: '포기하다', romanization: 'po-gi-ha-da', english: 'to give up', context: '절대 포기 안 해요. (I will never give up.)', difficulty: 'intermediate' },
      { korean: '노력', romanization: 'no-ryeok', english: 'effort', context: '노력하면 돼요. (If you put in effort, it\'ll work out.)', difficulty: 'beginner' },
      { korean: '꿈', romanization: 'kkum', english: 'dream', context: '제 꿈을 이룰 거예요. (I will achieve my dream.)', difficulty: 'beginner' },
      { korean: '열정', romanization: 'yeol-jeong', english: 'passion', context: '열정이 대단해요. (Your passion is amazing.)', difficulty: 'intermediate' },
      { korean: '식당', romanization: 'sik-dang', english: 'restaurant', context: '우리 식당이에요. (It\'s our restaurant.)', difficulty: 'beginner' },
      { korean: '사장님', romanization: 'sa-jang-nim', english: 'owner / boss', context: '저는 사장님이에요. (I am the owner.)', difficulty: 'beginner' },
      { korean: '당당하다', romanization: 'dang-dang-ha-da', english: 'to be confident', context: '당당하게 살아요. (Live confidently.)', difficulty: 'advanced' },
      { korean: '억울하다', romanization: 'eok-ul-ha-da', english: 'to feel wronged', context: '너무 억울해요. (I feel so wronged.)', difficulty: 'advanced' },
      { korean: '인내', romanization: 'in-nae', english: 'perseverance', context: '인내가 필요해요. (Perseverance is needed.)', difficulty: 'intermediate' },
      { korean: '단골', romanization: 'dan-gol', english: 'regular customer', context: '단골 손님이 됐어요. (They became a regular customer.)', difficulty: 'advanced' },
    ],
  },
  {
    id: 'my-mister',
    title: '나의 아저씨',
    titleEnglish: 'My Mister',
    year: 2018,
    genres: ['Drama', 'Slice of Life'],
    description: 'A middle-aged man and a young woman with a difficult past find healing through an unlikely friendship.',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
    emoji: '🌧️',
    words: [
      { korean: '아저씨', romanization: 'a-jeo-ssi', english: 'middle-aged man (address)', context: '아저씨, 괜찮아요? (Are you okay?)', difficulty: 'beginner' },
      { korean: '힘들다', romanization: 'him-deul-da', english: 'to be hard / exhausting', context: '살기가 너무 힘들어요. (Living is too hard.)', difficulty: 'intermediate' },
      { korean: '위로', romanization: 'wi-ro', english: 'comfort / consolation', context: '위로가 필요해요. (I need comfort.)', difficulty: 'intermediate' },
      { korean: '외로움', romanization: 'oe-ro-um', english: 'loneliness', context: '외로움을 느껴요. (I feel loneliness.)', difficulty: 'intermediate' },
      { korean: '버티다', romanization: 'beo-ti-da', english: 'to hold on / endure', context: '조금만 더 버텨요. (Hold on just a little longer.)', difficulty: 'advanced' },
      { korean: '진심', romanization: 'jin-sim', english: 'true heart / sincerity', context: '이게 진심이에요. (This is my true heart.)', difficulty: 'intermediate' },
      { korean: '이해하다', romanization: 'i-hae-ha-da', english: 'to understand', context: '당신을 이해해요. (I understand you.)', difficulty: 'beginner' },
      { korean: '살아가다', romanization: 'sa-ra-ga-da', english: 'to live on / get by', context: '그냥 살아가요. (Just live on.)', difficulty: 'intermediate' },
      { korean: '마음', romanization: 'ma-eum', english: 'heart / mind', context: '마음이 아파요. (My heart hurts.)', difficulty: 'beginner' },
      { korean: '고통', romanization: 'go-tong', english: 'pain / suffering', context: '고통스러워요. (I am in pain.)', difficulty: 'intermediate' },
      { korean: '혼자', romanization: 'hon-ja', english: 'alone', context: '혼자예요. (I am alone.)', difficulty: 'beginner' },
      { korean: '괜찮다', romanization: 'gwaen-chan-ta', english: 'to be okay / alright', context: '다 괜찮을 거예요. (Everything will be okay.)', difficulty: 'beginner' },
    ],
  },
];
