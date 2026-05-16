# Git Cleanup Review

Theo `homeservicerules`, khong xoa file/folder khi chua co danh sach danh gia va user xac nhan.

## Current Finding

| Area | Current status | Assessment | Recommended action |
|---|---:|---|---|
| `Fe/` | 123 tracked deletions in `git status` | Day la casing migration cu sang `fe/`, nhung chua duoc xac nhan cleanup | Chua xoa/stage. Can user xac nhan truoc khi finalize |
| `fe/wed` | Untracked canonical web app | Path web chinh thuc theo plan va Docker compose | Giu lai, stage sau khi cleanup duoc xac nhan |
| `fe/mobile` | Untracked canonical provider mobile app | Path mobile chinh thuc theo plan | Giu lai, stage sau khi cleanup duoc xac nhan |
| `reports/perf/*.html|*.json` | Generated perf reports | Khong can commit cho deploy, chi giu neu can nop minh chung | `.gitignore` da ignore generated outputs, giu `.gitkeep` |
| `.env`, `.env.local` | Local secret/config | Khong duoc commit | Da co ignore; dung env example thay the |

## Files/Groups Requiring Confirmation Before Delete/Stage

| Group | Examples | Proposed decision |
|---|---|---|
| Old `Fe/` tracked tree | `Fe/app/*`, `Fe/components/*`, `Fe/package.json` | Remove old casing from Git only after user confirms |
| Canonical `fe/wed` | `fe/wed/app`, `fe/wed/components`, `fe/wed/package.json` | Keep and stage as web app |
| Canonical `fe/mobile` | `fe/mobile/app`, `fe/mobile/features`, `fe/mobile/package.json` | Keep and stage as provider mobile app |

## Confirmation Needed

Truoc khi thuc hien cleanup, can user xac nhan cau lenh tuong duong:

```powershell
git rm -r --cached Fe
git add fe/wed fe/mobile
```

Khong chay cac lenh tren neu chua co xac nhan ro rang.

Skill da dung: homeservicerules
