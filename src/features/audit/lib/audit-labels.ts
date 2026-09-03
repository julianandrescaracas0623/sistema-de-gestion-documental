const ACTION_LABELS: Record<string, string> = {
  login: "Inicio de sesión",
  "document.upload": "Subió documento",
  "document.update": "Editó documento",
  "document.delete": "Eliminó documento",
  "document.download": "Descargó documento",
  "document.export": "Exportó documentos",
  "user.create": "Creó usuario",
  "user.delete": "Eliminó usuario",
  "role.create": "Creó rol",
  "role.update": "Editó rol",
  "role.delete": "Eliminó rol",
  "category.create": "Creó categoría",
  "category.update": "Editó categoría",
  "category.delete": "Eliminó categoría",
  "tag.create": "Creó etiqueta",
  "tag.update": "Editó etiqueta",
  "tag.delete": "Eliminó etiqueta",
  "audit.export": "Exportó la actividad",
};

const ENTITY_LABELS: Record<string, string> = {
  document: "Documento",
  user: "Usuario",
  role: "Rol",
  category: "Categoría",
  tag: "Etiqueta",
  session: "Sesión",
  audit: "Actividad",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function entityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

export function isDestructiveAction(action: string): boolean {
  return action.endsWith(".delete");
}
