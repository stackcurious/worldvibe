"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Download, Filter, Check, X, Clock } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  deviceId: string;
  timezone: string;
  preferredTime: string;
  isActive: boolean;
  frequency: string;
  verifiedAt: string | null;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

export function SubscriberManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "verified" | "unsubscribed">("all");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sys-control/subscribers");

      if (!response.ok) {
        throw new Error("Failed to fetch subscribers");
      }

      const data = await response.json();
      setSubscribers(data.subscribers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Email", "Status", "Verified", "Timezone", "Preferred Time", "Subscribed Date"];
    const rows = filteredSubscribers.map(sub => [
      sub.email,
      sub.isActive ? "Active" : "Inactive",
      sub.verifiedAt ? "Yes" : "No",
      sub.timezone,
      sub.preferredTime,
      new Date(sub.subscribedAt).toLocaleDateString()
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worldvibe-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredSubscribers = subscribers.filter(sub => {
    if (filter === "all") return true;
    if (filter === "active") return sub.isActive && !sub.unsubscribedAt;
    if (filter === "verified") return sub.verifiedAt !== null;
    if (filter === "unsubscribed") return sub.unsubscribedAt !== null;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        Error: {error}
      </div>
    );
  }

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.isActive && !s.unsubscribedAt).length,
    verified: subscribers.filter(s => s.verifiedAt).length,
    unsubscribed: subscribers.filter(s => s.unsubscribedAt).length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Subscribers</div>
        </div>
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.active}</div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.verified}</div>
          <div className="text-sm text-gray-400">Verified</div>
        </div>
        <div className="bg-gray-500/20 border border-gray-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.unsubscribed}</div>
          <div className="text-sm text-gray-400">Unsubscribed</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">All Subscribers</option>
            <option value="active">Active Only</option>
            <option value="verified">Verified Only</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Verified</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Timezone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No subscribers found
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-white">{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        sub.isActive && !sub.unsubscribedAt
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {sub.isActive && !sub.unsubscribedAt ? (
                          <>
                            <Check className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.verifiedAt ? (
                        <span className="text-green-400 text-sm flex items-center gap-1">
                          <Check className="w-4 h-4" /> Yes
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{sub.timezone}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{sub.preferredTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(sub.subscribedAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-400 text-center">
        Showing {filteredSubscribers.length} of {subscribers.length} subscribers
      </div>
    </div>
  );
}
