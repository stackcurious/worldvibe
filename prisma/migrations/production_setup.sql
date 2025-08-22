-- prisma/migrations/production_setup.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Convert check_ins table to TimescaleDB hypertable
SELECT create_hypertable('check_ins', 'created_at', 
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- Create partitioned indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_check_ins_region_time 
ON check_ins USING BRIN (region_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_check_ins_emotion_time 
ON check_ins USING BRIN (emotion, created_at);

-- Set up retention policy
SELECT add_retention_policy('check_ins', INTERVAL '90 days');

-- Create compression policy
SELECT add_compression_policy('check_ins', INTERVAL '7 days');

-- Create continuous aggregates for analytics
CREATE MATERIALIZED VIEW hourly_stats
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', created_at) AS bucket,
  region_hash,
  emotion,
  count(*) as check_in_count,
  avg(intensity::float) as avg_intensity
FROM check_ins
GROUP BY bucket, region_hash, emotion;

-- Set refresh policy for continuous aggregates
SELECT add_continuous_aggregate_policy('hourly_stats',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- Create GiST index for spatial queries
CREATE INDEX IF NOT EXISTS idx_check_ins_location 
ON check_ins USING GIST (location);

-- Set up parallel query optimization
ALTER TABLE check_ins SET (
  parallel_workers = 8,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- Create function for privacy-compliant data deletion
CREATE OR REPLACE FUNCTION delete_expired_data()
RETURNS void AS $$
BEGIN
  DELETE FROM check_ins
  WHERE created_at < (NOW() - INTERVAL '90 days');
  
  DELETE FROM events
  WHERE created_at < (NOW() - INTERVAL '90 days');
  
  DELETE FROM rate_limits
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job for data cleanup
SELECT add_job('delete_expired_data', '1 day');