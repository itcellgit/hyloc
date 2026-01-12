import { KPI } from '../models/kpi.js';
import { logError } from '../utils/logger.js';

export class KPIController {
  static async getAll(req, res) {
    try {
      const kpis = await KPI.findAll();
      res.json({ success: true, data: kpis });
    } catch (error) {
      await logError(error, 'KPIController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const kpi = await KPI.findById(req.params.id);
      if (!kpi) {
        return res.status(404).json({ success: false, error: 'KPI not found' });
      }
      res.json({ success: true, data: kpi });
    } catch (error) {
      await logError(error, 'KPIController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByCategory(req, res) {
    try {
      const kpis = await KPI.findByCategory(req.params.categoryId);
      res.json({ success: true, data: kpis });
    } catch (error) {
      await logError(error, 'KPIController.getByCategory', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { title, category_id, parent_kpi_id, fin_year } = req.body;
      
      if (!title || !category_id) {
        return res.status(400).json({ success: false, error: 'title and category_id are required' });
      }

      const kpi = await KPI.create({
        title,
        category_id,
        parent_kpi_id: parent_kpi_id || null,
        fin_year: fin_year || null
      });
      res.status(201).json({ success: true, data: kpi });
    } catch (error) {
      await logError(error, 'KPIController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { title, category_id, parent_kpi_id, fin_year } = req.body;

      const kpi = await KPI.update(req.params.id, {
        title,
        category_id,
        parent_kpi_id,
        fin_year
      });
      if (!kpi) {
        return res.status(404).json({ success: false, error: 'KPI not found' });
      }
      res.json({ success: true, data: kpi });
    } catch (error) {
      await logError(error, 'KPIController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await KPI.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'KPI not found' });
      }
      res.json({ success: true, message: 'KPI deleted successfully' });
    } catch (error) {
      await logError(error, 'KPIController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
