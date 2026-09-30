# Changelog

## 0.0.6

- **Auto-pause on inactivity.** If the timer is running and there's no activity inside VS Code (typing, clicking, scrolling, switching tabs, or the window regaining focus) for 5 minutes, the timer pauses itself and shows `(idle)` in the status bar. As soon as you're active again, it resumes automatically from where it left off — no time is lost, none is falsely counted either. A manual pause is never auto-resumed. The 5-minute threshold is configurable via the `khayyamTimer.idleMinutes` setting.

## 0.0.5

- **Finish task now exports automatically.** Clicking ✓ immediately opens the format picker (txt / csv / pdf) for just that task's time. Once the file is actually saved, those entries are removed from history — so the next time you click ▶, it starts with a clean slate. If you cancel the save dialog, nothing is deleted and you can still export it later from 📄.

## 0.0.4

- Reverted the Excel export back to `.csv` (removed the `exceljs` dependency) — same clean, spreadsheet-ready layout as 0.0.2, now with a **Description** column populated by the Finish task feature.

## 0.0.3

- New **Finish task** button (✓), shown only while the timer is running. Stops the timer, optionally asks what you worked on, and tags that description onto every entry recorded for the task — then resets to zero for the next one.
- Excel export is now a real `.xlsx` workbook (via `exceljs`) instead of CSV: a clean **Sessions** sheet (one row per tracked segment, one field per column, filterable/sortable) plus **By Project & Branch** and **By Day** summary sheets, with a bold header row and frozen top row.

## 0.0.2

- Notification when you switch git branches while the timer is running, showing time just spent on the branch you left and its running total
- Export now lets you pick the report format: Text (.txt), Excel (.csv), or PDF (.pdf)

## 0.0.1

- Initial release
- Status bar stopwatch with start/pause and reset buttons
- Automatic tracking per project and git branch
- Export a plain-text report (by project/branch, by day, and per session)
