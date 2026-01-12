import { KPIValue } from '../models/kpi-value.js';
import { logError } from '../utils/logger.js';
// Formula-based calculations are not supported per current schema

export class KPIValueController {
  static async getAll(req, res) {
    try {
      const { kpi_id } = req.query;
      
      // If kpi_id is provided in query params, filter by it
      if (kpi_id) {
        const values = await KPIValue.findByKPI(kpi_id);
        return res.json({ success: true, data: values });
      }
      
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

  static async create(req, res) {
    try {
      const { data, kpi_id, data_operator, target_required, uom, kpi_type, piller_id } = req.body;

      if (!kpi_id) {
        return res.status(400).json({ success: false, error: 'kpi_id is required' });
      }
      if (!data) {
        return res.status(400).json({ success: false, error: 'data is required' });
      }

      // Validate kpi_type if provided
      if (kpi_type && !['manual', 'computed'].includes(String(kpi_type).toLowerCase())) {
        return res.status(400).json({ success: false, error: 'kpi_type must be either "manual" or "computed"' });
      }

      const kpiValue = await KPIValue.create({
        data,
        kpi_id,
        data_operator: data_operator || null,
        target_required: target_required !== undefined ? target_required : true,
        uom: uom || null,
        kpi_type: kpi_type || 'manual',
        piller_id: piller_id || null
      });
      res.status(201).json({ success: true, data: kpiValue });
    } catch (error) {
      await logError(error, 'KPIValueController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { data, kpi_id, data_operator, target_required, uom, kpi_type, piller_id } = req.body;

      // Validate kpi_type if provided
      if (kpi_type && !['manual', 'computed'].includes(String(kpi_type).toLowerCase())) {
        return res.status(400).json({ success: false, error: 'kpi_type must be either "manual" or "computed"' });
      }

      const updateData = {
        data,
        kpi_id,
        data_operator,
        target_required,
        uom,
        kpi_type,
        piller_id
      };

      const kpiValue = await KPIValue.update(req.params.id, updateData);
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
