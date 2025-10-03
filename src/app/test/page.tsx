'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatabaseStatus } from '@/components/ui/database-status';

const emotionTypes = ['Joy', 'Sadness', 'Anticipation', 'Surprise', 'Stress', 'Calm', 'Anger', 'Fear', 'Disgust', 'Trust'] as const;
type EmotionType = typeof emotionTypes[number];

export default function TestPage() {
  const [emotion, setEmotion] = useState<EmotionType>('Joy');
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const emotions = emotionTypes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-in/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotion,
          intensity,
          note: note || undefined,
          deviceId: 'test-device-id',
          regionHash: 'r:na:us:ca',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create check-in');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Test Check-In</h1>
      
      <div className="mb-6">
        <DatabaseStatus />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create a Vibe</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Emotion</label>
              <select
                className="w-full p-2 border rounded"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value as EmotionType)}
              >
                {emotions.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Intensity ({intensity})
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Note (Optional)</label>
              <textarea
                className="w-full p-2 border rounded"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="How are you feeling?"
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit Check-In'}
            </Button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          {result ? (
            <div>
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded mb-4">
                Check-in created successfully!
              </div>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-gray-500 italic">
              Submit a check-in to see the result
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}