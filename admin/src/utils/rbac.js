// Role-Based Access Control (RBAC) Configuration for Ordersly Admin Panel

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EDITOR: 'editor',
  STAFF: 'staff'
};

export const ROLE_CONFIG = {
  superadmin: {
    key: 'superadmin',
    label: 'Super Admin',
    color: '#DC2626',
    bg: '#FEE2E2',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    desc: 'Unrestricted root access to all store modules, settings & team users',
    allowedRoutes: [
      '/',
      '/homepage-settings',
      '/categories',
      '/occasions',
      '/brands',
      '/hero-slides',
      '/products',
      '/combos',
      '/orders',
      '/settings/delivery',
      '/coupons',
      '/customers',
      '/bi-reports',
      '/admin-users',
      '/settings'
    ],
    permissions: ['all', 'manage_users', 'manage_settings', 'view_bi', 'edit_products', 'delete_products', 'manage_orders', 'manage_pricing']
  },
  admin: {
    key: 'admin',
    label: 'Administrator',
    color: '#7C3AED',
    bg: '#EDE9FE',
    borderColor: 'rgba(124, 58, 237, 0.3)',
    desc: 'Store management (orders, catalog, deliveries, coupons & BI reports)',
    allowedRoutes: [
      '/',
      '/homepage-settings',
      '/categories',
      '/occasions',
      '/brands',
      '/hero-slides',
      '/products',
      '/combos',
      '/orders',
      '/settings/delivery',
      '/coupons',
      '/customers',
      '/bi-reports',
      '/admin-users',
      '/settings'
    ],
    permissions: ['manage_settings', 'view_bi', 'edit_products', 'delete_products', 'manage_orders', 'manage_pricing']
  },
  manager: {
    key: 'manager',
    label: 'Store Manager',
    color: '#2563EB',
    bg: '#DBEAFE',
    borderColor: 'rgba(37, 99, 235, 0.3)',
    desc: 'Inventory control, stock & pricing matrix, order processing & sales analytics',
    allowedRoutes: [
      '/',
      '/products',
      '/combos',
      '/orders',
      '/customers',
      '/bi-reports',
      '/settings/delivery'
    ],
    permissions: ['view_bi', 'edit_products', 'manage_orders', 'manage_pricing', 'view_inventory']
  },
  editor: {
    key: 'editor',
    label: 'Catalog Editor',
    color: '#059669',
    bg: '#D1FAE5',
    borderColor: 'rgba(5, 150, 105, 0.3)',
    desc: 'Homepage CMS, categories, product tags, media gallery & combos management',
    allowedRoutes: [
      '/',
      '/homepage-settings',
      '/categories',
      '/occasions',
      '/brands',
      '/hero-slides',
      '/products',
      '/combos'
    ],
    permissions: ['edit_products', 'manage_cms', 'manage_categories']
  },
  staff: {
    key: 'staff',
    label: 'Staff / Support',
    color: '#4B5563',
    bg: '#F3F4F6',
    borderColor: 'rgba(75, 85, 99, 0.3)',
    desc: 'Order fulfillment, dispatch tracking & customer service management',
    allowedRoutes: [
      '/',
      '/orders',
      '/customers'
    ],
    permissions: ['manage_orders', 'view_customers']
  }
};

export const normalizeRole = (role) => {
  const norm = String(role || 'admin').toLowerCase().trim();
  if (norm === 'administrator') return 'admin';
  if (norm === 'super admin' || norm === 'super_admin') return 'superadmin';
  if (norm === 'store manager' || norm === 'store_manager') return 'manager';
  if (norm === 'catalog editor' || norm === 'catalog_editor') return 'editor';
  if (norm === 'support' || norm === 'customer support') return 'staff';
  return ROLE_CONFIG[norm] ? norm : 'admin';
};

export const getRoleConfig = (role) => {
  const norm = normalizeRole(role);
  return ROLE_CONFIG[norm] || ROLE_CONFIG.admin;
};

export const canAccessRoute = (role, path) => {
  const norm = normalizeRole(role);
  const config = ROLE_CONFIG[norm];
  if (!config) return false;
  if (norm === 'superadmin') return true;

  const base = path === '/' ? '/' : `/${path.replace(/^\//, '').split('/')[0]}`;
  const full = `/${path.replace(/^\//, '')}`;

  return config.allowedRoutes.includes(full) || config.allowedRoutes.includes(base);
};

export const hasPermission = (role, permission) => {
  const norm = normalizeRole(role);
  const config = ROLE_CONFIG[norm];
  if (!config) return false;
  if (norm === 'superadmin' || config.permissions.includes('all')) return true;
  return config.permissions.includes(permission);
};
