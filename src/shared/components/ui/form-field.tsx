import * as React from "react"

import { Label } from "@/shared/components/ui/label"
import { cn } from "@/shared/lib/utils"

export interface FormFieldRenderProps {
  id: string
  "aria-invalid": true | undefined
  "aria-describedby": string | undefined
}

interface FormFieldProps {
  id: string
  label: React.ReactNode
  /** Validation message. When set, the control is marked invalid and linked to it. */
  error?: string | undefined
  /** Optional helper text shown under the label when there is no error. */
  hint?: React.ReactNode
  /** Marks the label with a required indicator. */
  required?: boolean
  className?: string
  children: (field: FormFieldRenderProps) => React.ReactNode
}

/**
 * Wires a label, control and error message together with the ARIA attributes
 * screen readers need (`aria-invalid`, `aria-describedby`). Pass the control
 * via the render prop and spread the provided field props onto it.
 */
export function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = error !== undefined ? errorId : hint !== undefined ? hintId : undefined

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {hint !== undefined && error === undefined ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
      {children({
        id,
        "aria-invalid": error !== undefined ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error !== undefined ? (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
