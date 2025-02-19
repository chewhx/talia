import { z } from "zod";

export const env = z
  .object({
    OPENAI_API_KEY: z.string(),
    AWS_BEDROCK_KNOWLEDGEBASE_ID: z.string(),
  })
  .parse(process.env);
