import { z } from 'zod';

/**
 * Shared auth field rules. Limits mirror the backend request schemas
 * (backend/app/schemas/auth.py and user.py) so input the API would reject with
 * a 422 is caught inline first. The complexity rules are a stricter frontend
 * policy layered on top of the backend's length limits.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const FULL_NAME_MAX_LENGTH = 255;

export const PASSWORD_POLICY_HINT =
  'At least 8 characters, with 1 uppercase letter and 1 number.';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Must include at least one uppercase letter')
  .regex(/[0-9]/, 'Must include at least one number');

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(FULL_NAME_MAX_LENGTH, `Full name must be at most ${FULL_NAME_MAX_LENGTH} characters`);

export const confirmPasswordSchema = z.string().min(1, 'Please confirm your password');

export const PASSWORDS_DO_NOT_MATCH = 'Passwords do not match';

/** Message for any thrown auth error, falling back when it carries none. */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
