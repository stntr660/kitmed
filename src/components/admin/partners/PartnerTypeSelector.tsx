'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BuildingOffice2Icon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PartnerTypeSelectorProps {
  value?: 'manufacturer' | 'distributor' | 'service' | 'technology';
  onChange: (type: 'manufacturer' | 'distributor' | 'service' | 'technology') => void;
  disabled?: boolean;
}

const partnerTypes = [
  {
    id: 'manufacturer' as const,
    icon: BuildingOffice2Icon,
    titleKey: 'admin.partners.types.manufacturer.title',
    descriptionKey: 'admin.partners.types.manufacturer.description',
    badgeText: 'admin.partners.types.manufacturer.badge',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-600'
  },
  {
    id: 'distributor' as const,
    icon: UserGroupIcon,
    titleKey: 'admin.partners.types.distributor.title',
    descriptionKey: 'admin.partners.types.distributor.description',
    badgeText: 'admin.partners.types.distributor.badge',
    color: 'bg-green-50 border-green-200 text-green-800',
    iconColor: 'text-green-600'
  },
  {
    id: 'service' as const,
    icon: WrenchScrewdriverIcon,
    titleKey: 'admin.partners.types.service.title',
    descriptionKey: 'admin.partners.types.service.description',
    badgeText: 'admin.partners.types.service.badge',
    color: 'bg-orange-50 border-orange-200 text-orange-800',
    iconColor: 'text-orange-600'
  },
  {
    id: 'technology' as const,
    icon: GlobeAltIcon,
    titleKey: 'admin.partners.types.technology.title',
    descriptionKey: 'admin.partners.types.technology.description',
    badgeText: 'admin.partners.types.technology.badge',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    iconColor: 'text-purple-600'
  }
];

export function PartnerTypeSelector({ value, onChange, disabled }: PartnerTypeSelectorProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('admin.partners.selectType')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('admin.partners.selectTypeDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {partnerTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.id;

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 border-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onChange(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600' : type.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">
                        {t(type.titleKey)}
                      </h4>
                      {type.id === 'manufacturer' && (
                        <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                          {t('admin.partners.types.manufacturer.badge')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t(type.descriptionKey)}
                    </p>

                    {/* Special note for manufacturers */}
                    {type.id === 'manufacturer' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-800 font-medium">
                          💡 {t('admin.partners.types.manufacturer.note')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help text based on selection */}
      {value && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-gray-900 mb-1">
                {t(`admin.partners.types.${value}.helpTitle`)}
              </h5>
              <p className="text-sm text-gray-600">
                {t(`admin.partners.types.${value}.helpDescription`)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}