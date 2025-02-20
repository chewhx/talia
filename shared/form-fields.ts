import { z } from "zod";
import { create } from "zustand";

export const formFieldsSchema = z.array(
  z.object({
    type: z.literal("input"),
    id: z.string(),
    description: z.string(),
    value: z.string().nullable(),
  })
);

export type FormFieldsSchema = z.infer<typeof formFieldsSchema>;

const mockFieldsForTesting: FormFieldsSchema = [
  {
    type: "input",
    description: "Title",
    id: "1",
    value: null,
  },
  {
    type: "input",
    description: "Description",
    id: "2",
    value: null,
  },
];

export const useFormFields = create<{
  formFields: FormFieldsSchema;
  setFormFields: (formFields: FormFieldsSchema) => void;
}>((set) => ({
  formFields: mockFieldsForTesting,
  setFormFields: (formFields) => set(() => ({ formFields })),
}));
