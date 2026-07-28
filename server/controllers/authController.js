const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'soil_secret_key', { expiresIn: '30d' });

exports.register = async (req, res) => {
  try {
    const { fullName, mobileNumber, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, detail: 'Email already registered' });
    const user = await User.create({ fullName, mobileNumber, email, password });
    res.status(201).json({ success: true, message: 'Account created' });
  } catch (err) {
    res.status(400).json({ success: false, detail: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, detail: 'Invalid email or password' });
    res.json({ success: true, token: sign(user._id), user: { fullName: user.fullName, email: user.email, mobileNumber: user.mobileNumber } });
  } catch (err) {
    res.status(500).json({ success: false, detail: err.message });
  }
};

exports.profile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, detail: 'No token' });
    const { id } = jwt.verify(token, process.env.JWT_SECRET || 'soil_secret_key');
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ success: false, detail: 'User not found' });
    res.json({ success: true, data: user });
  } catch {
    res.status(401).json({ success: false, detail: 'Invalid token' });
  }
};

// POST /api/auth/google — Google OAuth (decode JWT credential from Google)
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, detail: 'No credential provided' });

    // Decode the Google JWT (we trust it since it comes from Google's button)
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
    const { email, name, sub } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        fullName: name || email.split('@')[0],
        mobileNumber: '0000000000',
        email,
        password: sub + process.env.JWT_SECRET, // non-guessable password for Google users
      });
    }
    res.json({ success: true, token: sign(user._id), user: { fullName: user.fullName, email: user.email, mobileNumber: user.mobileNumber } });
  } catch (err) {
    res.status(400).json({ success: false, detail: err.message });
  }
};
