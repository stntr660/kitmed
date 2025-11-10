'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  NewspaperIcon,
  GlobeAltIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { AdminSearchFilters, AdminSearchResult } from '@/types/admin';
import { formatDate, truncate } from '@/lib/utils';

// Content Management Types
export interface ContentItem {
  id: string;
  title: { fr: string; en?: string };
  content: { fr: string; en?: string };
  excerpt: { fr: string; en?: string };
  type: 'article' | 'news' | 'announcement' | 'page';
  status: 'draft' | 'review' | 'published' | 'archived';
  author: { name: string; id: string };
  publishDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  imageUrl?: string;
  metaTitle?: { fr: string; en?: string };
  metaDescription?: { fr: string; en?: string };
  featured?: boolean;
  slug: string;
}

interface ContentFormData {
  title: { fr: string; en: string };
  content: { fr: string; en: string };
  excerpt: { fr: string; en: string };
  type: 'article' | 'news' | 'announcement' | 'page';
  status: 'draft' | 'review' | 'published' | 'archived';
  publishDate?: string;
  tags: string[];
  imageUrl?: string;
  metaTitle: { fr: string; en: string };
  metaDescription: { fr: string; en: string };
  featured: boolean;
  slug: string;
}

interface UnifiedContentListProps {
  initialFilters?: Partial<AdminSearchFilters>;
}

