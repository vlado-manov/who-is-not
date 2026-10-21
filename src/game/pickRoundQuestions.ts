// src/game/pickRoundQuestions.ts
import type { IQuestion, QuestionTypeApi } from "../types/question";

export type RoundPick = {
  questionType: QuestionTypeApi;
  baseId: string;
  oddId: string;
  oddOneId: string;
  questionNameTarget: string | null;
  impostorNameSubstitute: string | null;
  usedQuestionIds: string[];
};

type EligiblePlayer = { id: string; name: string };

type PickRoundQuestionsArgs = {
  questions: IQuestion[];
  /** Impostor and `{name}` targets are drawn only from these players. */
  eligiblePlayers: ReadonlyArray<EligiblePlayer>;
  usedQuestionIds: string[];
  allowedTypes: QuestionTypeApi[];
  /** When this type has at least 2 questions it wins over the other allowed types. */
  preferredType?: QuestionTypeApi;
};

const NAME_PLACEHOLDER_RE = /\{\{name\}\}|\{name\}/;

function randomItem<T>(list: ReadonlyArray<T>): T {
  return list[Math.floor(Math.random() * list.length)];
}

function normalizeGroupId(groupId: string): string {
  return groupId.trim().toLowerCase();
}

function getNormalizedRelatedGroups(q: IQuestion): string[] {
  return Array.from(
    new Set(
      (q.relatedGroupIds ?? [])
        .map(normalizeGroupId)
        .filter((groupId) => groupId.length > 0),
    ),
  ).sort();
}

function haveSameRelatedGroups(a: IQuestion, b: IQuestion): boolean {
  const aGroups = getNormalizedRelatedGroups(a);
  const bGroups = getNormalizedRelatedGroups(b);
  if (aGroups.length !== bGroups.length) return false;
  return aGroups.every((groupId, index) => groupId === bGroups[index]);
}

function getSourceForType(
  active: IQuestion[],
  used: string[],
  type: QuestionTypeApi,
): IQuestion[] {
  const byTypeAll = active.filter((q) => q.type === type);
  const byTypeUnused = byTypeAll.filter((q) => !used.includes(q.id));

  // Prefer unused questions; fall back to all of type when exhausted
  if (byTypeUnused.length >= 2) return byTypeUnused;
  return byTypeAll;
}

function getOddPoolForBase(
  active: IQuestion[],
  used: string[],
  base: IQuestion,
  type: QuestionTypeApi,
): IQuestion[] {
  const fullExactPool = active.filter(
    (q) => q.type === type && q.id !== base.id && haveSameRelatedGroups(base, q),
  );
  const samePackExactPool = fullExactPool.filter(
    (q) => q.packSlug === base.packSlug,
  );
  const fullPool =
    samePackExactPool.length >= 1 ? samePackExactPool : fullExactPool;
  const preferred = fullPool.filter((q) => !used.includes(q.id));
  if (preferred.length >= 1) return preferred;
  if (fullPool.length >= 1) return fullPool;
  return [base];
}

function chooseTypeAndList(
  active: IQuestion[],
  used: string[],
  allowedTypes: QuestionTypeApi[],
  preferredType?: QuestionTypeApi,
): { type: QuestionTypeApi; list: IQuestion[] } | null {
  let candidates = allowedTypes
    .map((type) => ({ type, list: getSourceForType(active, used, type) }))
    .filter((x) => x.list.length >= 2);

  const preferred = candidates.filter((c) => c.type === preferredType);
  if (preferred.length >= 1) candidates = preferred;
  if (!candidates.length) return null;

  const chosen = randomItem(candidates);
  const pairableList = chosen.list.filter((q) => {
    if (NAME_PLACEHOLDER_RE.test(q.text)) return true;
    return getOddPoolForBase(active, used, q, chosen.type).some(
      (odd) => odd.id !== q.id,
    );
  });
  return {
    type: chosen.type,
    list: pairableList.length >= 1 ? pairableList : chosen.list,
  };
}

function pickNameTargets(
  base: IQuestion,
  odd: IQuestion,
  players: ReadonlyArray<EligiblePlayer>,
): {
  odd: IQuestion;
  questionNameTarget: string | null;
  impostorNameSubstitute: string | null;
} {
  if (NAME_PLACEHOLDER_RE.test(base.text)) {
    // All non-impostors see the same player name in the base question
    const baseTarget = randomItem(players);

    // Impostor gets the same question, but with a different player name.
    const otherNameTargets = players.filter((p) => p.id !== baseTarget.id);
    const impostorTarget =
      otherNameTargets.length > 0 ? randomItem(otherNameTargets) : baseTarget;
    return {
      odd: base,
      questionNameTarget: baseTarget.name,
      impostorNameSubstitute: impostorTarget.name,
    };
  }

  if (NAME_PLACEHOLDER_RE.test(odd.text)) {
    return {
      odd,
      questionNameTarget: null,
      impostorNameSubstitute: randomItem(players).name,
    };
  }

  return { odd, questionNameTarget: null, impostorNameSubstitute: null };
}

/**
 * Picks the base/odd question pair, the impostor and the `{name}` targets for one round.
 * Returns `null` when there are no eligible players or no allowed type has 2+ active questions.
 */
export function pickRoundQuestions({
  questions,
  eligiblePlayers,
  usedQuestionIds,
  allowedTypes,
  preferredType,
}: PickRoundQuestionsArgs): RoundPick | null {
  if (!eligiblePlayers.length) return null;

  const active = questions.filter((q) => q.isActive);
  if (!active.length) return null;

  const chosen = chooseTypeAndList(
    active,
    usedQuestionIds,
    allowedTypes,
    preferredType,
  );
  if (!chosen) return null;

  const base = randomItem(chosen.list);
  const oddPool = getOddPoolForBase(active, usedQuestionIds, base, chosen.type);
  const oddPoolFiltered = oddPool.filter((q) => q.id !== base.id);
  const initialOdd = randomItem(
    oddPoolFiltered.length >= 1 ? oddPoolFiltered : oddPool,
  );

  const oddPlayer = randomItem(eligiblePlayers);
  const { odd, questionNameTarget, impostorNameSubstitute } = pickNameTargets(
    base,
    initialOdd,
    eligiblePlayers,
  );

  return {
    questionType: chosen.type,
    baseId: base.id,
    oddId: odd.id,
    oddOneId: oddPlayer.id,
    questionNameTarget,
    impostorNameSubstitute,
    usedQuestionIds:
      odd.id === base.id
        ? [...usedQuestionIds, base.id]
        : [...usedQuestionIds, base.id, odd.id],
  };
}
