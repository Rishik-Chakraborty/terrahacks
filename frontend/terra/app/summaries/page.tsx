'use client';

import { useState, useEffect } from 'react';

interface Summary {
  eventId: string;
  summary: string;
  timestamp: string;
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/summaries');
        if (response.ok) {
          const data = await response.json();
          setSummaries(data);
          if (data.length > 0) {
            setActiveTab(data[0].eventId);
          }
        } else {
          console.error('Failed to fetch summaries');
        }
      } catch (error) {
        console.error('Error fetching summaries:', error);
      }
    };

    fetchSummaries();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Past Summaries</h1>

        {summaries.length > 0 ? (
          <div>
            <div className="flex border-b">
              {summaries.map((summary) => (
                <button
                  key={summary.eventId}
                  className={`py-2 px-4 text-lg ${activeTab === summary.eventId ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab(summary.eventId)}
                >
                  {summary.eventId}
                </button>
              ))}
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg shadow">
              {summaries.map((summary) => (
                <div key={summary.eventId} style={{ display: activeTab === summary.eventId ? 'block' : 'none' }}>
                  <h2 className="text-2xl font-semibold mb-2">Summary for {summary.eventId}</h2>
                  <p className="text-gray-600 mb-4">Timestamp: {new Date(summary.timestamp).toLocaleString()}</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{summary.summary}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No summaries found.</p>
        )}
      </div>
    </div>
  );
}
