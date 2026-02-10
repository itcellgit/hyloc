import { KPIValue } from '../models/kpi-value.js';
import { logError } from '../utils/logger.js';
import { KPICalculationService } from '../services/kpiCalculationService.js';

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
      const { data, kpi_id, data_operator, target_required, uom, kpi_type, piller_id, formula, source_kpi_value_ids, default_target_value, target_formula, target_source_kpi_value_ids } = req.body;

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

      // If computed, validate formula
      if (String(kpi_type || '').toLowerCase() === 'computed') {
        // If target_formula is provided (Option 3), formula for actual is not required
        const hasTargetFormula = target_formula && target_formula.trim() !== '';
        
        if (!hasTargetFormula) {
          // Options 1 & 2: formula is required
          if (!formula) {
            return res.status(400).json({ success: false, error: 'Formula is required for computed KPI' });
          }

          if (!source_kpi_value_ids || source_kpi_value_ids.length === 0) {
            return res.status(400).json({ success: false, error: 'Source KPI value IDs are required for computed KPI' });
          }

          const validation = await KPICalculationService.validateFormula(formula, source_kpi_value_ids);
          if (!validation.valid) {
            return res.status(400).json({ success: false, error: validation.error });
          }
        } else {
          // Option 3: target_formula is required, validate it
          if (!target_source_kpi_value_ids || target_source_kpi_value_ids.length === 0) {
            return res.status(400).json({ success: false, error: 'Target source KPI value IDs are required when using target formula' });
          }
          
          const targetValidation = await KPICalculationService.validateFormula(target_formula, target_source_kpi_value_ids);
          if (!targetValidation.valid) {
            return res.status(400).json({ success: false, error: `Target formula validation failed: ${targetValidation.error}` });
          }
        }
      }

      const kpiValue = await KPIValue.create({
        data,
        kpi_id,
        data_operator: data_operator || null,
        target_required: target_required !== undefined ? target_required : true,
        uom: uom || null,
        kpi_type: kpi_type || 'manual',
        piller_id: piller_id || null,
        formula: formula || null,
        source_kpi_value_ids: source_kpi_value_ids || null,
        default_target_value: default_target_value || null,
        target_formula: target_formula || null,
        target_source_kpi_value_ids: target_source_kpi_value_ids || null
      });
      res.status(201).json({ success: true, data: kpiValue });
    } catch (error) {
      await logError(error, 'KPIValueController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { data, kpi_id, data_operator, target_required, uom, kpi_type, piller_id, formula, source_kpi_value_ids, default_target_value, target_formula, target_source_kpi_value_ids } = req.body;

      // Validate kpi_type if provided
      if (kpi_type && !['manual', 'computed'].includes(String(kpi_type).toLowerCase())) {
        return res.status(400).json({ success: false, error: 'kpi_type must be either "manual" or "computed"' });
      }

      // If changing to computed, validate formula
      if (kpi_type === 'computed') {
        if (formula && source_kpi_value_ids && source_kpi_value_ids.length > 0) {
          const validation = await KPICalculationService.validateFormula(formula, source_kpi_value_ids);
          if (!validation.valid) {
            return res.status(400).json({ success: false, error: validation.error });
          }
        }
        
        // If target_formula is provided, validate it
        if (target_formula && target_formula.trim() !== '') {
          if (!target_source_kpi_value_ids || target_source_kpi_value_ids.length === 0) {
            return res.status(400).json({ success: false, error: 'Target source KPI value IDs are required when target_formula is provided' });
          }
          
          const targetValidation = await KPICalculationService.validateFormula(target_formula, target_source_kpi_value_ids);
          if (!targetValidation.valid) {
            return res.status(400).json({ success: false, error: `Target formula validation failed: ${targetValidation.error}` });
          }
        }
      }

      const updateData = {
        data,
        kpi_id,
        data_operator,
        target_required,
        uom,
        kpi_type,
        piller_id,
        formula,
        source_kpi_value_ids,
        default_target_value,
        target_formula,
        target_source_kpi_value_ids
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
