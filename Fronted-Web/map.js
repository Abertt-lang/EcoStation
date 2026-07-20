const MapView = {
  map: null,
  marker: null,
  circle: null,
  pulseCircle: null,
  initialized: false,

  init() {
    if (this.initialized && this.map) {
      setTimeout(() => this.map.invalidateSize(), 150);
      return;
    }

    const container = document.getElementById('view-map');
    container.innerHTML = `
      <h2 class="section-title"><i data-lucide="map-pin"></i> Mapa de Estaciones</h2>
      <div class="map-container">
        <div id="mapView"></div>
      </div>
    `;
    lucide.createIcons();

    setTimeout(() => {
      this.createMap();
      if (App.stationData) {
        this.updateMarker(App.stationData);
      }
    }, 150);
  },

  createMap() {
    const limaLat = -12.0464;
    const limaLng = -77.0428;

    this.map = L.map('mapView', {
      center: [limaLat, limaLng],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.initialized = true;
  },

  updateMarker(d) {
    if (!this.map || !d) return;

    const lat = d.latitud || -12.0464;
    const lng = d.longitud || -77.0428;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.circle.setLatLng([lat, lng]);
      if (this.pulseCircle) this.pulseCircle.setLatLng([lat, lng]);
    } else {
      const stationIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(74,222,128,0.2);animation:mapPulse 2s ease-out infinite;"></div>
            <div style="position:absolute;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#4ade80,#22d3ee);box-shadow:0 0 16px rgba(74,222,128,0.5);border:2.5px solid rgba(255,255,255,0.9);"></div>
            <div style="position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      this.marker = L.marker([lat, lng], { icon: stationIcon }).addTo(this.map);

      this.circle = L.circle([lat, lng], {
        radius: 300,
        color: 'rgba(74, 222, 128, 0.2)',
        fillColor: 'rgba(74, 222, 128, 0.05)',
        fillOpacity: 1,
        weight: 1.5,
        dashArray: '6 4'
      }).addTo(this.map);
    }

    const batteryColor = d.bateria > 50 ? '#4ade80' : d.bateria > 20 ? '#fbbf24' : '#f87171';
    const statusColor = d.estado === 'en línea' ? '#4ade80' : '#f87171';

    const popupContent = `
      <div style="font-family:'Inter',sans-serif;color:#e2e8f0;min-width:240px;padding:4px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(55,65,81,0.6);">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-size:18px;">📡</span>
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:#e2e8f0;">${d.nombre || 'Estación IoT'}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">${d.id} · <span style="color:${statusColor};">${d.estado || 'desconocido'}</span></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;font-size:13px;">
          <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:16px;">🌡️</span><div><div style="color:#64748b;font-size:11px;">Temp</div><div style="font-weight:700;color:#f87171;">${d.temperatura || '--'}°C</div></div></div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:16px;">💧</span><div><div style="color:#64748b;font-size:11px;">Humedad</div><div style="font-weight:700;color:#60a5fa;">${d.humedad || '--'}%</div></div></div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:16px;">🌬️</span><div><div style="color:#64748b;font-size:11px;">Aire</div><div style="font-weight:700;color:#fbbf24;">AQI ${d.calidadAire || '--'}</div></div></div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:16px;">📊</span><div><div style="color:#64748b;font-size:11px;">Presión</div><div style="font-weight:700;color:#a78bfa;">${d.presion || '--'} hPa</div></div></div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:16px;">🔊</span><div><div style="color:#64748b;font-size:11px;">Ruido</div><div style="font-weight:700;color:#22d3ee;">${d.ruido || '--'} dB</div></div></div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:16px;">☀️</span><div><div style="color:#64748b;font-size:11px;">Luz</div><div style="font-weight:700;color:#fbbf24;">${d.luz || '--'} lux</div></div></div>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(55,65,81,0.6);display:flex;align-items:center;gap:16px;font-size:12px;color:#64748b;">
          <span style="display:flex;align-items:center;gap:4px;"><span style="color:${batteryColor};">●</span> Batería ${d.bateria || '--'}%</span>
          <span style="display:flex;align-items:center;gap:4px;">📶 ${d.wifi || '--'} dBm</span>
          <span style="display:flex;align-items:center;gap:4px;">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        </div>
      </div>
    `;

    this.marker.bindPopup(popupContent, {
      maxWidth: 320,
      minWidth: 260,
      className: 'station-popup'
    }).openPopup();

    this.map.flyTo([lat, lng], 14, { duration: 1.2 });
  }
};

const mapStyles = document.createElement('style');
mapStyles.textContent = `
  @keyframes mapPulse {
    0% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(3); opacity: 0; }
  }

  .station-popup .leaflet-popup-content-wrapper {
    background: rgba(17, 24, 39, 0.95) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(55, 65, 81, 0.6) !important;
    border-radius: 14px !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(55, 65, 81, 0.3) !important;
    padding: 0 !important;
  }

  .station-popup .leaflet-popup-content {
    margin: 16px !important;
    font-family: 'Inter', sans-serif !important;
  }

  .station-popup .leaflet-popup-tip {
    background: rgba(17, 24, 39, 0.95) !important;
    border: 1px solid rgba(55, 65, 81, 0.6) !important;
    box-shadow: none !important;
  }

  .station-popup .leaflet-popup-close-button {
    color: #64748b !important;
    font-size: 20px !important;
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    border-radius: 6px !important;
    top: 8px !important;
    right: 8px !important;
  }

  .station-popup .leaflet-popup-close-button:hover {
    color: #e2e8f0 !important;
    background: rgba(255, 255, 255, 0.05) !important;
  }

  .leaflet-control-zoom a {
    background: rgba(17, 24, 39, 0.9) !important;
    backdrop-filter: blur(8px) !important;
    color: #94a3b8 !important;
    border: 1px solid rgba(55, 65, 81, 0.6) !important;
    width: 34px !important;
    height: 34px !important;
    line-height: 34px !important;
    font-size: 16px !important;
  }

  .leaflet-control-zoom a:hover {
    background: rgba(30, 41, 59, 0.95) !important;
    color: #e2e8f0 !important;
  }

  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
    border-radius: 10px !important;
    overflow: hidden !important;
  }

  .leaflet-control-zoom-in {
    border-bottom: 1px solid rgba(55, 65, 81, 0.4) !important;
  }

  .leaflet-control-attribution {
    background: rgba(17, 24, 39, 0.7) !important;
    backdrop-filter: blur(8px) !important;
    color: #475569 !important;
    font-size: 10px !important;
    border-radius: 6px 0 0 0 !important;
    padding: 2px 8px !important;
  }

  .leaflet-control-attribution a {
    color: #64748b !important;
  }
`;
document.head.appendChild(mapStyles);
