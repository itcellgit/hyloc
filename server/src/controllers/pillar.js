import { Pillar } from '../models/pillar.js';
import { logError } from '../utils/logger.js';

export class PillarController {
  static async getAll(req, res) {
    try {
      const pillars = await Pillar.getAll();
      res.json({ success: true, data: pillars });
    } catch (error) {
      await logError(error, 'PillarController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const pillar = await Pillar.getById(req.params.id);
      if (!pillar) {
        return res.status(404).json({ success: false, error: 'Pillar not found' });
      }
      res.json({ success: true, data: pillar });
    } catch (error) {
      await logError(error, 'PillarController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { piller_name, short_name } = req.body;

      if (!piller_name || !short_name) {
        return res.status(400).json({ success: false, error: 'piller_name and short_name are required' });
      }

      const pillar = await Pillar.create({ piller_name, short_name });
      res.status(201).json({ success: true, data: pillar });
    } catch (error) {
      await logError(error, 'PillarController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { piller_name, short_name } = req.body;

      if (!piller_name || !short_name) {
        return res.status(400).json({ success: false, error: 'piller_name and short_name are required' });
      }

      const pillar = await Pillar.update(req.params.id, { piller_name, short_name });
      if (!pillar) {
        return res.status(404).json({ success: false, error: 'Pillar not found' });
      }

      res.json({ success: true, data: pillar });
    } catch (error) {
      await logError(error, 'PillarController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await Pillar.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Pillar not found' });
      }
      res.json({ success: true, message: 'Pillar deleted successfully' });
    } catch (error) {
      await logError(error, 'PillarController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
