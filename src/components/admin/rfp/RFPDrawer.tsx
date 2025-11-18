'use client';

import React, { useState, useEffect } from 'react';
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
        return t('admin.rfpRequests.drawer.titles.respond');
      case 'manage':
        return t('admin.rfpRequests.drawer.titles.manage');
      case 'view':
        return t('admin.rfpRequests.drawer.titles.view');
      default:
        return t('admin.rfpRequests.drawer.titles.default');
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'respond':
        return t('admin.rfpRequests.drawer.subtitles.respond');
      case 'manage':
        return t('admin.rfpRequests.drawer.subtitles.manage');
      case 'view':
        return t('admin.rfpRequests.drawer.subtitles.view');
      default:
        return t('admin.rfpRequests.drawer.subtitles.default');
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
    { id: 'overview', label: t('admin.rfpRequests.drawer.tabs.overview'), icon: DocumentTextIcon },
    { id: 'company', label: t('admin.rfpRequests.drawer.tabs.company'), icon: BuildingOfficeIcon },
    { id: 'contact', label: t('admin.rfpRequests.drawer.tabs.contact'), icon: UserIcon },
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
                  {t(`admin.rfpRequests.statuses.${rfp.status}`)}
                </Badge>
                <Badge className={getUrgencyColor(rfp.urgencyLevel)}>
                  {t('admin.rfpRequests.table.priority')} {rfp.urgencyLevel}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Simplified layout for manage mode */}
        {mode === 'manage' ? null : (
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
        )}

        <div className="space-y-6">
          {mode === 'manage' ? (
            /* Simplified Manage View */
            <>
              {/* Quick Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t('admin.rfpRequests.drawer.fields.requestNumber')}:</span>
                      <p className="font-mono font-medium">{rfp.referenceNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('admin.rfpRequests.table.customer')}:</span>
                      <p className="font-medium">{rfp.companyName || rfp.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('admin.rfpRequests.drawer.fields.emailAddress')}:</span>
                      <p>{rfp.customerEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('admin.rfpRequests.drawer.fields.createdDate')}:</span>
                      <p>{formatDate(rfp.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Articles demandés */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center">
                    📦 {t('admin.rfpRequests.drawer.fields.requestedItems')} ({rfp.items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rfp.items && rfp.items.length > 0 ? (
                      rfp.items.map((item: any) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              {item.product?.media?.[0]?.url ? (
                                <img 
                                  src={item.product.media[0].url} 
                                  alt={item.product?.translations?.find((t: any) => t.languageCode === 'fr')?.nom || t('common.productImage')}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center ${item.product?.media?.[0]?.url ? 'hidden' : 'flex'}`}
                              >
                                <span className="text-gray-400 text-xs">📦</span>
                              </div>
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {item.product?.translations?.find((t: any) => t.languageCode === 'fr')?.nom || 
                                 item.product?.translations?.[0]?.nom || 
                                 t('common.productWithoutName')}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {item.product?.referenceFournisseur} • {item.product?.constructeur}
                              </p>
                            </div>
                            
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                              {t('admin.rfpRequests.drawer.fields.quantity')}: {item.quantity}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        {t('admin.rfpRequests.drawer.messages.noProducts')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Full View for other modes */
            <>
              {activeTab === 'overview' && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-gray-900">{t('admin.rfpRequests.drawer.fields.requestSummary')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.requestNumber')}</label>
                          <p className="text-gray-900 font-mono">{rfp.referenceNumber}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-gray-700">{t('admin.rfpRequests.table.customer')}</label>
                          <p className="text-gray-900">{rfp.companyName || rfp.customerName}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.createdDate')}</label>
                          <p className="text-gray-900">{formatDate(rfp.createdAt)}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.lastUpdated')}</label>
                          <p className="text-gray-900">{formatDate(rfp.updatedAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Request Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                        <div className="h-5 w-5 mr-2">📦</div>
                        {t('admin.rfpRequests.drawer.fields.requestedItems')} ({rfp.items?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {rfp.items && rfp.items.length > 0 ? (
                          rfp.items.map((item: any) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                {/* Product Image */}
                                <div className="flex-shrink-0">
                                  {item.product?.media?.[0]?.url ? (
                                    <img 
                                      src={item.product.media[0].url} 
                                      alt={item.product?.translations?.find((t: any) => t.languageCode === 'fr')?.nom || t('common.productImage')}
                                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className={`w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center ${item.product?.media?.[0]?.url ? 'hidden' : 'flex'}`}
                                  >
                                    <span className="text-gray-400 text-xs">📦</span>
                                  </div>
                                </div>
                                
                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900">
                                    {item.product?.translations?.find((t: any) => t.languageCode === 'fr')?.nom || 
                                     item.product?.translations?.[0]?.nom || 
                                     t('common.productWithoutName')}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {t('common.reference')}: {item.product?.referenceFournisseur || 'N/A'}
                                  </p>
                                  {item.product?.constructeur && (
                                    <p className="text-sm text-gray-500">
                                      {t('common.manufacturer')}: {item.product.constructeur}
                                    </p>
                                  )}
                                  {item.specialRequirements && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      <strong>{t('admin.rfpRequests.drawer.fields.specialRequirements')}:</strong> {item.specialRequirements}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Quantity and Price */}
                                <div className="flex-shrink-0 text-right">
                                  <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium">
                                    {t('admin.rfpRequests.drawer.fields.quantity')}: {item.quantity}
                                  </span>
                                  {item.quotedPrice && (
                                    <p className="text-sm text-green-600 font-medium mt-1">
                                      {formatCurrency(item.quotedPrice)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-500">
                              {t('admin.rfpRequests.drawer.messages.noProductsInRequest')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'company' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-900">{t('admin.rfpRequests.drawer.fields.companyInformation')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.organizationName')}</label>
                      <p className="text-gray-900">{rfp.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.address')}</label>
                      <p className="text-gray-900">{rfp.companyAddress || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'contact' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-900">{t('admin.rfpRequests.drawer.fields.contactPerson')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">{t('common.name')}</label>
                      <p className="text-gray-900">{rfp.customerName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.emailAddress')}</label>
                        <p className="text-gray-900">{rfp.customerEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.phoneNumber')}</label>
                        <p className="text-gray-900">{rfp.customerPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t mt-8 pt-6 pb-6 space-y-3">
          {mode === 'manage' && (
            <div className="flex gap-3">
              <Button
                onClick={() => handleAction('update-status', { status: 'quoted' })}
                disabled={loading || rfp.status === 'quoted'}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading && <LoadingSpinner size="sm" />}
                <span>✓ {t('admin.rfpRequests.drawer.actions.markAsSent')}</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleAction('update-status', { status: 'completed' })}
                disabled={loading || rfp.status === 'completed'}
                className="flex items-center space-x-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                <span>{t('admin.rfpRequests.drawer.actions.complete')}</span>
              </Button>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {mode === 'view' ? t('admin.rfpRequests.drawer.actions.close') : t('admin.rfpRequests.drawer.actions.cancel')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}