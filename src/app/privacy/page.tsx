"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-black mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
              Privacy Policy
            </span>
          </h1>
          <p className="text-gray-300">Last updated: January 2025</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-8 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
        >
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Commitment to Privacy</h2>
            <p className="text-gray-200 leading-relaxed">
              WorldVibe is built on a privacy-first foundation. We believe your emotional check-ins
              should be completely anonymous. We don't collect, store, or share any personally
              identifiable information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">What We Collect</h2>
            <div className="space-y-3 text-gray-200">
              <p className="leading-relaxed">
                <strong className="text-white">Anonymous Check-in Data:</strong> Your selected emotion,
                optional context, and approximate geographic region (country/city level only).
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Device Fingerprint:</strong> A hashed identifier to enforce
                the one check-in per day limit. This is not linked to any personal information.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Analytics:</strong> We use Google Analytics and Vercel
                Analytics to understand how people use WorldVibe. These are standard web analytics
                that help us improve the experience.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">What We Don't Collect</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-200">
              <li>Names, email addresses, or phone numbers</li>
              <li>User accounts or login credentials</li>
              <li>Precise GPS coordinates or exact locations</li>
              <li>IP addresses (beyond regional approximation)</li>
              <li>Personal identifiers of any kind</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
            <p className="text-gray-200 leading-relaxed">
              Check-in data is automatically deleted after 30 days. We only keep aggregated,
              anonymized statistics for historical trend analysis. Individual check-ins are
              permanently removed from our database.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How We Protect Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-200">
              <li>All data is transmitted over encrypted HTTPS connections</li>
              <li>Database access is restricted and monitored</li>
              <li>No third parties have access to individual check-in data</li>
              <li>We use industry-standard security practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
            <p className="text-gray-200 leading-relaxed mb-3">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-200">
              <li><strong className="text-white">Google Analytics:</strong> For website usage analytics</li>
              <li><strong className="text-white">Vercel:</strong> For hosting and performance monitoring</li>
              <li><strong className="text-white">Supabase:</strong> For database hosting</li>
            </ul>
            <p className="text-gray-200 leading-relaxed mt-3">
              These services have their own privacy policies and may collect standard web analytics data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <p className="text-gray-200 leading-relaxed">
              Because we don't collect personal information, there's no personal data to access,
              modify, or delete. Your check-ins are already anonymous and automatically deleted
              after 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
            <p className="text-gray-200 leading-relaxed">
              WorldVibe is not intended for children under 13. We do not knowingly collect
              information from children under 13 years of age.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-gray-200 leading-relaxed">
              We may update this privacy policy from time to time. We'll notify users of any
              material changes by updating the "Last updated" date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-200 leading-relaxed">
              If you have questions about this privacy policy, please contact us at{" "}
              <a
                href="mailto:support@worldvibe.app"
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                support@worldvibe.app
              </a>
            </p>
          </section>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Link
            href="/"
            className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
