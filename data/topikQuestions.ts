// The placement-test question bank.
//
// ── NEEDS A NATIVE SPEAKER'S PROOFREAD ──────────────────────────────────────
// Twenty of these (the ones whose ids end in a low number within each level)
// shipped earlier. The remaining forty were authored to fill the bank out and
// have NOT been checked by a Korean speaker. They follow standard TOPIK item
// formats and use well-established grammar points, but a placement test that
// decides whether someone may skip Hangul should not rest on unreviewed
// content. Treat a question as provisional until it has been read.
//
// It lives in a data file rather than inside the component precisely so that
// review is possible without reading JSX.
//
// ── WHY TEN PER LEVEL ───────────────────────────────────────────────────────
// The bank was 3–4 questions per level, which made the 60% threshold coarse:
// at three questions, 2/3 and 1/3 sit either side of the line, so a single
// lucky guess moved someone a whole level. Ten per level, sampled four at a
// time, gives a steadier estimate AND means a retake is a different test
// rather than a memory exercise.

// ── THE OPTION SHUFFLE IS LOAD-BEARING ──────────────────────────────────────
// Most questions here are written with the correct option first, which is
// convenient to author and read but means the raw bank is trivially gameable:
// 51 of the 60 answers sit at index 0. TopikAssessment shuffles each question's
// options on every attempt, which measures out at an even 25% per position, so
// nothing leaks to the learner. If that shuffle is ever removed, "always pick
// the first one" scores about 85% — re-balance the bank before dropping it.

