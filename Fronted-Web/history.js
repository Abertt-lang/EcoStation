const HistoryView = {
  records: [],
  maxRecords: 50,

  render() {
    const container = document.getElementById('view-history');
    container.innerHTML = `
      <h2 class="section-title"><i data-lucide="clock"></i> Historial de Lecturas</h2>
      <div class="table-container">
        <table class="data-table" id="historyTable">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Temp (°C)</th>
              <th>Humedad (%)</th>
              <th>Aire (AQI)</th>
              <th>Presión (hPa)</th>
              <th>Ruido (dB)</th>
              <th>Luz (lux)</th>
            </tr>
          </thead>
          <tbody id="historyBody">
            <tr>
              <td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px;">
                Esperando lecturas en tiempo real...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    lucide.createIcons();

    // Restore existing records
    if (this.records.length > 0) {
      this.renderTable();
    }
  },

  addRecord(d) {
    if (!d) return;

    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.records.unshift({
      time: now,
      temp: d.temperatura || '--',
      hum: d.humedad || '--',
      air: d.calidadAire || '--',
      pres: d.presion || '--',
      ruido: d.ruido || '--',
      luz: d.luz || '--'
    });

    if (this.records.length > this.maxRecords) {
      this.records.pop();
    }

    if (App.currentRoute === 'history') {
      this.renderTable();
    }
  },

  renderTable() {
    const body = document.getElementById('historyBody');
    if (!body) return;

    body.innerHTML = this.records.map(r => `
      <tr>
        <td style="color:var(--text-muted);font-variant-numeric:tabular-nums;">${r.time}</td>
        <td>${r.temp}</td>
        <td>${r.hum}</td>
        <td>${r.air}</td>
        <td>${r.pres}</td>
        <td>${r.ruido}</td>
        <td>${r.luz}</td>
      </tr>
    `).join('');
  }
};
