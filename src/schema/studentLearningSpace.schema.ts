import { z } from "zod";

export const StudentLearningSpaceFormSchema = z.array(
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
