export const I18N = {
  en: { play: '▶ Play', pause: '⏸ Pause', mine: '⛏️ Mine' },
  es: { play: '▶ Jugar', pause: '⏸ Pausa', mine: '⛏️ Minar' },
  fr: { play: '▶ Jouer', pause: '⏸ Pause', mine: '⛏️ Miner' },
  de: { play: '▶ Spielen', pause: '⏸ Pause', mine: '⛏️ Abbauen' },
  it: { play: '▶ Gioca', pause: '⏸ Pausa', mine: '⛏️ Scava' },
  pt: { play: '▶ Jogar', pause: '⏸ Pausa', mine: '⛏️ Minerar' },
  ja: { play: '▶ プレイ', pause: '⏸ 一時停止', mine: '⛏️ 掘る' },
  ko: { play: '▶ 플레이', pause: '⏸ 일시정지', mine: '⛏️ 채굴' },
  zh: { play: '▶ 开始', pause: '⏸ 暂停', mine: '⛏️ 挖掘' },
  hi: { play: '▶ खेलें', pause: '⏸ रोकें', mine: '⛏️ खोदें' },
  ar: { play: '▶ العب', pause: '⏸ إيقاف', mine: '⛏️ احفر' },
};
export function applyLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
