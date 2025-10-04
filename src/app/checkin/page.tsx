"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles, Send, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { AvatarHead, AVATAR_OPTIONS } from "@/components/avatars/avatar-heads";

const EMOTIONS = [
  { name: "Joy", emoji: "😊", color: "#FFB800", description: "Feeling happy and upbeat" },
  { name: "Calm", emoji: "😌", color: "#4CAF50", description: "Peaceful and relaxed" },
  { name: "Stress", emoji: "😰", color: "#F44336", description: "Overwhelmed or anxious" },
  { name: "Anticipation", emoji: "🤩", color: "#FF9800", description: "Excited for what's next" },
  { name: "Sadness", emoji: "😢", color: "#2196F3", description: "Feeling down or blue" },
];

const INTENSITY_LABELS = ["Subtle", "Mild", "Moderate", "Strong", "Intense"];

// Use the avatar options from the component
const AVATARS = AVATAR_OPTIONS;

export default function CheckInPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Generate or get device ID
    let storedDeviceId = localStorage.getItem('worldvibe_device_id');
    if (!storedDeviceId) {
      storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('worldvibe_device_id', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // Check if user already subscribed
    const subscribedEmail = localStorage.getItem('worldvibe_subscribed_email');
    if (subscribedEmail) {
      setAlreadySubscribed(true);
    }
  }, []);

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    setTimeout(() => setStep(2), 300);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Submit check-in to API
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion: selectedEmotion?.toLowerCase(), // API expects lowercase
          avatar: selectedAvatar,
          intensity,
          note: note || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit check-in');
      }

      setIsSubmitting(false);
      setSubmitted(true);

      // Check if we should show email prompt
      const shouldShowPrompt = shouldShowEmailPrompt();

      // Show email reminder prompt after 2 seconds (if eligible)
      if (shouldShowPrompt && !alreadySubscribed) {
        setTimeout(() => {
          setShowEmailPrompt(true);
        }, 2000);
      } else {
        // If not showing prompt, redirect to globe after 3 seconds
        setTimeout(() => {
          router.push("/globe");
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting check-in:', error);
      setIsSubmitting(false);
      // Show error state (for now just alert, could enhance with toast)
      alert('Failed to submit check-in. Please try again.');
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setEmailSubmitting(true);

    try {
      const response = await fetch('/api/reminders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          deviceId: deviceId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Mark as subscribed in localStorage
        localStorage.setItem('worldvibe_subscribed_email', email);
        alert('✅ Success! Check your email to verify your subscription.');
        setTimeout(() => router.push("/globe"), 1000);
      } else {
        alert(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Error subscribing to reminders:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setEmailSubmitting(false);
    }
  };

  const shouldShowEmailPrompt = (): boolean => {
    // Check if user dismissed the prompt
    const dismissedUntil = localStorage.getItem('worldvibe_email_prompt_dismissed');
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      if (dismissedDate > new Date()) {
        return false; // Still in dismissal period
      }
    }
    return true;
  };

  const handleSkipEmail = () => {
    router.push("/globe");
  };

  const handleDontAskAgain = () => {
    // Dismiss for 7 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    localStorage.setItem('worldvibe_email_prompt_dismissed', dismissUntil.toISOString());
    router.push("/globe");
  };

  if (!mounted) return null;

  const selectedEmotionData = EMOTIONS.find((e) => e.name === selectedEmotion);
  const selectedAvatarData = AVATARS.find((a) => a.id === selectedAvatar);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        <AnimatePresence mode="wait">
          {submitted ? (
            // Success State
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                className="w-32 h-32 mx-auto mb-8 bg-green-500/20 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <Check className="w-16 h-16 text-green-400" />
              </motion.div>

              <h2 className="text-5xl font-bold mb-4">Thank you! ✨</h2>
              <p className="text-xl text-gray-300 mb-2">
                {showEmailPrompt ? "You're helping shape the world" : "Your vibe has been added to the global pulse"}
              </p>
              {!showEmailPrompt && (
                <p className="text-sm text-gray-400">Preparing something special...</p>
              )}

              {!showEmailPrompt && selectedEmotionData && selectedAvatarData && (
                <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
                  <motion.div
                    className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 rounded-3xl shadow-xl border-2 border-white/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <AvatarHead variant={selectedAvatar as any} size={60} />
                    <span className="text-lg font-bold text-white">{selectedAvatarData.name}</span>
                  </motion.div>

                  <motion.div
                    className="text-3xl text-gray-400"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    +
                  </motion.div>

                  <motion.div
                    className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 rounded-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="text-3xl">{selectedEmotionData.emoji}</span>
                    <span className="text-lg font-medium">{selectedEmotionData.name}</span>
                  </motion.div>
                </div>
              )}

              {/* Email Reminder Prompt */}
              {showEmailPrompt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 max-w-md mx-auto"
                >
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                    <div className="text-center mb-6">
                      <motion.div
                        className="inline-block text-6xl mb-3"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🌍
                      </motion.div>
                      <h3 className="text-3xl font-bold mb-3">Help Shape the World</h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        Join thousands making the world's emotional pulse visible, one check-in at a time.
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 text-left">
                        <span className="text-2xl mt-1">📧</span>
                        <div>
                          <p className="font-semibold text-white">Daily gentle reminder</p>
                          <p className="text-sm text-gray-300">We'll ping you once a day to share your vibe</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-left">
                        <span className="text-2xl mt-1">🔥</span>
                        <div>
                          <p className="font-semibold text-white">Build your streak</p>
                          <p className="text-sm text-gray-300">See your consistency grow day by day</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-left">
                        <span className="text-2xl mt-1">🌎</span>
                        <div>
                          <p className="font-semibold text-white">Make real impact</p>
                          <p className="text-sm text-gray-300">Your daily check-in helps shape global understanding</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-2xl p-4 mb-6">
                      <p className="text-sm text-blue-200 flex items-start gap-2">
                        <span className="text-lg">🔒</span>
                        <span>
                          <strong className="text-white">100% Private.</strong> Just one daily reminder—no spam, no sharing, no marketing. Ever.
                        </span>
                      </p>
                    </div>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all mb-4"
                      onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    />

                    <motion.button
                      onClick={handleEmailSubmit}
                      disabled={emailSubmitting || !email}
                      className="w-full px-6 py-5 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full font-bold text-white text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: emailSubmitting || !email ? 1 : 1.02 }}
                      whileTap={{ scale: emailSubmitting || !email ? 1 : 0.98 }}
                    >
                      {emailSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Subscribing...
                        </span>
                      ) : (
                        '✨ Yes! Help Me Shape the World'
                      )}
                    </motion.button>

                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button
                        onClick={handleSkipEmail}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Maybe later
                      </button>
                      <span className="text-gray-600">•</span>
                      <button
                        onClick={handleDontAskAgain}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Don't ask for 7 days
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : step === 1 ? (
            // Step 1: Emotion Selection
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-12">
                <motion.div
                  className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Step 1 of 4</span>
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-black mb-4">
                  How are you feeling?
                </h1>
                <p className="text-xl text-gray-300">
                  Pick the emotion that matches your vibe right now
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {EMOTIONS.map((emotion, i) => (
                  <motion.button
                    key={emotion.name}
                    onClick={() => handleEmotionSelect(emotion.name)}
                    className="group relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/10 hover:border-white/30 transition-all overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${emotion.color}10 0%, rgba(255,255,255,0.05) 100%)`,
                      }}
                    >
                      {/* Glow on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"
                        style={{ backgroundColor: emotion.color }}
                      />

                      <div className="relative text-center">
                        <div className="text-6xl mb-4">{emotion.emoji}</div>
                        <div className="font-bold text-xl mb-2" style={{ color: emotion.color }}>
                          {emotion.name}
                        </div>
                        <div className="text-xs text-gray-400">{emotion.description}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : step === 2 ? (
            // Step 2: Avatar Selection
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <div className="text-center mb-12">
                <motion.div
                  className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Step 2 of 4</span>
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-black mb-4">
                  Pick your vibe avatar
                </h1>
                <p className="text-xl text-gray-300">
                  This will appear on the globe when people hover over your check-in
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-4xl mx-auto">
                {AVATARS.map((avatar, i) => (
                  <motion.button
                    key={avatar.id}
                    onClick={() => {
                      setSelectedAvatar(avatar.id);
                      setTimeout(() => setStep(3), 300);
                    }}
                    className="group relative"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 overflow-hidden shadow-2xl border-2 border-white/20 hover:border-white/40 transition-all">
                      {/* Avatar head illustration */}
                      <div className="relative flex justify-center mb-4">
                        <AvatarHead variant={avatar.id as any} size={100} />
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-lg text-white mb-1">
                          {avatar.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {avatar.description}
                        </div>
                      </div>

                      {/* Selection ring */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl ring-4 ring-blue-400"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      />
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Go back
                </button>
              </div>
            </motion.div>
          ) : step === 3 ? (
            // Step 3: Intensity
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <div className="text-center mb-12">
                <motion.div
                  className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Step 3 of 4</span>
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-black mb-4">
                  How intense is it?
                </h1>

                {selectedEmotionData && (
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <span className="text-5xl">{selectedEmotionData.emoji}</span>
                    <span className="text-2xl font-bold" style={{ color: selectedEmotionData.color }}>
                      {selectedEmotionData.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="max-w-2xl mx-auto">
                {/* Intensity Slider */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
                  <div className="mb-8">
                    <div className="text-center mb-8">
                      <motion.div
                        className="text-8xl mb-4"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5 }}
                        key={intensity}
                      >
                        {selectedEmotionData?.emoji}
                      </motion.div>
                      <div className="text-3xl font-bold" style={{ color: selectedEmotionData?.color }}>
                        {INTENSITY_LABELS[intensity - 1]}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={intensity}
                      onChange={(e) => setIntensity(parseInt(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${selectedEmotionData?.color} 0%, ${selectedEmotionData?.color} ${
                          ((intensity - 1) / 4) * 100
                        }%, rgba(255,255,255,0.1) ${((intensity - 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />

                    <div className="flex justify-between mt-4 text-sm text-gray-400">
                      {INTENSITY_LABELS.map((label, i) => (
                        <span key={i} className={intensity === i + 1 ? "text-white font-bold" : ""}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    onClick={() => setStep(4)}
                    className="w-full px-8 py-4 rounded-full font-bold text-lg text-white"
                    style={{ backgroundColor: selectedEmotionData?.color }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            // Step 4: Optional Note
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <div className="text-center mb-12">
                <motion.div
                  className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Step 4 of 4</span>
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-black mb-4">
                  Want to add a note?
                </h1>
                <p className="text-xl text-gray-300">
                  Optional - share what's on your mind
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mb-6">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's contributing to this feeling? (Optional)"
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-white/30 transition-all"
                    maxLength={280}
                  />
                  <div className="text-right text-sm text-gray-400 mt-2">
                    {note.length}/280
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-5 rounded-full font-bold text-xl text-white flex items-center justify-center gap-3"
                    style={{ backgroundColor: selectedEmotionData?.color }}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6" />
                        Submit Check-in
                      </>
                    )}
                  </motion.button>

                  {note === "" && (
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-5 rounded-full font-bold text-lg bg-white/10 hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Skip
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
