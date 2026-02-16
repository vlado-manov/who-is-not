# Frontend API Integration Rules

This folder is the single entry point for backend communication.

## Rules

1. Do not call `fetch` directly outside `src/api/client.ts`.
2. Use `apiGet/apiPost/apiPatch/apiDelete` from `client.ts`.
3. Every new endpoint should include a parse/validation step for response shape.
4. Keep request/response types close to the endpoint file (`heroes.ts`, `orders.ts`, etc.).
5. Prefer `ApiError` handling in UI logic when displaying errors.
6. Use React Query:
   - `useQuery` for reads
   - `useMutation` for writes/events
7. Keep mutations non-retriable by default unless endpoint is explicitly idempotent.

## Contract

- Backend sends:
  - `x-api-contract-id`
  - `x-api-contract-version`
  - `x-trace-id`
- Client expects:
  - `EXPO_PUBLIC_API_CONTRACT_ID` (default: `whoisnot-public-admin-api`)
  - `EXPO_PUBLIC_API_CONTRACT_VERSION` (default: `v1`)

`assertContractCompatibility()` is executed at app startup for early mismatch detection.

## Auth

- `client.ts` supports a global token getter via `setApiAccessTokenGetter`.
- Inject auth token state once auth backend flow is finalized.
- Avoid storing access tokens in plain AsyncStorage for production.

## Preloading

- Existing startup preload in `App.tsx` for fonts/local images/audio stays as-is.
- Remote character media from backend is prefetched additionally after `/characters` query resolves.
