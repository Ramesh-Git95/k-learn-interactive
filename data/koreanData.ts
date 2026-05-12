import type { HangulCharacter, VocabCategory, GrammarPattern, PhraseItem, CultureTip, DailyLifeTopic } from '../types';

export const hangulCharacters: HangulCharacter[] = [
  // Basic Consonants
  { char: 'ㄱ', romanization: 'g/k', type: 'consonant' },
  { char: 'ㄴ', romanization: 'n', type: 'consonant' },
  { char: 'ㄷ', romanization: 'd/t', type: 'consonant' },
  { char: 'ㄹ', romanization: 'r/l', type: 'consonant' },
  { char: 'ㅁ', romanization: 'm', type: 'consonant' },
  { char: 'ㅂ', romanization: 'b/p', type: 'consonant' },
  { char: 'ㅅ', romanization: 's', type: 'consonant' },
  { char: 'ㅇ', romanization: 'ng/-', type: 'consonant' },
  { char: 'ㅈ', romanization: 'j', type: 'consonant' },
  { char: 'ㅊ', romanization: 'ch', type: 'consonant' },
  { char: 'ㅋ', romanization: 'k', type: 'consonant' },
  { char: 'ㅌ', romanization: 't', type: 'consonant' },
  { char: 'ㅍ', romanization: 'p', type: 'consonant' },
  { char: 'ㅎ', romanization: 'h', type: 'consonant' },
  // Double Consonants
  { char: 'ㄲ', romanization: 'kk', type: 'consonant' },
  { char: 'ㄸ', romanization: 'tt', type: 'consonant' },
  { char: 'ㅃ', romanization: 'pp', type: 'consonant' },
  { char: 'ㅆ', romanization: 'ss', type: 'consonant' },
  { char: 'ㅉ', romanization: 'jj', type: 'consonant' },
  // Basic Vowels
  { char: 'ㅏ', romanization: 'a', type: 'vowel' },
  { char: 'ㅑ', romanization: 'ya', type: 'vowel' },
  { char: 'ㅓ', romanization: 'eo', type: 'vowel' },
  { char: 'ㅕ', romanization: 'yeo', type: 'vowel' },
  { char: 'ㅗ', romanization: 'o', type: 'vowel' },
  { char: 'ㅛ', romanization: 'yo', type: 'vowel' },
  { char: 'ㅜ', romanization: 'u', type: 'vowel' },
  { char: 'ㅠ', romanization: 'yu', type: 'vowel' },
  { char: 'ㅡ', romanization: 'eu', type: 'vowel' },
  { char: 'ㅣ', romanization: 'i', type: 'vowel' },
  // Combined Vowels
  { char: 'ㅐ', romanization: 'ae', type: 'vowel' },
  { char: 'ㅒ', romanization: 'yae', type: 'vowel' },
  { char: 'ㅔ', romanization: 'e', type: 'vowel' },
  { char: 'ㅖ', romanization: 'ye', type: 'vowel' },
  { char: 'ㅘ', romanization: 'wa', type: 'vowel' },
  { char: 'ㅙ', romanization: 'wae', type: 'vowel' },
  { char: 'ㅚ', romanization: 'oe', type: 'vowel' },
  { char: 'ㅝ', romanization: 'wo', type: 'vowel' },
  { char: 'ㅞ', romanization: 'we', type: 'vowel' },
  { char: 'ㅟ', romanization: 'wi', type: 'vowel' },
  { char: 'ㅢ', romanization: 'ui', type: 'vowel' },
];

