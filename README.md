# Khayyam Timer

A simple stopwatch that lives in your VS Code status bar. Start it when you begin a task, pause it when you stop, and see exactly how much time you spent on each **project** and **git branch**.

No more guessing when you started a task or how long it really took.

## Features

- **Status bar stopwatch**: `⏱ 00:12:34 ▶ ✓ ↻ 📄`
  - Timer display
  - Play / Pause button
  - **Finish task** button (✓) — only shown while running (see below)
  - Reset button (sets the timer back to zero)
  - Report button
- **Per-branch tracking**: the extension reads your current git branch. If you switch branches while the timer is running, the time so far is saved to the old branch, counting continues on the new one, and a notification pops up showing how long you just spent on the branch you left (e.g. *"feature/login → +00:30:00 (total on this branch: 01:15:00). Switched to main."*).
- **Per-project tracking**: the project name is the name of your workspace folder.
- **Finish task, with an optional note**: click ✓ while the timer is running to stop it, optionally type what you worked on, then immediately pick an export format (txt / csv / pdf) for just that task's time. Once the file is saved, that task's entries are removed from history — the next ▶ starts completely fresh. If you cancel the save dialog, nothing is deleted; you can still export it later from 📄.
- **Report, your choice of format**: export everything you tracked as Text (`.txt`), Excel (`.csv`), or PDF (`.pdf`) — grouped by project/branch, by day, and as a list of individual sessions, descriptions included.
- **Auto-pause on inactivity**: if there's no activity inside VS Code (typing, clicking, scrolling, switching tabs, regaining focus) for 5 minutes while the timer is running, it pauses itself and shows `(idle)` — then resumes automatically the moment you're active again, picking up exactly where it left off. A manual pause is never auto-resumed. Change the threshold with the `khayyamTimer.idleMinutes` setting.
- **Survives restarts**: progress is saved when you pause, reset, or close VS Code.

## Usage

1. Click **▶** in the status bar to start the timer.
2. Work on your task. Switching git branches is handled automatically — you'll get a notification with the time just logged on the branch you left.
3. Click **⏸** to pause for a break (the timer keeps its total, ready to resume).
4. Click **✓** when the task is actually done. The timer stops, you can optionally type a short note on what you did, and then a menu pops up to pick the export format — **Text**, **Excel (CSV)**, or **PDF**. Once you save the file, that task's time is cleared from history and the timer resets to zero for the next task.
5. Click **↻** instead if you just want to reset the timer without exporting or clearing anything.
6. Click **📄** any time to export whatever is currently in history, without finishing a task or clearing anything.

You can also run everything from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
| --- | --- |
| `Khayyam Timer: Start / Pause` | Toggle the timer |
| `Khayyam Timer: Reset` | Set the timer to zero (history is kept) |
| `Khayyam Timer: Finish Task (stop & add description)` | Stop the timer, optionally add a note, export that task's report, then clear it and reset |
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

The Excel (`.csv`) export has the same breakdown as rows in a spreadsheet, now including a **Description** column, and opens directly in Excel or Google Sheets. The PDF export mirrors the same layout as a formatted document.

> **Note:** the PDF export uses a built-in Latin font, so project or branch names in Persian/Arabic script won't render correctly there — use the Text or Excel export for those instead.

## A note on the auto-pause feature

VS Code extensions can only see activity *inside the editor* — there is no API for system-wide keyboard or mouse events. So "inactivity" here means no typing, clicking, scrolling, or tab/focus changes in VS Code itself, not literally no input anywhere on your computer. If you're reading code without touching anything, or working in another app with VS Code in the background, it will still auto-pause after the configured number of minutes. That's the intended behavior for this feature — it's meant to catch "I forgot the timer was running," not to track whether you're at your keyboard.

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
- وقتی تایمر روشن است، دکمه‌ی ✓ هم ظاهر می‌شود: با زدنش تایمر کامل متوقف می‌شود، می‌توانید به‌صورت اختیاری بنویسید روی چه کاری وقت گذاشتید، و بلافاصله یک منو باز می‌شود تا فرمت خروجی (txt / csv / pdf) را انتخاب کنید. به‌محض ذخیره‌ی فایل، زمان همان تسک از تاریخچه پاک می‌شود و تایمر برای تسک بعدی از صفر شروع می‌شود. اگر پنجره‌ی ذخیره را لغو کنید، چیزی پاک نمی‌شود و بعداً می‌توانید از دکمه‌ی 📄 همان زمان را بگیرید
- دکمه‌ی ↻ فقط تایمر را صفر می‌کند، بدون خروجی گرفتن و بدون پاک کردن تاریخچه
- وقتی تایمر روشن است و برنچ گیت را عوض می‌کنید، یک نوتیفیکیشن نشان می‌دهد چقدر روی برنچ قبلی وقت گذاشته‌اید و مجموع کل زمان شما روی همان برنچ چقدر است
- دکمه‌ی 📄 برای گرفتن گزارش؛ می‌توانید فرمت خروجی را انتخاب کنید: متنی (txt)، اکسل (csv) یا PDF
- برای نام‌های فارسی، خروجی PDF فونت لاتین دارد و فارسی را درست نشان نمی‌دهد؛ برای این حالت از خروجی txt یا csv استفاده کنید
- اگر تایمر روشن باشد و به مدت ۵ دقیقه هیچ فعالیتی داخل VS Code (تایپ، کلیک، اسکرول، تغییر تب، برگشتن فوکوس) رخ ندهد، تایمر خودش موقتاً متوقف می‌شود و کنارش `(idle)` نشان داده می‌شود. به‌محض اولین فعالیت، دقیقاً از همان‌جا ادامه پیدا می‌کند. این عدد ۵ دقیقه با تنظیم `khayyamTimer.idleMinutes` قابل تغییر است. توجه: این قابلیت فقط فعالیت داخل خود VS Code را می‌بیند، نه کل سیستم — اگر مشغول خواندن کد باشید یا سراغ برنامه‌ی دیگری بروید، همچنان بعد از این مدت متوقف می‌شود
- تمام اطلاعات فقط روی سیستم خودتان ذخیره می‌شود
