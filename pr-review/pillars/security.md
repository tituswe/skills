# Security

Can an attacker, or another tenant, use this change? Every finding needs an exploit path an attacker can actually take.

- Every new route, query or job checks access on the server, denies by default, and scopes to the right user or tenant.
- SQL is parameterized. User input stays out of shell, `eval`, file paths, redirects and raw HTML (`dangerouslySetInnerHTML`, `innerHTML`).
- Input is validated on the server, with allowlists.
- Secrets live in config. Logs, errors and responses carry no secrets, tokens or personal data.
- Sessions and tokens expire. Cookies set `Secure`, `HttpOnly` and `SameSite`. Cookie-auth forms resist CSRF.
- Webhooks and callbacks verify their signature.
- A new dependency is needed, is the real package (not a typosquat), is maintained, has a fitting license, and runs no odd install scripts.
