const HELD_BLOCK = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const FROM_KEY = {
  w: 'KeyW',
  a: 'KeyA',
  s: 'KeyS',
  d: 'KeyD',
  q: 'KeyQ',
  e: 'KeyE',
  r: 'KeyR',
  f: 'KeyF',
  m: 'KeyM',
  h: 'KeyH',
  l: 'KeyL',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  ' ': 'Space',
  escape: 'Escape',
  shift: 'ShiftLeft',
  '1': 'Digit1',
  '2': 'Digit2',
  '3': 'Digit3',
  '4': 'Digit4',
};

export function eventCode(event) {
  const key = String(event.key || '').toLowerCase();
  const fromKey = FROM_KEY[key];
  const code = event.code || '';
  if (fromKey && (!code || code === 'Unidentified' || code === key || code.length === 1)) return fromKey;
  if (code && code !== 'Unidentified') return code;
  return fromKey || '';
}

export function createKeyboard() {
  const down = new Set();
  const pressed = new Set();

  window.addEventListener('keydown', (event) => {
    const code = eventCode(event);
    if (!code) return;
    const el = event.target;
    const typing = el && el.matches && el.matches('input, textarea, select');
    if (!typing && HELD_BLOCK.has(code)) event.preventDefault();
    if (event.repeat) return;
    down.add(code);
    pressed.add(code);
  }, true);
  window.addEventListener('keyup', (event) => {
    down.delete(eventCode(event));
  }, true);
  window.addEventListener('blur', () => down.clear());

  return {
    held(code) { return down.has(code); },
    heldAny(...codes) { return codes.some((code) => down.has(code)); },
    consume(code) {
      if (!pressed.has(code)) return false;
      pressed.delete(code);
      return true;
    },
  };
}

export function createPointer(dom) {
  let dragging = false;
  let dx = 0;
  let dy = 0;
  let wheel = 0;

  dom.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (event.target !== dom) return;
    dragging = true;
    dom.setPointerCapture(event.pointerId);
  });
  const end = () => { dragging = false; };
  dom.addEventListener('pointerup', end);
  dom.addEventListener('pointercancel', end);
  dom.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dx += event.movementX;
    dy += event.movementY;
  });
  dom.addEventListener('wheel', (event) => {
    event.preventDefault();
    wheel += Math.sign(event.deltaY);
  }, { passive: false });
  dom.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    read() {
      const out = { dx, dy, wheel };
      dx = 0;
      dy = 0;
      wheel = 0;
      return out;
    },
  };
}
