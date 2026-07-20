const StationsView = {
  render() {
    const container = document.getElementById('view-stations');
    container.innerHTML = `
      <h2 class="section-title"><i data-lucide="radio-tower"></i> Estaciones</h2>
      <div id="stationsContent">
        <div class="empty-state">
          <i data-lucide="loader"></i>
          <p>Cargando datos de la estación...</p>
        </div>
      </div>
    `;
    lucide.createIcons();

    if (App.stationData) {
      this.update(App.stationData);
    }
  },

  update(d) {
    if (!d) return;
    const container = document.getElementById('stationsContent');
    if (!container) return;

    const batteryColor = d.bateria > 50 ? '#3fb950' : d.bateria > 20 ? '#d29922' : '#f85149';
    const wifiColor = d.wifi > -50 ? '#3fb950' : d.wifi > -70 ? '#d29922' : '#f85149';

    container.innerHTML = `
      <div class="info-bar">
        <div class="info-chip"><i data-lucide="radio"></i> ID: <span class="val">${d.id}</span></div>
        <div class="info-chip"><i data-lucide="circle-dot"></i> Estado: <span class="val" style="color:${d.estado === 'en línea' ? '#3fb950' : '#f85149'}">${d.estado || 'Desconocido'}</span></div>
        <div class="info-chip"><i data-lucide="battery"></i> Batería: <span class="val" style="color:${batteryColor}">${d.bateria || '--'}%</span></div>
        <div class="info-chip"><i data-lucide="signal"></i> WiFi: <span class="val" style="color:${wifiColor}">${d.wifi || '--'} dBm</span></div>
        <div class="info-chip"><i data-lucide="map-pin"></i> Ubicación: <span class="val">${d.latitud}, ${d.longitud}</span></div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>Valor</th>
              <th>Unidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><i data-lucide="thermometer" style="width:16px;height:16px;color:#f85149;"></i> Temperatura</td>
              <td style="font-weight:600;">${d.temperatura || '--'}</td>
              <td>°C</td>
              <td>${this.statusTag(d.temperatura, 18, 30, 38)}</td>
            </tr>
            <tr>
              <td><i data-lucide="droplets" style="width:16px;height:16px;color:#58a6ff;"></i> Humedad</td>
              <td style="font-weight:600;">${d.humedad || '--'}</td>
              <td>%</td>
              <td>${this.statusTag(d.humedad, 30, 70, 85)}</td>
            </tr>
            <tr>
              <td><i data-lucide="wind" style="width:16px;height:16px;color:#d29922;"></i> Calidad del Aire</td>
              <td style="font-weight:600;">${d.calidadAire || '--'}</td>
              <td>AQI</td>
              <td>${this.statusTag(d.calidadAire, 0, 100, 200)}</td>
            </tr>
            <tr>
              <td><i data-lucide="gauge" style="width:16px;height:16px;color:#bc8cff;"></i> Presión Atmosférica</td>
              <td style="font-weight:600;">${d.presion || '--'}</td>
              <td>hPa</td>
              <td>${d.presion >= 1000 ? '<span class="stat-card-badge ok">Normal</span>' : '<span class="stat-card-badge warn">Baja</span>'}</td>
            </tr>
            <tr>
              <td><i data-lucide="volume-2" style="width:16px;height:16px;color:#39d2c0;"></i> Nivel de Ruido</td>
              <td style="font-weight:600;">${d.ruido || '--'}</td>
              <td>dB</td>
              <td>${this.statusTag(d.ruido, 0, 60, 80)}</td>
            </tr>
            <tr>
              <td><i data-lucide="sun" style="width:16px;height:16px;color:#d29922;"></i> Luz</td>
              <td style="font-weight:600;">${d.luz || '--'}</td>
              <td>lux</td>
              <td>${d.luz > 500 ? '<span class="stat-card-badge warn">Alta</span>' : '<span class="stat-card-badge ok">Normal</span>'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    lucide.createIcons();
  },

  statusTag(val, lowOk, warn, danger) {
    if (val === undefined || val === null) return '<span class="stat-card-badge ok">--</span>';
    if (val >= danger) return '<span class="stat-card-badge danger">Crítico</span>';
    if (val >= warn) return '<span class="stat-card-badge warn">Alerta</span>';
    return '<span class="stat-card-badge ok">Normal</span>';
  }
};
