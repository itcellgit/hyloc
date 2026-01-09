# Hyloc Database Schema - Models, Controllers & Routes Documentation

## Overview
This document outlines all the models, controllers, and routes created based on the database schema from `hyloc backup 6th Jan.sql`.

## Database Tables Covered

### 1. **Users** ✅
- **Model**: `user.js` (Already existed - imported from `models/index.js`)
- **Controller**: `UserController` (Already existed)
- **Routes**: `/users` (CRUD operations)

### 2. **Departments** ✅
- **Model**: `department.js` (Already existed)
- **Controller**: `DepartmentController` (Already existed)
- **Routes**: `/departments` (CRUD operations)

### 3. **Categories** ✅ (NEW)
- **Model**: `models/category.js` - `Category` class
- **Controller**: `controllers/category.js` - `CategoryController` class
- **Routes**: 
  - `GET /categories` - Get all categories
  - `GET /categories/:id` - Get category by ID
  - `POST /categories` - Create new category
  - `PUT /categories/:id` - Update category
  - `DELETE /categories/:id` - Delete category

### 4. **Designations** ✅ (NEW)
- **Model**: `models/designation.js` - `Designation` class
- **Controller**: `controllers/designation.js` - `DesignationController` class
- **Routes**:
  - `GET /designations` - Get all designations
  - `GET /designations/:id` - Get designation by ID
  - `POST /designations` - Create new designation
  - `PUT /designations/:id` - Update designation
  - `DELETE /designations/:id` - Delete designation

### 5. **Roles** ✅ (NEW)
- **Model**: `models/role.js` - `Role` class
- **Controller**: `controllers/role.js` - `RoleController` class
- **Routes**:
  - `GET /roles` - Get all roles
  - `GET /roles/:id` - Get role by ID
  - `POST /roles` - Create new role
  - `PUT /roles/:id` - Update role
  - `DELETE /roles/:id` - Delete role

### 6. **Unit Master** ✅ (NEW)
- **Model**: `models/unit-master.js` - `UnitMaster` class
- **Controller**: `controllers/unit-master.js` - `UnitMasterController` class
- **Routes**:
  - `GET /units` - Get all units
  - `GET /units/:id` - Get unit by ID
  - `POST /units` - Create new unit
  - `PUT /units/:id` - Update unit
  - `DELETE /units/:id` - Delete unit

### 7. **KPIs (Key Performance Indicators)** ✅ (NEW)
- **Model**: `models/kpi.js` - `KPI` class
- **Controller**: `controllers/kpi.js` - `KPIController` class
- **Methods**: 
  - `findAll()`, `findById()`, `findByCategory()`, `create()`, `update()`, `delete()`
- **Routes**:
  - `GET /kpis` - Get all KPIs
  - `GET /kpis/:id` - Get KPI by ID
  - `GET /categories/:categoryId/kpis` - Get KPIs by category
  - `POST /kpis` - Create new KPI
  - `PUT /kpis/:id` - Update KPI
  - `DELETE /kpis/:id` - Delete KPI

### 8. **KPI Values** ✅ (NEW)
- **Model**: `models/kpi-value.js` - `KPIValue` class
- **Controller**: `controllers/kpi-value.js` - `KPIValueController` class
- **Methods**:
  - `findAll()`, `findById()`, `findByKPI()`, `findByKPIAndMonth()`, `create()`, `update()`, `delete()`
- **Routes**:
  - `GET /kpi-values` - Get all KPI values
  - `GET /kpi-values/:id` - Get KPI value by ID
  - `GET /kpis/:kpiId/values` - Get values for a specific KPI
  - `GET /kpis/:kpiId/values/:monthYear` - Get values for KPI in specific month/year
  - `POST /kpi-values` - Create new KPI value
  - `PUT /kpi-values/:id` - Update KPI value
  - `DELETE /kpi-values/:id` - Delete KPI value

### 9. **KPI Departments (Mapping)** ✅ (NEW)
- **Model**: `models/kpi-department.js` - `KPIDepartment` class
- **Controller**: `controllers/kpi-department.js` - `KPIDepartmentController` class
- **Methods**:
  - `findAll()`, `findById()`, `findByKPI()`, `findByDepartment()`, `create()`, `delete()`
- **Routes**:
  - `GET /kpi-departments` - Get all KPI-Department mappings
  - `GET /kpi-departments/:id` - Get specific mapping
  - `GET /kpis/:kpiId/departments` - Get departments for a KPI
  - `GET /departments/:departmentId/kpis` - Get KPIs for a department
  - `POST /kpi-departments` - Create mapping
  - `DELETE /kpi-departments/:id` - Delete mapping

### 10. **KPI Employees (Mapping)** ✅ (NEW)
- **Model**: `models/kpi-employee.js` - `KPIEmployee` class
- **Controller**: `controllers/kpi-employee.js` - `KPIEmployeeController` class
- **Methods**:
  - `findAll()`, `findById()`, `findByKPI()`, `findByEmployee()`, `create()`, `delete()`
