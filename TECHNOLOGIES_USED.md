# Technologies, Models & Tools Used

## Project: AI-Powered Real-Time Online Interview & Answer Evaluation System (EvalVue AI)

---

## 1. AI / Machine Learning Models

| Model | Provider | Purpose |
|---|---|---|
| **Gemini 1.5 Flash** | Google (via Generative Language API v1beta) | Primary AI evaluator — semantically evaluates candidate spoken answers against expected answers, gives score (0–100), status, and detailed feedback |
| **Custom Local NLP Semantic Evaluator** | Built-in (no external API) | Fallback evaluator when Gemini API key is not set — uses TF-IDF cosine similarity, keyword overlap, n-gram matching, and tech synonym normalization |
| **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) | Browser (Google Chrome speech backend) | Real-time speech-to-text transcription of candidate's spoken answers during the interview |

---

## 2. Backend (Server)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | v20+ | Server runtime |
| **TypeScript** | 5.4.5 | Strongly typed server-side code |
| **Express.js** | 4.19.2 | REST API server (room management, questions API, health check) |
| **Socket.IO** | 4.7.5 | Real-time bidirectional WebSocket communication (signaling, speech streaming, evaluation events) |
| **dotenv** | 16.4.5 | Environment variable management (PORT, API keys, TURN server config) |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing middleware |
| **tsx** | 4.15.7 | TypeScript execution for development |

### NLP Algorithm (Local Evaluator — no external dependency)
- **TF-IDF Cosine Similarity** — measures lexical overlap between candidate answer and expected answer
- **Keyword Overlap Scoring** — checks how many predefined technical keywords the candidate mentioned
- **N-gram Matching** — bigrams and trigrams for phrase-level matching
- **Tech Synonym Normalization** — maps `js→javascript`, `ts→typescript`, `vdom→virtual dom`, etc.
- **Stop Word Filtering** — removes common English words to focus on technical content
- **Greeting / Noise Filter** — detects and strips conversational preamble and "I don't know" responses

---

## 3. Frontend (Client)

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.4.5 | Strongly typed client-side code |
| **Vite** | 5.3.1 | Frontend build tool and dev server |
| **Tailwind CSS** | 3.4.4 | Utility-first responsive CSS styling |
| **Socket.IO Client** | 4.7.5 | Real-time connection to backend server |
| **Lucide React** | 0.395.0 | Icon library |
| **canvas-confetti** | 1.9.3 | Celebration animation on results screen |
| **PostCSS** | 8.4.38 | CSS processing |
| **Autoprefixer** | 10.4.19 | CSS vendor prefix automation |

---

## 4. Real-Time Communication

| Technology | Purpose |
|---|---|
| **WebRTC** (browser native) | Peer-to-peer live video and audio call between interviewer and candidate |
| **RTCPeerConnection** | WebRTC connection establishment and media track management |
| **SDP (Session Description Protocol)** | Audio/video codec negotiation (Opus codec, mono channel, echo cancellation) |
| **ICE (Interactive Connectivity Establishment)** | NAT traversal to find best network path |
| **STUN Servers** (Google: `stun.l.google.com:19302`, `stun1`, `stun2`, `stun3`) | Discover public IP address for peer-to-peer connection |
| **TURN Relay Server** (Open Relay Project: `openrelay.metered.ca`) | Relay audio/video when direct peer-to-peer connection is blocked (different networks, strict firewalls) |
| **Socket.IO** | WebRTC signaling channel — exchanges SDP offers/answers and ICE candidates between peers |

### Audio Quality Settings
- Echo Cancellation (`echoCancellation: true`)
- Noise Suppression (`noiseSuppression: true`)
- Auto Gain Control (`autoGainControl: true`)
- Mono Channel (`channelCount: 1`) — prevents stereo feedback
- Opus codec SDP optimization (`stereo=0`, `useinbandfec=1`)
- Chromium-specific acoustic filters (`googEchoCancellation`, `googHighpassFilter`, `googNoiseSuppression`)

---

## 5. Deployment

| Service | Purpose |
|---|---|
| **GitHub** | Source code version control and repository hosting |
| **Vercel** | Frontend (React/Vite) deployment — provides live public URL |
| **Render** | Backend (Node.js/Express/Socket.IO) deployment — persistent web service for WebSocket support |

---

## 6. Data

| Item | Description |
|---|---|
| **interview-questions.json** | Custom predefined dataset of technical interview questions, expected answers, keywords, and categories (stored in `server/data/`) |
| **In-memory Room Store** | Active interview rooms are stored in server memory (Node.js Map) during a session |
| **CSV Export** | Interview result report is exported as a `.csv` file from the browser (no database needed) |

---

## 7. Development Tools

| Tool | Purpose |
|---|---|
| **concurrently** | Run server and client dev servers simultaneously with one command |
| **render.yaml** | Render.com deployment blueprint for 1-click backend deployment |
| **vercel.json** | Vercel SPA routing config (`rewrites` for React Router) |
| **.env / dotenv** | Environment variable configuration for API keys and server ports |

---

## 8. Summary Table (for Thesis)

| Layer | Technology |
|---|---|
| AI Evaluation (Primary) | Google Gemini 1.5 Flash API |
| AI Evaluation (Fallback) | Custom NLP (TF-IDF + Cosine Similarity + Keyword Matching) |
| Speech-to-Text | Browser Web Speech API (Google Chrome) |
| Real-Time Video/Audio | WebRTC (RTCPeerConnection) |
| Real-Time Signaling | Socket.IO over WebSocket |
| NAT Traversal | STUN (Google) + TURN (Open Relay Project) |
| Backend Runtime | Node.js + Express.js |
| Backend Real-Time | Socket.IO Server |
| Frontend Framework | React 18 + TypeScript |
| Frontend Build | Vite |
| Styling | Tailwind CSS |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | GitHub |

