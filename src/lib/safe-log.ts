/**
 * Log an error without the personal data it may carry.
 *
 * Prisma validation errors embed the full query arguments in their message
 * (names, e-mails, phone numbers of contact / quote requests). Logging the raw
 * error would copy that personal data into the container logs (law 09-08).
 * We keep only the error class, the Prisma error code and the first line of
 * the message, which is enough to debug without exposing the submitter.
 */
export function logSafeError(context: string, error: unknown): void {
  if (error && typeof error === 'object') {
    const err = error as { name?: unknown; code?: unknown; message?: unknown };
    const name = typeof err.name === 'string' ? err.name : 'Error';
    const code = typeof err.code === 'string' ? ` code=${err.code}` : '';
    const isPrismaValidation = name === 'PrismaClientValidationError';
    const firstLine =
      !isPrismaValidation && typeof err.message === 'string'
        ? ` ${err.message.split('\n')[0].slice(0, 200)}`
        : '';
    console.error(`${context}: ${name}${code}${firstLine}`);
    return;
  }
  console.error(`${context}: unknown error`);
}
