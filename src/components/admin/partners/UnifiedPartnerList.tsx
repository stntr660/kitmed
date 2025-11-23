'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PartnerCreationWizard } from './PartnerCreationWizard';
import { PartnerQuickView } from './PartnerQuickView';
import { CSVUpload } from './CSVUpload';
import { AdminSearchFilters, AdminSearchResult } from '@/types/admin';
import { Partner } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { ClientOnly } from '@/components/ui/client-only';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { getAdminToken } from '@/lib/auth-utils';

interface PartnerWithDetails extends Partner {
  name: string; // Computed field for compatibility
}

interface UnifiedPartnerListProps {
  initialFilters?: Partial<AdminSearchFilters>;
}

export function UnifiedPartnerList({ initialFilters = {} }: UnifiedPartnerListProps) {
  const t = useTranslations();
  const { canCreate, canUpdate, canDelete, isAdmin } = useAdminPermissions();
  
  // Data state
  const [partners, setPartners] = useState<AdminSearchResult<PartnerWithDetails> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  
  // UI state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<'add' | 'edit'>('add');
  const [selectedPartner, setSelectedPartner] = useState<PartnerWithDetails | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: '',
    status: [],
    category: [],
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  useEffect(() => {
    loadPartners();
  }, [filters]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/admin/partners?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPartners(data.data);
      } else {
        throw new Error(t('admin.partners.failedToLoad'));
      }
    } catch (err) {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  // Unified action handlers
  const handleAddPartner = () => {
    setSelectedPartner(null);
    setWizardMode('add');
    setWizardOpen(true);
  };

  const handleEditPartner = (partner: PartnerWithDetails) => {
    setSelectedPartner(partner);
    setWizardMode('edit');
    setWizardOpen(true);
  };

  const handleQuickView = (partner: PartnerWithDetails) => {
    setSelectedPartner(partner);
    setQuickViewOpen(true);
  };

  const handleImportComplete = (result: any) => {
    if (result.success && result.imported > 0) {
      loadPartners(); // Reload the partners list
      setCsvUploadOpen(false);
    }
  };

  const handleSavePartner = async (partnerData: Partial<Partner>) => {
    try {
      const url = wizardMode === 'add' 
        ? '/api/admin/partners' 
        : `/api/admin/partners/${selectedPartner?.id}`;
      
      const method = wizardMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify(partnerData),
      });

      if (response.ok) {
        await loadPartners();
        setWizardOpen(false);
        setSelectedPartner(null);
      } else {
        throw new Error(t('admin.partners.failedToSave'));
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!confirm(t('common.confirm') + ' ' + t('common.delete') + '?')) return;

    try {
      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`,
        },
      });

      if (response.ok) {
        await loadPartners();
      }
    } catch (error) {
      // Handle error silently
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

  // Selection handlers
  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartners(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const handleSelectAll = () => {
    if (!partners) return;
    
    const allSelected = partners.items.every(partner => 
      selectedPartners.includes(partner.id)
    );
    
    if (allSelected) {
      setSelectedPartners([]);
    } else {
      setSelectedPartners(partners.items.map(partner => partner.id));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'feature' | 'unfeature') => {
    if (selectedPartners.length === 0) return;

    try {
      const response = await fetch('/api/admin/partners/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          action,
          partnerIds: selectedPartners,
        }),
      });

      if (response.ok) {
        await loadPartners();
        setSelectedPartners([]);
      }
    } catch (err) {
      // Handle bulk action error silently
    }
  };

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

  if (loading && !partners) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.sidebar.partners')}</h1>
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
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.sidebar.partners')}</h1>
          <p className="mt-2 text-gray-600">
            {t('admin.partners.manageDescription')}
          </p>
        </div>
        <div className="flex space-x-3">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setCsvUploadOpen(true)}
              className="flex items-center space-x-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>{t('admin.partners.importCsv')}</span>
            </Button>
          )}
          {canCreate('partners') && (
            <Button
              onClick={handleAddPartner}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('common.add')} {t('admin.sidebar.partners')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('admin.partners.searchPlaceholder')}
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              {['active', 'inactive'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status?.includes(status) ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(status)}
                  className="capitalize h-12 px-6"
                >
                  {t(`admin.partners.status.${status}`, { defaultValue: status })}
                </Button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedPartners.length > 0 && isAdmin && (
            <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-700">
                  {selectedPartners.length} {selectedPartners.length === 1 ? t('admin.partners.partnerSelected') : t('admin.partners.partnersSelected')}
                </span>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {t('admin.activate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {t('admin.deactivate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('feature')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    {t('admin.partners.feature')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadPartners} variant="outline">
                {t('errors.tryAgain')}
              </Button>
            </div>
          ) : partners?.items && partners.items.length > 0 ? (
            <ClientOnly fallback={<div className="p-8 text-center"><LoadingSpinner /></div>}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {isAdmin && (
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={partners.items.every(partner => 
                            selectedPartners.includes(partner.id)
                          )}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 h-5 w-5"
                        />
                      </th>
                    )}
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      {t('admin.partners.partner')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.partners.website')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      {t('admin.status')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('admin.created')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {partners.items.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPartners.includes(partner.id)}
                            onChange={() => handleSelectPartner(partner.id)}
                            className="rounded border-gray-300 h-5 w-5"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
                            {partner.logoUrl ? (
                              <img
                                src={partner.logoUrl}
                                alt={partner.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {truncate(partner.name, 50)}
                            </div>
                            {partner.description?.fr && (
                              <div className="text-sm text-gray-600 mt-1">
                                {truncate(partner.description.fr, 70)}
                              </div>
                            )}
                            {partner.featured && (
                              <Badge variant="outline" className="mt-1 text-amber-600 border-amber-200 bg-amber-50">
                                {t('admin.featured')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {partner.websiteUrl ? (
                          <a
                            href={partner.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <GlobeAltIcon className="h-4 w-4 mr-1" />
                            {partner.websiteUrl.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(partner.status)}>
                          {t(`admin.partners.status.${partner.status}`, { defaultValue: partner.status })}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <ClientOnly fallback={t('common.loading')}>
                          {formatDate(partner.createdAt)}
                        </ClientOnly>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickView(partner)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {canUpdate('partners') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditPartner(partner)}
                              className="hover:bg-amber-50 hover:text-amber-700"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete('partners') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePartner(partner.id)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </ClientOnly>
          ) : (
            <div className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('search.noResults')}</h3>
              <p className="text-gray-600 mb-6">{t('admin.partners.getStarted')}</p>
              <Button onClick={handleAddPartner} className="bg-primary-600 hover:bg-primary-700">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('admin.partners.addFirst')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {partners && partners.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700 font-medium">
            {t('search.showingResults', {
              start: ((partners.page - 1) * partners.pageSize) + 1,
              end: Math.min(partners.page * partners.pageSize, partners.total),
              total: partners.total
            })}
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={partners.page === 1}
              onClick={() => handlePageChange(partners.page - 1)}
              className="h-10 px-4"
            >
              {t('common.previous')}
            </Button>
            
            {[...Array(Math.min(5, partners.totalPages))].map((_, i) => {
              const page = partners.page - 2 + i;
              if (page < 1 || page > partners.totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === partners.page ? 'default' : 'outline'}
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
              disabled={partners.page === partners.totalPages}
              onClick={() => handlePageChange(partners.page + 1)}
              className="h-10 px-4"
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Partner Creation Wizard for Add/Edit */}
      <PartnerCreationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        partner={selectedPartner}
        mode={wizardMode}
        onSave={handleSavePartner}
      />

      {/* Quick View Modal */}
      <PartnerQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        partner={selectedPartner}
        onEdit={() => {
          setQuickViewOpen(false);
          handleEditPartner(selectedPartner!);
        }}
      />

      {/* CSV Upload Modal */}
      {csvUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{t('admin.partners.bulkImport.title')}</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setCsvUploadOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <CSVUpload onImportComplete={handleImportComplete} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}