export const vocabulary: VocabCategory[] = [
  {
    name: 'Greetings',
    items: [
      { korean: '안녕하세요', romanization: 'annyeonghaseyo', english: 'Hello', examples: [
        { korean: '선생님, 안녕하세요!', english: 'Hello, teacher!', romanization: 'seonsaengnim, annyeonghaseyo!' },
        { korean: '안녕하세요, 저는 민준이에요.', english: "Hello, I'm Minjun.", romanization: 'annyeonghaseyo, jeoneun minjuniyeyo.' },
      ]},
      { korean: '감사합니다', romanization: 'gamsahamnida', english: 'Thank you', examples: [
        { korean: '도와주셔서 감사합니다.', english: 'Thank you for helping me.', romanization: 'dowajusyeoseo gamsahamnida.' },
        { korean: '선물 감사합니다.', english: 'Thank you for the gift.', romanization: 'seonmul gamsahamnida.' },
      ]},
      { korean: '죄송합니다', romanization: 'joesonghamnida', english: 'Sorry', examples: [
        { korean: '늦어서 죄송합니다.', english: "I'm sorry for being late.", romanization: 'neujeoseo joesonghamnida.' },
        { korean: '정말 죄송합니다.', english: "I'm truly sorry.", romanization: 'jeongmal joesonghamnida.' },
      ]},
      { korean: '네', romanization: 'ne', english: 'Yes', examples: [
        { korean: '네, 맞아요.', english: "Yes, that's right.", romanization: 'ne, majayo.' },
        { korean: '네, 알겠어요.', english: 'Yes, I understand.', romanization: 'ne, algeseoyo.' },
      ]},
      { korean: '아니요', romanization: 'aniyo', english: 'No', examples: [
        { korean: '아니요, 괜찮아요.', english: "No, it's okay.", romanization: 'aniyo, gwaenchanayo.' },
        { korean: '아니요, 저는 학생이 아니에요.', english: "No, I'm not a student.", romanization: 'aniyo, jeoneun haksaengi anieyo.' },
      ]},
      { korean: '만나서 반갑습니다', romanization: 'mannaseo bangapseumnida', english: 'Nice to meet you', examples: [
        { korean: '만나서 반갑습니다! 잘 부탁드려요.', english: 'Nice to meet you! Please take care of me.', romanization: 'mannaseo bangapseumnida! jal butakdeuryeoyo.' },
        { korean: '저도 만나서 반갑습니다.', english: 'Nice to meet you too.', romanization: 'jeodo mannaseo bangapseumnida.' },
      ]},
      { korean: '안녕히 가세요', romanization: 'annyeonghi gaseyo', english: 'Goodbye (to someone leaving)', examples: [
        { korean: '조심히 가세요. 안녕히 가세요!', english: 'Take care. Goodbye!', romanization: 'josimhi gaseyo. annyeonghi gaseyo!' },
        { korean: '안녕히 가세요. 또 만나요!', english: 'Goodbye. See you again!', romanization: 'annyeonghi gaseyo. tto mannayo!' },
      ]},
      { korean: '안녕히 계세요', romanization: 'annyeonghi gyeseyo', english: 'Goodbye (to someone staying)', examples: [
        { korean: '저는 이제 가볼게요. 안녕히 계세요!', english: "I'll be going now. Goodbye!", romanization: 'jeoneun ije gabollgeyo. annyeonghi gyeseyo!' },
        { korean: '안녕히 계세요. 내일 봬요.', english: 'Goodbye. See you tomorrow.', romanization: 'annyeonghi gyeseyo. naeil bwaeyo.' },
      ]},
    ],
  },
  {
    name: 'Numbers',
    items: [
      { korean: '일', romanization: 'il', english: 'One (Sino)', examples: [
        { korean: '일 층에 있어요.', english: "It's on the first floor.", romanization: 'il cheunge isseoyo.' },
        { korean: '일 월이에요.', english: "It's January.", romanization: 'il worieyo.' },
      ]},
      { korean: '이', romanization: 'i', english: 'Two (Sino)', examples: [
        { korean: '이 층에 살아요.', english: 'I live on the second floor.', romanization: 'i cheunge sarayo.' },
        { korean: '이 명이 왔어요.', english: 'Two people came.', romanization: 'i myeongi wasseoyo.' },
      ]},
      { korean: '삼', romanization: 'sam', english: 'Three (Sino)', examples: [
        { korean: '삼십 분 기다렸어요.', english: 'I waited thirty minutes.', romanization: 'samsip bun gidaryssseoyo.' },
        { korean: '삼 일 후에 만나요.', english: "Let's meet in three days.", romanization: 'sam il hue mannayo.' },
      ]},
      { korean: '사', romanization: 'sa', english: 'Four (Sino)', examples: [
        { korean: '사 월에 꽃이 피어요.', english: 'Flowers bloom in April.', romanization: 'sa wore kkochi pieoyo.' },
        { korean: '사 명이 있어요.', english: 'There are four people.', romanization: 'sa myeongi isseoyo.' },
      ]},
      { korean: '오', romanization: 'o', english: 'Five (Sino)', examples: [
        { korean: '오 분만 기다려 주세요.', english: 'Please wait just five minutes.', romanization: 'o bunman gidaryo juseyo.' },
        { korean: '오 월은 어린이날이에요.', english: "May is Children's Day.", romanization: 'o woreun eorininalieyo.' },
      ]},
      { korean: '육', romanization: 'yuk', english: 'Six (Sino)', examples: [
        { korean: '육 시에 일어나요.', english: 'I wake up at six o\'clock.', romanization: 'yuk sie ireonayo.' },
        { korean: '육 개월 동안 공부했어요.', english: 'I studied for six months.', romanization: 'yuk gaewol dongan gongbuhaesseoyo.' },
      ]},
      { korean: '칠', romanization: 'chil', english: 'Seven (Sino)', examples: [
        { korean: '칠 월에 한국에 가요.', english: "I'm going to Korea in July.", romanization: 'chil wore hankuke gayo.' },
        { korean: '칠 일이 일주일이에요.', english: 'Seven days is one week.', romanization: 'chil iri iljuirieyo.' },
      ]},
      { korean: '팔', romanization: 'pal', english: 'Eight (Sino)', examples: [
        { korean: '팔 시에 수업이 있어요.', english: "I have class at eight o'clock.", romanization: 'pal sie sueobi isseoyo.' },
        { korean: '팔 월은 더워요.', english: 'August is hot.', romanization: 'pal woreun deowoyo.' },
      ]},
      { korean: '구', romanization: 'gu', english: 'Nine (Sino)', examples: [
        { korean: '구 월에 학교가 시작해요.', english: 'School starts in September.', romanization: 'gu wore hakgyoga sijakaeyo.' },
        { korean: '구 개 주세요.', english: 'Please give me nine.', romanization: 'gu gae juseyo.' },
      ]},
      { korean: '십', romanization: 'sip', english: 'Ten (Sino)', examples: [
        { korean: '십 분 후에 올게요.', english: "I'll come in ten minutes.", romanization: 'sip bun hue ollgeyo.' },
        { korean: '십 명이 왔어요.', english: 'Ten people came.', romanization: 'sip myeongi wasseoyo.' },
      ]},
      { korean: '백', romanization: 'baek', english: 'One Hundred (Sino)', examples: [
        { korean: '백 원이에요.', english: "It's 100 won.", romanization: 'baek worieyo.' },
        { korean: '백 명이 왔어요.', english: 'One hundred people came.', romanization: 'baek myeongi wasseoyo.' },
      ]},
      { korean: '하나', romanization: 'hana', english: 'One (Native)', examples: [
        { korean: '사과 하나 주세요.', english: 'Please give me one apple.', romanization: 'sagwa hana juseyo.' },
        { korean: '하나만 있어요.', english: "There's only one.", romanization: 'hanaman isseoyo.' },
      ]},
      { korean: '둘', romanization: 'dul', english: 'Two (Native)', examples: [
        { korean: '친구 둘이 왔어요.', english: 'Two friends came.', romanization: 'chingu duri wasseoyo.' },
        { korean: '커피 둘 주세요.', english: 'Please give me two coffees.', romanization: 'keopi dul juseyo.' },
      ]},
      { korean: '셋', romanization: 'set', english: 'Three (Native)', examples: [
        { korean: '하나, 둘, 셋 세어요.', english: 'Count one, two, three.', romanization: 'hana, dul, set seeoyo.' },
        { korean: '셋이서 영화를 봤어요.', english: 'Three of us watched a movie.', romanization: 'sesiseo yeonghwareul bwasseoyo.' },
      ]},
      { korean: '넷', romanization: 'net', english: 'Four (Native)', examples: [
        { korean: '넷이서 같이 먹어요.', english: 'Four of us eat together.', romanization: 'nesiseo gachi meogeoyo.' },
        { korean: '공이 넷 있어요.', english: 'There are four balls.', romanization: 'gongi net isseoyo.' },
      ]},
      { korean: '다섯', romanization: 'daseot', english: 'Five (Native)', examples: [
        { korean: '다섯 살이에요.', english: "I'm five years old.", romanization: 'daseot sarieyo.' },
        { korean: '다섯 개 살게요.', english: "I'll buy five.", romanization: 'daseot gae sallgeyo.' },
      ]},
      { korean: '여섯', romanization: 'yeoseot', english: 'Six (Native)', examples: [
        { korean: '여섯 시에 만나요.', english: "Let's meet at six o'clock.", romanization: 'yeoseot sie mannayo.' },
        { korean: '여섯 명이 있어요.', english: 'There are six people.', romanization: 'yeoseot myeongi isseoyo.' },
      ]},
      { korean: '일곱', romanization: 'ilgop', english: 'Seven (Native)', examples: [
        { korean: '일곱 시간 잤어요.', english: 'I slept seven hours.', romanization: 'ilgop sigan jasseoyo.' },
        { korean: '일곱 번 연습했어요.', english: 'I practiced seven times.', romanization: 'ilgop beon yeonseuphaesseoyo.' },
      ]},
      { korean: '여덟', romanization: 'yeodeol', english: 'Eight (Native)', examples: [
        { korean: '여덟 시간 잤어요.', english: 'I slept eight hours.', romanization: 'yeodeol sigan jasseoyo.' },
        { korean: '여덟 살이에요.', english: "I'm eight years old.", romanization: 'yeodeol sarieyo.' },
      ]},
      { korean: '아홉', romanization: 'ahop', english: 'Nine (Native)', examples: [
        { korean: '아홉 시에 시작해요.', english: 'It starts at nine o\'clock.', romanization: 'ahop sie sijakaeyo.' },
        { korean: '아홉 살 때 배웠어요.', english: 'I learned it when I was nine.', romanization: 'ahop sal ttae baewosseoyo.' },
      ]},
      { korean: '열', romanization: 'yeol', english: 'Ten (Native)', examples: [
        { korean: '열 살이에요.', english: "I'm ten years old.", romanization: 'yeol sarieyo.' },
        { korean: '사과 열 개 주세요.', english: 'Please give me ten apples.', romanization: 'sagwa yeol gae juseyo.' },
      ]},
    ],
  },
  {
    name: 'Family',
    items: [
      { korean: '가족', romanization: 'gajok', english: 'Family', examples: [
        { korean: '우리 가족은 다섯 명이에요.', english: 'My family has five members.', romanization: 'uri gajogeuhn daseot myeongieyo.' },
        { korean: '가족과 여행했어요.', english: 'I traveled with my family.', romanization: 'gajokgwa yeohaenghaesseoyo.' },
      ]},
      { korean: '아버지', romanization: 'abeoji', english: 'Father', examples: [
        { korean: '아버지는 의사예요.', english: 'My father is a doctor.', romanization: 'abeojineun uisayeyo.' },
        { korean: '아버지가 요리해요.', english: 'My father cooks.', romanization: 'abeojiga yoriaeyo.' },
      ]},
      { korean: '어머니', romanization: 'eomeoni', english: 'Mother', examples: [
        { korean: '어머니는 선생님이에요.', english: 'My mother is a teacher.', romanization: 'eomeonineun seonsaengnimieyo.' },
        { korean: '어머니를 사랑해요.', english: 'I love my mother.', romanization: 'eomeonireul saranghaeyo.' },
      ]},
      { korean: '할아버지', romanization: 'harabeoji', english: 'Grandfather', examples: [
        { korean: '할아버지가 이야기해 주셨어요.', english: 'My grandfather told me a story.', romanization: 'harabeojiga iyagihae jusyeosseoyo.' },
        { korean: '할아버지는 부산에 사세요.', english: 'My grandfather lives in Busan.', romanization: 'harabeojineun busane saseyo.' },
      ]},
      { korean: '할머니', romanization: 'halmeoni', english: 'Grandmother', examples: [
        { korean: '할머니 음식이 제일 맛있어요.', english: "Grandmother's food is the most delicious.", romanization: 'halmeoni eumsigi jeil masisseoyo.' },
        { korean: '할머니께 전화했어요.', english: 'I called my grandmother.', romanization: 'halmeonigge jeonhwahaesseoyo.' },
      ]},
      { korean: '오빠/형', romanization: 'oppa/hyeong', english: 'Older Brother', examples: [
        { korean: '오빠가 저를 도와줬어요.', english: 'My older brother helped me.', romanization: 'oppaga jeoreul dowajwosseoyo.' },
        { korean: '형이 축구를 잘해요.', english: 'My older brother is good at soccer.', romanization: 'hyeongi chukgureul jalhaeyo.' },
      ]},
      { korean: '언니/누나', romanization: 'eonni/nuna', english: 'Older Sister', examples: [
        { korean: '언니랑 쇼핑했어요.', english: 'I shopped with my older sister.', romanization: 'eonnirang syopinghaesseoyo.' },
        { korean: '누나가 공부를 도와줬어요.', english: 'My older sister helped me study.', romanization: 'nunaga gongbureul dowajwosseoyo.' },
      ]},
      { korean: '남동생', romanization: 'namdongsaeng', english: 'Younger Brother', examples: [
        { korean: '남동생이 게임을 좋아해요.', english: 'My younger brother likes games.', romanization: 'namdongsaengi geimeul joahaeyo.' },
        { korean: '남동생이 태어났어요.', english: 'My younger brother was born.', romanization: 'namdongsaengi taeeonnasseoyo.' },
      ]},
      { korean: '여동생', romanization: 'yeodongsaeng', english: 'Younger Sister', examples: [
        { korean: '여동생이 노래를 잘해요.', english: 'My younger sister sings well.', romanization: 'yeodongsaengi noraereul jalhaeyo.' },
        { korean: '여동생과 함께 학교에 가요.', english: 'I go to school with my younger sister.', romanization: 'yeodongsaenggwa hamkke hakgyoe gayo.' },
      ]},
      { korean: '동생', romanization: 'dongsaeng', english: 'Younger Sibling', examples: [
        { korean: '동생이 아파요.', english: 'My younger sibling is sick.', romanization: 'dongsaengi apayo.' },
        { korean: '동생한테 선물을 줬어요.', english: 'I gave my younger sibling a gift.', romanization: 'dongsaenghante seonmureul jwosseoyo.' },
      ]},
    ],
  },
  {
    name: 'Food',
    items: [
      { korean: '밥', romanization: 'bap', english: 'Rice/Meal', examples: [
        { korean: '밥 먹었어요?', english: 'Did you eat a meal?', romanization: 'bap meogeosseoyo?' },
        { korean: '매일 밥을 먹어요.', english: 'I eat rice every day.', romanization: 'maeil bapeul meogeoyo.' },
      ]},
      { korean: '김치', romanization: 'kimchi', english: 'Kimchi', examples: [
        { korean: '김치를 좋아해요.', english: 'I like kimchi.', romanization: 'kimchireul joahaeyo.' },
        { korean: '어머니가 김치를 담갔어요.', english: 'My mother made kimchi.', romanization: 'eomeoniga kimchireul damgasseoyo.' },
      ]},
      { korean: '물', romanization: 'mul', english: 'Water', examples: [
        { korean: '물 좀 주세요.', english: 'Please give me some water.', romanization: 'mul jom juseyo.' },
        { korean: '운동 후에 물을 많이 마셔요.', english: 'I drink a lot of water after exercise.', romanization: 'undong hue mureul manhi masyeoyo.' },
      ]},
      { korean: '불고기', romanization: 'bulgogi', english: 'Bulgogi', examples: [
        { korean: '불고기가 정말 맛있어요.', english: 'Bulgogi is really delicious.', romanization: 'bulgogiga jeongmal masisseoyo.' },
        { korean: '불고기를 만들었어요.', english: 'I made bulgogi.', romanization: 'bulgogireul mandeureosseoyo.' },
      ]},
      { korean: '비빔밥', romanization: 'bibimbap', english: 'Bibimbap', examples: [
        { korean: '비빔밥 하나 주세요.', english: 'Please give me one bibimbap.', romanization: 'bibimbap hana juseyo.' },
        { korean: '비빔밥은 건강에 좋아요.', english: 'Bibimbap is healthy.', romanization: 'bibimbapeun geongange joahaeyo.' },
      ]},
      { korean: '라면', romanization: 'ramyeon', english: 'Ramen', examples: [
        { korean: '라면을 끓였어요.', english: 'I boiled ramen.', romanization: 'ramyeoneul kkeuryeosseoyo.' },
        { korean: '배고플 때 라면 먹어요.', english: "I eat ramen when I'm hungry.", romanization: 'baegopul ttae ramyeon meogeoyo.' },
      ]},
      { korean: '떡볶이', romanization: 'tteokbokki', english: 'Spicy Rice Cakes', examples: [
        { korean: '떡볶이가 매워요.', english: 'Tteokbokki is spicy.', romanization: 'tteokbokkiga maewoyo.' },
        { korean: '친구랑 떡볶이 먹었어요.', english: 'I ate tteokbokki with a friend.', romanization: 'chingurang tteokbokki meogeosseoyo.' },
      ]},
      { korean: '김밥', romanization: 'gimbap', english: 'Seaweed Rice Roll', examples: [
        { korean: '소풍에 김밥을 먹었어요.', english: 'I ate gimbap at a picnic.', romanization: 'sopunge gimbapeul meogeosseoyo.' },
        { korean: '김밥 만들기 어려워요.', english: 'Making gimbap is difficult.', romanization: 'gimbap mandeulgi eoryeowoyo.' },
      ]},
      { korean: '잡채', romanization: 'japchae', english: 'Glass Noodle Stir Fry', examples: [
        { korean: '잡채는 명절에 먹어요.', english: 'We eat japchae on holidays.', romanization: 'japchaeneun myeongjeore meogeoyo.' },
        { korean: '잡채가 맛있어요.', english: 'Japchae is delicious.', romanization: 'japchaega masisseoyo.' },
      ]},
      { korean: '주스', romanization: 'juseu', english: 'Juice', examples: [
        { korean: '오렌지 주스 주세요.', english: 'Please give me orange juice.', romanization: 'orenji juseu juseyo.' },
        { korean: '아침에 주스를 마셔요.', english: 'I drink juice in the morning.', romanization: 'achime juseureul masyeoyo.' },
      ]},
    ],
  },
  {
    name: 'Colors',
    items: [
      { korean: '색깔', romanization: 'saekkkal', english: 'Color', examples: [
        { korean: '무슨 색깔이에요?', english: 'What color is it?', romanization: 'museun saekkkaleyo?' },
        { korean: '이 색깔이 예뻐요.', english: 'This color is pretty.', romanization: 'i saekkkali yeppeoyo.' },
      ]},
      { korean: '빨간색', romanization: 'ppalgansaek', english: 'Red', examples: [
        { korean: '빨간색 장미예요.', english: "It's a red rose.", romanization: 'ppalgansaek jangmiyeyo.' },
        { korean: '신호등이 빨간색이에요.', english: 'The traffic light is red.', romanization: 'sinhodeugi ppalgansaegieyo.' },
      ]},
      { korean: '파란색', romanization: 'paransaek', english: 'Blue', examples: [
        { korean: '하늘이 파란색이에요.', english: 'The sky is blue.', romanization: 'haneuri paransaegieyo.' },
        { korean: '파란색 옷을 입었어요.', english: 'I wore blue clothes.', romanization: 'paransaek oseul ibeosseoyo.' },
      ]},
      { korean: '노란색', romanization: 'noransaek', english: 'Yellow', examples: [
        { korean: '바나나는 노란색이에요.', english: 'Bananas are yellow.', romanization: 'banananeun noransaegieyo.' },
        { korean: '노란색 꽃이 피었어요.', english: 'Yellow flowers bloomed.', romanization: 'noransaek kkochi pieosseoyo.' },
      ]},
      { korean: '초록색', romanization: 'choroksaek', english: 'Green', examples: [
        { korean: '나뭇잎이 초록색이에요.', english: 'The leaves are green.', romanization: 'namunnipi choroksaegieyo.' },
        { korean: '초록색을 좋아해요.', english: 'I like green.', romanization: 'choroksaekeul joahaeyo.' },
      ]},
      { korean: '검정색', romanization: 'geomjeongsaek', english: 'Black', examples: [
        { korean: '검정색 가방을 샀어요.', english: 'I bought a black bag.', romanization: 'geomjeongsaek gabangeul sasseoyo.' },
        { korean: '검정색 고양이가 귀여워요.', english: 'The black cat is cute.', romanization: 'geomjeongsaek goyangi gwiyeowoyo.' },
      ]},
      { korean: '흰색', romanization: 'huinsaek', english: 'White', examples: [
        { korean: '눈이 흰색이에요.', english: 'Snow is white.', romanization: 'nuni huinsaegieyo.' },
        { korean: '흰색 셔츠를 입었어요.', english: 'I wore a white shirt.', romanization: 'huinsaek syeocheureul ibeosseoyo.' },
      ]},
      { korean: '보라색', romanization: 'borasaek', english: 'Purple', examples: [
        { korean: '보라색 꽃이 예뻐요.', english: 'Purple flowers are pretty.', romanization: 'borasaek kkochi yeppeoyo.' },
        { korean: '제 방은 보라색이에요.', english: 'My room is purple.', romanization: 'je bangeun borasaegieyo.' },
      ]},
      { korean: '주황색', romanization: 'juhwangsaek', english: 'Orange', examples: [
        { korean: '당근은 주황색이에요.', english: 'Carrots are orange.', romanization: 'dangeuneun juhwangsaegieyo.' },
        { korean: '주황색 노을이 아름다워요.', english: 'The orange sunset is beautiful.', romanization: 'juhwangsaek noeuri areumdawoyo.' },
      ]},
    ],
  },
  {
    name: 'Days of the Week',
    items: [
      { korean: '월요일', romanization: 'woryoil', english: 'Monday', examples: [
        { korean: '월요일에 회의가 있어요.', english: 'I have a meeting on Monday.', romanization: 'woryoire hoeuiga isseoyo.' },
        { korean: '월요일은 바빠요.', english: 'Monday is busy.', romanization: 'woryoireun bappayo.' },
      ]},
      { korean: '화요일', romanization: 'hwayoil', english: 'Tuesday', examples: [
        { korean: '화요일에 친구를 만나요.', english: 'I meet a friend on Tuesday.', romanization: 'hwayoire chingureul mannayo.' },
        { korean: '화요일 수업이 어려워요.', english: "Tuesday's class is difficult.", romanization: 'hwayoil sueobi eoryeowoyo.' },
      ]},
      { korean: '수요일', romanization: 'suyoil', english: 'Wednesday', examples: [
        { korean: '수요일에 영화를 봐요.', english: 'I watch a movie on Wednesday.', romanization: 'suyoire yeonghwareul bwayo.' },
        { korean: '수요일마다 운동해요.', english: 'I exercise every Wednesday.', romanization: 'suyoilmada undonghaeyo.' },
      ]},
      { korean: '목요일', romanization: 'mogyoil', english: 'Thursday', examples: [
        { korean: '목요일에 한국어를 배워요.', english: 'I learn Korean on Thursday.', romanization: 'mogyoire hankugoreul baewoyo.' },
        { korean: '목요일 저녁에 뭐 해요?', english: 'What are you doing Thursday evening?', romanization: 'mogyoil jeonyeoge mwo haeyo?' },
      ]},
      { korean: '금요일', romanization: 'geumyoil', english: 'Friday', examples: [
        { korean: '금요일을 좋아해요.', english: 'I like Friday.', romanization: 'geumyoireul joahaeyo.' },
        { korean: '금요일에 파티가 있어요.', english: "There's a party on Friday.", romanization: 'geumyoire patiga isseoyo.' },
      ]},
      { korean: '토요일', romanization: 'toyoil', english: 'Saturday', examples: [
        { korean: '토요일에 쉬어요.', english: 'I rest on Saturday.', romanization: 'toyoire swieoyo.' },
        { korean: '토요일마다 운동해요.', english: 'I exercise every Saturday.', romanization: 'toyoilmada undonghaeyo.' },
      ]},
      { korean: '일요일', romanization: 'iryoil', english: 'Sunday', examples: [
        { korean: '일요일은 가족과 함께해요.', english: 'I spend Sunday with my family.', romanization: 'iryoireun gajokgwa hamkkehaeyo.' },
        { korean: '일요일에 교회에 가요.', english: 'I go to church on Sunday.', romanization: 'iryoire gyohoee gayo.' },
      ]},
      { korean: '오늘', romanization: 'oneul', english: 'Today', examples: [
        { korean: '오늘 날씨가 좋아요.', english: "Today's weather is nice.", romanization: 'oneul nalssiga joayo.' },
        { korean: '오늘 뭐 할 거예요?', english: 'What will you do today?', romanization: 'oneul mwo hal geoyeyo?' },
      ]},
      { korean: '어제', romanization: 'eoje', english: 'Yesterday', examples: [
        { korean: '어제 친구를 만났어요.', english: 'I met a friend yesterday.', romanization: 'eoje chingureul mannasseoyo.' },
        { korean: '어제는 피곤했어요.', english: 'I was tired yesterday.', romanization: 'eojeneun pigonhaesseoyo.' },
      ]},
      { korean: '내일', romanization: 'naeil', english: 'Tomorrow', examples: [
        { korean: '내일 학교에 가요.', english: "I'm going to school tomorrow.", romanization: 'naeil hakgyoe gayo.' },
        { korean: '내일 비가 올 거예요.', english: 'It will rain tomorrow.', romanization: 'naeil biga ol geoyeyo.' },
      ]},
    ],
  },
  {
    name: 'Body Parts',
    items: [
      { korean: '몸', romanization: 'mom', english: 'Body', examples: [
        { korean: '몸이 아파요.', english: 'My body hurts.', romanization: 'momi apayo.' },
        { korean: '몸을 건강하게 유지해요.', english: 'I keep my body healthy.', romanization: 'momeul geonganghage yujihaeyo.' },
      ]},
      { korean: '머리', romanization: 'meori', english: 'Head/Hair', examples: [
        { korean: '머리가 아파요.', english: 'I have a headache.', romanization: 'meoriga apayo.' },
        { korean: '머리를 감았어요.', english: 'I washed my hair.', romanization: 'meorireul gamasseoyo.' },
      ]},
      { korean: '눈', romanization: 'nun', english: 'Eye', examples: [
        { korean: '눈이 예뻐요.', english: 'Your eyes are pretty.', romanization: 'nuni yeppeoyo.' },
        { korean: '눈이 피곤해요.', english: 'My eyes are tired.', romanization: 'nuni pigonhaeyo.' },
      ]},
      { korean: '코', romanization: 'ko', english: 'Nose', examples: [
        { korean: '코가 막혀요.', english: 'My nose is stuffy.', romanization: 'koga makyeoyo.' },
        { korean: '코가 빨개요.', english: 'My nose is red.', romanization: 'koga ppalgaeyo.' },
      ]},
      { korean: '입', romanization: 'ip', english: 'Mouth', examples: [
        { korean: '입을 크게 벌려요.', english: 'Open your mouth wide.', romanization: 'ibeul keuge beollyeoyo.' },
        { korean: '입이 맵워요.', english: 'My mouth feels spicy.', romanization: 'ibi maepwoyo.' },
      ]},
      { korean: '귀', romanization: 'gwi', english: 'Ear', examples: [
        { korean: '귀가 아파요.', english: 'My ear hurts.', romanization: 'gwiga apayo.' },
        { korean: '귀를 막아요.', english: 'I cover my ears.', romanization: 'gwireul magayo.' },
      ]},
      { korean: '손', romanization: 'son', english: 'Hand', examples: [
        { korean: '손을 씻어요.', english: 'I wash my hands.', romanization: 'soneul ssiseoyo.' },
        { korean: '손이 차가워요.', english: 'My hands are cold.', romanization: 'soni chagawoyo.' },
      ]},
      { korean: '발', romanization: 'bal', english: 'Foot', examples: [
        { korean: '발이 아파요.', english: 'My feet hurt.', romanization: 'bari apayo.' },
        { korean: '발을 씻었어요.', english: 'I washed my feet.', romanization: 'bareul ssisseosseoyo.' },
      ]},
    ],
  },
  {
    name: 'Animals',
    items: [
      { korean: '동물', romanization: 'dongmul', english: 'Animal', examples: [
        { korean: '동물원에 가고 싶어요.', english: 'I want to go to the zoo.', romanization: 'dongmurwone gago sipeoyo.' },
        { korean: '동물을 좋아해요.', english: 'I like animals.', romanization: 'dongmureul joahaeyo.' },
      ]},
      { korean: '개', romanization: 'gae', english: 'Dog', examples: [
        { korean: '개를 키워요.', english: 'I raise a dog.', romanization: 'gaereul kiwoyo.' },
        { korean: '개가 짖어요.', english: 'The dog is barking.', romanization: 'gaega jijeoyo.' },
      ]},
      { korean: '고양이', romanization: 'goyangi', english: 'Cat', examples: [
        { korean: '고양이가 자고 있어요.', english: 'The cat is sleeping.', romanization: 'goyangiga jago isseoyo.' },
        { korean: '고양이를 좋아해요.', english: 'I like cats.', romanization: 'goyangireul joahaeyo.' },
      ]},
      { korean: '토끼', romanization: 'tokki', english: 'Rabbit', examples: [
        { korean: '토끼가 당근을 먹어요.', english: 'The rabbit eats carrots.', romanization: 'tokkiga dangnuneul meogeoyo.' },
        { korean: '토끼 귀가 길어요.', english: 'Rabbit ears are long.', romanization: 'tokki gwiga gireoyo.' },
      ]},
      { korean: '호랑이', romanization: 'horangi', english: 'Tiger', examples: [
        { korean: '호랑이가 무서워요.', english: 'Tigers are scary.', romanization: 'horangiga museowoyo.' },
        { korean: '한국의 상징은 호랑이예요.', english: 'The tiger is a symbol of Korea.', romanization: 'hankugui sangjingeun horangiyeyo.' },
      ]},
      { korean: '새', romanization: 'sae', english: 'Bird', examples: [
        { korean: '새가 노래해요.', english: 'The bird sings.', romanization: 'saega noraehaeyo.' },
        { korean: '새가 하늘을 날아요.', english: 'Birds fly in the sky.', romanization: 'saega haneureul narayo.' },
      ]},
    ],
  },
  {
    name: 'Transportation',
    items: [
      { korean: '버스', romanization: 'beoseu', english: 'Bus', examples: [
        { korean: '버스를 타고 왔어요.', english: 'I came by bus.', romanization: 'beoseureul tago wasseoyo.' },
        { korean: '버스가 늦게 왔어요.', english: 'The bus came late.', romanization: 'beoseuga neutkke wasseoyo.' },
      ]},
      { korean: '지하철', romanization: 'jihacheol', english: 'Subway', examples: [
        { korean: '지하철이 빠르고 편해요.', english: 'The subway is fast and convenient.', romanization: 'jihacheori ppareuge pyeonhaeyo.' },
        { korean: '지하철로 학교에 가요.', english: 'I go to school by subway.', romanization: 'jihachoero hakgyoe gayo.' },
      ]},
      { korean: '택시', romanization: 'taeksi', english: 'Taxi', examples: [
        { korean: '택시를 탔어요.', english: 'I took a taxi.', romanization: 'taeksireul tasseoyo.' },
        { korean: '택시가 비싸요.', english: 'Taxis are expensive.', romanization: 'taeksiga bissayo.' },
      ]},
      { korean: '비행기', romanization: 'bihaenggi', english: 'Airplane', examples: [
        { korean: '비행기를 처음 탔어요.', english: 'I rode an airplane for the first time.', romanization: 'bihaenggireul cheoeum tasseoyo.' },
        { korean: '비행기표를 샀어요.', english: 'I bought a plane ticket.', romanization: 'bihaenggipyoreul sasseoyo.' },
      ]},
      { korean: '자전거', romanization: 'jajeongeo', english: 'Bicycle', examples: [
        { korean: '자전거를 타고 공원에 가요.', english: 'I go to the park by bicycle.', romanization: 'jajeongeoreul tago gongwone gayo.' },
        { korean: '자전거가 고장났어요.', english: 'The bicycle broke down.', romanization: 'jajeongeoga gojangnasseoyo.' },
      ]},
    ],
  },
  {
    name: 'School & Work',
    items: [
      { korean: '학교', romanization: 'hakgyo', english: 'School', examples: [
        { korean: '학교에 일찍 가요.', english: 'I go to school early.', romanization: 'hakgyoe iljjik gayo.' },
        { korean: '학교가 재미있어요.', english: 'School is fun.', romanization: 'hakgyoga jaemiisseoyo.' },
      ]},
      { korean: '회사', romanization: 'hoesa', english: 'Company', examples: [
        { korean: '회사에서 일해요.', english: 'I work at a company.', romanization: 'hoesaeseo ilhaeyo.' },
        { korean: '회사가 집에서 멀어요.', english: 'The company is far from home.', romanization: 'hoesaga jibeseo meoreoyo.' },
      ]},
      { korean: '선생님', romanization: 'seonsaengnim', english: 'Teacher', examples: [
        { korean: '선생님이 친절해요.', english: 'The teacher is kind.', romanization: 'seonsaengnimi chinjeolhaeyo.' },
        { korean: '선생님께 질문했어요.', english: 'I asked the teacher a question.', romanization: 'seonsaengnimgge jilmunhaesseoyo.' },
      ]},
      { korean: '학생', romanization: 'haksaeng', english: 'Student', examples: [
        { korean: '저는 학생이에요.', english: 'I am a student.', romanization: 'jeoneun haksaengieyo.' },
        { korean: '학생이 열심히 공부해요.', english: 'The student studies hard.', romanization: 'haksaengi yeolsimhi gongbuhaeyo.' },
      ]},
      { korean: '의사', romanization: 'uisa', english: 'Doctor', examples: [
        { korean: '의사에게 갔어요.', english: 'I went to the doctor.', romanization: 'uisaege gasseoyo.' },
        { korean: '의사 선생님이 약을 줬어요.', english: 'The doctor gave me medicine.', romanization: 'uisa seonsaengnigi yageul jwosseoyo.' },
      ]},
      { korean: '책', romanization: 'chaek', english: 'Book', examples: [
        { korean: '책을 읽고 있어요.', english: "I'm reading a book.", romanization: 'chaekeul ilkko isseoyo.' },
        { korean: '도서관에서 책을 빌렸어요.', english: 'I borrowed a book from the library.', romanization: 'doseogwaneseo chaekeul billyeosseoyo.' },
      ]},
      { korean: '컴퓨터', romanization: 'keompyuteo', english: 'Computer', examples: [
        { korean: '컴퓨터로 일해요.', english: 'I work on a computer.', romanization: 'keompyutero ilhaeyo.' },
        { korean: '컴퓨터가 고장났어요.', english: 'The computer broke down.', romanization: 'keompyuteoga gojangnasseoyo.' },
      ]},
    ],
  },
];

