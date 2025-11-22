'use client';

import { useState } from 'react';
import { CompactImageUpload } from './compact-image-upload';

/**
 * CompactImageUpload Usage Examples
 * 
 * This component demonstrates various use cases for the CompactImageUpload component
 * which can be used throughout the KITMED application for image uploads.
 */

export function CompactImageUploadExamples() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [categoryImageUrl, setCategoryImageUrl] = useState('');

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        CompactImageUpload Examples
      </h2>

      {/* Partner/User Avatar - Small Circle */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">User Avatar / Profile Picture</h3>
        <div className="flex items-center space-x-4">
          <CompactImageUpload
            value={avatarUrl}
            onChange={setAvatarUrl}
            preset="userAvatar"
            size="sm"
            shape="circle"
            placeholder="Avatar"
            maxSize={1}
          />
          <p className="text-sm text-gray-600">Small circular avatar for user profiles</p>
        </div>
      </div>

      {/* Partner Logo - Medium Square */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Partner Logo</h3>
        <div className="flex items-center space-x-4">
          <CompactImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            preset="partnerLogo"
            size="md"
            shape="square"
            placeholder="Logo"
            maxSize={2}
          />
          <p className="text-sm text-gray-600">Medium square logo for business partners</p>
        </div>
      </div>

      {/* Product Image - Large Square */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Product Image</h3>
        <div className="flex items-center space-x-4">
          <CompactImageUpload
            value={productImageUrl}
            onChange={setProductImageUrl}
            preset="productImage"
            size="lg"
            shape="square"
            placeholder="Product"
            maxSize={5}
          />
          <p className="text-sm text-gray-600">Large square image for medical equipment</p>
        </div>
      </div>

      {/* Banner Image - Large Rectangle */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Banner Image</h3>
        <div className="flex items-center space-x-4">
          <CompactImageUpload
            value={bannerImageUrl}
            onChange={setBannerImageUrl}
            preset="bannerImage"
            size="lg"
            shape="rectangle"
            placeholder="Banner"
            maxSize={10}
            showRemove={true}
          />
          <p className="text-sm text-gray-600">Large rectangular banner for homepage</p>
        </div>
      </div>

      {/* Category Image - Medium with disabled state */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Category Image (Disabled Example)</h3>
        <div className="flex items-center space-x-4">
          <CompactImageUpload
            value={categoryImageUrl}
            onChange={setCategoryImageUrl}
            preset="categoryImage"
            size="md"
            shape="square"
            placeholder="Category"
            maxSize={3}
            disabled={true}
          />
          <p className="text-sm text-gray-600">Disabled state example</p>
        </div>
      </div>

      {/* Multiple inline small images */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Multiple Inline Images</h3>
        <div className="flex items-center space-x-2">
          <CompactImageUpload
            value=""
            onChange={() => {}}
            preset="thumbnails"
            size="sm"
            shape="square"
            placeholder="Thumb 1"
            maxSize={1}
          />
          <CompactImageUpload
            value=""
            onChange={() => {}}
            preset="thumbnails"
            size="sm"
            shape="square"
            placeholder="Thumb 2"
            maxSize={1}
          />
          <CompactImageUpload
            value=""
            onChange={() => {}}
            preset="thumbnails"
            size="sm"
            shape="square"
            placeholder="Thumb 3"
            maxSize={1}
          />
          <p className="text-sm text-gray-600 ml-4">Multiple small thumbnails</p>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Usage Notes:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Uses <code>preset</code> to organize uploaded files by type</li>
          <li>• Three sizes: sm (64px), md (96px), lg (128px)</li>
          <li>• Three shapes: square, circle, rectangle (16:9)</li>
          <li>• Drag & drop support with visual feedback</li>
          <li>• Toast notifications for upload status</li>
          <li>• Hover overlay shows upload icon on existing images</li>
          <li>• Remove button appears on hover (can be disabled)</li>
          <li>• Configurable file size limits</li>
        </ul>
      </div>

      {/* Implementation Example */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Implementation Example:</h4>
        <pre className="text-xs text-gray-700 overflow-x-auto">
{`import { CompactImageUpload } from '@/components/ui/compact-image-upload';

function MyComponent() {
  const [imageUrl, setImageUrl] = useState('');
  
  return (
    <CompactImageUpload
      value={imageUrl}
      onChange={setImageUrl}
      preset="partnerLogo"
      size="md"
      shape="square"
      placeholder="Upload logo"
      maxSize={2}
    />
  );
}`}
        </pre>
      </div>
    </div>
  );
}