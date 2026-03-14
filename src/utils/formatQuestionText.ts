/**
 * Replaces {{name}} in question text for "rate X's ..." style questions.
 * - Non-impostor: "Rate your tech addiction..." (yourLabel, e.g. "your")
 * - Impostor (same question, with substitute): "Rate Maria's tech addiction..." (substituteName)
 * - Impostor (different question): "Rate your ..." (yourLabel)
 */
export function formatQuestionWithName(
  text: string,
  options: {
    isImpostor: boolean;
    substituteName?: string | null;
    yourLabel: string;
  }
): string {
  if (!text || !text.includes("{{name}}")) return text;
  const { isImpostor, substituteName, yourLabel } = options;
  const replacement =
    isImpostor && substituteName?.trim() ? substituteName.trim() : yourLabel;
  return text.replace(/\{\{name\}\}/g, replacement);
}
