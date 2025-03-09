import { z } from "zod";

export const AnnouncementDraftSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(120)
    .describe(
      "Concise, engaging title for the school announcement. Required field and only can have 1-120 characters"
    ),
  status: z
    .string()
    .default("DRAFT")
    .describe("Current status of the announcement"),
  content: z
    .string()
    .min(50)
    .max(2000)
    .describe(
      "Detailed announcement content. Required field and only can have 50-2000 characters."
    ),
  enquiryEmailAddress: z
    .string()
    .email()
    .default("jane_tan@schools.gov.sg")
    .refine(
      (email) =>
        ["@gmail.com", "@moe.edu.sg", "@schools.gov.sg"].some((domain) =>
          email.endsWith(domain)
        ),
      "Email must end with @gmail.com, @moe.edu.sg, or @schools.gov.sg"
    )
    .describe(
      "Official contact email for inquiries. Only request changes when the user asks. The official contact email must end with @gmail.com, @moe.edu.sg, or @schools.gov.sg. This email will be visible to parents for any questions regarding the consent form."
    ),
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
