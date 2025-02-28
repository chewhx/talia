import { z } from "zod";

// Pass to extension to fill in
// export const StudentLearningSpacePrefillSchema = z.array(
//   z.object({
//     id: z.string(),
//     value: z.string(),
//   })
// );

export const StudentLearningSpacePrefillSchema = z.object({
  title: z.object({
    id: z.string(),
    value: z
      .string()
      .min(1)
      .max(50)
      .describe(
        "A concise, engaging title for the learning space announcement, between 1 and 50 characters"
      ),
  }),
  message: z.object({
    id: z.string(),
    value: z
      .string()
      .min(10)
      .max(2000)
      .describe(
        "The content of the announcement in TinyVue format. Include HTML tags for formatting. Content should be informative and motivating for students."
      ),
  }),
  startDate: z.object({
    id: z.string(),
    value: z
      .string()
      .regex(/^\d{2} [A-Z][a-z]{2} \d{4}$/)
      .describe("Start date in the format 'DD MMM YYYY' (e.g., '24 Feb 2025')"),
  }),
  startTime: z.object({
    id: z.string(),
    value: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .describe("Start time in 24-hour format 'HH:mm' (e.g., '10:30')"),
  }),
});

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

export function mapFieldsToSchema(fields: any, content: any) {
  console.log("mapFieldsToSchema: ", { content, fields });

  const requestData: any = [];

  if (fields) {
    fields.forEach((field: any) => {
      const { category, id } = field;

      switch (category) {
        case "title":
          requestData.push({ id, value: content["title"].value || "" });
          break;
        case "message":
          requestData.push({ id, value: content["message"].value || "" });
          break;
        case "startTime":
          requestData.push({
            id,
            value: content["startTime"].value || "",
          });
          break;
        case "startDate":
          requestData.push({
            id,
            value: content["startDate"].value || "",
          });
          break;
      }
    });
  }

  console.log(requestData);

  return requestData;
}
