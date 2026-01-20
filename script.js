// In a production app, this should be handled by your backend
const API_KEY = "7838728894de4ecbe7456cd160ed70d6";
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

const elements = {
  searchBtn: document.getElementById("searchBtn"),
  cityInput: document.getElementById("cityInput"),
  errorDiv: document.getElementById("error"),
  weatherDiv: document.getElementById("weather"),
  locationBtn: document.getElementById("locationBtn")
};

// Demo data for when API is not available
const demoData = {
  london: {
    name: "London",
    main: { temp: 18.5, humidity: 72, feels_like: 19.2 },
    weather: [{ description: "partly cloudy", main: "Clouds" }],
    wind: { speed: 3.2 },
    sys: { country: "GB" }
  },
  paris: {
    name: "Paris",
    main: { temp: 22.1, humidity: 58, feels_like: 23.0 },
    weather: [{ description: "clear sky", main: "Clear" }],
    wind: { speed: 2.1 },
    sys: { country: "FR" }
  },
  tokyo: {
    name: "Tokyo",
    main: { temp: 26.3, humidity: 65, feels_like: 28.1 },
    weather: [{ description: "light rain", main: "Rain" }],
    wind: { speed: 1.8 },
    sys: { country: "JP" }
  }
};

function showError(message) {
  elements.errorDiv.textContent = message;
  elements.errorDiv.style.display = "block";
  elements.weatherDiv.innerHTML = "";
}

function hideError() {
  elements.errorDiv.style.display = "none";
}

function displayWeather(data) {
  const weatherEmoji = getWeatherEmoji(data.weather[0].main);
  
  elements.weatherDiv.innerHTML = `
    <div class="weather-card">
      <div class="city-name">${data.name}, ${data.sys.country}</div>
      <div class="temperature">${Math.round(data.main.temp)}°C</div>
      <div class="description">${weatherEmoji} ${data.weather[0].description}</div>
      
      <div class="weather-details">
        <div class="detail-item">
          <div class="detail-label">Feels Like</div>
          <div class="detail-value">${Math.round(data.main.feels_like)}°C</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Humidity</div>
          <div class="detail-value">${data.main.humidity}%</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Wind Speed</div>
          <div class="detail-value">${data.wind.speed} m/s</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Conditions</div>
          <div class="detail-value">${data.weather[0].main}</div>
        </div>
      </div>
    </div>
  `;
}

function getWeatherEmoji(condition) {
  const emojis = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Snow: "❄️",
    Thunderstorm: "⛈️",
    Drizzle: "🌦️",
    Mist: "🌫️",
    Fog: "🌫️"
  };
  return emojis[condition] || "🌤️";
}

function setLoading(loading, btn = elements.searchBtn) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>Loading...';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.id === "locationBtn" ? "📍 My Location" : "Search";
  }
}

async function fetchWeatherData(city) {
  try {
    const response = await fetch(
      `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("City not found. Please check the spelling and try again.");
      } else if (response.status === 401) {
        throw new Error("API key error. Using demo data instead.");
      } else {
        throw new Error("Unable to fetch weather data. Please try again later.");
      }
    }
    
    return await response.json();
  } catch (error) {
    const cityKey = city.toLowerCase();
    if (demoData[cityKey]) {
      console.log("Using demo data for:", city);
      return demoData[cityKey];
    }
    throw error;
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("Unable to fetch location weather.");
    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function searchWeather() {
  const city = elements.cityInput.value.trim();
  
  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  hideError();
  setLoading(true);
  elements.weatherDiv.innerHTML = "";

  try {
    const data = await fetchWeatherData(city);
    displayWeather(data);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

async function searchByLocation() {
  hideError();
  elements.weatherDiv.innerHTML = "";
  setLoading(true, elements.locationBtn);

  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    setLoading(false, elements.locationBtn);
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      const { latitude, longitude } = position.coords;
      const data = await fetchWeatherByCoords(latitude, longitude);
      displayWeather(data);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false, elements.locationBtn);
    }
  }, () => {
    showError("Unable to retrieve your location.");
    setLoading(false, elements.locationBtn);
  });
}

// Event listeners
elements.searchBtn.addEventListener("click", searchWeather);
elements.locationBtn.addEventListener("click", searchByLocation);

elements.cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !elements.searchBtn.disabled) {
    searchWeather();
  }
});

elements.cityInput.addEventListener("input", () => {
  if (elements.errorDiv.style.display !== "none") {
    hideError();
  }
});