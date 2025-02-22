import { z } from "zod";

const BaseQuestionSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string(),
  id: z.string().uuid(),
});

const ChoiceSchema = z.object({
  label: z.string(),
});

const SingleSelectionQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("single_selection"),
  choices: z.array(ChoiceSchema),
  properties: z.object({
    choices: z.array(ChoiceSchema),
  }),
});

const MultiSelectionQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("multi_selection"),
  choices: z.array(ChoiceSchema),
  properties: z.object({
    choices: z.array(ChoiceSchema),
  }),
});

const TextQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("text"),
});

const QuestionSchema = z.discriminatedUnion("type", [
  SingleSelectionQuestionSchema,
  MultiSelectionQuestionSchema,
  TextQuestionSchema,
]);

const QuestionArraySchema = z.array(QuestionSchema).optional();

export const FormDraftSchema = z.object({
  title: z.string(),
  status: z.string().default("DRAFT"),
  content: z.string(),
  vanue: z.string(),
  eventStartDate: z
    .object({
      date: z.string(),
      time: z.string(),
    })
    .optional(),
  eventEndDate: z.object({
    date: z.string(),
    time: z.string(),
  }),
  reminderDate: z.string(),
  addReminderType: z.enum(["ONE_TIME", "DAILY", "NONE"]),
  enquiryEmailAddress: z.string(),
  responseType: z.enum(["YES_NO", "ACKNOWLEDGEMENT"]),
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
  questions: QuestionArraySchema,
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
