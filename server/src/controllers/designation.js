import { Designation } from '../models/designation.js';
import { logError } from '../utils/logger.js';

export class DesignationController {
  static async getAll(req, res) {
    try {
      const designations = await Designation.findAll();
      res.json({ success: true, data: designations });
    } catch (error) {
      await logError(error, 'DesignationController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const designation = await Designation.findById(req.params.id);
      if (!designation) {
        return res.status(404).json({ success: false, error: 'Designation not found' });
      }
      res.json({ success: true, data: designation });
    } catch (error) {
      await logError(error, 'DesignationController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { name, shortname } = req.body;
      
      if (!name || !shortname) {
        return res.status(400).json({ success: false, error: 'name and shortname are required' });
      }

      const designation = await Designation.create({ name, shortname });
      res.status(201).json({ success: true, data: designation });
    } catch (error) {
      await logError(error, 'DesignationController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { name, shortname } = req.body;
      
      if (!name || !shortname) {
        return res.status(400).json({ success: false, error: 'name and shortname are required' });
      }

      const designation = await Designation.update(req.params.id, { name, shortname });
      if (!designation) {
        return res.status(404).json({ success: false, error: 'Designation not found' });
      }
      res.json({ success: true, data: designation });
    } catch (error) {
      await logError(error, 'DesignationController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await Designation.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Designation not found' });
      }
      res.json({ success: true, message: 'Designation deleted successfully' });
    } catch (error) {
      await logError(error, 'DesignationController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