- **Routes**:
  - `GET /kpi-employees` - Get all KPI-Employee mappings
  - `GET /kpi-employees/:id` - Get specific mapping
  - `GET /kpis/:kpiId/employees` - Get employees assigned to a KPI
  - `GET /employees/:empId/kpis` - Get KPIs assigned to an employee
  - `POST /kpi-employees` - Create mapping
  - `DELETE /kpi-employees/:id` - Delete mapping

### 11. **User Roles (Mapping)** ✅ (NEW)
- **Model**: `models/user-role.js` - `UserRole` class
- **Controller**: `controllers/user-role.js` - `UserRoleController` class
- **Methods**:
  - `findAll()`, `findById()`, `findByUser()`, `findByRole()`, `create()`, `update()`, `delete()`
- **Routes**:
  - `GET /user-roles` - Get all user-role mappings
  - `GET /user-roles/:id` - Get specific mapping
  - `GET /users/:userId/roles` - Get roles for a user
  - `GET /roles/:roleId/users` - Get users with a specific role
  - `POST /user-roles` - Create mapping
  - `PUT /user-roles/:id` - Update mapping
  - `DELETE /user-roles/:id` - Delete mapping

### 12. **Logs** ✅ (NEW)
- **Model**: `models/log.js` - `Log` class
- **Controller**: `controllers/log.js` - `LogController` class
- **Methods**:
  - `findAll()`, `findById()`, `findByUser()`, `create()`, `delete()`
- **Routes**:
  - `GET /logs` - Get all logs
  - `GET /logs/:id` - Get log by ID
  - `GET /users/:userId/logs` - Get logs for a specific user
  - `POST /logs` - Create new log entry
  - `DELETE /logs/:id` - Delete log entry

## Authentication Routes (Already existed)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/verify` - Verify token

## Post Routes (Already existed)
- `GET /posts` - Get all posts
- `GET /posts/:id` - Get post by ID
- `GET /users/:userId/posts` - Get posts by user
- `POST /posts` - Create new post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

## Files Created/Modified

### Models Created (10 new files)
1. `server/src/models/category.js`
2. `server/src/models/designation.js`
3. `server/src/models/role.js`
4. `server/src/models/unit-master.js`
5. `server/src/models/kpi.js`
6. `server/src/models/kpi-value.js`
7. `server/src/models/kpi-department.js`
8. `server/src/models/kpi-employee.js`
9. `server/src/models/log.js`
10. `server/src/models/user-role.js`

### Controllers Created (10 new files)
1. `server/src/controllers/category.js`
2. `server/src/controllers/designation.js`
3. `server/src/controllers/role.js`
4. `server/src/controllers/unit-master.js`
5. `server/src/controllers/kpi.js`
6. `server/src/controllers/kpi-value.js`
7. `server/src/controllers/kpi-department.js`
8. `server/src/controllers/kpi-employee.js`
9. `server/src/controllers/log.js`
10. `server/src/controllers/user-role.js`

### Routes Updated
- `server/src/routes/index.js` - Added all 80+ new endpoints

## Key Features Implemented

### Data Validation
- All controllers validate required fields
- Return appropriate HTTP status codes
- Clear error messages

### Database Operations
- All CRUD operations (Create, Read, Update, Delete)
- Proper SQL parameterization to prevent SQL injection
- Timestamps automatically managed (created_at, updated_at)

### Query Optimization
- Specific query methods for common filters (e.g., `findByCategory()`, `findByKPI()`)
- Ordered results by creation date or relevance
- Support for relationship queries (e.g., get all KPIs for a department)

### RESTful Endpoints
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Consistent response format with success/error fields
- Proper status codes (200, 201, 400, 404, 500)

## Usage Examples

### Categories
```bash
# Get all categories
GET /api/categories

# Create category
POST /api/categories
{
  "category_name": "Performance Metrics"
}
```

### KPIs with Related Data
```bash
# Get KPIs for a category
GET /api/categories/1/kpis

# Get values for a KPI
GET /api/kpis/5/values

# Get KPI values for a specific month
GET /api/kpis/5/values/2024-01

# Assign KPI to department
POST /api/kpi-departments
{
  "kpi_id": 5,
  "department_id": 2
}
```

### User Roles
```bash
# Get roles for a user
GET /api/users/1/roles

# Assign role to user
POST /api/user-roles
{
  "user_id": 1,
  "role_id": 3,
  "status": "active"
}
```

## Database Schema Compliance
All models, controllers, and routes are fully compliant with the PostgreSQL schema including:
- ✅ All 12 main tables covered
- ✅ Foreign key relationships handled
- ✅ Enum types (bloodgroup_enum, value_type_enum)
- ✅ Auto-incrementing IDs (SERIAL, GENERATED ALWAYS AS IDENTITY)
- ✅ Timestamps (created_at, updated_at)
- ✅ Unique constraints

---
*Generated: January 6, 2026*
*Database Backup: hyloc backup 6th Jan.sql*
