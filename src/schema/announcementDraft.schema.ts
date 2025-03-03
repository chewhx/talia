import { z } from "zod";

export const AnnouncementDraftSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(120)
    .describe("Concise, engaging title for the school announcement"),
  status: z
    .string()
    .default("DRAFT")
    .describe("Current status of the announcement"),
  content: z
    .string()
    .min(1)
    .max(100)
    .describe(
      "Detailed announcement content (50-100 characters). Include key information, important dates, and any necessary instructions. Use clear and concise language suitable for parents and guardians."
    ),
  enquiryEmailAddress: z
    .string()
    .email()
    .refine(
      (email) =>
        email.endsWith("@gmail.com") ||
        email.endsWith("@moe.edu.sg") ||
        email.endsWith("@schools.gov.sg"),
      "Email must end with @gmail.com, @moe.edu.sg, or @schools.gov.sg"
    )
    .default("parentsgateway.otp@gmail.com")
    .describe(
      "The default value is the user's pre-filled email. Only request changes when the user asks. The official contact email must end with @gmail.com, @moe.edu.sg, or @schools.gov.sg. This email will be visible to parents for inquiries about the announcement."
    ),
  // staffGroups: z
  //   .array(
  //     z.object({
  //       type: z.enum(["individual", "school", "level"]),
  //       label: z.string(),
  //       value: z.number(),
  //     })
  //   )
  //   .optional()
  //   .describe(
  //     "The staff who will be able to view and edit form response and delete form"
  //   ),
  // studentGroups: z
  //   .array(
  //     z.object({
  //       type: z.enum([
  //         "all",
  //         "class",
  //         "level",
  //         "cca",
  //         "school",
  //         "group",
  //         "student",
  //       ]),
  //       label: z.string(),
  //       value: z.number(),
  //     })
  //   )
  //   .optional()
  //   .describe(
  //     "The student groups, individual students or both that will receive the announcement"
  //   ),
  // images: z
  //   .array(z.object({}))
  //   .optional()
  //   .describe("The image gallery for announcement"),
  // attachments: z
  //   .array(z.object({}))
  //   .optional()
  //   .describe("The attachment for announcement"),
  urls: z
    .array(
      z.object({
        webLink: z
          .string()
          .url()
          .describe(
            "Valid URL of a related website. Ensure the link is correct and relevant to the announcement."
          ),
        linkDescription: z
          .string()
          .describe(
            "Brief, clear and short description of the website link to help parents understand its relevance."
          ),
      })
    )
    .max(3)
    .optional()
    .describe(
      "Related website links (maximum 3). Use these to provide additional resources or information pertinent to the announcement."
    ),
  shortcuts: z
    .array(z.string())
    .optional()
    .describe(
      "Shortcut URLs for quick access to other websites or apps within the Parent Gateway system. These should be predefined system shortcuts."
    ),
});

export const mockAnnouncement = {
  title: "Announcement Draft",
  status: "DRAFT",
  content:
    '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":"left"},"content":[{"type":"text","text":"Draft "},{"type":"text","marks":[{"type":"underline"}],"text":"yes "}]}]}',
  enquiryEmailAddress: "parentsgateway.otp@gmail.com",
  staffGroups: [
    {
      type: "individual",
      label: "ANGELINE LIM HUI HUI",
      value: 1016,
    },
  ],
  studentGroups: [
    {
      type: "class",
      label: "H6-05 (2025)",
      value: 1001,
    },
  ],
  images: [],
  attachments: [],
  urls: [
    {
      webLink: "https://www.google.com",
      linkDescription: "Google",
    },
  ],
  shortcuts: ["DECLARE_TRAVELS", "EDIT_CONTACT_DETAILS"],
};
