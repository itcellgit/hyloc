# Role-Based Access Control (RBAC) Implementation

## 🎯 Overview
Complete role-based access control system with 4 roles: **Admin**, **Manager**, **Employee**, and **Management**.

---

## 📋 Components Created

### 1. **Pages**
- **UserRoles.js** (`/user-roles`) - Admin page to assign roles to users
- **Unauthorized.js** (`/unauthorized`) - Access denied page

### 2. **Components**
- **RoleBasedRoute.js** - Route wrapper for role-based page protection

### 3. **Utilities**
- **roleUtils.js** - Helper functions for role checking and menu filtering

### 4. **Styles**
- **UserRoles.css** - Styling for role assignment page
- **Unauthorized.css** - Styling for access denied page

### 5. **Scripts**
- **seed-roles.js** - Seeds the 4 default roles into the database

---

## 🔐 Role Permissions

### Admin
- ✅ Full access to all pages
- ✅ Dashboard, Departments, Users, KMIs, Roles, User Roles
- ✅ Can assign roles to users
- ✅ Can manage roles

### Manager
- ✅ Dashboard, Departments, Users, KMIs
- ❌ Cannot access Roles or User Roles pages

### Employee
- ✅ Dashboard, KMIs
- ❌ Cannot access Departments, Users, Roles, or User Roles

### Management
- ✅ Dashboard, Departments, KMIs
- ❌ Cannot access Users, Roles, or User Roles

---

## 🚀 Setup Instructions

### Step 1: Seed Roles into Database
```bash
cd server
node seed-roles.js
```

This will create the 4 default roles in your database.

### Step 2: Assign Roles to Users
1. Login as an admin user (or temporarily grant admin access)
2. Navigate to `/user-roles` page
3. Click "Assign Role" button
4. Select a user and assign them a role
5. Set status to "active"

### Step 3: Update Login to Fetch User Roles
The login process needs to be updated to fetch user roles. Add this to your auth service or login controller:

**Server-side (controllers/auth.js):**
```javascript
// After successful login, fetch user roles
const rolesResult = await pool.query(`
  SELECT r.id, r.role, ur.status
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = $1 AND ur.status = 'active'
`, [user.id]);

user.roles = rolesResult.rows;
```

**Client-side: Store roles in localStorage with user data**

---

## 📖 Usage Examples

### Protecting a Route
```javascript
<Route 
  path="/departments" 
  element={
    <ProtectedRoute>
      <RoleBasedRoute allowedRoles={['Admin', 'Manager', 'Management']}>
        <Departments />
      </RoleBasedRoute>
    </ProtectedRoute>
  } 
/>
```

### Checking Roles in Components
```javascript
import { hasRole, isAdmin, getUserRoles } from '../utils/roleUtils';

// Check if user has specific role
const userRoles = getUserRoles();
if (hasRole(userRoles, ['Admin'])) {
  // Show admin content
}

// Or use helper functions
if (isAdmin()) {
  // Show admin-only button
}
```

### Dynamic Menu Filtering
```javascript
import { getFilteredMenuItems } from '../utils/roleUtils';

const allMenuItems = [
  { id: 1, label: 'Dashboard', icon: '📊', path: '/', roles: ['Admin', 'Manager', 'Employee', 'Management'] },
  { id: 2, label: 'Users', icon: '👥', path: '/users', roles: ['Admin', 'Manager'] },
  // ...
];

const filteredMenuItems = getFilteredMenuItems(allMenuItems);
// Returns only menu items the current user has access to
```

---

## 🎨 Features

### User Roles Page (`/user-roles`)
- ✅ View all user-role assignments
- ✅ Assign roles to users
- ✅ Update role assignments
- ✅ Remove role assignments
- ✅ Set role status (active/inactive)
- ✅ Color-coded role badges
- ✅ Status indicators

### Access Control
- ✅ Automatic route protection
- ✅ Redirect to `/unauthorized` if access denied
- ✅ Dynamic sidebar menu based on user roles
- ✅ Role-based component visibility

### Unauthorized Page
- ✅ User-friendly access denied message
- ✅ Navigation buttons (Go to Dashboard, Go Back)
- ✅ Animated design

---

## 🔄 Workflow

1. **Admin creates roles** using the Roles page (`/roles`)
2. **Admin assigns roles to users** using User Roles page (`/user-roles`)
3. **User logs in** → System fetches their active roles
4. **Sidebar displays** only menu items they have access to
5. **Attempting to access** restricted pages redirects to `/unauthorized`

---

## 📊 Database Schema

### Roles Table
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Roles Table
```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✨ Next Steps (Optional Enhancements)

1. **Multi-role support** - Allow users to have multiple active roles
2. **Permission granularity** - Define specific permissions per role
3. **Role hierarchy** - Define role inheritance (Admin inherits Manager permissions)
4. **Audit logging** - Track role assignments and changes
5. **Role-based data filtering** - Show only data relevant to user's role

---

## 🐛 Troubleshooting

### Issue: User sees "Access Denied" for all pages
**Solution:** Ensure user has been assigned a role via the User Roles page and the role status is "active"

### Issue: Sidebar not filtering correctly
**Solution:** Check that user data in localStorage includes the `roles` array with proper role names

### Issue: Roles not showing in User Roles page
**Solution:** Run `node seed-roles.js` to ensure roles are created in database

---

## 📝 Notes

- Role names are case-sensitive (use: Admin, Manager, Employee, Management)
- Users without roles will see a minimal sidebar
- Admin role has access to everything by default
- Role assignments can be temporarily disabled by setting status to "inactive"
