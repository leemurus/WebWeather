const favoriteCityForm = document.forms['add-favorite-city'];
const refreshButton = document.getElementsByClassName('refresh-geolocation')[0];
const favoriteCitiesList = document.getElementsByClassName('favorite-cities-list')[0];
const currentCity = document.getElementsByClassName('main-city-container')[0];

//  ======================================== EVENTS ========================================

favoriteCityForm.addEventListener('submit', function (e) {
    const cityInput = document.getElementById('favorite-city-name');
    addFavoriteCity(cityInput.value);
    cityInput.value = '';
    e.preventDefault();
});

favoriteCitiesList.addEventListener('click', function (event) {
    if (!event.target.className.includes('remove-city-button')) {
        return;
    }

    const cityId = event.target.closest('li').id.split('_')[1];
    deleteFavoriteCityById(cityId);
});

refreshButton.addEventListener('click', function () {
    myStorage.clear();
    setLoaderOnCurrentCity();
    loadCoordinatesFromGeolocationAPI();
});

document.addEventListener('DOMContentLoaded', function () {
    initializeLocalStorage();
    setLoaderOnCurrentCity();
    loadCoordinatesFromGeolocationAPI();
    loadCitiesFromLocalStorage();
});


function loadCoordinatesFromGeolocationAPI() {
    navigator.geolocation.getCurrentPosition(function (position) {
        updateCurrentCityInformation({
            'latitude': position.coords.latitude,
            'longitude': position.coords.longitude
        });
    }, function (e) {
        updateCurrentCityInformation({
            'latitude': 59.957216,
            'longitude': 30.308178
        });
        console.warn(`There has been a problem with access to geolocation: ` + e.message)
    });
}

async function updateCurrentCityInformation(coordinates) {
    let weatherData = await getWeatherByCoordinates(coordinates['latitude'], coordinates['longitude'])
    currentCity.removeChild(currentCity.getElementsByClassName('brief-weather-information')[0]);
    currentCity.innerHTML += renderCurrentCityBriefInformation(weatherData);
    currentCity.removeChild(currentCity.getElementsByClassName('full-weather-information')[0]);
    currentCity.innerHTML += renderFullWeatherInformation(weatherData);
    unsetLoaderOnCurrentCity();
}


async function addFavoriteCity(cityName, fromStorage= false) {
    const cityId = fromStorage ? myStorage.getItem(cityName) : generateNewCityId();

    favoriteCitiesList.innerHTML += renderEmptyFavoriteCity(cityId);
    let weatherData = await getWeatherByCityName(cityName);

    if (weatherData['cod'] !== 200) {
        alert('City name is incorrect or information is missing.');
        deleteFavoriteCityByIdFromUI(cityId);
        return;
    }

    if (myStorage.getItem(weatherData['name']) !== null && !fromStorage) {
        alert('You already have this city in favorites');
        deleteFavoriteCityByIdFromUI(cityId);
        return;
    }

    myStorage.setItem(weatherData['name'], cityId);
    const cityObject = document.getElementById(`favorite_${cityId}`);
    cityObject.innerHTML += renderFavoriteCityBriefInformation(weatherData);
    cityObject.innerHTML += renderFullWeatherInformation(weatherData);
    unsetLoaderOnFavoriteCity(cityId);
}

function deleteFavoriteCityById(cityId) {
    // We can't delete pair from storage by value - we need search the key
    for (let key of getCityListFromStorage()) {
        if (myStorage.getItem(key) === cityId) {
            myStorage.removeItem(key);
            break
        }
    }

    deleteFavoriteCityByIdFromUI(cityId);
}

function deleteFavoriteCityByIdFromUI(cityId) {
    const cityObject = document.getElementById(`favorite_${cityId}`);
    cityObject.remove();
}

//  ======================================== RENDERING ========================================

function renderCurrentCityBriefInformation(weatherData) {
    return `
        <div class="brief-weather-information">
            <h2>${weatherData['name']}</h2>
            <div class="temperature-information">
                <img src="${getWeatherIcon(weatherData['weather'][0]['icon'])}" class="weather-icon" alt="Иконка погоды">
                <span class="temperature-number">${Math.round(weatherData['main']['temp_min'])}&deg;C</span>
            </div>
        </div>
    `
}

function renderFavoriteCityBriefInformation(weatherData) {
    return `
        <div class="brief-weather-information">
            <h3 class="city-name">${weatherData['name']}</h3>
            <span class="temperature-number">${Math.round(weatherData['main']['temp_min'])}&deg;C</span>
            <img src="${getWeatherIcon(weatherData['weather'][0]['icon'])}" class="weather-icon" alt="Иконка погоды">
            <button class="remove-city-button round-button">+</button>
        </div>
    `
}

function renderFullWeatherInformation(weatherData) {
    return `
        <ul class="full-weather-information">
            <li><span class="key">Ветер</span> <span class="value">${weatherData['wind']['speed']} m/s, ${weatherData['wind']['deg']}</span></li>
            <li><span class="key">Облачность</span> <span class="value">${weatherData['weather'][0]['main']}</span></li>
            <li><span class="key">Давление</span> <span class="value">${weatherData['main']['pressure']} hpa</span></li>
            <li><span class="key">Влажность</span> <span class="value">${weatherData['main']['humidity']}%</span></li>
            <li><span class="key">Координаты</span> <span class="value">[${weatherData['coord']['lat']}, ${weatherData['coord']['lon']}]</span></li>
        </ul>`
}

function renderEmptyFavoriteCity(cityId) {
    return `
        <li class="loader-on" id="favorite_${cityId}">
            <div class="city-loader">
                <span>Подождите, данные загружаются</span>
                <div class="loader-icon"></div>
            </div>
        </li>
    `
}

//  ======================================== LOADER ========================================

function setLoaderOnCurrentCity() {
    if (!currentCity.classList.contains('loader-on')) {
        currentCity.classList.add('loader-on');
    }
}

function unsetLoaderOnCurrentCity() {
    currentCity.classList.remove('loader-on');
}

function unsetLoaderOnFavoriteCity(cityId) {
    const cityObject = document.getElementById(`favorite_${cityId}`);
    cityObject.classList.remove('loader-on');
}