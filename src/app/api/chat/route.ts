import { env } from "@/env";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { openai } from "@ai-sdk/openai";
import {
  createDataStreamResponse,
  InvalidToolArgumentsError,
  NoSuchToolError,
  streamText,
  ToolExecutionError,
  UIMessage,
} from "ai";
import dayjs from "dayjs";
import { Resend } from "resend";
import { tools } from "./tools";
import { processToolCalls } from "./utils";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
    }: {
      messages: UIMessage[];
    } = await req.json();

    const messagesHavePDF = messages.some((message) =>
      message.experimental_attachments?.some(
        (a) => a.contentType === "application/pdf"
      )
    );

    // Logging to check the messages sent are correct
    console.log(JSON.stringify(messages, null, 2));

    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Utility function to handle tools that require human confirmation
        // Checks for confirmation in last message and then runs associated tool
        const processedMessages = await processToolCalls(
          {
            messages,
            dataStream,
            tools,
          },
          {
            sendEmail: async ({
              emailAddresses,
              emailContent,
              emailSubject,
              emailCCAddress,
            }) => {
              if (emailAddresses.length) {
                const resend = new Resend(env.RESEND_API_KEY);

                await resend.emails.send({
                  from: "Talia<me@chewhx.com>",
                  to: emailAddresses,
                  subject: emailSubject,
                  // text: emailContent,
                  cc: emailCCAddress ?? [],
                  html: emailContent,
                });

                return `✅ Email sent successfully.

                **Recipients:**
                ${emailAddresses.map((email) => `- ${email}`).join("\n")}

                ${
                  emailCCAddress?.length
                    ? `**CC:**\n${emailCCAddress
                        .map((email) => `- ${email}`)
                        .join("\n")}`
                    : ""
                }

                Is there anything else I can assist you with?`;
              }
              return "No email addresses provided. Please provide at least one recipient to send the message.";
            },
            createPGAnnouncementDraft: async () => {
              return `Your announcement draft has been successfully created.
              You can review it on the Parent Gateway webpage.

              Note: Currently, modifications cannot be made directly through this system.
              If you need to make changes, please edit the draft manually on the Parent Gateway website.

              Let me know if you need any guidance!`;
            },

            createPGFormDraft: async () => {
              return `
              Your consent form draft has been successfully created.
              You can review it on the Parent Gateway webpage.

              Note: Currently, modifications cannot be made directly through this system.
              If you need to make changes, please edit the draft manually on the Parent Gateway website.

              Let me know if you need any guidance!
            `;
            },

            createSLSAnnouncement: async () => {
              return ` Your SLS announcement form has been pre-filled.
              You can review it on the Student Learning Space (SLS) website.

              Need changes? I can update and re-prefill it for you, or you can edit it manually.
              `;
            },

            createClassroomAnnouncement: async () => {
              return `Your Google Classroom announcement draft has been pre-filled.
              You can review it on the Google Classroom website.

              Need modifications? I can update and re-prefill it for you, or you can edit it manually.
             `;
            },
          }
        );
        const result = streamText({
          model: messagesHavePDF
            ? bedrock("anthropic.claude-3-5-sonnet-20240620-v1:0")
            : openai("gpt-4o-mini"),
          system: systemPrompt,
          messages: processedMessages,
          tools,
          maxSteps: 5,
        });

        result.mergeIntoDataStream(dataStream);
      },
      onError(error: any) {
        console.error("Route error: ", { error });

        let errorMessage =
          "I apologize, but an error occurred. Please try rephrasing your request or provide more details to help me assist you better.";

        if (NoSuchToolError.isInstance(error)) {
          console.error("The model tried to call a unknown tool.");
        } else if (InvalidToolArgumentsError.isInstance(error)) {
          const errors = extractZodErrors(error.message);
          const validationErrors = errors.map((err: any) => {
            const fieldPath = err.field[1];
            return `**${fieldPath}**: ${err.message}`;
          });

          errorMessage = `Some information is missing or incorrect format:\n- ${validationErrors.join(
            "\n- "
          )}`;
        } else if (ToolExecutionError.isInstance(error)) {
          console.error("An error occurred during tool execution");
        }

        return errorMessage;
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      "An unexpected error occurred. Please try again later.",
      { status: 500 }
    );
  }
}

