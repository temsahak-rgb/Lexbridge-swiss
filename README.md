# LexBridge — Swiss Corporate Governance Automation (v0.1)

**A focused, local-first portfolio prototype for preparing corporate-register changes in Switzerland.** This replaces the earlier broad LexBridge contract / legal research scope for now.

## What works today

- Responsive, task-oriented React/TypeScript interface (English, French, German).
- Intake for **AG/SA** and **GmbH/Sàrl** companies.
- Four supported cantons: **Zürich (ZH), Vaud (VD), Genève (GE), Basel-Stadt (BS)**.
- Three scenarios: **appointment, removal/resignation, and signing-authority changes**.
- Generates conservative draft checklists, missing-information flags, and human-review warnings.
- Links to official Swiss federal and cantonal legal sources.
- Lets users tick completed documents and **export a local JSON record**, or print/save PDF.
- No back-end server, no storage of uploaded documents, no API key required.

## What does NOT work yet

- This is **not** an AI agent. No LLM, RAG, AI-generated document, or multi-agent review is connected.
- No automatically retrieved current register extract, automatic reading of articles of association, validation of documents, or official submission.
- Checklist entries are **planning aids**, not exhaustive legally validated filing instructions. Some checklist items are conditional on specific facts; follow cantonal instructions and obtain qualified review.
- No persistent case management, authentication, or PDF/DOCX ingestion. The data remains in browser memory until exported.

## Run locally or in GitHub Codespaces

```bash
npm install
npm run dev
```

Open the preview for port **5173**. In Codespaces, keep port visibility **Private**.

Build and test:

```bash
npm run test
npm run build
```

`dist/` can be published as static files to Cloudflare Pages. Use `npm run build` and deploy `dist` as the output directory. Static hosting does not receive contract data, because this version has no outbound app API.

## Legal scope and source provenance

Swiss corporate law is primarily federal, while filing channels, forms and register guidance are canton-specific. The source registry is in `src/workflow.js` and the detailed source inventory in [`docs/legal-sources.md`](docs/legal-sources.md).

**Scope boundaries:** Swiss federal provisions (CO/OR, Commercial Register Ordinance), filing guidance for ZH, VD, GE, and BS. EU law and other national jurisdictions are intentionally excluded from this version.

## Roadmap

1. Verify rules per combination of canton + legal form + change scenario against canton materials; formal legal sign-off.
2. Add structured canton-specific checklist evidence and dated source snapshots.
3. Add template-based draft minute/resolution generation with explicit document status and qualified legal review.
4. Add local PDF/DOCX processing and safe offline draft persistence.
5. Optional BYOK agent with multiple provider adapters, citation checks, provenance and clear cloud-processing consent.

## Privacy

All form logic executes in the browser. No server receives the fields. Clicking an official legal source opens that website; those external sites have their own privacy practices. JSON export is downloaded to the user's device. Do not enter confidential personal data into a prototype before a full security review.

## Portfolio integrity

This version demonstrates a usable workflow, explicit source scoping and quality safeguards. It must not be described as a functioning AI agent, a substitute for legal advice, or a service that submits to the Swiss register.
