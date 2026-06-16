# Backend Agent Profiles

Use these profiles to choose the right model tier for backend tasks without wasting tokens.

These files are prompt/profile templates. They do not switch the runtime model automatically.

## Recommended Routing

| Profile | Model tier | Use for |
| --- | --- | --- |
| `be-small.md` | Small / fast | Reading, searching, docs, formatting, command summaries |
| `be-coder.md` | Medium coding | Normal backend implementation, tests, focused refactors |
| `be-architect.md` | Strong reasoning | Booking, wallet/payment, Prisma migrations, auth/RBAC, transaction bugs |
| `be-research.md` | Research capable | Supabase, Prisma, NestJS, VNPay, OpenAI, deployment docs |

## Usage

1. Pick the profile that matches the task risk.
2. Select the matching model manually in your AI tool.
3. Use the profile content as the agent/system instruction.
4. Include only targeted files, diffs, and command output.

Default choice: `be-coder.md`.
