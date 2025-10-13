// Cache local simples para desenvolvimento
// Criado em: 2024-12-19

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class LocalCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
    
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl || this.defaultTTL}ms)`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    if (isExpired) {
      console.log(`⏰ Cache EXPIRED: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT: ${key} (age: ${now - entry.timestamp}ms)`);
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache CLEARED');
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache CLEANUP: removed ${cleaned} expired entries`);
    }
  }

  // Estatísticas do cache
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância singleton
export const localCache = new LocalCache();

// Função helper para criar chaves de cache
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${prefix}:${sortedParams}`;
}

// Limpar cache a cada 10 minutos
if (typeof window === 'undefined') { // Apenas no servidor
  setInterval(() => {
    localCache.cleanup();
  }, 10 * 60 * 1000);
}


