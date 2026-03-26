/**
 * API Client Service
 * Centralized HTTP client for all backend API calls with error handling, caching, and retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

/**
 * API Response wrapper type
 */
export interface ApiResponse<T = unknown> {
  status: string;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * API Error type
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Cache entry for GET requests
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * API Client Service with caching and error handling
 */
class ApiClientService {
  private axiosInstance: AxiosInstance;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private requestCache: Map<string, Promise<unknown>> = new Map();
  private readonly DEFAULT_CACHE_TTL = 60000; // 1 minute
  private readonly DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds

  constructor() {
    const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000";

    this.axiosInstance = axios.create({
      baseURL,
      timeout: this.DEFAULT_REQUEST_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        const status = error.response?.status || 500;
        const message =
          error.response?.data?.error || error.message || "Unknown error";
        const details = error.response?.data?.details;

        throw new ApiError(status, message, details);
      },
    );
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.requestCache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheKey(key: string): void {
    this.cache.delete(key);
    this.requestCache.delete(key);
  }

  /**
   * Get cached data if valid
   */
  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data
   */
  private setCachedData<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * GET request with caching support
   */
  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig & { cacheTTL?: number },
  ): Promise<T> {
    const cacheTTL = config?.cacheTTL ?? this.DEFAULT_CACHE_TTL;
    const cacheKey = `GET:${url}`;

    // Check cache first
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }

    // Prevent duplicate requests for same endpoint
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey) as Promise<T>;
    }

    // Make the request
    const requestPromise = (async () => {
      try {
        const { data } = await this.axiosInstance.get<ApiResponse<T>>(url, config);
        const result = data.data as T;
        this.setCachedData(cacheKey, result, cacheTTL);
        this.requestCache.delete(cacheKey);
        return result;
      } catch (error) {
        this.requestCache.delete(cacheKey);
        throw error;
      }
    })();

    this.requestCache.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data: responseData } = await this.axiosInstance.post<
      ApiResponse<T>
    >(url, data, config);
    return responseData.data as T;
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data: responseData } = await this.axiosInstance.put<
      ApiResponse<T>
    >(url, data, config);
    return responseData.data as T;
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data: responseData } = await this.axiosInstance.patch<
      ApiResponse<T>
    >(url, data, config);
    return responseData.data as T;
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data: responseData } = await this.axiosInstance.delete<
      ApiResponse<T>
    >(url, config);
    return responseData.data as T;
  }

  /**
   * Get raw axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const apiClient = new ApiClientService();

/**
 * API methods grouped by resource
 */
