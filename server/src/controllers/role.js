import { Role } from '../models/role.js';
import { logError } from '../utils/logger.js';

export class RoleController {
  static async getAll(req, res) {
    try {
      const roles = await Role.findAll();
      res.json({ success: true, data: roles });
    } catch (error) {
      await logError(error, 'RoleController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ success: false, error: 'Role not found' });
      }
      res.json({ success: true, data: role });
    } catch (error) {
      await logError(error, 'RoleController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { role_name } = req.body;
      
      if (!role_name) {
        return res.status(400).json({ success: false, error: 'role_name is required' });
      }

      const role = await Role.create({ role_name });
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      await logError(error, 'RoleController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { role_name } = req.body;
      
      if (!role_name) {
        return res.status(400).json({ success: false, error: 'role_name is required' });
      }

      const role = await Role.update(req.params.id, { role_name });
      if (!role) {
        return res.status(404).json({ success: false, error: 'Role not found' });
      }
      res.json({ success: true, data: role });
    } catch (error) {
      await logError(error, 'RoleController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await Role.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Role not found' });
      }
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      await logError(error, 'RoleController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
