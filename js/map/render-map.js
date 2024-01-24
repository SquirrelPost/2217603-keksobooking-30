import { renderAdvert } from '../data/render-adverts.js';
import { activateFilters, activateForm } from '../set-activity.js';
import { filterAdverts } from './filters.js';
import { debounce } from '../util.js';
import { getData } from '../data/server-data.js';
import { initForm } from '../form/form-handler.js';

// Изначальные данные
const DATA_URL = 'https://30.javascript.pages.academy/keksobooking/data';
const TILE_LAYER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const COPYRIGHT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DECIMAL_PLACES_COUNT = 5;
const ZOOM = 13;
// Данные иконок
const mainIconConfig = {
  url: './img/main-pin.svg',
  width: 52,
  height: 52,
  anchorX: 26,
  anchorY: 52,
};
const iconConfig = {
  url: './img/pin.svg',
  width: 40,
  height: 40,
  anchorX: 20,
  anchorY: 40,
};
const CITY_CENTER = {
  lat: 35.67640,
  lng: 139.76134,
};

// Нужная разметка
const mapContainer = document.querySelector('.map__canvas');
const filtersForm = document.querySelector('.map__filters');
// const addressForm = adForm.querySelector('#address');

// Создаем карту
const map = L.map(mapContainer);

// Пустая переменная для массива с данными
let dataAdverts = [];

// Переменные для отрисовки маркеров
let markersList = Array.from(filtersForm.querySelectorAll('.map__checkbox:checked'), (element) => element.value);
let currentsMarkers;

// Создаем иконку для главного маркера
const mainPinIcon = L.icon({
  iconUrl: mainIconConfig.url,
  iconSize: [mainIconConfig.width, mainIconConfig.height],
  iconAnchor: [mainIconConfig.anchorX, mainIconConfig.anchorY],
});

// Создаем главный маркер, который можно перетаскивать и добавляем его на карту
const mainPinMarker = L.marker(CITY_CENTER, {
  draggable: true,
  icon: mainPinIcon,
}).addTo(map);

// Берет новые координаты из маркера и ставит их в нужное поле
const onMoveendMainPinMarker = (evt, address) => {
  const newPosition = evt.target.getLatLng();
  address.value = `${newPosition.lat.toFixed(DECIMAL_PLACES_COUNT)}, ${newPosition.lng.toFixed(DECIMAL_PLACES_COUNT)}`;
};

// Обнуляет маркер и позволяет реагировать на перенос маркера
const renderMainPinMarkerCoordinates = (address) => {
  address.value = `${CITY_CENTER.lat.toFixed(DECIMAL_PLACES_COUNT)}, ${CITY_CENTER.lng.toFixed(DECIMAL_PLACES_COUNT)}`;
  mainPinMarker.on('moveend', (evt) => onMoveendMainPinMarker(evt, address));
};

// Создаем иконку для обычного маркера
const createPinIcon = () => L.icon({
  iconUrl: iconConfig.url,
  iconSize: [iconConfig.width, iconConfig.height],
  iconAnchor: [iconConfig.anchorX, iconConfig.anchorY],
});

// Создает группу маркеров
const markersGroup = L.layerGroup().addTo(map);

// Создает похожие маркеры
const createSimilarMarker = (advert) => L.marker(advert.location, {
  icon: createPinIcon(),
}).addTo(markersGroup)
  .bindPopup(renderAdvert(advert));

// Отрисовывает маркеры по массиву (фильтрованному)
const createMarkers = (adverts) => {
  currentsMarkers = adverts;
  filterAdverts(currentsMarkers, markersList).forEach((point) => createSimilarMarker(point));
  activateFilters();
};

// Что происходит при изменении фильтров
const onFilterChange = debounce(() => {
  markersGroup.clearLayers();
  markersList = Array.from(filtersForm.querySelectorAll('.map__checkbox:checked'), (element) => element.value);
  filterAdverts(currentsMarkers, markersList).forEach((data) => createSimilarMarker(data));
});

// Функция начала отрисовки маркеров по полученным данным
const initSimilarMarkers = () => getData(DATA_URL, createMarkers);

// Отрисовываем маркеры по массиву и ждем изменений на фильтры
const renderMarkers = (adverts) => {
  dataAdverts = adverts;
  createMarkers(dataAdverts);
  filtersForm.addEventListener('change', () => onFilterChange(adverts));
};

// Отрисовываем карту и активируем форму при загрузке карты
const renderMap = () => {
  map.on('load', () => {
    initForm();
    activateForm();
    initSimilarMarkers();
    filtersForm.addEventListener('change', onFilterChange);
  }).setView(CITY_CENTER, ZOOM);

  // Добавляем слой непосредственно с рисунком карты
  L.tileLayer(TILE_LAYER, {
    attribution: COPYRIGHT
  }).addTo(map);
};

const resetMap = (address) => {
  map.closePopup();
  mainPinMarker.setLatLng(CITY_CENTER);
  map.setView(CITY_CENTER, ZOOM);
  address.value = `${CITY_CENTER.lat.toFixed(DECIMAL_PLACES_COUNT)}, ${CITY_CENTER.lng.toFixed(DECIMAL_PLACES_COUNT)}`;
  filtersForm.reset();
  onFilterChange();

  if (dataAdverts.length !== 0) {
    markersGroup.clearLayers();
    createMarkers(dataAdverts);
    filtersForm.reset();
  }
};

export { renderMap, renderMainPinMarkerCoordinates, renderMarkers, resetMap };
