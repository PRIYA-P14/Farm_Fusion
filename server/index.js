require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const soilRoutes = require('./routes/soilRoutes');
const agentRoutes = require('./routes/agentRoutes');
const authRoutes = require('./routes/authRoutes');
const govRoutes = require('./routes/govRoutes');
const { getWeather } = require('./controllers/weatherController');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', soilRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/government', govRoutes);
app.get('/api/weather', getWeather);

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Soil Intelligence Agent API' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌱 Soil Intelligence Agent API running on port ${PORT}`));