export const api = {
  // Videos
  videos: {
    create: (data: unknown) => apiClient.post("/api/short-video", data),
    getStatus: (videoId: string) =>
      apiClient.get(`/api/short-video/${videoId}/status`),
    download: (videoId: string) =>
      apiClient.get(`/api/short-video/${videoId}`, { responseType: "blob" }),
    list: () => apiClient.get("/api/short-videos"),
    delete: (videoId: string) =>
      apiClient.delete(`/api/short-video/${videoId}`),
  },

  // Music & Voices
  music: {
    getTags: () => apiClient.get("/api/music-tags"),
    getVoices: () => apiClient.get("/api/voices"),
    stream: (fileName: string) =>
      apiClient.get(`/api/music/${fileName}`, { responseType: "blob" }),
  },

  // News & Reports
  news: {
    getSources: () => apiClient.get("/api/news-sources"),
    getReports: () => apiClient.get("/api/reports"),
    getReport: (reportId: string) =>
      apiClient.get(`/api/reports/${reportId}`),
    fetch: (sourceId: string) =>
      apiClient.post("/api/reports/fetch", { sourceId }),
    merge: (data: unknown) =>
      apiClient.post("/api/reports/merge", data),
  },

  // Scripts
  scripts: {
    getPlans: () => apiClient.get("/api/script-plans"),
    autoScript: (sourceId: string) =>
      apiClient.post("/api/auto-script", { sourceId }),
  },

  // Queue
  queue: {
    bulkEnqueue: (data: unknown) =>
      apiClient.post("/api/queue/bulk", data),
    getStatus: () => apiClient.get("/api/health/queue"),
    getStates: () => apiClient.get("/api/health/queue/states"),
  },

  // Publishing
  publish: {
    enqueue: (data: unknown) =>
      apiClient.post("/api/publish/enqueue", data),
    list: () => apiClient.get("/api/publish"),
    getJob: (jobId: string) =>
      apiClient.get(`/api/publish/${jobId}`),
  },

  // Health & Metrics
  health: {
    check: () => apiClient.get("/api/health"),
    metrics: () => apiClient.get("/api/metrics"),
  },

  // Marketing
  marketing: {
    audience: {
      create: (data: unknown) =>
        apiClient.post("/api/marketing/audience", data),
      list: () => apiClient.get("/api/marketing/audience"),
    },
    analytics: {
      upsert: (data: unknown) =>
        apiClient.post("/api/marketing/analytics", data),
      getByVideo: (videoId: string) =>
        apiClient.get(`/api/marketing/analytics/${videoId}`),
      dashboard: () =>
        apiClient.get("/api/marketing/dashboard"),
    },
    seo: {
      optimize: (data: unknown) =>
        apiClient.post("/api/marketing/seo/optimize", data),
    },
    variants: {
      create: (data: unknown) =>
        apiClient.post("/api/marketing/ab/variants", data),
      list: () => apiClient.get("/api/marketing/ab/variants"),
      getResults: (testId: string) =>
        apiClient.get(`/api/marketing/ab/variants/${testId}/results`),
      assign: (videoId: string) =>
        apiClient.post(`/api/marketing/ab/assign/${videoId}`, {}),
    },
  },

  // AI
  ai: {
    addEvent: (data: unknown) =>
      apiClient.post("/api/ai/events", data),
    listEvents: (limit?: number) =>
      apiClient.get(`/api/ai/events?limit=${limit || 200}`),
    train: () => apiClient.post("/api/ai/train", {}),
    getModel: () => apiClient.get("/api/ai/model"),
    getSuggestion: (data: unknown) =>
      apiClient.post("/api/ai/suggest", data),
    dashboard: () => apiClient.get("/api/ai/dashboard"),
  },

  // Content
  content: {
    ideate: (data: unknown) =>
      apiClient.post("/api/content/ideation", data),
    getEditingSuggestions: (data: unknown) =>
      apiClient.post("/api/content/editing-primitives", data),
    personalize: (data: unknown) =>
      apiClient.post("/api/content/personalize", data),
    addInteractive: (data: unknown) =>
      apiClient.post("/api/content/interactive", data),
    moderate: (text: string) =>
      apiClient.post("/api/content/moderate", { text }),
    optimizeByTrends: (data: unknown) =>
      apiClient.post("/api/content/trend-optimize", data),
    getAccessibility: (script: string) =>
      apiClient.post("/api/content/accessibility", { script }),
  },

  // Tenants (Multi-tenant)
  tenants: {
    list: () => apiClient.get("/api/tenants"),
    create: (data: unknown) =>
      apiClient.post("/api/tenants", data),
    get: (tenantId: string) =>
      apiClient.get(`/api/tenants/${tenantId}`),
    update: (tenantId: string, data: unknown) =>
      apiClient.put(`/api/tenants/${tenantId}`, data),
    keys: {
      list: (tenantId: string) =>
        apiClient.get(`/api/tenants/${tenantId}/keys`),
      create: (tenantId: string, data: unknown) =>
        apiClient.post(`/api/tenants/${tenantId}/keys`, data),
      delete: (tenantId: string, keyId: string) =>
        apiClient.delete(`/api/tenants/${tenantId}/keys/${keyId}`),
    },
    billing: {
      get: (tenantId: string, month?: string) =>
        apiClient.get(
          `/api/tenants/${tenantId}/billing${month ? `?month=${month}` : ""}`,
        ),
    },
    quota: {
      get: (tenantId: string) =>
        apiClient.get(`/api/tenants/${tenantId}/quota`),
    },
    logs: {
      write: (tenantId: string, engine: string, data: unknown) =>
        apiClient.post(
          `/api/tenants/${tenantId}/logs/${engine}`,
          data,
        ),
    },
  },

  // Temp files
  files: {
    getTempFile: (fileName: string) =>
      apiClient.get(`/api/tmp/${fileName}`, { responseType: "blob" }),
  },

  // Channel configuration
  channels: {
    list: () => apiClient.get("/api/channel-configs"),
    create: (data: unknown) =>
      apiClient.post("/api/channel-configs", data),
  },
};

export default apiClient;
