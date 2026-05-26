/**
 * Replaces name placeholders in question text.
 * Supports both `{{name}}` and `{name}`.
 *
 * - Non-impostor: placeholder -> `yourLabel` (usually the shared picked player name)
 * - Impostor (same question, different name): placeholder -> `substituteName`
 * - Impostor (different question): placeholder -> `substituteName` if provided, else `yourLabel`
 */
export function formatQuestionWithName(
  text: string,
  options: {
    isImpostor: boolean;
    substituteName?: string | null;
    yourLabel: string;
  }
): string {
  if (!text || !/\{\{name\}\}|\{name\}/.test(text)) return text;
  const { isImpostor, substituteName, yourLabel } = options;
  const replacement =
    isImpostor && substituteName?.trim() ? substituteName.trim() : yourLabel;
  return text.replace(/\{\{name\}\}|\{name\}/g, replacement);
}
