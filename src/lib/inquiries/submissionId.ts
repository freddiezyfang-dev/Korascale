const SUBMISSION_ID_PATTERN = /^KS-\d{8}-[A-Z0-9]{6}$/;

function randomSuffix(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

export function formatSubmissionIdDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function generateSubmissionId(date = new Date()): string {
  return `KS-${formatSubmissionIdDate(date)}-${randomSuffix(6)}`;
}

export function isValidSubmissionIdFormat(value: string): boolean {
  return SUBMISSION_ID_PATTERN.test(value);
}
