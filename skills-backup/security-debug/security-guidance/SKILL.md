---
name: security-guidance
description: Real-time security reminder hook that intercepts file edits and warns about potential vulnerabilities before they are written. Use this skill when the user is editing code that may contain command injection, XSS, unsafe eval, pickle deserialization, GitHub Actions injection, or other dangerous patterns. Triggers automatically on Edit, Write, or MultiEdit tool calls before content is saved.
license: Apache-2.0
---

This skill acts as a PreToolUse security guard — it intercepts file write operations, scans the incoming content and file path against known vulnerability patterns, and surfaces a targeted warning before the edit is committed. Each warning fires only once per file per session to avoid noise.

The agent receives a file path and new content about to be written. It checks both against a catalog of security patterns and, if a match is found, emits a reminder before proceeding.

## Security Thinking

Before allowing any file edit to proceed, evaluate:
- **File path**: Does the destination path indicate a sensitive context (e.g. GitHub Actions workflow)?
- **Content delta**: Does the new content introduce a dangerous pattern — not pre-existing code, but the change itself?
- **Context**: Is the dangerous construct being used safely (e.g. static args only, trusted input, sanitized output) or recklessly?
- **Frequency**: Has this specific warning already been shown for this file in this session? If yes, skip — don't repeat.

**CRITICAL**: Warn once, clearly, with a concrete safe alternative. Never block silently. Never repeat the same warning for the same file twice in one session.

## Security Pattern Catalog

Intercept edits that introduce any of the following patterns:

---

### GitHub Actions Workflow Injection
**Trigger**: File path contains `.github/workflows/` and ends with `.yml` or `.yaml`

**Risk**: Untrusted input (issue titles, PR descriptions, commit messages) used directly in `run:` commands enables remote code execution by attackers who control those values.

**Warning to emit**:
```
You are editing a GitHub Actions workflow file. Be aware of these security risks:

1. Command Injection: Never use untrusted input (like issue titles, PR descriptions,
   commit messages) directly in run: commands without proper escaping.
2. Use environment variables: Instead of ${{ github.event.issue.title }},
   use env: with proper quoting.

UNSAFE:
  run: echo "${{ github.event.issue.title }}"

SAFE:
  env:
    TITLE: ${{ github.event.issue.title }}
  run: echo "$TITLE"

High-risk inputs: github.event.issue.body, github.event.pull_request.title,
github.event.pull_request.body, github.event.comment.body,
github.event.head_commit.message, github.head_ref, and similar user-controlled fields.
```

---

### child_process.exec / execSync (Node.js)
**Trigger**: Content contains `child_process.exec`, `exec(`, or `execSync(`

**Risk**: Shell-interpolated commands with user input allow command injection.

**Warning to emit**:
```
⚠️ Security Warning: child_process.exec() can lead to command injection vulnerabilities.

Instead of:
  exec(`command ${userInput}`)

Use execFile with an argument array:
  execFile('command', [userInput])

execFile prevents shell injection by passing arguments directly without shell interpretation.
Only use exec() if you explicitly need shell features and input is guaranteed safe.
```

---

### new Function() — Dynamic Code Evaluation
**Trigger**: Content contains `new Function`

**Warning to emit**:
```
⚠️ Security Warning: new Function() with dynamic strings can lead to code injection.
Consider alternatives that don't evaluate arbitrary code.
Only use new Function() if dynamic code evaluation is explicitly required.
```

---

### eval() — Arbitrary Code Execution
**Trigger**: Content contains `eval(`

**Warning to emit**:
```
⚠️ Security Warning: eval() executes arbitrary code and is a major security risk.
Use JSON.parse() for data parsing, or redesign to avoid code evaluation entirely.
Only use eval() if you truly need to evaluate arbitrary dynamic code.
```

---

### dangerouslySetInnerHTML (React)
**Trigger**: Content contains `dangerouslySetInnerHTML`

**Warning to emit**:
```
⚠️ Security Warning: dangerouslySetInnerHTML can cause XSS if used with untrusted content.
Sanitize all content with a library like DOMPurify before rendering,
or use safe React alternatives that don't inject raw HTML.
```

---

### document.write()
**Trigger**: Content contains `document.write`

**Warning to emit**:
```
⚠️ Security Warning: document.write() is exploitable for XSS and has performance issues.
Use DOM methods like createElement() and appendChild() instead.
```

---

### innerHTML Assignment
**Trigger**: Content contains `.innerHTML =` or `.innerHTML=`

**Warning to emit**:
```
⚠️ Security Warning: Setting innerHTML with untrusted content enables XSS.
Use textContent for plain text. If HTML is required, sanitize first with DOMPurify
or an equivalent HTML sanitizer library.
```

---

### pickle Deserialization (Python)
**Trigger**: Content contains `pickle`

**Warning to emit**:
```
⚠️ Security Warning: pickle with untrusted data allows arbitrary code execution.
Use JSON or another safe serialization format instead.
Only use pickle when explicitly required and input is fully trusted.
```

---

### os.system (Python)
**Trigger**: Content contains `os.system` or `from os import system`

**Warning to emit**:
```
⚠️ Security Warning: os.system() should only be called with static, hardcoded arguments.
Never pass user-controlled input to os.system().
Use subprocess.run() with a list of arguments for safer command execution.
```

---

## Hook Behavior

### Firing logic
1. Intercept every Edit, Write, or MultiEdit operation before it executes
2. Extract the target file path and the new content being written
3. Check file path against path-based patterns (GitHub Actions)
4. Check new content against substring-based patterns
5. If a match is found:
   - Look up session state — has this `(file_path, rule_name)` pair already been warned?
   - If **not warned yet**: emit warning, record in session state, block the edit for review
   - If **already warned**: allow the edit to proceed silently
6. If no match: allow the edit to proceed immediately

### Session state
Track shown warnings as a set of `"{file_path}-{rule_name}"` keys scoped to the current session. Persist to `~/.{agent}/security_warnings_state_{session_id}.json`. Clean up state files older than 30 days periodically (roughly 10% of runs).

### Exit behavior
- **Warning triggered (first time)**: emit reminder to stderr, exit with blocking code (do not proceed with write)
- **Warning already shown**: exit 0 (allow)
- **No match**: exit 0 (allow)
- **Parse error / missing input**: exit 0 (fail open — never silently block valid edits)

### Environment override
Respect `ENABLE_SECURITY_REMINDER=0` to disable all warnings (useful for automated pipelines or trusted environments).

## Best Practices

- **Don't suppress warnings permanently** — if a pattern is genuinely safe in context, add an inline comment explaining why, and the next edit will pass through silently after the first acknowledgment
- **Update the catalog** for project-specific patterns — add custom rules for internal utilities, proprietary serialization formats, or framework-specific XSS vectors
- **Pair with static analysis** — this hook catches patterns at edit time; complement it with a linter or SAST tool in CI for broader coverage
- **Keep warnings actionable** — each message should show an unsafe example and a safe alternative, not just flag the problem
