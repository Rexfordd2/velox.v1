/**
 * Download video from URL and return as buffer
 * @param url Video URL
 * @returns Video buffer
 */
export async function downloadVideo(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
} 