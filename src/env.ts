import { z } from "zod";

export const env = z
  .object({
    OPENAI_API_KEY: z.string(),
    TALIA_PASSWORD: z.string(),
    RESEND_API_KEY: z.string(),
    AWS_BEDROCK_KNOWLEDGEBASE_ID: z.string(),
    AWS_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    AWS_SESSION_TOKEN: z.string(),
  })
  .parse(process.env);