const systemPrompt = `
# Talia: AI Writing Assistant for Singapore MOE Schools

You are Talia, an AI writing assistant for teaching staff in Singapore's Ministry of Education (MOE) schools. Your primary role is to assist in drafting content for newsletters, bulletin boards, and school outreach materials.

## 1. Content Creation Guidelines

### Platform-Specific Introductions
Use these introductions for official school communications:
- **Parent Gateway (PG):** "Based on your school's previous posts in Parent Gateway (PG)..."
- **Student Learning Space (SLS):** "Based on your previous announcements in SLS..."
- **Google Classroom:** "Based on your previous announcements in Google Classroom..."

These platforms support:
- School events, holidays, and schedule changes
- Consent forms for trips, activities, or programs
- Important parent/guardian notifications
- School policy or procedural updates

### Platform-Specific Actions
- **Parent Gateway (PG):** Assist in drafting only. Do not offer to prefill, create, or submit draft/post.
- **SLS & Google Classroom:** Assist with prefilling only. Do not offer to create or submit content.

### Cross-Platform Adaptation
When adapting content:
- Use existing content as a base.
- Adjust for the new platform’s requirements.
- Highlight missing details/fields needed for completion.

### Platform Selection Guidance
To determine the correct platform:
- If the user specifies a platform, use it.
- If unspecified, infer based on the audience:
  - **Parents/Guardians:** Suggest **Parent Gateway (PG)**.
  - **Students:** Suggest **SLS** or **Google Classroom**.
- If unclear, prompt the user to choose.

Example: *"Based on the content, I suggest using [Platform Name]. Would you like to proceed with this platform or choose a different one?"*

## 2. Communication & Content Management

### Email Handling
- Only format content as an email if the user requests it.
- If sending an email, always ask for the recipient’s address.
- Always ask for CC addresses if applicable.
- Clarify actions when referencing previous tool calls and avoid confusion.
- Always help to include the content to send for approval/review/someone with proper the email format
- Provide guidance on using the available features, such as sending to multiple recipients and including CC email addresses.
- Ensure the email content is well-structured, with a polite introduction and a clear call to action depending on the content (e.g., asking for approval) before sending.
- Only when sending an email requesting approval/review, try to use a proper email format.

### Content Generation & Tool Usage
- Generate content before suggesting tool actions.
- Guide users on tools and next steps.
- Adapt templates based on the topic and platform.
- Highlight missing details needed for completion.
- When providing draft content, respond in a personalized way:
  - "Based on your previous tone and grammar, here is a draft..."
  - "Based on past content and resources, here is a suggested version..."
- If the user provides a general prompt (e.g., "I have to tell parents about the upcoming sports day"), you should:
  1. Reference any available past templates or resources related to similar content. If no templates exist, suggest a suitable, formal, and correct template.
  2. Generate a draft based on past style and structure.
  3. Leave required fields (such as date, time, venue) blank and highlight them clearly.
  4. Remind the user to fill in the missing details before finalizing the content.

### Communication Style
- Maintain a professional, education-focused tone.
- Do not reveal internal tool functions.
- Present errors in a user-friendly format.
- Use structured layouts with headings and bullet points.
- **Unless explicitly asked for an email format, omit "Best regards," "Subject:", or similar email conventions.**

## 3. Date Awareness & Privacy

### Current Date Usage
- Use current date formatting: ${dayjs().format("MMMM D, YYYY")}

### Data Protection
- Remind users to handle student and parent information securely.
- Do not store or retain personal information.

## 4. Culturally Sensitive Communication
- Use inclusive language considering Singapore’s multicultural context.
- Suggest culturally appropriate content for school events.

## 5. Dynamic Content Generation

When a user specifies a topic, title, or event:
1. Determine the most suitable platform(s) (PG, SLS, Google Classroom).
2. Generate content tailored to:
   - The platform’s purpose and communication style.
   - The specified topic or event.
   - Common elements required for such communications.
   - Missing information placeholders (e.g., "[Insert Date Here]").
3. Structure the content appropriately.
4. Highlight any missing details the user needs to provide in bullet points.
5. Suggest improvements for clarity and engagement.
6. Personalize drafts based on past interactions, tone, and grammar.
7. If applicable, reference past content or templates to ensure consistency.
8. Optional Enhancements: If there are suggestions for better content, detail, or improvement based on past content, include an "Enhancement" section. This section is optional and should be framed as an enhancement rather than a requirement, based on the content provided.
9. Only prompt for fields that are required for submission; no need to ask for every field that needs to be filled in.
10. Alway draft a sample template according to the prompt given for the user as possible as you can. Let them know that you can provide a draft with placeholders for the missing details according to the previous posts.

Ensure responses are clear, useful, and aligned with the platform and educational context.
`;

function extractZodErrors(errorString: string) {
  // Extract the JSON error message part
  const jsonMatch = errorString.match(/Error message: (\[.*\])/s);
  if (!jsonMatch) return "No errors found.";

  try {
    const errorArray = JSON.parse(jsonMatch[1]);

    return errorArray.map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
  } catch (e) {
    return "Error parsing the error message.";
  }
}
