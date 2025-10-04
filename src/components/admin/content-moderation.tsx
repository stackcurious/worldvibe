"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Filter, AlertCircle, MessageSquare } from "lucide-react";

interface CheckIn {
  id: string;
  deviceId: string;
  emotion: string;
  intensity: number;
  note: string | null;
  regionHash: string | null;
  timestamp: string;
}

export function ContentModeration() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "with-notes">("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckIns();
  }, [filter]);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const url = filter === "with-notes"
        ? "/api/sys-control/moderation?withNotes=true"
        : "/api/sys-control/moderation";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch check-ins");
      }

      const data = await response.json();
      setCheckIns(data.checkIns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load check-ins");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this check-in? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/sys-control/moderation/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete check-in");
      }

      setCheckIns(checkIns.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete check-in. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      sad: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      angry: "bg-red-500/20 text-red-400 border-red-500/30",
      anxious: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      calm: "bg-green-500/20 text-green-400 border-green-500/30",
      excited: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      grateful: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      stressed: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    };
    return colors[emotion.toLowerCase()] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

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

  const checkInsWithNotes = checkIns.filter(c => c.note);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">All Check-ins</option>
            <option value="with-notes">With Notes Only</option>
          </select>
        </div>

        <div className="text-sm text-gray-400">
          Showing {checkIns.length} check-ins ({checkInsWithNotes.length} with notes)
        </div>
      </div>

      {/* Alert for notes */}
      {checkInsWithNotes.length > 0 && (
        <motion.div
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-200 font-semibold">Attention Required</p>
            <p className="text-sm text-yellow-300/80 mt-1">
              {checkInsWithNotes.length} check-in{checkInsWithNotes.length !== 1 ? 's' : ''} with notes require review
            </p>
          </div>
        </motion.div>
      )}

      {/* Check-ins List */}
      <div className="space-y-3">
        <AnimatePresence>
          {checkIns.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
              No check-ins found
            </div>
          ) : (
            checkIns.map((checkIn, index) => (
              <motion.div
                key={checkIn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${getEmotionColor(checkIn.emotion)}`}>
                        {checkIn.emotion}
                      </span>
                      <span className="text-sm text-gray-400">
                        Intensity: {checkIn.intensity}/10
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(checkIn.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* Note */}
                    {checkIn.note && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5" />
                          <span className="text-sm font-semibold text-blue-400">User Note</span>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{checkIn.note}</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Device: {checkIn.deviceId.substring(0, 12)}...</span>
                      {checkIn.regionHash && (
                        <span>Region: {checkIn.regionHash.substring(0, 12)}...</span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(checkIn.id)}
                    disabled={deleteLoading === checkIn.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-600/20 border border-red-500/30 rounded-lg transition-colors text-red-400 disabled:text-gray-500"
                  >
                    {deleteLoading === checkIn.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Privacy Notice */}
      <motion.div
        className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-blue-200">
          <strong>Privacy Notice:</strong> All check-ins are anonymized. Device IDs and region hashes are one-way encrypted and cannot be traced back to individual users.
        </p>
      </motion.div>
    </div>
  );
}
