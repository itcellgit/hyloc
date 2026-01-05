import express from 'express';
import { UserController, PostController } from '../controllers/index.js';
import { AuthController } from '../controllers/auth.js';
import { DepartmentController } from '../controllers/department.js';
import { KmiController } from '../controllers/kmi.js';

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

// KMI routes
router.get('/kmis', KmiController.getAll);
router.get('/kmis/:id', KmiController.getById);
router.post('/kmis', KmiController.create);
router.put('/kmis/:id', KmiController.update);
router.delete('/kmis/:id', KmiController.delete);

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
