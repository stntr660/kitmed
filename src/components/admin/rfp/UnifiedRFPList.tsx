'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { validateIconComponent } from '@/lib/component-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RFPDrawer } from './RFPDrawer';
import { RFPQuickView } from './RFPQuickView';
import { AdminSearchFilters, AdminSearchResult } from '@/types/admin';
import { RFPRequest } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface RFPWithDetails extends RFPRequest {
  itemCount: number;
  totalQuantity: number;
  estimatedValue?: number;
}

interface UnifiedRFPListProps {
  initialFilters?: Partial<AdminSearchFilters>;
}

export function UnifiedRFPList({ initialFilters = {} }: UnifiedRFPListProps) {
  const t = useTranslations();
  
  // Data state
  const [rfpRequests, setRFPRequests] = useState<AdminSearchResult<RFPWithDetails> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRFPs, setSelectedRFPs] = useState<string[]>([]);
  
  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'respond' | 'manage'>('view');
  const [selectedRFP, setSelectedRFP] = useState<RFPWithDetails | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: '',
    status: [],
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  // Mock data - in real app this would come from API
  const mockRFPs: RFPWithDetails[] = [
    {
      id: '1',
      requestNumber: 'RFP-2024-0001',
      status: 'pending',
      company: {
        name: 'Regional Medical Center',
        type: 'hospital',
        address: {
          street: '123 Medical Drive',
          city: 'Casablanca',
          postalCode: '20000',
          country: 'Morocco',
        },
      },
      contact: {
        firstName: 'Dr. Ahmed',
        lastName: 'Benali',
        email: 'ahmed.benali@rmc.ma',
        phone: '+212 522 123 456',
        position: 'Chief Medical Officer',
      },
      urgency: 'high',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      items: [],
      itemCount: 3,
      totalQuantity: 5,
      estimatedValue: 15000,
    },
    {
      id: '2',
      requestNumber: 'RFP-2024-0002',
      status: 'processing',
      company: {
        name: 'City Health Clinic',
        type: 'clinic',
        address: {
          street: '456 Health Street',
          city: 'Rabat',
          postalCode: '10000',
          country: 'Morocco',
        },
      },
      contact: {
        firstName: 'Dr. Fatima',
        lastName: 'Alami',
        email: 'fatima.alami@chc.ma',
        phone: '+212 537 987 654',
        position: 'Director',
      },
      urgency: 'medium',
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-16'),
      items: [],
      itemCount: 2,
      totalQuantity: 8,
      estimatedValue: 8500,
    },
  ];

  useEffect(() => {
    loadRFPRequests();
  }, [filters]);

  const loadRFPRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data based on filters
      let filteredRFPs = mockRFPs;
      
      if (filters.query) {
        filteredRFPs = filteredRFPs.filter(rfp => 
          rfp.requestNumber.toLowerCase().includes(filters.query!.toLowerCase()) ||
          rfp.company.name.toLowerCase().includes(filters.query!.toLowerCase()) ||
          rfp.contact.firstName.toLowerCase().includes(filters.query!.toLowerCase()) ||
          rfp.contact.lastName.toLowerCase().includes(filters.query!.toLowerCase())
        );
      }
      
      if (filters.status && filters.status.length > 0) {
        filteredRFPs = filteredRFPs.filter(rfp => filters.status!.includes(rfp.status));
      }
      
      setRFPRequests({
        items: filteredRFPs,
        total: filteredRFPs.length,
        page: filters.page || 1,
        pageSize: filters.pageSize || 10,
        totalPages: Math.ceil(filteredRFPs.length / (filters.pageSize || 10)),
      });
    } catch (err) {
      console.error('Failed to load RFP requests:', err);
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  // Unified action handlers
  const handleViewRFP = (rfp: RFPWithDetails) => {
    setSelectedRFP(rfp);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleRespondRFP = (rfp: RFPWithDetails) => {
    setSelectedRFP(rfp);
    setDrawerMode('respond');
    setDrawerOpen(true);
  };

  const handleManageRFP = (rfp: RFPWithDetails) => {
    setSelectedRFP(rfp);
    setDrawerMode('manage');
    setDrawerOpen(true);
  };

  const handleQuickView = (rfp: RFPWithDetails) => {
    setSelectedRFP(rfp);
    setQuickViewOpen(true);
  };

  const handleRFPAction = async (action: string, data?: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, make API call based on action
      console.log('RFP Action:', action, data);
      
      // Reload data
      await loadRFPRequests();
    } catch (error) {
      console.error('RFP action failed:', error);
      throw error;
    }
  };

  // Filter handlers
  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status?.includes(status) 
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status],
      page: 1,
    }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleExport = async () => {
    try {
      // Simulate export
      console.log('Exporting RFP requests with filters:', filters);
      
      // In real app, make API call and download file
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Status helpers
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
        return 'secondary';
      case 'processing':
        return 'default';
      case 'responded':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading && !rfpRequests) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('navigation.rfp')}</h1>
        </div>
        <LoadingSpinner size="lg" text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.rfpRequests.title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('admin.rfpRequests.subtitle')}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>{t('admin.rfpRequests.export')}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200/60">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rfpRequests.statuses.pending')}</p>
                <p className="text-3xl font-semibold text-gray-900">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200/60">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ExclamationCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rfpRequests.statuses.processing')}</p>
                <p className="text-3xl font-semibold text-gray-900">15</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200/60">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rfpRequests.statuses.responded')}</p>
                <p className="text-3xl font-semibold text-gray-900">42</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200/60">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rfpRequests.statuses.closed')}</p>
                <p className="text-3xl font-semibold text-gray-900">128</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('common.searchPlaceholder')}
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              {['pending', 'processing', 'responded', 'closed'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status?.includes(status) ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(status)}
                  className="capitalize h-12 px-6"
                >
                  {t(`admin.rfpRequests.statuses.${status}`)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFP Requests Table */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadRFPRequests} variant="outline">
                {t('errors.tryAgain')}
              </Button>
            </div>
          ) : rfpRequests?.items && rfpRequests.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('requestNumber')}
                    >
                      {t('admin.rfpRequests.table.requestNumber')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.rfpRequests.table.customer')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      {t('admin.rfpRequests.table.status')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.rfpRequests.table.priority')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.rfpRequests.table.items')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.rfpRequests.table.estimatedValue')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('admin.rfpRequests.table.created')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.rfpRequests.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rfpRequests.items.map((rfp) => {
                    const StatusIcon = getStatusIcon(rfp.status);
                    return (
                      <tr key={rfp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-primary-100 rounded-xl flex items-center justify-center">
                              <StatusIcon className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {rfp.requestNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {rfp.company.name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {rfp.contact.firstName} {rfp.contact.lastName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {rfp.contact.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusColor(rfp.status)}>
                            {t(`admin.rfpRequests.statuses.${rfp.status}`)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getUrgencyColor(rfp.urgency)}>
                            {t(`admin.rfpRequests.urgency.${rfp.urgency}`)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <span className="font-medium">{rfp.itemCount}</span> {t(`admin.rfpRequests.items.${rfp.itemCount === 1 ? 'item' : 'items'}`)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rfp.totalQuantity} {t('admin.rfpRequests.items.totalQty')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {rfp.estimatedValue ? formatCurrency(rfp.estimatedValue) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(rfp.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickView(rfp)}
                              className="hover:bg-blue-50 hover:text-blue-700"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleManageRFP(rfp)}
                              className="hover:bg-amber-50 hover:text-amber-700"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRespondRFP(rfp)}
                              className="hover:bg-green-50 hover:text-green-700"
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.rfpRequests.noRequestsTitle')}</h3>
              <p className="text-gray-600 mb-6">{t('admin.rfpRequests.noRequestsDescription')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {rfpRequests && rfpRequests.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700 font-medium">
            {t('admin.rfpRequests.pagination.showing')} {((rfpRequests.page - 1) * rfpRequests.pageSize) + 1} {t('admin.rfpRequests.pagination.to')}{' '}
            {Math.min(rfpRequests.page * rfpRequests.pageSize, rfpRequests.total)} {t('admin.rfpRequests.pagination.of')}{' '}
            {rfpRequests.total} {t('admin.rfpRequests.pagination.results')}
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={rfpRequests.page === 1}
              onClick={() => handlePageChange(rfpRequests.page - 1)}
              className="h-10 px-4"
            >
              {t('common.previous')}
            </Button>
            
            {[...Array(Math.min(5, rfpRequests.totalPages))].map((_, i) => {
              const page = rfpRequests.page - 2 + i;
              if (page < 1 || page > rfpRequests.totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === rfpRequests.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="h-10 w-10"
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              disabled={rfpRequests.page === rfpRequests.totalPages}
              onClick={() => handlePageChange(rfpRequests.page + 1)}
              className="h-10 px-4"
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* RFP Drawer for View/Respond/Manage */}
      <RFPDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        rfp={selectedRFP}
        mode={drawerMode}
        onAction={handleRFPAction}
      />

      {/* Quick View Modal */}
      <RFPQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        rfp={selectedRFP}
        onEdit={() => {
          setQuickViewOpen(false);
          handleManageRFP(selectedRFP!);
        }}
        onRespond={() => {
          setQuickViewOpen(false);
          handleRespondRFP(selectedRFP!);
        }}
      />
    </div>
  );
}