export const grammarPatterns: GrammarPattern[] = [
  {
    pattern: 'A은/는 B입니다',
    explanation: 'Topic marking particles (은/는) with "to be" (입니다). Used to state what something is. 은 is used after a consonant, 는 after a vowel.',
    examples: [
      { korean: '저는 학생입니다.', english: 'I am a student.' },
      { korean: '이것은 책입니다.', english: 'This is a book.' },
    ],
  },
  {
    pattern: 'A이/가 B에 있습니다/없습니다',
    explanation: 'Subject marking particles (이/가) with location marker (에) and "to exist" (있습니다) or "to not exist" (없습니다). 이 is used after a consonant, 가 after a vowel.',
    examples: [
      { korean: '고양이가 집에 있습니다.', english: 'The cat is at home.' },
      { korean: '돈이 없습니다.', english: 'I have no money.' },
    ],
  },
   {
    pattern: 'Verb-았/었어요',
    explanation: 'Past tense suffix. Use -았어요 for verbs with a final vowel of ㅏ or ㅗ. Use -었어요 for all other verbs. For verbs ending in 하다, it becomes 했어요.',
    examples: [
      { korean: '어제 영화를 봤어요.', english: 'I watched a movie yesterday.' },
      { korean: '밥을 먹었어요.', english: 'I ate a meal.' },
      { korean: '숙제를 했어요.', english: 'I did my homework.' },
    ],
  },
   {
    pattern: 'Verb-(으)ㄹ 거예요',
    explanation: 'Future tense suffix. Used to express a future plan or intention. -ㄹ 거예요 is used after a vowel, and -을 거예요 is used after a consonant.',
    examples: [
      { korean: '내일 공부할 거예요.', english: 'I will study tomorrow.' },
      { korean: '주말에 친구를 만날 거예요.', english: 'I will meet a friend on the weekend.' },
    ],
  },
   {
    pattern: 'Object을/를',
    explanation: 'Object marking particles. Attaches to a noun to indicate it is the object of the verb. 을 is used after a consonant, 를 after a vowel.',
    examples: [
      { korean: '저는 책을 읽어요.', english: 'I read a book.' },
      { korean: '사과를 좋아해요.', english: 'I like apples.' },
    ],
  },
  {
    pattern: '안 + Verb/Adjective',
    explanation: 'Simple negation. Placing "안" before a verb or adjective makes the sentence negative. It corresponds to "do not" or "is not".',
    examples: [
      { korean: '학교에 안 가요.', english: 'I don\'t go to school.' },
      { korean: '이 음식은 안 매워요.', english: 'This food is not spicy.' },
    ],
  },
  {
    pattern: 'Verb-고 싶어요',
    explanation: 'Used to express desire or what you "want to do". Attach -고 싶어요 to the stem of a verb.',
    examples: [
      { korean: '한국에 가고 싶어요.', english: 'I want to go to Korea.' },
      { korean: '영화를 보고 싶어요.', english: 'I want to watch a movie.' },
    ],
  },
];

