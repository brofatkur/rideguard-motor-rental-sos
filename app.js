// RideGuard Service Agreement & Tracking Script
document.addEventListener('DOMContentLoaded', () => {

  // --- STATE MANAGEMENT ---
  const state = {
    activeAgreement: {
      customerName: 'Budi Santoso',
      phone: '081234567890',
      platDk: 'DK 4829 SKS',
      startDate: new Date(),
      rentDays: 3, // default 3 days
      expiryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      coords: { lat: -8.6500, lng: 115.2166 }, // Default Bali coordinates
      speed: 0,
      battery: 96,
      isSOSActive: false
    },
    fleetList: [
      { id: 'FL-1', name: 'Budi Santoso', plat: 'DK 4829 SKS', days: '3 Hari', coords: [-8.6500, 115.2166], isSOS: false, phone: '081234567890' },
      { id: 'FL-2', name: 'Siti Rahma', plat: 'DK 5912 FBG', days: '2 Hari', coords: [-8.6550, 115.2200], isSOS: false, phone: '081987654321' },
      { id: 'FL-3', name: 'Michael Scott', plat: 'B 6281 VSP', days: '7 Hari', coords: [-8.6420, 115.2100], isSOS: false, phone: '081345678912' }
    ],
    isSimulating: false,
    simInterval: null,
    countdownInterval: null
  };

  // --- MAP INSTANCES ---
  let customerMap = null;
  let customerMarker = null;
  let adminMap = null;
  let adminMarkers = {};

  // --- DOM ELEMENTS ---
  const brandHomeBtn = document.getElementById('brand-home-btn');
  const navAgreementBtn = document.getElementById('nav-agreement-btn');
  const navRideBtn = document.getElementById('nav-ride-btn');
  const navAdminBtn = document.getElementById('nav-admin-btn');
  
  const viewAgreement = document.getElementById('view-agreement');
  const viewRide = document.getElementById('view-ride');
  const viewAdmin = document.getElementById('view-admin');

  // Form inputs
  const serviceForm = document.getElementById('service-agreement-form');
  const inputCustName = document.getElementById('input-cust-name');
  const inputCustPhone = document.getElementById('input-cust-phone');
  const inputPlatDk = document.getElementById('input-plat-dk');
  const inputStartDate = document.getElementById('input-start-date');
  const inputRentDays = document.getElementById('input-rent-days');
  const agreeTncCheckbox = document.getElementById('agree-tnc-checkbox');
  const btnSubmitAgreement = document.getElementById('btn-submit-agreement');

  // Dynamic preview elements
  const previewPlatDisplay = document.getElementById('preview-plat-display');
  const summaryPlat = document.getElementById('summary-plat');
  const summaryDays = document.getElementById('summary-days');

  // Customer Ride Elements
  const rideCustTitle = document.getElementById('ride-cust-title');
  const rideTimerDisplay = document.getElementById('ride-timer-display');
  const currentSpeedEl = document.getElementById('current-speed');
  const trackerBatteryEl = document.getElementById('tracker-battery');
  const gpsCoordsEl = document.getElementById('gps-coords');
  const recenterMapBtn = document.getElementById('recenter-map-btn');
  const toggleSimMovementBtn = document.getElementById('toggle-sim-movement');
  const triggerSosBtn = document.getElementById('trigger-sos-btn');
  const sosStatusBox = document.getElementById('sos-status-box');
  const sosStatusText = document.getElementById('sos-status-text');
  
  // SOS Overlay Elements
  const sosActiveOverlay = document.getElementById('sos-active-overlay');
  const sosSentCoords = document.getElementById('sos-sent-coords');
  const cancelSosBtn = document.getElementById('cancel-sos-btn');

  // Admin Elements
  const adminActiveCount = document.getElementById('admin-active-count');
  const adminSosTag = document.getElementById('admin-sos-tag');
  const adminSosAlertBanner = document.getElementById('admin-sos-alert-banner');
  const alertDetailsText = document.getElementById('alert-details-text');
  const adminDispatchTeamBtn = document.getElementById('admin-dispatch-team-btn');
  const adminCallCustBtn = document.getElementById('admin-call-cust-btn');
  const adminResolveSosBtn = document.getElementById('admin-resolve-sos-btn');
  const fleetListContainer = document.getElementById('fleet-list-container');

  // --- INITIALIZATION ---
  setupFormListeners();
  setupNavigation();
  initGeolocation();

  // --- FORM LISTENERS & DYNAMIC PREVIEW ---
  function setupFormListeners() {
    if (inputStartDate) {
      inputStartDate.valueAsDate = new Date();
    }

    // Dynamic text preview on typing
    if (inputPlatDk) {
      inputPlatDk.addEventListener('input', (e) => {
        const val = e.target.value.trim().toUpperCase() || '[Plat Motor]';
        if (previewPlatDisplay) previewPlatDisplay.textContent = val;
        if (summaryPlat) summaryPlat.textContent = val;
        validateFormState();
      });
    }

    if (inputCustName) inputCustName.addEventListener('input', validateFormState);
    if (inputCustPhone) inputCustPhone.addEventListener('input', validateFormState);

    if (inputRentDays) {
      inputRentDays.addEventListener('change', (e) => {
        const days = e.target.value;
        if (summaryDays) summaryDays.textContent = `${days} Hari (${days * 24} Jam)`;
        validateFormState();
      });
    }

    if (agreeTncCheckbox) {
      agreeTncCheckbox.addEventListener('change', validateFormState);
    }

    function validateFormState() {
      const isNameFilled = inputCustName && inputCustName.value.trim().length > 0;
      const isPhoneFilled = inputCustPhone && inputCustPhone.value.trim().length > 0;
      const isPlatFilled = inputPlatDk && inputPlatDk.value.trim().length > 0;
      const isChecked = agreeTncCheckbox && agreeTncCheckbox.checked;

      if (btnSubmitAgreement) {
        if (isChecked && isNameFilled && isPhoneFilled && isPlatFilled) {
          btnSubmitAgreement.style.boxShadow = '0 0 25px rgba(0, 242, 254, 0.7)';
          btnSubmitAgreement.style.opacity = '1';
        } else {
          btnSubmitAgreement.style.boxShadow = '0 4px 15px rgba(0, 242, 254, 0.3)';
          btnSubmitAgreement.style.opacity = '0.9';
        }
      }
    }

    // Form Submission
    serviceForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = inputCustName ? inputCustName.value.trim() : '';
      const phone = inputCustPhone ? inputCustPhone.value.trim() : '';
      const plat = inputPlatDk ? inputPlatDk.value.trim().toUpperCase() : '';
      const days = inputRentDays ? parseInt(inputRentDays.value, 10) : 1;
      const startDateVal = inputStartDate ? inputStartDate.value : '';

      // Clear interactive feedback checks
      if (!name) {
        alert('⚠️ Harap isi Nama Lengkap Penyewa terlebih dahulu.');
        if (inputCustName) inputCustName.focus();
        return;
      }
      if (!phone) {
        alert('⚠️ Harap isi Nomor WhatsApp / HP Penyewa.');
        if (inputCustPhone) inputCustPhone.focus();
        return;
      }
      if (!plat) {
        alert('⚠️ Harap isi Nomor Plat Motor (Contoh: DK 4829 SKS).');
        if (inputPlatDk) inputPlatDk.focus();
        return;
      }
      if (!agreeTncCheckbox || !agreeTncCheckbox.checked) {
        alert('⚠️ Harap centang kotak persetujuan Syarat & Ketentuan pelacakan lokasi SOS terlebih dahulu.');
        if (agreeTncCheckbox) agreeTncCheckbox.focus();
        return;
      }

      state.activeAgreement.customerName = name;
      state.activeAgreement.phone = phone;
      state.activeAgreement.platDk = plat;
      state.activeAgreement.rentDays = days;
      
      const now = new Date();
      state.activeAgreement.startDate = startDateVal ? new Date(startDateVal) : now;
      state.activeAgreement.expiryTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Update customer ride header
      if (rideCustTitle) rideCustTitle.textContent = `${name} - Plat ${plat}`;
      
      // Update fleet entry #1 for admin
      if (state.fleetList[0]) {
        state.fleetList[0].name = name;
        state.fleetList[0].plat = plat;
        state.fleetList[0].days = `${days} Hari`;
        state.fleetList[0].phone = phone;
      }

      // Save to InsForge Database
      if (window.InsForgeClient) {
        window.InsForgeClient.saveAgreement({
          customerName: name,
          phone: phone,
          platDk: plat,
          startDate: startDateVal,
          rentDays: days,
          coords: state.activeAgreement.coords
        });
      }

      startCountdownTimer();

      alert(`🎉 PERSETUJUAN BERHASIL DISIMPAN!\n\nSistem pelacakan GPS lokasi real-time & fitur SOS darurat aktif untuk motor Plat ${plat} (${days} Hari).\nData tersimpan di InsForge Database.`);
      
      switchTab('ride');
    });
  }

  // --- COUNTDOWN TIMER ---
  function startCountdownTimer() {
    if (state.countdownInterval) clearInterval(state.countdownInterval);

    state.countdownInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = state.activeAgreement.expiryTime.getTime() - now;

      if (distance < 0) {
        clearInterval(state.countdownInterval);
        rideTimerDisplay.textContent = 'Masa Sewa Berakhir (Lacak Otomatis Off)';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let timerText = '';
      if (days > 0) timerText += `${days} Hari `;
      timerText += `${hours} Jam ${minutes} Mnt ${seconds} Detik Tersisa`;

      rideTimerDisplay.textContent = timerText;
    }, 1000);
  }

  // --- NAVIGATION TAB HANDLING & ADMIN ROUTING ---
  function setupNavigation() {
    if (brandHomeBtn) brandHomeBtn.addEventListener('click', () => switchTab('agreement'));
    if (navAgreementBtn) navAgreementBtn.addEventListener('click', () => switchTab('agreement'));
    if (navRideBtn) navRideBtn.addEventListener('click', () => switchTab('ride'));
    if (navAdminBtn) navAdminBtn.addEventListener('click', () => switchTab('admin'));

    // Check if URL has ?mode=admin or #admin parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get('mode') === 'admin' || window.location.hash === '#admin';

    if (isAdminMode) {
      if (navAdminBtn) navAdminBtn.style.display = 'flex';
      switchTab('admin');
    } else {
      if (navAdminBtn) navAdminBtn.style.display = 'none';
      switchTab('agreement');
    }
  }

  function switchTab(tabName) {
    [navAgreementBtn, navRideBtn, navAdminBtn].forEach(b => { if (b) b.classList.remove('active'); });
    [viewAgreement, viewRide, viewAdmin].forEach(v => { if (v) v.classList.remove('active'); });

    if (tabName === 'agreement') {
      if (navAgreementBtn) navAgreementBtn.classList.add('active');
      if (viewAgreement) viewAgreement.classList.add('active');
    } else if (tabName === 'ride') {
      if (navRideBtn) navRideBtn.classList.add('active');
      if (viewRide) viewRide.classList.add('active');
      
      // Delay briefly to allow DOM display rendering before initializing Leaflet
      setTimeout(() => {
        ensureCustomerMap();
        if (customerMap) customerMap.invalidateSize();
      }, 150);
    } else if (tabName === 'admin') {
      if (navAdminBtn) navAdminBtn.classList.add('active');
      if (viewAdmin) viewAdmin.classList.add('active');
      
      setTimeout(() => {
        ensureAdminMap();
        if (adminMap) adminMap.invalidateSize();
      }, 150);
      renderFleetList();
    }
  }

  // --- LEAFLET MAPS & GEOLOCATION ---
  function initGeolocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          state.activeAgreement.coords.lat = pos.coords.latitude;
          state.activeAgreement.coords.lng = pos.coords.longitude;
          if (pos.coords.speed) {
            state.activeAgreement.speed = Math.round(pos.coords.speed * 3.6);
            if (currentSpeedEl) currentSpeedEl.textContent = `${state.activeAgreement.speed} km/h`;
          }
          updateCustomerMapPosition();
        },
        (err) => {
          console.log('GPS browser access default to simulated coords:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }

  function ensureCustomerMap() {
    const mapElement = document.getElementById('customer-map');
    if (!mapElement) return;

    if (customerMap) {
      customerMap.invalidateSize();
      return;
    }

    const { lat, lng } = state.activeAgreement.coords;
    customerMap = L.map('customer-map', {
      zoomControl: true,
      touchZoom: true
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap & RideGuard Safety Tracking'
    }).addTo(customerMap);

    const bikeIcon = L.divIcon({
      className: 'custom-bike-marker',
      html: `<div style="background:#00f2fe; color:#0a0f1d; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px #00f2fe; border:3px solid #fff;">
               <i class="fa-solid fa-motorcycle" style="font-size:18px;"></i>
             </div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    customerMarker = L.marker([lat, lng], { icon: bikeIcon }).addTo(customerMap)
      .bindPopup(`<b>Motor Plat ${state.activeAgreement.platDk}</b><br>GPS Active & Terhubung SOS 24/7`)
      .openPopup();

    if (recenterMapBtn) {
      recenterMapBtn.addEventListener('click', () => {
        customerMap.setView([state.activeAgreement.coords.lat, state.activeAgreement.coords.lng], 16);
      });
    }

    if (toggleSimMovementBtn) {
      toggleSimMovementBtn.addEventListener('click', toggleSimulation);
    }

    // Auto start movement simulation so map is live immediately!
    startAutoSimulation();
  }

  function startAutoSimulation() {
    if (!state.isSimulating) {
      toggleSimulation();
    }
  }

  function updateCustomerMapPosition() {
    const { lat, lng } = state.activeAgreement.coords;
    gpsCoordsEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    if (customerMarker) {
      customerMarker.setLatLng([lat, lng]);
    }
    if (customerMap) {
      customerMap.panTo([lat, lng]);
    }
  }

  // --- SIMULATION OF MOVEMENT ---
  function toggleSimulation() {
    if (state.isSimulating) {
      clearInterval(state.simInterval);
      state.isSimulating = false;
      toggleSimMovementBtn.innerHTML = '<i class="fa-solid fa-play"></i> Simulasi Perjalanan';
      currentSpeedEl.textContent = '0 km/h';
    } else {
      state.isSimulating = true;
      toggleSimMovementBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Hentikan Simulasi';
      
      state.simInterval = setInterval(() => {
        const deltaLat = (Math.random() - 0.48) * 0.0006;
        const deltaLng = (Math.random() - 0.48) * 0.0006;
        
        state.activeAgreement.coords.lat += deltaLat;
        state.activeAgreement.coords.lng += deltaLng;

        state.fleetList[0].coords = [state.activeAgreement.coords.lat, state.activeAgreement.coords.lng];

        state.activeAgreement.speed = Math.floor(25 + Math.random() * 30);
        currentSpeedEl.textContent = `${state.activeAgreement.speed} km/h`;

        updateCustomerMapPosition();

        if (adminMap) {
          updateAdminMarkers();
        }
      }, 2000);
    }
  }

  // --- EMERGENCY SOS PANIC SYSTEM ---
  triggerSosBtn.addEventListener('click', triggerSOS);
  cancelSosBtn.addEventListener('click', cancelSOS);

  function triggerSOS() {
    state.activeAgreement.isSOSActive = true;
    state.fleetList[0].isSOS = true;

    // Send SOS Alert to InsForge Database
    if (window.InsForgeClient) {
      window.InsForgeClient.createSosAlert({
        platDk: state.activeAgreement.platDk,
        customerName: state.activeAgreement.customerName,
        phone: state.activeAgreement.phone,
        coords: state.activeAgreement.coords
      });
    }

    playAudioAlarm();

    // Customer View Updates
    sosStatusBox.classList.add('sos-active');
    sosStatusText.textContent = 'STATUS: EMERGENCY SOS AKTIF! Tim Patroli Dihubungi.';
    sosSentCoords.textContent = `${state.activeAgreement.coords.lat.toFixed(5)}, ${state.activeAgreement.coords.lng.toFixed(5)}`;
    sosActiveOverlay.classList.remove('hidden');

    // Admin View Updates
    adminSosTag.innerHTML = '<i class="fa-solid fa-bell"></i> 1 SOS ACTIVE!';
    adminSosTag.classList.add('active-alert');
    
    alertDetailsText.textContent = `Penyewa ${state.activeAgreement.customerName} (Plat ${state.activeAgreement.platDk}) menekan Tombol SOS Darurat! Koordinat: ${state.activeAgreement.coords.lat.toFixed(4)}, ${state.activeAgreement.coords.lng.toFixed(4)}`;
    adminSosAlertBanner.classList.remove('hidden');

    if (adminMap) {
      updateAdminMarkers();
    }
  }

  function cancelSOS() {
    state.activeAgreement.isSOSActive = false;
    state.fleetList[0].isSOS = false;

    sosActiveOverlay.classList.add('hidden');
    sosStatusBox.classList.remove('sos-active');
    sosStatusText.textContent = 'Status: Aman & Terhubung ke Tim Patroli';

    adminSosAlertBanner.classList.add('hidden');
    adminSosTag.innerHTML = '<i class="fa-solid fa-bell-slash"></i> 0 SOS Active';
    adminSosTag.classList.remove('active-alert');

    if (adminMap) {
      updateAdminMarkers();
    }
  }

  function playAudioAlarm() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) {
      console.log('Audio autoplay prevented by browser policy', e);
    }
  }

  // --- ADMIN COMMAND CENTER ---
  function ensureAdminMap() {
    if (adminMap) {
      adminMap.invalidateSize();
      return;
    }

    adminMap = L.map('admin-map').setView([-8.6500, 115.2166], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap & RideGuard Fleet HQ'
    }).addTo(adminMap);

    updateAdminMarkers();
  }

  function updateAdminMarkers() {
    state.fleetList.forEach(item => {
      const isSOS = item.isSOS;
      const color = isSOS ? '#ff1744' : '#00e676';
      const iconHtml = `<div style="background:${color}; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px ${color}; border:2px solid #fff;">
                          <i class="fa-solid ${isSOS ? 'fa-triangle-exclamation' : 'fa-motorcycle'}" style="font-size:14px;"></i>
                        </div>`;

      const markerIcon = L.divIcon({
        className: 'admin-bike-marker',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      if (adminMarkers[item.id]) {
        adminMarkers[item.id].setLatLng(item.coords);
        adminMarkers[item.id].setIcon(markerIcon);
      } else {
        const marker = L.marker(item.coords, { icon: markerIcon }).addTo(adminMap)
          .bindPopup(`<b>${item.name}</b><br>Plat: <strong>${item.plat}</strong><br>Lama Sewa: ${item.days}<br>No HP: ${item.phone}<br>Status: ${isSOS ? '<span style="color:#ff1744; font-weight:bold;">🚨 SOS ACTIVE</span>' : 'Lacak Aktif'}`);
        adminMarkers[item.id] = marker;
      }
    });
  }

  function renderFleetList() {
    adminActiveCount.textContent = state.fleetList.length;
    fleetListContainer.innerHTML = '';

    state.fleetList.forEach(item => {
      const card = document.createElement('div');
      card.className = `fleet-item ${item.isSOS ? 'sos-highlight' : ''}`;
      card.innerHTML = `
        <div class="fleet-info">
          <h4>${item.name}</h4>
          <p><i class="fa-solid fa-motorcycle"></i> Plat: <strong>${item.plat}</strong> (${item.days})</p>
          <p><i class="fa-solid fa-phone"></i> ${item.phone}</p>
        </div>
        <div>
          <span class="fleet-status-pill ${item.isSOS ? 'sos' : 'active'}">
            ${item.isSOS ? '🚨 SOS EMERGENCY' : 'Lacak Aktif'}
          </span>
        </div>
      `;
      fleetListContainer.appendChild(card);
    });
  }

  // Admin Actions
  adminDispatchTeamBtn.addEventListener('click', () => {
    alert(`🚑 TIM SOS DISPATCHED!\n\nTim patroli terkdekat telah dikirim ke lokasi motor Plat ${state.activeAgreement.platDk} di koordinat (${state.activeAgreement.coords.lat.toFixed(4)}, ${state.activeAgreement.coords.lng.toFixed(4)}). Estimasi waktu tiba: 8 Menit.`);
  });

  adminCallCustBtn.addEventListener('click', () => {
    alert(`📞 MENGHUBUNGI PENYEWA...\n\nNama: ${state.activeAgreement.customerName}\nPlat: ${state.activeAgreement.platDk}\nNo. HP: ${state.activeAgreement.phone}`);
  });

  adminResolveSosBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin insiden SOS ini telah selesai ditangani?')) {
      cancelSOS();
      alert('✅ Insiden SOS berhasil ditandai selesai.');
    }
  });

  // Start initial countdown
  startCountdownTimer();

});
