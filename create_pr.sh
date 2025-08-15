#!/bin/bash
set -euo pipefail

REPO="EAwangya/argocd-kubernetes"
BRANCH="hotfix"
BASE="main"
GITHUB_TOKEN=GITHUB_TOKEN 

echo "Checking if a pull request already exists from '$BRANCH' to '$BASE'..."

PR_LIST=$(curl -s \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${REPO}/pulls?state=open&head=${BRANCH}&base=${BASE}")

PR_COUNT=$(echo "$PR_LIST" | jq 'length')

if [[ "$PR_COUNT" -gt 0 ]]; then
    PR_NUMBER=$(echo "$PR_LIST" | jq -r '.[0].number')
    PR_URL=$(echo "$PR_LIST" | jq -r '.[0].html_url')
    echo "Pull request already exists: #$PR_NUMBER → $PR_URL — skipping creation."
    exit 0
fi

echo "No existing PR found — creating a new one..."
CREATE_RESPONSE=$(curl -s -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${REPO}/pulls" \
  -d "{
        \"title\":\"Amazing new feature - Application updated to v${TAG}\",
        \"body\":\"Please pull these awesome changes in!\",
        \"head\":\"${BRANCH}\",
        \"base\":\"${BASE}\"
      }")

NEW_PR_URL=$(echo "$CREATE_RESPONSE" | jq -r '.html_url')
if [[ "$NEW_PR_URL" != "null" ]]; then
    echo "Pull request created: $NEW_PR_URL"
else
    echo "Failed to create PR. Response:"
    echo "$CREATE_RESPONSE"
    exit 1
fi