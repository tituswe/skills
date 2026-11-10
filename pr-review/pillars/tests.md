# Tests

Would the tests catch it if this code broke?

- Each behaviour change has a test in the same diff.
- A bug fix has a test that fails without the fix.
- Each test would fail if the code under it broke.
- Tests go through the public interface and assert outcomes, not internal calls.
- Failure paths and edge cases are covered, not just the happy path.
- Every test asserts. Tests hold no branching or loops, and no sleeps or timing.
- Real code or fakes over heavy mocking: a test that mirrors the implementation only detects change.
- Test names state the behaviour.
