# Integration Plan - Round 1

**Created:** 2026-03-12T00:00:00Z
**Iteration:** plan-1/iteration-1
**Total builders to integrate:** 3

---

## Executive Summary

All three builders completed successfully with zero file conflicts. The codebase has 30 source files and 7 test files totaling 70 tests. The primary integration challenge is a **type system incompleteness** in `src/lib/types.ts`: the `Database` interface is missing `Views`, `Functions`, and `Relationships` properties required by `@supabase/supabase-js`'s `GenericSchema` constraint. Builder 3 worked around this with a local `FullDatabase` type and type casting in `use-daily-record.ts`, but the proper fix belongs in the shared types file. Beyond that, all cross-builder imports resolve correctly, there are no duplicate files, and the integration is primarily a verification and type-fix exercise.

Key insights:
- Zero file overlap between builders (clean merge by design)
- One genuine type system issue: `Database` interface missing `Views`, `Functions`, `Relationships` at schema level and `Relationships` at table level -- causes Supabase `.upsert()` to resolve to `never` without workaround
- CI workflow (`ci.yml`) was created by Builder 2 despite being scoped for Iteration 2 -- low risk, but `test:coverage` script needs `@vitest/coverage-v8` devDependency which is not installed
- `next-env.d.ts` is in tsconfig.json `include` but is gitignored and not generated until `next dev` or `next build` runs -- may cause `tsc --noEmit` issues in cold environment

---

## Builders to Integrate

### Primary Builders
- **Builder-1:** Foundation & Infrastructure - Status: COMPLETE (15 files: config, types, CSS, SQL, test infra)
- **Builder-2:** Auth + Navigation Shell - Status: COMPLETE (13 files: Supabase clients, auth flow, layout, nav, CI)
- **Builder-3:** Today Screen - Status: COMPLETE (14 files: dates, hooks, components, page, tests)

### Sub-Builders
None (no builders split)

**Total outputs to integrate:** 42 files across 3 builders

---

## File Inventory

### Builder 1 Files (15)
```
package.json
tsconfig.json
next.config.ts
postcss.config.mjs
eslint.config.mjs
vitest.config.ts
.gitignore
.env.local
.env.local.example
src/app/globals.css
src/lib/types.ts
src/lib/constants.ts
src/test/setup.ts
src/lib/types.test.ts
src/lib/constants.test.ts
supabase/migrations/001_initial_schema.sql
```

### Builder 2 Files (13)
```
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
middleware.ts
src/app/login/page.tsx
src/app/auth/callback/route.ts
src/app/layout.tsx
src/components/nav.tsx
src/app/project/page.tsx
src/app/signals/page.tsx
src/components/nav.test.tsx
src/app/login/login.test.tsx
.github/workflows/ci.yml
```

### Builder 3 Files (14)
```
src/lib/dates.ts
src/hooks/use-debounced-save.ts
src/hooks/use-daily-record.ts
src/components/anchor-checkbox.tsx
src/components/sleep-button.tsx
src/components/note-field.tsx
src/components/section-group.tsx
src/components/date-header.tsx
src/app/page.tsx
src/lib/dates.test.ts
src/hooks/use-debounced-save.test.ts
src/hooks/use-daily-record.test.ts
src/components/anchor-checkbox.test.tsx
src/components/sleep-button.test.tsx
```

### File Conflict Check: NONE
All 42 files are unique across builders. Zero overlap confirmed.

---

## Integration Zones

### Zone 1: Database Type System Fix

**Builders involved:** Builder-1 (created types.ts), Builder-3 (discovered incompatibility, created workaround)

**Conflict type:** Shared Type Definitions (incomplete schema)

**Risk level:** HIGH

**Description:**
The `Database` interface in `src/lib/types.ts` (Builder 1) is missing three properties that `@supabase/supabase-js`'s `GenericSchema` type constraint requires:
1. `Views: {}` -- at the `public` level
2. `Functions: {}` -- at the `public` level
3. `Relationships: []` -- inside each table definition (`daily_records`, `ground_projects`, `weekly_signals`)

Without these, when Supabase's TypeScript client resolves generic type parameters for `.upsert()`, `.insert()`, and related methods, the type resolution falls through to `never`, making the methods unusable without type casting.

Builder 3 worked around this by creating local types in `use-daily-record.ts`:
- `FullDatabase` type that adds `Views`, `Functions`, and per-table `Relationships`
- `WithRelationships<T>` mapped type utility
- `TypedSupabaseClient` type with a re-typed `.from()` method
- A `supabase.from as TypedSupabaseClient['from']` cast in the `flush` function

