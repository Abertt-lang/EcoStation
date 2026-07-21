const AlertsView = {
  alerts: [],
  maxAlerts: 30,

  render() {
    const container = document.getElementById('view-alerts');
    container.innerHTML = `
      <h2 class="section-title"><i data-lucide="bell"></i> Alertas</h2>
      <div class="alerts-list" id="alertsList">
        <div class="empty-state">
          <i data-lucide="bell-off"></i>
          <p>No hay alertas activas</p>
        </div>
      </div>
    `;
    lucide.createIcons();

    if (this.alerts.length > 0) {
      this.renderList();
    }

    if (App.stationData) {
      this.update(App.stationData);
    }
  },

  update(d) {
    if (!d) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

    const checks = [
      { cond: d.temperatura > 38, icon: 'thermometer', type: 'danger', title: 'Temperatura Critica', desc: `Temperatura alcanzo ${d.temperatura}°C (umbral: 38°C)` },
      { cond: d.temperatura > 30 && d.temperatura <= 38, icon: 'thermometer', type: 'warning', title: 'Temperatura Elevada', desc: `Temperatura en ${d.temperatura}°C (umbral: 30°C)` },
      { cond: d.humedad > 85, icon: 'droplets', type: 'danger', title: 'Humedad Critica', desc: `Humedad en ${d.humedad}% (umbral: 85%)` },
      { cond: d.humedad > 70 && d.humedad <= 85, icon: 'droplets', type: 'warning', title: 'Humedad Elevada', desc: `Humedad en ${d.humedad}% (umbral: 70%)` },
      { cond: d.calidadAire > 200, icon: 'wind', type: 'danger', title: 'Aire Peligroso', desc: `AQI en ${d.calidadAire} - Calidad peligrosa` },
      { cond: d.calidadAire > 100 && d.calidadAire <= 200, icon: 'wind', type: 'warning', title: 'Aire Insalubre', desc: `AQI en ${d.calidadAire} - Calidad moderada-mala` },
      { cond: d.ruido > 80, icon: 'volume-2', type: 'danger', title: 'Ruido Excesivo', desc: `Nivel de ruido en ${d.ruido}dB (umbral: 80dB)` },
      { cond: d.ruido > 60 && d.ruido <= 80, icon: 'volume-2', type: 'warning', title: 'Ruido Elevado', desc: `Nivel de ruido en ${d.ruido}dB (umbral: 60dB)` },
      { cond: d.bateria < 20, icon: 'battery-low', type: 'danger', title: 'Bateria Baja', desc: `Bateria al ${d.bateria}% - Requiere carga` },
      { cond: d.bateria >= 20 && d.bateria < 40, icon: 'battery', type: 'info', title: 'Bateria Baja', desc: `Bateria al ${d.bateria}%` },
      { cond: d.wifi < -80, icon: 'wifi', type: 'warning', title: 'Senal WiFi Debil', desc: `Senal WiFi en ${d.wifi}dBm` },
      { cond: d.presion < 1000, icon: 'gauge', type: 'info', title: 'Presion Baja', desc: `Presion en ${d.presion}hPa - Posible tormenta` }
    ];

    checks.forEach(c => {
      if (c.cond) {
        const alert = {
          id: `${c.type}-${c.title}-${Date.now()}`,
          icon: c.icon,
          type: c.type,
          title: c.title,
          desc: c.desc,
          time: `${dateStr} ${timeStr}`
        };

        // Avoid duplicate alerts within 60 seconds
        const duplicate = this.alerts.find(a =>
          a.title === alert.title && (now - new Date(a._rawTime)) < 60000
        );
        if (!duplicate) {
          alert._rawTime = now;
          this.alerts.unshift(alert);
        }
      }
    });

    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    if (App.currentRoute === 'alerts') {
      this.renderList();
    }
  },

  renderList() {
    const list = document.getElementById('alertsList');
    if (!list) return;

    if (this.alerts.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i data-lucide="bell-off"></i>
          <p>No hay alertas activas</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    list.innerHTML = this.alerts.map(a => `
      <div class="alert-item type-${a.type}">
        <div class="alert-icon ${a.type}">
          <i data-lucide="${a.icon}"></i>
        </div>
        <div class="alert-body">
          <div class="alert-title">${a.title}</div>
          <div class="alert-desc">${a.desc}</div>
        </div>
        <div class="alert-time">${a.time}</div>
      </div>
    `).join('');

    lucide.createIcons();
  }
};
