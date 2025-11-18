'use client';

import { useState, useEffect, ReactNode } from 'react';
import { X, Eye, Edit, Trash2, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AdminSearchFilters, AdminSearchResult } from '@/types/admin';

// Generic types for CRUD operations
export interface CRUDItem {
  id: string;
  [key: string]: any;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => ReactNode;
  width?: string;
}

export interface CRUDConfig<T> {
  // Resource configuration
  entityName: string;
  entityNamePlural: string;
  apiEndpoint: string;
  
  // Table configuration
  columns: TableColumn<T>[];
  
  // Component renderers
  renderForm: (item: T | null, onSave: (item: T) => void, onCancel: () => void) => ReactNode;
  renderDetails: (item: T) => ReactNode;
  
  // Optional customizations
  getStatusColor?: (status: string) => string;
  getRowActions?: (item: T) => Array<{
    icon: ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
}

interface AdminCRUDViewProps<T extends CRUDItem> {
  config: CRUDConfig<T>;
  initialFilters?: Partial<AdminSearchFilters>;
  headerActions?: ReactNode;
}

export function AdminCRUDView<T extends CRUDItem>({ 
  config, 
  initialFilters = {},
  headerActions 
}: AdminCRUDViewProps<T>) {
  // State management
  const [items, setItems] = useState<AdminSearchResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  
  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: '',
    status: [],
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  useEffect(() => {
    loadItems();
  }, [filters]);

  const loadItems = async () => {
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

      const response = await fetch(`${config.apiEndpoint}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setItems(data.data);
      } else {
        throw new Error(`Failed to load ${config.entityNamePlural}`);
      }
    } catch (err) {
      console.error(`Failed to load ${config.entityNamePlural}:`, err);
      setError(`Failed to load ${config.entityNamePlural}`);
    } finally {
      setLoading(false);
    }
  };

  // Sheet actions
  const openCreateSheet = () => {
    setSelectedItem(null);
    setSheetMode('create');
    setSheetOpen(true);
  };

  const openViewSheet = (item: T) => {
    setSelectedItem(item);
    setSheetMode('view');
    setSheetOpen(true);
  };

  const openEditSheet = (item: T) => {
    setSelectedItem(item);
    setSheetMode('edit');
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedItem(null);
  };

  const handleSave = async (item: T) => {
    // Refresh data after save
    await loadItems();
    closeSheet();
  };

  // Table actions
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (!items) return;
    
    const allSelected = items.items.every(item => 
      selectedItems.includes(item.id)
    );
    
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.items.map(item => item.id));
    }
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Get sheet title and description
  const getSheetTitle = () => {
    switch (sheetMode) {
      case 'create':
        return `Add ${config.entityName}`;
      case 'edit':
        return `Edit ${config.entityName}`;
      case 'view':
        return selectedItem ? `${config.entityName} Details` : '';
      default:
        return '';
    }
  };

  const getSheetDescription = () => {
    switch (sheetMode) {
      case 'create':
        return `Create a new ${config.entityName.toLowerCase()}`;
      case 'edit':
        return `Make changes to this ${config.entityName.toLowerCase()}`;
      case 'view':
        return `View ${config.entityName.toLowerCase()} information`;
      default:
        return '';
    }
  };

  // Default row actions
  const getRowActions = (item: T) => {
    const customActions = config.getRowActions?.(item) || [];
    
    const defaultActions = [
      {
        icon: <Eye className="h-4 w-4" />,
        label: 'View',
        onClick: () => openViewSheet(item),
      },
      {
        icon: <Edit className="h-4 w-4" />,
        label: 'Edit',
        onClick: () => openEditSheet(item),
      },
      {
        icon: <Trash2 className="h-4 w-4" />,
        label: 'Delete',
        onClick: () => {
          // Handle delete with confirmation
          if (confirm(`Are you sure you want to delete this ${config.entityName.toLowerCase()}?`)) {
            // Implement delete logic
          }
        },
        variant: 'destructive' as const,
      },
    ];

    return [...customActions, ...defaultActions];
  };

  if (loading && !items) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{config.entityNamePlural}</h1>
        </div>
        <LoadingSpinner size="lg" text={`Loading ${config.entityNamePlural.toLowerCase()}...`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{config.entityNamePlural}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your {config.entityNamePlural.toLowerCase()}
          </p>
        </div>
        <div className="flex space-x-2">
          {headerActions}
          <Button onClick={openCreateSheet}>
            <Plus className="h-4 w-4 mr-2" />
            Add {config.entityName}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={config.searchPlaceholder || `Search ${config.entityNamePlural.toLowerCase()}...`}
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedItems.length} item(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Bulk Edit
                  </Button>
                  <Button size="sm" variant="destructive">
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadItems} className="mt-4" variant="outline">
                Retry
              </Button>
            </div>
          ) : items?.items && items.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={items.items.every(item => 
                          selectedItems.includes(item.id)
                        )}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    {config.columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.sortable ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => column.sortable && handleSort(column.key)}
                        style={{ width: column.width }}
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      {config.columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                          {column.render 
                            ? column.render(item[column.key], item)
                            : item[column.key]
                          }
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {getRowActions(item).map((action, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="ghost"
                              onClick={action.onClick}
                              className={action.variant === 'destructive' ? 'text-gray-600 hover:text-gray-700' : ''}
                              title={action.label}
                            >
                              {action.icon}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                {config.emptyStateMessage || `No ${config.entityNamePlural.toLowerCase()} found`}
              </p>
              <Button onClick={openCreateSheet} className="mt-4">
                Add Your First {config.entityName}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {items && items.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((items.page - 1) * items.pageSize) + 1} to{' '}
            {Math.min(items.page * items.pageSize, items.total)} of{' '}
            {items.total} results
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={items.page === 1}
              onClick={() => handlePageChange(items.page - 1)}
            >
              Previous
            </Button>
            
            {[...Array(Math.min(5, items.totalPages))].map((_, i) => {
              const page = items.page - 2 + i;
              if (page < 1 || page > items.totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === items.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              disabled={items.page === items.totalPages}
              onClick={() => handlePageChange(items.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Unified Sheet for Create/Edit/View */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{getSheetTitle()}</SheetTitle>
            <SheetDescription>{getSheetDescription()}</SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {sheetMode === 'view' && selectedItem && config.renderDetails(selectedItem)}
            {(sheetMode === 'edit' || sheetMode === 'create') && (
              config.renderForm(selectedItem, handleSave, closeSheet)
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}