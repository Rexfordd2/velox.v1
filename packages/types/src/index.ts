export * from './session';
export * from './analysis';

export interface ApiErrorData {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}

export type FieldErrorMap = Record<string, string | string[]>;