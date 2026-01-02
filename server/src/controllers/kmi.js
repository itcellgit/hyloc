import { Kmi } from '../models/kmi.js';

export class KmiController {
  static async getAll(req, res) {
    try {
      const kmis = await Kmi.getAll();
      res.json({ success: true, data: kmis });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const kmi = await Kmi.getById(req.params.id);
      if (!kmi) {
        return res.status(404).json({ success: false, error: 'KMI not found' });
      }
      res.json({ success: true, data: kmi });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const kmi = await Kmi.create(req.body);
      res.status(201).json({ success: true, data: kmi });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const kmi = await Kmi.update(req.params.id, req.body);
      if (!kmi) {
        return res.status(404).json({ success: false, error: 'KMI not found' });
      }
      res.json({ success: true, data: kmi });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await Kmi.delete(req.params.id);
      res.json({ success: true, message: 'KMI deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
