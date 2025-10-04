"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, Globe, Users, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-black mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
              About WorldVibe
            </span>
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            A global emotional pulse check-in platform connecting people through shared feelings
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-gray-200 leading-relaxed">
              WorldVibe exists to help people feel less alone by sharing their emotional experiences
              anonymously. We believe that understanding the collective emotional state of humanity
              can foster empathy, connection, and positive change.
            </p>
          </div>
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: Globe,
              title: "Global Reach",
              description: "Connect with people from 195 countries sharing their daily vibes",
              color: "#FFB800"
            },
            {
              icon: Shield,
              title: "100% Anonymous",
              description: "Your privacy is sacred. All check-ins are completely anonymous",
              color: "#4CAF50"
            },
            {
              icon: Users,
              title: "Real Community",
              description: "Join millions of people sharing authentic emotional experiences",
              color: "#FF9800"
            },
            {
              icon: Heart,
              title: "Empathy First",
              description: "Build understanding and compassion through shared feelings",
              color: "#F44336"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mb-16"
        >
          <Link
            href="/checkin"
            className="inline-block px-12 py-5 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full font-bold text-xl text-white shadow-2xl hover:scale-105 transition-transform"
          >
            Share Your Vibe ✨
          </Link>
        </motion.div>

        {/* Contact & Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-4"
        >
          <div>
            <p className="text-gray-300 mb-2">Have questions or feedback?</p>
            <a
              href="mailto:support@worldvibe.app"
              className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
            >
              support@worldvibe.app
            </a>
          </div>

          <div className="flex justify-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="/terms"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-gray-600">•</span>
            <a
              href="https://github.com/stackcurious/worldvibe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
