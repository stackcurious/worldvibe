"use client";
import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DatabaseError from '@/components/error-boundary/database-error';
import { isDatabaseConnectionError } from '@/lib/db/status-messages';

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
 errorType: 'database' | 'general';
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
   super(props);
   this.state = { hasError: false, error: null, errorType: 'general' };
 }

 static getDerivedStateFromError(error: Error): State {
   // Check if it's a database connection error
   const isDbError = isDatabaseConnectionError(error);
   
   return { 
     hasError: true, 
     error, 
     errorType: isDbError ? 'database' : 'general'
   };
 }

 componentDidCatch(error: Error, errorInfo: ErrorInfo) {
   console.error('Error caught by boundary:', error, errorInfo);
   
   // Report to Sentry
   Sentry.captureException(error, {
     extra: {
       componentStack: errorInfo.componentStack,
       errorType: this.state.errorType
     },
   });
 }

 private handleReset = () => {
   this.setState({ hasError: false, error: null, errorType: 'general' });
 };

 render() {
   if (this.state.hasError) {
     // If a custom fallback is provided, use it
     if (this.props.fallback) {
       return this.props.fallback;
     }

     // If it's a database connection error, show the database error UI
     if (this.state.errorType === 'database' && this.state.error) {
       return (
         <DatabaseError 
           error={this.state.error} 
           reset={this.handleReset} 
         />
       );
     }

     // Default error UI
     return (
       <Card className="p-6 max-w-md mx-auto my-8">
         <div className="space-y-4">
           <h2 className="text-xl font-semibold text-red-600">
             Something went wrong
           </h2>
           <p className="text-gray-600">
             We've been notified and will fix this as soon as possible.
           </p>
           <div className="flex gap-4">
             <Button onClick={this.handleReset}>
               Try Again
             </Button>
             <Button 
               variant="outline" 
               onClick={() => window.location.reload()}
             >
               Refresh Page
             </Button>
           </div>
         </div>
       </Card>
     );
   }

   return this.props.children;
 }
}