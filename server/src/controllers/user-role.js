import { UserRole } from '../models/user-role.js';
import { logError } from '../utils/logger.js';

export class UserRoleController {
  static async getAll(req, res) {
    try {
      const userRoles = await UserRole.findAll();
      res.json({ success: true, data: userRoles });
    } catch (error) {
      await logError(error, 'UserRoleController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const userRole = await UserRole.findById(req.params.id);
      if (!userRole) {
        return res.status(404).json({ success: false, error: 'User Role not found' });
      }
      res.json({ success: true, data: userRole });
    } catch (error) {
      await logError(error, 'UserRoleController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByUser(req, res) {
    try {
      const userRoles = await UserRole.findByUser(req.params.userId);
      res.json({ success: true, data: userRoles });
    } catch (error) {
      await logError(error, 'UserRoleController.getByUser', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByRole(req, res) {
    try {
      const userRoles = await UserRole.findByRole(req.params.roleId);
      res.json({ success: true, data: userRoles });
    } catch (error) {
      await logError(error, 'UserRoleController.getByRole', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { user_id, role_id, status } = req.body;
      
      if (!user_id || !role_id) {
        return res.status(400).json({ success: false, error: 'user_id and role_id are required' });
      }

      const userRole = await UserRole.create({ user_id, role_id, status: status || null });
      res.status(201).json({ success: true, data: userRole });
    } catch (error) {
      await logError(error, 'UserRoleController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { user_id, role_id, status } = req.body;

      const userRole = await UserRole.update(req.params.id, { user_id, role_id, status });
      if (!userRole) {
        return res.status(404).json({ success: false, error: 'User Role not found' });
      }
      res.json({ success: true, data: userRole });
    } catch (error) {
      await logError(error, 'UserRoleController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await UserRole.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'User Role not found' });
      }
      res.json({ success: true, message: 'User Role deleted successfully' });
    } catch (error) {
      await logError(error, 'UserRoleController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
