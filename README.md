# 📡 SSTV Web Modem

![Version](https://img.shields.io/badge/version-3.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Mode](https://img.shields.io/badge/Mode-Robot%2036-orange)
![Tech](https://img.shields.io/badge/Built%20With-Web%20Audio%20API-yellow)

A professional-grade, browser-based modem for encoding and decoding **Slow Scan Television (SSTV)** signals. Built specifically for the **Robot 36** mode, this tool features real-time signal processing, high-fidelity spectrum visualization, and history tracking—zero installation required.

### 🔗 **Live Demo:** [sstv.dippanbhusal.tech](https://sstv.dippanbhusal.tech)

---

## 📸 Interface Preview

| **Landing Dashboard** | **Encoder Interface** |
|:---:|:---:|
| ![Main Page](https://i.ibb.co/0pVSNNWv/38916.png) | ![Encoder](https://i.ibb.co/zT4vG03Q/38917.png) |
| **Central Hub for SSTV Operations** | **Precision Signal Generator** |

| **Decoder & Visualizer** | **History Log** |
|:---:|:---:|
| ![Decoder](https://i.ibb.co/XfGc69FT/38918.png) | ![History](https://i.ibb.co/kgVbLcvX/38919.png) |
| **Real-time Spectrum Analysis** | **Local Transmission Archive** |

---

## ✨ Key Features

### 📡 Transmitter (Encoder)
* **Robot 36 Standard:** Hard-optimized for the 36-second color mode, widely used in amateur radio.
* **Precision Timing Engine:** Uses integer-boundary sample counting to eliminate image skew/slant during transmission.
* **WAV Export:** Instantly download generated signals as high-quality WAV files for transmission via radio.
* **Auto-Resizing:** Automatically scales any uploaded image to the standard 320x240 resolution.

### 📠 Receiver (Decoder)
* **Rainbow Spectrum Visualizer:** A stunning, 60fps real-time FFT bar graph visualization of the incoming audio signal.
* **Robust Sync Detection:** Custom "Debounce Lock" algorithm prevents noise from falsely resetting scanlines, ensuring incomplete images are rare.
* **DC Offset Blocker:** Automatically filters out hardware microphone noise/hum for cleaner decoding.
* **Screen Wake Lock:** Prevents your device from sleeping during long reception sessions.
* **Dual Input:** Listen via **Live Microphone** or decode uploaded **WAV/MP3 Files**.

### 💾 Core Utilities
* **History System:** Automatically saves your transmitted and received images to your browser's local storage.
* **Privacy Focused:** All processing happens locally in the browser via WebAssembly/Web Audio API. **No data is sent to servers.**
* **PWA Ready:** Fully responsive design that works seamlessly on Mobile, Tablet, and Desktop.

---

## 📖 How to Use

### 📤 Sending an Image (Encoder)
1.  Navigate to the **ENCODE** tab.
2.  Click **Choose File** to select any image from your device.
3.  Click **Generate Signal**. The app will process the image into audio frequencies.
4.  Once encoded, you can:
    * **Play Audio:** To transmit via speakers (e.g., into a handheld radio's mic).
    * **Download WAV:** To save the file for later digital transmission.

### 📥 Receiving an Image (Decoder)
1.  Navigate to the **DECODE** tab.
2.  Click **RX ON (MIC)** to grant microphone permissions and start listening.
3.  Play an SSTV audio source (Robot 36 mode) near your microphone.
    * *Tip: You can use the "Encoder" on another device to test this!*
4.  The **Visualizer** will light up with the signal, and the image will draw line-by-line below.
5.  Click **Save Image** when the transmission is complete.

---

## 🚀 Local Installation

You can run this project locally without any dependencies (Node.js/NPM not required, but a local server is needed for Microphone security policies).

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/kdippan/sstv-web-modem.git](https://github.com/kdippan/sstv-web-modem.git)
    ```
2.  **Navigate to the folder**
    ```bash
    cd sstv-web-modem
    ```
3.  **Run a local server**
    * *VS Code:* Install "Live Server" extension -> Right-click `index.html` -> "Open with Live Server".
    * *Python:* `python3 -m http.server`
    * *Node:* `npx http-server`

*Note: Due to browser security policies regarding Microphone access, this app must be run on `localhost` or `https`. It will not work correctly if opened directly as a `file://`.*

---

## 🛠️ Technology Stack

* **Core:** HTML5, CSS3 (Custom Variables + Grid Layout)
* **Scripting:** Vanilla JavaScript (ES6+ Modules)
* **Audio Engine:** Web Audio API (ScriptProcessorNode, AnalyserNode, OscillatorNode)
* **Graphics:** HTML5 Canvas API (2D Context for Visualizer & Image Drawing)
* **Storage:** LocalStorage API (For History persistence)

---

## 👨‍💻 Developer

**Dippan Bhusal**

* [![GitHub](https://img.shields.io/badge/GitHub-KDippan-181717?style=flat&logo=github)](https://github.com/KDippan)
* [![LinkedIn](https://img.shields.io/badge/LinkedIn-KDippan-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/KDippan)
* [![X](https://img.shields.io/badge/X-DippanBhusal-000000?style=flat&logo=x)](https://x.com/DippanBhusal)

---

## ☕ Support

If you find this tool useful, consider supporting the development!

<a href="https://www.buymeacoffee.com/dippanbhusal" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
