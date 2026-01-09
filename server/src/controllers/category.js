import { Category } from '../models/category.js';
import { logError } from '../utils/logger.js';

export class CategoryController {
  static async getAll(req, res) {
    try {
      const categories = await Category.findAll();
      res.json({ success: true, data: categories });
    } catch (error) {
      await logError(error, 'CategoryController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      await logError(error, 'CategoryController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { category_name } = req.body;
      
      if (!category_name) {
        return res.status(400).json({ success: false, error: 'category_name is required' });
      }

      const category = await Category.create({ category_name });
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      await logError(error, 'CategoryController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { category_name } = req.body;
      
      if (!category_name) {
        return res.status(400).json({ success: false, error: 'category_name is required' });
      }

      const category = await Category.update(req.params.id, { category_name });
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      await logError(error, 'CategoryController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await Category.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      await logError(error, 'CategoryController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
