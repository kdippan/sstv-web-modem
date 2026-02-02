/* js/encode.js */
import { SSTV_CONSTANTS, rgbToYuv, valToFreq, saveToHistory } from './sstv-core.js';

class SSTVEncoder {
  constructor() {
    this.canvas = document.getElementById('preview-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.audioContext = null;
    this.generatedBuffer = null;
    this.sourceNode = null;
    this.currentImg = null;
    
    this.fileInput = document.getElementById('imageUpload');
    this.generateBtn = document.getElementById('generate-audio');
    this.playBtn = document.getElementById('play-audio');
    this.downloadBtn = document.getElementById('download-audio');
    this.progressBar = document.getElementById('progress-fill');
    
    this.init();
  }

  init() {
    this.fileInput.addEventListener('change', (e) => this.handleImageUpload(e));
    this.generateBtn.addEventListener('click', () => this.generateSignal());
    this.playBtn.addEventListener('click', () => this.playAudio());
    this.downloadBtn.addEventListener('click', () => this.downloadWav());
  }

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      this.currentImg = img;
      this.drawImageToCanvas(img);
      this.generateBtn.disabled = false;
    };
    img.src = URL.createObjectURL(file);
  }

  drawImageToCanvas(img) {
      const width = SSTV_CONSTANTS.R36.WIDTH;
      const height = SSTV_CONSTANTS.R36.HEIGHT;
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0,0, width, height);
      const scale = Math.min(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      this.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  }

  async generateSignal() {
    this.generateBtn.disabled = true;
    this.generateBtn.innerText = "Encoding...";
    this.progressBar.style.width = '0%';

    try {
        if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();

        setTimeout(() => {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.encodeRobot36(imageData);
            saveToHistory('TX', this.canvas.toDataURL(), 'Robot 36');
        }, 50);
    } catch (err) {
        alert("Encoding Error: " + err.message);
        this.generateBtn.disabled = false;
    }
  }

  writeSegment(data, currentSample, targetTime, sampleRate, freq, phase, pixels, width, lineIdx, channel) {
      const targetSample = Math.floor(targetTime * sampleRate);
      const length = targetSample - currentSample;
      
      for (let i = 0; i < length; i++) {
          let f = freq;
          if (pixels) {
             const progress = i / length;
             const x = Math.min(width - 1, Math.floor(progress * width));
             const pIdx = (lineIdx * width + x) * 4;
             let val = 0;
             if (channel === 'y') val = rgbToYuv(pixels[pIdx], pixels[pIdx+1], pixels[pIdx+2]).y;
             else if (channel === 'cr') val = rgbToYuv(pixels[pIdx], pixels[pIdx+1], pixels[pIdx+2]).cr;
             else if (channel === 'cb') val = rgbToYuv(pixels[pIdx], pixels[pIdx+1], pixels[pIdx+2]).cb;
             f = valToFreq(val);
          }
          const phaseIncr = (2 * Math.PI * f) / sampleRate;
          data[currentSample + i] = Math.sin(phase);
          phase += phaseIncr;
          if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
      }
      return { nextSample: targetSample, nextPhase: phase };
  }

  encodeRobot36(imageData) {
    const C = SSTV_CONSTANTS.R36;
    const sr = this.audioContext.sampleRate;
    const LEAD_IN = 0.5; 
    const lineTime = C.SYNC + C.PORCH + C.Y_SCAN + C.SEP + C.PORCH_UV + C.UV_SCAN;
    const totalSamples = Math.floor(sr * (LEAD_IN + 4.0 + (C.HEIGHT * lineTime)));
    
    const buffer = this.audioContext.createBuffer(1, totalSamples, sr);
    const data = buffer.getChannelData(0);
    const pixels = imageData.data;
    
    let time = LEAD_IN;
    let sIdx = Math.floor(time * sr);
    let phase = 0;

    // Header
    const addTone = (dur, f) => { time += dur; const res = this.writeSegment(data, sIdx, time, sr, f, phase, null); sIdx = res.nextSample; phase = res.nextPhase; };
    
    addTone(0.3, 1900); addTone(0.01, 1200); addTone(0.3, 1900); addTone(0.03, 1200);

    for(let line=0; line<C.HEIGHT; line++) {
        if(line%10===0) {
            this.progressBar.style.width = `${Math.round((line/C.HEIGHT)*100)}%`;
        }
        
        // Sync & Porch
        addTone(C.SYNC, 1200);
        addTone(C.PORCH, 1500);
        
        // Y Scan (Pass Line Index explicitly)
        time += C.Y_SCAN;
        let res = this.writeSegment(data, sIdx, time, sr, 0, phase, pixels, C.WIDTH, line, 'y');
        sIdx = res.nextSample; phase = res.nextPhase;
        
        // Separator & Porch
        addTone(C.SEP, 1500);
        addTone(C.PORCH_UV, 1900);
        
        // UV Scan (Pass Line Index explicitly)
        time += C.UV_SCAN;
        res = this.writeSegment(data, sIdx, time, sr, 0, phase, pixels, C.WIDTH, line, (line%2===0)?'cr':'cb');
        sIdx = res.nextSample; phase = res.nextPhase;
    }
    this.finalize(buffer);
  }

  finalize(buffer) {
    this.generatedBuffer = buffer;
    this.generateBtn.innerText = "Encode Complete";
    this.generateBtn.disabled = false;
    this.playBtn.disabled = false;
    this.downloadBtn.disabled = false;
    this.progressBar.style.width = '100%';
  }

  playAudio() {
    if (this.sourceNode) this.sourceNode.stop();
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.generatedBuffer;
    this.sourceNode.connect(this.audioContext.destination);
    this.sourceNode.start();
  }

  downloadWav() {
    if(!this.generatedBuffer) return;
    const buffer = this.generatedBuffer;
    const length = buffer.length * 2 + 44;
    const view = new DataView(new ArrayBuffer(length));
    const channels = buffer.getChannelData(0);
    let pos = 0;
    const setUint32 = (d) => { view.setUint32(pos, d, true); pos+=4; }
    const setUint16 = (d) => { view.setUint16(pos, d, true); pos+=2; }
    setUint32(0x46464952); setUint32(length-8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(1);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate*2); setUint16(2); setUint16(16);
    setUint32(0x61746164); setUint32(length-44);
    for(let i=0; i<channels.length; i++) {
        let s = Math.max(-1, Math.min(1, channels[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        view.setInt16(pos, s, true); pos += 2;
    }
    const blob = new Blob([view.buffer], { type: 'audio/wav' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sstv_robot36.wav`;
    link.click();
  }
}

document.addEventListener('DOMContentLoaded', () => new SSTVEncoder());
