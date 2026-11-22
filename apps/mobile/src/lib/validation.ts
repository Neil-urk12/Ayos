/** Form validators. Each returns an error message, or undefined when the value is valid. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string) {
  const value = email.trim();
  if (!value) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address, like you@example.com.';
}

export function validateRequired(value: string, message: string) {
  if (!value.trim()) return message;
}

export function validateNewPassword(password: string) {
  if (!password) return 'Create a password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
}

export function validatePasswordMatch(password: string, confirm: string) {
  if (!confirm) return 'Re-enter your password.';
  if (password !== confirm) return 'Passwords don’t match.';
}
