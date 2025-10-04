// src/components/providers/region-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';

interface RegionContextType {
 currentRegion: string | null;
 regionName: string | null;
 setRegion: (region: string) => void;
 isLoading: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: React.ReactNode }) {
 const [currentRegion, setCurrentRegion] = useState<string | null>(null);
 const [regionName, setRegionName] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectRegion = async () => {
      try {
        // Try multiple region detection services for better reliability
        const services = [
          'https://ipapi.co/json/',
          'https://ip-api.com/json/',
          'https://api.ipify.org?format=json'
        ];

        let regionDetected = false;
        
        for (const service of services) {
          try {
            console.log(`🌍 Trying region detection service: ${service}`);
            const response = await fetch(service, {
              timeout: 5000,
              headers: {
                'Accept': 'application/json',
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('✅ Region detection successful:', data);
              
              // Handle different API response formats
              let countryCode = data.country_code || data.countryCode || data.country;
              let countryName = data.country_name || data.countryName || data.country;
              
              if (countryCode && countryCode !== 'XX') {
                setCurrentRegion(countryCode.toUpperCase());
                setRegionName(countryName || countryCode);
                regionDetected = true;
                break;
              }
            }
          } catch (serviceError) {
            console.warn(`⚠️ Region detection service failed: ${service}`, serviceError);
            continue;
          }
        }

        if (!regionDetected) {
          // Fallback to timezone-based detection
          try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const [continent, city] = timezone.split("/");
            if (continent && city) {
              console.log('🕐 Using timezone fallback:', timezone);
              setCurrentRegion(continent.toUpperCase());
              setRegionName(city.replace("_", " "));
            } else {
              throw new Error('Invalid timezone format');
            }
          } catch (timezoneError) {
            console.warn('⚠️ Timezone fallback failed:', timezoneError);
            // Final fallback
            setCurrentRegion('GLOBAL');
            setRegionName('Global');
          }
        }
      } catch (error) {
        console.error('❌ All region detection methods failed:', error);
        // Final fallback
        setCurrentRegion('GLOBAL');
        setRegionName('Global');
      } finally {
        setIsLoading(false);
      }
    };

    detectRegion();
  }, []);

 const setRegion = (region: string) => {
   setCurrentRegion(region);
   // You might want to add logic here to fetch the region name
 };

 return (
   <RegionContext.Provider 
     value={{ 
       currentRegion, 
       regionName, 
       setRegion, 
       isLoading 
     }}
   >
     {children}
   </RegionContext.Provider>
 );
}

export const useRegion = () => {
 const context = useContext(RegionContext);
 if (context === undefined) {
   throw new Error('useRegion must be used within a RegionProvider');
 }
 return context;
};