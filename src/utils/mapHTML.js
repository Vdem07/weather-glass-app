/**
 * mapHTML
 *
 * Генератор HTML-страницы с интерактивной картой Leaflet + OpenWeatherMap.
 * Передаётся в WebView как source.html.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {string} cityName
 * @param {string} countryName
 * @param {string} selectedLayer — начальный слой карты
 * @param {{ temperature, wind, pressure }} units — единицы измерения
 * @returns {string} HTML-строка
 */

export const buildMapHTML = (lat, lon, cityName, countryName, selectedLayer, units) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    #map { height: 100vh; width: 100vw; }
    .legend {
      position: absolute; bottom: 185px; right: 10px;
      background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
      padding: 12px; border-radius: 12px; font-size: 11px;
      z-index: 1000; max-width: 180px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .leaflet-control-zoom { margin-top: 120px !important; }
    .legend-title { font-weight: 600; margin-bottom: 8px; color: #1a1a1a; font-size: 12px; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 6px; }
    .legend-item { display: flex; align-items: center; margin-bottom: 3px; font-size: 10px; }
    .legend-color { width: 14px; height: 14px; margin-right: 6px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; }
    .legend-item span { color: #333; font-weight: 500; line-height: 1.2; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="legend" id="legend"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const API_KEY = 'f24d4864f20da298fdd9ec2436343f99';
    let map, currentLayer;
    let currentUnits = { temperature: '${units.temperature}', wind: '${units.wind}', pressure: '${units.pressure}' };

    const convertTemperature = (c, u) => u === 'imperial' ? Math.round(c * 9/5 + 32) : Math.round(c);
    const getTemperatureUnit = (u) => u === 'imperial' ? '°F' : '°C';
    const convertWindSpeed = (ms, u) => u === 'km/h' ? Math.round(ms * 3.6) : u === 'mph' ? Math.round(ms * 2.237) : Math.round(ms);
    const getWindSpeedUnit = (u) => u === 'km/h' ? 'км/ч' : u === 'mph' ? 'mph' : 'м/с';
    const convertPressure = (hPa, u) => u === 'mmHg' ? Math.round(hPa * 0.750062) : u === 'bar' ? (hPa / 1000).toFixed(2) : u === 'psi' ? (hPa * 0.0145038).toFixed(1) : Math.round(hPa);
    const getPressureUnit = (u) => u === 'mmHg' ? 'мм рт.ст.' : u === 'bar' ? 'бар' : u === 'psi' ? 'PSI' : 'гПа';

    function initMap() {
      map = L.map('map').setView([${lat}, ${lon}], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
      L.marker([${lat}, ${lon}]).addTo(map).bindPopup('<b>${cityName}</b><br>${countryName}').openPopup();
      updateLayer('${selectedLayer}');
    }

    function updateLayer(type) {
      if (currentLayer) map.removeLayer(currentLayer);
      const urls = { precipitation: 'precipitation_new', clouds: 'clouds_new', temperature: 'temp_new', wind: 'wind_new', pressure: 'pressure_new' };
      currentLayer = L.tileLayer(\`https://tile.openweathermap.org/map/\${urls[type]}/{z}/{x}/{y}.png?appid=\${API_KEY}\`, { opacity: 0.8 }).addTo(map);
      updateLegend(type);
    }

    function updateLegend(type) {
      const names = { precipitation: 'Осадки', clouds: 'Облачность', temperature: 'Температура', wind: 'Ветер', pressure: 'Давление' };
      const tu = getTemperatureUnit(currentUnits.temperature);
      const wu = getWindSpeedUnit(currentUnits.wind);
      const pu = getPressureUnit(currentUnits.pressure);
      const ct = (v) => convertTemperature(v, currentUnits.temperature);
      const cw = (v) => convertWindSpeed(v, currentUnits.wind);
      const cp = (v) => convertPressure(v, currentUnits.pressure);

      const legends = {
        precipitation: [
          { color: '#e1c864', label: '0.1 мм/ч' }, { color: '#9696aa', label: '0.5 мм/ч' },
          { color: '#7878bd', label: '1 мм/ч' },   { color: '#6e6ecd', label: '10 мм/ч' },
          { color: '#5050e1', label: '50 мм/ч' },  { color: '#1414ff', label: '140+ мм/ч' },
        ],
        clouds: [
          { color: 'rgba(255,255,255,0.2)', label: '10%',  border: true },
          { color: 'rgba(250,250,255,0.4)', label: '30%',  border: true },
          { color: 'rgba(247,247,255,0.6)', label: '50%',  border: true },
          { color: 'rgba(244,244,255,0.8)', label: '70%',  border: true },
          { color: 'rgba(242,241,255,1)',   label: '90%',  border: true },
          { color: 'rgba(240,240,255,1)',   label: '100%', border: true },
        ],
        temperature: [
          { color: '#821692', label: ct(-40) + tu }, { color: '#8257db', label: ct(-30) + tu },
          { color: '#208cec', label: ct(-20) + tu }, { color: '#20c4e8', label: ct(-10) + tu },
          { color: '#23dddd', label: ct(0)   + tu }, { color: '#c2ff28', label: ct(10)  + tu },
          { color: '#fff028', label: ct(20)  + tu }, { color: '#ffc228', label: ct(25)  + tu },
          { color: '#fc8014', label: ct(30)  + '+' + tu },
        ],
        wind: [
          { color: 'rgba(255,255,255,0.3)', label: \`0-\${cw(1)} \${wu}\`,           border: true },
          { color: 'rgba(238,206,206,0.6)', label: \`\${cw(1)}-\${cw(5)} \${wu}\`,    border: true },
          { color: 'rgba(179,100,188,0.8)', label: \`\${cw(5)}-\${cw(15)} \${wu}\`   },
          { color: 'rgba(63,33,59,0.9)',    label: \`\${cw(15)}-\${cw(25)} \${wu}\`  },
          { color: 'rgba(116,76,172,1)',    label: \`\${cw(25)}-\${cw(50)} \${wu}\`  },
          { color: 'rgba(70,0,175,1)',      label: \`\${cw(50)}-\${cw(100)} \${wu}\` },
          { color: 'rgba(13,17,38,1)',      label: \`\${cw(100)}+ \${wu}\`           },
        ],
        pressure: [
          { color: '#0073ff', label: \`\${cp(940)} \${pu}\`   }, { color: '#00aaff', label: \`\${cp(960)} \${pu}\`   },
          { color: '#4bd0d6', label: \`\${cp(980)} \${pu}\`   }, { color: '#8de7c7', label: \`\${cp(1000)} \${pu}\`  },
          { color: '#b0f720', label: \`\${cp(1010)} \${pu}\`  }, { color: '#f0b800', label: \`\${cp(1020)} \${pu}\`  },
          { color: '#fb5515', label: \`\${cp(1040)} \${pu}\`  }, { color: '#f3363b', label: \`\${cp(1060)} \${pu}\`  },
          { color: '#c60000', label: \`\${cp(1080)}+ \${pu}\` },
        ],
      };

      document.getElementById('legend').innerHTML =
        \`<div class="legend-title">\${names[type]}</div>\` +
        legends[type].map(i =>
          \`<div class="legend-item"><div class="legend-color" style="background-color:\${i.color};\${i.border ? 'border:1.5px solid #666;' : ''}"></div><span>\${i.label}</span></div>\`
        ).join('');
    }

    window.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'changeLayer') updateLayer(data.layer);
      else if (data.action === 'updateUnits') { currentUnits = data.units; updateLegend(data.currentLayer || 'precipitation'); }
    });

    document.addEventListener('DOMContentLoaded', initMap);
  </script>
</body>
</html>`;
