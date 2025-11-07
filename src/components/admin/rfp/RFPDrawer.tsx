'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  BuildingOfficeIcon, 
  UserIcon, 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { validateIconComponent } from '@/lib/component-utils';
import { RFPRequest } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface RFPDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfp?: RFPRequest | null;
  mode: 'view' | 'respond' | 'manage';
  onAction?: (action: string, data?: any) => Promise<void>;
}

export function RFPDrawer({ 
  open, 
  onOpenChange, 
  rfp, 
  mode,
  onAction 
}: RFPDrawerProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const getTitle = () => {
    switch (mode) {
      case 'respond':
        return 'Respond to RFP Request';
      case 'manage':
        return 'Manage RFP Request';
      case 'view':
        return 'RFP Request Details';
      default:
        return 'RFP Request';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'respond':
        return 'Prepare and send response to customer request';
      case 'manage':
        return 'Update request status and manage workflow';
      case 'view':
        return 'View comprehensive request details';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    let IconComponent;
    
    switch (status) {
      case 'pending':
        IconComponent = ClockIcon;
        break;
      case 'processing':
        IconComponent = ExclamationCircleIcon;
        break;
      case 'responded':
      case 'closed':
        IconComponent = CheckCircleIcon;
        break;
      default:
        IconComponent = ClockIcon;
        break;
    }
    
    return validateIconComponent(IconComponent, `StatusIcon-${status}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'responded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAction = async (action: string, data?: any) => {
    if (!onAction) return;
    
    setLoading(true);
    try {
      await onAction(action, data);
      if (action !== 'status_update') {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
    { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
    { id: 'contact', label: 'Contact', icon: UserIcon },
  ];

  if (!rfp) return null;

  const StatusIcon = getStatusIcon(rfp.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="border-b pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-2xl font-semibold text-gray-900 font-poppins">
                {getTitle()}
              </SheetTitle>
              <SheetDescription className="text-gray-600">
                {getDescription()}
              </SheetDescription>
              <div className="flex items-center space-x-3 pt-2">
                <Badge className={getStatusColor(rfp.status)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {rfp.status}
                </Badge>
                <Badge className={getUrgencyColor(rfp.urgency)}>
                  {rfp.urgency} priority
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">Request Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Request Number</label>
                      <p className="text-gray-900 font-mono">{rfp.requestNumber}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Customer</label>
                      <p className="text-gray-900">{rfp.company.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Created Date</label>
                      <p className="text-gray-900">{formatDate(rfp.createdAt)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Last Updated</label>
                      <p className="text-gray-900">{formatDate(rfp.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">Requested Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">
                      Request items will be loaded and managed here
                    </p>
                    <Button variant="outline" className="mt-4" disabled>
                      View Items
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Organization Name</label>
                  <p className="text-gray-900 text-lg font-medium">{rfp.company.name}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Organization Type</label>
                  <Badge variant="outline" className="capitalize">
                    {rfp.company.type}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Address</label>
                  <div className="text-gray-900 space-y-1">
                    <p>{rfp.company.address.street}</p>
                    <p>{rfp.company.address.city}, {rfp.company.address.postalCode}</p>
                    <p>{rfp.company.address.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Contact Person</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <p className="text-gray-900 text-lg font-medium">
                    {rfp.contact.firstName} {rfp.contact.lastName}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Position</label>
                  <p className="text-gray-900">{rfp.contact.position}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Email Address</label>
                    <p className="text-gray-900">{rfp.contact.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                    <p className="text-gray-900">{rfp.contact.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t mt-8 pt-6 pb-6 space-y-3">
          {mode === 'respond' && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleAction('save_draft')}
                disabled={loading}
                className="flex items-center justify-center space-x-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                <span>Save Draft</span>
              </Button>
              
              <Button
                onClick={() => handleAction('send_response')}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700"
              >
                {loading && <LoadingSpinner size="sm" />}
                <span>Send Response</span>
              </Button>
            </div>
          )}

          {mode === 'manage' && (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction('mark_processing')}
                disabled={loading || rfp.status === 'processing'}
                size="sm"
              >
                Processing
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('mark_responded')}
                disabled={loading || rfp.status === 'responded'}
                size="sm"
              >
                Responded
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('mark_closed')}
                disabled={loading || rfp.status === 'closed'}
                size="sm"
              >
                Close
              </Button>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}