**Files affected:**
- `src/lib/types.ts` -- Must add `Views: {}`, `Functions: {}` to `public`, and `Relationships: []` to each table
- `src/hooks/use-daily-record.ts` -- After types.ts fix, remove `FullDatabase`, `WithRelationships`, `TypedSupabaseClient` types and the `.from` cast
- `src/lib/types.test.ts` -- May need update if type structure tests check for the new properties

**Integration strategy:**
1. Add `Views: {}` and `Functions: {}` to `Database['public']` in `src/lib/types.ts`
2. Add `Relationships: []` to each of the three table definitions in `src/lib/types.ts`
3. Remove the `FullDatabase`, `WithRelationships`, and `TypedSupabaseClient` type definitions from `src/hooks/use-daily-record.ts` (lines 11-36)
4. Remove the `as TypedSupabaseClient['from']` cast in the `flush` function -- change `const typedFrom = supabase.from as TypedSupabaseClient['from']` and `typedFrom('daily_records')` to just `supabase.from('daily_records')`
5. Run `npx tsc --noEmit` to verify the fix compiles
6. Run `npx vitest run` to verify all tests still pass

**Expected outcome:**
- `Database` interface is fully compatible with `@supabase/supabase-js` GenericSchema
- `use-daily-record.ts` uses `supabase.from('daily_records')` directly without any type workarounds
- All Supabase client methods (`.select()`, `.upsert()`, `.insert()`, `.update()`) resolve correct types

**Assigned to:** Integrator-1

**Estimated complexity:** MEDIUM

---

### Zone 2: Cross-Builder Import Verification

**Builders involved:** Builder-1, Builder-2, Builder-3

**Conflict type:** Shared Dependencies

**Risk level:** LOW

**Description:**
All three builders have cross-dependencies. This zone verifies that every import resolves to a real file with the expected exports.

**Import dependency map:**

Builder 2 imports from Builder 1:
- `src/lib/supabase/client.ts` imports `Database` from `@/lib/types` -- VERIFIED OK
- `src/lib/supabase/server.ts` imports `Database` from `@/lib/types` -- VERIFIED OK
- `src/app/layout.tsx` imports `@/app/globals.css` -- VERIFIED OK

Builder 3 imports from Builder 1:
- `src/hooks/use-daily-record.ts` imports `Database` from `@/lib/types` -- VERIFIED OK
- `src/lib/dates.ts` imports `DAY_BOUNDARY_HOUR` from `@/lib/constants` -- VERIFIED OK

Builder 3 imports from Builder 2:
- `src/hooks/use-daily-record.ts` imports `createClient` from `@/lib/supabase/client` -- VERIFIED OK
- `src/app/page.tsx` imports `createClient` from `@/lib/supabase/client` -- VERIFIED OK

Builder 3 imports from Builder 3 (internal):
- `src/app/page.tsx` imports `useDailyRecord` from `@/hooks/use-daily-record` -- VERIFIED OK
- `src/app/page.tsx` imports all 5 components -- VERIFIED OK
- `src/hooks/use-daily-record.ts` imports `getEffectiveDate` from `@/lib/dates` -- VERIFIED OK
- `src/components/sleep-button.tsx` imports `formatTime` from `@/lib/dates` -- VERIFIED OK
- `src/components/date-header.tsx` imports from `@/lib/dates` -- VERIFIED OK

**Files affected:**
All source files with import statements (already verified manually above).

**Integration strategy:**
1. Run `npx tsc --noEmit` to catch any unresolved imports at the TypeScript level
2. Verify all `@/*` path aliases resolve correctly (tsconfig `paths` maps `@/*` to `./src/*`)
3. Check for circular imports (none found in manual review)
4. Verify no builder accidentally created a stub of another builder's file

**Expected outcome:**
- All imports resolve to existing files with correct exports
- No circular dependencies
- TypeScript compilation succeeds

**Assigned to:** Integrator-1 (quick verification alongside Zone 1)

**Estimated complexity:** LOW

---

### Zone 3: Full Stack Verification

**Builders involved:** All three

**Conflict type:** Independent verification (no conflicts, but cross-cutting validation)

**Risk level:** MEDIUM

**Description:**
End-to-end verification that the merged codebase compiles, all tests pass, and the dev server starts. This catches any subtle issues not visible in individual builder testing.

Specific concerns:
1. **`next-env.d.ts` missing**: tsconfig.json includes `next-env.d.ts` but it does not exist (gitignored, generated by `next dev`/`next build`). This should not block `tsc --noEmit` since it just adds Next.js type declarations that are already in `node_modules`, but it should be verified.
2. **CI workflow `test:coverage`**: The CI workflow (`.github/workflows/ci.yml`) references `npm run test:coverage` which runs `vitest run --coverage`. This requires `@vitest/coverage-v8` (or similar) as a devDependency, which is NOT currently in `package.json`. This will fail in CI.
3. **ESLint on full codebase**: Individual builders verified their own files. Full-codebase lint may surface new issues from interaction.
4. **`npm run build`**: Next.js build may catch server/client boundary issues not caught by `tsc --noEmit`.

