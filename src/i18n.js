const DICT = {
  zh: {
    title: '万岁山',
    tag: '走到哪，看到哪',
    schedule: '节目单',
    now: '正在',
    next: '下一档',
    go: '前往',
    muteOn: '开声音',
    muteOff: '静音',
    help: '帮助',
    quality: '画质',
    qLow: '低',
    qAuto: '自动',
    qHigh: '高',
    whereGate: '园门',
    wherePath: '园中小径',
    watch: '按 E 观看',
    leave: '按 E 或 Esc 离开',
    helpTitle: '欢迎来到万岁山',
    dismiss: '开始逛园',
    affiliation: '这是一座原创的园子，只借用「每个角落都在演出」的想法。与任何现实中的主题公园没有从属关系。',
    helpP1: '你是园里的一个小人。四条演出各自循环，你走到近处就能听见，站进金色圈子按 E，镜头会缓缓坐到看席上。',
    helpP2: '移动：WASD 或方向键，Shift 跑步。转向：按住鼠标拖动，或 Q / R。观看：E。离开：E 或 Esc。',
    helpP3: '节目单可以收起（M），点「前往」会走到那场演出。数字键 1–4 也行。H 打开帮助，L 切换中英文。声音默认开着，可以静音。',
    helpP4: '西广场闲谈、戏台《灯与月》、东市杂耍、北路花车。都是原创段落，不需要联网。',
    closeSchedule: '收起',
    openSchedule: '节目单',
  },
  en: {
    title: 'Wansuishan',
    tag: 'Wander. Stop where it sings.',
    schedule: 'Today',
    now: 'Now',
    next: 'Next',
    go: 'Go',
    muteOn: 'Sound on',
    muteOff: 'Mute',
    help: 'Help',
    quality: 'Quality',
    qLow: 'Low',
    qAuto: 'Auto',
    qHigh: 'High',
    whereGate: 'Gate',
    wherePath: 'Garden path',
    watch: 'Press E to watch',
    leave: 'Press E or Esc to leave',
    helpTitle: 'Welcome to Wansuishan',
    dismiss: 'Enter the park',
    affiliation: 'An original park inspired by the idea of a show in every corner. Not affiliated with any real theme park.',
    helpP1: 'You are a small visitor. Four shows loop on their own. Walk close to hear them; stand in the gold ring and press E to ease the camera into a seat.',
    helpP2: 'Move: WASD or arrows, Shift to run. Look: drag the mouse, or Q / R to turn. Watch: E. Leave: E or Esc.',
    helpP3: 'Fold the schedule with M. Go jumps to a show. Keys 1–4 do the same. H opens help, L switches language. Sound starts on; you can mute it.',
    helpP4: 'West plaza talk, the pavilion play Lamp and Moon, the east-court juggler, and the north-loop parade. Original scenes, fully offline.',
    closeSchedule: 'Hide',
    openSchedule: 'Schedule',
  },
};

const listeners = new Set();
let lang = 'zh';

try {
  const saved = localStorage.getItem('wansui-lang');
  if (saved === 'en' || saved === 'zh') lang = saved;
} catch {
  lang = 'zh';
}

export function getLang() {
  return lang;
}

export function t(key) {
  const table = DICT[lang] || DICT.zh;
  return table[key] ?? DICT.zh[key] ?? key;
}

export function setLang(next) {
  if (next !== 'zh' && next !== 'en') return lang;
  lang = next;
  try { localStorage.setItem('wansui-lang', lang); } catch { /* ignore */ }
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  applyDom();
  for (const fn of listeners) fn(lang);
  return lang;
}

export function onLang(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyDom() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
}

export function toggleLang() {
  return setLang(lang === 'zh' ? 'en' : 'zh');
}
