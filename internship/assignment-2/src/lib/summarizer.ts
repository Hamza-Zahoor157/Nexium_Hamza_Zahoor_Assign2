export function generateMockSummary(text: string): string {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length <= 3) return text;

  const importantSentences = [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1]
  ];

  return importantSentences
    .filter(s => s)
    .join('. ') + (sentences.length > 3 ? '...' : '');
}
