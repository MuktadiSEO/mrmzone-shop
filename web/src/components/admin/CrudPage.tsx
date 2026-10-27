"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { adminApi, ApiError, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import type { Paginated } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { AdminPager, ConfirmButton, ImageUpload, PageHeader } from "./common";
import { useToast } from "./Toast";

export type FieldType = "text" | "number" | "textarea" | "select" | "checkbox" | "date" | "datetime" | "image" | "password" | "email" | "color" | "html";

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
  hint?: string;
  full?: boolean;
  placeholder?: string;
}

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

type Values = Record<string, unknown>;

interface CrudPageProps<T extends { id: number }> {
  title: string;
  subtitle?: string;
  endpoint: string; // e.g. "/categories"
  columns: Column<T>[];
  fields?: Field[];
  defaults?: Values;
  toForm?: (row: T) => Values;
  toBody?: (values: Values) => Values;
  searchable?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  rowActions?: (row: T, reload: () => void) => ReactNode;
  headerActions?: ReactNode;
  extraQuery?: Record<string, string>;
}

export function FieldInput({ f, value, onChange, error }: { f: Field; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  const common = { label: f.label, required: f.required, hint: f.hint, error, placeholder: f.placeholder };
  switch (f.type) {
    case "textarea":
    case "html":
      return <Textarea {...common} rows={f.type === "html" ? 8 : 3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={f.type === "html" ? "font-mono text-xs" : undefined} />;
    case "select":
      return (
        <Select {...common} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      );
    case "checkbox":
      return <Checkbox label={f.label} checked={!!value} onChange={(e) => onChange(e.target.checked)} className="pt-6" />;
    case "image":
      return <ImageUpload label={f.label} value={(value as string) ?? null} onChange={onChange} />;
    case "number":
      return <Input {...common} type="number" inputMode="decimal" value={value === null || value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} className="font-display" />;
    case "datetime":
      return <Input {...common} type="datetime-local" value={value ? String(value).slice(0, 16) : ""} onChange={(e) => onChange(e.target.value || null)} />;
    case "color":
      return <Input {...common} type="color" value={String(value ?? "#078080")} onChange={(e) => onChange(e.target.value)} className="h-11 p-1" />;
    default:
      return <Input {...common} type={f.type ?? "text"} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function CrudPage<T extends { id: number }>({
  title, subtitle, endpoint, columns, fields = [], defaults = {}, toForm, toBody, searchable = true,
  canCreate = true, canEdit = true, canDelete = true, rowActions, headerActions, extraQuery,
}: CrudPageProps<T>) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, loading, error, reload } = useAdminQuery<Paginated<T>>(endpoint, { page, search: q, ...extraQuery });
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startCreate = () => { setEditing(null); setValues({ ...defaults }); setErrors({}); setFormErr(null); setOpen(true); };
  const startEdit = (row: T) => { setEditing(row); setValues(toForm ? toForm(row) : { ...(row as unknown as Values) }); setErrors({}); setFormErr(null); setOpen(true); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormErr(null);
    setErrors({});
    try {
      const body = toBody ? toBody(values) : values;
      if (editing) await adminApi.put(`${endpoint}/${editing.id}`, body);
      else await adminApi.post(endpoint, body);
      toast(editing ? "Updated" : "Created");
      setOpen(false);
      reload();
    } catch (err) {
      if (err instanceof ApiError) {
        const fe: Record<string, string> = {};
        Object.entries(err.errors || {}).forEach(([k, v]) => (fe[k] = v[0]));
        setErrors(fe);
      }
      setFormErr(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: T) => {
    try {
      await adminApi.del(`${endpoint}/${row.id}`);
      toast("Deleted");
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const rows = data?.data ?? [];
  const colCount = columns.length + 1;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<>{headerActions}{canCreate && fields.length > 0 && <Button variant="accent" onClick={startCreate} icon={<Plus className="h-4 w-4" />}>Add new</Button>}</>}
      />
      <Card>
        {searchable && (
          <form className="flex gap-2 border-b border-line p-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <label htmlFor={`search-${endpoint}`} className="sr-only">Search</label>
              <input id={`search-${endpoint}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-10 w-full rounded-xl border border-line pr-3 pl-9 text-sm focus:border-teal focus:outline-none" />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
        )}
        {error && <div className="p-3"><Alert>{error}</Alert></div>}
        <Table>
          <thead>
            <tr>
              {columns.map((c) => <Th key={c.key} className={c.className}>{c.label}</Th>)}
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <EmptyRow colSpan={colCount}><Spinner /></EmptyRow>
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={colCount}>No records yet</EmptyRow>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface/60">
                  {columns.map((c) => (
                    <Td key={c.key} className={c.className}>{c.render ? c.render(row) : String((row as unknown as Values)[c.key] ?? "—")}</Td>
                  ))}
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      {rowActions?.(row, reload)}
                      {canEdit && fields.length > 0 && <Button size="sm" variant="outline" onClick={() => startEdit(row)} aria-label="Edit" icon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>}
                      {canDelete && <ConfirmButton size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onConfirm={() => remove(row)} aria-label="Delete" message="Delete this record?"><Trash2 className="h-4 w-4" /></ConfirmButton>}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        {data?.meta && <AdminPager page={data.meta.current_page} last={data.meta.last_page} total={data.meta.total} onPage={setPage} />}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${editing ? "Edit" : "Add"} ${title.replace(/s$/, "")}`}
        size="lg"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="accent" type="submit" form="crud-form" loading={busy}>Save</Button></>}
      >
        <form id="crud-form" onSubmit={save} className="grid gap-3.5 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={f.full || f.type === "textarea" || f.type === "html" ? "sm:col-span-2" : undefined}>
              <FieldInput f={f} value={values[f.name]} onChange={(v) => setValues((x) => ({ ...x, [f.name]: v }))} error={errors[f.name]} />
            </div>
          ))}
          {formErr && <div className="sm:col-span-2"><Alert>{formErr}</Alert></div>}
        </form>
      </Modal>
    </>
  );
}
