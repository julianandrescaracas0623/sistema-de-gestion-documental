"use client";

import type { RoleOption } from "@/features/user-admin/queries/users.queries";

export function RoleFilterSelect({ value, roles }: { value: string; roles: RoleOption[] }) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    const params = new URLSearchParams();
    if (role !== "") params.set("role", role);
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    window.location.href = `/admin/users${qs}`;
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
    >
      <option value="">Todos los roles</option>
      {roles.map((r) => (
        <option key={r.id} value={r.slug}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
