"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Activity, AlertCircle, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface SystemHealth {
  database: {
    connected: boolean;
    responseTime: number;
    poolMetrics?: {
      total: number;
      active: number;
      idle: number;
    };
  };
  circuitBreakers: Array<{
    name: string;
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    failures: number;
    lastFailure?: string;
  }>;
  errors: {
    lastHour: number;
    last24hours: number;
  };
  uptime: {
    percentage: number;
    lastIncident?: string;
  };
}

export function SystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch("/api/sys-control/system-health");

      if (!response.ok) {
        throw new Error("Failed to fetch system health");
      }

      const data = await response.json();
      setHealth(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system health");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? "text-green-400" : "text-red-400";
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="w-6 h-6 text-green-400" />
    ) : (
      <XCircle className="w-6 h-6 text-red-400" />
    );
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case "CLOSED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "HALF_OPEN":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "OPEN":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        Error: {error}
      </div>
    );
  }

  if (!health) return null;

  const poolUtilization = health.database.poolMetrics
    ? (health.database.poolMetrics.active / health.database.poolMetrics.total) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-semibold">System Health Monitor</h2>
        </div>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Overall Status Banner */}
      <motion.div
        className={`rounded-xl p-6 border flex items-center justify-between ${
          health.database.connected
            ? "bg-green-500/10 border-green-500/20"
            : "bg-red-500/10 border-red-500/20"
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          {getStatusIcon(health.database.connected)}
          <div>
            <h3 className="text-xl font-bold text-white">
              {health.database.connected ? "All Systems Operational" : "Service Degraded"}
            </h3>
            <p className="text-sm text-gray-300">
              {health.database.connected
                ? "Database is healthy and responding"
                : "Database connection issues detected"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{health.uptime.percentage.toFixed(2)}%</div>
          <div className="text-sm text-gray-400">Uptime</div>
        </div>
      </motion.div>

      {/* Database Metrics */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Health
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Status</span>
              {getStatusIcon(health.database.connected)}
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(health.database.connected)}`}>
              {health.database.connected ? "Connected" : "Disconnected"}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Response Time</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {health.database.responseTime}ms
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {health.database.responseTime < 100 ? "Excellent" : health.database.responseTime < 500 ? "Good" : "Slow"}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Pool Utilization</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {poolUtilization.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {health.database.poolMetrics?.active || 0}/{health.database.poolMetrics?.total || 0} active
            </div>
          </div>
        </div>

        {/* Connection Pool Bar */}
        {health.database.poolMetrics && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Connection Pool</span>
              <span className="text-sm text-gray-400">
                {health.database.poolMetrics.active} active, {health.database.poolMetrics.idle} idle
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div className="flex h-full">
                <div
                  className="bg-green-500"
                  style={{ width: `${(health.database.poolMetrics.active / health.database.poolMetrics.total) * 100}%` }}
                />
                <div
                  className="bg-blue-500"
                  style={{ width: `${(health.database.poolMetrics.idle / health.database.poolMetrics.total) * 100}%` }}
                />
              </div>
            </div>
            {poolUtilization > 80 && (
              <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Warning: Connection pool utilization above 80%
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Circuit Breakers */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold mb-4">Circuit Breakers</h3>
        <div className="space-y-3">
          {health.circuitBreakers.map((circuit) => (
            <div
              key={circuit.name}
              className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-white capitalize">{circuit.name}</div>
                <div className="text-sm text-gray-400 mt-1">
                  Failures: {circuit.failures}
                  {circuit.lastFailure && ` • Last: ${new Date(circuit.lastFailure).toLocaleString()}`}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCircuitBreakerColor(circuit.state)}`}>
                {circuit.state}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Error Metrics */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Error Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Last Hour</div>
            <div className="text-3xl font-bold text-white">{health.errors["last hour"]}</div>
            <div className="text-xs text-gray-500 mt-1">Total errors</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Last 24 Hours</div>
            <div className="text-3xl font-bold text-white">{health.errors.last24hours}</div>
            <div className="text-xs text-gray-500 mt-1">Total errors</div>
          </div>
        </div>
      </motion.div>

      {/* Auto-refresh indicator */}
      <div className="text-center text-xs text-gray-500">
        Auto-refreshing every 10 seconds
      </div>
    </div>
  );
}
