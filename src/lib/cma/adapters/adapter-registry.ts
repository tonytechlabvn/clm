// Singleton registry mapping platform IDs to adapter instances

import type { PlatformAdapter } from "./platform-adapter";
import { WordPressAdapter } from "./wordpress-adapter";
import { FacebookAdapter } from "./facebook-adapter";

const adapters = new Map<string, PlatformAdapter>();

// Register built-in adapters
adapters.set("wordpress", new WordPressAdapter());
adapters.set("facebook", new FacebookAdapter());

export function getAdapter(platformId: string): PlatformAdapter {
  const adapter = adapters.get(platformId);
  if (!adapter) throw new Error(`No adapter registered for platform: ${platformId}`);
  return adapter;
}

export function listAdapters(): PlatformAdapter[] {
  return Array.from(adapters.values());
}
