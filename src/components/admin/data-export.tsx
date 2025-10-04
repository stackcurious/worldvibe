"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Database, Calendar } from "lucide-react";

export function DataExport() {
  const [loading, setLoading] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });

  const exportCheckInsCSV = async () => {
    try {
      setLoading("checkins-csv");
      const params = new URLSearchParams();
      if (dateRange.start) params.set("startDate", dateRange.start);
      if (dateRange.end) params.set("endDate", dateRange.end);

      const response = await fetch(`/api/sys-control/export/check-ins?${params.toString()}`);

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worldvibe-checkins-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      alert("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const exportCheckInsJSON = async () => {
    try {
      setLoading("checkins-json");
      const params = new URLSearchParams();
      if (dateRange.start) params.set("startDate", dateRange.start);
      if (dateRange.end) params.set("endDate", dateRange.end);

      const response = await fetch(`/api/sys-control/export/check-ins?${params.toString()}&format=json`);

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worldvibe-checkins-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      alert("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const exportSubscribersCSV = async () => {
    try {
      setLoading("subscribers-csv");
      const response = await fetch("/api/sys-control/export/subscribers");

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worldvibe-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      alert("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const exportSubscribersJSON = async () => {
    try {
      setLoading("subscribers-json");
      const response = await fetch("/api/sys-control/export/subscribers?format=json");

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worldvibe-subscribers-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      alert("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Date Range Filter (Optional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        {(dateRange.start || dateRange.end) && (
          <button
            onClick={() => setDateRange({ start: "", end: "" })}
            className="mt-3 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear dates
          </button>
        )}
      </motion.div>

      {/* Check-ins Export */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              Check-ins Export
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Export all check-in data including emotions, regions, and timestamps
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={exportCheckInsCSV}
            disabled={loading !== null}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading === "checkins-csv" ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export as CSV
          </button>

          <button
            onClick={exportCheckInsJSON}
            disabled={loading !== null}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading === "checkins-json" ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export as JSON
          </button>
        </div>
      </motion.div>

      {/* Subscribers Export */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              Email Subscribers Export
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Export email subscriber list with status and preferences
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={exportSubscribersCSV}
            disabled={loading !== null}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading === "subscribers-csv" ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export as CSV
          </button>

          <button
            onClick={exportSubscribersJSON}
            disabled={loading !== null}
            className="flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading === "subscribers-json" ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export as JSON
          </button>
        </div>
      </motion.div>

      {/* Export Info */}
      <motion.div
        className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-blue-200">
          <strong>Note:</strong> Exports include anonymized data only. No personal identifiers are included to maintain user privacy.
        </p>
      </motion.div>
    </div>
  );
}
