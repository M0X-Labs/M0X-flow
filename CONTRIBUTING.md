# Contributing to m0x-flow

Welcome to **m0x-labs**! We are thrilled you want to contribute to m0x-flow. Building accessible, distributed AI is a massive undertaking, and community help is essential.

## How to Contribute

1. **Fork & Branch:** Fork the repository and create your branch from `main`.
2. **Issue Tracking:** Check the Issues tab for a "good first issue" or create a new issue to discuss proposed changes before writing code.
3. **Commit Standards:** Write clear, concise commit messages.
4. **Pull Requests:** Ensure your code passes all local tests before submitting a PR.

## Development Guidelines

### Frontend (React/Tauri)
* Ensure UI components remain highly responsive. 
* Do not perform heavy file I/O operations on the frontend; delegate them to the Python backend.

### Backend (Python)
* Ensure strict error handling for network timeouts (especially crucial for Exo Pods).
* Keep the bundled environment as lightweight as possible.

## Code of Conduct
Please maintain a respectful, collaborative environment. We are all here to push the boundaries of local AI together.