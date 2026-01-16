import { GameEvent, GameState } from './types';

export const START_YEAR = 1953;
export const END_YEAR = 1962;

export const EVENTS: Record<number, GameEvent> = {
  1955: {
    title: "農業合作化運動",
    desc: "為了集中力量辦大事，中央提議加快農業合作化，將分散的小農經濟轉變為集體經濟。這能更有效地調配糧食支援工業。",
    yesText: "執行 (農業效率+15%，重工+5%)",
    noText: "暫緩 (保持現狀)",
    resultText: "農業合作化已推行，農村資源更有效地支援了工業建設。",
    effect: (state: GameState) => ({
      modifiers: {
        ...state.modifiers,
        agriEfficiency: state.modifiers.agriEfficiency + 0.15,
        heavyBonus: state.modifiers.heavyBonus + 0.05
      }
    })
  },
  1956: {
    title: "三大改造完成",
    desc: "社會主義改造基本完成，公有制經濟佔據主導地位。是否進一步強化計劃經濟體制？",
    yesText: "強化 (全產業穩定性提高)",
    noText: "保持靈活 (輕工業活力保留)",
    resultText: "體制進一步鞏固，國家調配資源能力增強。",
    effect: (state: GameState) => ({
      modifiers: {
        ...state.modifiers,
        stability: state.modifiers.stability + 0.1
      }
    })
  },
  1958: {
    title: "大躍進抉擇",
    desc: "「超英趕美」的呼聲高漲。是否發動大規模群眾運動，大煉鋼鐵並建立人民公社？",
    yesText: "發動 (重工大幅增長，但有高風險)",
    noText: "理性發展 (避免激進冒險)",
    resultText: "全國掀起建設熱潮，重工業產量激增，但農業生產受到干擾。",
    effect: (state: GameState) => ({
      modifiers: {
        ...state.modifiers,
        heavyEfficiency: state.modifiers.heavyEfficiency + 0.5,
        agriEfficiency: state.modifiers.agriEfficiency - 0.3
      },
      flags: { ...state.flags, greatLeap: true }
    })
  },
  1960: {
    title: "蘇聯撤資危機",
    desc: "中蘇關係惡化，蘇聯準備撤走全部專家並撕毀合同。我們該如何應對？",
    yesText: "自力更生 (花費資源研發，保增長潛力)",
    noText: "縮減計劃 (降低目標，保證安全)",
    resultText: "發揚「自力更生」精神，雖然困難重重，但鍛鍊了自主研發能力。",
    effect: (state: GameState) => ({
      modifiers: {
        ...state.modifiers,
        heavyEfficiency: state.modifiers.heavyEfficiency + 0.1
      },
      flags: { ...state.flags, sovietSplit: true }
    })
  }
};