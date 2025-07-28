'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

export default function DownloadPage() {
  const { fileId } = useParams();
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDownloadUrl() {
      try {
        const response = await axios.get(/api/download/${fileId});
        setDownloadUrl(response.data.url);
      } catch (err) {
        console.error('Failed to fetch download URL:', err);
        setError('Something went wrong while fetching the file.');
      }
    }

    fetchDownloadUrl();
  }, [fileId]);

  const handleDownload = () => {
    if (downloadUrl) {
      // Force browser to download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = ''; // Let browser use default file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Download File</h1>
      {error && <p className="text-red-500">{error}</p>}
      {!error && downloadUrl && (
        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download Now
        </button>
      )}
    </div>
  );
}
