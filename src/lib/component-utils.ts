/**
 * Component Utilities for Import Validation
 * 
 * Utilities to prevent undefined component errors and validate imports
 */

import React from 'react';

/**
 * Validates that a component is properly imported and not undefined
 */
export function validateComponent<T>(
  component: T, 
  componentName: string
): T {
  if (component === undefined || component === null) {
    console.error(`Component "${componentName}" is undefined. Check import statement.`);
    throw new Error(`Component "${componentName}" is not properly imported. Expected a valid React component but got ${typeof component}.`);
  }
  
  return component;
}

/**
 * Safe component renderer that handles undefined components gracefully
 */
export function SafeComponent<P = any>({ 
  component: Component, 
  componentName, 
  fallback, 
  ...props 
}: {
  component: React.ComponentType<P> | undefined;
  componentName: string;
  fallback?: React.ComponentType<any>;
  [key: string]: any;
}) {
  // Validate component before rendering
  try {
    validateComponent(Component, componentName);
    return React.createElement(Component as React.ComponentType<P>, props);
  } catch (error) {
    console.error(`Failed to render component "${componentName}":`, error);
    
    if (fallback) {
      return React.createElement(fallback, { error, componentName, ...props });
    }
    
    // Default fallback
    return React.createElement('div', {
      className: 'p-4 border border-red-200 bg-red-50 rounded-md'
    }, [
      React.createElement('h3', { 
        key: 'title',
        className: 'text-sm font-medium text-red-800' 
      }, 'Component Error'),
      React.createElement('p', { 
        key: 'message',
        className: 'text-sm text-red-600 mt-1' 
      }, `Component "${componentName}" failed to load. Check the import statement.`)
    ]);
  }
}

/**
 * Validates icon components commonly used in the admin panel
 */
export function validateIconComponent(
  IconComponent: React.ComponentType<any> | undefined,
  iconName: string
): React.ComponentType<any> {
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" is undefined, using fallback`);
    
    // Return a simple fallback icon (circle)
    return function FallbackIcon(props: any) {
      return React.createElement('div', {
        ...props,
        className: `inline-block w-4 h-4 bg-gray-400 rounded-full ${props.className || ''}`,
        title: `Missing icon: ${iconName}`
      });
    };
  }
  
  return IconComponent;
}

/**
 * Dynamic component loader with error handling
 */
export async function loadComponent<T = React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  componentName: string
): Promise<T> {
  try {
    const module = await importFn();
    
    // Handle both default and named exports
    const component = 'default' in module ? module.default : module;
    
    return validateComponent(component, componentName);
  } catch (error) {
    console.error(`Failed to load component "${componentName}":`, error);
    throw new Error(`Component "${componentName}" could not be loaded: ${error}`);
  }
}

/**
 * HOC to wrap components with import validation
 */
export function withComponentValidation<P = any>(
  Component: React.ComponentType<P> | undefined,
  componentName: string
) {
  return function ValidatedComponent(props: P) {
    try {
      const ValidComponent = validateComponent(Component, componentName);
      return React.createElement(ValidComponent, props);
    } catch (error) {
      return React.createElement(SafeComponent, {
        component: Component,
        componentName,
        ...props
      });
    }
  };
}

/**
 * Utility to check if all required components are properly imported in a module
 */
export function validateModuleImports(
  imports: Record<string, any>,
  requiredComponents: string[]
): void {
  const missingComponents: string[] = [];
  
  requiredComponents.forEach(componentName => {
    if (!imports[componentName]) {
      missingComponents.push(componentName);
    }
  });
  
  if (missingComponents.length > 0) {
    const error = `Missing component imports: ${missingComponents.join(', ')}`;
    console.error(error);
    throw new Error(error);
  }
}

export default {
  validateComponent,
  SafeComponent,
  validateIconComponent,
  loadComponent,
  withComponentValidation,
  validateModuleImports,
};