export function ContentManagement({ initialFilters = {} }: UnifiedContentListProps) {
  const t = useTranslations();
  
  // Data state
  const [content, setContent] = useState<AdminSearchResult<ContentItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  
  // UI state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'fr' | 'en'>('fr');
  
  // Form state
  const [formData, setFormData] = useState<ContentFormData>({
    title: { fr: '', en: '' },
    content: { fr: '', en: '' },
    excerpt: { fr: '', en: '' },
    type: 'article',
    status: 'draft',
    tags: [],
    metaTitle: { fr: '', en: '' },
    metaDescription: { fr: '', en: '' },
    featured: false,
    slug: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: '',
    status: [],
    category: [],
    page: 1,
    pageSize: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  useEffect(() => {
    loadContent();
  }, [filters]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockData: AdminSearchResult<ContentItem> = {
        items: [
          {
            id: '1',
            title: { fr: 'Nouvelles technologies en cardiologie', en: 'New technologies in cardiology' },
            content: { fr: 'Contenu détaillé sur les nouvelles technologies...', en: 'Detailed content about new technologies...' },
            excerpt: { fr: 'Découvrez les dernières innovations...', en: 'Discover the latest innovations...' },
            type: 'article',
            status: 'published',
            author: { name: 'Dr. Martin Dubois', id: 'user1' },
            publishDate: new Date('2024-11-01'),
            createdAt: new Date('2024-10-25'),
            updatedAt: new Date('2024-11-01'),
            tags: ['cardiologie', 'innovation', 'technologie'],
            imageUrl: '/images/cardiology-tech.jpg',
            featured: true,
            slug: 'nouvelles-technologies-cardiologie',
          },
          {
            id: '2',
            title: { fr: 'Mise à jour importante du système', en: 'Important system update' },
            content: { fr: 'Nous effectuons une mise à jour...', en: 'We are performing an update...' },
            excerpt: { fr: 'Maintenance programmée ce weekend', en: 'Scheduled maintenance this weekend' },
            type: 'announcement',
            status: 'published',
            author: { name: 'Admin', id: 'admin1' },
            publishDate: new Date('2024-11-08'),
            createdAt: new Date('2024-11-07'),
            updatedAt: new Date('2024-11-08'),
            tags: ['système', 'maintenance'],
            slug: 'mise-a-jour-systeme',
          },
          {
            id: '3',
            title: { fr: 'Nouveau partenariat stratégique', en: 'New strategic partnership' },
            content: { fr: 'Nous sommes fiers d\'annoncer...', en: 'We are proud to announce...' },
            excerpt: { fr: 'Partenariat avec MedTech Solutions', en: 'Partnership with MedTech Solutions' },
            type: 'news',
            status: 'draft',
            author: { name: 'Sophie Laurent', id: 'user2' },
            createdAt: new Date('2024-11-09'),
            updatedAt: new Date('2024-11-09'),
            tags: ['partenariat', 'croissance'],
            slug: 'nouveau-partenariat-strategique',
          },
        ],
        total: 3,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        filters,
      };

      setContent(mockData);
    } catch (err) {
      setError(t('admin.content.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Sheet handlers
  const handleAddContent = () => {
    setSelectedItem(null);
    setSheetMode('add');
    setFormData({
      title: { fr: '', en: '' },
      content: { fr: '', en: '' },
      excerpt: { fr: '', en: '' },
      type: 'article',
      status: 'draft',
      tags: [],
      metaTitle: { fr: '', en: '' },
      metaDescription: { fr: '', en: '' },
      featured: false,
      slug: '',
    });
    setFormErrors({});
    setSheetOpen(true);
  };

  const handleEditContent = (item: ContentItem) => {
    setSelectedItem(item);
    setSheetMode('edit');
    setFormData({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      type: item.type,
      status: item.status,
      publishDate: item.publishDate?.toISOString().split('T')[0],
      tags: item.tags,
      imageUrl: item.imageUrl,
      metaTitle: item.metaTitle || { fr: '', en: '' },
      metaDescription: item.metaDescription || { fr: '', en: '' },
      featured: item.featured || false,
      slug: item.slug,
    });
    setFormErrors({});
    setSheetOpen(true);
  };

  const handleViewContent = (item: ContentItem) => {
    setSelectedItem(item);
    setSheetMode('view');
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedItem(null);
    setFormErrors({});
  };

  // Form handlers
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.fr.trim()) {
      errors['title.fr'] = t('admin.content.validation.titleFrRequired');
    }
    if (!formData.content.fr.trim()) {
      errors['content.fr'] = t('admin.content.validation.contentFrRequired');
    }
    if (!formData.excerpt.fr.trim()) {
      errors['excerpt.fr'] = t('admin.content.validation.excerptFrRequired');
    }
    if (!formData.slug.trim()) {
      errors.slug = t('admin.content.validation.slugRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveContent = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadContent();
      handleCloseSheet();
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm(t('admin.content.confirmDelete'))) return;

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadContent();
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  // Filter handlers
  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  const handleTypeFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category?.includes(type) 
        ? prev.category.filter(t => t !== type)
        : [...(prev.category || []), type],
      page: 1,
    }));
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

  // Selection handlers
  const handleSelectContent = (contentId: string) => {
    setSelectedContent(prev =>
      prev.includes(contentId)
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleSelectAll = () => {
    if (!content) return;
    
    const allSelected = content.items.every(item => 
      selectedContent.includes(item.id)
    );
    
    if (allSelected) {
      setSelectedContent([]);
    } else {
      setSelectedContent(content.items.map(item => item.id));
    }
  };

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedContent.length === 0) return;

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadContent();
      setSelectedContent([]);
    } catch (err) {
      console.error(`Failed to ${action} content:`, err);
    }
  };

  // Utility functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'news':
        return <NewspaperIcon className="h-4 w-4" />;
      case 'announcement':
        return <MegaphoneIcon className="h-4 w-4" />;
      case 'page':
        return <GlobeAltIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'review':
        return 'outline';
      case 'archived':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon className="h-3 w-3" />;
      case 'draft':
        return <ClockIcon className="h-3 w-3" />;
      case 'review':
        return <ExclamationTriangleIcon className="h-3 w-3" />;
      case 'archived':
        return <ArchiveBoxIcon className="h-3 w-3" />;
      default:
        return <ClockIcon className="h-3 w-3" />;
    }
  };

  if (loading && !content) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.content.title')}</h1>
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
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.content.title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('admin.content.description')}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>{t('common.export')}</span>
          </Button>
          <Button
            onClick={handleAddContent}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            <span>{t('admin.content.addContent')}</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('admin.content.searchPlaceholder')}
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Content Type Filters */}
              <div className="flex gap-2">
                {['article', 'news', 'announcement', 'page'].map((type) => (
                  <Button
                    key={type}
                    variant={filters.category?.includes(type) ? 'default' : 'outline'}
                    onClick={() => handleTypeFilter(type)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {getTypeIcon(type)}
                    {t(`admin.content.types.${type}`)}
                  </Button>
                ))}
              </div>
              
              {/* Status Filters */}
              <div className="flex gap-2">
                {['draft', 'review', 'published', 'archived'].map((status) => (
                  <Button
                    key={status}
                    variant={filters.status?.includes(status) ? 'default' : 'outline'}
                    onClick={() => handleStatusFilter(status)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {getStatusIcon(status)}
                    {t(`admin.content.status.${status}`)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedContent.length > 0 && (
            <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-700">
                  {selectedContent.length} {selectedContent.length === 1 ? t('admin.content.itemSelected') : t('admin.content.itemsSelected')}
                </span>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('publish')}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {t('admin.content.publish')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('archive')}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {t('admin.content.archive')}
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

      {/* Content Table */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadContent} variant="outline">
                {t('errors.tryAgain')}
              </Button>
            </div>
          ) : content?.items && content.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={content.items.every(item => 
                          selectedContent.includes(item.id)
                        )}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 h-5 w-5"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.content.content')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.content.type')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.content.status')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.content.author')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.content.updated')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {content.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedContent.includes(item.id)}
                          onChange={() => handleSelectContent(item.id)}
                          className="rounded border-gray-300 h-5 w-5"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-4">
                          {item.imageUrl && (
                            <div className="h-12 w-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.title.fr}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {truncate(item.title.fr, 50)}
                            </div>
                            {item.excerpt?.fr && (
                              <div className="text-sm text-gray-600 mt-1">
                                {truncate(item.excerpt.fr, 80)}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {item.featured && (
                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                  {t('admin.content.featured')}
                                </Badge>
                              )}
                              {item.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 2 && (
                                <span className="text-xs text-gray-400">
                                  +{item.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getTypeIcon(item.type)}
                          {t(`admin.content.types.${item.type}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(item.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(item.status)}
                          {t(`admin.content.status.${item.status}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.author.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewContent(item)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditContent(item)}
                            className="hover:bg-amber-50 hover:text-amber-700"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteContent(item.id)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.content.noContent')}</h3>
              <p className="text-gray-600 mb-6">{t('admin.content.getStarted')}</p>
              <Button onClick={handleAddContent} className="bg-primary-600 hover:bg-primary-700">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('admin.content.addFirstContent')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Sheet for Add/Edit/View */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {sheetMode === 'add' && t('admin.content.addContent')}
              {sheetMode === 'edit' && t('admin.content.editContent')}
              {sheetMode === 'view' && t('admin.content.viewContent')}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === 'add' && t('admin.content.addDescription')}
              {sheetMode === 'edit' && t('admin.content.editDescription')}
              {sheetMode === 'view' && t('admin.content.viewDescription')}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {sheetMode === 'view' && selectedItem ? (
              // View Mode
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedItem.title.fr}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant={getStatusColor(selectedItem.status)} className="flex items-center gap-1">
                        {getStatusIcon(selectedItem.status)}
                        {t(`admin.content.status.${selectedItem.status}`)}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getTypeIcon(selectedItem.type)}
                        {t(`admin.content.types.${selectedItem.type}`)}
                      </Badge>
                      {selectedItem.featured && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                          {t('admin.content.featured')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleEditContent(selectedItem)}
                    className="flex items-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    {t('common.edit')}
                  </Button>
                </div>

                {selectedItem.imageUrl && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title.fr}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.content.excerpt')}</h3>
                    <p className="text-sm text-gray-900">{selectedItem.excerpt?.fr}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.content.author')}</h3>
                    <p className="text-sm text-gray-900">{selectedItem.author.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.content.publishDate')}</h3>
                    <p className="text-sm text-gray-900">
                      {selectedItem.publishDate ? formatDate(selectedItem.publishDate) : '—'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.content.updated')}</h3>
                    <p className="text-sm text-gray-900">{formatDate(selectedItem.updatedAt)}</p>
                  </div>
                </div>

                {selectedItem.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.content.tags')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.content.content')}</h3>
                  <div className="prose max-w-none text-sm text-gray-900">
                    {selectedItem.content.fr}
                  </div>
                </div>
              </div>
            ) : (
              // Add/Edit Mode
              <form onSubmit={(e) => { e.preventDefault(); handleSaveContent(); }} className="space-y-6">
                {/* Language Switch */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() => setCurrentLanguage('fr')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      currentLanguage === 'fr'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Français
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentLanguage('en')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      currentLanguage === 'en'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    English
                  </button>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('admin.content.basicInfo')}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.content.type')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="article">{t('admin.content.types.article')}</option>
                        <option value="news">{t('admin.content.types.news')}</option>
                        <option value="announcement">{t('admin.content.types.announcement')}</option>
                        <option value="page">{t('admin.content.types.page')}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.content.status')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="draft">{t('admin.content.status.draft')}</option>
                        <option value="review">{t('admin.content.status.review')}</option>
                        <option value="published">{t('admin.content.status.published')}</option>
                        <option value="archived">{t('admin.content.status.archived')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Input
                      label={`${t('admin.content.title')} (${currentLanguage === 'fr' ? 'Français' : 'English'})`}
                      value={formData.title[currentLanguage]}
                      onChange={(e) => setFormData({
                        ...formData,
                        title: { ...formData.title, [currentLanguage]: e.target.value }
                      })}
                      required={currentLanguage === 'fr'}
                      error={!!formErrors['title.fr'] && currentLanguage === 'fr'}
                      helperText={formErrors['title.fr'] && currentLanguage === 'fr' ? formErrors['title.fr'] : undefined}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Input
                      label={t('admin.content.slug')}
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      error={!!formErrors.slug}
                      helperText={formErrors.slug || t('admin.content.slugHelp')}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Textarea
                      label={`${t('admin.content.excerpt')} (${currentLanguage === 'fr' ? 'Français' : 'English'})`}
                      value={formData.excerpt[currentLanguage]}
                      onChange={(e) => setFormData({
                        ...formData,
                        excerpt: { ...formData.excerpt, [currentLanguage]: e.target.value }
                      })}
                      required={currentLanguage === 'fr'}
                      error={!!formErrors['excerpt.fr'] && currentLanguage === 'fr'}
                      helperText={formErrors['excerpt.fr'] && currentLanguage === 'fr' ? formErrors['excerpt.fr'] : undefined}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Textarea
                      label={`${t('admin.content.content')} (${currentLanguage === 'fr' ? 'Français' : 'English'})`}
                      value={formData.content[currentLanguage]}
                      onChange={(e) => setFormData({
                        ...formData,
                        content: { ...formData.content, [currentLanguage]: e.target.value }
                      })}
                      required={currentLanguage === 'fr'}
                      error={!!formErrors['content.fr'] && currentLanguage === 'fr'}
                      helperText={formErrors['content.fr'] && currentLanguage === 'fr' ? formErrors['content.fr'] : undefined}
                      rows={10}
                    />
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('admin.content.additionalOptions')}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label={t('admin.content.publishDate')}
                        type="date"
                        value={formData.publishDate || ''}
                        onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    
                    <div>
                      <Input
                        label={t('admin.content.imageUrl')}
                        value={formData.imageUrl || ''}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700">
                      {t('admin.content.featured')}
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseSheet}
                    disabled={saving}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {saving ? t('admin.content.saving') : t('common.save')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}