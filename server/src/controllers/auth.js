import { Auth } from '../models/auth.js';

export class AuthController {
  static async login(req, res) {
    try {
      const { empid, password } = req.body;
      
      if (!empid || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'empid and password are required' 
        });
      }

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
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async register(req, res) {
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
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async logout(req, res) {
    try {
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async verify(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
      }

      const verified = await Auth.verifyToken(token);
      res.json({ success: true, data: verified });
    } catch (error) {
      res.status(401).json({ success: false, error: error.message });
    }
  }
}
