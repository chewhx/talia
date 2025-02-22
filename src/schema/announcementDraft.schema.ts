import { z } from "zod";

export const AnnouncementDraftSchema = z.object({
  title: z.string().describe("The title of the announcement"),
  status: z.string().default("DRAFT").describe("The status of the post"),
  content: z.string().describe("The content of the announcement"),
  enquiryEmailAddress: z
    .string()
    .describe("The preferred email address to receive enquiries from parents"),
  staffGroups: z
    .array(
      z.object({
        type: z.enum(["individual", "school", "level"]),
        label: z.string(),
        value: z.number(),
      })
    )
    .optional()
    .describe(
      "The staff who will be able to view and edit form response and delete form"
    ),
  studentGroups: z
    .array(
      z.object({
        type: z.enum([
          "all",
          "class",
          "level",
          "cca",
          "school",
          "group",
          "student",
        ]),
        label: z.string(),
        value: z.number(),
      })
    )
    .describe(
      "The student groups, individual students or both that will receive the announcement"
    ),
  images: z
    .array(z.object({}))
    .optional()
    .describe("The image gallery for announcement"),
  attachments: z
    .array(z.object({}))
    .optional()
    .describe("The attachment for announcement"),
  urls: z
    .array(z.object({ webLink: z.string(), linkDescription: z.string() }))
    .optional()
    .describe("The website link for the event"),
  shortcuts: z
    .array(z.string())
    .optional()
    .describe("The url for pressing and redirect to other website/app"),
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
