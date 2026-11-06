# EvalVue AI — Real-Time Online Interview & Answer Evaluation System

EvalVue AI is a production-grade, full-stack, real-time online technical interview platform. An interviewer can create a room, share a unique room code, conduct a peer-to-peer WebRTC video/audio interview, dynamically ask questions that are intelligently matched against a predefined JSON question dataset, and automatically evaluate the candidate's spoken responses in real time using AI-powered semantic similarity.

---

## 🌟 Key Features & Workflow Updates

### 1. Candidate Interface — Video Only
- The candidate's interface is completely clean and dedicated to the video call (similar to Zoom or Google Meet).
- **The candidate sees ONLY**:
  - Interviewer's live video stream (large primary panel)
  - Candidate's own live video stream (picture-in-picture floating self-view)
  - Microphone mute/unmute button
  - Camera on/off button
  - Leave Interview button
  - Basic connection status (Connected / Reconnecting)
- **Zero Question/Evaluation Exposure**: The candidate does **NOT** see any interview questions, question lists, expected answers, similarity scores, or AI feedback.
- Candidate answers the interviewer's spoken questions naturally into their microphone.

### 2. Interviewer Interface — Dynamic Question Detection & Matching
- The entire JSON question dataset is **NOT** exposed or dumped on the interviewer dashboard.
- The interviewer enters or selects the question they want to ask in natural language.
- When the interviewer clicks **"Ask Question"**:
  1. Captures the interviewer's original question (e.g., *"Can you explain how var, let and const are different?"*).
  2. Compares it against all predefined questions in the JSON dataset using semantic similarity.
  3. Finds the most semantically similar question (e.g., *"What is the difference between var, let, and const?"*).
  4. Displays:
     - Interviewer's original question
     - Matched JSON question and category
     - Match confidence percentage (e.g. `94% Match`)
     - Confidential expected answer and target technical keywords
  5. Uses the matched question's expected answer for candidate response evaluation.
- **Minimum Matching-Confidence Threshold**:
  - If no sufficiently relevant question is found, the system displays **"No Matching Question Found"**.
  - Answer evaluation is blocked for unmatched questions until the interviewer rephrases or asks a valid technical question.

### 3. Real-Time Speech-to-Text & Semantic Evaluation
- Candidate spoken responses are transcribed and streamed in real time to the interviewer's dashboard.
- Evaluates meaning and conceptual correctness against the matched question's expected answer.
- **Greeting Detection**: Filters casual chit-chat (*"Hi", "Hello", "Good morning"*, etc.).
- **Unknown Answer Detection**: Phrases such as *"I don't know"*, *"I have no idea"*, *"I'm not sure"*, *"Pass"*, etc., automatically score **0 points** with status **"Not Answered"**.
- **Score Scale**:
  - `90–100`: Excellent
  - `75–89`: Good
  - `50–74`: Partially Correct
  - `25–49`: Weak
  - `1–24`: Mostly Incorrect
  - `0`: Not Answered

### 4. CSV Export — Only Asked & Matched Questions
- Contains **ONLY** the questions that the interviewer actually asked and that were successfully matched with the JSON dataset.
- Unasked JSON questions and unmatched attempts are **NOT** included in the CSV.
- **11 Standardized Columns**:
  1. `Interview ID`
  2. `Room Code`
  3. `Candidate Name`
  4. `Interviewer's Original Question`
  5. `Matched JSON Question`
  6. `Expected Answer`
  7. `Candidate's Actual Answer`
  8. `Similarity Score`
  9. `Evaluation Status`
  10. `AI Feedback`
  11. `Interview Date`
- UTF-8 BOM (`\uFEFF`) ensures complete compatibility with Microsoft Excel, Apple Numbers, and Google Sheets.

### 5. Overall Interview Score Formula
Calculated using **ONLY** the successfully matched questions that the interviewer actually asked:
$$\text{Overall Score} = \left( \frac{\sum \text{Scores of Asked and Matched Questions}}{\text{Total Number of Asked and Matched Questions}} \right) \times 100\%$$
- Unanswered and unknown answers count as zero.
- Questions that were never asked or could not be matched do not affect the overall score.
- Dashboard displays:
  - Total Questions Asked
  - Successfully Matched Questions
  - Answered Questions
  - Unanswered Questions
  - Overall Interview Score

