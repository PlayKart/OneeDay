// src/utils/camelCase.ts

/**
 * Converts a snake_case string to camelCase.
 */
export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );
}

/**
 * Recursively converts all keys of an object or array of objects from snake_case to camelCase.
 */
export function keysToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as unknown as T;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const n: Record<string, any> = {};
    Object.keys(obj).forEach((key) => {
      const camelKey = snakeToCamel(key);
      n[camelKey] = keysToCamel(obj[key]);
      
      // Preserve original snake_case key as fallback for legacy property accesses like is_pinned or created_at
      if (key !== camelKey) {
        n[key] = n[camelKey];
      }
    });
    return n as T;
  }

  return obj;
}
