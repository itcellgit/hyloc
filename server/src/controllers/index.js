import { User, Post } from '../models/index.js';
import { logError } from '../utils/logger.js';

export class UserController {
  static async getAll(req, res) {
    try {
      const users = await User.findAll();
      res.json({ success: true, data: users });
    } catch (error) {
      await logError(error, 'UserController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      await logError(error, 'UserController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const {
        empid,
        department_id,
        phone,
        address,
        firstname,
        middlename,
        lastname,
        email,
        bloodgroup,
        password
      } = req.body;

      if (!empid || !firstname || !lastname || !email || !password) {
        return res.status(400).json({ success: false, error: 'empid, firstname, lastname, email, and password are required' });
      }

      const user = await User.create({
        empid,
        department_id: department_id || null,
        phone: phone || null,
        address: address || null,
        firstname,
        middlename: middlename || null,
        lastname,
        email,
        bloodgroup: bloodgroup || null,
        password
      });
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      await logError(error, 'UserController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const {
        department_id,
        phone,
        address,
        firstname,
        middlename,
        lastname,
        email,
        bloodgroup
      } = req.body;

      const user = await User.update(req.params.id, {
        department_id: department_id || null,
        phone: phone || null,
        address: address || null,
        firstname: firstname || null,
        middlename: middlename || null,
        lastname: lastname || null,
        email: email || null,
        bloodgroup: bloodgroup || null
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      await logError(error, 'UserController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await User.delete(req.params.id);
      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      await logError(error, 'UserController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.params.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'Current password and new password are required' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'New password must be at least 6 characters' 
        });
      }

      const result = await User.changePassword(userId, currentPassword, newPassword);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          error: result.error 
        });
      }

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      await logError(error, 'UserController.changePassword', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export class PostController {
  static async getAll(req, res) {
    try {
      const posts = await Post.findAll();
      res.json({ success: true, data: posts });
    } catch (error) {
      await logError(error, 'PostController.getAll', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      res.json({ success: true, data: post });
    } catch (error) {
      await logError(error, 'PostController.getById', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getByUserId(req, res) {
    try {
      const posts = await Post.findByUserId(req.params.userId);
      res.json({ success: true, data: posts });
    } catch (error) {
      await logError(error, 'PostController.getByUserId', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { user_id, title, content } = req.body;
      if (!user_id || !title) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const post = await Post.create(user_id, title, content);
      res.status(201).json({ success: true, data: post });
    } catch (error) {
      await logError(error, 'PostController.create', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { title, content } = req.body;
      const post = await Post.update(req.params.id, title, content);
      res.json({ success: true, data: post });
    } catch (error) {
      await logError(error, 'PostController.update', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await Post.delete(req.params.id);
      res.json({ success: true, message: 'Post deleted' });
    } catch (error) {
      await logError(error, 'PostController.delete', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
