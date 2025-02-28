import { z } from "zod";

const BaseQuestionSchema = z.object({
  type: z.enum(["single_selection", "multi_selection", "text"]),
  title: z.string().describe("The question title"),
  description: z
    .string()
    .describe("Additional details or instructions for the question"),
  id: z.string().uuid().describe("Unique identifier for the question"),
});

const ChoiceSchema = z.object({
  label: z.string().describe("The text displayed for this choice"),
});

const SelectionQuestionSchema = BaseQuestionSchema.extend({
  choices: z.array(ChoiceSchema).describe("Available options for the question"),
  properties: z.object({
    choices: z.array(ChoiceSchema),
  }),
});

const SingleSelectionQuestionSchema = SelectionQuestionSchema.extend({
  type: z.literal("single_selection"),
}).describe("A question where only one option can be selected");

const MultiSelectionQuestionSchema = SelectionQuestionSchema.extend({
  type: z.literal("multi_selection"),
}).describe("A question where multiple options can be selected");

const TextQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("text"),
}).describe("A question that requires a free-text response");

const QuestionSchema = z.discriminatedUnion("type", [
  SingleSelectionQuestionSchema,
  MultiSelectionQuestionSchema,
  TextQuestionSchema,
]);

export const FormDraftSchema = z.object({
  title: z.string().min(1).max(120).describe("The title of the consent form"),
  status: z.string().default("DRAFT").describe("The status of the form"),
  content: z
    .string()
    .min(1)
    .max(2000)
    .describe("The content of the consent form in HTML format"),
  consentByDate: z
    .string()
    .describe("The deadline for responding to the form (YYYY-MM-DD)"),
  addReminderType: z
    .enum(["ONE_TIME", "DAILY", "NONE"])
    .default("NONE")
    .describe("Type of reminder to be sent"),
  enquiryEmailAddress: z
    .string()
    .email()
    .refine(
      (email) =>
        ["@gmail.com", "@moe.edu.sg", "@schools.gov.sg"].some((domain) =>
          email.endsWith(domain)
        ),
      "Email must end with @gmail.com, @moe.edu.sg, or @schools.gov.sg"
    )
    .describe(
      "Contact email for inquiries (must be @gmail.com, @moe.edu.sg, or @schools.gov.sg)"
    ),
  responseType: z
    .enum(["YES_NO", "ACKNOWLEDGEMENT"])
    .describe("The type of response required for the form"),
  venue: z
    .string()
    .optional()
    .describe("The location where the event will take place"),
  eventStartDate: z
    .object({
      date: z.string().describe("The start date of the event (YYYY-MM-DD)"),
      time: z.string().describe("The start time of the event (HH:MM)"),
    })
    .optional()
    .describe("Event starting date and time"),
  eventEndDate: z
    .object({
      date: z.string().describe("The end date of the event (YYYY-MM-DD)"),
      time: z.string().describe("The end time of the event (HH:MM)"),
    })
    .optional()
    .describe("Event ending date and time"),
  // reminderDate: z.string().optional().describe("The reminder trigger date"),
  urls: z
    .array(
      z.object({
        webLink: z.string().url().describe("Valid URL of the related website"),
        linkDescription: z.string().describe("Description of the website link"),
      })
    )
    .max(3)
    .optional()
    .describe("Related website links (max 3)"),
  shortcuts: z
    .array(z.string())
    .optional()
    .describe("Shortcut URLs for quick access to other websites/apps"),
  questions: z
    .array(QuestionSchema)
    .optional()
    .describe("Custom questions for YES_NO type forms"),

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
  //     "The student groups, individual students or both that will receive the form"
  //   ),
  // images: z
  //   .array(z.object({}))
  //   .optional()
  //   .describe("The image gallery for form"),
  // attachments: z
  //   .array(z.object({}))
  //   .optional()
  //   .describe("The attachment for form"),
});

