/**
 * Weather Agent — simulates real weather data per Indian state
 */
const axios = require('axios');

const STATE_WEATHER = {
  'Tamil Nadu':     { temp: 32, humidity: 78, rainfall: 850,  wind: 12, condition: 'Partly Cloudy' },
  'Punjab':         { temp: 28, humidity: 55, rainfall: 650,  wind: 15, condition: 'Clear' },
  'Maharashtra':    { temp: 30, humidity: 65, rainfall: 750,  wind: 10, condition: 'Hazy' },
  'Andhra Pradesh': { temp: 33, humidity: 72, rainfall: 900,  wind: 11, condition: 'Cloudy' },
  'Karnataka':      { temp: 29, humidity: 68, rainfall: 800,  wind: 9,  condition: 'Clear' },
  'Uttar Pradesh':  { temp: 27, humidity: 60, rainfall: 700,  wind: 13, condition: 'Clear' },
  'Gujarat':        { temp: 34, humidity: 50, rainfall: 500,  wind: 18, condition: 'Sunny' },
  'West Bengal':    { temp: 31, humidity: 82, rainfall: 1200, wind: 8,  condition: 'Rainy' },
  'Rajasthan':      { temp: 36, humidity: 35, rainfall: 350,  wind: 20, condition: 'Sunny' },
  'Madhya Pradesh': { temp: 29, humidity: 62, rainfall: 700,  wind: 11, condition: 'Clear' },
  'Bihar':          { temp: 28, humidity: 70, rainfall: 1000, wind: 9,  condition: 'Cloudy' },
  'Haryana':        { temp: 27, humidity: 58, rainfall: 600,  wind: 14, condition: 'Clear' },
  'Kerala':         { temp: 30, humidity: 85, rainfall: 2500, wind: 7,  condition: 'Rainy' },
  'Telangana':      { temp: 33, humidity: 65, rainfall: 800,  wind: 10, condition: 'Partly Cloudy' },
};

exports.getWeather = async (req, res) => {
  const { state = 'Tamil Nadu', crop = 'Rice', lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    if (apiKey && apiKey !== 'your_openweather_key_here') {
      const query = lat ? `lat=${lat}&lon=${lon}` : `q=${encodeURIComponent(state)},IN`;
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric`,
        { timeout: 5000 }
      );
      const rainfallProb = data.clouds?.all > 70 ? 70 : data.clouds?.all > 40 ? 40 : 15;
      return res.json({ success: true, data: buildWeatherResponse(state, data.main.temp, data.main.humidity, data.wind.speed * 3.6, data.weather[0].description, rainfallProb, 'openweathermap') });
    }
  } catch (_) {}

  const w = STATE_WEATHER[state] || STATE_WEATHER['Tamil Nadu'];
  const temp = w.temp + Math.round((Math.random() - 0.5) * 4);
  const humidity = Math.min(100, w.humidity + Math.round((Math.random() - 0.5) * 8));
  const rainfallProb = humidity > 75 ? 72 : humidity > 60 ? 45 : 18;
  res.json({ success: true, data: buildWeatherResponse(state, temp, humidity, w.wind, w.condition, rainfallProb, 'simulated') });
};

function buildWeatherResponse(state, temp, humidity, wind, condition, rainfallProb, source) {
  return {
    source, location: state,
    current: { temperature: Math.round(temp), humidity: Math.round(humidity), windSpeed: Math.round(wind), condition, icon: condition.toLowerCase().includes('rain') ? '🌧️' : condition.toLowerCase().includes('cloud') ? '⛅' : '☀️' },
    forecast: { rainfallProbability: rainfallProb, season: new Date().getMonth() >= 5 && new Date().getMonth() <= 9 ? 'Kharif' : 'Rabi' },
    agriRecommendation: {
      irrigationNeeded: rainfallProb < 50,
      irrigationAdvice: rainfallProb >= 60 ? 'Rain expected — reduce irrigation by 40%' : rainfallProb >= 40 ? 'Moderate rain possible — monitor soil moisture' : 'No rain expected — maintain irrigation schedule',
      sprayingAdvice: wind < 15 ? 'Wind speed suitable for pesticide spraying' : 'High wind — avoid spraying, reschedule to early morning',
      heatStressRisk: temp > 38 ? 'High' : temp > 33 ? 'Medium' : 'Low',
      frostRisk: temp < 5 ? 'High' : 'None',
    },
  };
}
