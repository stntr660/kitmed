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
  compact = false 
}: LevelIndicatorProps) {
  const dots = Array.from({ length: maxLevel }).map((_, index) => {
    const isActive = index <= level;
    const intensity = Math.max(0, 1 - (index - level) * 0.3);
    
    return (
      <div
        key={index}
        className={`
          ${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full transition-all
          ${isActive 
            ? `bg-blue-500 opacity-${Math.round(intensity * 100)}` 
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
        <span className="text-xs font-medium text-gray-500 mr-2">
          L{level}
        </span>
      )}
      {dots}
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