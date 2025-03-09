import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { parseS3Uri } from "./utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const s3Uri = searchParams.get("uri");

  if (!s3Uri) {
    return new Response(JSON.stringify({ error: "Missing S3 URI" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse the S3 URI
  const parsedUri = parseS3Uri(s3Uri);
  if (!parsedUri) {
    return new Response(JSON.stringify({ error: "Invalid S3 URI format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { bucket, key } = parsedUri;

  // Create an S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      sessionToken: process.env.AWS_SESSION_TOKEN, // Include if you have a session token
    },
  });

  // Create the command
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    // Generate the presigned URL
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 }); // URL expires in 1 minute

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
