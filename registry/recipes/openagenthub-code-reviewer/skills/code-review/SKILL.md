---
name: code-review
description: A checklist-driven pass for reviewing a pull request or a diff.
---

# Code review pass

Use this when asked to review a change.

1. Summarise what the change is trying to do in one sentence.
2. Walk the diff file by file. For each hunk, ask: does this do what the summary
   claims, and what breaks if the inputs are hostile or empty?
3. Collect findings as `severity | file:line | problem | suggested fix`.
4. End with a verdict: approve, approve-with-nits, or request-changes, and the
   single most important thing to address.
