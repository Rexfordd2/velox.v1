import type { FieldValues, UseFormSetError } from 'react-hook-form';

export type NormalizedFieldErrors = Record<string, string[]>;

export function extractFieldErrors(error: any): {
  formErrors: string[];
  fieldErrors: NormalizedFieldErrors;
  message: string;
} {
  const data = error?.data || error?.shape?.data || {};
  const message = data?.message || error?.message || 'Request failed';
  const fieldErrors: NormalizedFieldErrors = data?.fieldErrors || {};
  const formErrors: string[] = data?.formErrors || [];
  return { fieldErrors, formErrors, message };
}

export function applyFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  error: any
) {
  const { fieldErrors, formErrors } = extractFieldErrors(error);
  for (const [path, messages] of Object.entries(fieldErrors)) {
    const msg = Array.isArray(messages) ? messages[0] : String(messages);
    setError(path as any, { message: msg, type: 'server' });
  }
  if (formErrors?.length) {
    // Attach to root
    setError('root' as any, { message: formErrors[0], type: 'server' });
  }
}


