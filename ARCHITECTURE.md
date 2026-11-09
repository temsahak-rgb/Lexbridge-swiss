# Architecture decisions

- **One narrow vertical slice**: Swiss corporate-register change preparation, rather than a broad legal AI product.
- **Frontend / logic**: React + TypeScript for UI; plain JavaScript `src/workflow.js` for deterministic rules (directly testable with Node's built-in test runner). Type declarations in `src/workflow.d.ts`.
- **Local first**: no FastAPI, database, upload, authentication, model calls or secret keys in this release; all fields live in React state. Export only on explicit user action.
- **Swiss federal vs cantonal sources**: `federalSources` is independent of `cantons`; canton URLs and notes are separate records.
- **Rules**: input validation creates a draft checklist and missing-information flags. Source URLs are links to primary guidance, not evidence that every item is mandatory in every factual scenario.
- **Future structure**: separate `jurisdiction` and `procedure` registries before adding jurisdictions. Additional modules must provide source provenance, versioning, tests and human legal sign-off. No jurisdiction becomes supported merely by uploading statutes.
- **Provider model**: optional later feature. BYOK needs consent, secure key handling, provider policy review, rate/size caps; no client-side permanent secrets.
