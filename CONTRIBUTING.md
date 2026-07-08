# Contributing to Zuntra

Thank you for considering a contribution to Zuntra! Please read this guide to
understand how to make your contribution effective and aligned with the project
goals.

## How to Contribute

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/zuntra.git
   cd zuntra
   ```
3. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-description
   ```
4. **Make your changes**, following the coding style and conventions described
   below.
5. **Add tests** (if applicable) to cover new functionality or bug fixes.
6. **Run the test suite** locally to ensure nothing is broken.
7. **Commit your changes** with a clear, descriptive commit message.
8. **Push to your fork** and open a **Pull Request (PR)** against the `main`
   branch of the original repository.
9. **Fill out the PR template** (if present) and respond to any review comments.

## Coding Standards

### Backend (Python)

- Follow **PEP 8** for formatting. You can use `flake8` or `ruff` to lint.
- Use **type hints** wherever possible (PEP 484).
- Keep functions focused and short (< 40 lines is a good guideline).
- Write docstrings for all public functions and classes (PEP 257).
- Avoid hard‑coding secrets; use environment variables or a config system.

### Frontend (TypeScript / React)

- Adhere to the existing **ESLint** and **Prettier** configurations.
- Use functional components with hooks; avoid class components unless
  necessary.
- Export components as named exports unless they are the default page
  component.
- Keep component files small; split large components into sensible sub‑
  components.
- Write PropTypes or TypeScript interfaces for component props.

### Documentation

- If you add or modify a feature, update the relevant documentation files
  under `docs/`.
- Keep the README in sync with user‑visible changes.

## Reporting Issues

- Use the **GitHub Issues** tracker.
- Clearly describe the problem, steps to reproduce, expected vs. actual
  behavior, and include logs or screenshots if relevant.
- Label the issue appropriately (bug, enhancement, question, etc.).

## Review Process

- Maintainers will review your PR for correctness, style, and alignment with
  project goals.
- Be prepared to make revisions based on feedback.
- Once approved, a maintainer will merge the PR.

## License

By contributing, you agree that your contributions will be licensed under the
MIT License (see LICENSE file).

---

Thank you for helping improve Zuntra!