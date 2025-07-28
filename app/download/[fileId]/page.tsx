'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

export default function DownloadPage() {
  const params = useParams();
  const fileId = Array.isArray(params.fileId) ? params.fileId[0] : params.fileId;

  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDownloadUrl() {
      if (!fileId) return;

      try {
        const response = await axios.get(`/api/download/${fileId}`);

        if (!response.data?.url) {
          throw new Error('URL not found in response');
        }

        setDownloadUrl(response.data.url);
        setFileName(response.data.filename || 'downloaded-file');
      } catch (err: any) {
        console.error('Failed to fetch download URL:', err);
        setError('Something went wrong while fetching the file. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDownloadUrl();
  }, [fileId]);

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Download File</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!error && isLoading && <p className="text-gray-500">Loading...</p>}

      {!error && !isLoading && downloadUrl && (
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
