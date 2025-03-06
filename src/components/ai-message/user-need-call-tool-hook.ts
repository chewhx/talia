import { create } from "zustand";

export const useUserNeedToCallTool = create<{
  userNeedToCallTool: boolean;
  toggleUserNeedToCallTool: (userNeedToCallTool?: boolean) => void;
}>((set) => ({
  userNeedToCallTool: false,
  toggleUserNeedToCallTool: (userNeedToCallTool) =>
    set((state) => ({
      userNeedToCallTool: userNeedToCallTool ?? !state.userNeedToCallTool,
    })),
}));
