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
          className="text-center"
        >
          <Link
            href="/checkin"
            className="inline-block px-12 py-5 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full font-bold text-xl text-white shadow-2xl hover:scale-105 transition-transform"
          >
            Share Your Vibe ✨
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
