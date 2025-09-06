export function useAuth() {
  return { user: { id: 'test-user', email: 'test@example.com' } } as const;
}
