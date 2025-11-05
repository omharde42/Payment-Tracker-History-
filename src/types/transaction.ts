export type TransactionType = "given" | "taken" | "left_to_give";
export type PendingStatus = "settled" | "pending";

export interface Transaction {
  id: string;
  personName: string;
  amount: number;
  type: TransactionType;
  pendingAmount: number;
  note?: string;
  date: string; // ISO date string
  createdAt: string; // ISO datetime string
}
