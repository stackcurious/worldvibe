"use client";
import { Component, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';

export class AppErrorBoundary extends Component {
 state = { hasError: false };

 static getDerivedStateFromError() {
   return { hasError: true };
 }

 componentDidCatch(error: Error, errorInfo: ErrorInfo) {
   console.error('Application error:', error, errorInfo);
 }

 render() {
   if (this.state.hasError) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="text-center">
           <h2 className="text-2xl font-bold mb-4">
             Something went wrong
           </h2>
           <Button
             onClick={() => window.location.reload()}
           >
             Refresh Page
           </Button>
         </div>
       </div>
     );
   }

   return this.props.children;
 }
}