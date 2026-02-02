/* js/decode.js */
import { SSTV_CONSTANTS, saveToHistory } from './sstv-core.js';

class SSTVDecoder {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.scriptNode = null;
        this.isListening = false;
        this.wakeLock = null;
        
        this.visualizerCanvas = document.getElementById('spectrum-visualizer');
        this.visualizerCtx = this.visualizerCanvas ? this.visualizerCanvas.getContext('2d') : null;
        this.imageCanvas = document.getElementById('sstv-display');
        this.imageCtx = this.imageCanvas ? this.imageCanvas.getContext('2d') : null;
        this.meterFill = document.getElementById('input-level-fill');
        
        this.startBtn = document.getElementById('start-listening');
        this.stopBtn = document.getElementById('stop-listening');
        this.fileInput = document.getElementById('audio-file-upload');
        this.fileStatus = document.getElementById('file-status');
        this.downloadImgBtn = document.getElementById('download-image-btn');

        // Logic State
        this.sampleRate = 0;
        this.previousVal = 0;
        this.samplesSinceLastCrossing = 0;
        this.currentFreq = 0;
        this.dcOffset = 0; // DC Blocker state
        
        this.syncStreak = 0;
        this.modeState = 'SEARCHING_SYNC'; 
        this.samplesSinceLineStart = 0;
        this.currentLine = 0;
        
        // Buffers
        this.c1Buffer = new Float32Array(320); 
        this.c2Buffer = new Float32Array(320); 
        this.c3Buffer = new Float32Array(320); 
        
