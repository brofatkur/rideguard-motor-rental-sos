/**
 * InsForge Database Integration Module for RideGuard
 * Provides CRUD operations for InsForge PostgreSQL BaaS (agreements & sos_alerts)
 */

window.InsForgeClient = (() => {
  // Configuration: Can be loaded from window.INSFORGE_CONFIG or environment
  const config = {
    baseUrl: window.INSFORGE_CONFIG?.baseUrl || 'https://api.insforge.dev',
    anonKey: window.INSFORGE_CONFIG?.anonKey || ''
  };

  /**
   * Helper function for InsForge REST API fetch
   */
  async function apiFetch(endpoint, options = {}) {
    if (!config.anonKey || config.baseUrl.includes('YOUR_INSFORGE')) {
      console.warn('InsForge API key/URL not configured. Operating in local fallback mode.');
      return null;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.anonKey}`,
      'x-insforge-key': config.anonKey,
      ...options.headers
    };

    try {
      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`InsForge API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('InsForge API Request failed:', err);
      return null;
    }
  }

  return {
    /**
     * Save new customer rental agreement to InsForge database
     */
    async saveAgreement(data) {
      console.log('📤 Sending agreement to InsForge Database...', data);
      
      const payload = {
        customer_name: data.customerName,
        phone: data.phone,
        plat_dk: data.platDk,
        start_date: data.startDate,
        rent_days: data.rentDays,
        is_tnc_agreed: true,
        latitude: data.coords?.lat || -8.6500,
        longitude: data.coords?.lng || 115.2166,
        status: 'ACTIVE'
      };

      const result = await apiFetch('/api/v1/agreements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Always save to local backup as well
      const savedList = JSON.parse(localStorage.getItem('rideguard_agreements') || '[]');
      savedList.unshift(payload);
      localStorage.setItem('rideguard_agreements', JSON.stringify(savedList));

      return result || payload;
    },

    /**
     * Fetch active agreements from InsForge database
     */
    async getAgreements() {
      const result = await apiFetch('/api/v1/agreements?status=eq.ACTIVE');
      if (result) return result;
      
      // Fallback to local storage
      return JSON.parse(localStorage.getItem('rideguard_agreements') || '[]');
    },

    /**
     * Save emergency SOS alert signal to InsForge database
     */
    async createSosAlert(data) {
      console.log('🚨 Dispatching SOS Alert to InsForge Database...', data);
      
      const payload = {
        plat_dk: data.platDk,
        customer_name: data.customerName,
        phone: data.phone,
        latitude: data.coords.lat,
        longitude: data.coords.lng,
        status: 'ACTIVE'
      };

      const result = await apiFetch('/api/v1/sos_alerts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return result || payload;
    },

    /**
     * Resolve SOS Alert in InsForge database
     */
    async resolveSosAlert(platDk) {
      console.log('✅ Resolving SOS Alert in InsForge Database for:', platDk);
      
      return await apiFetch(`/api/v1/sos_alerts?plat_dk=eq.${platDk}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'RESOLVED' })
      });
    }
  };
})();
