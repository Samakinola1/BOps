export function hasPermission(user: any, permission: string): boolean {
  if (!user || !user.businessUser) return false;
  
  const roleName = user.businessUser.roleName;
  
  // Owner has absolute permissions
  if (roleName === 'Owner') return true;
  
  // Custom permissions from custom roles
  if (user.businessUser.role && user.businessUser.role.permissions) {
    const list = user.businessUser.role.permissions.split(',').map((p: string) => p.trim());
    return list.includes(permission) || list.includes('*');
  }
  
  // Fallbacks for default roles
  if (roleName === 'Admin') {
    return true;
  }
  
  if (roleName === 'Manager') {
    const managerAllowed = [
      'view:dashboard',
      'view:invoices', 'manage:invoices',
      'view:quotations', 'manage:quotations',
      'view:inventory', 'manage:inventory',
      'view:customers', 'manage:customers'
    ];
    return managerAllowed.includes(permission);
  }
  
  if (roleName === 'Staff') {
    const staffAllowed = [
      'view:dashboard',
      'view:invoices',
      'view:quotations',
      'view:inventory',
      'view:customers'
    ];
    return staffAllowed.includes(permission);
  }
  
  return false;
}
