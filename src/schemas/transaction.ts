import { z } from "zod";

export const transactionSchema = z.object({
  personName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(999999999, "Amount is too large"),
  type: z.enum(["given", "taken", "left_to_give"]),
  note: z
    .string()
    .max(500, "Note must be less than 500 characters")
    .optional(),
  date: z.string().min(1, "Date is required"),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
