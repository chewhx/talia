export type Approvals = {
  id: string;
  content_id: string;
  comment?: string;
  reviewed_at?: Date;
  decision: "approved" | "rejected";
  created_at: Date;
};
