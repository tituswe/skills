# Code

Does the change do what it claims, for every input?

- It does what the PR or ticket says.
- Edge cases: empty, null, zero, max, duplicates, unicode, time zones.
- Concurrency: races, double submits, retries, ordering.
- Errors are handled or surfaced, never swallowed. A failure logs enough to debug it.
- Multi-step writes are atomic and roll back on failure.
- Every caller of a changed function or type still works. Grep them.
- Performance: queries in loops, unbounded lists or memory, slow work on a hot path.