export const commonPhrases: PhraseItem[] = [
  { korean: '이거 얼마예요?', romanization: 'igeo eolmayeyo?', english: 'How much is this?', context: 'Shopping' },
  { korean: '깎아주세요', romanization: 'kkakkajuseyo', english: 'Please give me a discount.', context: 'Shopping' },
  { korean: '이거 주세요', romanization: 'igeo juseyo', english: 'Please give me this.', context: 'Shopping' },
  { korean: '화장실 어디예요?', romanization: 'hwajangsil eodiyeyo?', english: 'Where is the bathroom?', context: 'Directions' },
  { korean: '메뉴 주세요.', romanization: 'menyu juseyo.', english: 'Please give me the menu.', context: 'Restaurant' },
  { korean: '맛있어요!', romanization: 'masisseoyo!', english: 'It\'s delicious!', context: 'Restaurant' },
  { korean: '계산해 주세요', romanization: 'gyesanhae juseyo', english: 'Check, please.', context: 'Restaurant' },
  { korean: '이름이 뭐예요?', romanization: 'ireumi mwoyeyo?', english: 'What\'s your name?', context: 'Introductions' },
  { korean: '어디에서 왔어요?', romanization: 'eodieseo wasseoyo?', english: 'Where are you from?', context: 'Introductions' },
  { korean: '괜찮아요', romanization: 'gwaenchanayo', english: 'It\'s okay / I\'m okay', context: 'General' },
  { korean: '천천히 말해주세요', romanization: 'cheoncheonhi malhaejuseyo', english: 'Please speak slowly', context: 'Communication' },
  { korean: '배고파요', romanization: 'baegopayo', english: 'I\'m hungry', context: 'Feelings' },
  { korean: '목말라요', romanization: 'mongmallayo', english: 'I\'m thirsty', context: 'Feelings' },
  { korean: '아파요', romanization: 'apayo', english: 'I\'m sick / It hurts', context: 'Health' },
  { korean: '피곤해요', romanization: 'pigonhaeyo', english: 'I\'m tired', context: 'Feelings' },
  { korean: '도와주세요!', romanization: 'dowajuseyo!', english: 'Help me!', context: 'Emergency' },
];

