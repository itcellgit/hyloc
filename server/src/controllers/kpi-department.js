import { KPIDepartment } from '../models/kpi-department.js';
import { logError } from '../utils/logger.js';

export class KPIDepartmentController {
  static async getAll(req, res) {
    try {
      const kpiDepts = await KPIDepartment.findAll();
      res.json({ success: true, data: kpiDepts });
    } catch (error) {
      await logError(error, 'KPIDepartmentController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const kpiDept = await KPIDepartment.findById(req.params.id);
      if (!kpiDept) {
        return res.status(404).json({ success: false, error: 'KPI Department mapping not found' });
      }
      res.json({ success: true, data: kpiDept });
    } catch (error) {
      await logError(error, 'KPIDepartmentController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByKPI(req, res) {
    try {
      const kpiDepts = await KPIDepartment.findByKPI(req.params.kpiId);
      res.json({ success: true, data: kpiDepts });
    } catch (error) {
      await logError(error, 'KPIDepartmentController.getByKPI', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByDepartment(req, res) {
    try {
      const kpiDepts = await KPIDepartment.findByDepartment(req.params.departmentId);
      res.json({ success: true, data: kpiDepts });
    } catch (error) {
      await logError(error, 'KPIDepartmentController.getByDepartment', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { kpi_id, department_id } = req.body;
      
      if (!kpi_id || !department_id) {
        return res.status(400).json({ success: false, error: 'kpi_id and department_id are required' });
      }

      const kpiDept = await KPIDepartment.create({ kpi_id, department_id });
      res.status(201).json({ success: true, data: kpiDept });
    } catch (error) {
      await logError(error, 'KPIDepartmentController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await KPIDepartment.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'KPI Department mapping not found' });
      }
      res.json({ success: true, message: 'KPI Department mapping deleted successfully' });
    } catch (error) {
      await logError(error, 'KPIDepartmentController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
