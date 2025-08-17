function initPage() {
    const cityEl = document.getElementById("enter-city");
    const searchEl = document.getElementById("search-button");
    const clearEl = document.getElementById("clear-history");
    const nameEl = document.getElementById("city-name");
    const currentPicEl = document.getElementById("current-pic");
    const currentTempEl = document.getElementById("temperature");
    const currentHumidityEl = document.getElementById("humidity");
    const currentWindEl = document.getElementById("wind-speed");
    const currentUVEl = document.getElementById("UV-index");
    const currentDateEl = document.getElementById("current-date");
    const forecastCols = document.querySelectorAll(".forecast-col");
    const fivedayEl = document.getElementById("fiveday-header");
    const todayweatherEl = document.getElementById("today-weather");
    const historyEl = document.getElementById("history");
    const airQualityEl = document.getElementById("air-quality");
    const sunriseEl = document.getElementById("sunrise");
    const sunsetEl = document.getElementById("sunset");
    const detectLocBtn = document.getElementById("detect-location");
    const unitToggle = document.getElementById("unitToggle");
    let searchHistory = JSON.parse(localStorage.getItem("search")) || [];
    let useCelsius = JSON.parse(localStorage.getItem("useCelsius")) || false;

    // Set toggle based on preference
    unitToggle.checked = useCelsius;

    renderSearchHistory();
    if (searchHistory.length > 0) {
        getWeather(searchHistory[searchHistory.length - 1]);
    }

    searchEl.addEventListener("click", handleSearch);
    clearEl.addEventListener("click", clearHistory);
    unitToggle.addEventListener('change', function(){
      useCelsius = this.checked;
      localStorage.setItem('useCelsius', JSON.stringify(useCelsius));
      if (todayweatherEl && !todayweatherEl.classList.contains("d-none")) {
          handleSearch(false, true); // Update the card if visible
      }
    });
    detectLocBtn.addEventListener("click", function() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude, lon = position.coords.longitude;
                axios.get(`/weather_by_coords?lat=${lat}&lon=${lon}`).then(res => {
                    renderWeatherData(res.data, true);
                });
            }, function(err) {
                alert('Geolocation error. Please allow or use city search.');
            });
        } else {
            alert("Geolocation not supported.");
        }
    });
    cityEl.addEventListener("keypress", function(e) {
        if (e.key === "Enter") handleSearch();
    });

    function handleSearch(pushHistory=true, rerender=false) {
        const searchTerm = rerender ? nameEl.textContent.split(" (")[0] : cityEl.value.trim();
        if (!searchTerm) return;
        getWeather(searchTerm, pushHistory);
        if (pushHistory && !searchHistory.includes(searchTerm)) {
            searchHistory.push(searchTerm);
            localStorage.setItem("search", JSON.stringify(searchHistory));
            renderSearchHistory();
        }
        cityEl.value = "";
    }

    function getWeather(cityName, addToHistory=true) {
        axios.get(`/weather/${encodeURIComponent(cityName)}`)
            .then(function (response) {
                renderWeatherData(response.data, addToHistory);
            })
            .catch(function(error) {
                console.error("Error fetching weather data from backend:", error);
                alert("Could not retrieve weather data. Please try again.");
            });
    }

    function renderWeatherData(data, addToHistory) {
        if (!data || data.cod && data.cod !== 200) {
            alert("City not found.");
            return;
        }
        todayweatherEl.classList.remove("d-none");
        // Date
        const currentDate = new Date(data.dt * 1000);
        currentDateEl.textContent = formatDate(currentDate);
        // City
        nameEl.innerHTML = `${data.name} <span class="h4 text-muted">(${formatDate(currentDate, true)})</span>`;
        // Icon
        const weatherIcon = data.weather[0].icon;
        currentPicEl.setAttribute("src", `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`);
        currentPicEl.setAttribute("alt", data.weather.description);
        // Temperature
        let tempValue = useCelsius ? `${k2c(data.main.temp)}°C` : `${k2f(data.main.temp)}°F`;
        currentTempEl.innerHTML = tempValue;
        currentHumidityEl.textContent = `${data.main.humidity}%`;
        currentWindEl.textContent = useCelsius
            ? `${ms2kmh(data.wind.speed)} km/h` : `${ms2mph(data.wind.speed)} MPH`;
        // UV
        const lat = data.coord.lat, lon = data.coord.lon;
        getUVIndex(lat, lon);
        getAirQuality(lat, lon);
        // 5-day
        getForecast(data.id);
        // Sunrise & sunset
        sunriseEl.textContent = formatTime(new Date(data.sys.sunrise * 1000));
        sunsetEl.textContent = formatTime(new Date(data.sys.sunset * 1000));
    }

    function getAirQuality(lat, lon) {
        axios.get(`/air_quality?lat=${lat}&lon=${lon}`).then(res => {
            const aqiValue = res.data.list[0].main.aqi;
            let level = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
            let color = ["#43a047", "#ffee58", "#ffa726", "#ef5350", "#b71c1c"];
            airQualityEl.textContent = `${aqiValue} (${level[aqiValue-1]})`;
            airQualityEl.style.color = color[aqiValue-1];
        }).catch(() => {
            airQualityEl.textContent = "N/A";
            airQualityEl.style.color = "";
        });
    }

    function getUVIndex(lat, lon) {
        axios.get(`/uvindex?lat=${lat}&lon=${lon}`)
            .then(function (response) {
                const data = response.data;
                const UVIndex = document.createElement("span");
                UVIndex.classList.add("uv-badge", "ml-2");
                if (data.value < 3) {
                    UVIndex.classList.add("bg-success");
                } else if (data.value < 6) {
                    UVIndex.classList.add("bg-warning");
                } else if (data.value < 8) {
                    UVIndex.classList.add("bg-orange");
                } else {
                    UVIndex.classList.add("bg-danger");
                }
                UVIndex.textContent = data.value;
                currentUVEl.innerHTML = "UV Index: ";
                currentUVEl.appendChild(UVIndex);
            })
            .catch(function() {
                currentUVEl.textContent = "N/A";
            });
    }

    function getForecast(cityID) {
        axios.get(`/forecast/${cityID}`)
            .then(function (response) {
                const data = response.data;
                fivedayEl.classList.remove("d-none");
                const dailyForecasts = data.list.filter(forecast =>
                    forecast.dt_txt.includes("12:00:00")
                );
                forecastCols.forEach((col, i) => {
                    if (dailyForecasts[i]) {
                        const forecast = dailyForecasts[i];
                        col.style.display = "block";
                        const date = new Date(forecast.dt * 1000);
                        col.querySelector(".forecast-date").textContent = formatDate(date, true);
                        const icon = col.querySelector(".weather-icon");
                        icon.setAttribute("src", `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`);
                        icon.setAttribute("alt", forecast.weather.description);
                        let tempVal = useCelsius
                            ? `${k2c(forecast.main.temp)}°C`
                            : `${k2f(forecast.main.temp)}°F`;
                        col.querySelector(".forecast-temp").innerHTML = tempVal;
                        col.querySelector(".forecast-humidity").textContent = `Humidity: ${forecast.main.humidity}%`;
                    } else {
                        col.style.display = "none";
                    }
                });
            })
            .catch(function() {
                fivedayEl.classList.add("d-none");
            });
    }

    function k2f(K) { return Math.round((K - 273.15) * 1.8 + 32);}
    function k2c(K) { return Math.round(K - 273.15);}
    function ms2mph(ms) { return (ms * 2.23694).toFixed(1);}
    function ms2kmh(ms) { return (ms * 3.6).toFixed(1);}
    function formatDate(date, short = false) {
        if (short) {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric'
            }).format(date);
        }
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }
    function formatTime(dateObj) {
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    function renderSearchHistory() {
        historyEl.innerHTML = "";
        searchHistory.forEach(city => {
            const historyItem = document.createElement("button");
            historyItem.classList.add("history-btn", "btn", "btn-block", "p-3");
            historyItem.textContent = city;
            historyItem.addEventListener("click", function() {
                getWeather(city, false);
            });
            historyEl.appendChild(historyItem);
        });
    }
    function clearHistory() {
        localStorage.clear();
        searchHistory = [];
        renderSearchHistory();
    }
}

initPage();
