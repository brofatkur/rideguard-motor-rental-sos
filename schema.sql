-- Schema SQL untuk InsForge PostgreSQL Database
-- Aplikasi RideGuard: Persetujuan Sewa Motor & Lacak Lokasi SOS

-- 1. Tabel Persetujuan Sewa Motor (Agreements)
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  plat_dk VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  rent_days INT NOT NULL DEFAULT 1,
  is_tnc_agreed BOOLEAN NOT NULL DEFAULT TRUE,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Peringatan Darurat SOS (SOS Alerts)
CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plat_dk VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'DISPATCHED', 'RESOLVED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk pencarian cepat berdasarkan Plat Motor (DK)
CREATE INDEX IF NOT EXISTS idx_agreements_plat ON agreements(plat_dk);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
