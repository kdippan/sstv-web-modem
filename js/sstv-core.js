/* js/sstv-core.js */
export const SSTV_CONSTANTS = {
  FREQ_SYNC: 1200,
  FREQ_PORCH: 1500,
  FREQ_BLACK: 1500,
  FREQ_WHITE: 2300,
  
  R36: {
      WIDTH: 320,
      HEIGHT: 240,
      SYNC: 0.009,
      PORCH: 0.003,
      Y_SCAN: 0.088,
      SEP: 0.0045,
      PORCH_UV: 0.0015,
      UV_SCAN: 0.044
  }
};

export function valToFreq(val) { return 1500 + (val * 3.1372549); }

export function rgbToYuv(r, g, b) {
  return {
    y: 16 + (65.481*r + 128.553*g + 24.966*b)/255,
    cb: 128 + (-37.797*r - 74.203*g + 112.0*b)/255,
    cr: 128 + (112.0*r - 93.786*g - 18.214*b)/255
  };
}

export function saveToHistory(type, dataUrl, mode) {
    try {
        const history = JSON.parse(localStorage.getItem('sstv_history') || '[]');
        const entry = {
            id: Date.now(),
            type: type, 
            image: dataUrl,
            mode: mode,
            date: new Date().toLocaleString()
        };
        history.unshift(entry);
        if(history.length > 12) history.pop();
        localStorage.setItem('sstv_history', JSON.stringify(history));
    } catch(e) { console.error(e); }
}
