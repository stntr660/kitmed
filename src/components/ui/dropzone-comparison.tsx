'use client';

import { useState } from 'react';
import { ImageDropzone } from './image-dropzone';
import { CompactImageUpload } from './compact-image-upload';

export function DropzoneComparison() {
  const [shadcnImage, setShadcnImage] = useState('');
  const [compactImage, setCompactImage] = useState('');

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Image Upload Component Comparison
      </h2>

      {/* New Shadcn Dropzone */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-green-600">NEW: Shadcn Dropzone</h3>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Visible & Interactive
          </span>
        </div>
        <div className="max-w-md">
          <ImageDropzone
            value={shadcnImage}
            onChange={setShadcnImage}
            preset="demo"
            placeholder="Partner Logo"
            description="Drag & drop your logo here, or click to browse files"
            maxSize={2}
          />
        </div>
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded">
          <p className="font-medium text-green-800">Benefits:</p>
          <ul className="mt-2 space-y-1 text-green-700">
            <li>• Large, visible dropzone area</li>
            <li>• Clear drag & drop visual feedback</li>
            <li>• Shows upload instructions</li>
            <li>• Image preview with replace/remove options</li>
            <li>• Toast notifications for user feedback</li>
            <li>• Loading states with progress indication</li>
          </ul>
        </div>
      </div>

      {/* Old Compact Component */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-orange-600">OLD: Compact Upload</h3>
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Too Small
          </span>
        </div>
        <div className="max-w-md">
          <CompactImageUpload
            value={compactImage}
            onChange={setCompactImage}
            preset="demo"
            size="lg"
            shape="square"
            placeholder="Logo"
            maxSize={2}
          />
        </div>
        <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded">
          <p className="font-medium text-orange-800">Problems:</p>
          <ul className="mt-2 space-y-1 text-orange-700">
            <li>• Too small and hard to notice</li>
            <li>• Not obvious it's clickable</li>
            <li>• Limited visual feedback</li>
            <li>• Users might miss it entirely</li>
          </ul>
        </div>
      </div>

      {/* Usage in Partner Form */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold text-blue-600">Perfect for Partner Forms</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800 font-medium mb-2">Why the shadcn dropzone is better for partners:</p>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li>• <strong>Visibility:</strong> Large dropzone is impossible to miss</li>
            <li>• <strong>Professional:</strong> Matches modern web application standards</li>
            <li>• <strong>User-friendly:</strong> Clear instructions and visual feedback</li>
            <li>• <strong>Accessibility:</strong> Proper drag & drop with keyboard support</li>
            <li>• <strong>Error handling:</strong> Clear feedback when uploads fail</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Implementation Note:</h4>
        <p className="text-sm text-gray-600">
          The partner forms now use <code className="bg-white px-1 rounded">ImageDropzone</code> instead of
          <code className="bg-white px-1 rounded">CompactImageUpload</code> for better user experience.
          The new component provides a more professional and user-friendly interface for logo uploads.
        </p>
      </div>
    </div>
  );
}