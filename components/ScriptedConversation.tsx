import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { accentFor } from '../utils/moduleAccent';
import { Volume2 } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

import { useUpgradeModal } from '../contexts/UpgradeModalContext';

const ACC = accentFor('conversation');

const FREE_SCENARIO_IDS = ['introductions', 'cafe'];

interface DialogueOption {
  korean: string;
  romanization: string;
  english: string;
  isCorrect: boolean;
}

interface DialogueLine {
  speaker: 'native' | 'you';
  role?: string;
  korean: string;
  romanization: string;
  english: string;
  options?: DialogueOption[];
}

interface Scenario {
  id: string;
  emoji: string;
  title: string;
  difficulty: 'beginner' | 'intermediate';
  description: string;
  lines: DialogueLine[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'introductions',
    emoji: '👋',
    title: 'First Introductions',
    difficulty: 'beginner',
    description: 'Meet someone for the first time and introduce yourself.',
    lines: [
      { speaker: 'native', role: 'Jisu', korean: '안녕하세요! 저는 지수예요. 이름이 뭐예요?', romanization: 'annyeonghaseyo! jeoneun jisueyeo. ireumi mwoyeyo?', english: "Hello! I'm Jisu. What's your name?" },
      {
        speaker: 'you', korean: '저는 민준이에요. 반갑습니다!', romanization: 'jeoneun minjuniyeyo. bangapseumnida!', english: "I'm Minjun. Nice to meet you!",
        options: [
          { korean: '저는 민준이에요. 반갑습니다!', romanization: 'jeoneun minjuniyeyo. bangapseumnida!', english: "I'm Minjun. Nice to meet you!", isCorrect: true },
          { korean: '안녕히 가세요!', romanization: 'annyeonghi gaseyo!', english: 'Goodbye!', isCorrect: false },
          { korean: '잘 모르겠어요.', romanization: 'jal moreugesseoyo.', english: "I'm not sure.", isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Jisu', korean: '반가워요! 어느 나라 사람이에요?', romanization: 'bangawoyo! eoneu nara saramiyeyo?', english: 'Nice to meet you! Where are you from?' },
      {
        speaker: 'you', korean: '저는 미국 사람이에요.', romanization: 'jeoneun miguk saramiyeyo.', english: "I'm American.",
        options: [
          { korean: '저는 배고파요.', romanization: 'jeoneun baegopayo.', english: "I'm hungry.", isCorrect: false },
          { korean: '저는 미국 사람이에요.', romanization: 'jeoneun miguk saramiyeyo.', english: "I'm American.", isCorrect: true },
          { korean: '식당이 어디예요?', romanization: 'sikdangi eodiyeyo?', english: 'Where is the restaurant?', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Jisu', korean: '오, 정말요? 한국어를 배운 지 얼마나 됐어요?', romanization: 'o, jeongmallyo? hangugeoreul baeun ji eolmana dwaesseoyo?', english: 'Oh, really? How long have you been learning Korean?' },
      {
        speaker: 'you', korean: '6개월 됐어요. 아직 많이 배워야 해요!', romanization: 'yukgaewol dwaesseoyo. ajik manhi baewoya haeyo!', english: "It's been 6 months. I still have a lot to learn!",
        options: [
          { korean: '거기 어떻게 가요?', romanization: 'geogi eotteoke gayo?', english: 'How do I get there?', isCorrect: false },
          { korean: '저는 피곤해요.', romanization: 'jeoneun pigonhaeyo.', english: "I'm tired.", isCorrect: false },
          { korean: '6개월 됐어요. 아직 많이 배워야 해요!', romanization: 'yukgaewol dwaesseoyo. ajik manhi baewoya haeyo!', english: "It's been 6 months. I still have a lot to learn!", isCorrect: true },
        ],
      },
      { speaker: 'native', role: 'Jisu', korean: '한국어 잘 하시네요! 나중에 또 이야기해요.', romanization: 'hangugeo jal hasinneyo! najunge tto iyagihaeyo.', english: "Your Korean is great! Let's talk again later." },
      {
        speaker: 'you', korean: '감사합니다! 저도 좋아요.', romanization: 'gamsahamnida! jeodo joayo.', english: "Thank you! I'd like that too.",
        options: [
          { korean: '감사합니다! 저도 좋아요.', romanization: 'gamsahamnida! jeodo joayo.', english: "Thank you! I'd like that too.", isCorrect: true },
          { korean: '저는 학생이에요.', romanization: 'jeoneun haksaengiyeyo.', english: "I'm a student.", isCorrect: false },
          { korean: '아니요, 괜찮아요.', romanization: 'aniyo, gwaenchanayo.', english: "No, it's okay.", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'restaurant',
    emoji: '🍽️',
    title: 'At a Restaurant',
    difficulty: 'beginner',
    description: 'Order food, ask for water, and pay the bill.',
    lines: [
      { speaker: 'native', role: 'Waiter', korean: '어서 오세요! 몇 분이세요?', romanization: 'eoseo oseyo! myeot buniseyo?', english: 'Welcome! How many people?' },
      {
        speaker: 'you', korean: '두 명이에요.', romanization: 'du myeongiyeyo.', english: 'Two people.',
        options: [
          { korean: '저는 배불러요.', romanization: 'jeoneun baebulleyo.', english: "I'm full.", isCorrect: false },
          { korean: '두 명이에요.', romanization: 'du myeongiyeyo.', english: 'Two people.', isCorrect: true },
          { korean: '안녕히 계세요.', romanization: 'annyeonghi gyeseyo.', english: 'Goodbye.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Waiter', korean: '이쪽으로 오세요. 주문하시겠어요?', romanization: 'ijjogeuro oseyo. jumunhasigesseoyo?', english: 'Please come this way. Ready to order?' },
      {
        speaker: 'you', korean: '비빔밥 하나하고 된장찌개 하나 주세요.', romanization: 'bibimbap hanahago doenjangjiggae hana juseyo.', english: 'One bibimbap and one doenjang jjigae, please.',
        options: [
          { korean: '비빔밥 하나하고 된장찌개 하나 주세요.', romanization: 'bibimbap hanahago doenjangjiggae hana juseyo.', english: 'One bibimbap and one doenjang jjigae, please.', isCorrect: true },
          { korean: '화장실이 어디예요?', romanization: 'hwajangsiri eodiyeyo?', english: 'Where is the bathroom?', isCorrect: false },
          { korean: '계산해 주세요.', romanization: 'gyesanhae juseyo.', english: 'Bill, please.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Waiter', korean: '네, 잠시만 기다려 주세요. 맛있게 드세요!', romanization: 'ne, jamsiman gidaryeo juseyo. masitge deuseyo!', english: 'Yes, one moment please. Enjoy your meal!' },
      {
        speaker: 'you', korean: '감사합니다!', romanization: 'gamsahamnida!', english: 'Thank you!',
        options: [
          { korean: '다시 해주세요.', romanization: 'dasi haejuseyo.', english: 'Please do it again.', isCorrect: false },
          { korean: '감사합니다!', romanization: 'gamsahamnida!', english: 'Thank you!', isCorrect: true },
          { korean: '잘 모르겠어요.', romanization: 'jal moreugesseoyo.', english: "I don't know.", isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Waiter', korean: '더 필요하신 거 있으세요?', romanization: 'deo piryohasin geo isseuseyo?', english: 'Is there anything else you need?' },
      {
        speaker: 'you', korean: '물 좀 더 주세요.', romanization: 'mul jom deo juseyo.', english: 'More water, please.',
        options: [
          { korean: '저는 학생이에요.', romanization: 'jeoneun haksaengiyeyo.', english: "I'm a student.", isCorrect: false },
          { korean: '지하철역이 어디예요?', romanization: 'jihacheolyeogi eodiyeyo?', english: 'Where is the subway?', isCorrect: false },
          { korean: '물 좀 더 주세요.', romanization: 'mul jom deo juseyo.', english: 'More water, please.', isCorrect: true },
        ],
      },
      { speaker: 'native', role: 'Waiter', korean: '네, 바로 가져다 드릴게요. 계산은 어떻게 하시겠어요?', romanization: 'ne, baro gajyeoda deurilgeyo. gyesaneun eotteoke hasigesseoyo?', english: "I'll bring it right away. How will you be paying?" },
      {
        speaker: 'you', korean: '카드로 할게요.', romanization: 'kadeuro halgeyo.', english: "I'll pay by card.",
        options: [
          { korean: '카드로 할게요.', romanization: 'kadeuro halgeyo.', english: "I'll pay by card.", isCorrect: true },
          { korean: '집에 가고 싶어요.', romanization: 'jibe gago sipeoyo.', english: 'I want to go home.', isCorrect: false },
          { korean: '저는 피곤해요.', romanization: 'jeoneun pigonhaeyo.', english: "I'm tired.", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'shopping',
    emoji: '🛒',
    title: 'Shopping',
    difficulty: 'beginner',
    description: 'Browse clothes, ask about sizes, and negotiate prices.',
    lines: [
      { speaker: 'native', role: 'Shopkeeper', korean: '어서 오세요! 뭘 찾고 계세요?', romanization: 'eoseo oseyo! mwol chatgo gyeseyo?', english: 'Welcome! What are you looking for?' },
      {
        speaker: 'you', korean: '이 티셔츠 있어요?', romanization: 'i tisyeocheu isseoyo?', english: 'Do you have this T-shirt?',
        options: [
          { korean: '배고파요.', romanization: 'baegopayo.', english: "I'm hungry.", isCorrect: false },
          { korean: '이 티셔츠 있어요?', romanization: 'i tisyeocheu isseoyo?', english: 'Do you have this T-shirt?', isCorrect: true },
          { korean: '안녕히 계세요.', romanization: 'annyeonghi gyeseyo.', english: 'Goodbye.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Shopkeeper', korean: '네, 있어요! 어떤 사이즈 드릴까요?', romanization: 'ne, isseoyo! eotteon saijeu deurilkkayo?', english: 'Yes, we do! What size would you like?' },
      {
        speaker: 'you', korean: '중간 사이즈로 주세요.', romanization: 'junggan saijeuro juseyo.', english: 'Medium size, please.',
        options: [
          { korean: '중간 사이즈로 주세요.', romanization: 'junggan saijeuro juseyo.', english: 'Medium size, please.', isCorrect: true },
          { korean: '화장실이요.', romanization: 'hwajangsiriyo.', english: 'The bathroom.', isCorrect: false },
          { korean: '감사합니다.', romanization: 'gamsahamnida.', english: 'Thank you.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Shopkeeper', korean: '여기 있습니다. 입어 보시겠어요?', romanization: 'yeogi itseumnida. ibeo bosigesseoyo?', english: 'Here it is. Would you like to try it on?' },
      {
        speaker: 'you', korean: '네, 입어봐도 될까요?', romanization: 'ne, ibeobwado doelkkayo?', english: 'Yes, may I try it on?',
        options: [
          { korean: '저는 학생이에요.', romanization: 'jeoneun haksaengiyeyo.', english: "I'm a student.", isCorrect: false },
          { korean: '네, 입어봐도 될까요?', romanization: 'ne, ibeobwado doelkkayo?', english: 'Yes, may I try it on?', isCorrect: true },
          { korean: '아니요, 물이요.', romanization: 'aniyo, muriyo.', english: 'No, water please.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Shopkeeper', korean: '피팅룸은 저쪽이에요. 어떠세요?', romanization: 'piting rum-eun jeojjogiyeyo. eotteoseyo?', english: 'The fitting room is over there. How is it?' },
      {
        speaker: 'you', korean: '잘 맞아요. 얼마예요?', romanization: 'jal majayo. eolmayeyo?', english: 'It fits well. How much is it?',
        options: [
          { korean: '지하철이요.', romanization: 'jihacheoriyo.', english: 'The subway.', isCorrect: false },
          { korean: '잘 맞아요. 얼마예요?', romanization: 'jal majayo. eolmayeyo?', english: 'It fits well. How much is it?', isCorrect: true },
          { korean: '배고파요.', romanization: 'baegopayo.', english: "I'm hungry.", isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Shopkeeper', korean: '35,000원이에요.', romanization: 'samman ocheonwoniyeyo.', english: "It's 35,000 won." },
      {
        speaker: 'you', korean: '조금 깎아 주실 수 있어요?', romanization: 'jogeum kkakka jusil su isseoyo?', english: 'Can you give me a small discount?',
        options: [
          { korean: '피곤해요.', romanization: 'pigonhaeyo.', english: "I'm tired.", isCorrect: false },
          { korean: '학교가 어디예요?', romanization: 'hakgyoga eodiyeyo?', english: 'Where is the school?', isCorrect: false },
          { korean: '조금 깎아 주실 수 있어요?', romanization: 'jogeum kkakka jusil su isseoyo?', english: 'Can you give me a small discount?', isCorrect: true },
        ],
      },
    ],
  },
  {
    id: 'directions',
    emoji: '🗺️',
    title: 'Getting Directions',
    difficulty: 'intermediate',
    description: 'Ask a passerby for directions to the subway station.',
    lines: [
      { speaker: 'native', role: 'Passerby', korean: '안녕하세요! 뭔가 찾고 계세요?', romanization: 'annyeonghaseyo! mwonga chatgo gyeseyo?', english: 'Hello! Are you looking for something?' },
      {
        speaker: 'you', korean: '네, 실례지만 지하철역이 어디예요?', romanization: 'ne, sillyejiman jihacheolyeogi eodiyeyo?', english: 'Yes, excuse me — where is the subway station?',
        options: [
          { korean: '물 주세요.', romanization: 'mul juseyo.', english: 'Give me water, please.', isCorrect: false },
          { korean: '네, 실례지만 지하철역이 어디예요?', romanization: 'ne, sillyejiman jihacheolyeogi eodiyeyo?', english: 'Yes, excuse me — where is the subway station?', isCorrect: true },
          { korean: '안녕히 가세요.', romanization: 'annyeonghi gaseyo.', english: 'Goodbye.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Passerby', korean: '직진해서 두 블록 가다가 오른쪽으로 도세요. 5분 정도 걸려요.', romanization: 'jikjinhaeseo du beullok gadaga oreunjjogeuro doseyo. obun jeongdo geollyeoyo.', english: 'Go straight for two blocks and turn right. About 5 minutes.' },
      {
        speaker: 'you', korean: '감사합니다. 걸어서 얼마나 걸려요?', romanization: 'gamsahamnida. georeoseo eolmana geollyeoyo?', english: 'Thank you. How long does it take on foot?',
        options: [
          { korean: '저는 배불러요.', romanization: 'jeoneun baebulleyo.', english: "I'm full.", isCorrect: false },
          { korean: '감사합니다. 걸어서 얼마나 걸려요?', romanization: 'gamsahamnida. georeoseo eolmana geollyeoyo?', english: 'Thank you. How long does it take on foot?', isCorrect: true },
          { korean: '한국어를 몰라요.', romanization: 'hangugeoreul mollayo.', english: "I don't know Korean.", isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Passerby', korean: '한 5분 정도요. 신호등 지나서 바로 있어요.', romanization: 'han obun jeongdoyo. sinhodeung jinaseo baro isseoyo.', english: 'About 5 minutes. It\'s right past the traffic light.' },
      {
        speaker: 'you', korean: '알겠어요, 정말 감사합니다!', romanization: 'algesseoyo, jeongmal gamsahamnida!', english: 'Got it, thank you so much!',
        options: [
          { korean: '알겠어요, 정말 감사합니다!', romanization: 'algesseoyo, jeongmal gamsahamnida!', english: 'Got it, thank you so much!', isCorrect: true },
          { korean: '저는 배고파요.', romanization: 'jeoneun baegopayo.', english: "I'm hungry.", isCorrect: false },
          { korean: '잘 모르겠어요.', romanization: 'jal moreugesseoyo.', english: "I'm not sure.", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'cafe',
    emoji: '☕',
    title: 'At a Café',
    difficulty: 'beginner',
    description: 'Order coffee and give your name at a Korean café.',
    lines: [
      { speaker: 'native', role: 'Barista', korean: '안녕하세요! 주문하시겠어요?', romanization: 'annyeonghaseyo! jumunhasigesseoyo?', english: 'Hello! Are you ready to order?' },
      {
        speaker: 'you', korean: '아이스 아메리카노 한 잔 주세요.', romanization: 'aiseu amerikano han jan juseyo.', english: 'One iced americano, please.',
        options: [
          { korean: '화장실이요.', romanization: 'hwajangsiriyo.', english: 'The bathroom.', isCorrect: false },
          { korean: '아이스 아메리카노 한 잔 주세요.', romanization: 'aiseu amerikano han jan juseyo.', english: 'One iced americano, please.', isCorrect: true },
          { korean: '안녕히 계세요.', romanization: 'annyeonghi gyeseyo.', english: 'Goodbye.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Barista', korean: '사이즈는 어떻게 드릴까요?', romanization: 'saijeun-eun eotteoke deurilkkayo?', english: 'What size would you like?' },
      {
        speaker: 'you', korean: '큰 사이즈로 주세요.', romanization: 'keun saijeuro juseyo.', english: 'Large size, please.',
        options: [
          { korean: '큰 사이즈로 주세요.', romanization: 'keun saijeuro juseyo.', english: 'Large size, please.', isCorrect: true },
          { korean: '지하철이요.', romanization: 'jihacheoriyo.', english: 'The subway.', isCorrect: false },
          { korean: '저는 배고파요.', romanization: 'jeoneun baegopayo.', english: "I'm hungry.", isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Barista', korean: '이름이 어떻게 되세요?', romanization: 'ireumi eotteoke doeseyo?', english: 'May I have your name?' },
      {
        speaker: 'you', korean: '민준이에요.', romanization: 'minjuniyeyo.', english: "It's Minjun.",
        options: [
          { korean: '잘 몰라요.', romanization: 'jal mollayo.', english: "I don't know well.", isCorrect: false },
          { korean: '괜찮아요.', romanization: 'gwaenchanayo.', english: "It's okay.", isCorrect: false },
          { korean: '민준이에요.', romanization: 'minjuniyeyo.', english: "It's Minjun.", isCorrect: true },
        ],
      },
      { speaker: 'native', role: 'Barista', korean: '네, 총 5,500원이에요.', romanization: 'ne, chong ocheon obaegwoniyeyo.', english: 'Yes, that will be 5,500 won in total.' },
      {
        speaker: 'you', korean: '여기 있어요. 감사합니다!', romanization: 'yeogi isseoyo. gamsahamnida!', english: 'Here you go. Thank you!',
        options: [
          { korean: '안녕히 가세요.', romanization: 'annyeonghi gaseyo.', english: 'Goodbye.', isCorrect: false },
          { korean: '여기 있어요. 감사합니다!', romanization: 'yeogi isseoyo. gamsahamnida!', english: 'Here you go. Thank you!', isCorrect: true },
          { korean: '저는 피곤해요.', romanization: 'jeoneun pigonhaeyo.', english: "I'm tired.", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'hotel',
    emoji: '🏨',
    title: 'Hotel Check-in',
    difficulty: 'intermediate',
    description: 'Check into a hotel and ask for the WiFi password.',
    lines: [
      { speaker: 'native', role: 'Receptionist', korean: '안녕하세요! 예약하셨어요?', romanization: 'annyeonghaseyo! yeyakhasaesseoyo?', english: 'Hello! Do you have a reservation?' },
      {
        speaker: 'you', korean: '네, 김민준으로 예약했어요.', romanization: 'ne, gimminjuneuro yeyakhaesseoyo.', english: 'Yes, I have a reservation under Kim Minjun.',
        options: [
          { korean: '네, 김민준으로 예약했어요.', romanization: 'ne, gimminjuneuro yeyakhaesseoyo.', english: 'Yes, I have a reservation under Kim Minjun.', isCorrect: true },
          { korean: '배고파요.', romanization: 'baegopayo.', english: "I'm hungry.", isCorrect: false },
          { korean: '안녕히 계세요.', romanization: 'annyeonghi gyeseyo.', english: 'Goodbye.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Receptionist', korean: '확인해 볼게요... 네, 찾았어요. 체크인 하시겠어요?', romanization: 'hwaginhae bolgeyo... ne, chajasseoyo. chekeu-in hasigesseoyo?', english: "Let me check... Yes, I found it. Would you like to check in?" },
      {
        speaker: 'you', korean: '네, 체크인 부탁드립니다.', romanization: 'ne, chekeu-in butakdeurimnida.', english: 'Yes, please check me in.',
        options: [
          { korean: '아니요, 괜찮아요.', romanization: 'aniyo, gwaenchanayo.', english: "No, it's okay.", isCorrect: false },
          { korean: '네, 체크인 부탁드립니다.', romanization: 'ne, chekeu-in butakdeurimnida.', english: 'Yes, please check me in.', isCorrect: true },
          { korean: '저는 학생이에요.', romanization: 'jeoneun haksaengiyeyo.', english: "I'm a student.", isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Receptionist', korean: '여기 카드 키 드릴게요. 방은 3층 305호입니다. 조식은 7시부터 10시까지예요.', romanization: 'yeogi kadeu ki deurilgeyo. bang-eun 3cheung 305ho-imnida. josik-eun ilgopsibuteo yeolsikkajiyeyo.', english: "Here is your key card. Room 305, 3rd floor. Breakfast is from 7 to 10 AM." },
      {
        speaker: 'you', korean: '감사합니다. 와이파이 비밀번호가 뭐예요?', romanization: 'gamsahamnida. waipai bimilbeonhoga mwoyeyo?', english: 'Thank you. What is the WiFi password?',
        options: [
          { korean: '저는 피곤해요.', romanization: 'jeoneun pigonhaeyo.', english: "I'm tired.", isCorrect: false },
          { korean: '감사합니다. 와이파이 비밀번호가 뭐예요?', romanization: 'gamsahamnida. waipai bimilbeonhoga mwoyeyo?', english: 'Thank you. What is the WiFi password?', isCorrect: true },
          { korean: '물이요.', romanization: 'muriyo.', english: 'Water, please.', isCorrect: false },
        ],
      },
      { speaker: 'native', role: 'Receptionist', korean: '비밀번호는 hotel1234예요. 더 필요하신 거 있으세요?', romanization: 'bimilbeonhoneun hotel1234yeyo. deo piryohasin geo isseuseyo?', english: 'The password is hotel1234. Is there anything else you need?' },
      {
        speaker: 'you', korean: '아니요, 충분해요. 감사합니다!', romanization: 'aniyo, chungbunhaeyo. gamsahamnida!', english: "No, that's enough. Thank you!",
        options: [
          { korean: '네, 배고파요.', romanization: 'ne, baegopayo.', english: "Yes, I'm hungry.", isCorrect: false },
          { korean: '지하철역이요.', romanization: 'jihacheolyeogiyo.', english: 'The subway station.', isCorrect: false },
          { korean: '아니요, 충분해요. 감사합니다!', romanization: 'aniyo, chungbunhaeyo. gamsahamnida!', english: "No, that's enough. Thank you!", isCorrect: true },
        ],
      },
    ],
  },
];

const ScriptedConversation: React.FC = () => {
  const { subscriptionTier } = useFeatureAccess();
  const isFree = subscriptionTier === 'free';
  const { openUpgradeModal } = useUpgradeModal();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showEn, setShowEn] = useState(true);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<{ line: DialogueLine; chosenOpt?: DialogueOption }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lineIdx, chosen]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const start = (s: Scenario) => {
    setScenario(s); setLineIdx(0); setChosen(null);
    setScore({ correct: 0, total: 0 }); setDone(false); setHistory([]);
  };

  const getDisplayOpts = (line: DialogueLine, idx: number): DialogueOption[] => {
    if (!line.options) return [];
    const arr = [...line.options];
    const offset = idx % arr.length;
    return [...arr.slice(offset), ...arr.slice(0, offset)];
  };

  const pick = (displayIdx: number) => {
    if (chosen !== null || !scenario) return;
    const line = scenario.lines[lineIdx];
    const displayOpts = getDisplayOpts(line, lineIdx);
    const isCorrect = displayOpts[displayIdx].isCorrect;
    setChosen(displayIdx);
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    speak(displayOpts[displayIdx].korean);
  };

  const advance = () => {
    if (!scenario) return;
    const line = scenario.lines[lineIdx];
    let chosenOpt: DialogueOption | undefined;
    if (line.options && chosen !== null) {
      chosenOpt = getDisplayOpts(line, lineIdx)[chosen];
    }
    setHistory(h => [...h, { line, chosenOpt }]);
    setChosen(null);
    if (lineIdx + 1 >= scenario.lines.length) setDone(true);
    else setLineIdx(i => i + 1);
  };

  // ── Scenario selection ──────────────────────────────────────────────────────
  if (!scenario) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
            Practice scenarios
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-[#3E4A5A] dark:text-gray-400">
            Scripted conversations with a right answer — pick a situation and choose how you would reply.
            No daily limit on these.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s2, i) => {
            const isLocked = isFree && !FREE_SCENARIO_IDS.includes(s2.id);
            if (isLocked) {
              return (
                <button
                  key={s2.id}
                  onClick={openUpgradeModal}
                  className="kl-premium kl-cascade flex flex-col items-start rounded-[18px] p-5 text-left"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span
                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    <Lock className="h-4 w-4" />
                  </span>
                  <span className="text-[16px] font-semibold text-[#16202F] dark:text-white">{s2.title}</span>
                  <span className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-400">
                    {s2.difficulty} · Premium
                  </span>
                  <span className="mt-3 text-[13px] font-semibold text-[#C13F22] dark:text-[#F07A55]">
                    Unlock · $4/mo →
                  </span>
                </button>
              );
            }
            return (
              <div
                key={s2.id}
                className="kl-card kl-cascade flex flex-col p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-[20px]"
                    style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }}
                  >
                    {s2.emoji}
                  </span>
                  <span className="text-[12px] font-medium text-[#4A5566] dark:text-gray-500">{s2.difficulty}</span>
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-[#16202F] dark:text-white">{s2.title}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-relaxed text-[#4A5566] dark:text-gray-400">{s2.description}</p>
                <button
                  onClick={() => start(s2)}
                  className="mt-4 flex h-11 items-center justify-center rounded-[10px] text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
                  style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}3D` }}
                >
                  Start practice →
                </button>
              </div>
            );
          })}
        </div>

        {isFree && (
          <p className="mt-4 text-[13px] text-[#4A5566] dark:text-gray-500">
            {FREE_SCENARIO_IDS.length} of {SCENARIOS.length} scenarios unlocked ·{' '}
            <button onClick={openUpgradeModal} className="font-semibold text-[#C13F22] hover:underline dark:text-[#F07A55]">
              Unlock all {SCENARIOS.length} →
            </button>
          </p>
        )}
      </div>
    );
  }

  // ── Completion ──────────────────────────────────────────────────────────────
  if (done) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const resultMsg = pct >= 80 ? 'Excellent work' : pct >= 60 ? 'Good job' : 'Keep practising';
    return (
      <div className="mx-auto max-w-3xl">
        <div className="kl-card mb-4 flex flex-wrap items-center gap-5 p-6">
          <div
            className="flex h-[70px] w-[70px] flex-none flex-col items-center justify-center rounded-[14px]"
            style={{ background: `${ACC.light}1F`, border: `1px solid ${ACC.light}4D` }}
          >
            <span className="text-[24px] font-bold leading-none" style={{ color: ACC.light }}>{score.correct}</span>
            <span className="mt-1 text-[11.5px] font-medium" style={{ color: ACC.light }}>of {score.total}</span>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="mb-1 text-[12.5px] font-semibold" style={{ color: ACC.light }}>SCENARIO COMPLETE</div>
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] dark:text-white">
              {resultMsg}
            </h2>
            <p className="mt-1.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-400">
              {scenario.title} · {pct}% right first time
            </p>
          </div>
        </div>

        <div className="kl-card mb-4 p-5 sm:p-6">
          <div className="mb-4 text-[14px] font-semibold text-[#16202F] dark:text-white">The whole conversation</div>
          <div className="flex flex-col gap-3">
            {history.map(({ line, chosenOpt }, i) => (
              <div key={i} className={`flex flex-col ${line.speaker === 'you' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 ${
                    line.speaker === 'native'
                      ? 'kl-well rounded-[14px_14px_14px_4px]'
                      : 'rounded-[14px_14px_4px_14px] text-white'
                  }`}
                  style={line.speaker === 'you' ? { background: ACC.light } : undefined}
                >
                  {line.speaker === 'native' && line.role && (
                    <p className="mb-1 text-[11.5px] font-semibold text-[#4A5566] dark:text-gray-500">{line.role}</p>
                  )}
                  <p className={`font-korean text-[16px] font-semibold ${
                    line.speaker === 'native' ? 'text-[#16202F] dark:text-white' : ''
                  }`}>
                    {line.speaker === 'you' ? (chosenOpt?.korean ?? line.korean) : line.korean}
                  </p>
                  <p className={`mt-1 text-[13px] ${
                    line.speaker === 'native' ? 'text-[#4A5566] dark:text-gray-400' : 'text-white/80'
                  }`}>
                    {line.speaker === 'you' ? (chosenOpt?.english ?? line.english) : line.english}
                  </p>
                  {line.speaker === 'you' && chosenOpt && !chosenOpt.isCorrect && (
                    <p className="mt-2 rounded-lg bg-white/20 px-2.5 py-1.5 text-[12.5px] font-medium">
                      The natural reply: <span className="font-korean font-semibold">{line.korean}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => start(scenario)}
            className="flex h-12 items-center rounded-[10px] px-5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}3D` }}
          >
            Try it again →
          </button>
          <button
            onClick={() => setScenario(null)}
            className="flex h-12 items-center rounded-[10px] border-[1.5px] border-[rgba(20,32,47,0.22)] px-5 text-[15px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          >
            All scenarios
          </button>
        </div>
      </div>
    );
  }

  // ── Active dialogue ─────────────────────────────────────────────────────────
  const currentLine = scenario.lines[lineIdx];
  const progress = (lineIdx / scenario.lines.length) * 100;
  const displayOpts = getDisplayOpts(currentLine, lineIdx);

  const bubble = (speaker: string) =>
    speaker === 'native'
      ? 'kl-well rounded-[14px_14px_14px_4px]'
      : 'rounded-[14px_14px_4px_14px] text-white';

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
        <div className="min-w-0">
          <h1 className="truncate font-display text-[24px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[26px] dark:text-white">
            {scenario.title}
            <span className="text-[#4A5566] dark:text-gray-500"> · {lineIdx} of {scenario.lines.length}</span>
          </h1>
        </div>
        <div className="flex flex-none items-center gap-3">
          <button
            onClick={() => setShowEn(e => !e)}
            className="flex h-10 items-center rounded-[9px] border border-[rgba(20,32,47,0.18)] px-3 text-[12.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
          >
            {showEn ? 'English on' : 'English off'}
          </button>
          <button
            onClick={() => setScenario(null)}
            className="flex h-10 items-center rounded-[9px] border border-[rgba(20,32,47,0.18)] px-3 text-[12.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
          >
            Exit
          </button>
        </div>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
        <div className="h-full rounded-full transition-all duration-500"
             style={{ width: `${progress}%`, background: ACC.light }} />
      </div>

      <div className="kl-card p-5 sm:p-6">
        {/* What has been said */}
        <div className="flex flex-col gap-3">
          {history.map(({ line, chosenOpt }, i) => (
            <div key={i} className={`flex flex-col ${line.speaker === 'you' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 ${bubble(line.speaker)}`}
                style={line.speaker === 'you' ? { background: ACC.light } : undefined}
              >
                {line.speaker === 'native' && line.role && (
                  <p className="mb-1 text-[11.5px] font-semibold text-[#4A5566] dark:text-gray-500">{line.role}</p>
                )}
                <p className={`font-korean text-[16px] font-semibold ${
                  line.speaker === 'native' ? 'text-[#16202F] dark:text-white' : ''
                }`}>
                  {line.speaker === 'you' ? (chosenOpt?.korean ?? line.korean) : line.korean}
                </p>
                {showEn && (
                  <p className={`mt-1 text-[13px] ${
                    line.speaker === 'native' ? 'text-[#4A5566] dark:text-gray-400' : 'text-white/80'
                  }`}>
                    {line.speaker === 'you' ? (chosenOpt?.english ?? line.english) : line.english}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* The line you are hearing now */}
          {currentLine.speaker === 'native' && (
            <div className="flex flex-col items-start">
              <div className="kl-well max-w-[85%] rounded-[14px_14px_14px_4px] px-4 py-3">
                {currentLine.role && (
                  <p className="mb-1 text-[11.5px] font-semibold text-[#4A5566] dark:text-gray-500">{currentLine.role}</p>
                )}
                <p className="font-korean text-[17px] font-semibold text-[#16202F] dark:text-white">{currentLine.korean}</p>
                {showEn && (
                  <>
                    <p className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">{currentLine.romanization}</p>
                    <p className="mt-0.5 text-[13.5px] text-[#3E4A5A] dark:text-gray-300">{currentLine.english}</p>
                  </>
                )}
                <button
                  onClick={() => speak(currentLine.korean)}
                  aria-label="Pronounce Korean text"
                  className="mt-2.5 inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#4A5566] transition-colors hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="flex h-2.5 items-end gap-[2px]" aria-hidden="true">
                    <span className="kl-bar w-[2.5px]" style={{ height: '100%', background: ACC.light }} />
                    <span className="kl-bar w-[2.5px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
                    <span className="kl-bar w-[2.5px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.3s' }} />
                  </span>
                  Hear it
                </button>
              </div>
            </div>
          )}

          {/* Your turn */}
          {currentLine.speaker === 'you' && (
            <div className="mt-2 flex flex-col gap-2.5">
              <p className="text-[13px] font-semibold text-[#16202F] dark:text-white">
                Your turn — which reply fits?
              </p>
              {displayOpts.map((opt, i) => {
                const isChosen = chosen === i;
                const showFeedback = chosen !== null;
                const correct = showFeedback && opt.isCorrect;
                const wrong = showFeedback && isChosen && !opt.isCorrect;
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={chosen !== null}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                      showFeedback
                        ? correct || wrong ? '' : 'border-[rgba(20,32,47,0.10)] opacity-40 dark:border-gray-800'
                        : 'cursor-pointer border-[rgba(20,32,47,0.14)] hover:border-[rgba(20,32,47,0.3)] dark:border-gray-700 dark:hover:border-gray-500'
                    }`}
                    style={
                      correct ? { borderColor: '#2E6B59', background: 'rgba(46,107,89,0.08)' }
                      : wrong ? { borderColor: '#C13F22', background: 'rgba(193,63,34,0.07)' }
                      : undefined
                    }
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex-none text-[12px] font-semibold text-[#4A5566] dark:text-gray-500">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-korean text-[15px] font-semibold leading-snug text-[#16202F] dark:text-white">
                          {opt.korean}
                        </p>
                        {showEn && <p className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-400">{opt.english}</p>}
                        {correct && (
                          <p className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">{opt.romanization}</p>
                        )}
                      </div>
                      {(correct || wrong) && (
                        <span
                          className="flex-none text-[14px] font-semibold"
                          style={{ color: correct ? '#2E6B59' : '#C13F22' }}
                        >
                          {correct ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Continue */}
        {(currentLine.speaker === 'native' || chosen !== null) && (
          <button
            onClick={advance}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-[10px] text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}3D` }}
          >
            {lineIdx + 1 >= scenario.lines.length ? 'See how you did →' : 'Continue →'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ScriptedConversation;
