import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Resilient lazy loader that handles:
 * 1. Default and named exports seamlessly
 * 2. Undefined or null module objects
 * 3. Network or stale chunk deployment errors with automatic retry
 * 4. Stale cache invalidation and reload
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<any>,
  namedExport?: string
): LazyExoticComponent<T> {
  return lazy(async () => {
    const componentKey = namedExport || 'default_component';
    const retryCountKey = `oneday_chunk_retry_${componentKey}`;

    try {
      const module = await factory();
      
      if (!module) {
        throw new Error(`Module for '${componentKey}' resolved to undefined.`);
      }

      // 1. If named export is specified and present
      if (namedExport && module[namedExport]) {
        return { default: module[namedExport] };
      }

      // 2. If default export is present
      if (module.default) {
        if (namedExport && module.default[namedExport]) {
          return { default: module.default[namedExport] };
        }
        return { default: module.default };
      }

      // 3. If the module itself is a callable component function
      if (typeof module === 'function') {
        return { default: module };
      }

      // 4. If namedExport exists under any property
      if (namedExport && typeof module[namedExport] === 'function') {
        return { default: module[namedExport] };
      }

      // 5. Fallback: take the first function export available in module
      const possibleExportKey = Object.keys(module).find(
        (key) => typeof module[key] === 'function' && key !== 'default'
      );
      if (possibleExportKey && typeof module[possibleExportKey] === 'function') {
        return { default: module[possibleExportKey] };
      }

      throw new Error(`Could not resolve export '${namedExport || 'default'}' from module.`);
    } catch (error: any) {
      console.error(`[lazyWithRetry] Failed to load component '${componentKey}':`, error);

      const errorMessage = error?.message || (typeof error === 'string' ? error : '') || '';
      const isChunkError =
        error?.name === 'ChunkLoadError' ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('error loading dynamically imported module') ||
        errorMessage.includes('Unable to preload CSS') ||
        errorMessage.includes('Cannot read properties of undefined');

      const currentRetries = parseInt(sessionStorage.getItem(retryCountKey) || '0', 10);

      if (isChunkError && currentRetries < 2) {
        sessionStorage.setItem(retryCountKey, String(currentRetries + 1));
        
        // Attempt to update service workers if available
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.update();
            }
          } catch {
            // Ignore SW errors during reload
          }
        }

        // Hard reload the window to fetch latest chunks
        window.location.reload();
      }

      throw error;
    }
  });
}
