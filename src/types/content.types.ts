import { Approvals } from "./approvals.types";
import { Users } from "./users.types";

export type Contents = {
  id: string;
  status: "pending" | "approved" | "rejected";
  user_id: string;
  docs_url: string;
  approvals: Approvals[];
  users: Users;
  created_at: string;
  updated_at: string;
};
