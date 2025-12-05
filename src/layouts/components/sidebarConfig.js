export const sidebarConfig = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "chart",
    path: "/",
    implemented: true
  },
  {
    key: "admin",
    label: "Administración",
    color: "#dc2626",
    icon: "shield-check",
    requiredRole: "SUPER_ADMIN",
    children: [
      { key: "municipalidades", label: "Municipalidades", path: "/admin/municipalidades", icon: "building-2", implemented: true },
      { key: "suscripciones", label: "Suscripciones", path: "/admin/suscripciones", icon: "credit-card", implemented: false, badge: "Próximamente" },
      { key: "facturacion", label: "Facturación", path: "/admin/facturacion", icon: "receipt", implemented: false, badge: "Próximamente" },
      { key: "onboarding", label: "Onboarding", path: "/admin/onboarding", icon: "user-plus", implemented: false, badge: "Próximamente" }
    ]
  },
  {
    key: "assets",
    label: "Activos",
    color: "#34d399",
    icon: "box",
    children: [
      { key: "bienes", label: "Bienes", path: "/bienes", icon: "package", implemented: true },
      { key: "categorias", label: "Categorías", path: "/categorias", icon: "tag", implemented: true },
      { key: "proveedores", label: "Proveedores", path: "/proveedores", icon: "truck", implemented: true },
      { key: "ubicaciones", label: "Ubicaciones Físicas", path: "/ubicaciones", icon: "map-pin", implemented: true }
    ]
  },
  {
    key: "operations",
    label: "Operaciones",
    color: "#f59e0b",
    icon: "swap",
    children: [
      { key: "movimientos", label: "Movimientos", path: "/movimientos", icon: "arrow-right", implemented: true },
      { key: "actas", label: "Actas de Entrega", path: "/actas", icon: "file-text", implemented: true },
      { key: "inventarios", label: "Inventarios", path: "/inventarios", icon: "clipboard", implemented: true },
      { key: "mantenimientos", label: "Mantenimientos", path: "/mantenimientos", icon: "tool", implemented: true }
    ]
  },
  {
    key: "users",
    label: "Usuarios y Seguridad",
    color: "#f97316",
    icon: "users",
    children: [
      { key: "usuarios", label: "Usuarios", path: "/usuarios", icon: "user", implemented: true },
      { key: "personas", label: "Personas", path: "/personas", icon: "user-check", implemented: true },
      { key: "roles", label: "Roles", path: "/roles", icon: "shield", implemented: true },
      { key: "permisos", label: "Permisos", path: "/permisos", icon: "lock", implemented: true },
      { key: "areas", label: "Áreas", path: "/areas", icon: "building", implemented: true },
      { key: "cargos", label: "Cargos", path: "/cargos", icon: "briefcase", implemented: true }
    ]
  },
  {
    key: "accounting",
    label: "Contabilidad",
    color: "#eab308",
    icon: "calculator",
    children: [
      { key: "bajas", label: "Bajas de Activos", path: "/bajas", icon: "trash", implemented: true },
      { key: "valores", label: "Historial de Valores", path: "/valores", icon: "dollar-sign", implemented: false, badge: "Próximamente" }
    ]
  },
  {
    key: "reports",
    label: "Reportes",
    color: "#8b5cf6",
    icon: "report",
    children: [
      { key: "reportes", label: "Reportes", path: "/reportes", icon: "bar-chart", implemented: false, badge: "Próximamente" },
      { key: "auditoria", label: "Auditoría", path: "/auditoria", icon: "shield", implemented: false, badge: "Próximamente" },
      { key: "notificaciones", label: "Notificaciones", path: "/notificaciones", icon: "bell", implemented: false, badge: "Próximamente" }
    ]
  },
  {
    key: "settings",
    label: "Configuración",
    color: "#94a3b8",
    icon: "cog",
    children: [
      { key: "sistema", label: "Sistema", path: "/sistema", icon: "settings", implemented: true }
    ]
  }
];