export interface TopikQuestion {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  instruction: string;
  sentence?: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const QUESTIONS: TopikQuestion[] = [
  // ── Level 1 ── basic Hangul, survival vocabulary, subject/topic particles
  {
    id: 'l1-1', level: 1,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '제 이름( ) 김민준이에요.',
    options: ['은', '는', '이', '가'],
    answer: 0,
    explanation: '이름 ends in a consonant (ㅁ), so the topic marker 은 is used. 는 follows vowels.',
  },
  {
    id: 'l1-2', level: 1,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '저는 학생( ) 아니에요.',
    options: ['이', '가', '을', '에'],
    answer: 0,
    explanation: '학생이 아니에요 = "I am not a student." 이/가 is the subject particle; 학생 ends in a consonant so 이 is used.',
  },
  {
    id: 'l1-3', level: 1,
    instruction: '다음 중 날씨를 나타내는 단어가 아닌 것을 고르십시오.',
    options: ['맑다 (clear)', '춥다 (cold)', '배고프다 (hungry)', '덥다 (hot)'],
    answer: 2,
    explanation: '배고프다 means "hungry" — a physical state, not weather. 맑다, 춥다, 덥다 are all weather words.',
  },
  {
    id: 'l1-4', level: 1,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '저는 밥( ) 먹어요.',
    options: ['을', '를', '이', '가'],
    answer: 0,
    explanation: '밥 ends in a consonant (ㅂ), so the object particle 을 is used. 를 follows vowels.',
  },
  {
    id: 'l1-5', level: 1,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '도서관( ) 책을 읽어요.',
    options: ['에서', '에', '으로', '도'],
    answer: 0,
    explanation: '에서 marks where an action happens. 에 marks a destination or a point in time, not the place of an activity.',
  },
  {
    id: 'l1-6', level: 1,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '가방 안에 책이 ( ).',
    options: ['있어요', '아니에요', '만나요', '좋아요'],
    answer: 0,
    explanation: '있어요 = "there is / exists." 가방 안에 책이 있어요 = "There is a book in the bag."',
  },
  {
    id: 'l1-7', level: 1,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '저는 한국 사람( ).',
    options: ['이에요', '예요', '있어요', '해요'],
    answer: 0,
    explanation: '사람 ends in a consonant (ㅁ), so 이에요 is used. 예요 follows a vowel, as in 의사예요.',
  },
  {
    id: 'l1-8', level: 1,
    instruction: '다음 ( )에 알맞은 단위 명사를 고르십시오.',
    sentence: '사과 세 ( ) 주세요.',
    options: ['개', '명', '권', '장'],
    answer: 0,
    explanation: '개 counts objects. 명 counts people, 권 counts books, 장 counts flat things like paper.',
  },
  {
    id: 'l1-9', level: 1,
    instruction: '다음 중 가족을 나타내는 말이 아닌 것을 고르십시오.',
    options: ['어머니 (mother)', '아버지 (father)', '선생님 (teacher)', '동생 (younger sibling)'],
    answer: 2,
    explanation: '선생님 means "teacher" — a job, not a family member. The other three are family words.',
  },
  {
    id: 'l1-10', level: 1,
    instruction: '아침에 처음 만난 사람에게 하는 인사로 알맞은 것을 고르십시오.',
    options: ['안녕하세요', '안녕히 가세요', '잘 자요', '맛있게 드세요'],
    answer: 0,
    explanation: '안녕하세요 is the standard greeting on meeting. 안녕히 가세요 is said on parting, 잘 자요 at bedtime, 맛있게 드세요 before a meal.',
  },

  // ── Level 2 ── basic daily conversation, tense, common connectors
  {
    id: 'l2-1', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '내일 친구( ) 같이 영화를 볼 거예요.',
    options: ['에게', '와', '에서', '로'],
    answer: 1,
    explanation: '친구와 같이 = "together with a friend." -와/과 marks accompaniment; 친구 ends in a vowel so 와 is used.',
  },
  {
    id: 'l2-2', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '저는 매일 아침 커피( ) 마셔요.',
    options: ['이', '가', '을', '를'],
    answer: 3,
    explanation: '커피 ends in a vowel, so the object particle 를 is used. 을 follows consonants.',
  },
  {
    id: 'l2-3', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '오늘 날씨가 좋아서 공원에 ( ).',
    options: ['갔어요', '갈 거예요', '가고 싶어요', '가서'],
    answer: 0,
    explanation: '좋아서 provides the reason for a completed action. "Because the weather was nice, I went to the park." Past tense 갔어요 fits.',
  },
  {
    id: 'l2-4', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '어제 영화를 봤( ) 정말 재미있었어요.',
    options: ['으면', '는데', '어서', '지만'],
    answer: 1,
    explanation: 'V-는데 connects background context to a following statement. "I watched a movie yesterday, and it was really interesting."',
  },
  {
    id: 'l2-5', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '저는 한국에 ( ) 싶어요.',
    options: ['가고', '가서', '가면', '가는'],
    answer: 0,
    explanation: 'V-고 싶다 expresses a wish. The stem takes -고 before 싶다: 가고 싶어요 = "I want to go."',
  },
  {
    id: 'l2-6', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '9시( ) 5시까지 일해요.',
    options: ['부터', '에서', '까지', '으로'],
    answer: 0,
    explanation: '-부터 …-까지 = "from … to …" for time. 9시부터 5시까지 = "from nine to five."',
  },
  {
    id: 'l2-7', level: 2,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '토요일( ) 친구를 만나요.',
    options: ['에', '에서', '으로', '부터'],
    answer: 0,
    explanation: '에 marks a point in time. 토요일에 = "on Saturday." 에서 would mark a place instead.',
  },
  {
    id: 'l2-8', level: 2,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '수영을 배웠어요. 그래서 지금은 수영을 할 수 ( ).',
    options: ['있어요', '없어요', '아니에요', '싶어요'],
    answer: 0,
    explanation: 'V-(으)ㄹ 수 있다 = "can do." Having learned to swim, the speaker now can: 할 수 있어요.',
  },
  {
    id: 'l2-9', level: 2,
    instruction: '밑줄 친 부분의 의미로 알맞은 것을 고르십시오.',
    sentence: '"제 동생도 학생이에요."',
    options: ['too, as well', 'only', 'but', 'from'],
    answer: 0,
    explanation: '-도 means "too / also." 동생도 학생이에요 = "My younger sibling is a student too."',
  },
  {
    id: 'l2-10', level: 2,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '시간이 없어서 아침을 ( ) 먹었어요.',
    options: ['못', '안', '잘', '더'],
    answer: 0,
    explanation: '못 expresses inability caused by circumstances — no time, so breakfast could not be eaten. 안 would be a simple choice not to.',
  },

  // ── Level 3 ── intermediate grammar patterns, -려면, -기 위해서, -지 않다
  {
    id: 'l3-1', level: 3,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '시험에 합격하( ) 열심히 공부해야 해요.',
    options: ['-아서', '-려면', '-는데', '-더라도'],
    answer: 1,
    explanation: 'V-려면 = "in order to / if you want to." "In order to pass the exam, you have to study hard."',
  },
  {
    id: 'l3-2', level: 3,
    instruction: '밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.',
    sentence: '"그 문제는 생각보다 쉽지 않았어요."',
    options: ['어려웠어요', '간단했어요', '복잡하지 않았어요', '쉬웠어요'],
    answer: 0,
    explanation: '쉽지 않았어요 = "was not easy" ≈ 어려웠어요 (was difficult). The meaning is equivalent.',
  },
  {
    id: 'l3-3', level: 3,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '한국어를 잘 하( ) 위해서 매일 연습해요.',
    options: ['기', '는', '을', '면'],
    answer: 0,
    explanation: 'V-기 위해서 = "in order to do." 잘 하기 위해서 = "in order to do well." -기 nominalises the verb before 위해서.',
  },
  {
    id: 'l3-4', level: 3,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '저는 음악을 들으( ) 공부해요.',
    options: ['면서', '려고', '니까', '는데'],
    answer: 0,
    explanation: 'V-(으)면서 marks two actions by the same person at the same time. "I study while listening to music."',
  },
  {
    id: 'l3-5', level: 3,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '한국 음식을 먹어 ( ) 적이 있어요?',
    options: ['본', '한', '간', '든'],
    answer: 0,
    explanation: 'V-아/어 본 적이 있다 = "to have tried doing." 먹어 본 적이 있어요? = "Have you ever tried eating it?"',
  },
  {
    id: 'l3-6', level: 3,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '하늘이 흐려요. 비가 올 ( ) 같아요.',
    options: ['것', '수', '줄', '리'],
    answer: 0,
    explanation: 'V-(으)ㄹ 것 같다 expresses a guess. 올 것 같아요 = "it looks like it will rain."',
  },
  {
    id: 'l3-7', level: 3,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '할아버지께서 신문을 ( ).',
    options: ['읽으세요', '읽어요', '읽는다', '읽자'],
    answer: 0,
    explanation: '께서 is the honorific subject marker, so the verb takes the honorific -시-: 읽으세요. Plain 읽어요 does not match 께서.',
  },
  {
    id: 'l3-8', level: 3,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '비가 많이 왔( ) 경기가 취소되었어요.',
    options: ['기 때문에', '기 위해서', '는 대신에', '는 동안'],
    answer: 0,
    explanation: '-기 때문에 states a cause. "Because it rained heavily, the match was cancelled."',
  },
  {
    id: 'l3-9', level: 3,
    instruction: '밑줄 친 말과 바꿔 쓸 수 있는 것을 고르십시오.',
    sentence: '"그 일은 매우 중요합니다."',
    options: ['아주', '전혀', '별로', '거의'],
    answer: 0,
    explanation: '매우 and 아주 both mean "very." 전혀 and 별로 are used with negatives; 거의 means "almost."',
  },
  {
    id: 'l3-10', level: 3,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '한국에 온 ( ) 3년이 되었어요.',
    options: ['지', '것', '때', '후'],
    answer: 0,
    explanation: 'V-(으)ㄴ 지 …이/가 되다 measures elapsed time since an event. "It has been three years since I came to Korea."',
  },

  // ── Level 4 ── upper-intermediate: formal vocabulary, complex connectors
  {
    id: 'l4-1', level: 4,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '경제 성장과 환경 보호는 서로 ( ) 관계에 있다.',
    options: ['대립적인', '유사한', '종속적인', '동등한'],
    answer: 0,
    explanation: '대립적 = contradictory/opposing. Economic growth and environmental protection are often in tension. 유사한=similar, 종속적=subordinate, 동등한=equal.',
  },
  {
    id: 'l4-2', level: 4,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '아무리 바쁘( ) 건강은 챙겨야 한다.',
    options: ['-더라도', '-지만', '-아서', '-으면'],
    answer: 0,
    explanation: '아무리 -더라도 = "no matter how." "No matter how busy you are, you must take care of your health."',
  },
  {
    id: 'l4-3', level: 4,
    instruction: '다음 밑줄 친 단어와 바꿔 쓸 수 없는 것을 고르십시오.',
    sentence: '"현대인들은 스마트폰 없이는 생활하기 어렵다."',
    options: ['힘들다', '곤란하다', '불가능하다', '쉽지 않다'],
    answer: 2,
    explanation: '어렵다 = difficult (not impossible). 불가능하다 = impossible — too extreme, changes the meaning. 힘들다, 곤란하다, 쉽지 않다 all mean "difficult."',
  },
  {
    id: 'l4-4', level: 4,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '그는 여러 가지 일을 동시에 처리하는 ( )이/가 뛰어나다.',
    options: ['능력', '노력', '방식', '결과'],
    answer: 0,
    explanation: '능력이 뛰어나다 = to have outstanding ability. "He has outstanding ability to handle multiple things simultaneously."',
  },
  {
    id: 'l4-5', level: 4,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '갑자기 비가 오는 ( ) 행사가 취소되었다.',
    options: ['바람에', '대신에', '김에', '동안에'],
    answer: 0,
    explanation: '-는 바람에 gives an unexpected cause with an unwanted result. "The event was cancelled because it suddenly rained."',
  },
  {
    id: 'l4-6', level: 4,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '다른 방법이 없어서 포기할 수( ) 없었다.',
    options: ['밖에', '만', '조차', '부터'],
    answer: 0,
    explanation: 'V-(으)ㄹ 수밖에 없다 = "to have no choice but to." "There was no other way, so I had no choice but to give up."',
  },
  {
    id: 'l4-7', level: 4,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '그는 회의에서 자신의 의견을 분명히 ( ).',
    options: ['밝혔다', '감췄다', '미뤘다', '잊었다'],
    answer: 0,
    explanation: '의견을 밝히다 = to state an opinion clearly. 감추다 = hide, 미루다 = postpone, 잊다 = forget.',
  },
  {
    id: 'l4-8', level: 4,
    instruction: '다음 ( )에 알맞은 것을 고르십시오.',
    sentence: '바람이 세게 불어서 문이 저절로 ( ).',
    options: ['닫혔다', '닫았다', '닫는다', '닫자'],
    answer: 0,
    explanation: '닫히다 is the passive of 닫다. The door closed by itself, so the passive 닫혔다 is required — 닫았다 would need someone doing the closing.',
  },
  {
    id: 'l4-9', level: 4,
    instruction: '다음 ( )에 가장 알맞은 접속 표현을 고르십시오.',
    sentence: '그 계획은 비용이 많이 든다. ( ) 기대되는 효과는 확실하다.',
    options: ['하지만', '그래서', '따라서', '즉'],
    answer: 0,
    explanation: 'The two sentences contrast a drawback with a benefit, so 하지만 (however) fits. 그래서 and 따라서 mark consequence; 즉 introduces a restatement.',
  },
  {
    id: 'l4-10', level: 4,
    instruction: '밑줄 친 말과 반대되는 뜻을 가진 것을 고르십시오.',
    sentence: '"지난달에는 수출이 크게 증가했다."',
    options: ['감소했다', '확대했다', '상승했다', '유지했다'],
    answer: 0,
    explanation: '증가하다 = to increase; its opposite is 감소하다 = to decrease. 확대하다 and 상승하다 both point the same way as 증가하다.',
  },

  // ── Level 5 ── advanced: formal register, abstract vocabulary, reading
  {
    id: 'l5-1', level: 5,
    instruction: '다음 글의 ( )에 알맞은 것을 고르십시오.',
    sentence: '최근 연구에 따르면, 규칙적인 운동이 정신 건강에 ( ) 영향을 미친다는 사실이 밝혀졌다.',
    options: ['긍정적인', '부정적인', '미미한', '일시적인'],
    answer: 0,
    explanation: '규칙적인 운동이 정신 건강에 긍정적인 영향을 미친다 = regular exercise has a positive effect on mental health — the established finding.',
  },
  {
    id: 'l5-2', level: 5,
    instruction: '다음 ( )에 문맥상 가장 알맞은 것을 고르십시오.',
    sentence: '그 기업은 수익성보다 사회적 ( )을 우선시하는 경영 철학으로 유명하다.',
    options: ['책임', '이익', '경쟁', '성장'],
    answer: 0,
    explanation: '사회적 책임 (social responsibility / CSR) is the key concept — prioritising it over profitability is a well-known business philosophy.',
  },
  {
    id: 'l5-3', level: 5,
    instruction: '다음 문장에서 어색한 것을 고르십시오.',
    options: [
      '일찍 일어났기 때문에 피곤해요.',
      '열심히 공부해서 성적이 올랐어요.',
      '비가 오는데도 불구하고 나갔어요.',
      '그는 적극적으로 자신의 의견을 피력했다.',
    ],
    answer: 2,
    explanation: '비가 오는데도 불구하고 — "불구하고" requires a noun or nominalised form: 비가 옴에도 불구하고 or simply 비가 오는데도. ③ is unnatural.',
  },
  {
    id: 'l5-4', level: 5,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '전문가들( ) 이 정책은 장기적으로 효과가 있을 것이라고 한다.',
    options: ['에 따르면', '에 비하면', '에 반해', '에 대하여'],
    answer: 0,
    explanation: 'N에 따르면 = "according to N," used to attribute a claim to a source. 에 비하면 = compared with, 에 반해 = in contrast to.',
  },
  {
    id: 'l5-5', level: 5,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '어려운 상황( ) 그는 끝까지 포기하지 않았다.',
    options: ['임에도 불구하고', '이기 때문에', '인 만큼', '이라서'],
    answer: 0,
    explanation: 'N임에도 불구하고 = "in spite of being N." The difficulty and the refusal to give up stand in opposition, which the other three do not express.',
  },
  {
    id: 'l5-6', level: 5,
    instruction: '다음 ( )에 문맥상 가장 알맞은 것을 고르십시오.',
    sentence: '두 나라는 오랜 협상 끝에 마침내 ( )에 도달했다.',
    options: ['합의', '갈등', '경쟁', '분열'],
    answer: 0,
    explanation: '합의에 도달하다 = to reach an agreement, the natural outcome of 협상 (negotiation). 갈등=conflict, 경쟁=competition, 분열=division.',
  },
  {
    id: 'l5-7', level: 5,
    instruction: '다음 ( )에 가장 알맞은 것을 고르십시오.',
    sentence: '그의 주장은 설득력이 있지만 구체적인 ( )가 부족하다.',
    options: ['근거', '기회', '과정', '태도'],
    answer: 0,
    explanation: '근거 = grounds/evidence. An argument can be persuasive yet lack concrete evidence. The other three do not collocate with 부족하다 in this sense.',
  },
  {
    id: 'l5-8', level: 5,
    instruction: '다음 ( )에 가장 알맞은 접속 표현을 고르십시오.',
    sentence: '실험은 결국 실패로 끝났다. ( ) 연구진은 중요한 자료를 얻을 수 있었다.',
    options: ['그럼에도 불구하고', '그러므로', '따라서', '게다가'],
    answer: 0,
    explanation: 'A failure followed by a gain is a concession, so 그럼에도 불구하고 (nevertheless) fits. 그러므로 and 따라서 mark consequence; 게다가 adds a similar point.',
  },
  {
    id: 'l5-9', level: 5,
    instruction: '다음 중 문법적으로 어색한 문장을 고르십시오.',
    options: [
      '그는 개인 사정으로 회의에 참석하지 못했다.',
      '이 문제는 신중히 검토되어야 한다.',
      '나는 어제 친구를 만나겠다.',
      '연구 결과가 지난주에 학계에 발표되었다.',
    ],
    answer: 2,
    explanation: '어제 is past, but -겠다 expresses intention or the future. The tense of the adverb and the ending contradict each other; 만났다 would be correct.',
  },
  {
    id: 'l5-10', level: 5,
    instruction: '다음 글의 주제로 가장 알맞은 것을 고르십시오.',
    sentence: '"도시의 녹지 공간은 단순한 휴식처를 넘어 대기 오염을 줄이고 도시의 기온을 낮추는 역할을 한다. 따라서 도시 계획 단계에서부터 녹지 확보를 충분히 고려할 필요가 있다."',
    options: [
      '도시 녹지의 기능과 계획의 필요성',
      '대기 오염의 원인 분석',
      '도시 기온 상승의 역사',
      '휴식 공간 이용 방법',
    ],
    answer: 0,
    explanation: 'The passage lists what green space does (cleans air, lowers temperature) and concludes that planning must allow for it — function plus a call for planning.',
  },

  // ── Level 6 ── near-mastery: idioms, discourse, subtle grammar
  {
    id: 'l6-1', level: 6,
    instruction: '밑줄 친 표현의 의미로 가장 적절한 것을 고르십시오.',
    sentence: '"그는 말은 앞서지만 행동은 뒤처지는 편이다."',
    options: [
      '언행이 일치하지 않는다',
      '말을 못 하지만 행동은 잘한다',
      '말과 행동이 모두 빠르다',
      '행동보다 말이 느리다',
    ],
    answer: 0,
    explanation: '말은 앞서지만 행동은 뒤처진다 = words go ahead but actions fall behind → 언행불일치 (words and actions don\'t match). A Korean idiomatic expression.',
  },
  {
    id: 'l6-2', level: 6,
    instruction: '다음 글의 주제로 가장 알맞은 것을 고르십시오.',
    sentence: '"고령화 사회에서는 노인 인구의 증가로 인해 의료비 부담이 커지고 사회 복지 재원이 부족해지는 문제가 발생한다. 이를 해결하기 위해서는 세대 간 연대를 강화하고 지속 가능한 사회 보장 제도를 마련하는 것이 필요하다."',
    options: [
      '고령화 사회의 문제와 해결 방안',
      '노인 복지 정책의 역사',
      '의료비 절감 방법',
      '세대 간 갈등의 원인',
    ],
    answer: 0,
    explanation: 'The passage addresses both problems (medical costs, funding gaps) and solutions (generational solidarity, sustainable systems) in an aging society.',
  },
  {
    id: 'l6-3', level: 6,
    instruction: '다음 ( )에 들어갈 가장 알맞은 연결 표현을 고르십시오.',
    sentence: '개인의 자유는 존중받아야 한다. ( ), 그 자유가 타인에게 해를 끼쳐서는 안 된다.',
    options: ['그러나', '따라서', '그러므로', '왜냐하면'],
    answer: 0,
    explanation: '그러나 (however/but) introduces a contrast: freedom should be respected, BUT it shouldn\'t harm others. 따라서/그러므로 = therefore; 왜냐하면 = because.',
  },
  {
    id: 'l6-4', level: 6,
    instruction: '밑줄 친 관용 표현의 의미로 가장 알맞은 것을 고르십시오.',
    sentence: '"연말이라 요즘은 눈코 뜰 새 없이 바쁘다."',
    options: [
      '정신없이 매우 바쁘다',
      '전혀 바쁘지 않다',
      '눈이 아파서 힘들다',
      '잠을 자지 못한다',
    ],
    answer: 0,
    explanation: '눈코 뜰 새 없다 literally "no gap to open eyes or nose" — an idiom for being extremely busy.',
  },
  {
    id: 'l6-5', level: 6,
    instruction: '다음 사자성어의 뜻으로 알맞은 것을 고르십시오.',
    sentence: '일석이조 (一石二鳥)',
    options: [
      '한 가지 일로 두 가지 이익을 얻는다',
      '두 사람이 하나의 일을 나눈다',
      '작은 일이 큰 문제로 커진다',
      '처음과 끝이 서로 다르다',
    ],
    answer: 0,
    explanation: '일석이조 = "one stone, two birds" — gaining two benefits from a single action, the same idea as the English "kill two birds with one stone."',
  },
  {
    id: 'l6-6', level: 6,
    instruction: '밑줄 친 관용 표현의 의미로 가장 알맞은 것을 고르십시오.',
    sentence: '"이웃들이 발 벗고 나서서 수해 복구를 도왔다."',
    options: [
      '적극적으로 나서서',
      '마지못해 억지로',
      '조용히 지켜보며',
      '돈을 받고',
    ],
    answer: 0,
    explanation: '발 벗고 나서다 = to throw oneself into something willingly and actively, as if rolling up one\'s trousers to wade in.',
  },
  {
    id: 'l6-7', level: 6,
    instruction: '다음 ( )에 들어갈 가장 알맞은 연결 표현을 고르십시오.',
    sentence: '이번 연구는 표본의 수가 지나치게 적다. ( ) 그 결과를 전체에 일반화하기는 어렵다.',
    options: ['따라서', '그러나', '반면에', '예를 들어'],
    answer: 0,
    explanation: 'A small sample is the reason generalisation fails, so a consequence marker is needed: 따라서 (therefore). 그러나 and 반면에 mark contrast.',
  },
  {
    id: 'l6-8', level: 6,
    instruction: '다음 문장과 의미가 가장 가까운 것을 고르십시오.',
    sentence: '"아무리 설명해도 그는 이해하지 못했다."',
    options: [
      '여러 번 설명했지만 그는 이해하지 못했다',
      '설명을 하지 않아서 그는 이해하지 못했다',
      '그가 이해한 뒤에 다시 설명했다',
      '설명이 어려워서 아무도 듣지 않았다',
    ],
    answer: 0,
    explanation: '아무리 -아/어도 = "no matter how much." Repeated explanation still failed, which the first option restates plainly.',
  },
  {
    id: 'l6-9', level: 6,
    instruction: '밑줄 친 관용 표현의 의미로 가장 알맞은 것을 고르십시오.',
    sentence: '"어머니는 손이 커서 늘 음식을 넉넉하게 준비하신다."',
    options: [
      '씀씀이가 후하다',
      '손의 크기가 크다',
      '요리를 잘하지 못한다',
      '욕심이 지나치게 많다',
    ],
    answer: 0,
    explanation: '손이 크다 is an idiom for being generous or open-handed, especially about food and hospitality — not a comment on anatomy.',
  },
  {
    id: 'l6-10', level: 6,
    instruction: '다음 글의 필자의 태도로 가장 알맞은 것을 고르십시오.',
    sentence: '"기술의 발전이 삶을 편리하게 만든 것은 분명하다. 그러나 그 편리함이 인간관계의 깊이까지 대신해 줄 수는 없다. 우리는 무엇을 얻었는지와 함께 무엇을 잃었는지도 물어야 한다."',
    options: [
      '기술의 이점을 인정하면서도 그 한계를 경계한다',
      '기술의 발전을 전면적으로 반대한다',
      '기술이 인간관계를 완전히 대체한다고 본다',
      '기술의 편리함만을 강조한다',
    ],
    answer: 0,
    explanation: 'The writer grants the benefit ("분명하다") and then warns about what it cannot replace — acknowledgement paired with caution, not outright opposition.',
  },
];

/** Ten per level, so a sample can be drawn evenly. */
export const QUESTIONS_PER_LEVEL = 10;

/**
 * Draw one attempt: `perLevel` questions chosen at random from each level up to
 * `maxLevel`. Sampling from a larger pool is what makes a retake a fresh test
 * rather than a memory exercise — shuffling the options alone only defeats
 * "it was the second one".
 */
export function sampleAttempt(perLevel: number, maxLevel: number): TopikQuestion[] {
  const out: TopikQuestion[] = [];
  for (let level = 1; level <= maxLevel; level++) {
    const pool = QUESTIONS.filter(q => q.level === level);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    out.push(...pool.slice(0, perLevel));
  }
  return out;
}
