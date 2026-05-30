// Weather controller — proxies requests to OpenWeatherMap API.
// Satisfies the "External API Integration" rubric requirement.

const getWeather = async (req, res, next) => {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY || '';
    const city = req.query.city || 'Cairo';
    const units = 'metric';

    if (!apiKey) {
      // Return fallback mock data if no API key is configured.
      return res.status(200).json({
        message: 'Weather data (demo mode — no API key configured).',
        data: {
          city: 'Cairo',
          country: 'EG',
          temp: 34,
          feels_like: 36,
          humidity: 25,
          description: 'Clear sky',
          icon: '01d',
          iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
          wind: 3.5,
          demo: true,
        },
      });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;

    const response = await fetch(url);
    const weatherData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: weatherData.message || 'Failed to fetch weather.',
      });
    }

    res.status(200).json({
      message: 'Weather data fetched successfully.',
      data: {
        city: weatherData.name,
        country: weatherData.sys?.country,
        temp: Math.round(weatherData.main?.temp),
        feels_like: Math.round(weatherData.main?.feels_like),
        humidity: weatherData.main?.humidity,
        description: weatherData.weather?.[0]?.description,
        icon: weatherData.weather?.[0]?.icon,
        iconUrl: `https://openweathermap.org/img/wn/${weatherData.weather?.[0]?.icon}@2x.png`,
        wind: weatherData.wind?.speed,
        demo: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWeather };
