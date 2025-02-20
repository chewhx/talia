"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { formFieldsSchema, FormFieldsSchema } from "../../shared/form-fields";
import { z } from "zod";

export async function setPasswordCookie(formData: FormData) {
  const talia_password = formData.get("talia-password");

  const cookieStore = cookies();

  cookieStore.set("talia_password", String(talia_password) || "", {
    maxAge: 60 * 60 * 24 * 24, // 24 days in seconds
  });

  redirect("/main");
}

export async function fillFormWithAi(
  formFields: FormFieldsSchema,
  data: string
): Promise<FormFieldsSchema> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    prompt: `Give a array of objects which is a schema for form fields, and a piece of text data. Fill in the form fields based on your interpretation of the text data. Populate the 'value' field of the array schema only! If unsure, leave the original value as it is.
    -----
    Schema: 
    ${JSON.stringify(formFields)}
    -----
    Data: 
    ${data}
    `,
    schema: z.object({
      formFields: formFieldsSchema,
    }),
  });

  return object.formFields;
}
