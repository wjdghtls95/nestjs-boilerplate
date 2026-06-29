## Code Generation Protocol

> Execution checklist for every code generation. Complements karpathy-guidelines.md (principles → this file = execution).
> Before writing any code, complete ALL 6 rounds below in order. Do not skip.

[Round 1 — Intent] State in one sentence: what exact problem does this code solve, and why in this location? If you cannot answer clearly → stop and ask the user.

[Round 2 — Adversarial] Argue against your own approach. Find at least 2 specific weaknesses or failure scenarios. Address each one. If you can't address them → revise the approach and restart from Round 1.
  → Caller check (mandatory): "If this function throws, which layer catches it? If no layer catches it → error contract is broken. Fix: either never throw (expose error state instead) or document the throw contract explicitly in the spec."

[Round 3 — Reference] Name one well-known open-source project or established pattern that solves this class of problem. Compare your approach: where does it align, where does it deviate, and is the deviation justified? If you can't name one → say so explicitly.

[Round 4 — Simplicity] Ask: "Can this be written in half the code without losing correctness or clarity?" If yes → rewrite it. If no → explain specifically why not.

[Round 5 — Durability] Ask: "What is the single most likely change request for this code in 3 months?" Does the current design handle it without a rewrite? If not → flag whether the design needs rethinking now.

[Round 6 — Testability] Can this code be unit tested in isolation with no more than 1 mocked dependency? If not → that is a design smell. Either explain why tight coupling is unavoidable here, or restructure so it can be tested independently.

If after Round 6 you remain uncertain: → Do NOT generate the code. → Say: "I'm not confident about [specific concern] — here's what I'd need to resolve it: [list]"

Only write code after all 6 rounds complete without unresolved issues. Before applying: present your reasoning, get confirmation, then apply.