        this.init();
    }

    init() {
        if(this.visualizerCtx) { 
            this.visualizerCtx.fillStyle = '#000'; 
            this.visualizerCtx.fillRect(0,0, this.visualizerCanvas.width, this.visualizerCanvas.height); 
        }
        if(this.imageCtx) { 
            this.imageCtx.fillStyle = '#000'; 
            this.imageCtx.fillRect(0,0,320,240); 
        }

        if(this.startBtn) this.startBtn.addEventListener('click', () => this.startMicrophone());
        if(this.stopBtn) this.stopBtn.addEventListener('click', () => this.stopAll());
        if(this.fileInput) this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        if(this.downloadImgBtn) {
            this.downloadImgBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `sstv-decode-${Date.now()}.png`;
                link.href = this.imageCanvas.toDataURL();
                link.click();
            });
        }
    }
    
    clearImage() {
        this.imageCtx.fillStyle = '#000';
        this.imageCtx.fillRect(0, 0, 320, 240);
        this.currentLine = 0;
        this.modeState = 'SEARCHING_SYNC';
    }

    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) { console.log('Wake Lock Error:', err); }
    }
    
    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    async ensureAudioContext() {
        if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
        this.sampleRate = this.audioContext.sampleRate;
    }

    setupAudioGraph() {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048; 
        this.analyser.smoothingTimeConstant = 0.85;

        // Create Script Processor
        this.scriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);
        this.scriptNode.onaudioprocess = (e) => this.processAudioBatch(e);
    }

    async startMicrophone() {
        this.stopAll();
        this.clearImage(); 
        await this.ensureAudioContext();
        this.setupAudioGraph();
        this.requestWakeLock();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.analyser.connect(this.scriptNode);
            // Mute output for mic
            const mute = this.audioContext.createGain(); mute.gain.value = 0;
            this.scriptNode.connect(mute); mute.connect(this.audioContext.destination);
            
            this.isListening = true;
            this.modeState = 'SEARCHING_SYNC';
            this.loop();
        } catch(e) { alert("Mic Error: " + e.message); }
    }

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        this.stopAll();
        this.clearImage(); 
        await this.ensureAudioContext();
        this.setupAudioGraph();
        this.requestWakeLock();
        this.fileStatus.innerText = "Decoding...";
        
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const decoded = await this.audioContext.decodeAudioData(evt.target.result);
                this.playFileBuffer(decoded);
            } catch(err) { this.fileStatus.innerText = "Error decoding file"; }
        };
        reader.readAsArrayBuffer(file);
    }

    playFileBuffer(buffer) {
        this.fileSource = this.audioContext.createBufferSource();
        this.fileSource.buffer = buffer;
        this.fileSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.analyser.connect(this.scriptNode);
        const mute = this.audioContext.createGain(); mute.gain.value = 0;
        this.scriptNode.connect(mute); mute.connect(this.audioContext.destination);
        
        this.fileSource.start(0);
        this.isListening = true;
        this.modeState = 'SEARCHING_SYNC';
        this.loop();
        
        setTimeout(() => {
             this.fileStatus.innerText = "Complete.";
             saveToHistory('RX', this.imageCanvas.toDataURL(), 'Robot 36');
             this.stopAll();
        }, (buffer.duration * 1000) + 1500);
    }

    stopAll() {
        this.isListening = false;
        this.releaseWakeLock();
        if(this.microphone) { this.microphone.disconnect(); this.microphone=null; }
        if(this.fileSource) { try{this.fileSource.stop()}catch(e){}; this.fileSource.disconnect(); this.fileSource=null; }
        if(this.scriptNode) { this.scriptNode.disconnect(); this.scriptNode=null; }
        if(this.analyser) { this.analyser.disconnect(); }
    }

    // --- DSP LOGIC ---
    processAudioBatch(e) {
        const data = e.inputBuffer.getChannelData(0);
        const C = SSTV_CONSTANTS.R36;
        
        for (let i = 0; i < data.length; i++) {
            // DC Blocker (High Pass Filter) to clean signal
            const raw = data[i];
            this.dcOffset = (raw * 0.05) + (this.dcOffset * 0.95);
            const val = raw - this.dcOffset;

            this.samplesSinceLastCrossing++;
            
            // Zero Crossing Detector
            if (val > 0 && this.previousVal <= 0) {
                const cycles = this.samplesSinceLastCrossing;
                // Valid SSTV range check (800Hz - 3000Hz approx)
                if(cycles > 10 && cycles < 200) {
                    const instantFreq = this.sampleRate / cycles;
                    // Strong Low Pass on Freq to smooth out jitter
                    this.currentFreq = (this.currentFreq * 0.5) + (instantFreq * 0.5);
                }
                this.samplesSinceLastCrossing = 0;
                
                // Track 1200Hz Sync (Window 1100-1300)
                if (this.currentFreq > 1100 && this.currentFreq < 1300) {
                    this.syncStreak++;
                } else {
                    this.syncStreak = 0;
                }
            }
            this.previousVal = val;

            // --- STATE MACHINE ---
            
            if (this.modeState === 'SEARCHING_SYNC') {
                // FIXED: Lowered threshold from 15 to 4 cycles
                // Robot 36 sync is 9ms (only ~10 cycles). 15 was impossible.
                if (this.syncStreak > 4) { 
                    this.modeState = 'WAIT_SYNC_END'; 
                }
            }
            else if (this.modeState === 'WAIT_SYNC_END') {
                // Falling edge of 1200Hz -> Start of Scanline
                if (this.syncStreak < 2) {
                    this.modeState = 'SCANNING';
                    this.samplesSinceLineStart = 0;
                    this.startNewLine(C);
                }
            }
            else if (this.modeState === 'SCANNING') {
                this.samplesSinceLineStart++;
                const t = this.samplesSinceLineStart / this.sampleRate;
                
                this.processRobot36(t, this.currentFreq, C);

                // Watchdog: If line goes too long (>160ms), reset
                if (this.samplesSinceLineStart > (0.16 * this.sampleRate)) {
                    this.currentLine++;
                    if(this.currentLine >= C.HEIGHT) {
                        saveToHistory('RX', this.imageCanvas.toDataURL(), 'Robot 36');
                        this.currentLine = 0;
                    }
                    this.modeState = 'SEARCHING_SYNC';
                }
                
                // Mid-line Sync Detection (For robustness)
                // If we see a sync pulse ~150ms after start, catch it
                if (this.samplesSinceLineStart > (0.14 * this.sampleRate)) {
                    if (this.syncStreak > 4) {
                        this.modeState = 'WAIT_SYNC_END';
                        this.currentLine++;
                        if(this.currentLine >= C.HEIGHT) this.currentLine = 0;
                    }
                }
            }
        }
    }

    processRobot36(t, freq, C) {
        const val = Math.max(0, Math.min(255, ((freq - 1500) / 800) * 255));
        
        if (t > C.PORCH && t < (C.PORCH + C.Y_SCAN)) {
            const x = Math.floor( ((t - C.PORCH) / C.Y_SCAN) * C.WIDTH );
            if (x>=0 && x<C.WIDTH) this.c1Buffer[x] = val;
        }
        else if (t > 0.097 && t < 0.141) {
            const x = Math.floor( ((t - 0.097) / C.UV_SCAN) * C.WIDTH );
            if (x>=0 && x<C.WIDTH) {
                if(this.currentLine%2===0) this.c2Buffer[x] = val; // R-Y
                else this.c3Buffer[x] = val; // B-Y
                
                const Y = this.c1Buffer[x];
                const Cr = this.c2Buffer[x];
                const Cb = this.c3Buffer[x];
                
                const r = Y + 1.402*(Cr-128);
                const g = Y - 0.344*(Cb-128) - 0.714*(Cr-128);
                const b = Y + 1.772*(Cb-128);
                this.drawPx(x, this.currentLine, r, g, b);
            }
        }
    }

    drawPx(x, y, r, g, b) {
        this.imageCtx.fillStyle = `rgb(${r},${g},${b})`;
        this.imageCtx.fillRect(x, y, 1, 1);
    }
    
    startNewLine(C) {
        // Green Scan bar
        this.imageCtx.fillStyle = '#0F0';
        this.imageCtx.fillRect(0, this.currentLine, C.WIDTH, 2);
    }

    loop() {
        if (!this.isListening) return;
        requestAnimationFrame(() => this.loop());
        
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        
        // --- VISUALIZER ---
        const w = this.visualizerCanvas.width;
        const h = this.visualizerCanvas.height;
        const ctx = this.visualizerCtx;
        
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#000';
        ctx.fillRect(0,0,w,h);
        
        // Rainbow Bars
        const gradient = ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, '#ff0055');
        gradient.addColorStop(0.5, '#55ff00');
        gradient.addColorStop(1, '#ff0055');
        ctx.fillStyle = gradient;

        const barCount = 64;
        const barW = (w / barCount) - 2;
        const step = Math.floor(data.length / barCount);
        
        for(let i=0; i<barCount; i++) {
            let val = data[i * step];
            let barH = (val / 255) * h * 0.9;
            ctx.fillRect(i*(barW+2), (h-barH)/2, barW, barH);
        }
    }
}
document.addEventListener('DOMContentLoaded', () => new SSTVDecoder());
