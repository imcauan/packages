# ADR 0009: `@imcauan/tracing` has a Node-only core

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Worksy's `@repo/tracing` starts the OpenTelemetry Node SDK with
auto-instrumentation and an OTLP/HTTP exporter, and shuts it down on
`SIGTERM`. It's moving to this repo as `@imcauan/tracing`.

Rule 1 of the [constitution](../../CONSTITUTION.md) requires a framework-free
core that "works in any runtime". The package has no framework code, but its
whole purpose is the Node SDK (`@opentelemetry/sdk-node`,
`@opentelemetry/auto-instrumentations-node`) and the Node process. A core
that runs in a browser or an edge runtime would have to drop the package's
only feature.

The package also has a second entry, `./register`, that starts tracing from
`OTEL_*` environment variables when it's imported, so an app can load it
before any other module.

## Decision

- `@imcauan/tracing` is a named exception to rule 1: its root entry runs in
  Node only. It still imports no framework.
- `./register` is a side-effect entry. `package.json` lists it in
  `sideEffects`, so bundlers keep it.
- The README says the package is Node-only.

## Consequences

- The exception is limited to this package. Other packages still need a core
  that runs anywhere.
- Browser tracing, if it's ever needed, would be a separate entry or package
  built on the OpenTelemetry web SDK.
