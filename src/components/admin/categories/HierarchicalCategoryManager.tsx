'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  RectangleGroupIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  DocumentIcon,
  PhotoIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CategoryCreationWizard } from './CategoryCreationWizard';
import { HelpTooltip, QuickStartGuide, HelpButton, ExpandableHelp } from './ContextualHelp';
import { CategoryTypeIcon, HierarchyConnectionLines, LevelIndicator, HierarchyStats } from './HierarchyIndicators';
import { CategoryQuickView } from './CategoryQuickView';
import { formatDate } from '@/lib/utils';

interface CategoryTranslation {
  id: string;
  languageCode: string;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  translations: CategoryTranslation[];
  children?: Category[];
  _count?: {
    children: number;
    products: number;
  };
  nom?: {
    fr: string;
    en?: string;
  };
  descriptionMultilingual?: {
    fr?: string;
    en?: string;
  };
}

interface TreeViewProps {
  categories: Category[];
  level: number;
  onExpand: (id: string) => void;
  onCollapse: (id: string) => void;
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  onSelect: (id: string, isSelected: boolean) => void;
  onEdit: (category: Category) => void;
  onView: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddChild: (parentCategory: Category) => void;
  getCategoryType: (category: Category, level: number) => 'discipline' | 'equipment';
  showMobileActions: string | null;
  setShowMobileActions: (id: string | null) => void;
}

