"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "stackcurious@gmail.com";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const email = session.user.email;
        setUserEmail(email || null);

        // Check if email is authorized
        if (email === ADMIN_EMAIL) {
          setIsAuthenticated(true);
          setIsAuthorized(true);
        } else {
          setIsAuthenticated(true);
          setIsAuthorized(false);
          setError(`Unauthorized: Only ${ADMIN_EMAIL} can access this panel`);
        }
      } else {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setUserEmail(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const email = session.user.email;
        setUserEmail(email || null);

        if (email === ADMIN_EMAIL) {
          setIsAuthenticated(true);
          setIsAuthorized(true);
        } else {
          setIsAuthenticated(true);
          setIsAuthorized(false);
          setError(`Unauthorized: Only ${ADMIN_EMAIL} can access this panel`);
        }
      } else {
        setIsAuthenticated(false);
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/sys-control`,
        },
      });

      if (error) throw error;

      setEmailSent(true);
    } catch (error: any) {
      setError(error.message || "Failed to send magic link");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsAuthorized(false);
    setUserEmail(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // User is authenticated but not authorized
  if (isAuthenticated && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
              <p className="text-gray-300">You are signed in as {userEmail}</p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6"
            >
              {error}
            </motion.div>

            <button
              onClick={handleSignOut}
              className="w-full px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Back to WorldVibe
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // User is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
              <p className="text-gray-300">Secure authentication via email</p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all"
                    autoFocus
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-white hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Send Magic Link
                </button>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200">
                  <strong>Note:</strong> Only authorized email addresses can access this panel.
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-6">
                  <Mail className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
                  <p className="text-gray-300 text-sm">
                    We've sent a magic link to <strong>{email}</strong>
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    Click the link in your email to sign in
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  ← Use a different email
                </button>
              </motion.div>
            )}

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Back to WorldVibe
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // User is authenticated AND authorized
  return <>{children}</>;
}
