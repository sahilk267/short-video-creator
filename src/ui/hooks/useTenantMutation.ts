import useMutation from "./useMutation";
import { api } from "../services/apiClient";
import type { TenantRecord } from "./useTenantInfo";

export interface CreateTenantPayload {
  workspaceName: string;
  tier?: string;
}

export interface UpdateWorkspacePayload {
  workspaceName: string;
  description?: string;
  logoUrl?: string;
}

export interface InviteMemberPayload {
  email: string;
  role: "admin" | "editor" | "viewer";
}

export interface CreateApiKeyPayload {
  name: string;
}

export function useCreateTenantMutation(onDone?: () => void) {
  return useMutation<TenantRecord, CreateTenantPayload>(
    (payload) => api.tenants.create(payload) as Promise<TenantRecord>,
    { onSuccess: () => onDone?.() },
  );
}

export function useUpdateWorkspaceMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<TenantRecord, UpdateWorkspacePayload>(
    (payload) => api.tenants.update(tenantId || "", payload) as Promise<TenantRecord>,
    { onSuccess: () => onDone?.() },
  );
}

export function useInviteMemberMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<TenantRecord, InviteMemberPayload>(
    (payload) =>
      api.tenants.logs.write(tenantId || "", "workspace", {
        action: "invite-member",
        ...payload,
      }) as Promise<TenantRecord>,
    { onSuccess: () => onDone?.() },
  );
}

export function useRemoveMemberMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<TenantRecord, { memberId: string }>(
    (payload) =>
      api.tenants.logs.write(tenantId || "", "workspace", {
        action: "remove-member",
        ...payload,
      }) as Promise<TenantRecord>,
    { onSuccess: () => onDone?.() },
  );
}

export function useCreateApiKeyMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<{ id: string; value?: string }, CreateApiKeyPayload>(
    (payload) => api.tenants.keys.update(tenantId || "", payload) as Promise<{ id: string; value?: string }>,
    { onSuccess: () => onDone?.() },
  );
}

export function useRegenerateApiKeyMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<{ id: string; value?: string }, { keyId: string }>(
    (payload) =>
      api.tenants.keys.update(tenantId || "", {
        action: "regenerate",
        keyId: payload.keyId,
      }) as Promise<{ id: string; value?: string }>,
    { onSuccess: () => onDone?.() },
  );
}

export function useRevokeApiKeyMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<void, { keyId: string }>(
    (payload) => api.tenants.keys.delete(tenantId || "", payload.keyId) as Promise<void>,
    { onSuccess: () => onDone?.() },
  );
}

export function usePlanChangeMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<void, { plan: "free" | "starter" | "pro" | "enterprise" }>(
    (payload) =>
      api.tenants.logs.write(tenantId || "", "billing", {
        action: "plan-change",
        plan: payload.plan,
      }) as Promise<void>,
    { onSuccess: () => onDone?.() },
  );
}

export function useCancelSubscriptionMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<void, void>(
    () =>
      api.tenants.logs.write(tenantId || "", "billing", {
        action: "cancel-subscription",
      }) as Promise<void>,
    { onSuccess: () => onDone?.() },
  );
}

export function useIntegrationToggleMutation(tenantId?: string, onDone?: () => void) {
  return useMutation<void, { integrationId: string; connected: boolean }>(
    (payload) =>
      api.tenants.logs.write(tenantId || "", "integrations", {
        action: payload.connected ? "connect" : "disconnect",
        integrationId: payload.integrationId,
      }) as Promise<void>,
    { onSuccess: () => onDone?.() },
  );
}
