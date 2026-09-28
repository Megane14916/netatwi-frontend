import type { Metadata } from "next";

export async function resolveMetadata<T>(
  load: () => Promise<T>,
  create: (value: T) => Metadata,
  fallback: Metadata,
  resource: string,
): Promise<Metadata> {
  try {
    return create(await load());
  } catch (error) {
    console.warn(`metadata fallback: ${resource}`, error);
    return fallback;
  }
}