export const cultureTips: CultureTip[] = [
    { title: 'Bowing', content: 'Bowing is a common way to show respect. The depth of the bow depends on the situation and the person you are greeting.', icon: '🙇' },
    { title: 'Dining Etiquette', content: 'When dining, wait for elders to start eating first. Use spoons for rice and soup, and chopsticks for side dishes.', icon: '🥢' },
    { title: 'Exchanging Items', content: 'Use two hands when giving or receiving items, especially with elders, to show respect.', icon: '🙌' },
    { title: 'Age Hierarchy', content: 'Age is very important in Korean society and influences how people interact and address each other using formal or informal language.', icon: '👵' },
    { title: 'Gift Giving', content: 'When visiting someone\'s home, it\'s customary to bring a small gift, like fruit or a cake. Gifts are usually not opened in front of the giver.', icon: '🎁' },
    { title: 'Number Systems', content: 'Korea uses two number systems: Native Korean for counting items and age, and Sino-Korean (from Chinese) for dates, money, and minutes.', icon: '🔢' },
    { title: 'Tipping Culture', content: 'Tipping is not customary in Korea. It is not expected in restaurants or taxis, and attempting to tip can sometimes cause confusion.', icon: '💰' },
    { title: 'Nunchi (눈치)', content: 'Nunchi is the subtle art of listening and gauging others\' moods. It\'s a crucial social skill for navigating interpersonal relationships in Korea.', icon: '🤔' },
    { title: 'Korean Wave (Hallyu)', content: 'Hallyu refers to the global popularity of South Korea\'s cultural economy exporting K-pop, K-dramas, and cinema.', icon: '🌊' },
    { title: 'Pali-pali (빨리빨리)', content: 'The "hurry, hurry" culture reflects the fast-paced lifestyle in Korea. It\'s seen in everything from fast internet speeds to efficient public services.', icon: '🏃‍♂️' },
    { title: 'Jjimjilbang (찜질방)', content: 'These are large, public bathhouses. They feature hot tubs, showers, saunas, and massage tables, and are a popular place for families and friends to relax.', icon: '🧖‍♀️' },
    { title: 'Hanbok (한복)', content: 'Hanbok is traditional Korean attire. While not worn daily, it\'s donned for special occasions like weddings, holidays (Seollal, Chuseok), and first birthdays.', icon: '👘' },
];

