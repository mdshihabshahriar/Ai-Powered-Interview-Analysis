import { config } from '../config.js';
export async function evaluateWithGemini(question, expectedAnswer, candidateAnswer, keywords) {
    if (!config.geminiApiKey) {
        return null;
    }
    const prompt = `You are a Senior Technical Interview Assessor conducting a live technical interview evaluation.
Evaluate the candidate's spoken transcribed answer against the expected answer and technical keywords.

QUESTION:
"${question}"

EXPECTED ANSWER:
"${expectedAnswer}"

CORE TECHNICAL KEYWORDS / CONCEPTS:
${JSON.stringify(keywords)}

CANDIDATE'S SPOKEN ANSWER:
"${candidateAnswer}"

EVALUATION INSTRUCTIONS:
1. Determine if the answer is semantically accurate. Different phrasing or natural conversational explanations that convey the correct concepts MUST be awarded full or near-full credit.
2. Detect if the candidate said "I don't know", passed, expressed ignorance, or gave an empty response. In that case, score MUST be 0 and status "Not Answered".
3. Detect if the response is completely irrelevant or just casual chit-chat.
4. Score scale (0 to 100):
   - 90-100: "Excellent" (thorough, conceptually sound, hits key principles)
   - 75-89: "Good" (solid understanding, covers main points)
   - 50-74: "Partially Correct" (has some truth or basic points, misses core mechanics)
   - 25-49: "Weak" (vague, confusing, or minimal understanding)
   - 1-24: "Mostly Incorrect" (factually flawed or wrong technical claims)
   - 0: "Not Answered" (explicit "I don't know", no answer, or completely unrelated)

Return strictly valid JSON with no markdown wrapping or additional text:
{
  "score": number,
  "status": "Excellent" | "Good" | "Partially Correct" | "Weak" | "Mostly Incorrect" | "Not Answered" | "Needs Review",
  "feedback": "Concise 1-3 sentence assessment highlighting strengths and omissions",
  "matchedKeywords": ["list", "of", "keywords", "present", "in", "concept"],
  "missingKeywords": ["list", "of", "missing", "keywords"],
  "isUnknownResponse": boolean
}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                },
            }),
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            console.warn(`[Gemini API] Request returned status ${response.status}: ${response.statusText}`);
            return null;
        }
        const data = (await response.json());
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText)
            return null;
        // Clean JSON markdown if wrapped
        const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);
        return {
            score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
            status: parsed.status,
            feedback: String(parsed.feedback || 'Evaluated by AI assessor.'),
            matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
            missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
            isUnknownResponse: Boolean(parsed.isUnknownResponse),
        };
    }
    catch (err) {
        console.warn('[Gemini Evaluator] Fallback to local NLP evaluator due to error:', err?.message || err);
        return null;
    }
}
