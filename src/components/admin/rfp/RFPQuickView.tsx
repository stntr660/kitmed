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
  onRespond?: () => void;
}

export function RFPQuickView({ 
  open, 
  onOpenChange, 
  rfp, 
  onEdit,
  onRespond 
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
                    {rfp.requestNumber}
                  </SheetTitle>
                  <p className="text-sm text-gray-500">{rfp.company.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(rfp.status)}>
                  {rfp.status}
                </Badge>
                <Badge className={getUrgencyColor(rfp.urgency)}>
                  {rfp.urgency} priority
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-primary-50 border-primary-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-semibold text-primary-600">
                  {rfp.itemCount || 0}
                </div>
                <p className="text-xs text-primary-700 font-medium">Items</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-semibold text-green-600">
                  {rfp.totalQuantity || 0}
                </div>
                <p className="text-xs text-green-700 font-medium">Total Qty</p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-semibold text-amber-600">
                  {rfp.estimatedValue ? formatCurrency(rfp.estimatedValue) : '-'}
                </div>
                <p className="text-xs text-amber-700 font-medium">Est. Value</p>
              </CardContent>
            </Card>
          </div>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Organization</h4>
                <p className="text-gray-900 font-medium">{rfp.company.name}</p>
                <p className="text-sm text-gray-600 capitalize">{rfp.company.type}</p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Address</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{rfp.company.address.street}</p>
                  <p>{rfp.company.address.city}, {rfp.company.address.postalCode}</p>
                  <p>{rfp.company.address.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-900 font-medium">
                  {rfp.contact.firstName} {rfp.contact.lastName}
                </p>
                <p className="text-sm text-gray-600">{rfp.contact.position}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <p className="text-gray-600">{rfp.contact.email}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-700">Phone:</span>
                  <p className="text-gray-600">{rfp.contact.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Request Number:</span>
                  <p className="text-gray-600 font-mono">{rfp.requestNumber}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-700">Priority:</span>
                  <Badge className={getUrgencyColor(rfp.urgency)} variant="outline">
                    {rfp.urgency}
                  </Badge>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-700">Created:</span>
                  <p className="text-gray-600 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(rfp.createdAt)}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Last Updated:</span>
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
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">RFP request submitted</span>
                  <span className="text-gray-400 ml-auto">
                    {formatDate(rfp.createdAt)}
                  </span>
                </div>
                
                {rfp.updatedAt && rfp.updatedAt !== rfp.createdAt && (
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Status updated</span>
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex items-center justify-center space-x-2"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Manage RFP</span>
            </Button>
            
            <Button
              onClick={onRespond}
              className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700"
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span>Respond</span>
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}