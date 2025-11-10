'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Calendar,
  Filter,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Tag,
  FileText,
  Image,
  Clock,
  User,
  ChevronDown,
  ArrowUpDown,
  MoreHorizontal,
  Settings,
  RefreshCw,
  Download,
  Upload,
  BookOpen,
  Star,
  Copy,
  ExternalLink
} from 'lucide-react';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [sheetMode, setSheetMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<ContentFormData>({
    title: { fr: '', en: '' },
    content: { fr: '', en: '' },
    excerpt: { fr: '', en: '' },
    type: 'article',
    status: 'draft',
    publishDate: undefined,
    tags: [],
    imageUrl: '',
    metaTitle: { fr: '', en: '' },
    metaDescription: { fr: '', en: '' },
    featured: false,
    slug: '',
  });

  // Filter state
  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: initialFilters.query || '',
    type: initialFilters.type || '',
    status: initialFilters.status || [],
    tags: initialFilters.tags || [],
    page: 1,
    pageSize: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Load content data
  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const searchParams = new URLSearchParams();
      if (filters.query) searchParams.append('query', filters.query);
      if (filters.type) searchParams.append('type', filters.type);
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => searchParams.append('status', status));
      }
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => searchParams.append('tags', tag));
      }
      searchParams.append('page', filters.page.toString());
      searchParams.append('pageSize', filters.pageSize.toString());
      searchParams.append('sortBy', filters.sortBy);
      searchParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/admin/content?${searchParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `Failed to fetch content (${response.status})`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch content');
      }

      setContent(data.data);
    } catch (error) {
      console.error('Content loading error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content');
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and filter changes
  useEffect(() => {
    loadContent();
  }, [filters]);

  // Handle search
  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof AdminSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle sort
  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setFilters(prev => ({ ...prev, pageSize, page: 1 }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      query: '',
      type: '',
      status: [],
      tags: [],
      page: 1,
      pageSize: 10,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  // Handle creating new content
  const handleCreateContent = () => {
    setSelectedItem(null);
    setSheetMode('create');
    setFormData({
      title: { fr: '', en: '' },
      content: { fr: '', en: '' },
      excerpt: { fr: '', en: '' },
      type: 'article',
      status: 'draft',
      publishDate: undefined,
      tags: [],
      imageUrl: '',
      metaTitle: { fr: '', en: '' },
      metaDescription: { fr: '', en: '' },
      featured: false,
      slug: '',
    });
    setFormErrors({});
    setSheetOpen(true);
  };

  // Handle editing content
  const handleEditContent = (item: ContentItem) => {
    setSelectedItem(item);
    setSheetMode('edit');
    setFormData({
      title: { 
        fr: item.title.fr, 
        en: item.title.en || '' 
      },
      content: { 
        fr: item.content.fr, 
        en: item.content.en || '' 
      },
      excerpt: { 
        fr: item.excerpt.fr, 
        en: item.excerpt.en || '' 
      },
      type: item.type,
      status: item.status,
      publishDate: item.publishDate?.toISOString().split('T')[0],
      tags: item.tags,
      imageUrl: item.imageUrl,
      metaTitle: { 
        fr: item.metaTitle?.fr || '', 
        en: item.metaTitle?.en || '' 
      },
      metaDescription: { 
        fr: item.metaDescription?.fr || '', 
        en: item.metaDescription?.en || '' 
      },
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
    setFormData({
      title: { fr: '', en: '' },
      content: { fr: '', en: '' },
      excerpt: { fr: '', en: '' },
      type: 'article',
      status: 'draft',
      publishDate: undefined,
      tags: [],
      imageUrl: '',
      metaTitle: { fr: '', en: '' },
      metaDescription: { fr: '', en: '' },
      featured: false,
      slug: '',
    });
    setFormErrors({});
  };

  // Delete content
  const handleDeleteContent = async (id: string) => {
    if (!confirm(t('admin.content.confirmDelete'))) return;

    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || 'Failed to delete content');
      }

      // Reload data
      await loadContent();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete content');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedContent.length === 0) return;
    if (!confirm(t('admin.content.confirmBulkDelete', { count: selectedContent.length }))) return;

    try {
      const deletePromises = selectedContent.map(id =>
        fetch(`/api/admin/content/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await Promise.all(deletePromises);
      setSelectedContent([]);
      await loadContent();
    } catch (error) {
      console.error('Bulk delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete content items');
    }
  };

  // Export data
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export content data');
  };

  // Import data
  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import content data');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const method = sheetMode === 'create' ? 'POST' : 'PUT';
      const url = sheetMode === 'create' 
        ? '/api/admin/content'
        : `/api/admin/content/${selectedItem?.id}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error?.details && Array.isArray(errorData.error.details)) {
          const fieldErrors: Record<string, string> = {};
          errorData.error.details.forEach((detail: any) => {
            if (detail.path && detail.message) {
              fieldErrors[detail.path.join('.')] = detail.message;
            }
          });
          setFormErrors(fieldErrors);
        }
        throw new Error(errorData?.error?.message || 'Failed to save content');
      }

      await loadContent();
      handleCloseSheet();
    } catch (error) {
      console.error('Submit error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save content');
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'review': return 'secondary';
      case 'archived': return 'destructive';
      default: return 'secondary';
    }
  };

  // Get type badge variant
  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case 'article': return 'default';
      case 'news': return 'secondary';
      case 'announcement': return 'outline';
      case 'page': return 'outline';
      default: return 'default';
    }
  };

  if (loading && !content) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.content.title')}</h1>
          <p className="text-muted-foreground">
            {t('admin.content.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            {t('admin.actions.import')}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('admin.actions.export')}
          </Button>
          <Button onClick={handleCreateContent}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.content.createContent')}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('admin.content.searchPlaceholder')}
                  value={filters.query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('admin.content.filterType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.content.allTypes')}</SelectItem>
                <SelectItem value="article">{t('admin.content.types.article')}</SelectItem>
                <SelectItem value="news">{t('admin.content.types.news')}</SelectItem>
                <SelectItem value="announcement">{t('admin.content.types.announcement')}</SelectItem>
                <SelectItem value="page">{t('admin.content.types.page')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status?.[0] || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? [] : [value])}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('admin.content.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.content.allStatuses')}</SelectItem>
                <SelectItem value="draft">{t('admin.content.statuses.draft')}</SelectItem>
                <SelectItem value="review">{t('admin.content.statuses.review')}</SelectItem>
                <SelectItem value="published">{t('admin.content.statuses.published')}</SelectItem>
                <SelectItem value="archived">{t('admin.content.statuses.archived')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            <Button variant="outline" onClick={resetFilters}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('admin.actions.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <ExternalLink className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {content && (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t('admin.common.showingResults', {
                from: (content.page - 1) * content.pageSize + 1,
                to: Math.min(content.page * content.pageSize, content.total),
                total: content.total,
              })}
            </div>
            
            {selectedContent.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('admin.common.selectedItems', { count: selectedContent.length })}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('admin.actions.deleteSelected')}
                </Button>
              </div>
            )}

            <Select
              value={content.pageSize.toString()}
              onValueChange={(value) => handlePageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 {t('admin.common.perPage')}</SelectItem>
                <SelectItem value="10">10 {t('admin.common.perPage')}</SelectItem>
                <SelectItem value="25">25 {t('admin.common.perPage')}</SelectItem>
                <SelectItem value="50">50 {t('admin.common.perPage')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Grid */}
          <div className="grid gap-4">
            {content.items.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedContent.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContent([...selectedContent, item.id]);
                            } else {
                              setSelectedContent(selectedContent.filter(id => id !== item.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={getTypeBadgeVariant(item.type)}>
                            {t(`admin.content.types.${item.type}`)}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {t(`admin.content.statuses.${item.status}`)}
                          </Badge>
                          {item.featured && (
                            <Badge variant="outline">
                              <Star className="h-3 w-3 mr-1" />
                              {t('admin.content.featured')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        {item.imageUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {item.title.fr}
                          </h3>
                          {item.title.en && (
                            <p className="text-sm text-muted-foreground mb-2 truncate">
                              {item.title.en}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {truncate(item.excerpt.fr, 120)}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.author.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.updatedAt)}
                            </div>
                            {item.publishDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.publishDate)}
                              </div>
                            )}
                          </div>
                          
                          {item.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Tag className="h-3 w-3 text-muted-foreground" />
                              <div className="flex gap-1 flex-wrap">
                                {item.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewContent(item)}
                        title={t('admin.actions.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditContent(item)}
                        title={t('admin.actions.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContent(item.id)}
                        title={t('admin.actions.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {content.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={content.page === 1}
                onClick={() => handlePageChange(content.page - 1)}
              >
                {t('admin.pagination.previous')}
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(content.totalPages, 5))].map((_, i) => {
                  const pageNumber = content.totalPages <= 5 
                    ? i + 1
                    : Math.max(1, content.page - 2) + i;
                  
                  if (pageNumber > content.totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={content.page === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                disabled={content.page === content.totalPages}
                onClick={() => handlePageChange(content.page + 1)}
              >
                {t('admin.pagination.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {content && content.items.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('admin.content.noContentFound')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filters.query || filters.type || (filters.status && filters.status.length > 0)
                ? t('admin.content.noContentMatchingFilters')
                : t('admin.content.noContentCreated')
              }
            </p>
            {!filters.query && !filters.type && (!filters.status || filters.status.length === 0) && (
              <Button onClick={handleCreateContent}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.content.createFirstContent')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content Sheet - Form for create/edit */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-lg font-semibold">
                    {sheetMode === 'create' && t('admin.content.createContent')}
                    {sheetMode === 'edit' && t('admin.content.editContent')}
                    {sheetMode === 'view' && t('admin.content.viewContent')}
                  </h2>
                  {selectedItem && (
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.title.fr}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseSheet}>
                  ×
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {sheetMode === 'view' && selectedItem ? (
                  // View mode
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">{selectedItem.title.fr}</h3>
                      {selectedItem.title.en && (
                        <p className="text-lg text-muted-foreground mb-4">{selectedItem.title.en}</p>
                      )}
                      
                      <div className="flex gap-2 mb-4">
                        <Badge variant={getTypeBadgeVariant(selectedItem.type)}>
                          {t(`admin.content.types.${selectedItem.type}`)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(selectedItem.status)}>
                          {t(`admin.content.statuses.${selectedItem.status}`)}
                        </Badge>
                        {selectedItem.featured && (
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {t('admin.content.featured')}
                          </Badge>
                        )}
                      </div>

                      {selectedItem.imageUrl && (
                        <img
                          src={selectedItem.imageUrl}
                          alt=""
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}

                      <div className="prose prose-sm max-w-none">
                        <h4>Excerpt (French)</h4>
                        <p>{selectedItem.excerpt.fr}</p>
                        
                        {selectedItem.excerpt.en && (
                          <>
                            <h4>Excerpt (English)</h4>
                            <p>{selectedItem.excerpt.en}</p>
                          </>
                        )}

                        <h4>Content (French)</h4>
                        <div dangerouslySetInnerHTML={{ __html: selectedItem.content.fr }} />
                        
                        {selectedItem.content.en && (
                          <>
                            <h4>Content (English)</h4>
                            <div dangerouslySetInnerHTML={{ __html: selectedItem.content.en }} />
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                        <div>
                          <span className="font-medium">Author:</span> {selectedItem.author.name}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(selectedItem.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span> {formatDate(selectedItem.updatedAt)}
                        </div>
                        {selectedItem.publishDate && (
                          <div>
                            <span className="font-medium">Published:</span> {formatDate(selectedItem.publishDate)}
                          </div>
                        )}
                      </div>

                      {selectedItem.tags.length > 0 && (
                        <div className="mt-4">
                          <span className="font-medium text-sm">Tags:</span>
                          <div className="flex gap-1 mt-2">
                            {selectedItem.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Create/Edit form
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Form content would go here */}
                    <div className="text-center py-12 text-muted-foreground">
                      Form implementation placeholder
                    </div>
                  </form>
                )}
              </div>

              {sheetMode !== 'view' && (
                <div className="border-t p-6">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseSheet}>
                      {t('admin.actions.cancel')}
                    </Button>
                    <Button type="submit" form="content-form">
                      {sheetMode === 'create' ? t('admin.actions.create') : t('admin.actions.save')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Missing import type
interface AdminSearchFilters {
  query?: string;
  type?: string;
  status?: string[];
  tags?: string[];
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdminSearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: AdminSearchFilters;
}