import { z } from "zod";

// Pass to extension to fill in
export const StudentLearningSpacePrefillSchema = z.array(
  z.object({
    id: z.string(),
    value: z.string(),
  })
);

/*

formData Format:
[
  { id: "uid-ad0ce357-6ce1-480b-b84c-66b96619fd5d", value:"Title"},
  { id: "tiny-vue_45863134941740404593206", value:"<b>Message</b>"},
  { id: "uid-af40f2c1-f788-49c5-a4d2-2f83c7edd0ce", value:"10:30"},
  { id: "uid-c34972da-6053-46d7-a4d4-24e8d2b838ee-input-1", value:'24 Feb 2025'}
]
*/

// Scanned fields from extension
const attributesSchema = z.object({
  id: z.string(),
  class: z.string(),
  type: z.string().optional(),
  name: z.string(),
  placeholder: z.string().optional(),
  role: z.string().optional(),
});

const elementSchema = z.object({
  category: z.string(),
  element: z.string(),
  attributes: attributesSchema,
  id: z.string(),
});

export const StudentLearningSpaceFieldSchema = z.array(elementSchema);
