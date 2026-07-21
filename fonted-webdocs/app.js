const App = {
  currentRoute: 'dashboard',
  stationData: null,
  unsubscribe: null,

  init() {
    this.setupRouter();
    this.setupSidebar();
    this.startClock();
    this.listenStation();
    lucide.createIcons();
  },

  // ── Router ──
  setupRouter() {
    window.addEventListener('hashchange', () => this.navigate());
    if (!window.location.hash) {
      window.location.hash = '#dashboard';
    } else {
      this.navigate();
    }
  },

  navigate() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const validRoutes = ['dashboard', 'map', 'stations', 'history', 'alerts'];
    const route = validRoutes.includes(hash) ? hash : 'dashboard';

    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const view = document.getElementById(`view-${route}`);
    if (view) view.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === route);
    });

    this.currentRoute = route;

    switch (route) {
      case 'dashboard':
        if (typeof Dashboard !== 'undefined') Dashboard.init(this.stationData);
        break;
      case 'map':
        if (typeof MapView !== 'undefined') MapView.init();
        break;
      case 'stations':
        if (typeof StationsView !== 'undefined') StationsView.render();
        break;
      case 'history':
        if (typeof HistoryView !== 'undefined') HistoryView.render();
        break;
      case 'alerts':
        if (typeof AlertsView !== 'undefined') AlertsView.render();
        break;
    }

    lucide.createIcons();
    this.closeSidebar();
  },

  // ── Sidebar ──
  setupSidebar() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      this.toggleOverlay(sidebar.classList.contains('open'));
    });
  },

  toggleOverlay(show) {
    let overlay = document.querySelector('.sidebar-overlay');
    if (show) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay active';
        overlay.addEventListener('click', () => this.closeSidebar());
        document.body.appendChild(overlay);
      } else {
        overlay.classList.add('active');
      }
    } else if (overlay) {
      overlay.classList.remove('active');
    }
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    this.toggleOverlay(false);
  },

  // ── Reloj ──
  startClock() {
    const update = () => {
      const now = new Date();
      const el = document.getElementById('currentTime');
      if (el) {
        el.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    };
    update();
    setInterval(update, 1000);
  },

  // ── Firestore Listener ──
  listenStation() {
    this.unsubscribe = db.collection("stations").doc("ESP32-001")
      .onSnapshot(doc => {
        if (doc.exists) {
          this.stationData = { id: doc.id, ...doc.data() };
          this.updateConnectionStatus(true);
          this.onDataUpdate();
        } else {
          this.updateConnectionStatus(false);
        }
      }, error => {
        console.error("Firestore error:", error);
        this.updateConnectionStatus(false);
      });
  },

  onDataUpdate() {
    if (typeof Dashboard !== 'undefined' && this.currentRoute === 'dashboard') {
      Dashboard.update(this.stationData);
    }
    if (typeof StationsView !== 'undefined' && this.currentRoute === 'stations') {
      StationsView.update(this.stationData);
    }
    if (typeof AlertsView !== 'undefined' && this.currentRoute === 'alerts') {
      AlertsView.update(this.stationData);
    }
    if (typeof HistoryView !== 'undefined' && this.currentRoute === 'history') {
      HistoryView.addRecord(this.stationData);
    }
    if (typeof MapView !== 'undefined' && this.currentRoute === 'map') {
      MapView.updateMarker(this.stationData);
    }
  },

  updateConnectionStatus(online) {
    const el = document.getElementById('connectionStatus');
    if (online) {
      el.className = 'status-indicator online';
      el.innerHTML = '<i data-lucide="wifi"></i><span>Conectado</span>';
    } else {
      el.className = 'status-indicator offline';
      el.innerHTML = '<i data-lucide="wifi-off"></i><span>Desconectado</span>';
    }
    lucide.createIcons();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