export const mockForm = {
  title: "Form Draft",
  status: "DRAFT",
  content:
    '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":"left"},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Draft..."}]}]}',
  venue: "Office A",
  eventStartDate: {
    date: "2025-02-28",
    time: "00:30",
  },
  eventEndDate: {
    date: "2025-02-28",
    time: "03:00",
  },
  reminderDate: "",
  addReminderType: "NONE",
  enquiryEmailAddress: "parentsgateway.otp@gmail.com",
  consentByDate: "2025-02-28",
  responseType: "YES_NO",
  questions: [
    {
      type: "single_selection",
      title: "Apple or Orange",
      description: "Choose one of the fruit",
      choices: [
        {
          label: "Apple",
        },
        {
          label: "Orange",
        },
      ],
      properties: {
        choices: [
          {
            label: "Apple",
          },
          {
            label: "Orange",
          },
        ],
      },
      id: "7f2e1b3c-1a7b-4e09-90db-6a62303a4cb9",
    },
    {
      type: "multi_selection",
      title: "Do re mi fa so",
      description: "Do re mi fa so Do re mi fa so",
      choices: [
        {
          label: "Do",
        },
        {
          label: "Re",
        },
        {
          label: "Mi",
        },
        {
          label: "Fa",
        },
        {
          label: "So",
        },
      ],
      properties: {
        choices: [
          {
            label: "Do",
          },
          {
            label: "Re",
          },
          {
            label: "Mi",
          },
          {
            label: "Fa",
          },
          {
            label: "So",
          },
        ],
      },
      id: "bbcbbd84-9852-4f95-a717-6c223362eaab",
    },
    {
      type: "text",
      title: "What would you like to do?",
      description: "Exercise, movie, etc",
      id: "a5c1b22a-87fe-45da-b9d7-d506e5077475",
    },
  ],
  staffGroups: [
    {
      type: "individual",
      label: "ANGELINE LIM HUI HUI",
      value: 1016,
    },
    {
      type: "individual",
      label: "THOMAS LAU KOK KOK",
      value: 1002,
    },
    {
      type: "level",
      label: "PRIMARY 6 - Form & Co-Form",
      value: "PRIMARY 6",
    },
  ],
  studentGroups: [
    {
      type: "class",
      label: "H6-05 (2025)",
      value: 1001,
    },
    {
      type: "level",
      label: "2026 PRIMARY 1 (MOE schools only)",
      value: 1055,
    },
    {
      type: "class",
      label: "P1 HAPPINESS (2025)",
      value: 1003,
    },
  ],
  images: [],
  attachments: [],
  urls: [
    {
      webLink: "www.google.com",
      linkDescription: "Google",
    },
  ],
  shortcuts: ["DECLARE_TRAVELS", "EDIT_CONTACT_DETAILS"],
};

// {
//   "title": "Title",
//   "status": "DRAFT",
//   "content": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"Description \"}]}]}",
//   "venue": "",
//   "eventStartDate": null,
//   "eventEndDate": null,
//   "reminderDate": "",
//   "addReminderType": "NONE",
//   "enquiryEmailAddress": "parentsgateway.otp@gmail.com",
//   "consentByDate": "2025-03-31",
//   "responseType": "YES_NO",
//   "questions": [
//       {
//           "type": "multi_selection",
//           "title": "1 2 3 ",
//           "description": "Multiple description",
//           "choices": [
//               {
//                   "label": "1"
//               },
//               {
//                   "label": "2"
//               },
//               {
//                   "label": "3"
//               },
//               {
//                   "label": "4"
//               }
//           ],
//           "properties": {
//               "choices": [
//                   {
//                       "label": "1"
//                   },
//                   {
//                       "label": "2"
//                   },
//                   {
//                       "label": "3"
//                   },
//                   {
//                       "label": "4"
//                   }
//               ]
//           },
//           "id": "8d46a0ff-21d7-4446-a69f-29e32fc634cb"
//       },
//       {
//           "type": "single_selection",
//           "title": "Yes or NO",
//           "description": "",
//           "choices": [
//               {
//                   "label": "Yes "
//               },
//               {
//                   "label": "No"
//               }
//           ],
//           "properties": {
//               "choices": [
//                   {
//                       "label": "Yes "
//                   },
//                   {
//                       "label": "No"
//                   }
//               ]
//           },
//           "id": "c12d3c9a-87bd-47ee-b808-257053b593bf"
//       },
//       {
//           "type": "text",
//           "title": "YES",
//           "description": "Yes Yes",
//           "id": "65a2662b-6176-4646-9265-63cb95e05cea"
//       }
//   ],
//   "staffGroups": [],
//   "studentGroups": [
//       {
//           "type": "class",
//           "label": "H6-05 (2025)",
//           "value": 1001
//       }
//   ],
//   "images": [],
//   "attachments": [],
//   "urls": [
//       {
//           "webLink": "www.google.com",
//           "linkDescription": "Google"
//       }
//   ],
//   "shortcuts": [
//       "DECLARE_TRAVELS"
//   ]
// }
