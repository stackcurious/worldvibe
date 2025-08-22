"use client";

import * as React from "react";
import { createContext, useContext, useId } from "react";
import { 
  ControllerProps, 
  FieldPath, 
  FieldValues, 
  FormProvider, 
  useFormContext,
  UseFormReturn, 
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slot } from "@radix-ui/react-slot";

/**
 * Form context to track field state, errors, and validation
 */
const FormItemContext = createContext<{
  id: string;
  name: string;
}>({ id: "", name: "" });

/**
 * Main Form component - wraps react-hook-form's FormProvider
 */
const Form = <
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
>({
  ...props
}: Omit<React.ComponentProps<typeof FormProvider<TFieldValues, TContext>>, "children"> & {
  children: React.ReactNode;
  className?: string;
}) => {
  return <FormProvider {...props}>{props.children}</FormProvider>;
};

/**
 * FormField component - connects form controls to react-hook-form
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  const { control, name, defaultValue, rules, shouldUnregister, disabled, render } = props;
  
  // This implementation delegates to react-hook-form's Controller
  // but could be enhanced with additional functionality
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      rules={rules}
      shouldUnregister={shouldUnregister}
      disabled={disabled}
      render={render}
    />
  );
};

/**
 * Wraps individual form items and provides context
 */
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = useId();
  const name = String(useId());
  
  return (
    <FormItemContext.Provider value={{ id, name }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

/**
 * Form label with automatic connection to inputs
 */
const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { id } = useFormItemContext();
  
  return (
    <Label
      ref={ref}
      className={cn(className)}
      htmlFor={id}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

/**
 * Wrapper for form controls with context awareness
 */
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { id, name } = useFormItemContext();
  const { formState } = useFormContext();
  const { errors } = formState;

  // Check if the current field has an error
  const fieldError = errors[name];
  const hasError = !!fieldError;
  
  return (
    <Slot
      ref={ref}
      id={id}
      name={name}
      aria-describedby={hasError ? `${id}-error` : undefined}
      aria-invalid={hasError}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

/**
 * Displays validation error messages
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    forceMessage?: React.ReactNode;
  }
>(({ className, children, forceMessage, ...props }, ref) => {
  const { name } = useFormItemContext();
  const { formState } = useFormContext();
  const { errors } = formState;
  
  // Get error message for this specific field
  const fieldError = errors[name];
  const errorMessage = fieldError?.message;
  const hasError = !!errorMessage;
  
  if (!hasError && !forceMessage) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={`${name}-error`}
      className={cn(
        "text-sm font-medium text-red-500 dark:text-red-400 animate-entrance",
        className
      )}
      {...props}
    >
      {forceMessage ? forceMessage : errorMessage}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

/**
 * Optional description text for form fields
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { id } = useFormItemContext();
  
  return (
    <p
      ref={ref}
      id={`${id}-description`}
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

/**
 * Utility hook to access form item context
 */
function useFormItemContext() {
  const context = useContext(FormItemContext);
  
  if (!context) {
    throw new Error("useFormItemContext must be used within a FormItem");
  }
  
  return context;
}

/**
 * Utility hook to access form context with type safety
 */
const useFormField = () => {
  const fieldContext = useFormItemContext();
  const { getFieldState, formState } = useFormContext();
  
  const fieldState = getFieldState(fieldContext.name, formState);
  
  return {
    id: fieldContext.id,
    name: fieldContext.name,
    formItemId: `${fieldContext.id}-form-item`,
    formDescriptionId: `${fieldContext.id}-form-item-description`,
    formMessageId: `${fieldContext.id}-form-item-message`,
    ...fieldState,
  };
};

/**
 * Import from react-hook-form to ensure consistent API
 */
const { Controller } = require("react-hook-form");

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
};