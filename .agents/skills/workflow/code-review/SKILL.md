---
name: code-review
description: Automated pull request code review using multiple specialized agents with confidence-based scoring to filter false positives. Use this skill when the user asks to review a PR, audit code changes, check CLAUDE.md compliance, or run an automated code review workflow. Triggers on phrases like "review this PR", "code review", "check my pull request", "audit changes".
license: Apache-2.0
---

This skill automates pull request code review by launching multiple agents in parallel to independently audit changes from different perspectives. Confidence scoring filters false positives so only high-quality, actionable feedback is surfaced.

The user provides a pull request to review (branch, PR number, or URL). They may include context about the codebase, guidelines, or specific concerns.

## Review Thinking

Before launching agents, assess the PR context:
- **Eligibility**: Is the PR open, non-draft, non-trivial, and not already reviewed?
- **Scope**: What files changed? Are there relevant CLAUDE.md guideline files in those directories?
- **Focus**: What kind of issues matter most — bugs, guideline compliance, historical regressions?
- **Signal**: Use git blame and history to understand intent behind existing code.

**CRITICAL**: Do not flag pre-existing issues. Review only what changed in this PR. Treat uncertain findings as false positives until evidence confirms otherwise.

## Agent Architecture

Launch agents in parallel for comprehensive, independent coverage:

**Step 1 — Eligibility check (Haiku agent)**
Skip the review if the PR is: closed, draft, automated/trivial, or already reviewed by you.

**Step 2 — Gather guidelines (Haiku agent)**
Collect file paths (not contents) of relevant CLAUDE.md files: root-level and any in directories touched by the PR.

**Step 3 — Summarize changes (Haiku agent)**
Read the PR and return a concise summary of what changed and why.

**Step 4 — Launch 5 parallel review agents (Sonnet agents)**
Each agent independently audits the changes and returns a list of issues with reasons:
- **Agent 1**: CLAUDE.md compliance — verify changes follow project guidelines
- **Agent 2**: Bug scan — shallow read of diffs only, focus on large obvious bugs, skip nitpicks
- **Agent 3**: Historical context — read git blame/history to find regressions or pattern violations
- **Agent 4**: PR history — read prior PRs touching these files, surface recurring comments
- **Agent 5**: Code comments compliance — ensure changes respect guidance written in inline comments

**Step 5 — Confidence scoring (parallel Haiku agents, one per issue)**
Score each issue 0–100. For CLAUDE.md issues, verify the guideline explicitly calls out the problem.

| Score | Meaning |
|-------|---------|
| 0 | False positive. Doesn't survive light scrutiny or is pre-existing. |
| 25 | Uncertain. Might be real. Stylistic issues not in CLAUDE.md. |
| 50 | Likely real but minor — nitpick or low-frequency in practice. |
| 75 | Highly confident — double-checked, directly impacts functionality or is in CLAUDE.md. |
| 100 | Certain — confirmed real, happens frequently, evidence is direct. |

**Step 6 — Filter**
Discard any issue scoring below 80. If nothing remains, do not post a comment.

**Step 7 — Re-check eligibility (Haiku agent)**
Confirm PR is still open and eligible before posting.

**Step 8 — Post comment**
Use `gh pr comment` to post findings. Keep output brief. No emojis. Link every issue to exact file and line range using full SHA.

## Output Format

When issues are found:

```markdown
### Code review

Found N issues:

1. <brief description> (CLAUDE.md says "<exact quote>")

https://github.com/owner/repo/blob/<full-sha>/path/file.ext#L10-L15

2. <brief description> (bug due to <context>)

https://github.com/owner/repo/blob/<full-sha>/path/file.ext#L42-L48
```

When no issues are found:

```markdown
### Code review

No issues found. Checked for bugs and CLAUDE.md compliance.
```

## Code Link Format

Links MUST follow this exact format or GitHub Markdown will not render them:

```
https://github.com/owner/repo/blob/<FULL-SHA>/path/to/file.ext#L<start>-L<end>
```

- Use full SHA (never abbreviated, never `$(git rev-parse HEAD)`)
- Include at least 1 line of context before and after the flagged lines
- Repo name must match the repo being reviewed

## False Positive Guidelines

NEVER flag these:
- Pre-existing issues not introduced in this PR
- Code that looks like a bug but isn't
- Pedantic nitpicks a senior engineer would ignore
- Issues a linter, typechecker, or compiler would catch (assume CI handles these)
- General quality issues (test coverage, docs, security) unless explicitly in CLAUDE.md
- Issues silenced by lint-ignore comments
- Intentional functionality changes clearly related to the PR's purpose
- Real issues on lines the PR did not modify

## Configuration

**Confidence threshold**: Default is 80. To raise (fewer comments) or lower (more comments), adjust the filter in step 6.

**Add custom agents**: Extend step 4 with domain-specific agents:
- Security-focused agent for auth/injection patterns
- Performance agent for N+1 queries or expensive operations
- Accessibility agent for UI changes
- Documentation agent for public API changes

## Requirements

- Git repository with GitHub remote
- GitHub CLI (`gh`) installed and authenticated (`gh auth login`)
- CLAUDE.md files are optional but significantly improve guideline compliance checking

## Best Practices

- Keep CLAUDE.md files specific and actionable — vague guidelines produce vague reviews
- Run on all non-trivial PRs; the eligibility check auto-skips obvious cases
- Treat agent findings as a starting point, not a final verdict
- Update CLAUDE.md based on recurring review patterns to improve future runs
- Split very large PRs to keep agent context focused and reviews accurate
