import { KPIValue } from '../models/kpi-value.js';
import { logError } from '../utils/logger.js';

export class KPIValueController {
  static async getAll(req, res) {
    try {
      const values = await KPIValue.findAll();
      res.json({ success: true, data: values });
    } catch (error) {
      await logError(error, 'KPIValueController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const value = await KPIValue.findById(req.params.id);
      if (!value) {
        return res.status(404).json({ success: false, error: 'KPI Value not found' });
      }
      res.json({ success: true, data: value });
    } catch (error) {
      await logError(error, 'KPIValueController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByKPI(req, res) {
    try {
      const values = await KPIValue.findByKPI(req.params.kpiId);
      res.json({ success: true, data: values });
    } catch (error) {
      await logError(error, 'KPIValueController.getByKPI', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByKPIAndMonth(req, res) {
    try {
      const { kpiId, monthYear } = req.params;
      const values = await KPIValue.findByKPIAndMonth(kpiId, monthYear);
      res.json({ success: true, data: values });
    } catch (error) {
      await logError(error, 'KPIValueController.getByKPIAndMonth', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { data, kpi_id, month_year, value_type, value, remarks } = req.body;
      
      if (!data || !kpi_id || !month_year || !value_type || value === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'data, kpi_id, month_year, value_type, and value are required' 
        });
      }

      const kpiValue = await KPIValue.create({
        data,
        kpi_id,
        month_year,
        value_type,
        value,
        remarks: remarks || null
      });
      res.status(201).json({ success: true, data: kpiValue });
    } catch (error) {
      await logError(error, 'KPIValueController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { data, kpi_id, month_year, value_type, value, remarks } = req.body;

      const kpiValue = await KPIValue.update(req.params.id, {
        data,
        kpi_id,
        month_year,
        value_type,
        value,
        remarks
      });
      if (!kpiValue) {
        return res.status(404).json({ success: false, error: 'KPI Value not found' });
      }
      res.json({ success: true, data: kpiValue });
    } catch (error) {
      await logError(error, 'KPIValueController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await KPIValue.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'KPI Value not found' });
      }
      res.json({ success: true, message: 'KPI Value deleted successfully' });
    } catch (error) {
      await logError(error, 'KPIValueController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
