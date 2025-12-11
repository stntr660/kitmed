'use client';

import {
  RectangleGroupIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  HeartIcon,
  ScissorsIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

interface CategoryTypeIconProps {
  categoryName: string;
  categoryType?: 'discipline' | 'equipment';
  level: number;
  className?: string;
}

export function CategoryTypeIcon({
  categoryName,
  categoryType = 'discipline',
  level,
  className = ''
}: CategoryTypeIconProps) {
  // Get category-specific icon based on name
  const getCategoryIcon = () => {
    const name = categoryName.toLowerCase();

    // Medical disciplines
    if (name.includes('cardio') || name.includes('cardiac')) {
      return HeartIcon;
    }
    if (name.includes('chirurg') || name.includes('surgery')) {
      return ScissorsIcon;
    }
    if (name.includes('laborat') || name.includes('lab')) {
      return BeakerIcon;
    }
    if (name.includes('radiolog') || name.includes('radio')) {
      return CircleStackIcon;
    }

    // Default icons by type
    if (categoryType === 'equipment') {
      return WrenchScrewdriverIcon;
    }

    return RectangleGroupIcon;
  };

  const Icon = getCategoryIcon();

  // Color scheme based on category type and level
  const getColorClass = () => {
    if (categoryType === 'equipment') {
      switch (level) {
        case 0: return 'text-green-600 bg-green-100';
        case 1: return 'text-green-500 bg-green-50';
        case 2: return 'text-green-400 bg-green-25';
        default: return 'text-green-300 bg-gray-50';
      }
    } else {
      switch (level) {
        case 0: return 'text-blue-600 bg-blue-100';
        case 1: return 'text-blue-500 bg-blue-50';
        case 2: return 'text-blue-400 bg-blue-25';
        default: return 'text-blue-300 bg-gray-50';
      }
    }
  };

  return (
    <div className={`
      h-8 w-8 rounded-lg flex items-center justify-center
      ${getColorClass()} ${className}
    `}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

interface HierarchyConnectionLinesProps {
  level: number;
  isLast?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
}

export function HierarchyConnectionLines({
  level,
  isLast = false,
  hasChildren = false,
  isExpanded = false
}: HierarchyConnectionLinesProps) {
  if (level === 0) return null;

  return (
    <div className="absolute left-0 top-0 h-full w-8 flex items-center justify-center">
      {/* Vertical line connecting to parent */}
      <div
        className="absolute w-px bg-gray-300"
        style={{
          left: `${level * 24 - 12}px`,
          top: isLast ? '0' : '0',
          height: isLast ? '50%' : '100%'
        }}
      />

      {/* Horizontal line to this item */}
      <div
        className="absolute h-px bg-gray-300"
        style={{
          left: `${level * 24 - 12}px`,
          top: '50%',
          width: '12px'
        }}
      />

      {/* Additional lines for parent levels */}
      {Array.from({ length: level - 1 }).map((_, index) => (
        <div
          key={index}
          className="absolute w-px bg-gray-300 h-full"
          style={{
            left: `${(index + 1) * 24 - 12}px`,
            top: '0'
          }}
        />
      ))}
    </div>
  );
}

interface LevelIndicatorProps {
  level: number;
  maxLevel?: number;
  showNumbers?: boolean;
  compact?: boolean;
}

export function LevelIndicator({
  level,
  maxLevel = 4,
  showNumbers = false,
  compact = false,
  categoryType = 'discipline'
}: LevelIndicatorProps) {
  // Special handling for top-level disciplines
  if (level === 0 && categoryType === 'discipline') {
    return (
      <div className="flex items-center space-x-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.235V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.734.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.765l-1.254.633a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zM6 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Discipline
        </span>
      </div>
    );
  }

  // Color scheme based on category type
  const baseColor = categoryType === 'discipline' ? 'blue' : 'green';

  const dots = Array.from({ length: maxLevel }).map((_, index) => {
    const isActive = index <= level;
    const intensity = Math.max(0, 1 - (index - level) * 0.3);

    return (
      <div
        key={index}
        className={`
          ${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full transition-all
          ${isActive
            ? `bg-${baseColor}-500`
            : 'bg-gray-200'
          }
        `}
        style={{
          opacity: isActive ? intensity : 0.3
        }}
      />
    );
  });

  return (
    <div className="flex items-center space-x-1">
      {showNumbers && (
        <span className={`text-xs font-medium mr-2 ${
          categoryType === 'discipline' ? 'text-blue-600' : 'text-green-600'
        }`}>
          L{level}
        </span>
      )}
      {level > 0 && (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
          categoryType === 'discipline'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {categoryType === 'discipline' ? 'Sub-discipline' : 'Equipment'} L{level}
        </span>
      )}
      <div className="flex items-center space-x-0.5">
        {dots}
      </div>
    </div>
  );
}

interface DepthIndicatorProps {
  level: number;
  categoryType?: 'discipline' | 'equipment';
  style?: 'bar' | 'border' | 'background';
}

export function DepthIndicator({
  level,
  categoryType = 'discipline',
  style = 'border'
}: DepthIndicatorProps) {
  const getColorIntensity = () => {
    const maxLevel = 4;
    const normalizedLevel = Math.min(level, maxLevel) / maxLevel;
    return Math.round((1 - normalizedLevel * 0.7) * 100);
  };

  const getColorClass = () => {
    const baseColor = categoryType === 'equipment' ? 'green' : 'blue';
    const intensity = getColorIntensity();

    switch (style) {
      case 'bar':
        return `bg-${baseColor}-${Math.max(200, 600 - level * 100)} h-1`;
      case 'border':
        return `border-l-4 border-${baseColor}-${Math.max(200, 600 - level * 100)}`;
      case 'background':
        return `bg-${baseColor}-${Math.max(25, 100 - level * 20)}`;
      default:
        return '';
    }
  };

  if (style === 'bar') {
    return (
      <div className={`w-full ${getColorClass()}`} />
    );
  }

  return null; // Other styles are applied as className props
}

interface CategoryBreadcrumbProps {
  categoryPath: Array<{ id: string; name: string; level: number }>;
  onCategoryClick?: (categoryId: string) => void;
  maxItems?: number;
}

export function CategoryBreadcrumb({
  categoryPath,
  onCategoryClick,
  maxItems = 4
}: CategoryBreadcrumbProps) {
  const displayPath = categoryPath.length > maxItems
    ? [...categoryPath.slice(0, 1), { id: '...', name: '...', level: -1 }, ...categoryPath.slice(-2)]
    : categoryPath;

  return (
    <div className="flex items-center space-x-2 text-sm">
      {displayPath.map((category, index) => (
        <div key={category.id} className="flex items-center space-x-2">
          {index > 0 && (
            <span className="text-gray-400">/</span>
          )}

          {category.name === '...' ? (
            <span className="text-gray-400">...</span>
          ) : (
            <button
              onClick={() => onCategoryClick?.(category.id)}
              className={`
                px-2 py-1 rounded transition-colors
                ${index === displayPath.length - 1
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }
              `}
            >
              {category.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

interface HierarchyStatsProps {
  totalCategories: number;
  maxDepth: number;
  topLevelCount: number;
  equipment?: number;
  disciplines?: number;
}

export function HierarchyStats({
  totalCategories,
  maxDepth,
  topLevelCount,
  equipment = 0,
  disciplines = 0
}: HierarchyStatsProps) {
  return (
    <div className="flex items-center space-x-6 text-sm text-gray-600">
      <div className="flex items-center space-x-2">
        <RectangleGroupIcon className="h-4 w-4" />
        <span>{totalCategories} catégories</span>
      </div>

      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-0.5 h-3 w-3">
            {Array.from({ length: Math.min(4, maxDepth) }).map((_, i) => (
              <div key={i} className="bg-blue-400 rounded-sm" />
            ))}
          </div>
        </div>
        <span>{maxDepth} niveaux</span>
      </div>

      <div className="flex items-center space-x-2">
        <HeartIcon className="h-4 w-4 text-blue-600" />
        <span>{disciplines} disciplines</span>
      </div>

      <div className="flex items-center space-x-2">
        <WrenchScrewdriverIcon className="h-4 w-4 text-green-600" />
        <span>{equipment} équipements</span>
      </div>
    </div>
  );
}