import { useMemo } from "react";
import useQuery from "./useQuery";
import { api } from "../services/apiClient";

export interface TenantRecord {
  id: string;
  workspaceName: string;
  tier?: string;
  description?: string;
  logoUrl?: string;
  members?: TenantMember[];
}

export interface TenantMember {
  id: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
}

export interface TenantApiKey {
  id: string;
  name: string;
  prefix?: string;
  createdAt?: string;
  lastUsedAt?: string;
}

export interface TenantQuotaSnapshot {
  apiCallsUsed: number;
  apiCallsLimit: number;
  rendersUsed: number;
  rendersLimit: number;
  storageUsedGb: number;
  storageLimitGb: number;
}

export interface TenantBillingSnapshot {
  plan: "free" | "starter" | "pro" | "enterprise";
  month: string;
  amountUsd: number;
  usageUsd?: number;
  status?: "active" | "past_due" | "canceled";
}

export function useTenants() {
  const query = useQuery<TenantRecord[]>(() => api.tenants.list() as Promise<TenantRecord[]>);

  return {
    ...query,
    tenants: query.data ?? [],
  };
}

export function useTenantDetails(tenantId?: string) {
  const query = useQuery<TenantRecord>(
    () => api.tenants.get(tenantId || "") as Promise<TenantRecord>,
    { enabled: Boolean(tenantId) },
  );

  return {
    ...query,
    tenant: query.data ?? null,
  };
}

export function useTenantKeys(tenantId?: string) {
  const query = useQuery<TenantApiKey[]>(
    () => api.tenants.keys.list(tenantId || "") as Promise<TenantApiKey[]>,
    { enabled: Boolean(tenantId) },
  );

  return {
    ...query,
    keys: query.data ?? [],
  };
}

export function useTenantMembers(tenant?: TenantRecord | null) {
  return useMemo(() => tenant?.members ?? [], [tenant]);
}

export function useTenantQuota(tenantId?: string) {
  const query = useQuery<TenantQuotaSnapshot>(
    () => api.tenants.quota.get(tenantId || "") as Promise<TenantQuotaSnapshot>,
    { enabled: Boolean(tenantId) },
  );

  return {
    ...query,
    quota: query.data ?? null,
  };
}

export function useTenantBilling(tenantId?: string) {
  const month = new Date().toISOString().slice(0, 7);
  const query = useQuery<TenantBillingSnapshot>(
    () => api.tenants.billing.get(tenantId || "", month) as Promise<TenantBillingSnapshot>,
    { enabled: Boolean(tenantId) },
  );

  return {
    ...query,
    billing: query.data ?? null,
  };
}
