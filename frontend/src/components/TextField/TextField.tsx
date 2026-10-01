import { useId, type InputHTMLAttributes } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** The message from the 422 bag, e.g. error.fieldError("email"). */
  error?: string;
}

export function TextField({ label, error, className = "", ...props }: TextFieldProps) {
  // useId gives a unique, SSR-safe id per instance, which is what ties <label> to <input> so
  // clicking the label focuses the field and screen readers announce the two together.
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={id}
        // These two are the accessible half of the red border: they tell assistive tech that the
        // field is invalid and which text explains why.
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-1 disabled:opacity-60 dark:bg-slate-900 dark:text-slate-100 ${
          error
            ? "border-red-400 focus:outline-red-500"
            : "border-slate-300 focus:outline-slate-900 dark:border-slate-700 dark:focus:outline-slate-400"
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
