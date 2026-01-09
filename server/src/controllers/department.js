import { Department } from '../models/department.js';
import { logError } from '../utils/logger.js';

export class DepartmentController {
  static async getAll(req, res) {
    try {
      const departments = await Department.getAll();
      res.json({ success: true, data: departments });
    } catch (error) {
      await logError(error, 'DepartmentController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const department = await Department.getById(req.params.id);
      if (!department) {
        return res.status(404).json({ success: false, error: 'Department not found' });
      }
      res.json({ success: true, data: department });
    } catch (error) {
      await logError(error, 'DepartmentController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const department = await Department.create(req.body);
      res.status(201).json({ success: true, data: department });
    } catch (error) {
      await logError(error, 'DepartmentController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const department = await Department.update(req.params.id, req.body);
      if (!department) {
        return res.status(404).json({ success: false, error: 'Department not found' });
      }
      res.json({ success: true, data: department });
    } catch (error) {
      await logError(error, 'DepartmentController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await Department.delete(req.params.id);
      res.json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
      await logError(error, 'DepartmentController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
