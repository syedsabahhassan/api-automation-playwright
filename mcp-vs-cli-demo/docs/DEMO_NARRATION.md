# Demo Narration Scripts

Three scripts for different contexts. All written to sound like a working engineer talking to peers — not a product demo.

---

## 1. LinkedIn Short Video Walkthrough (60–90 seconds)

Use this when recording a screen-share or talking-head video to post on LinkedIn.

---

"I want to show you something I've been working on — a comparison of two ways to write Playwright tests, using the same loan application flow as the test subject.

On the left I've got the standard CLI approach: TypeScript, page objects, explicit selectors. On the right, the MCP approach — where instead of writing code, you describe what you want in plain English and the AI figures out how to execute it.

Let me show you what the same test looks like in both.

CLI version: [show loan-application.cli.spec.ts] I navigate to the portal, fill the form using a typed data object, submit, and then — this part is important — I also verify the API response. The UI says the application was created. The API confirms it actually exists in the backend with the right data.

MCP version: [show loan-application.mcp.spec.ts] Same scenario, but written as natural language. 'Navigate to the loan portal. Fill in a personal loan for $15,000. Submit.' Much more readable.

Here's where it gets interesting: that hybrid step — UI submission then API verification — is awkward in MCP. The AI can navigate the form, but it can't cleanly capture a reference number from the UI, call the API with it, and assert the response is correct. You end up writing code for the API parts anyway. Which raises the question: why not just write code throughout?

My conclusion after building both: MCP is a genuinely useful authoring tool. Use it to get a first draft quickly. Use CLI as the foundation you run in CI. The two aren't really in competition — they're different tools for different parts of the job.

The full comparison, including a trade-off matrix and the actual test code, is linked in the comments."

---

## 2. Interview or Meetup Explanation (3–5 minutes)

Use this when asked to walk through the project in a technical interview or at a QA meetup.

---

"So the background on this project — I already had an API automation suite built with Playwright and TypeScript. It covers the full Loan Applications API: authentication, CRUD operations, contract testing with JSON Schema, the works. CI pipeline, parallel execution, the whole setup.

I wanted to extend that into a UI demo, but I also wanted to use it as a vehicle to compare two approaches that I kept seeing debated in the testing community: Playwright MCP versus standard CLI.

The way I set it up was deliberate. I didn't want a fair comparison in a vacuum — I wanted both approaches running against the exact same application, the same three test scenarios, the same mock server. So you can see the trade-offs without any confounding variables.

The scenario is a loan application portal. Applicant logs in, fills out a form, submits it, gets a reference number. Simple enough to understand quickly, complex enough to surface real differences.

[Describe what's interesting about the comparison]

The first thing that struck me was how clean the MCP tests look. Five instructions describing what to do. Someone who's never written a test in their life could read that and understand the intent. That's real. That's not hype.

But then we hit the hybrid scenario — where I need to seed data via the API, navigate the UI to verify it appeared on the dashboard, then clean up via API. That's three steps: API, UI, API. The MCP agent can handle the UI step, but the setup and teardown are code. So I ended up with a mixed test — code for some steps, natural language for others — which is actually harder to maintain than just writing it all in TypeScript.

The CLI test for the same scenario is 20-something lines. Every step is typed, every assertion is precise, every cleanup is guaranteed because it runs in a `finally` block. When it fails in CI, the Playwright trace shows me exactly which line, exactly which element, exactly what the page looked like at the moment of failure.

When the MCP test fails — especially in real mode with a live AI — the error message is 'agent could not complete the action.' That's it. You're debugging an AI decision, not a piece of code.

So my actual recommendation is: use MCP as a test drafting tool. Let it generate a first pass. Then take that output, review it, refactor it into proper page objects and typed assertions, and run it in CI as standard Playwright code. The two approaches aren't really competing — they're different parts of the same workflow.

The comparison matrix in the docs breaks down every dimension with specific examples from the actual test code. That's probably the most useful artifact from the project."

---

## 3. LinkedIn Post Companion (Short Caption for Video)

Use this as the caption when posting the video demo on LinkedIn.

---

"I ran the same loan application test scenario through both Playwright MCP and standard Playwright CLI, and documented what I learned.

Quick summary: MCP is fast to write and readable. CLI is deterministic, debuggable, and CI-friendly. The hybrid scenario (API + UI + API) is where the difference is most visible — and most honest.

Not a 'AI replaces test code' take. Not a 'you still have to write everything yourself' take either.

Just a side-by-side with real trade-offs, real code, and a comparison matrix you can actually use.

Full repo and docs in comments."

---

## Notes on Delivery

Keep it concrete. The moment you say "paradigm shift" or "game changer" you lose the engineers who have heard those phrases too many times. The audience for this content is working QA engineers and SDETs who are trying to make a real tool decision. They want to know: does it run reliably? What happens when it breaks? Is it worth the setup?

Answer those questions directly and you will connect with exactly the right audience.

When showing code on screen, pause long enough for viewers to read a few lines. Point to the specific comparison — "notice that the CLI test adds this API assertion on line 28, which the MCP test cannot do" — rather than just scrolling through both files.

The strongest moment in the demo is the hybrid scenario, because it reveals the limitation most honestly. Do not skip it.
