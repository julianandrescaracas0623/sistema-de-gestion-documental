-- Optional seed for document categories (run once in Supabase SQL Editor after migrations).

insert into public.categories (name, description, color, sort_order)
select v.name, v.description, v.color, v.sort_order
from (
  values
    ('Facturación'::text, 'Documentos de facturación y cartera'::text, '#2563eb'::text, 1),
    ('Recursos humanos', 'Contratos, nóminas y gestión del talento', '#059669', 2),
    ('Soporte operativo', 'Soportes y trazabilidad de servicios', '#d97706', 3),
    ('General', 'Otros documentos administrativos', '#6b7280', 99)
) as v(name, description, color, sort_order)
where not exists (
  select 1 from public.categories c where c.name = v.name
);
