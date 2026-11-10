# Maintainability

Will the next person understand and safely change this?

- It belongs where it sits and fits the existing design.
- It reuses existing helpers and patterns. Grep for a near-copy before accepting new code.
- It is as simple as the job allows: no speculative options, layers or flags.
- Names say what things do. Comments say why.
- It follows the repo's rule files. Quote the rule it breaks.
- Docs change when usage, config or behaviour changes.
- Unrelated changes are called out for their own PR.
- Dead code and stale TODOs are gone.
