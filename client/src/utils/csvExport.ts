import { AskedQuestionRecord, InterviewSummary } from '../types/index.js';

export function exportInterviewCSV(
  roomId: string,
  candidateName: string,
  askedQuestions: AskedQuestionRecord[],
  summary: InterviewSummary,
  interviewDateStr?: string
) {
  const dateFormatted = interviewDateStr
    ? new Date(interviewDateStr).toLocaleDateString()
    : new Date().toLocaleDateString();

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  // Only include questions that were actually asked and successfully matched with JSON dataset
  const matchedAskedQuestions = askedQuestions.filter((q) => q.isMatched);

  const headers = [
    'Interview ID',
    'Room Code',
    'Candidate Name',
    "Interviewer's Original Question",
    'Matched JSON Question',
    'Expected Answer',
    "Candidate's Actual Answer",
    'Similarity Score',
    'Evaluation Status',
    'AI Feedback',
    'Interview Date',
  ];

  const rows = matchedAskedQuestions.map((q) => {
    const candidateAns = q.candidateAnswer ? q.candidateAnswer : 'Not Answered';
    return [
      escapeCsv(roomId),
      escapeCsv(roomId),
      escapeCsv(candidateName || 'Candidate'),
      escapeCsv(q.interviewerQuestion),
      escapeCsv(q.matchedQuestion || ''),
      escapeCsv(q.matchedExpectedAnswer || ''),
      escapeCsv(candidateAns),
      escapeCsv(q.similarityScore),
      escapeCsv(q.evaluationStatus),
      escapeCsv(q.aiFeedback),
      escapeCsv(dateFormatted),
    ].join(',');
  });

  const summarySection = [
    '',
    '--- FINAL INTERVIEW SUMMARY ---,,,,,,,,,,',
    `Overall Interview Score,${summary.overallScore}%,,,,,,,,,`,
    `Total Questions Asked,${summary.totalQuestionsAsked},,,,,,,,,`,
    `Successfully Matched Questions,${summary.successfullyMatchedQuestions},,,,,,,,,`,
    `Answered Questions,${summary.answeredCount},,,,,,,,,`,
    `Unanswered Questions,${summary.unansweredCount},,,,,,,,,`,
    `Average Score of Answered Questions,${summary.averageAnsweredScore}%,,,,,,,,,`,
  ];

  // UTF-8 BOM (\uFEFF) ensures Microsoft Excel and Numbers render correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows, ...summarySection].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Interview-Report-${roomId}-${(candidateName || 'Candidate').replace(/\s+/g, '_')}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
