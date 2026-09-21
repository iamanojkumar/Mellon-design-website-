import { z } from "zod";

export type ContactFormMessages = {
  name: string;
  email: string;
  message: string;
};

export function createContactFormSchema(messages: ContactFormMessages) {
  return z.object({
    name: z.string().trim().min(2, messages.name).max(120),
    email: z.string().trim().email(messages.email),
    company: z.string().trim().max(120).optional().or(z.literal("")),
    budget: z.string().trim().max(60).optional().or(z.literal("")),
    message: z.string().trim().min(20, messages.message).max(4000),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>;

export type ContactFormFieldErrors = Partial<
  Record<keyof ContactFormValues, string>
>;

export type ContactFormState = {
  status: "idle" | "success" | "error";
  fieldErrors?: ContactFormFieldErrors;
  formError?: string;
};

export const initialContactFormState: ContactFormState = { status: "idle" };
