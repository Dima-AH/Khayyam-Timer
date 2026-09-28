# Khayyam Timer

A simple stopwatch that lives in your VS Code status bar. Start it when you begin a task, pause it when you stop, and see exactly how much time you spent on each **project** and **git branch**.

No more guessing when you started a task or how long it really took.

## Features

- **Status bar stopwatch**: `⏱ 00:12:34 ▶ ↻ 📄`
  - Timer display
  - Play / Pause button
  - Reset button (sets the timer back to zero)
  - Report button
- **Per-branch tracking**: the extension reads your current git branch. If you switch branches while the timer is running, the time so far is saved to the old branch, counting continues on the new one, and a notification pops up showing how long you just spent on the branch you left (e.g. *"feature/login → +00:30:00 (total on this branch: 01:15:00). Switched to main."*).
- **Per-project tracking**: the project name is the name of your workspace folder.
- **Report, your choice of format**: export everything you tracked as Text (`.txt`), Excel (`.csv`), or PDF (`.pdf`) — grouped by project/branch, by day, and as a list of individual sessions.
- **Survives restarts**: progress is saved when you pause, reset, or close VS Code.

## Usage

1. Click **▶** in the status bar to start the timer.
2. Work on your task. Switching git branches is handled automatically — you'll get a notification with the time just logged on the branch you left.
3. Click **⏸** when you finish or take a break.
4. Click **↻** to reset the timer for the next task. Your history is kept.
5. Click **📄** to export a report, then pick a format from the menu that pops up: **Text**, **Excel (CSV)**, or **PDF**.

You can also run everything from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
| --- | --- |
| `Khayyam Timer: Start / Pause` | Toggle the timer |
| `Khayyam Timer: Reset` | Set the timer to zero (history is kept) |
| `Khayyam Timer: Export Report (txt / csv / pdf)` | Save a report, choosing the format |
| `Khayyam Timer: Clear History` | Delete all recorded history |

## Example report

```
Khayyam Timer REPORT
Generated: 2026-09-28 18:30:00
==================================================
Total tracked: 05:12:33

BY PROJECT / BRANCH
--------------------------------------------------
my-app  (05:12:33)
  - main                           01:00:00
  - feature/login                  04:12:33

BY DAY
--------------------------------------------------
2026-09-28  (05:12:33)
  - my-app / main                           01:00:00
  - my-app / feature/login                  04:12:33

SESSIONS
--------------------------------------------------
2026-09-28 10:00:00 -> 11:00:00  01:00:00  my-app / main
2026-09-28 11:05:00 -> 15:17:33  04:12:33  my-app / feature/login
```

The Excel (`.csv`) export has the same breakdown as rows in a spreadsheet, and opens directly in Excel or Google Sheets. The PDF export mirrors the same layout as a formatted document.

> **Note:** the PDF export uses a built-in Latin font, so project or branch names in Persian/Arabic script won't render correctly there — use the Text or Excel export for those instead.

## Privacy

Everything is stored locally on your computer inside VS Code's own storage. Nothing is sent anywhere, and the extension makes no network requests.

## Notes

- If a folder is not a git repository, the time is recorded under the branch name `no-git`.
- VS Code does not allow right-click menus on status bar items, so the report is available through the 📄 button and the Command Palette.

## Feedback

Found a bug or have an idea? Please open an issue on the [GitHub repository](https://github.com/Dima-AH/Khayyam-Timer/issues).

## License

[MIT](LICENSE)

---

**Khayyam Timer** یک کرنومتر ساده در نوار پایین VS Code است. وقتی کار روی یک تسک را شروع می‌کنید تایمر را روشن می‌کنید و بعد از تمام شدن آن را متوقف می‌کنید. افزونه به‌صورت خودکار ثبت می‌کند که روی کدام پروژه و کدام برنچ گیت چقدر زمان گذاشته‌اید.

- دکمه‌ی ▶ / ⏸ برای شروع و توقف
- دکمه‌ی ↻ برای صفر کردن تایمر (تاریخچه پاک نمی‌شود)
- وقتی تایمر روشن است و برنچ گیت را عوض می‌کنید، یک نوتیفیکیشن نشان می‌دهد چقدر روی برنچ قبلی وقت گذاشته‌اید و مجموع کل زمان شما روی همان برنچ چقدر است
- دکمه‌ی 📄 برای گرفتن گزارش؛ می‌توانید فرمت خروجی را انتخاب کنید: متنی (txt)، اکسل (csv) یا PDF
- برای نام‌های فارسی، خروجی PDF فونت لاتین دارد و فارسی را درست نشان نمی‌دهد؛ برای این حالت از خروجی txt یا csv استفاده کنید
- تمام اطلاعات فقط روی سیستم خودتان ذخیره می‌شود