// Korean Regions Data for Regional Explorer
export const koreanRegions = [
  {
    id: 'seoul-gyeonggi',
    name: 'Seoul & Gyeonggi',
    nameKorean: '서울 & 경기',
    description: 'The heart of modern Korea - where tradition meets cutting-edge technology',
    coordinates: { x: 52, y: 28 }, // Northwestern Seoul area (more accurate for Seoul-Gyeonggi)
    color: '#FF6B6B',
    population: '25.7 million',
    keyFeatures: ['Capital city', 'K-pop industry', 'Technology hub', 'Royal palaces'],
    attractions: [
      { name: 'Gyeongbokgung Palace', nameKorean: '경복궁', type: 'Historical' },
      { name: 'Myeongdong', nameKorean: '명동', type: 'Shopping' },
      { name: 'Hongdae', nameKorean: '홍대', type: 'Nightlife' },
      { name: 'DMZ', nameKorean: 'DMZ', type: 'Historical' },
      { name: 'Everland', nameKorean: '에버랜드', type: 'Theme Park' }
    ],
    specialFoods: [
      { name: 'Kimchi Jjigae', nameKorean: '김치찌개', description: 'Spicy kimchi stew' },
      { name: 'Korean BBQ', nameKorean: '고기구이', description: 'Grilled meat with banchan' },
      { name: 'Hotteok', nameKorean: '호떡', description: 'Sweet pancake with filling' }
    ],
    culturalNotes: [
      'Fast-paced lifestyle (pali-pali culture)',
      'Business formal dress code',
      'Late-night culture and 24/7 services',
      'Heavy use of technology in daily life'
    ],
    languageNotes: [
      'Standard Korean pronunciation',
      'Formal speech common in business',
      'Many English loanwords in technology'
    ],
    travelTips: [
      'T-money card for public transport',
      'Many places close on Sundays',
      'Tipping is not customary',
      'Bow slightly when greeting'
    ],
    bestTimeToVisit: 'Spring (March-May) and Fall (September-November)',
    climate: 'Four distinct seasons with hot summers and cold winters'
  },
  {
    id: 'busan-gyeongsang',
    name: 'Busan & Gyeongsang',
    nameKorean: '부산 & 경상',
    description: 'Coastal charm with beautiful beaches, mountains, and unique dialect',
    coordinates: { x: 72, y: 62 }, // Southeastern Korea (Busan area)
    color: '#4ECDC4',
    population: '13.3 million',
    keyFeatures: ['Largest port city', 'Beautiful beaches', 'Film festival', 'Mountain temples'],
    attractions: [
      { name: 'Haeundae Beach', nameKorean: '해운대해수욕장', type: 'Beach' },
      { name: 'Gamcheon Culture Village', nameKorean: '감천문화마을', type: 'Cultural' },
      { name: 'Bulguksa Temple', nameKorean: '불국사', type: 'Religious' },
      { name: 'Jagalchi Fish Market', nameKorean: '자갈치시장', type: 'Market' },
      { name: 'Beomeosa Temple', nameKorean: '범어사', type: 'Religious' }
    ],
    specialFoods: [
      { name: 'Dwaeji Gukbap', nameKorean: '돼지국밥', description: 'Pork soup with rice' },
      { name: 'Ssiat Hotteok', nameKorean: '씨앗호떡', description: 'Seed-filled sweet pancake' },
      { name: 'Milmyeon', nameKorean: '밀면', description: 'Busan-style cold noodles' }
    ],
    culturalNotes: [
      'More relaxed and laid-back atmosphere',
      'Strong maritime culture',
      'Proud of regional identity',
      'Friendly and direct communication style'
    ],
    languageNotes: [
      'Distinct Gyeongsang dialect (사투리)',
      'Rising intonation pattern',
      'Different vocabulary for some words'
    ],
    travelTips: [
      'Beach season: June-August',
      'Try fresh seafood at markets',
      'Learn basic dialect phrases',
      'Comfortable walking shoes for hilly areas'
    ],
    bestTimeToVisit: 'Late spring to early fall (May-October)',
    climate: 'Milder winters, humid summers, beautiful autumn'
  },
  {
    id: 'jeju',
    name: 'Jeju Island',
    nameKorean: '제주도',
    description: 'Paradise island with unique culture, stunning nature, and volcanic landscapes',
    coordinates: { x: 42, y: 85 }, // Southern island (Jeju position)
    color: '#95E1D3',
    population: '670,000',
    keyFeatures: ['Volcanic island', 'UNESCO sites', 'Unique women divers', 'Tangerines'],
    attractions: [
      { name: 'Hallasan Mountain', nameKorean: '한라산', type: 'Nature' },
      { name: 'Seongsan Ilchulbong', nameKorean: '성산일출봉', type: 'Nature' },
      { name: 'Manjanggul Cave', nameKorean: '만장굴', type: 'Nature' },
      { name: 'Jeju Folk Village', nameKorean: '제주민속촌', type: 'Cultural' },
      { name: 'Cheonjiyeon Waterfall', nameKorean: '천지연폭포', type: 'Nature' }
    ],
    specialFoods: [
      { name: 'Black Pork BBQ', nameKorean: '흑돼지구이', description: 'Famous Jeju black pork' },
      { name: 'Abalone Porridge', nameKorean: '전복죽', description: 'Nutritious seafood porridge' },
      { name: 'Hallabong', nameKorean: '한라봉', description: 'Sweet Jeju citrus fruit' }
    ],
    culturalNotes: [
      'Matriarchal society with strong women (해녀)',
      'Shamanism and folk beliefs',
      'Independent island culture',
      'Environmental consciousness'
    ],
    languageNotes: [
      'Jeju dialect (제주어) - almost separate language',
      'Many unique vocabulary words',
      'Different grammar patterns'
    ],
    travelTips: [
      'Rent a car to explore the island',
      'Respect the haenyeo (women divers)',
      'Try local specialty foods',
      'Book accommodation early in peak season'
    ],
    bestTimeToVisit: 'Spring and fall for hiking, summer for beaches',
    climate: 'Subtropical climate, warmer than mainland Korea'
  },
  {
    id: 'gangwon',
    name: 'Gangwon Province',
    nameKorean: '강원도',
    description: 'Mountain paradise with ski resorts, Olympic sites, and pristine nature',
    coordinates: { x: 68, y: 18 }, // Northeastern Korea (Gangwon area)
    color: '#A8E6CF',
    population: '1.5 million',
    keyFeatures: ['2018 Winter Olympics', 'Ski resorts', 'Beautiful mountains', 'Fresh air'],
    attractions: [
      { name: 'Pyeongchang Olympic Park', nameKorean: '평창올림픽파크', type: 'Sports' },
      { name: 'Nami Island', nameKorean: '남이섬', type: 'Nature' },
      { name: 'Seoraksan National Park', nameKorean: '설악산국립공원', type: 'Nature' },
      { name: 'Odaesan National Park', nameKorean: '오대산국립공원', type: 'Nature' },
      { name: 'Alpensia Resort', nameKorean: '알펜시아리조트', type: 'Recreation' }
    ],
    specialFoods: [
      { name: 'Chuncheon Dakgalbi', nameKorean: '춘천닭갈비', description: 'Spicy stir-fried chicken' },
      { name: 'Makguksu', nameKorean: '막국수', description: 'Buckwheat cold noodles' },
      { name: 'Hwangtae Soup', nameKorean: '황태국', description: 'Dried pollack soup' }
    ],
    culturalNotes: [
      'Strong connection to nature',
      'Winter sports culture',
      'Mountain village traditions',
      'Slower pace of life'
    ],
    languageNotes: [
      'Similar to standard Korean',
      'Some mountain village dialects',
      'Nature-related vocabulary'
    ],
    travelTips: [
      'Best for winter sports (Dec-Feb)',
      'Bring warm clothes in winter',
      'Beautiful autumn foliage (Sept-Oct)',
      'Many outdoor activities available'
    ],
    bestTimeToVisit: 'Winter for skiing, autumn for foliage',
    climate: 'Cold winters with snow, mild summers'
  },
  {
    id: 'jeolla',
    name: 'Jeolla Provinces',
    nameKorean: '전라도',
    description: 'The foodie capital with incredible cuisine, traditional arts, and cultural heritage',
    coordinates: { x: 28, y: 55 }, // Southwestern Korea (Jeollanam-do area)
    color: '#FFD93D',
    population: '3.6 million',
    keyFeatures: ['Best Korean food', 'Traditional arts', 'Historic sites', 'Bamboo forests'],
    attractions: [
      { name: 'Jeonju Hanok Village', nameKorean: '전주한옥마을', type: 'Cultural' },
      { name: 'Damyang Bamboo Forest', nameKorean: '담양죽녹원', type: 'Nature' },
      { name: 'Boseong Tea Fields', nameKorean: '보성차밭', type: 'Nature' },
      { name: 'Mokpo Natural History Museum', nameKorean: '목포자연사박물관', type: 'Educational' },
      { name: 'Suncheon Bay', nameKorean: '순천만', type: 'Nature' }
    ],
    specialFoods: [
      { name: 'Jeonju Bibimbap', nameKorean: '전주비빔밥', description: 'The original mixed rice dish' },
      { name: 'Hongeo', nameKorean: '홍어', description: 'Fermented skate (acquired taste)' },
      { name: 'Guksu Jangguk', nameKorean: '국수장국', description: 'Clear noodle soup' }
    ],
    culturalNotes: [
      'Proud of culinary traditions',
      'Strong artistic heritage',
      'Traditional craftmanship',
      'Slower, traditional lifestyle'
    ],
    languageNotes: [
      'Jeolla dialect with unique intonation',
      'Food-related vocabulary rich',
      'Traditional expressions preserved'
    ],
    travelTips: [
      'Must-try region for food lovers',
      'Visit traditional markets',
      'Experience hanok stays',
      'Learn about traditional arts'
    ],
    bestTimeToVisit: 'Spring for flowers, autumn for harvest season',
    climate: 'Mild climate, good for agriculture'
  },
  {
    id: 'chungcheong',
    name: 'Chungcheong Provinces',
    nameKorean: '충청도',
    description: 'Central Korea with historic capitals, hot springs, and administrative centers',
    coordinates: { x: 48, y: 42 }, // Central Korea (Chungcheong area)
    color: '#6C5CE7',
    population: '5.2 million',
    keyFeatures: ['Historic capitals', 'Administrative center', 'Hot springs', 'Universities'],
    attractions: [
      { name: 'Buyeo National Museum', nameKorean: '부여국립박물관', type: 'Historical' },
      { name: 'Gongsanseong Fortress', nameKorean: '공산성', type: 'Historical' },
      { name: 'Daejeon Expo Park', nameKorean: '대전엑스포공원', type: 'Educational' },
      { name: 'Onyang Hot Springs', nameKorean: '온양온천', type: 'Relaxation' },
      { name: 'Magoksa Temple', nameKorean: '마곡사', type: 'Religious' }
    ],
    specialFoods: [
      { name: 'Chungcheong Sundae', nameKorean: '충청순대', description: 'Regional blood sausage' },
      { name: 'Chodang Sundubu', nameKorean: '초당순두부', description: 'Soft tofu specialty' },
      { name: 'Gongju Chestnut', nameKorean: '공주밤', description: 'Famous sweet chestnuts' }
    ],
    culturalNotes: [
      'Central Korean characteristics',
      'Government administrative culture',
      'Academic atmosphere',
      'Balanced lifestyle'
    ],
    languageNotes: [
      'Standard Korean with slight variations',
      'Academic and formal language common',
      'Historical terms preserved'
    ],
    travelTips: [
      'Great for history buffs',
      'Visit ancient kingdom sites',
      'Enjoy hot spring relaxation',
      'Good base for exploring Korea'
    ],
    bestTimeToVisit: 'Spring and autumn for comfortable weather',
    climate: 'Continental climate, four distinct seasons'
  }
];