---

## 🛠️ Fixing Common Port & WebSocket Errors

### Error 1: `EADDRINUSE: address already in use :::5001`
**Cause**: A previous server instance was left running in the background holding port `5001`.
**Solution**: Run the new clean script to kill any process holding ports `5001` or `5173`:
```bash
npm run clean:ports
```

### Error 2: `Port 5173 is in use, trying another one... Vite ws proxy socket error EPIPE / ECONNRESET`
**Cause**: When port `5173` is occupied, Vite moves to `5174`, which disrupts the proxy mapping to the backend, causing WebSocket reset errors.
**Solution**:
1. Run `npm run clean:ports`.
2. Start both server and client together with:
   ```bash
   npm run dev
   ```
   *Note: `npm run dev` now uses `concurrently -k`, ensuring that when you press `Ctrl+C`, both server and client processes are terminated simultaneously, preventing orphaned ports.*

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment (`server/.env`)
Copy the sample environment file in `server/`:
```bash
cp server/.env.example server/.env
```
Default values work out of the box with the built-in local NLP Semantic Evaluator:
```env
PORT=5001
CORS_ORIGIN=http://localhost:5173

# Optional: Add your Gemini API key for Google Gemini LLM evaluations
GEMINI_API_KEY=

# STUN/TURN WebRTC Configuration
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

### 3. Start Development Servers
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001`

---

## 🧪 Testing with Two Separate Browser Sessions

1. **Session 1 (Interviewer)**:
   - Open Chrome and visit `http://localhost:5173`.
   - Click **"Join as Interviewer"**.
   - Copy the generated Room Code (e.g. `INT-8X92K`).
   - Allow camera and microphone permissions.

2. **Session 2 (Candidate)**:
   - Open an **Incognito Window** (or a second browser like Brave, Safari, Edge) and visit `http://localhost:5173`.
   - Click **"Join as Candidate"**.
   - Enter name (e.g. `Alex Morgan`) and the Room Code.
   - Enter the waiting room.

3. **Start Interview**:
   - In Session 1, click **"Start Interview"**.
   - Both windows establish peer-to-peer WebRTC video and audio.
   - Observe that the **Candidate screen is Video Only**: no questions, no scores, no evaluation cards.

4. **Dynamic Question Asking (Interviewer)**:
   - In Session 1, enter a question in natural language:
     > *"Can you explain how var, let and const are different?"*
   - Click **"Ask Question"**.
   - The system matches with: `What is the difference between var, let, and const?` (Confidence: 94%).
   - Displays the expected answer and target technical keywords for the interviewer.

5. **Answer Evaluation & Speech Recognition**:
   - In Session 2 (Candidate), speak into the microphone:
     > *"var is function scoped, while let and const are block scoped. const cannot be reassigned."*
   - In Session 1 (Interviewer), observe the candidate's speech appearing in real time, followed by the AI similarity score (e.g. `85-92 / 100`), status (`Excellent / Good`), and feedback.
   - The candidate sees only the video interview.

6. **Test Unknown Answer Detection**:
   - In Session 1, ask another question (e.g. *"What is Database Indexing?"*).
   - In Session 2, candidate says: *"I don't know the answer to this question, sorry."*
   - System flags it as **"Not Answered"** with **`0` points**.

7. **Test Unmatched Question**:
   - In Session 1, enter an unrelated question: *"What is your favorite food?"*
   - Click **"Ask Question"**.
   - Observe the warning **"No Matching Question Found"**. Answer evaluation is safely blocked.

8. **End Interview & Export CSV**:
   - In Session 1, click **"End & Finalize"** and confirm.
   - Both sessions transition to the **Result Dashboard**.
   - Summary statistics and overall score are calculated **only** on asked and matched questions.
   - Click **"Export CSV Report"** to download the CSV report.

---

## 📜 License
MIT License.
