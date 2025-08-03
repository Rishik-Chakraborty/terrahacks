'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  patient_name: string;
  medication: string;
  doctor: string;
}

export default function MeetingWithAIPage() {
  const [summary, setSummary] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  useEffect(() => {
    const fetchUserData = async () => {
      const sessionId = localStorage.getItem('userSessionId');
      console.log('SessionId from localStorage:', sessionId);
      
      if (!sessionId) {
        setError('No session ID found in localStorage');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = `http://localhost:5000/api/user_data?sessionId=${sessionId}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Received data:', data);
          setUserData(data);
          setError(null);
        } else {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          setError(`Failed to fetch user data: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Network error:', error);
        setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveSummary = async () => {
    if (!eventId) {
      alert('Error: No event ID found.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          summary,
        }),
      });

      if (response.ok) {
        alert('Summary saved successfully!');
        setSummary('');
      } else {
        const errorData = await response.json();
        alert(`Failed to save summary: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving summary:', error);
      alert('An error occurred while saving the summary.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-gray-800">AI Check-in</h1>
          <Link href="/summaries" className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200">
            View Past Summaries
          </Link>
        </div>
        <p className="text-gray-600 mb-8">
          Have a conversation with your AI assistant about your recovery progress.
        </p>

        {/* Debug Information */}
        {loading && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            Loading user data...
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
            <br />
            <small>Check the browser console and Flask server logs for more details.</small>
          </div>
        )}

        {userData && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>User Data Loaded:</strong>
            <ul>
              <li>Patient: {userData.patient_name}</li>
              <li>Medication: {userData.medication}</li>
              <li>Doctor: {userData.doctor}</li>
            </ul>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">ElevenLabs AI Assistant</h2>
          <div id="elevenlabs-widget-container">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">ElevenLabs AI Assistant</h2>
              <div id="elevenlabs-widget-container"></div>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.elevenlabs = window.elevenlabs || {};
                    window.elevenlabs.agentId = "agent_1601k1q01gsae9jae5wr2jj0dv7y";
                    window.elevenlabs.dynamicVariables = ${JSON.stringify(userData || {})};
                  `,
                }}
              />
              <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
            </div>

            <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Meeting Summary</h2>
          <textarea
            className="w-full h-40 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter a summary of the meeting..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          ></textarea>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveSummary}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              End Meeting & Save Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

