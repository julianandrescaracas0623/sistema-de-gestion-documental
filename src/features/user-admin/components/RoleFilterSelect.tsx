"use client";

export function RoleFilterSelect({ value }: { value: string }) {
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
      <option value="admin">Administrador</option>
      <option value="user">Usuario Administrativo</option>
    </select>
  );
}
