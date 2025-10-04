// @ts-nocheck
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Share2, MapPin, Globe, Info, Shield, Loader2, AlertTriangle } from "lucide-react";
import { EmotionSelector } from "./emotion-selector";
import { IntensitySlider } from "./intensity-slider";
import { LoadingSpinner } from "./loading-spinner";
import { ProgressIndicator } from "./progress-indicator";
import { ShareCard } from "./share-card";
import { SuccessAnimation } from "./success-animation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "../ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/use-analytics";
import { useRegion } from "@/components/providers/region-provider";

// Assuming these are defined in your config
import { WORLD_GEOJSON } from "@/config/geo";

const steps = ["emotion", "intensity", "location", "note", "submit"];

type RegionSource = "geojson" | "provider" | "ip" | "timezone" | "locale" | "manual" | "stored";

interface RegionInfo {
  code: string;
  name: string;
  source: RegionSource;
  confidence: number;
}

export function CheckInForm() {
  // Form state
  const [currentStep, setCurrentStep] = useState("emotion");
  const [emotion, setEmotion] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [streak, setStreak] = useState(1);
  const [isRegionDetecting, setIsRegionDetecting] = useState(true);
  const [showRegionFeedback, setShowRegionFeedback] = useState(false);
  const [detectedPosition, setDetectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Device identification
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const { currentRegion, regionName, isLoading: isRegionLoading } = useRegion();

  // Region detection methods
  const pointInPolygon = useCallback((point: number[], polygons: any) => {
    for (const polygon of polygons) {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect =
          yi > point[1] !== yj > point[1] &&
          point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      if (inside) return true;
    }
    return false;
  }, []);

  const findCountryFromCoordinates = useCallback(
    (lat: number, lng: number) => {
      try {
        if (!WORLD_GEOJSON?.features) return null;

        for (const feature of WORLD_GEOJSON.features) {
          if (!feature.geometry) continue;

          const coords =
            feature.geometry.type === "Polygon"
              ? [feature.geometry.coordinates]
              : feature.geometry.coordinates;

          if (pointInPolygon([lng, lat], coords)) {
            return {
              code: feature.properties.iso_a2 || feature.properties.iso_a3 || feature.properties.name,
              name: feature.properties.name,
            };
          }
        }
        return null;
      } catch (err) {
        console.warn("Error finding country from coordinates:", err);
        return null;
      }
    },
    [pointInPolygon]
  );

  const getUserGeolocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation not supported"));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 24 * 60 * 60 * 1000,
      });
    });
  }, []);

  // Device fingerprinting
  const generateFingerprint = useCallback(async () => {
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth.toString(),
        `${screen.width}x${screen.height}`,
        new Date().getTimezoneOffset().toString(),
        navigator.hardwareConcurrency?.toString() || "",
        navigator.platform || "",
      ];

      const fingerprintStr = components.join("|");
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprintStr);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fingerprintHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      setFingerprint(fingerprintHash);

      if (!deviceId) {
        const timestamp = Date.now().toString();
        const deviceIdBase = `${fingerprintHash}|${timestamp}|${Math.random()}`;
        const deviceIdHash = await crypto.subtle.digest("SHA-256", encoder.encode(deviceIdBase));
        const newDeviceId = Array.from(new Uint8Array(deviceIdHash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        setDeviceId(newDeviceId);
        localStorage.setItem("worldvibe_device_id", newDeviceId);
      }
    } catch (err) {
      console.error("Error generating fingerprint:", err);
    }
  }, [deviceId]);

  // Multi-layer region detection
  const detectUserRegion = useCallback(async () => {
    setIsRegionDetecting(true);

    try {
      // 1. Check stored preference
      const storedRegion = localStorage.getItem("worldvibe_preferred_region");
      if (storedRegion) {
        try {
          const parsed = JSON.parse(storedRegion);
          if (parsed?.code) {
            setRegionInfo({
              code: parsed.code,
              name: parsed.name || parsed.code,
              source: "stored",
              confidence: 85,
            });
            setIsRegionDetecting(false);
            return;
          }
        } catch {}
      }

      // 2. Try precise location
      try {
        console.log('🌍 Requesting user geolocation...');
        const position = await getUserGeolocation();
        const { latitude, longitude } = position.coords;
        console.log('✅ Location received:', { latitude, longitude });
        setDetectedPosition({ lat: latitude, lng: longitude });

        const geoCountry = findCountryFromCoordinates(latitude, longitude);
        if (geoCountry) {
          console.log('✅ Country detected:', geoCountry);
          setRegionInfo({
            code: geoCountry.code,
            name: geoCountry.name,
            source: "geojson",
            confidence: 95,
          });
          setShowRegionFeedback(true);
          setTimeout(() => setShowRegionFeedback(false), 5000);
          return;
        }
      } catch (err) {
        console.error("❌ Geolocation error:", err);
        console.error("Error name:", (err as Error).name);
        console.error("Error message:", (err as Error).message);
      }

      // 3. Use region provider
      if (currentRegion && !isRegionLoading) {
        setRegionInfo({
          code: currentRegion,
          name: regionName || currentRegion,
          source: "provider",
          confidence: 80,
        });
        return;
      }

      // 4. Timezone fallback
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const [continent, city] = timezone.split("/");
        if (city) {
          setRegionInfo({
            code: continent,
            name: city.replace("_", " "),
            source: "timezone",
            confidence: 60,
          });
          return;
        }
      } catch {}

      // 5. Locale fallback
      try {
        const locale = navigator.language;
        const country = locale.split("-")[1];
        if (country) {
          setRegionInfo({
            code: country,
            name: new Intl.DisplayNames([locale], { type: "region" }).of(country) || country,
            source: "locale",
            confidence: 50,
          });
          return;
        }
      } catch {}

      // 6. Final fallback - ensure we always have a region
      console.log('🌍 Using final fallback region');
      setRegionInfo({
        code: "GLOBAL",
        name: "Global",
        source: "fallback",
        confidence: 30,
      });
    } catch (error) {
      console.error('❌ Region detection completely failed:', error);
      // Emergency fallback
      setRegionInfo({
        code: "GLOBAL",
        name: "Global",
        source: "emergency",
        confidence: 10,
      });
    } finally {
      setIsRegionDetecting(false);
    }
  }, [currentRegion, regionName, isRegionLoading, getUserGeolocation, findCountryFromCoordinates]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const storedDeviceId = localStorage.getItem("worldvibe_device_id");
      if (storedDeviceId) {
        setDeviceId(storedDeviceId);
      }
      await generateFingerprint();
      await detectUserRegion();
    };

    init();
  }, [generateFingerprint, detectUserRegion]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!emotion || !deviceId) return;

    setIsSubmitting(true);
    try {
      // Ensure we always have a region, even if detection failed
      const regionCode = regionInfo?.code || currentRegion || 'GLOBAL';
      
      const payload = {
        emotion,
        intensity,
        note,
        region: regionCode,
        timestamp: new Date().toISOString(),
        ...(detectedPosition && {
          coordinates: {
            latitude: detectedPosition.lat,
            longitude: detectedPosition.lng,
          },
        }),
      };

      console.log('📤 Submitting check-in:', payload);
      console.log('📍 Position state:', detectedPosition);

      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-ID": deviceId,
          "X-Fingerprint": fingerprint || "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Check-in failed");
      }

      // Save region preference
      if (regionInfo) {
        localStorage.setItem(
          "worldvibe_preferred_region",
          JSON.stringify({
            code: regionInfo.code,
            name: regionInfo.name,
            lastUsed: new Date().toISOString(),
          })
        );
      }

      trackEvent("check_in_complete", {
        emotion,
        intensity,
        region: regionInfo?.code,
        regionSource: regionInfo?.source,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowShareDialog(true);
      }, 2000);
    } catch (error) {
      console.error("Check-in error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to save check-in");
      toast({
        title: "Error",
        description: "Failed to save your check-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRegionSourceDescription = (source: RegionSource) => {
    switch (source) {
      case "geojson":
        return "detected using precise location";
      case "provider":
        return "detected by our location service";
      case "timezone":
        return "estimated from your timezone";
      case "locale":
        return "estimated from your browser settings";
      case "stored":
        return "from your previous selection";
      case "manual":
        return "manually selected";
      default:
        return "detected automatically";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Indicator */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <ProgressIndicator steps={steps} currentStep={currentStep} />
          </div>

          <div className="p-6 space-y-8">
            {/* Privacy Notice */}
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Shield className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your check-ins are completely private. Location data is only used for regional trends.
              </p>
            </div>

            {/* Main Form */}
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                How are you feeling?
              </h2>

              {/* Emotion Selector */}
              <EmotionSelector
                onChange={(selectedEmotion) => {
                  setEmotion(selectedEmotion);
                  setCurrentStep("intensity");
                  trackEvent("emotion_selected", { emotion: selectedEmotion });
                }}
                selectedEmotion={emotion}
              />

              {/* Intensity Slider */}
              {emotion && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <IntensitySlider
                    value={intensity}
                    onChange={(value) => {
                      setIntensity(value);
                      setCurrentStep("location");
                    }}
                    emotion={emotion}
                  />
                </motion.div>
              )}

              {/* Region Selection */}
              {emotion && intensity && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Location</h3>
                    {regionInfo && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              {showRegionFeedback && (
                                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {regionInfo.source === "geojson" ? "Location detected" : "Auto-detected"}
                                </Badge>
                              )}
                              <Info className="h-4 w-4 text-gray-400" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p>Region {getRegionSourceDescription(regionInfo.source)}</p>
                              {regionInfo.source !== "manual" && regionInfo.source !== "stored" && (
                                <p className="text-xs text-gray-500">
                                  Confidence:{" "}
                                  {regionInfo.confidence >= 90
                                    ? "High precision"
                                    : regionInfo.confidence >= 70
                                    ? "Good match"
                                    : regionInfo.confidence >= 50
                                    ? "Approximate"
                                    : "Best guess"}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {isRegionDetecting ? "Detecting your region..." : regionInfo ? regionInfo.name : "Select your region"}
                    </span>
                  </div>

                  {!detectedPosition && regionInfo?.source !== "geojson" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2 text-sm w-full justify-center"
                      onClick={async () => {
                        try {
                          setIsRegionDetecting(true);
                          const position = await getUserGeolocation();
                          const { latitude, longitude } = position.coords;
                          setDetectedPosition({ lat: latitude, lng: longitude });
                          const geoCountry = findCountryFromCoordinates(latitude, longitude);
                          if (geoCountry) {
                            setRegionInfo({
                              code: geoCountry.code,
                              name: geoCountry.name,
                              source: "geojson",
                              confidence: 95,
                            });
                            setShowRegionFeedback(true);
                            setTimeout(() => setShowRegionFeedback(false), 5000);
                            setCurrentStep("note");
                          }
                        } catch (err) {
                          toast({
                            title: "Location access denied",
                            description: "We'll use your detected region instead.",
                            variant: "default",
                          });
                        } finally {
                          setIsRegionDetecting(false);
                        }
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                      Use precise location
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Note Input */}
              {emotion && intensity && regionInfo && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-base font-medium text-gray-900 dark:text-white">
                      Tell Us Why You Are Feeling This Way? (optional)
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Shield className="h-4 w-4 text-gray-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Your response is anonymized before storage</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Textarea
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      setCurrentStep("submit");
                    }}
                    placeholder="What's on your mind?"
                    className={cn(
                      "min-h-[120px] w-full p-4",
                      "bg-white dark:bg-gray-800",
                      "border border-gray-200 dark:border-gray-700",
                      "rounded-xl",
                      "text-gray-900 dark:text-white",
                      "placeholder-gray-400 dark:placeholder-gray-500",
                      "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200"
                    )}
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500">{note.length}/200 characters</div>
                </motion.div>
              )}

              {/* Submit Button */}
              {emotion && intensity && regionInfo && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isRegionDetecting}
                    className={cn(
                      "flex-1 h-14 text-lg font-medium",
                      "bg-blue-500 hover:bg-blue-600",
                      "text-white",
                      "rounded-xl",
                      "transition-transform",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      "disabled:opacity-50"
                    )}
                  >
                    {isSubmitting ? (
                      <LoadingSpinner />
                    ) : isRegionDetecting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Detecting Region...</span>
                      </div>
                    ) : (
                      "Share Your Mood"
                    )}
                  </Button>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center text-red-600 mt-4 p-3 bg-red-50 rounded-lg"
                >
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Footer */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Privacy Protection</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your data is anonymized and only used for global emotion trends. We never track or store personally identifiable information.
          </p>
          {deviceId && (
            <div className="text-xs text-gray-400 dark:text-gray-600">
              Anonymous ID: {deviceId.substring(0, 8)}...
            </div>
          )}
        </div>
      </div>

      {/* Success Animation */}
      {showSuccess && <SuccessAnimation />}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Share Your Mood Journey</DialogTitle>
            <DialogDescription>
              {streak > 1 ? <>🔥 Keep up your {streak} day streak!</> : <>Track your emotional well-being</>}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ShareCard emotion={emotion} intensity={intensity} streak={streak} date={new Date().toLocaleDateString()} />
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(
                  `Just checked in on WorldVibe! I'm feeling ${emotion} (${intensity}/5) 🎯`
                );
                toast({
                  title: "Copied to clipboard",
                  description: "Share your mood with others!",
                  variant: "success",
                });
              }}
              variant="outline"
              className="w-full"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
