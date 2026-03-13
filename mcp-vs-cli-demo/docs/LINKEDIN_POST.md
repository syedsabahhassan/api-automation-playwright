# LinkedIn Post — Project Announcement

## Primary Version (Recommended)

---

I've been seeing a lot of takes on Playwright MCP lately — "just describe your tests in plain English," "no more writing selectors." Some of it is real. A lot of it skips the hard parts.

So I built something to find out for myself.

I took a loan application portal — login, form submission, reference number, dashboard — and implemented the same three test scenarios twice: once using the MCP/AI-driven approach, once using standard Playwright with TypeScript and page objects.

Here's what I actually found:

**MCP wins on readability.** The test literally says "fill in a personal loan for $15,000 over 36 months" and someone who has never written a test can understand it. That's not nothing.

**CLI wins on everything you need for CI.** Deterministic. Fast. Debuggable. When it fails, you get a Playwright trace with the exact line, element, and page state. When MCP fails, you get "agent could not complete the action." Good luck with that at midnight when production is down.

**The hybrid scenario settled it for me.** When a test needs to: seed data via API → verify it in the UI → clean up via API — you end up writing code for the API parts anyway. So you have a mixed test: code + AI + code. That's harder to maintain than just writing it all in TypeScript.

My honest take: MCP is a useful authoring tool. Let it draft tests quickly. Then refactor the output into proper page objects and typed assertions that you can actually trust in CI. The two approaches aren't in competition — they're different tools for different parts of the workflow.

I've put together the full comparison: side-by-side test code, a trade-off matrix covering setup, debugging, CI friendliness, team adoption, and cost — and the reasoning behind each call.

Repo and docs are linked in the comments. Would genuinely be curious to hear from anyone who's running MCP in a real test suite — what's your experience been?

---

## Shorter Version (for reshares or follow-up posts)

---

I ran the same Playwright test scenario through both MCP (AI-driven) and standard CLI (TypeScript, page objects). Three scenarios, same mock server, same application.

TL;DR:
- MCP is readable and fast to write
- CLI is deterministic and debuggable
- The hybrid scenario (API setup → UI → API teardown) is where MCP visibly struggles

The strongest result wasn't "one is better." It was that they work well as different stages of the same workflow: MCP to draft, CLI to run in production.

Full comparison matrix + code in comments.

---

## Hashtags to Include

#QA #TestAutomation #Playwright #SoftwareTesting #SDET #AI #TestingStrategy

---

## Tips on Posting

**Best time:** Tuesday or Wednesday, 8–10am local time
**Format:** Text post (no image needed — this is a technical audience that reads)
**Follow-up comment:** Post a comment with the repo link, the comparison matrix link, and optionally a screenshot of the side-by-side test files
**Engage early:** Reply to the first 3–5 comments within the first hour to boost reach

**What NOT to include:**
- Generic phrases like "thrilled to share" or "excited to announce"
- Claims that either tool is definitively "the future"
- Long bullet lists (the above works because it uses bullets sparingly)
- Hashtag spam (5–7 relevant tags is the right amount)

**What works:**
- Asking a genuine question at the end ("what's your experience?")
- Being honest about limitations of both approaches
- Naming the specific scenario (loan application, not "a web app")
- The word "honestly" in the framing — QA engineers respond well to practitioners who don't oversell
