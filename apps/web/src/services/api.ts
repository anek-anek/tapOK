import axios from 'axios';
import { getApiUrl } from '@/lib/config';

export const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true, // sends better-auth.session_token cookie on every request
});

// Kept for backward compat — BetterAuth uses cookies, not Bearer tokens.
// Callers that still call setAuthToken() are no-ops until cleaned up.
export function setAuthToken(_token: string | null) {}
