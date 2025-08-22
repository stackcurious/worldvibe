"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Custom UI components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Import your custom CheckInForm
import { CheckInForm } from "@/components/check-in/check-in-form";

// Recharts and icons for the Explore section
import {
  Globe,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts";

export default function CheckInPage() {
  const router = useRouter();

  // Social share handler using the Web Share API
  const handleSocialShare = useCallback(() => {
    if (navigator.share) {
      navigator
        .share({
          title: "I just shared my vibe on WorldVibe!",
          text: "I'm sharing my vibe on WorldVibe! Join me and share your emotion to shape our world.",
          url: window.location.href,
        })
        .catch((error) => console.error("Error sharing:", error));
    } else {
      alert("Your browser does not support the Share API. Please copy the URL manually.");
    }
  }, []);

  // Mock data for the Explore Global Vibes section
  const mockTrendData = [
    { time: "00:00", joy: 45, sadness: 20, fear: 15, trust: 35 },
    { time: "04:00", joy: 35, sadness: 25, fear: 20, trust: 40 },
    { time: "08:00", joy: 55, sadness: 15, fear: 10, trust: 45 },
    { time: "12:00", joy: 65, sadness: 10, fear: 5, trust: 50 },
    { time: "16:00", joy: 60, sadness: 15, fear: 10, trust: 45 },
    { time: "20:00", joy: 50, sadness: 20, fear: 15, trust: 40 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 py-16">
      <div className="container mx-auto px-4">
        {/* Increase top margin for extra breathing room */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Check-In Form */}
          <Card className="w-full">
            <CardContent className="p-8">
              <CheckInForm />
              <Button
                onClick={handleSocialShare}
                variant="outline"
                className="w-full py-3 mt-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Share to Social
              </Button>
            </CardContent>
          </Card>

          {/* Right Column: Explore Global Vibes */}
          <Card className="w-full">
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900">Global Emotional Pulse</h2>
                  <p className="text-lg text-gray-700">Real-time visualization of worldwide feelings.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-100 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">2.3M</div>
                    <div className="text-sm text-gray-700">Active Users</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">Joy</div>
                    <div className="text-sm text-gray-700">Top Emotion</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-600">3.8</div>
                    <div className="text-sm text-gray-700">Avg Intensity</div>
                  </div>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" stroke="#555" />
                          <YAxis stroke="#555" />
                          <Tooltip contentStyle={{ backgroundColor: "#fff", border: "none", boxShadow: "0px 4px 6px rgba(0,0,0,0.1)" }} />
                          <Area type="monotone" dataKey="joy" stackId="1" stroke="#FFB800" fill="#FFD700" />
                          <Area type="monotone" dataKey="sadness" stackId="1" stroke="#4682B4" fill="#87CEEB" />
                          <Area type="monotone" dataKey="fear" stackId="1" stroke="#800080" fill="#DDA0DD" />
                          <Area type="monotone" dataKey="trust" stackId="1" stroke="#008000" fill="#98FB98" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded-xl space-y-2">
                    <h3 className="font-medium flex items-center gap-2 text-gray-900">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Regional Hotspots
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>North America</span>
                        <span className="text-yellow-600">Joy (65%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Europe</span>
                        <span className="text-green-600">Trust (58%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Asia</span>
                        <span className="text-orange-600">Anticipation (52%)</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl space-y-2">
                    <h3 className="font-medium flex items-center gap-2 text-gray-900">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Trending Reasons
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                      <span className="px-2 py-1 bg-white rounded-full">weekend</span>
                      <span className="px-2 py-1 bg-white rounded-full">weather</span>
                      <span className="px-2 py-1 bg-white rounded-full">work</span>
                      <span className="px-2 py-1 bg-white rounded-full">family</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
