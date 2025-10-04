"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function TermsPage() {
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
              Terms of Service
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
            <h2 className="text-2xl font-bold mb-4">Welcome to WorldVibe</h2>
            <p className="text-gray-200 leading-relaxed">
              By using WorldVibe, you agree to these terms of service. Please read them carefully.
              If you don't agree with any part of these terms, please don't use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-200 leading-relaxed">
              By accessing and using WorldVibe, you accept and agree to be bound by the terms
              and provisions of this agreement. If you do not agree to these terms, you should
              not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-gray-200 leading-relaxed mb-3">
              WorldVibe is a global emotional check-in platform that allows users to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-200">
              <li>Submit one anonymous daily emotional check-in</li>
              <li>View real-time global emotional data on an interactive globe</li>
              <li>Explore aggregated emotional trends and statistics</li>
              <li>Connect with a global community through shared feelings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Conduct</h2>
            <p className="text-gray-200 leading-relaxed mb-3">You agree to use WorldVibe responsibly:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-200">
              <li>Submit only genuine emotional check-ins</li>
              <li>Do not attempt to manipulate or game the system</li>
              <li>Do not use automated tools to submit multiple check-ins</li>
              <li>Respect the anonymous nature of the platform</li>
              <li>Do not attempt to identify or track other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. One Check-in Per Day</h2>
            <p className="text-gray-200 leading-relaxed">
              Users are limited to one emotional check-in per 24-hour period. This limit is
              enforced through device fingerprinting. Attempts to circumvent this limitation
              may result in temporary or permanent restriction from the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Anonymous Data</h2>
            <p className="text-gray-200 leading-relaxed">
              All check-ins are anonymous. By submitting a check-in, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-200 mt-3">
              <li>Your check-in data will be displayed publicly on the globe and in aggregated statistics</li>
              <li>You cannot edit or delete check-ins after submission</li>
              <li>All check-ins are automatically deleted after 30 days</li>
              <li>No personally identifiable information is collected or stored</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
            <p className="text-gray-200 leading-relaxed">
              WorldVibe and its original content, features, and functionality are owned by
              WorldVibe and are protected by international copyright, trademark, and other
              intellectual property laws. The source code is available on GitHub under the
              MIT License.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-gray-200 leading-relaxed">
              WorldVibe is provided "as is" and "as available" without any warranties of any kind,
              either express or implied. We do not warrant that the service will be uninterrupted,
              timely, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Not Medical Advice</h2>
            <p className="text-gray-200 leading-relaxed">
              WorldVibe is not a mental health service and does not provide medical advice,
              diagnosis, or treatment. If you're experiencing a mental health crisis, please
              contact a qualified healthcare provider or emergency services immediately.
            </p>
            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-200 font-medium">
                🆘 Crisis Resources:
              </p>
              <ul className="text-gray-200 mt-2 space-y-1">
                <li>USA: 988 Suicide & Crisis Lifeline</li>
                <li>International: <a href="https://findahelpline.com" className="text-yellow-400 hover:text-yellow-300 transition-colors" target="_blank" rel="noopener noreferrer">findahelpline.com</a></li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-200 leading-relaxed">
              WorldVibe shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages resulting from your use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Age Requirement</h2>
            <p className="text-gray-200 leading-relaxed">
              You must be at least 13 years old to use WorldVibe. By using the service, you
              represent that you are at least 13 years of age.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
            <p className="text-gray-200 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of
              any material changes by updating the "Last updated" date at the top of this page.
              Your continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Termination</h2>
            <p className="text-gray-200 leading-relaxed">
              We reserve the right to terminate or suspend access to our service immediately,
              without prior notice, for conduct that we believe violates these terms or is
              harmful to other users or the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. Governing Law</h2>
            <p className="text-gray-200 leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of
              the United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
            <p className="text-gray-200 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{" "}
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
