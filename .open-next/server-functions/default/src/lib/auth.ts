/* ── User Accounts Storage Helper ────────────────────────────────── */
/* Client-side only localStorage persistence for DapurMind AI */

const STORAGE_KEY = 'dapurmind-users';

export interface UserAccount {
  username: string;
  password: string; // stored as-is (client-side only app)
  email?: string;
  createdAt: string;
}

/** Get all registered user accounts from localStorage */
export function getUserAccounts(): UserAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save accounts array to localStorage */
function saveAccounts(accounts: UserAccount[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

/**
 * Register a new user account.
 * Returns the created UserAccount on success, or { error: string } on failure.
 */
export function registerUser(
  username: string,
  password: string,
  email?: string
): UserAccount | { error: string } {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  if (!trimmedUsername || !trimmedPassword) {
    return { error: 'Username and password are required' };
  }

  const accounts = getUserAccounts();

  // Check for duplicate username (case-insensitive)
  const existing = accounts.find(
    (a) => a.username.toLowerCase() === trimmedUsername.toLowerCase()
  );
  if (existing) {
    return { error: 'Username is already taken' };
  }

  const newAccount: UserAccount = {
    username: trimmedUsername,
    password: trimmedPassword,
    email: email?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  saveAccounts(accounts);

  return newAccount;
}

/**
 * Authenticate a user by username and password.
 * Returns the matching UserAccount or null if credentials are invalid.
 */
export function authenticateUser(
  username: string,
  password: string
): UserAccount | null {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  if (!trimmedUsername || !trimmedPassword) return null;

  const accounts = getUserAccounts();
  return (
    accounts.find(
      (a) =>
        a.username.toLowerCase() === trimmedUsername.toLowerCase() &&
        a.password === trimmedPassword
    ) || null
  );
}

/**
 * Reset (change) a user's password.
 * Returns the updated UserAccount on success, or { error: string } on failure.
 */
export function resetPassword(
  username: string,
  newPassword: string
): UserAccount | { error: string } {
  const trimmedUsername = username.trim();
  const trimmedPassword = newPassword.trim();

  if (!trimmedUsername || !trimmedPassword) {
    return { error: 'Username and new password are required' };
  }

  const accounts = getUserAccounts();
  const index = accounts.findIndex(
    (a) => a.username.toLowerCase() === trimmedUsername.toLowerCase()
  );

  if (index === -1) {
    return { error: 'Username not found' };
  }

  accounts[index].password = trimmedPassword;
  saveAccounts(accounts);

  return accounts[index];
}