export const dailyLifeTopics: DailyLifeTopic[] = [
  {
    id: 'work-culture',
    title: 'Work Culture',
    titleKorean: '직장 문화',
    icon: '💼',
    description: 'Understanding Korean workplace dynamics, hierarchy, and professional relationships',
    sections: [
      {
        id: 'hierarchy',
        title: 'Workplace Hierarchy',
        content: 'Korean workplaces are deeply influenced by Confucian values, emphasizing respect for seniority and clear hierarchical structures. Age, position, and company tenure all play important roles in determining workplace relationships.',
        tips: [
          'Always bow when meeting senior colleagues',
          'Use formal language with supervisors',
          'Wait for seniors to start eating at company dinners',
          'Offer to pour drinks for older colleagues',
          'Never refuse a senior\'s invitation to after-work activities'
        ],
        vocabulary: [
          { korean: '회사', romanization: 'hoesa', english: 'company' },
          { korean: '상사', romanization: 'sangsa', english: 'boss/supervisor' },
          { korean: '동료', romanization: 'dongnyo', english: 'colleague' },
          { korean: '신입사원', romanization: 'sinip-sawon', english: 'new employee' },
          { korean: '부장님', romanization: 'bujang-nim', english: 'department manager (honorific)' }
        ],
        phrases: [
          { korean: '수고하셨습니다', romanization: 'sugo-hasyeossseumnida', english: 'Thank you for your hard work', context: 'End of workday greeting', formality: 'polite' },
          { korean: '안녕히 계세요', romanization: 'annyeonghi gyeseyo', english: 'Goodbye (to someone staying)', context: 'Leaving the office', formality: 'polite' },
          { korean: '먼저 실례하겠습니다', romanization: 'meonjeo sillyehagesseumnida', english: 'Excuse me, I\'ll leave first', context: 'Leaving before others', formality: 'formal' }
        ],
        culturalNotes: [
          'Nunchi (눈치) - reading the room/social awareness is crucial',
          'Group harmony is valued over individual expression',
          'Face-saving is important in all interactions',
          'Gift-giving follows specific protocols and reciprocity'
        ]
      },
      {
        id: 'office-life',
        title: 'Daily Office Life',
        content: 'Korean office culture includes unique practices like morning exercises, team building activities, and the famous "hoesik" (회식) - company dinner gatherings that are essential for workplace bonding.',
        tips: [
          'Arrive early to show dedication',
          'Participate in company group activities',
          'Dress conservatively and professionally',
          'Bring small gifts when returning from trips',
          'Learn to use chopsticks properly for business meals'
        ],
        examples: [
          {
            situation: 'Arriving at work',
            korean: '안녕하세요! 오늘도 잘 부탁드립니다.',
            romanization: 'Annyeonghaseyo! Oneuldo jal butak-deurimnida.',
            english: 'Hello! Please take care of me well today too.'
          },
          {
            situation: 'Offering help to a colleague',
            korean: '도움이 필요하시면 언제든지 말씀하세요.',
            romanization: 'Doumi pilyo-hasimyeon eonjedeunji malsseumhaseyo.',
            english: 'If you need help, please let me know anytime.'
          }
        ]
      }
    ]
  },
  {
    id: 'family-life',
    title: 'Family & Relationships',
    titleKorean: '가족과 인간관계',
    icon: '👨‍👩‍👧‍👦',
    description: 'Korean family structures, traditions, and social relationships',
    sections: [
      {
        id: 'family-roles',
        title: 'Family Dynamics',
        content: 'Korean families traditionally follow Confucian principles with clear roles and responsibilities. Respect for parents and elders is paramount, and family decisions often involve multiple generations.',
        tips: [
          'Always greet elders first when entering a room',
          'Use both hands when giving or receiving from elders',
          'Remove shoes when entering homes',
          'Sit properly during family meals',
          'Children are expected to care for aging parents'
        ],
        vocabulary: [
          { korean: '가족', romanization: 'gajok', english: 'family' },
          { korean: '부모님', romanization: 'bumonim', english: 'parents (honorific)' },
          { korean: '할머니', romanization: 'halmeoni', english: 'grandmother' },
          { korean: '할아버지', romanization: 'harabeoji', english: 'grandfather' },
          { korean: '형/누나', romanization: 'hyeong/nuna', english: 'older brother/sister (by gender)' }
        ],
        culturalNotes: [
          'Filial piety (효) is a core value',
          'Multi-generational households are common',
          'Children often live with parents until marriage',
          'Family gatherings are elaborate and formal'
        ]
      },
      {
        id: 'dating-marriage',
        title: 'Dating & Marriage',
        content: 'Modern Korean dating culture blends traditional values with contemporary practices. Blind dates (소개팅) are common, and family approval is highly valued.',
        tips: [
          'Dress well for dates - appearance matters',
          'Men typically pay for dates initially',
          'Meeting the family is a serious step',
          'Couple items and matching outfits are popular',
          'Marriage involves both families, not just individuals'
        ],
        vocabulary: [
          { korean: '연애', romanization: 'yeonae', english: 'dating/romance' },
          { korean: '소개팅', romanization: 'sogaeting', english: 'blind date' },
          { korean: '결혼', romanization: 'gyeolhon', english: 'marriage' },
          { korean: '약혼', romanization: 'yagyhon', english: 'engagement' },
          { korean: '신랑신부', romanization: 'sillang-sinbu', english: 'bride and groom' }
        ]
      }
    ]
  },
  {
    id: 'social-life',
    title: 'Social Activities',
    titleKorean: '사회 활동',
    icon: '🎉',
    description: 'How Koreans socialize, celebrate, and spend leisure time',
    sections: [
      {
        id: 'dining-culture',
        title: 'Dining & Entertainment',
        content: 'Korean social life revolves around food and shared experiences. From BBQ restaurants to karaoke (노래방), group activities are essential for building relationships.',
        tips: [
          'Never eat alone if others are present',
          'Wait for the eldest to start eating',
          'Pour drinks for others, never yourself',
          'Use both hands when receiving drinks',
          'Splitting bills is common among friends'
        ],
        vocabulary: [
          { korean: '회식', romanization: 'hoesik', english: 'company dinner' },
          { korean: '노래방', romanization: 'noraebang', english: 'karaoke room' },
          { korean: '술집', romanization: 'suljip', english: 'bar/pub' },
          { korean: '치킨', romanization: 'chikin', english: 'fried chicken' },
          { korean: '맥주', romanization: 'maekju', english: 'beer' }
        ],
        examples: [
          {
            situation: 'Inviting someone to dinner',
            korean: '오늘 저녁에 같이 밥 먹을래요?',
            romanization: 'Oneul jeonyeoge gachi bap meogeullaeyo?',
            english: 'Would you like to have dinner together tonight?'
          },
          {
            situation: 'At a karaoke room',
            korean: '이 노래 정말 좋아해요! 같이 불러요.',
            romanization: 'I norae jeongmal joahaeyo! Gachi bulleoyo.',
            english: 'I really love this song! Let\'s sing together.'
          }
        ]
      },
      {
        id: 'festivals-holidays',
        title: 'Festivals & Holidays',
        content: 'Korean calendar is filled with traditional holidays like Chuseok and Seollal, as well as modern celebrations that bring families and communities together.',
        tips: [
          'Give money in even amounts during holidays',
          'Wear hanbok for traditional celebrations',
          'Prepare specific foods for each holiday',
          'Visit family graves during Chuseok',
          'Children bow to elders for New Year money'
        ],
        vocabulary: [
          { korean: '추석', romanization: 'chuseok', english: 'Korean Thanksgiving' },
          { korean: '설날', romanization: 'seollal', english: 'Korean New Year' },
          { korean: '어린이날', romanization: 'eorininal', english: 'Children\'s Day' },
          { korean: '한복', romanization: 'hanbok', english: 'traditional Korean clothing' },
          { korean: '세배', romanization: 'sebae', english: 'New Year bow' }
        ]
      }
    ]
  },
  {
    id: 'housing-living',
    title: 'Housing & Living',
    titleKorean: '주거와 생활',
    icon: '🏠',
    description: 'Korean housing culture, neighborhood life, and domestic practices',
    sections: [
      {
        id: 'housing-types',
        title: 'Types of Housing',
        content: 'Korea offers diverse housing options from traditional hanok houses to modern apartments. Most Koreans live in apartment complexes with unique rental systems like jeonse.',
        tips: [
          'Remove shoes at the entrance (현관)',
          'Separate recycling is mandatory',
          'Quiet hours are strictly observed',
          'Apartment communities have strong rules',
          'Ondol floor heating is traditional'
        ],
        vocabulary: [
          { korean: '아파트', romanization: 'apateu', english: 'apartment' },
          { korean: '빌라', romanization: 'billa', english: 'villa/townhouse' },
          { korean: '원룸', romanization: 'wonrum', english: 'studio apartment' },
          { korean: '전세', romanization: 'jeonse', english: 'key money rental system' },
          { korean: '월세', romanization: 'wolse', english: 'monthly rent' }
        ],
        culturalNotes: [
          'Jeonse system requires large upfront deposits',
          'Apartment complexes are mini-communities',
          'Floor heating (ondol) is universal',
          'Balconies are used for storage, not relaxation'
        ]
      },
      {
        id: 'daily-routines',
        title: 'Daily Routines',
        content: 'Korean daily life follows structured patterns with emphasis on efficiency, cleanliness, and community consideration.',
        tips: [
          'Early morning exercise in parks is popular',
          'Convenience stores are life savers',
          'Public transportation is preferred',
          'Food delivery culture is very advanced',
          'Internet cafes (PC방) are social spaces'
        ],
        vocabulary: [
          { korean: '일과', romanization: 'ilgwa', english: 'daily routine' },
          { korean: '편의점', romanization: 'pyeonuijeom', english: 'convenience store' },
          { korean: '지하철', romanization: 'jihacheol', english: 'subway' },
          { korean: '배달', romanization: 'baedal', english: 'delivery' },
          { korean: '피시방', romanization: 'pisibang', english: 'PC room/internet cafe' }
        ]
      }
    ]
  }
];