function TreeView({
  categories,
  level,
  onExpand,
  onCollapse,
  expandedIds,
  selectedIds,
  onSelect,
  onEdit,
  onView,
  onDelete,
  onAddChild,
  getCategoryType,
  showMobileActions,
  setShowMobileActions
}: TreeViewProps) {
  const t = useTranslations();

  const getIndentStyle = (level: number) => ({
    paddingLeft: `${level * 32}px`,
  });

  const handleToggleExpand = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedIds.has(category.id)) {
      onCollapse(category.id);
    } else {
      onExpand(category.id);
    }
  };

  const handleCheckboxChange = (category: Category, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(category.id, e.target.checked);
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const isExpanded = expandedIds.has(category.id);
        const isSelected = selectedIds.has(category.id);
        const hasChildren = category.children && category.children.length > 0;

        return (
          <div key={category.id} className="group">
            {/* Category Row */}
            <div
              className="flex items-center py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              style={getIndentStyle(level)}
            >
              {/* Expand/Collapse Button */}
              <div className="w-8 flex justify-center">
                {hasChildren ? (
                  <button
                    onClick={(e) => handleToggleExpand(category, e)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Checkbox */}
              <div className="mr-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleCheckboxChange(category, e)}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>

              {/* Category Icon with Visual Hierarchy */}
              <div className="mr-3 relative">
                <HierarchyConnectionLines 
                  level={level} 
                  isLast={category === categories[categories.length - 1]}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                />
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="h-10 w-10 rounded-lg object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <CategoryTypeIcon 
                    categoryName={category.nom?.fr || category.name}
                    categoryType={getCategoryType(category, level)}
                    level={level}
                    className="h-10 w-10"
                  />
                )}
              </div>

              {/* Category Info with Enhanced Mobile Support */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">
                        {category.nom?.fr || category.name}
                      </h4>
                      <LevelIndicator level={level} compact={true} />
                      {!category.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          {t('admin.inactive')}
                        </Badge>
                      )}
                      {category.metaTitle && (
                        <HelpTooltip content={t('admin.categories.help.seoOptimized')}>
                          <GlobeAltIcon className="h-4 w-4 text-green-600" />
                        </HelpTooltip>
                      )}
                    </div>
                    {category.descriptionMultilingual?.fr && (
                      <p className="text-xs text-gray-600 truncate mt-1 hidden md:block">
                        {category.descriptionMultilingual.fr}
                      </p>
                    )}
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1 md:hidden">
                      {category._count && (
                        <span>{category._count.children + category._count.products} items</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile Actions Toggle */}
                  <div className="md:hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileActions(
                          showMobileActions === category.id ? null : category.id
                        );
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label={t('admin.categories.mobileActions.showActions')}
                    >
                      <div className="w-1 h-4 flex flex-col justify-between">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats - Hidden on Mobile */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-500">
                {category._count && (
                  <>
                    <HelpTooltip content={t('admin.categories.accessibility.subcategoriesCount', { count: category._count.children })}>
                      <span className="flex items-center space-x-1 cursor-help">
                        <RectangleGroupIcon className="h-4 w-4" />
                        <span>{category._count.children}</span>
                      </span>
                    </HelpTooltip>
                    <HelpTooltip content={t('admin.categories.accessibility.productsCount', { count: category._count.products })}>
                      <span className="flex items-center space-x-1 cursor-help">
                        <DocumentIcon className="h-4 w-4" />
                        <span>{category._count.products}</span>
                      </span>
                    </HelpTooltip>
                  </>
                )}
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <HelpTooltip content={t('admin.categories.addSubcategory')}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChild(category);
                    }}
                    className="hover:bg-blue-50 hover:text-blue-700 h-12 w-12"
                    aria-label={t('admin.categories.accessibility.categoryActions', { name: category.nom?.fr || category.name })}
                  >
                    <PlusIcon className="h-5 w-5" />
                  </Button>
                </HelpTooltip>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(category);
                  }}
                  className="hover:bg-blue-50 hover:text-blue-700 h-12 w-12"
                  aria-label={`${t('common.view')} ${category.nom?.fr || category.name}`}
                >
                  <EyeIcon className="h-5 w-5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                  className="hover:bg-amber-50 hover:text-amber-700 h-12 w-12"
                  aria-label={`${t('common.edit')} ${category.nom?.fr || category.name}`}
                >
                  <PencilIcon className="h-5 w-5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category);
                  }}
                  className="hover:bg-red-50 hover:text-red-700 h-12 w-12"
                  disabled={category._count && (category._count.children > 0 || category._count.products > 0)}
                  aria-label={`${t('common.delete')} ${category.nom?.fr || category.name}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Mobile Actions Panel */}
            {showMobileActions === category.id && (
              <div className="md:hidden bg-gray-50 border border-gray-200 rounded-lg mx-4 mt-2 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onAddChild(category);
                      setShowMobileActions(null);
                    }}
                    className="flex items-center justify-center space-x-2 h-12 text-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>{t('admin.categories.addSubcategory')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onView(category);
                      setShowMobileActions(null);
                    }}
                    className="flex items-center justify-center space-x-2 h-12 text-sm"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>{t('common.view')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onEdit(category);
                      setShowMobileActions(null);
                    }}
                    className="flex items-center justify-center space-x-2 h-12 text-sm"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>{t('common.edit')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onDelete(category);
                      setShowMobileActions(null);
                    }}
                    className="flex items-center justify-center space-x-2 h-12 text-sm"
                    disabled={category._count && (category._count.children > 0 || category._count.products > 0)}
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>{t('common.delete')}</span>
                  </Button>
                </div>
                <button
                  onClick={() => setShowMobileActions(null)}
                  className="w-full mt-3 text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('admin.categories.mobileActions.hideActions')}
                </button>
              </div>
            )}

            {/* Children */}
            {isExpanded && hasChildren && (
              <TreeView
                categories={category.children!}
                level={level + 1}
                onExpand={onExpand}
                onCollapse={onCollapse}
                expandedIds={expandedIds}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
                onAddChild={onAddChild}
                getCategoryType={getCategoryType}
                showMobileActions={showMobileActions}
                setShowMobileActions={setShowMobileActions}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HierarchicalCategoryManager() {
  const t = useTranslations();

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactiveCategories, setShowInactiveCategories] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawer and modal state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [helpGuideOpen, setHelpGuideOpen] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState<string | null>(null);
  const [keyboardNavIndex, setKeyboardNavIndex] = useState(-1);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        hierarchical: 'true',
        ...(searchQuery && { query: searchQuery }),
        ...(showInactiveCategories ? {} : { isActive: 'true' }),
      });

      const response = await fetch(`/api/admin/categories?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data.items);
      } else {
        throw new Error('Failed to load categories');
      }
    } catch (err) {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showInactiveCategories, t]);


  // Tree operations
  const handleExpand = useCallback((id: string) => {
    setExpandedIds(prev => new Set(prev).add(id));
  }, []);

  const handleCollapse = useCallback((id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Selection operations
  const handleSelect = useCallback((id: string, isSelected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!categories.length) return;
      
      const allCategoryIds = getAllCategoryIds(categories);
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setKeyboardNavIndex(prev => 
            prev < allCategoryIds.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setKeyboardNavIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          event.preventDefault();
          if (keyboardNavIndex >= 0 && keyboardNavIndex < allCategoryIds.length) {
            const categoryId = allCategoryIds[keyboardNavIndex];
            handleSelect(categoryId, !selectedIds.has(categoryId));
          }
          break;
        case ' ':
          event.preventDefault();
          if (keyboardNavIndex >= 0) {
            const categoryId = allCategoryIds[keyboardNavIndex];
            if (expandedIds.has(categoryId)) {
              handleCollapse(categoryId);
            } else {
              handleExpand(categoryId);
            }
          }
          break;
        case 'Escape':
          setKeyboardNavIndex(-1);
          setSelectedIds(new Set());
          break;
      }
    };

    const handleClick = () => {
      setKeyboardNavIndex(-1);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [categories, keyboardNavIndex, selectedIds, expandedIds, handleSelect, handleExpand, handleCollapse]);

  const getAllCategoryIds = (categories: Category[]): string[] => {
    let ids: string[] = [];
    categories.forEach(category => {
      ids.push(category.id);
      if (category.children && expandedIds.has(category.id)) {
        ids = ids.concat(getAllCategoryIds(category.children));
      }
    });
    return ids;
  };

  const getMaxDepth = (categories: Category[], currentDepth = 0): number => {
    if (!categories.length) return currentDepth;
    
    let maxDepth = currentDepth;
    categories.forEach(category => {
      if (category.children && category.children.length > 0) {
        const childDepth = getMaxDepth(category.children, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    });
    
    return maxDepth;
  };

  // Determine category type based on content and hierarchy
  const getCategoryType = (category: Category, level: number = 0): 'discipline' | 'equipment' => {
    const name = category.nom?.fr || category.name;
    const hasEquipmentKeywords = /équipement|appareil|machine|moniteur|scanner/i.test(name);
    const hasDisciplineKeywords = /cardiologie|radiologie|chirurgie|laboratoire|urgence/i.test(name);
    
    if (hasEquipmentKeywords) return 'equipment';
    if (hasDisciplineKeywords) return 'discipline';
    
    // If it's a top-level category, likely a discipline
    return level === 0 ? 'discipline' : 'equipment';
  };

  const getEquipmentCount = (categories: Category[], level: number = 0): number => {
    let count = 0;
    categories.forEach(category => {
      const categoryType = getCategoryType(category, level);
      if (categoryType === 'equipment') count++;
      if (category.children) {
        count += getEquipmentCount(category.children, level + 1);
      }
    });
    return count;
  };

  const getDisciplineCount = (categories: Category[], level: number = 0): number => {
    let count = 0;
    categories.forEach(category => {
      const categoryType = getCategoryType(category, level);
      if (categoryType === 'discipline') count++;
      if (category.children) {
        count += getDisciplineCount(category.children, level + 1);
      }
    });
    return count;
  };

  const handleExpandAll = useCallback(() => {
    const getAllCategoryIds = (categories: Category[]): string[] => {
      let ids: string[] = [];
      categories.forEach(category => {
        ids.push(category.id);
        if (category.children) {
          ids = ids.concat(getAllCategoryIds(category.children));
        }
      });
      return ids;
    };
    
    setExpandedIds(new Set(getAllCategoryIds(categories)));
  }, [categories]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    const getAllCategoryIds = (categories: Category[]): string[] => {
      let ids: string[] = [];
      categories.forEach(category => {
        ids.push(category.id);
        if (category.children) {
          ids = ids.concat(getAllCategoryIds(category.children));
        }
      });
      return ids;
    };
    
    const allIds = getAllCategoryIds(categories);
    const allSelected = allIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [categories, selectedIds]);

  // CRUD operations
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setParentCategory(null);
    setWizardMode('add');
    setWizardOpen(true);
  };

  const handleAddSubcategory = (parent: Category) => {
    setSelectedCategory(null);
    setParentCategory(parent);
    setWizardMode('add');
    setWizardOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setParentCategory(null);
    setWizardMode('edit');
    setWizardOpen(true);
  };

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category);
    setQuickViewOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(t('admin.categories.confirmDelete', { name: category.name }))) return;

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadCategories();
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(category.id);
          return newSet;
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete category');
      }
    } catch (error) {
      setError('Failed to delete category');
    }
  };

  const handleSaveCategory = async (categoryData: any) => {
    try {
      const url = wizardMode === 'add' 
        ? '/api/admin/categories' 
        : `/api/admin/categories/${selectedCategory?.id}`;
      
      const method = wizardMode === 'add' ? 'POST' : 'PUT';

      // Format payload to match API schema
      const payload = {
        name: categoryData.translations.fr.name, // Root level name from French translation
        description: categoryData.translations.fr.description?.trim() || null,
        metaTitle: categoryData.translations.fr.metaTitle?.trim() || null,
        metaDescription: categoryData.translations.fr.metaDescription?.trim() || null,
        sortOrder: categoryData.sortOrder || 0,
        isActive: categoryData.isActive !== false, // Default to true
        imageUrl: categoryData.imageUrl && categoryData.imageUrl.trim() ? categoryData.imageUrl : null,
        translations: {
          fr: {
            name: categoryData.translations.fr.name,
            description: categoryData.translations.fr.description?.trim() || null,
            metaTitle: categoryData.translations.fr.metaTitle?.trim() || null,
            metaDescription: categoryData.translations.fr.metaDescription?.trim() || null,
          },
          // Only include English if name is provided
          ...(categoryData.translations.en?.name && {
            en: {
              name: categoryData.translations.en.name,
              description: categoryData.translations.en.description?.trim() || null,
              metaTitle: categoryData.translations.en.metaTitle?.trim() || null,
              metaDescription: categoryData.translations.en.metaDescription?.trim() || null,
            }
          })
        },
        ...(parentCategory && { parentId: parentCategory.id }),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadCategories();
        setWizardOpen(false);
        setSelectedCategory(null);
        setParentCategory(null);
      } else {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        console.error('Payload sent:', payload);
        
        // Show detailed validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((err: any) => 
            `${err.path?.join('.')}: ${err.message}`
          ).join(', ');
          throw new Error(`Validation errors: ${validationErrors}`);
        }
        
        throw new Error(errorData.error || 'Failed to save category');
      }
    } catch (error) {
      throw error;
    }
  };

  // Bulk operations
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.size === 0) return;

    const confirmMessages = {
      activate: t('admin.categories.confirmBulkActivate', { count: selectedIds.size }),
      deactivate: t('admin.categories.confirmBulkDeactivate', { count: selectedIds.size }),
      delete: t('admin.categories.confirmBulkDelete', { count: selectedIds.size }),
    };

    if (!confirm(confirmMessages[action])) return;

    try {
      const response = await fetch('/api/admin/categories/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          categoryIds: Array.from(selectedIds),
        }),
      });

      if (response.ok) {
        await loadCategories();
        setSelectedIds(new Set());
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Bulk operation failed');
      }
    } catch (error) {
      setError('Bulk operation failed');
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">
            {t('admin.sidebar.categories')}
          </h1>
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
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">
            {t('admin.sidebar.categories')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('admin.categories.manageDescription')}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex space-x-3">
            <Button
              onClick={handleCollapseAll}
              variant="outline"
              className="flex items-center space-x-2 h-12"
              size="sm"
            >
              <ChevronRightIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.categories.collapseAll')}</span>
            </Button>
            <Button
              onClick={handleExpandAll}
              variant="outline"
              className="flex items-center space-x-2 h-12"
              size="sm"
            >
              <ChevronDownIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.categories.expandAll')}</span>
            </Button>
          </div>
          
          <div className="flex space-x-3">
            <HelpButton onClick={() => setHelpGuideOpen(true)} />
            <Button
              onClick={handleAddCategory}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 h-12"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('admin.categories.addCategory')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <ExpandableHelp title={t('admin.categories.help.hierarchyExplanation')}>
        <div className="space-y-3">
          <p>{t('admin.categories.help.categoryTypes')}</p>
          <p>{t('admin.categories.help.navigationTips')}</p>
          <div className="bg-blue-25 p-3 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">{t('admin.categories.accessibility.keyboardShortcuts')}</p>
          </div>
        </div>
      </ExpandableHelp>

      {/* Filters & Search */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('admin.categories.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-14 text-base"
                  aria-label={t('admin.categories.searchPlaceholder')}
                />
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactiveCategories}
                  onChange={(e) => setShowInactiveCategories(e.target.checked)}
                  className="rounded border-gray-300 h-5 w-5"
                />
                <span className="text-sm text-gray-700 select-none">{t('admin.categories.showInactive')}</span>
              </label>
            </div>
          </div>

          {/* Statistics */}
          {categories.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <HierarchyStats 
                totalCategories={getAllCategoryIds(categories).length}
                maxDepth={getMaxDepth(categories)}
                topLevelCount={categories.length}
                equipment={getEquipmentCount(categories)}
                disciplines={getDisciplineCount(categories)}
              />
            </div>
          )}

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <span className="text-sm font-semibold text-primary-700">
                  {selectedIds.size} {selectedIds.size === 1 
                    ? t('admin.categories.categorySelected') 
                    : t('admin.categories.categoriesSelected')
                  }
                </span>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                    className="border-green-300 text-green-700 hover:bg-green-50 h-12"
                  >
                    {t('admin.activate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 h-12"
                  >
                    {t('admin.deactivate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                    className="h-12"
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Tree */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadCategories} variant="outline">
                {t('errors.tryAgain')}
              </Button>
            </div>
          ) : categories.length > 0 ? (
            <div className="p-4">
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={categories.length > 0 && selectedIds.size > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 h-5 w-5"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('admin.categories.selectAll')}
                </span>
              </div>

              {/* Tree View */}
              <div className="mt-4">
                <TreeView
                  categories={categories}
                  level={0}
                  onExpand={handleExpand}
                  onCollapse={handleCollapse}
                  expandedIds={expandedIds}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onEdit={handleEditCategory}
                  onView={handleViewCategory}
                  onDelete={handleDeleteCategory}
                  onAddChild={handleAddSubcategory}
                  getCategoryType={getCategoryType}
                  showMobileActions={showMobileActions}
                  setShowMobileActions={setShowMobileActions}
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <RectangleGroupIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.categories.noCategories')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('admin.categories.getStarted')}
              </p>
              <Button onClick={handleAddCategory} className="bg-primary-600 hover:bg-primary-700">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('admin.categories.addFirstCategory')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Creation Wizard */}
      <CategoryCreationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        category={selectedCategory}
        parentCategory={parentCategory}
        mode={wizardMode}
        onSave={handleSaveCategory}
      />

      {/* Help Guide */}
      <QuickStartGuide
        open={helpGuideOpen}
        onOpenChange={setHelpGuideOpen}
      />

      {/* Floating Help Button */}
      <HelpButton
        variant="floating"
        onClick={() => setHelpGuideOpen(true)}
      />

      {/* Quick View Modal */}
      <CategoryQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        category={selectedCategory}
        onEdit={() => {
          setQuickViewOpen(false);
          if (selectedCategory) {
            handleEditCategory(selectedCategory);
          }
        }}
      />
    </div>
  );
}