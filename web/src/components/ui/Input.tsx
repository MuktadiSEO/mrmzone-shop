import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/format";

const fieldBase =
  "w-full rounded-xl border bg-white px-3.5 text-[0.95rem] text-navy placeholder:text-slate-400 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:bg-surface";

interface FieldWrap {
  label?: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  wrapClassName?: string;
}

function Wrap({ id, label, error, hint, required, wrapClassName, children }: FieldWrap & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", wrapClassName)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-navy">
          {label}
          {required && <span className="text-sale"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-[0.8rem] text-red-600" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-[0.8rem] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ label, error, hint, required, wrapClassName, className, id, ...rest }: ComponentProps<"input"> & FieldWrap) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} error={error} hint={hint} required={required} wrapClassName={wrapClassName}>
      <input
        id={fid}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-err` : undefined}
        className={cn(fieldBase, "h-11", error ? "border-red-400" : "border-line", className)}
        {...rest}
      />
    </Wrap>
  );
}

export function Textarea({ label, error, hint, required, wrapClassName, className, id, ...rest }: ComponentProps<"textarea"> & FieldWrap) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} error={error} hint={hint} required={required} wrapClassName={wrapClassName}>
      <textarea
        id={fid}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, "min-h-[88px] py-2.5", error ? "border-red-400" : "border-line", className)}
        {...rest}
      />
    </Wrap>
  );
}

export function Select({ label, error, hint, required, wrapClassName, className, id, children, ...rest }: ComponentProps<"select"> & FieldWrap) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} error={error} hint={hint} required={required} wrapClassName={wrapClassName}>
      <select
        id={fid}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, "h-11 pr-8", error ? "border-red-400" : "border-line", className)}
        {...rest}
      >
        {children}
      </select>
    </Wrap>
  );
}

export function Checkbox({ label, className, ...rest }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-sm text-navy", className)}>
      <input type="checkbox" className="h-4 w-4 rounded border-line accent-teal" {...rest} />
      {label}
    </label>
  );
}
