// Role-based utility functions

export const hasRole = (userRoles, allowedRoles) => {
  if (!userRoles || userRoles.length === 0) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  
  return userRoles.some(role => 
    allowedRoles.includes(role.role || role)
  );
};

export const getUserRoles = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.roles || [];
};

export const isAdmin = () => {
  const roles = getUserRoles();
  return hasRole(roles, ['Admin']);
};

export const isManager = () => {
  const roles = getUserRoles();
  return hasRole(roles, ['Manager']);
};

export const isEmployee = () => {
  const roles = getUserRoles();
  return hasRole(roles, ['Employee']);
};

export const isManagement = () => {
  const roles = getUserRoles();
  return hasRole(roles, ['Management']);
};

export const canAccessPage = (pageName) => {
  const roles = getUserRoles();
  const roleNames = roles.map(r => r.role || r);
  
  const pagePermissions = {
    dashboard: ['Admin', 'Manager', 'Employee', 'Management'],
    departments: ['Admin', 'Manager', 'Management'],
    users: ['Admin', 'Manager'],
    kmis: ['Admin', 'Manager', 'Employee', 'Management'],
    roles: ['Admin'],
    userRoles: ['Admin'],
    profile: ['Admin', 'Manager', 'Employee', 'Management'],
  };
  
  const allowedRoles = pagePermissions[pageName] || [];
  return allowedRoles.some(role => roleNames.includes(role));
};

export const getFilteredMenuItems = (allMenuItems) => {
  const roles = getUserRoles();
  const roleNames = roles.map(r => r.role || r);
  
  return allMenuItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => roleNames.includes(role));
  });
};
