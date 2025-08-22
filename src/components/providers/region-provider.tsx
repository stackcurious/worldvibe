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
       // You might want to use a geolocation service here
       // This is a simplified example
       const response = await fetch('https://ipapi.co/json/');
       const data = await response.json();
       
       setCurrentRegion(data.country_code);
       setRegionName(data.country_name);
     } catch (error) {
       console.error('Error detecting region:', error);
       // Fallback to a default region
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