'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  LightBulbIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface HelpTooltipProps {
  content: string;
  title?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export function HelpTooltip({ 
  content, 
  title, 
  children, 
  position = 'top',
  size = 'md' 
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const sizeClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80'
  };

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="inline-flex items-center cursor-help"
        tabIndex={0}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className={`
          absolute z-50 ${sizeClasses[size]} ${positionClasses[position]}
          bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3
          pointer-events-none
        `}>
          {title && (
            <div className="font-medium mb-1">{title}</div>
          )}
          <div className="text-gray-200">{content}</div>
          
          {/* Arrow */}
          <div className={`
            absolute w-2 h-2 bg-gray-900 transform rotate-45
            ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : ''}
            ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : ''}
            ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : ''}
            ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}
          `} />
        </div>
      )}
    </div>
  );
}

interface QuickStartGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickStartGuide({ open, onOpenChange }: QuickStartGuideProps) {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('admin.categories.quickStart.step1.title'),
      description: t('admin.categories.quickStart.step1.description'),
      image: '/images/help/step1.jpg', // Placeholder
      tips: [
        t('admin.categories.quickStart.step1.tip1'),
        t('admin.categories.quickStart.step1.tip2'),
        t('admin.categories.quickStart.step1.tip3'),
      ]
    },
    {
      title: t('admin.categories.quickStart.step2.title'),
      description: t('admin.categories.quickStart.step2.description'),
      image: '/images/help/step2.jpg', // Placeholder
      tips: [
        t('admin.categories.quickStart.step2.tip1'),
        t('admin.categories.quickStart.step2.tip2'),
      ]
    },
    {
      title: t('admin.categories.quickStart.step3.title'),
      description: t('admin.categories.quickStart.step3.description'),
      image: '/images/help/step3.jpg', // Placeholder
      tips: [
        t('admin.categories.quickStart.step3.tip1'),
        t('admin.categories.quickStart.step3.tip2'),
      ]
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('admin.categories.quickStart.title')}
              </h2>
              <p className="text-sm text-gray-600">
                {t('admin.categories.quickStart.description')}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-2
                    ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Placeholder for step image */}
            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center">
                <LightBulbIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Illustration pour l'étape {currentStep + 1}
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                <LightBulbIcon className="h-4 w-4 mr-2" />
                {t('admin.categories.quickStart.tips')}
              </h4>
              <ul className="space-y-2">
                {steps[currentStep].tips.map((tip, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            {t('admin.categories.quickStart.previous')}
          </Button>

          <span className="text-sm text-gray-500">
            {currentStep + 1} sur {steps.length}
          </span>

          {currentStep === steps.length - 1 ? (
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t('admin.categories.quickStart.getStarted')}
            </Button>
          ) : (
            <Button 
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t('admin.categories.quickStart.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface HelpButtonProps {
  onClick: () => void;
  variant?: 'floating' | 'inline';
}

export function HelpButton({ onClick, variant = 'inline' }: HelpButtonProps) {
  const t = useTranslations();

  if (variant === 'floating') {
    return (
      <Button
        onClick={onClick}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-40"
        size="sm"
        title={t('admin.categories.help.getHelp')}
      >
        <QuestionMarkCircleIcon className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="text-blue-600 border-blue-200 hover:bg-blue-50"
    >
      <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
      {t('admin.categories.help.guide')}
    </Button>
  );
}

interface ExpandableHelpProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function ExpandableHelp({ title, children, defaultExpanded = false }: ExpandableHelpProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50 rounded-t-lg transition-colors"
      >
        <div className="flex items-center space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">{title}</span>
        </div>
        <ChevronDownIcon 
          className={`h-4 w-4 text-blue-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 text-sm text-blue-800 border-t border-blue-200">
          {children}
        </div>
      )}
    </div>
  );
}