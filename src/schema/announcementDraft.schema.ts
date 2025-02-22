import { z } from "zod";

export const AnnouncementDraftSchema = z.object({
  title: z.string(),
  status: z.string().default("DRAFT"),
  content: z.string(),
  enquiryEmailAddress: z.string(),
  staffGroups: z
    .array(
      z.object({
        type: z.enum(["individual", "school", "level"]),
        label: z.string(),
        value: z.number(),
      })
    )
    .optional(),
  studentGroups: z.array(
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
  ),
  images: z.array(z.object({})).optional(),
  attachments: z.array(z.object({})).optional(),
  urls: z
    .array(z.object({ webLink: z.string(), linkDescription: z.string() }))
    .optional(),
  shortcuts: z.array(z.string()).optional(),
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
