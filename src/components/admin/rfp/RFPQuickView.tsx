'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  PencilIcon,
  EyeIcon,
  CalendarIcon,
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

interface RFPWithDetails extends RFPRequest {
  itemCount?: number;
  totalQuantity?: number;
  estimatedValue?: number;
}

interface RFPQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfp: RFPWithDetails | null;
  onEdit?: () => void;
}

export function RFPQuickView({
  open,
  onOpenChange,
  rfp,
  onEdit
}: RFPQuickViewProps) {
  const t = useTranslations();

  if (!rfp) return null;

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

  const StatusIcon = getStatusIcon(rfp.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <StatusIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-semibold text-gray-900 font-poppins">
                    {rfp.referenceNumber}
                  </SheetTitle>
                  <p className="text-sm text-gray-500">{rfp.companyName || rfp.customerName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(rfp.status)}>
                  {rfp.status}
                </Badge>
                <Badge className={getUrgencyColor(rfp.urgencyLevel)}>
                  {rfp.urgencyLevel} {t('admin.rfpRequests.drawer.messages.priority')}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                {t('admin.rfpRequests.drawer.fields.companyInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('admin.rfpRequests.drawer.fields.organizationName')}</h4>
                <p className="text-gray-900 font-medium">{rfp.companyName || 'N/A'}</p>
                <p className="text-sm text-gray-600">{t('form.company')}</p>
              </div>

              {rfp.companyAddress && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('admin.rfpRequests.drawer.fields.address')}</h4>
                    <div className="text-sm text-gray-600">
                      <p>{rfp.companyAddress}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                {t('admin.rfpRequests.drawer.fields.contactPerson')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-900 font-medium">
                  {rfp.customerName}
                </p>
                {rfp.contactPerson && (
                  <p className="text-sm text-gray-600">{rfp.contactPerson}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.emailAddress')}:</span>
                  <p className="text-gray-600">{rfp.customerEmail}</p>
                </div>

                {rfp.customerPhone && (
                  <div>
                    <span className="font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.phoneNumber')}:</span>
                    <p className="text-gray-600">{rfp.customerPhone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requested Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <div className="h-5 w-5 mr-2">📦</div>
                {t('admin.rfpRequests.drawer.fields.requestedItems')} ({rfp.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rfp.items && rfp.items.length > 0 ? (
                  rfp.items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.product?.media?.[0]?.url ? (
                            <img
                              src={item.product.media[0].url}
                              alt={item.product?.translations?.find(t => t.languageCode === 'fr')?.nom || t('common.productWithoutName')}
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
                            {item.product?.translations?.find(t => t.languageCode === 'fr')?.nom ||
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
                          <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
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
                  <p className="text-gray-500 text-sm">{t('admin.rfpRequests.drawer.messages.noProducts')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                {t('admin.rfpRequests.drawer.fields.requestSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.requestNumber')}:</span>
                  <p className="text-gray-600 font-mono">{rfp.referenceNumber}</p>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">{t('admin.rfpRequests.table.priority')}:</span>
                  <Badge className={getUrgencyColor(rfp.urgencyLevel)} variant="outline">
                    {rfp.urgencyLevel}
                  </Badge>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.createdDate')}:</span>
                  <p className="text-gray-600 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(rfp.createdAt)}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">{t('admin.rfpRequests.drawer.fields.lastUpdated')}:</span>
                  <p className="text-gray-600 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(rfp.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('dashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">{t('rfp.success')}</span>
                  <span className="text-gray-400 ml-auto">
                    {formatDate(rfp.createdAt)}
                  </span>
                </div>

                {rfp.updatedAt && rfp.updatedAt !== rfp.createdAt && (
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">{t('admin.rfpRequests.drawer.fields.lastUpdated')}</span>
                    <span className="text-gray-400 ml-auto">
                      {formatDate(rfp.updatedAt)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t mt-8 pt-6 pb-6 space-y-3">
          <Button
            onClick={onEdit}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700"
          >
            <PencilIcon className="h-4 w-4" />
            <span>{t('admin.rfpRequests.drawer.titles.manage')}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {t('common.close')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}