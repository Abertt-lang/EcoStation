const Dashboard = {
  chart: null,
  chartData: { labels: [], temperatura: [], humedad: [], calidadAire: [], presion: [], ruido: [], luz: [] },
  maxDataPoints: 20,

  init(data) {
    this.render();
    this.setupChart();
    if (data) this.update(data);
  },

  render() {
    const container = document.getElementById('view-dashboard');
    container.innerHTML = `
      <div class="info-bar" id="dashInfoBar">
        <div class="info-chip"><i data-lucide="radio"></i> Estación: <span class="val">Cargando...</span></div>
        <div class="info-chip"><i data-lucide="signal"></i> WiFi: <span class="val">--</span></div>
        <div class="info-chip"><i data-lucide="battery"></i> Batería: <span class="val">--</span></div>
        <div class="info-chip"><i data-lucide="circle-dot"></i> Estado: <span class="val">--</span></div>
      </div>

      <div class="cards-grid">
        <div class="stat-card card-temp">
          <div class="stat-card-header">
            <span class="stat-card-label"><i data-lucide="thermometer" style="color:#f87171;"></i> Temperatura</span>
            <span class="stat-card-badge ok" id="badgeTemp">OK</span>
          </div>
          <div class="stat-card-value" id="valTemp" style="color:#f87171;">--<span class="unit">°C</span></div>
          <div class="stat-card-footer"><i data-lucide="activity"></i> <span id="diffTemp">Esperando datos...</span></div>
        </div>

        <div class="stat-card card-hum">
          <div class="stat-card-header">
            <span class="stat-card-label"><i data-lucide="droplets" style="color:#60a5fa;"></i> Humedad</span>
            <span class="stat-card-badge ok" id="badgeHum">OK</span>
          </div>
          <div class="stat-card-value" id="valHum" style="color:#60a5fa;">--<span class="unit">%</span></div>
          <div class="stat-card-footer"><i data-lucide="activity"></i> <span id="diffHum">Esperando datos...</span></div>
        </div>

        <div class="stat-card card-air">
          <div class="stat-card-header">
            <span class="stat-card-label"><i data-lucide="wind" style="color:#fbbf24;"></i> Calidad Aire</span>
            <span class="stat-card-badge ok" id="badgeAir">OK</span>
          </div>
          <div class="stat-card-value" id="valAir" style="color:#fbbf24;">--<span class="unit">AQI</span></div>
          <div class="stat-card-footer"><i data-lucide="activity"></i> <span id="diffAir">Esperando datos...</span></div>
        </div>

        <div class="stat-card card-pres">
          <div class="stat-card-header">
            <span class="stat-card-label"><i data-lucide="gauge" style="color:#a78bfa;"></i> Presión</span>
            <span class="stat-card-badge ok" id="badgePres">OK</span>
          </div>
          <div class="stat-card-value" id="valPres" style="color:#a78bfa;">--<span class="unit">hPa</span></div>
          <div class="stat-card-footer"><i data-lucide="activity"></i> <span id="diffPres">Esperando datos...</span></div>
        </div>

        <div class="stat-card card-noise">
          <div class="stat-card-header">
            <span class="stat-card-label"><i data-lucide="volume-2" style="color:#22d3ee;"></i> Ruido</span>
            <span class="stat-card-badge ok" id="badgeRuido">OK</span>
          </div>
          <div class="stat-card-value" id="valRuido" style="color:#22d3ee;">--<span class="unit">dB</span></div>
          <div class="stat-card-footer"><i data-lucide="activity"></i> <span id="diffRuido">Esperando datos...</span></div>
        </div>

        <div class="stat-card card-light">
          <div class="stat-card-header">
            <span class="stat-card-label"><i data-lucide="sun" style="color:#fbbf24;"></i> Luz</span>
            <span class="stat-card-badge ok" id="badgeLuz">OK</span>
          </div>
          <div class="stat-card-value" id="valLuz" style="color:#fbbf24;">--<span class="unit">lux</span></div>
          <div class="stat-card-footer"><i data-lucide="activity"></i> <span id="diffLuz">Esperando datos...</span></div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <span class="chart-title"><i data-lucide="trending-up" style="width:18px;height:18px;color:var(--blue);vertical-align:middle;margin-right:8px;"></i>Tendencia en Tiempo Real</span>
          <div class="chart-tabs">
            <button class="chart-tab active" data-metric="temperatura">Temp</button>
            <button class="chart-tab" data-metric="humedad">Humedad</button>
            <button class="chart-tab" data-metric="calidadAire">Aire</button>
            <button class="chart-tab" data-metric="ruido">Ruido</button>
          </div>
        </div>
        <div class="chart-body">
          <canvas id="realtimeChart"></canvas>
        </div>
      </div>
    `;

    document.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.switchChartMetric(e.target.dataset.metric);
      });
    });

    lucide.createIcons();
  },

  setupChart() {
    const ctx = document.getElementById('realtimeChart');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Temperatura (°C)',
          data: [],
          borderColor: '#f87171',
          backgroundColor: 'rgba(248,113,113,0.06)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#f87171',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            borderColor: 'rgba(55, 65, 81, 0.6)',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            padding: 12,
            cornerRadius: 10,
            titleFont: { weight: '600', size: 13 },
            bodyFont: { size: 12 },
            displayColors: true,
            boxPadding: 4
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(55, 65, 81, 0.3)', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 11 }, maxRotation: 0 },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(55, 65, 81, 0.3)', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 11 }, padding: 8 },
            border: { display: false }
          }
        }
      }
    });
  },

  switchChartMetric(metric) {
    const labels = {
      temperatura: { label: 'Temperatura (°C)', color: '#f87171' },
      humedad: { label: 'Humedad (%)', color: '#60a5fa' },
      calidadAire: { label: 'Calidad Aire (AQI)', color: '#fbbf24' },
      ruido: { label: 'Ruido (dB)', color: '#22d3ee' }
    };

    const config = labels[metric];
    if (!config || !this.chart) return;

    this.chart.data.datasets[0] = {
      label: config.label,
      data: this.chartData[metric] || [],
      borderColor: config.color,
      backgroundColor: config.color + '10',
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: config.color,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2
    };
    this.chart.data.labels = this.chartData.labels || [];
    this.chart.update('none');
  },

  getBadge(val, thresholds) {
    if (val > thresholds.danger) return { text: 'Crítico', cls: 'danger' };
    if (val > thresholds.warn) return { text: 'Alerta', cls: 'warn' };
    return { text: 'Normal', cls: 'ok' };
  },

  update(d) {
    if (!d) return;

    const infoBar = document.getElementById('dashInfoBar');
    if (infoBar) {
      const chips = infoBar.querySelectorAll('.info-chip .val');
      chips[0].textContent = d.nombre || d.id;
      chips[1].textContent = d.wifi ? `${d.wifi} dBm` : '--';
      chips[2].textContent = d.bateria ? `${d.bateria}%` : '--';
      chips[3].textContent = d.estado || '--';
    }

    this.setCard('valTemp', d.temperatura, '°C');
    this.setCard('valHum', d.humedad, '%');
    this.setCard('valAir', d.calidadAire, 'AQI');
    this.setCard('valPres', d.presion, 'hPa');
    this.setCard('valRuido', d.ruido, 'dB');
    this.setCard('valLuz', d.luz, 'lux');

    this.setBadge('badgeTemp', this.getBadge(d.temperatura, { warn: 30, danger: 38 }));
    this.setBadge('badgeHum', this.getBadge(d.humedad, { warn: 70, danger: 85 }));
    this.setBadge('badgeAir', this.getBadge(d.calidadAire, { warn: 100, danger: 200 }));
    this.setBadge('badgePres', d.presion < 1000 ? { text: 'Baja', cls: 'warn' } : { text: 'Normal', cls: 'ok' });
    this.setBadge('badgeRuido', this.getBadge(d.ruido, { warn: 60, danger: 80 }));
    this.setBadge('badgeLuz', { text: d.luz > 500 ? 'Alta' : 'Normal', cls: d.luz > 500 ? 'warn' : 'ok' });

    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.chartData.labels.push(now);
    this.chartData.temperatura.push(d.temperatura || 0);
    this.chartData.humedad.push(d.humedad || 0);
    this.chartData.calidadAire.push(d.calidadAire || 0);
    this.chartData.presion.push(d.presion || 0);
    this.chartData.ruido.push(d.ruido || 0);
    this.chartData.luz.push(d.luz || 0);

    if (this.chartData.labels.length > this.maxDataPoints) {
      Object.keys(this.chartData).forEach(k => this.chartData[k].shift());
    }

    const activeTab = document.querySelector('.chart-tab.active');
    if (activeTab && this.chart) {
      const metric = activeTab.dataset.metric;
      this.chart.data.labels = [...this.chartData.labels];
      this.chart.data.datasets[0].data = [...this.chartData[metric]];
      this.chart.update('none');
    }

    lucide.createIcons();
  },

  setCard(id, value, unit) {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `${value !== undefined ? value : '--'}<span class="unit">${unit}</span>`;
    }
  },

  setBadge(id, info) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = info.text;
      el.className = `stat-card-badge ${info.cls}`;
    }
  }
};
