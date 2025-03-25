export const LoopDecision = {
  Break: "break",
  Continue: "continue",
} as const;

export type LoopDecision = (typeof LoopDecision)[keyof typeof LoopDecision];
