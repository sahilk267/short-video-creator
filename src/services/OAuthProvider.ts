import { google } from "googleapis";
import type { PlatformType } from "../types/shorts";
import type { ProfileAccountCredentials } from "../types/profiles";

export interface OAuthConnectRequest {
  profileId: string;
  redirectUri?: string;
  clientId?: string;
}

export interface OAuthExchangeResult {
  credentials: ProfileAccountCredentials;
  externalId?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface OAuthProviderInfo {
  /** Whether a web OAuth flow is implemented for this provider. */
  webOAuthSupported: boolean;
  hint: string;
}

const WEB_OAUTH_SUPPORTED: Partial<Record<PlatformType, OAuthProviderInfo>> = {
  youtube: {
    webOAuthSupported: true,
    hint: "Google OAuth2 with offline access; refresh token stored encrypted.",
  },
  telegram: {
    webOAuthSupported: false,
    hint: "Telegram uses a bot token. Create a bot via @BotFather and add the bot token + channel id manually.",
  },
  instagram: {
    webOAuthSupported: false,
    hint: "Instagram uses the Meta Graph API. Add the page access token and Instagram business account id manually, or implement Meta OAuth.",
  },
  facebook: {
    webOAuthSupported: false,
    hint: "Facebook uses the Meta Graph API. Add the page access token and page id manually, or implement Meta OAuth.",
  },
  linkedin: {
    webOAuthSupported: false,
    hint: "LinkedIn requires a developer app with Marketing API approval. Add the access token + person URN manually, or implement LinkedIn OAuth.",
  },
  x: {
    webOAuthSupported: false,
    hint: "X requires a developer app. Add API key/secret + access token/secret manually, or implement OAuth1a.",
  },
};

export function oauthProviderInfo(provider: PlatformType): OAuthProviderInfo {
  return (
    WEB_OAUTH_SUPPORTED[provider] || {
      webOAuthSupported: false,
      hint: `No OAuth flow configured for ${provider}. Add credentials manually.`,
    }
  );
}

export function buildAuthorizationUrl(
  provider: PlatformType,
  request: OAuthConnectRequest,
  clientSecret: string,
  state: string,
): string {
  if (provider === "youtube") {
    const clientId = request.clientId || process.env.YOUTUBE_CLIENT_ID || "";
    if (!clientId || !clientSecret) {
      throw new Error("YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET are required for YouTube connect");
    }
    const redirectUri = request.redirectUri || defaultCallbackUrl(request, "youtube");
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ],
      state,
      include_granted_scopes: true,
    });
  }

  throw new Error(`${provider} OAuth connect is not implemented yet. ${oauthProviderInfo(provider).hint}`);
}

export async function exchangeOAuthCode(
  provider: PlatformType,
  code: string,
  redirectUri: string,
  clientSecret: string,
): Promise<OAuthExchangeResult> {
  if (provider !== "youtube") {
    throw new Error(`${provider} OAuth callback is not implemented yet. ${oauthProviderInfo(provider).hint}`);
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID || "";
  if (!clientId || !clientSecret) {
    throw new Error("YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET are required for YouTube connect");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error("No refresh token returned. Ask the user to re-authorize (offline access required).");
  }
  oauth2Client.setCredentials(tokens);

  const credentials: ProfileAccountCredentials = {
    clientId,
    clientSecret,
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token || "",
    tokenType: tokens.token_type || "Bearer",
    expiryDate: tokens.expiry_date ? String(tokens.expiry_date) : "",
  };

  let externalId: string | undefined;
  let displayName: string | undefined;
  let avatarUrl: string | undefined;
  try {
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const channelRes = await youtube.channels.list({ part: ["snippet"], mine: true });
    const channel = channelRes.data.items?.[0];
    externalId = channel?.id ?? undefined;
    displayName = channel?.snippet?.title ?? undefined;
    avatarUrl = channel?.snippet?.thumbnails?.default?.url ?? undefined;
  } catch {
    // Channel metadata is best-effort; tokens are still saved.
  }

  return { credentials, externalId, displayName, avatarUrl };
}

export function defaultCallbackUrl(
  request: Pick<OAuthConnectRequest, "redirectUri"> & { redirectUri?: string },
  provider: PlatformType,
): string {
  const base = request.redirectUri || process.env.PUBLIC_BASE_URL || "http://localhost:3123";
  return `${base.replace(/\/+$/, "")}/api/oauth/${provider}/callback`;
}
