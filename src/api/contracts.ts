import { apiGet, getApiContractConfig } from "./client";
import { ApiError } from "./types";

type CurrentContractDto = {
  id: string;
  version: string;
  releasedAt: string;
  status: string;
  compatibility: {
    policy: string;
    additiveChangesAllowed: boolean;
    breakingChangesRequireNewVersion: boolean;
  };
  references: {
    apiReference: string;
    contractSpec: string;
  };
};

function parseCurrentContract(input: unknown): CurrentContractDto {
  if (!input || typeof input !== "object") {
    throw new ApiError({
      code: "UNKNOWN_ERROR",
      message: "Invalid /contracts/current payload",
    });
  }
  const row = input as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    version: String(row.version ?? ""),
    releasedAt: String(row.releasedAt ?? ""),
    status: String(row.status ?? ""),
    compatibility: {
      policy: String(
        (row.compatibility as Record<string, unknown> | undefined)?.policy ?? ""
      ),
      additiveChangesAllowed: Boolean(
        (row.compatibility as Record<string, unknown> | undefined)
          ?.additiveChangesAllowed
      ),
      breakingChangesRequireNewVersion: Boolean(
        (row.compatibility as Record<string, unknown> | undefined)
          ?.breakingChangesRequireNewVersion
      ),
    },
    references: {
      apiReference: String(
        (row.references as Record<string, unknown> | undefined)?.apiReference ?? ""
      ),
      contractSpec: String(
        (row.references as Record<string, unknown> | undefined)?.contractSpec ?? ""
      ),
    },
  };
}

export async function getCurrentContract() {
  return apiGet<CurrentContractDto>("/contracts/current", {
    parse: parseCurrentContract,
    skipAuth: true,
  });
}

export async function assertContractCompatibility() {
  const expected = getApiContractConfig();
  const current = await getCurrentContract();

  if (expected.id !== current.id || expected.version !== current.version) {
    throw new ApiError({
      code: "CONTRACT_MISMATCH",
      message:
        "API contract mismatch between mobile app and backend. Update one side before continuing.",
      details: {
        expected,
        current: { id: current.id, version: current.version },
      },
    });
  }

  return current;
}
