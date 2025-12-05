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

  // Statistics state
  const [stats, setStats] = useState({
    pending: 0,
    reviewing: 0,
    quoted: 0,
    completed: 0,
  });

  const loadStatistics = async () => {
    try {
      // Fetch statistics for all statuses
      const responses = await Promise.all([
        fetch('/api/admin/rfp-requests?status=pending&pageSize=1'),
        fetch('/api/admin/rfp-requests?status=reviewing&pageSize=1'),
        fetch('/api/admin/rfp-requests?status=quoted&pageSize=1'),
        fetch('/api/admin/rfp-requests?status=completed&pageSize=1'),
      ]);

      const [pendingRes, reviewingRes, quotedRes, completedRes] = responses;

      if (responses.every(res => res.ok)) {
        const [pendingData, reviewingData, quotedData, completedData] = await Promise.all(
          responses.map(res => res.json())
        );

        setStats({
          pending: pendingData.success ? pendingData.data.total : 0,
          reviewing: reviewingData.success ? reviewingData.data.total : 0,
          quoted: quotedData.success ? quotedData.data.total : 0,
          completed: completedData.success ? completedData.data.total : 0,
        });
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Keep existing stats if fetch fails
    }
  };

  useEffect(() => {
    loadRFPRequests();
  }, [filters]);

  const loadRFPRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: (filters.page || 1).toString(),
        pageSize: (filters.pageSize || 10).toString(),
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc',
      });

      if (filters.query) {
        params.append('search', filters.query);
      }

      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => {
          params.append('status', status);
        });
      }

      // Fetch RFP requests
      const response = await fetch(`/api/rfp-requests?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load RFP requests');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load RFP requests');
      }

      // Transform data to match expected format
      const transformedItems = result.data.items.map((item: any) => ({
        id: item.id,
        referenceNumber: item.referenceNumber,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        customerPhone: item.customerPhone,
        companyName: item.companyName,
        companyAddress: item.companyAddress,
        contactPerson: item.contactPerson,
        message: item.message,
        status: item.status,
        urgencyLevel: item.urgencyLevel,
        preferredContactMethod: item.preferredContactMethod,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        itemCount: item.items?.length || 0,
        totalQuantity: item.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
        estimatedValue: item.quoteAmount,
        items: item.items || [],
      }));

      setRFPRequests({
        items: transformedItems,
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize,
        totalPages: result.data.totalPages,
      });

      // Calculate statistics
      await loadStatistics();

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
      if (!selectedRFP) return;

      let endpoint = '';
      let method = 'PUT';
      let body: any = {};

      switch (action) {
        case 'update-status':
          endpoint = `/api/rfp-requests/${selectedRFP.id}`;
          body = { status: data.status };
          break;
        case 'add-quote':
          endpoint = `/api/rfp-requests/${selectedRFP.id}`;
          body = {
            status: 'quoted',
            quoteAmount: data.amount,
            quoteValidUntil: data.validUntil
          };
          break;
        case 'update-notes':
          endpoint = `/api/rfp-requests/${selectedRFP.id}`;
          body = { notes: data.notes };
          break;
        case 'delete':
          endpoint = `/api/rfp-requests/${selectedRFP.id}`;
          method = 'DELETE';
          break;
        default:

          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

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
      case 'reviewing':
        IconComponent = ExclamationCircleIcon;
        break;
      case 'quoted':
      case 'completed':
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
      case 'reviewing':
        return 'default';
      case 'quoted':
        return 'default';
      case 'completed':
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
                <p className="text-3xl font-semibold text-gray-900">{stats.pending}</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rfpRequests.statuses.reviewing')}</p>
                <p className="text-3xl font-semibold text-gray-900">{stats.reviewing}</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rfpRequests.statuses.quoted')}</p>
                <p className="text-3xl font-semibold text-gray-900">{stats.quoted}</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rfpRequests.statuses.completed')}</p>
                <p className="text-3xl font-semibold text-gray-900">{stats.completed}</p>
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
              {['pending', 'reviewing', 'quoted', 'completed'].map((status) => (
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
                                {rfp.referenceNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {rfp.companyName || rfp.customerName}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {rfp.customerName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {rfp.customerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusColor(rfp.status)}>
                            {t(`admin.rfpRequests.statuses.${rfp.status}`)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getUrgencyColor(rfp.urgencyLevel)}>
                            {t(`admin.rfpRequests.urgency.${rfp.urgencyLevel}`)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <span className="font-medium">{rfp.itemCount}</span> {rfp.itemCount === 1 ? t('admin.rfpRequests.items.item') : t('admin.rfpRequests.items.items')}
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
                              title={t('admin.rfpRequests.table.actions')}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleManageRFP(rfp)}
                              className="hover:bg-green-50 hover:text-green-700"
                              title={t('admin.rfpRequests.drawer.titles.manage')}
                            >
                              <PencilIcon className="h-4 w-4" />
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
      />
    </div>
  );
}