**Files affected:**
- `package.json` -- may need `@vitest/coverage-v8` added to devDependencies (for CI)
- `.github/workflows/ci.yml` -- references `test:coverage` which needs coverage provider
- All source files (compilation and test targets)

**Integration strategy:**
1. Run `npx tsc --noEmit` -- must pass with zero errors
2. Run `npx vitest run` -- all 70 tests must pass
3. Run `npm run lint` -- must pass with zero errors
4. Run `npm run build` -- must succeed (requires env vars; use dummy values if needed)
5. Decide on CI workflow: either add `@vitest/coverage-v8` to package.json, or remove `--coverage` from the test:coverage script, or defer CI to Iteration 2 as originally planned
6. Verify `next-env.d.ts` is generated during build and does not cause issues

**Expected outcome:**
- TypeScript compiles with zero errors
- All 70 tests pass
- Lint passes
- Build succeeds
- CI workflow is functional (or deferred with comment)

**Assigned to:** Integrator-1

**Estimated complexity:** MEDIUM

---

## Independent Features (Direct Merge)

All builder outputs were merged directly since there are zero file conflicts. The builders created files in non-overlapping directories:

- **Builder-1:** Root config + `src/lib/types.ts` + `src/lib/constants.ts` + test infra + SQL migration
- **Builder-2:** `src/lib/supabase/*` + auth pages + layout + nav + CI workflow
- **Builder-3:** `src/lib/dates.ts` + `src/hooks/*` + `src/components/*` + Today page

All files are already present in the working directory. No merge operation is needed; the files were written directly by each builder.

---

## Parallel Execution Groups

### Group 1 (Single Integrator -- sequential zones)
- **Integrator-1:** Zone 1 (type fix), Zone 2 (import verification), Zone 3 (full stack verification)

**Rationale:** All three zones are tightly coupled. Zone 1 (type fix) affects Zone 2 (import verification) and Zone 3 (compilation). Running them sequentially in a single integrator avoids coordination overhead and ensures the type fix is applied before verification runs. The total work is small enough that a single integrator handles it efficiently.

---

## Integration Order

**Recommended sequence:**

1. **Zone 1: Fix Database types in `src/lib/types.ts`**
   - Add `Views`, `Functions`, `Relationships` to the Database interface
   - Remove type workarounds from `src/hooks/use-daily-record.ts`
   - Run `npx tsc --noEmit` to verify fix

