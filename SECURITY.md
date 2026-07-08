# Security Policy

## Supported Versions

We provide security updates for the latest stable release (the `main` branch). Older
branches may not receive patches.

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.
Instead, report it responsibly by emailing the maintainer at  
**security@example.com** (or use GitHub’s private vulnerability reporting
feature if enabled).

Include the following information in your report:

- A clear description of the vulnerability and its potential impact.
- Steps to reproduce or a proof‑of‑concept (if applicable).
- Versions affected (commit hash, branch name, or tag).
- Any mitigations you have already applied.

We will acknowledge receipt of your report within **48 hours** and keep you
informed of our progress toward a fix. We aim to resolve security issues within
**30 days**, depending on complexity.

## Security Best Practices (for Deployers & Contributors)

- **Environment Secrets** – Never commit API keys, database passwords, or other
  secrets to version control. Use environment variables, secret managers, or
  platform‑provided secrets (Docker secrets, Kubernetes Secrets, Vercel Env
  Vars, etc.).
- **Database Access** – Restrict your PostgreSQL instance to trusted networks
  and enforce SSL/TLS connections. Avoid exposing the database port to the
  public internet.
- **Input Validation** – All endpoints perform basic required‑field checks.
  For production, consider adding stricter validation (e.g., using Pydantic or
  Marshmallow) to prevent injection and malformed data.
- **Rate Limiting** – The current code does not include request throttling.
  Deploy a reverse proxy (NGINX, Traefik, Cloudflare, etc.) with rate‑limiting
  to mitigate abuse and brute‑force attacks.
- **Dependencies** – Keep `requirements.txt` and `package.json` up to date.
  Regularly run `pip list --outdated` and `npm outdated` and apply patches
  promptly.
- **Container Images** – If you containerise the service, use minimal base
  images (e.g., `python:3.12-slim`, `node:20-alpine`) and scan them with tools
  like Trivy or Grype for known vulnerabilities.
- **Logging** – Avoid logging sensitive information (tokens, personal data,
  credentials). Ensure logs are stored securely and are not publicly accessible.
- **Headers** – Deploy security headers (CSP, HSTS, X‑Frame‑Options,
  X‑Content‑Type‑Options, etc.) via your reverse proxy or middleware.
- **Principle of Least Privilege** – Database users should have only the
  permissions they need (e.g., the application user should not have `DROP` or
  `ALTER` privileges unless absolutely required).

## Patch Releases

When a security issue is resolved, we will:

- Tag a new release (e.g., `v1.2.3-sec`).
- Update `CHANGELOG.md` with a “Security” entry.
- Notify maintainers of downstream forks via GitHub’s security advisory
  (if enabled).

## Contact

For any security‑related questions or to report a vulnerability, please reach
out to **security@example.com**.

Thank you for helping keep Zuntra secure for everyone.