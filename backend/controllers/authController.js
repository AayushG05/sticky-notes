const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { email, password, purpose } = req.body;
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });
    
    const newUser = new User({ email, password, purpose });
    const savedUser = await newUser.save();
    
    res.status(201).json({ _id: savedUser._id, email: savedUser.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    res.status(200).json({ _id: user._id, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
