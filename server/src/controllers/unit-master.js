import { UnitMaster } from '../models/unit-master.js';
import { logError } from '../utils/logger.js';

export class UnitMasterController {
  static async getAll(req, res) {
    try {
      const units = await UnitMaster.findAll();
      res.json({ success: true, data: units });
    } catch (error) {
      await logError(error, 'UnitMasterController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const unit = await UnitMaster.findById(req.params.id);
      if (!unit) {
        return res.status(404).json({ success: false, error: 'Unit not found' });
      }
      res.json({ success: true, data: unit });
    } catch (error) {
      await logError(error, 'UnitMasterController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { unit_name, symbol } = req.body;
      
      if (!unit_name) {
        return res.status(400).json({ success: false, error: 'unit_name is required' });
      }

      const unit = await UnitMaster.create({ unit_name, symbol: symbol || null });
      res.status(201).json({ success: true, data: unit });
    } catch (error) {
      await logError(error, 'UnitMasterController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { unit_name, symbol } = req.body;

      const unit = await UnitMaster.update(req.params.id, { unit_name, symbol });
      if (!unit) {
        return res.status(404).json({ success: false, error: 'Unit not found' });
      }
      res.json({ success: true, data: unit });
    } catch (error) {
      await logError(error, 'UnitMasterController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await UnitMaster.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Unit not found' });
      }
      res.json({ success: true, message: 'Unit deleted successfully' });
    } catch (error) {
      await logError(error, 'UnitMasterController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
