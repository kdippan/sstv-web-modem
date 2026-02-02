# 📡 SSTV Web Modem

![Version](https://img.shields.io/badge/version-3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Mode](https://img.shields.io/badge/Mode-Robot%2036-orange)

A professional-grade, browser-based modem for encoding and decoding **Slow Scan Television (SSTV)** signals. Built specifically for the **Robot 36** mode, this tool features real-time signal processing, high-fidelity spectrum visualization, and history tracking—zero installation required.

**[Live Demo](https://your-username.github.io/sstv-web-modem/)** *(Replace with your actual link after deploying)*

## ✨ Features

### 📡 Transmitter (Encoder)
* **Precision Timing Engine:** Uses integer-boundary sample counting to eliminate image skew/slant.
* **Robot 36 Mode:** Hard-optimized for the 36-second color standard.
* **WAV Export:** Download generated signals as high-quality WAV files for radio transmission.
* **Auto-Resizing:** Automatically fits any image to the 320x240 standard.

### 📠 Receiver (Decoder)
* **Spectrum Bar Visualizer:** Real-time, 60fps rainbow spectrum analyzer.
* **Robust Sync Detection:** Custom "Debounce Lock" algorithm prevents noise from resetting scanlines.
* **DC Offset Blocker:** Filters out hardware microphone noise for cleaner decoding.
* **Screen Wake Lock:** Prevents your device from sleeping during long receptions.
* **Dual Input:** Listen via **Microphone** or upload **Audio Files**.

### 💾 Core Tools
* **History System:** Automatically saves your transmitted and received images to local storage.
* **PWA Ready:** Responsive design that works on Mobile, Tablet, and Desktop.
* **Privacy Focused:** All processing happens locally in the browser via WebAssembly/Web Audio API. No data is sent to servers.

## 🚀 Quick Start

You can run this project locally without any dependencies (Node.js/NPM not required).

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/KDippan/sstv-web-modem.git](https://github.com/KDippan/sstv-web-modem.git)
    ```
2.  **Navigate to the folder**
    ```bash
    cd sstv-web-modem
    ```
3.  **Run a local server**
    * *VS Code:* Right-click `index.html` > "Open with Live Server".
    * *Python:* `python3 -m http.server`
    * *Node:* `npx http-server`

*Note: Due to browser security policies regarding Microphone access, this app must be run on `localhost` or `https`. It will not work if opened directly as a `file://`.*

## 🛠️ Technology Stack

* **Core:** HTML5, CSS3 (Variables + Grid), Vanilla JavaScript (ES6+)
* **Audio:** Web Audio API (ScriptProcessorNode, AnalyserNode, OscillatorNode)
* **Visuals:** HTML5 Canvas API (2D Context)
* **Storage:** LocalStorage API

## 📖 How to Use

### Sending an Image
1.  Navigate to the **ENCODE** tab.
2.  Click **Choose File** to select an image.
3.  Click **Generate Signal**.
4.  Once encoded, click **Play Audio** to transmit via speakers (to a nearby radio) or **Download WAV** to save the file.

### Receiving an Image
1.  Navigate to the **DECODE** tab.
2.  Click **RX ON (MIC)** to start listening.
3.  Play an SSTV audio source (Robot 36 mode) near your microphone.
4.  The **Visualizer** will show the signal, and the image will draw line-by-line.
5.  Click **Save Image** when finished.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 👨‍💻 Author

**Dippan Bhusal**
* GitHub: [@KDippan](https://github.com/KDippan)
* LinkedIn: [KDippan](https://linkedin.com/in/KDippan)
* X: [@DippanBhusal](https://x.com/DippanBhusal)

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Support the development:*
<a href="https://www.buymeacoffee.com/dippanbhusal" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
