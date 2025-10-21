module.exports = {
  "*.{js,jsx,ts,tsx}": ["oxlint --fix", "prettier --write", "git add"],
  "*.{json,md,yaml,yml}": ["prettier --write", "git add"],
}
