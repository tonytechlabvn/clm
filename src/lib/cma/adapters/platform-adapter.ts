// Platform adapter interface — core abstraction for CMA multi-platform publishing

export interface ConnectPayload {
  platform: string;
  siteUrl?: string;     // WordPress site URL
  username?: string;    // WordPress username
  accessToken: string;  // Application Password or OAuth token
  label: string;        // user-friendly name
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface PublishPayload {
  title: string;
  content: string;       // HTML content (already sanitized)
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  featuredMediaId?: string; // platform media ID (string: FB IDs exceed MAX_SAFE_INTEGER)
  status?: "draft" | "publish";
}

export interface PlatformPostResult {
  platformPostId: string;
  platformUrl: string;
}

export interface ContentValidation {
  valid: boolean;
  errors: string[];
}

export interface PlatformMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
}

export interface MediaUploadResult {
  platformMediaId: string; // string: FB IDs exceed MAX_SAFE_INTEGER
  url: string;
}

export interface PlatformAdapter {
  readonly id: string;              // "wordpress" | "facebook" | "linkedin"
  readonly name: string;
  readonly maxContentLength: number;
  readonly supportedMedia: string[]; // MIME types
  readonly usesHtmlPipeline: boolean; // true = needs HTML conversion; false = adapter handles content itself

  // Auth
  connect(credentials: ConnectPayload): Promise<{ valid: boolean; displayName: string }>;
  disconnect(accountId: string): Promise<void>;
  validateConnection(siteUrl: string, username: string, token: string): Promise<boolean>;

  // Publishing
  publish(siteUrl: string, username: string, token: string, post: PublishPayload): Promise<PlatformPostResult>;
  updatePost(siteUrl: string, username: string, token: string, platformPostId: string, post: PublishPayload): Promise<PlatformPostResult>;
  deletePost(siteUrl: string, username: string, token: string, platformPostId: string): Promise<void>;

  // Content preparation — adapter decides how to transform content for its platform
  prepareContent(content: string, format: string): string;

  // Content validation
  validateContent(title: string, content: string): ContentValidation;

  // Media upload
  uploadMedia?(siteUrl: string, username: string, token: string, file: Buffer, fileName: string, mimeType: string): Promise<MediaUploadResult>;

  // Analytics (Phase 6)
  getMetrics?(siteUrl: string, username: string, token: string, platformPostId: string): Promise<PlatformMetrics>;
}
