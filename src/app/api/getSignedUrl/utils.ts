export function parseS3Uri(
  uri: string
): { bucket: string; key: string } | null {
  // Check if the URI starts with s3://
  if (!uri.startsWith("s3://")) {
    return null;
  }

  // Remove the "s3://" prefix
  const path = uri.substring(5);

  // Split by the first slash to separate bucket and key
  const firstSlashIndex = path.indexOf("/");
  if (firstSlashIndex === -1) {
    return { bucket: path, key: "" };
  }

  const bucket = path.substring(0, firstSlashIndex);
  const key = path.substring(firstSlashIndex + 1);

  return { bucket, key };
}

export async function getPresignedUrl(s3Uri: string): Promise<string> {
  // Determine the base URL based on environment
  // In development, this would be http://localhost:3000
  // In production, this should be your domain
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin // Client-side
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // Server-side fallback

  // Construct the full API URL
  const apiUrl = new URL("/api/getSignedUrl", baseUrl);
  apiUrl.searchParams.append("uri", s3Uri);

  // Make the API request
  const response = await fetch(apiUrl.toString());

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get signed URL");
  }

  const { url } = await response.json();
  return url;
}
