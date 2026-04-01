// HTTP client for CLM REST API — authenticated via API key (Bearer clm_...)

import type {
  ClmPost,
  ClmTemplate,
  ClmAccount,
  ClmApiError,
} from "./types.js";

export class ClmApiClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultOrgId: string | undefined;

  constructor() {
    this.baseUrl = process.env.CLM_API_URL || "http://localhost:3000";
    this.apiKey = process.env.CLM_API_KEY || "";
    this.defaultOrgId = process.env.CLM_DEFAULT_ORG_ID || undefined;

    if (!this.apiKey) {
      throw new Error("CLM_API_KEY environment variable is required");
    }
  }

  /** Resolve orgId — use provided value or fall back to default */
  resolveOrgId(orgId?: string): string {
    const resolved = orgId || this.defaultOrgId;
    if (!resolved) {
      throw new Error(
        "orgId is required. Set CLM_DEFAULT_ORG_ID or pass orgId in the request."
      );
    }
    return resolved;
  }

  /** Shared fetch wrapper with auth header and error handling */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ClmApiError | null;
      const message = body?.error || `CLM API error: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  // ─── Posts ───

  async createPost(params: {
    orgId: string;
    title: string;
    content: string;
    templateId?: string;
    excerpt?: string;
    categories?: string[];
    tags?: string[];
    featuredImage?: string;
  }): Promise<ClmPost> {
    return this.request<ClmPost>("/api/cma/posts", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getPost(postId: string, orgId: string): Promise<ClmPost> {
    return this.request<ClmPost>(
      `/api/cma/posts/${encodeURIComponent(postId)}?orgId=${encodeURIComponent(orgId)}`
    );
  }

  async publishPost(
    postId: string,
    accountId: string,
    orgId: string
  ): Promise<{ success: boolean; platformUrl?: string; error?: string }> {
    return this.request(`/api/cma/posts/${encodeURIComponent(postId)}/publish`, {
      method: "POST",
      body: JSON.stringify({ accountId, orgId }),
    });
  }

  // ─── Templates ───

  async listTemplates(
    orgId: string
  ): Promise<{ templates: ClmTemplate[] }> {
    return this.request(`/api/cma/templates?orgId=${encodeURIComponent(orgId)}`);
  }

  /** Resolve a template slug to its ID. Returns undefined if not found. */
  async resolveTemplateSlug(
    slug: string,
    orgId: string
  ): Promise<string | undefined> {
    const { templates } = await this.listTemplates(orgId);
    return templates.find((t) => t.slug === slug)?.id;
  }

  // ─── Accounts ───

  async listAccounts(): Promise<{ accounts: ClmAccount[] }> {
    return this.request("/api/cma/accounts");
  }
}