2. **Zone 2: Verify cross-builder imports**
   - Confirm all imports resolve (implicitly verified by Zone 1's tsc check)
   - Spot-check any edge cases

3. **Zone 3: Full stack verification**
   - Run `npx vitest run` -- all 70 tests must pass
   - Run `npm run lint` -- zero errors
   - Run `npm run build` -- success
   - Address CI `test:coverage` dependency issue if needed

4. **Final consistency check**
   - Integrator reports completion
   - Move to ivalidator

---

## Shared Resources Strategy

### Shared Types
**Issue:** `Database` interface in `types.ts` is incomplete for Supabase's GenericSchema requirements.

**Resolution:**
- Add `Views: {}` and `Functions: {}` to `Database['public']`
- Add `Relationships: []` to each table definition
- Remove workaround types from `use-daily-record.ts`
- Existing type tests in `types.test.ts` may need a minor update to reflect the new properties

**Responsible:** Integrator-1 in Zone 1

### Shared Utilities
**Issue:** No duplicate utility implementations found. Each builder created distinct utilities.

**Resolution:** No action needed.

### Configuration Files
**Issue:** CI workflow references `test:coverage` which requires uninstalled `@vitest/coverage-v8`.

**Resolution:**
- Option A: Add `@vitest/coverage-v8` to devDependencies in `package.json` (preferred if keeping CI)
- Option B: Remove CI workflow entirely (it was created by Builder 2 but scoped for Iteration 2 per the plan)
- Option C: Keep CI workflow but change `test:coverage` to `test` (no coverage)

**Responsible:** Integrator-1 in Zone 3

---

## Expected Challenges

### Challenge 1: Supabase GenericSchema Type Resolution
**Impact:** If `types.ts` fix is incomplete or incorrect, Supabase client methods may still resolve to `never`, breaking the `use-daily-record.ts` hook compilation without the workaround types.
**Mitigation:** After fixing types.ts and removing workarounds from use-daily-record.ts, run `npx tsc --noEmit` immediately. If it fails, inspect the exact error to understand which property is still missing. Cross-reference with `@supabase/supabase-js` source types (`GenericSchema` definition in `node_modules/@supabase/supabase-js/dist/module/lib/types.d.ts`).
**Responsible:** Integrator-1

### Challenge 2: next-env.d.ts Not Present
**Impact:** The `tsconfig.json` includes `next-env.d.ts` which does not exist until `next dev` or `next build` generates it. This could cause a TypeScript warning or error in a clean environment.
**Mitigation:** Run `next build` (or `next dev` briefly) before `tsc --noEmit` to generate the file. Alternatively, verify that `tsc --noEmit` succeeds without it -- tsconfig `skipLibCheck: true` and the fact that Next.js types are available via node_modules should make this non-blocking.
**Responsible:** Integrator-1

### Challenge 3: CI Workflow test:coverage Missing Provider
**Impact:** GitHub Actions CI will fail on the `test` job because `vitest run --coverage` requires `@vitest/coverage-v8` (or `@vitest/coverage-istanbul`) which is not in `package.json`.
**Mitigation:** Either install the dependency, or change the CI script, or remove the CI workflow (it is ahead of scope per the iteration plan).
**Responsible:** Integrator-1

---

## Success Criteria for This Integration Round

- [ ] `src/lib/types.ts` Database interface includes Views, Functions, and Relationships
- [ ] `src/hooks/use-daily-record.ts` has no type workarounds (no FullDatabase, no TypedSupabaseClient, no `.from` cast)
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx vitest run` runs all 70 tests and they pass
- [ ] `npm run lint` passes with zero errors
- [ ] All imports resolve correctly (verified by TypeScript compilation)
- [ ] No duplicate code remaining
- [ ] Consistent patterns across integrated code (React imports, naming, color tokens)
- [ ] All builder functionality preserved

---

## Notes for Integrators

**Important context:**
- This is a greenfield project (no pre-existing code). All files were created fresh by the 3 builders.
- The builders ran in parallel and each verified their own output independently. All 70 tests passed in each builder's local context.
- The only cross-builder dependency that required a workaround was the Database type issue (Zone 1).

**Watch out for:**
- The `as never` casts in `use-daily-record.ts` lines 133, 144, 154 -- these exist because `pendingUpdates.current[field] = value` has a type mismatch. After fixing types.ts, verify whether these casts are still needed or can be improved.
- The `eslint-disable-next-line react-hooks/exhaustive-deps` comment in `use-daily-record.ts` line 87 -- this is intentional (supabase client is stable across renders) and should be preserved.
- Builder 2 created `.github/workflows/ci.yml` even though CI was scoped for Iteration 2. This is not a conflict but a scope creep. Decide whether to keep it.

**Patterns to maintain:**
- All JSX files include `import React from 'react'` explicitly (required for Vitest/jsdom compatibility)
- All imports use `@/*` path alias
- Color tokens use `warm-*` and `green-*` only (no gray-*, no emerald-*)
- File naming: kebab-case files, PascalCase exports
- No `@ts-ignore` comments anywhere

---

## Integrator Task Summary

### Integrator-1 (sole integrator)

**Zones:** Zone 1 + Zone 2 + Zone 3

**Task list:**

1. Fix `src/lib/types.ts`:
   - Add `Views: {}` and `Functions: {}` to `Database['public']`
   - Add `Relationships: []` to `daily_records`, `ground_projects`, `weekly_signals` table definitions

2. Clean up `src/hooks/use-daily-record.ts`:
   - Remove `FullDatabase`, `WithRelationships`, `TypedSupabaseClient` types (lines 11-36)
   - Replace `const typedFrom = supabase.from as TypedSupabaseClient['from']` / `typedFrom('daily_records')` with `supabase.from('daily_records')` directly
   - Verify the `as never` casts on lines 133, 144, 154 are still needed (they may be fixable with better typing)

3. Run verification commands:
   - `npx tsc --noEmit` -- zero errors
   - `npx vitest run` -- 70 tests passing
   - `npm run lint` -- zero errors
   - `npm run build` -- succeeds (set dummy env vars: `NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`)

4. Address CI workflow issue (optional):
   - Either add `@vitest/coverage-v8` to devDependencies, or remove `--coverage` flag, or remove CI workflow

5. Write integrator report

---

## Next Steps

1. Spawn Integrator-1 with this plan
2. Integrator-1 executes Zones 1, 2, 3 sequentially
3. Integrator-1 creates completion report
4. Proceed to ivalidator

---

**Integration Planner:** 2l-iplanner
**Plan created:** 2026-03-12
**Round:** 1
