import { KPIEmployee } from '../models/kpi-employee.js';
import { logError } from '../utils/logger.js';

export class KPIEmployeeController {
  static async getAll(req, res) {
    try {
      const kpiEmps = await KPIEmployee.findAll();
      res.json({ success: true, data: kpiEmps });
    } catch (error) {
      await logError(error, 'KPIEmployeeController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const kpiEmp = await KPIEmployee.findById(req.params.id);
      if (!kpiEmp) {
        return res.status(404).json({ success: false, error: 'KPI Employee mapping not found' });
      }
      res.json({ success: true, data: kpiEmp });
    } catch (error) {
      await logError(error, 'KPIEmployeeController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByKPI(req, res) {
    try {
      const kpiEmps = await KPIEmployee.findByKPI(req.params.kpiId);
      res.json({ success: true, data: kpiEmps });
    } catch (error) {
      await logError(error, 'KPIEmployeeController.getByKPI', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByEmployee(req, res) {
    try {
      const kpiEmps = await KPIEmployee.findByEmployee(req.params.empId);
      res.json({ success: true, data: kpiEmps });
    } catch (error) {
      await logError(error, 'KPIEmployeeController.getByEmployee', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { kpi_id, emp_id } = req.body;
      
      if (!kpi_id || !emp_id) {
        return res.status(400).json({ success: false, error: 'kpi_id and emp_id are required' });
      }

      const kpiEmp = await KPIEmployee.create({ kpi_id, emp_id });
      res.status(201).json({ success: true, data: kpiEmp });
    } catch (error) {
      await logError(error, 'KPIEmployeeController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await KPIEmployee.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'KPI Employee mapping not found' });
      }
      res.json({ success: true, message: 'KPI Employee mapping deleted successfully' });
    } catch (error) {
      await logError(error, 'KPIEmployeeController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
