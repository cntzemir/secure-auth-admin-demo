# GitHub Release Checklist

Use this before pushing the repository.

## Repository safety
- [ ] `.env` is excluded and not staged
- [ ] `data/*.json` and other runtime data files are excluded and not staged
- [ ] no secrets appear in screenshots
- [ ] no personal browser tabs or sensitive bookmarks are visible in screenshots

## Project quality
- [ ] `npm install` works cleanly
- [ ] `npm run seed` works cleanly
- [ ] `npm start` opens the app successfully
- [ ] login, logout, dashboard, admin, and logs flows still work
- [ ] README matches the current project behavior

## Presentation
- [ ] screenshots are added to the `screenshots/` folder
- [ ] README image links render correctly on GitHub
- [ ] commit messages are reasonably clean
- [ ] repository name and short description are set
- [ ] optional: add topics such as `nodejs`, `express`, `security`, `authentication`, `rbac`