export const modernKoreaTopics: DailyLifeTopic[] = [
  {
    id: 'kpop-hallyu',
    title: 'K-pop & Hallyu Wave',
    titleKorean: '케이팝과 한류',
    icon: '🎵',
    description: 'The global phenomenon of Korean pop culture and the Korean Wave',
    sections: [
      {
        id: 'kpop-culture',
        title: 'K-pop Culture',
        content: 'K-pop has become a global cultural phenomenon, representing not just music but a complete lifestyle including fashion, dance, and fan culture. The industry is known for its highly produced content, synchronized choreography, and strong fan-artist relationships.',
        tips: [
          'Learn fan chants (떼창) to participate in concerts',
          'Understand the concept of "bias" (최애) - your favorite member',
          'Know about different "generations" of K-pop groups',
          'Respect the training system and hard work of idols',
          'Participate in streaming culture to support artists'
        ],
        vocabulary: [
          { korean: '아이돌', romanization: 'aidol', english: 'idol' },
          { korean: '데뷔', romanization: 'debwi', english: 'debut' },
          { korean: '컴백', romanization: 'keombaek', english: 'comeback' },
          { korean: '팬덤', romanization: 'paendeom', english: 'fandom' },
          { korean: '안무', romanization: 'anmu', english: 'choreography' },
          { korean: '최애', romanization: 'choeae', english: 'bias/favorite' },
          { korean: '떼창', romanization: 'ttechang', english: 'fan chant' }
        ],
        phrases: [
          { korean: '사랑해요!', romanization: 'saranghaeyo!', english: 'I love you!', context: 'Fan expressing love to idols', formality: 'polite' },
          { korean: '화이팅!', romanization: 'hwaiting!', english: 'Fighting! (Good luck!)', context: 'Cheering/encouragement', formality: 'casual' },
          { korean: '대박!', romanization: 'daebak!', english: 'Awesome!/Amazing!', context: 'Expression of amazement', formality: 'casual' }
        ],
        culturalNotes: [
          'Fan culture is extremely organized and supportive',
          'Idols often have strict dating restrictions',
          'The training period can last several years',
          'Physical appearance and image are heavily emphasized'
        ]
      },
      {
        id: 'entertainment-industry',
        title: 'Entertainment Industry',
        content: 'The Korean entertainment industry, led by major companies like SM, YG, JYP, and HYBE, has created a systematic approach to star-making that includes rigorous training, strategic marketing, and global expansion.',
        tips: [
          'Understand the "Big 4" entertainment companies',
          'Learn about trainee system and monthly evaluations',
          'Know the importance of variety shows for promotion',
          'Understand concept albums and music video storytelling',
          'Appreciate the role of producers and choreographers'
        ],
        vocabulary: [
          { korean: '기획사', romanization: 'gihoeksa', english: 'entertainment agency' },
          { korean: '연습생', romanization: 'yeonseupsaeng', english: 'trainee' },
          { korean: '예능', romanization: 'yeneung', english: 'variety show' },
          { korean: '프로듀서', romanization: 'peurodyuseo', english: 'producer' },
          { korean: '안무가', romanization: 'anmuga', english: 'choreographer' }
        ]
      }
    ]
  },
  {
    id: 'technology-innovation',
    title: 'Technology & Innovation',
    titleKorean: '기술과 혁신',
    icon: '📱',
    description: 'Korea\'s leading role in technology, from smartphones to gaming',
    sections: [
      {
        id: 'digital-lifestyle',
        title: 'Digital Lifestyle',
        content: 'Korea is one of the most connected countries in the world, with ultra-fast internet, widespread smartphone adoption, and digital payment systems integrated into daily life. The concept of "ppalli ppalli" (quickly quickly) extends to digital services.',
        tips: [
          'Download KakaoTalk for messaging (like WhatsApp)',
          'Use KakaoPay or Samsung Pay for payments',
          'Understand the importance of Naver over Google',
          'Know about PC bangs (internet cafes) culture',
          'Learn about Korean social media platforms'
        ],
        vocabulary: [
          { korean: '카카오톡', romanization: 'kakaotok', english: 'KakaoTalk (messaging app)' },
          { korean: '네이버', romanization: 'neibeo', english: 'Naver (search engine)' },
          { korean: '피시방', romanization: 'pisibang', english: 'PC room/internet cafe' },
          { korean: '빨리빨리', romanization: 'ppalli ppalli', english: 'quickly quickly' },
          { korean: '스마트폰', romanization: 'seumateupon', english: 'smartphone' },
          { korean: '와이파이', romanization: 'waipai', english: 'WiFi' }
        ],
        examples: [
          {
            situation: 'Asking for WiFi password',
            korean: '와이파이 비밀번호가 뭐예요?',
            romanization: 'Waipai bimilbeonhoga mwoyeyo?',
            english: 'What\'s the WiFi password?'
          },
          {
            situation: 'Suggesting to use KakaoTalk',
            korean: '카톡으로 연락해요.',
            romanization: 'Katogeuro yeollakaeyo.',
            english: 'Let\'s contact each other through KakaoTalk.'
          }
        ]
      },
      {
        id: 'gaming-esports',
        title: 'Gaming & E-sports',
        content: 'Korea is the birthplace of modern e-sports, with games like StarCraft, League of Legends, and Overwatch having massive professional scenes. Gaming is not just entertainment but a legitimate career path and cultural phenomenon.',
        tips: [
          'Understand the respect for professional gamers',
          'Know about major gaming companies like Nexon, NC Soft',
          'Learn about the PC bang culture',
          'Appreciate mobile gaming popularity',
          'Understand streaming and broadcast culture'
        ],
        vocabulary: [
          { korean: '게임', romanization: 'geim', english: 'game' },
          { korean: '이스포츠', romanization: 'iseupochu', english: 'e-sports' },
          { korean: '프로게이머', romanization: 'peurogeim-eo', english: 'professional gamer' },
          { korean: '방송', romanization: 'bangsong', english: 'broadcast/streaming' },
          { korean: '모바일게임', romanization: 'mobail-geim', english: 'mobile game' }
        ]
      }
    ]
  },
  {
    id: 'social-media-trends',
    title: 'Social Media & Trends',
    titleKorean: '소셜미디어와 트렌드',
    icon: '📸',
    description: 'Korean social media culture, beauty trends, and viral phenomena',
    sections: [
      {
        id: 'beauty-fashion',
        title: 'Beauty & Fashion Culture',
        content: 'Korean beauty and fashion trends influence the world, from K-beauty skincare routines to street fashion in Hongdae and Gangnam. The concept of "self-care" and appearance is deeply ingrained in modern Korean culture.',
        tips: [
          'Understand the 10-step skincare routine',
          'Know about seasonal fashion trends',
          'Learn about popular Korean beauty brands',
          'Understand the importance of sun protection',
          'Appreciate the "glass skin" beauty ideal'
        ],
        vocabulary: [
          { korean: '케이뷰티', romanization: 'kei-byuti', english: 'K-beauty' },
          { korean: '스킨케어', romanization: 'seukin-keeo', english: 'skincare' },
          { korean: '메이크업', romanization: 'meik-eop', english: 'makeup' },
          { korean: '패션', romanization: 'paesyeon', english: 'fashion' },
          { korean: '유행', romanization: 'yuhaeng', english: 'trend/fashion' },
          { korean: '뷰티', romanization: 'byuti', english: 'beauty' }
        ],
        culturalNotes: [
          'Skincare is considered essential for both men and women',
          'Seasonal beauty trends change frequently',
          'Korean cosmetics are known for innovation',
          'Beauty standards emphasize natural, youthful appearance'
        ]
      },
      {
        id: 'viral-culture',
        title: 'Viral Culture & Memes',
        content: 'Korean internet culture creates viral trends that spread globally, from dance challenges to memes. Platforms like TikTok, Instagram, and YouTube are filled with Korean content creators and trends.',
        tips: [
          'Learn popular Korean memes and expressions',
          'Understand the influence of Korean content creators',
          'Know about viral dance challenges',
          'Appreciate Korean humor and wordplay',
          'Follow trending hashtags and challenges'
        ],
        vocabulary: [
          { korean: '바이럴', romanization: 'baireol', english: 'viral' },
          { korean: '밈', romanization: 'mim', english: 'meme' },
          { korean: '챌린지', romanization: 'chaellinji', english: 'challenge' },
          { korean: '인플루언서', romanization: 'inflluenseo', english: 'influencer' },
          { korean: '틱톡', romanization: 'tiktok', english: 'TikTok' }
        ]
      }
    ]
  },
  {
    id: 'contemporary-society',
    title: 'Contemporary Society',
    titleKorean: '현대 사회',
    icon: '🏙️',
    description: 'Modern Korean society, generational differences, and social issues',
    sections: [
      {
        id: 'generational-culture',
        title: 'Generational Differences',
        content: 'Modern Korea shows distinct generational differences, from the traditionalist older generation to the globally-minded MZ generation (millennials and Gen Z). Each generation has different values, communication styles, and cultural references.',
        tips: [
          'Understand the concept of "MZ세대" (MZ generation)',
          'Respect generational differences in values',
          'Know about changing work-life balance attitudes',
          'Understand evolving gender roles',
          'Appreciate diverse lifestyle choices'
        ],
        vocabulary: [
          { korean: '세대', romanization: 'sedae', english: 'generation' },
          { korean: '밀레니얼', romanization: 'millennial', english: 'millennial' },
          { korean: 'MZ세대', romanization: 'em-ji-sedae', english: 'MZ generation' },
          { korean: '젊은이', romanization: 'jeolmeuni', english: 'young people' },
          { korean: '기성세대', romanization: 'giseong-sedae', english: 'older generation' }
        ],
        culturalNotes: [
          'Younger generations are more individualistic',
          'Work-life balance is becoming more important',
          'Traditional hierarchies are slowly changing',
          'Global perspective is increasingly common'
        ]
      },
      {
        id: 'urban-lifestyle',
        title: 'Urban Lifestyle',
        content: 'Life in modern Korean cities like Seoul and Busan involves high-rise living, efficient public transportation, 24/7 convenience culture, and a fast-paced lifestyle that balances tradition with modernity.',
        tips: [
          'Navigate subway systems efficiently',
          'Understand the 24/7 convenience culture',
          'Know about delivery culture (배달)',
          'Appreciate the importance of efficiency',
          'Understand urban space constraints'
        ],
        vocabulary: [
          { korean: '도시', romanization: 'dosi', english: 'city' },
          { korean: '지하철', romanization: 'jihacheol', english: 'subway' },
          { korean: '배달', romanization: 'baedal', english: 'delivery' },
          { korean: '편의점', romanization: 'pyeonui-jeom', english: 'convenience store' },
          { korean: '고층빌딩', romanization: 'gocheung-bilding', english: 'high-rise building' }
        ]
      }
    ]
  }
];