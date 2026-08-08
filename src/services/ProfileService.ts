import { CryptoService } from "./CryptoService";
import { ProfileStore } from "../db/ProfileStore";
import { ProfileAccountStore } from "../db/ProfileAccountStore";
import type {
  ProfileAccountCredentials,
  ProfileAccountRecord,
  ProfileAccountSummary,
  ProfileRecord,
  ProfileSummary,
} from "../types/profiles";
import type { PlatformType } from "../types/shorts";
import { isContentCategory } from "../config/categories";

const INSECURE_SECRETS = new Set([
  "tenant-dev-secret",
  "change-me-in-production",
  "change_me",
  "change-this-to-a-random-secret-at-least-32-chars",
  "secret",
  "password",
]);

export class ProfileService {
  private crypto: CryptoService;
  private profileStore: ProfileStore;
  private accountStore: ProfileAccountStore;

  constructor(basePath: string, secret: string) {
    if (!secret || INSECURE_SECRETS.has(secret.toLowerCase())) {
      throw new Error(
        "TENANT_KEYS_SECRET environment variable is required to encrypt profile account credentials. " +
          "Generate one with: openssl rand -hex 32",
      );
    }
    this.crypto = new CryptoService(secret);
    this.profileStore = new ProfileStore(basePath);
    this.accountStore = new ProfileAccountStore(basePath);
  }

  private encryptCredentials(credentials: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(credentials).map(([key, value]) => [key, this.crypto.encrypt(String(value))]),
    );
  }

  private decryptCredentials(credentials: Record<string, string>): ProfileAccountCredentials {
    return Object.fromEntries(
      Object.entries(credentials).map(([key, value]) => [key, this.crypto.decrypt(String(value))]),
    );
  }

  private toAccountSummary(account: ProfileAccountRecord): ProfileAccountSummary {
    return {
      id: account.id,
      provider: account.provider,
      label: account.label,
      externalId: account.externalId,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      status: account.status,
      lastError: account.lastError,
      hasCredentials: Object.keys(account.credentials).length > 0,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async listProfiles(): Promise<ProfileSummary[]> {
    const [profiles, accounts] = await Promise.all([
      this.profileStore.list(),
      this.accountStore.list(),
    ]);
    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      description: profile.description,
      genres: profile.genres,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      accounts: accounts
        .filter((account) => account.profileId === profile.id)
        .map((account) => this.toAccountSummary(account)),
    }));
  }

  async getProfile(id: string): Promise<ProfileSummary | undefined> {
    const profile = await this.profileStore.get(id);
    if (!profile) return undefined;
    const accounts = await this.accountStore.listByProfile(id);
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      genres: profile.genres,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      accounts: accounts.map((account) => this.toAccountSummary(account)),
    };
  }

  async getProfileRecord(id: string): Promise<ProfileRecord | undefined> {
    return this.profileStore.get(id);
  }

  async createProfile(data: {
    name: string;
    description?: string;
    genres?: string[];
  }): Promise<ProfileSummary | undefined> {
    const genres = (data.genres || []).filter((genre) => isContentCategory(genre));
    const profile = await this.profileStore.create({
      name: data.name,
      description: data.description,
      genres,
    });
    return this.getProfile(profile.id);
  }

  async updateProfile(
    id: string,
    patch: Partial<Pick<ProfileRecord, "name" | "description" | "genres">>,
  ): Promise<ProfileSummary | undefined> {
    const normalized: Partial<Pick<ProfileRecord, "name" | "description" | "genres">> = {};
    if (patch.name !== undefined) normalized.name = patch.name;
    if (patch.description !== undefined) normalized.description = patch.description;
    if (patch.genres !== undefined) {
      normalized.genres = patch.genres.filter((genre) => isContentCategory(genre));
    }
    await this.profileStore.update(id, normalized);
    return this.getProfile(id);
  }

  async removeProfile(id: string): Promise<boolean> {
    const accounts = await this.accountStore.listByProfile(id);
    for (const account of accounts) {
      await this.accountStore.remove(account.id);
    }
    return this.profileStore.remove(id);
  }

  async addAccount(data: {
    profileId: string;
    provider: PlatformType;
    label: string;
    credentials: Record<string, string>;
    externalId?: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<ProfileAccountSummary | undefined> {
    const profile = await this.profileStore.get(data.profileId);
    if (!profile) return undefined;
    const account = await this.accountStore.create({
      profileId: data.profileId,
      provider: data.provider,
      label: data.label,
      credentials: this.encryptCredentials(data.credentials),
      externalId: data.externalId,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      status: "active",
    });
    await this.profileStore.addAccountId(data.profileId, account.id);
    return this.toAccountSummary(account);
  }

  async getAccount(accountId: string): Promise<ProfileAccountRecord | undefined> {
    return this.accountStore.get(accountId);
  }

  async getAccountCredentials(accountId: string): Promise<ProfileAccountCredentials | undefined> {
    const account = await this.accountStore.get(accountId);
    if (!account) return undefined;
    return this.decryptCredentials(account.credentials);
  }

  async updateAccount(
    accountId: string,
    patch: Partial<Pick<ProfileAccountRecord, "status" | "lastError" | "displayName" | "avatarUrl" | "externalId" | "label">>,
  ): Promise<ProfileAccountSummary | undefined> {
    const account = await this.accountStore.update(accountId, patch);
    if (!account) return undefined;
    return this.toAccountSummary(account);
  }

  async removeAccount(profileId: string, accountId: string): Promise<boolean> {
    const account = await this.accountStore.get(accountId);
    if (!account || account.profileId !== profileId) return false;
    await this.profileStore.removeAccountId(profileId, accountId);
    return this.accountStore.remove(accountId);
  }

  /** Resolve the active accounts that should receive a video of `category` on `platform`. */
  async resolveAccountsFor(category: string, platform: PlatformType): Promise<ProfileAccountSummary[]> {
    const [profiles, accounts] = await Promise.all([
      this.profileStore.list(),
      this.accountStore.list(),
    ]);
    const matchingProfiles = profiles.filter((profile) =>
      profile.genres.some((genre) => genre.toLowerCase() === category.toLowerCase()),
    );
    const profileIds = new Set(matchingProfiles.map((profile) => profile.id));
    return accounts
      .filter((account) => account.provider === platform && profileIds.has(account.profileId) && account.status === "active")
      .map((account) => this.toAccountSummary(account));
  }
}
