import { Log } from '../models/log.js';
import { logError } from '../utils/logger.js';

export class LogController {
  static async getAll(req, res) {
    try {
      const logs = await Log.findAll();
      res.json({ success: true, data: logs });
    } catch (error) {
      await logError(error, 'LogController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const log = await Log.findById(req.params.id);
      if (!log) {
        return res.status(404).json({ success: false, error: 'Log not found' });
      }
      res.json({ success: true, data: log });
    } catch (error) {
      await logError(error, 'LogController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByUser(req, res) {
    try {
      const logs = await Log.findByUser(req.params.userId);
      res.json({ success: true, data: logs });
    } catch (error) {
      await logError(error, 'LogController.getByUser', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { user_id, description } = req.body;
      
      if (!description) {
        return res.status(400).json({ success: false, error: 'description is required' });
      }

      const log = await Log.create({ user_id: user_id || null, description });
      res.status(201).json({ success: true, data: log });
    } catch (error) {
      await logError(error, 'LogController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await Log.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Log not found' });
      }
      res.json({ success: true, message: 'Log deleted successfully' });
    } catch (error) {
      await logError(error, 'LogController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
