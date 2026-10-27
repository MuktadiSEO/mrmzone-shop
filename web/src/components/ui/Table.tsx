import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

export function Table({ className, children, ...rest }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full min-w-[640px] border-collapse text-sm", className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...rest }: ComponentProps<"th">) {
  return <th scope="col" className={cn("whitespace-nowrap border-b border-line bg-surface px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted", className)} {...rest} />;
}

export function Td({ className, ...rest }: ComponentProps<"td">) {
  return <td className={cn("border-b border-line px-3 py-2.5 align-middle text-ink", className)} {...rest} />;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-muted">
        {children}
      </td>
    </tr>
  );
}
