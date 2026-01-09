import express from 'express';
import { UserController, PostController } from '../controllers/index.js';
import { AuthController } from '../controllers/auth.js';
import { DepartmentController } from '../controllers/department.js';
import { CategoryController } from '../controllers/category.js';
import { DesignationController } from '../controllers/designation.js';
import { RoleController } from '../controllers/role.js';
import { UnitMasterController } from '../controllers/unit-master.js';
import { KPIController } from '../controllers/kpi.js';
import { KPIValueController } from '../controllers/kpi-value.js';
import { KPIDepartmentController } from '../controllers/kpi-department.js';
import { KPIEmployeeController } from '../controllers/kpi-employee.js';
import { LogController } from '../controllers/log.js';
import { UserRoleController } from '../controllers/user-role.js';

const router = express.Router();

// Authentication routes
router.post('/auth/login', AuthController.login);
router.post('/auth/register', AuthController.register);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/verify', AuthController.verify);

// Department routes
router.get('/departments', DepartmentController.getAll);
router.get('/departments/:id', DepartmentController.getById);
router.post('/departments', DepartmentController.create);
router.put('/departments/:id', DepartmentController.update);
router.delete('/departments/:id', DepartmentController.delete);

// Category routes
router.get('/categories', CategoryController.getAll);
router.get('/categories/:id', CategoryController.getById);
router.post('/categories', CategoryController.create);
router.put('/categories/:id', CategoryController.update);
router.delete('/categories/:id', CategoryController.delete);

// Designation routes
router.get('/designations', DesignationController.getAll);
router.get('/designations/:id', DesignationController.getById);
router.post('/designations', DesignationController.create);
router.put('/designations/:id', DesignationController.update);
router.delete('/designations/:id', DesignationController.delete);

// Role routes
router.get('/roles', RoleController.getAll);
router.get('/roles/:id', RoleController.getById);
router.post('/roles', RoleController.create);
router.put('/roles/:id', RoleController.update);
router.delete('/roles/:id', RoleController.delete);

// Unit Master routes
router.get('/units', UnitMasterController.getAll);
router.get('/units/:id', UnitMasterController.getById);
router.post('/units', UnitMasterController.create);
router.put('/units/:id', UnitMasterController.update);
router.delete('/units/:id', UnitMasterController.delete);

// KPI routes
router.get('/kpis', KPIController.getAll);
router.get('/kpis/:id', KPIController.getById);
router.get('/categories/:categoryId/kpis', KPIController.getByCategory);
router.post('/kpis', KPIController.create);
router.put('/kpis/:id', KPIController.update);
router.delete('/kpis/:id', KPIController.delete);

// KPI Value routes
router.get('/kpi-values', KPIValueController.getAll);
router.get('/kpi-values/:id', KPIValueController.getById);
router.get('/kpis/:kpiId/values', KPIValueController.getByKPI);
router.get('/kpis/:kpiId/values/:monthYear', KPIValueController.getByKPIAndMonth);
router.post('/kpi-values', KPIValueController.create);
router.put('/kpi-values/:id', KPIValueController.update);
router.delete('/kpi-values/:id', KPIValueController.delete);

// KPI Department routes
router.get('/kpi-departments', KPIDepartmentController.getAll);
router.get('/kpi-departments/:id', KPIDepartmentController.getById);
router.get('/kpis/:kpiId/departments', KPIDepartmentController.getByKPI);
router.get('/departments/:departmentId/kpis', KPIDepartmentController.getByDepartment);
router.post('/kpi-departments', KPIDepartmentController.create);
router.delete('/kpi-departments/:id', KPIDepartmentController.delete);

// KPI Employee routes
router.get('/kpi-employees', KPIEmployeeController.getAll);
router.get('/kpi-employees/:id', KPIEmployeeController.getById);
router.get('/kpis/:kpiId/employees', KPIEmployeeController.getByKPI);
router.get('/employees/:empId/kpis', KPIEmployeeController.getByEmployee);
router.post('/kpi-employees', KPIEmployeeController.create);
router.delete('/kpi-employees/:id', KPIEmployeeController.delete);

// User Role routes
router.get('/user-roles', UserRoleController.getAll);
router.get('/user-roles/:id', UserRoleController.getById);
router.get('/users/:userId/roles', UserRoleController.getByUser);
router.get('/roles/:roleId/users', UserRoleController.getByRole);
router.post('/user-roles', UserRoleController.create);
router.put('/user-roles/:id', UserRoleController.update);
router.delete('/user-roles/:id', UserRoleController.delete);

// Log routes
router.get('/logs', LogController.getAll);
router.get('/logs/:id', LogController.getById);
router.get('/users/:userId/logs', LogController.getByUser);
router.post('/logs', LogController.create);
router.delete('/logs/:id', LogController.delete);

// User routes
router.get('/users', UserController.getAll);
router.get('/users/:id', UserController.getById);
router.post('/users', UserController.create);
router.put('/users/:id', UserController.update);
router.put('/users/:id/password', UserController.changePassword);
router.delete('/users/:id', UserController.delete);

// Post routes
router.get('/posts', PostController.getAll);
router.get('/posts/:id', PostController.getById);
router.get('/users/:userId/posts', PostController.getByUserId);
router.post('/posts', PostController.create);
router.put('/posts/:id', PostController.update);
router.delete('/posts/:id', PostController.delete);

export default router;
