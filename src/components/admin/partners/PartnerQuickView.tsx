'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  PencilIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  StarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Partner } from '@/types';
import { formatDate } from '@/lib/utils';

interface PartnerQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
  onEdit: () => void;
}

export function PartnerQuickView({
  open,
  onOpenChange,
  partner,
  onEdit
}: PartnerQuickViewProps) {
  const t = useTranslations();

  if (!partner) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-gray-900 font-poppins">
                {partner.nom?.fr || partner.nom?.en || 'Partner'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {t('admin.partners.viewDescription')}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              {partner.featured && (
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                  <StarIconSolid className="h-3 w-3 mr-1" />
                  {t('admin.featured')}
                </Badge>
              )}
              <Badge variant={getStatusColor(partner.status)}>
                {t(`admin.partners.status.${partner.status}`, { defaultValue: partner.status })}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Partner Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="h-20 w-20 flex items-center justify-center flex-shrink-0">
                  {partner.logoUrl ? (
                    <img
                      src={partner.logoUrl}
                      alt={partner.nom?.fr || 'Partner logo'}
                      className="h-18 w-18 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-primary-100 rounded-xl flex items-center justify-center">
                      <BuildingOfficeIcon className="h-10 w-10 text-primary-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {partner.nom?.fr || partner.nom?.en}
                  </h3>
                  {partner.description?.fr && (
                    <p className="text-gray-600 mb-3">
                      {partner.description.fr}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {t('admin.created')}: {formatDate(partner.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('admin.partners.contactInfo')}
                </h4>
                <div className="space-y-3">
                  {partner.websiteUrl ? (
                    <div className="flex items-center space-x-3">
                      <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{t('admin.partners.website')}</p>
                        <a
                          href={partner.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {partner.websiteUrl}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 text-gray-400">
                      <GlobeAltIcon className="h-5 w-5" />
                      <p className="text-sm">{t('admin.partners.noWebsite')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Information */}
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('admin.partners.statusInfo')}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t('admin.status')}</span>
                    <Badge variant={getStatusColor(partner.status)}>
                      {t(`admin.partners.status.${partner.status}`, { defaultValue: partner.status })}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t('admin.featured')}</span>
                    <div className="flex items-center">
                      {partner.featured ? (
                        <StarIconSolid className="h-5 w-5 text-amber-500" />
                      ) : (
                        <StarIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t('admin.lastUpdated')}</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(partner.updatedAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Translations */}
          {partner.nom?.en && (
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-blue-600" />
                  {t('admin.partners.internationalVersion')}
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {t('admin.partners.partnerNameEnglish')}
                    </p>
                    <p className="text-gray-900">{partner.nom.en}</p>
                  </div>
                  {partner.description?.en && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {t('admin.partners.descriptionEnglish')}
                      </p>
                      <p className="text-gray-600">{partner.description.en}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between space-x-4 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          <Button onClick={onEdit} className="flex items-center space-x-2">
            <PencilIcon className="h-4 w-4" />
            <span>{t('common.edit')}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}