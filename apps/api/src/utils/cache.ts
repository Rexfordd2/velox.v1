import { revalidateTag as nextRevalidateTag } from 'next/cache';

/**
 * Revalidate a cache tag
 * @param tag The tag to revalidate
 */
export async function revalidateTag(tag: string) {
  try {
    await nextRevalidateTag(tag);
  } catch (error) {
    // Ignore errors in development when tag revalidation is not available
    if (process.env.NODE_ENV === 'development') {
      console.warn('Tag revalidation not available in development');
      return;
    }
    throw error;
  }
} 