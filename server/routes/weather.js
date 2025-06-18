import express from 'express';


// your routes here...


const router = express.Router();

// GET /api/weather?city=CityName
router.get('/weather', async (req, res) => {
  const city = req.query.city;
  const apiKey = 'ca62432f13bb64c728b7054f08f07686';

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(data.cod).json({ error: data.message });
    }

    res.json({
      city: data.name,
      temperature: data.main.temp,
      condition: data.weather[0].description,
    });
  } catch (err) {
    console.error('Weather API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export default router;
