"use client";

import * as React from "react";
import { Controller, FormProvider, type ControllerProps, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";

export function Form<TFieldValues extends FieldValues>({ children, ...props }: UseFormReturn<TFieldValues> & { children: React.ReactNode }) {
  const { formState, ...rest } = props as any;
  return <FormProvider {...(props as any)}>{children}</FormProvider>;
}

export function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({ control, name, render }: ControllerProps<TFieldValues, TName>) {
  return <Controller control={control} name={name} render={render as any} />;
}

export function FormItem(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-2 ${props.className || ''}`} {...props} />;
}

export function FormLabel(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`block text-sm font-medium ${props.className || ''}`} {...props} />;
}

export function FormControl(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={props.className} {...props} />;
}

export function FormMessage(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs text-red-600 ${props.className || ''}`}>{props.children}</p>;
}

export function FormDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs text-gray-500 ${props.className || ''}`}>{props.children}</p>;
}


