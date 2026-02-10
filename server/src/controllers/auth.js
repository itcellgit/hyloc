import { Auth } from '../models/auth.js';
import { logError } from '../utils/logger.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { empid, password } = req.body;
      
      if (!empid || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'empid and password are required' 
        });
      }

      console.log(`Login attempt for empid: ${empid}`);
      const user = await Auth.login(empid, password);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
      }

      // Create a simple token (in production, use JWT)
      const token = user.id.toString();

      res.json({ 
        success: true, 
        message: 'Login successful',
        data: {
          token,
          user
        }
      });
    } catch (error) {
      console.error('Login error:', error.message);
      await logError(error, 'AuthController.login', req.body?.empid);
      next(error); // Pass to global error handler
    }
  }

  static async register(req, res, next) {
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
        password,
        confirmPassword
      } = req.body;

      if (!empid || !firstname || !lastname || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'empid, firstname, lastname, email, and password are required' 
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'Passwords do not match' 
        });
      }

      const user = await Auth.register({
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
      const token = user.id.toString();

      res.status(201).json({ 
        success: true, 
        message: 'Registration successful',
        data: {
          token,
          user
        }
      });
    } catch (error) {
      console.error('Register error:', error.message);
      await logError(error, 'AuthController.register', req.body?.empid);
      next(error); // Pass to global error handler
    }
  }

  static async logout(req, res, next) {
    try {
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error.message);
      await logError(error, 'AuthController.logout', req.user?.id);
      next(error); // Pass to global error handler
    }
  }

  static async verify(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
      }

      const verified = await Auth.verifyToken(token);
      res.json({ success: true, data: verified });
    } catch (error) {
      console.error('Verify error:', error.message);
      await logError(error, 'AuthController.verify', req.user?.id);
      next(error); // Pass to global error handler
    }
  }
}
