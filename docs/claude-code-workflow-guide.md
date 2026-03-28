# Claude Code & ClaudeKit Workflow Guide

Practical guide for using Claude Code effectively — from beginner to advanced.

---

## Quick Reference: Which Workflow?

```
Small change (< 30 min)?
  YES --> /cook "task"
  NO  --> Know the approach?
            YES --> /plan "task" --> /cook plan.md
            NO  --> /brainstorm "idea"
                      --> /plan --hard "task" --> /cook plan.md
                        --> Critical system (auth, payments, data)?
                              YES --> add /plan red-team + /plan validate
```

---

## Workflows (Simplest to Most Thorough)

### Level 1: Quick Cook (small tasks, bug fixes)

```
/cook "your task"
```

Cook handles everything internally: scout -> plan -> implement -> test -> review.
Use for: typo fixes, small features, simple refactors, one-file changes.

### Level 2: Plan + Cook (standard features)

```
/plan "your feature"          # Research + create detailed plan
/cook path/to/plan.md         # Execute the plan
```

Use for: multi-file features, moderate complexity, when you know what to build.

### Level 3: Brainstorm + Plan + Cook (complex/uncertain features)

```
/brainstorm "your idea"       # Explore 2-3 approaches, debate trade-offs
  (ends with "Create plan?" -> Yes)
/plan --hard "your feature"   # Deep research + auto red-team + validate
/cook path/to/plan.md         # Execute the plan
```

Use for: new systems, architecture decisions, when unsure about approach.

### Level 4: Maximum Rigor (critical systems)

```
/brainstorm "your idea"             # Explore & debate
/plan --hard "your feature"         # Deep plan (includes red-team + validate)
/plan red-team path/to/plan.md      # Extra adversarial review
/plan validate path/to/plan.md     # Extra critical questions interview
/cook path/to/plan.md               # Execute
```

Use for: auth, payments, data migrations, security-critical code.

---

## What Each Step Does

| Step | Skill | Purpose | Output |
|------|-------|---------|--------|
| **Brainstorm** | `/brainstorm` | Explore approaches, debate trade-offs, challenge assumptions. Does NOT write code. | Summary report with recommended approach |
| **Plan** | `/plan` | Research codebase, design architecture, create step-by-step implementation plan | `plan.md` + phase files in `plans/` directory |
| **Red-team** | `/plan red-team` | Adversarial review — pokes holes in the plan, finds weaknesses | Feedback + plan improvements |
| **Validate** | `/plan validate` | Critical questions interview to verify assumptions | Validated/revised plan |
| **Cook** | `/cook` | Implement code, run tests, review quality | Working code + test results |

---

## Plan Modes

| Flag | Research | Red Team | Validate | Best For |
|------|----------|----------|----------|----------|
| `--fast` | Skip | Skip | Skip | Simple tasks, clear requirements |
| `--hard` | 2 researchers | Yes | Optional | Complex features, uncertain approach |
| `--parallel` | 2 researchers | Yes | Optional | Large multi-component features |
| `--two` | 2+ researchers | After selection | After selection | Comparing two different approaches |
| (default) | Auto-detect | Auto-detect | Auto-detect | Let Claude decide based on complexity |

## Cook Modes

| Flag | Research | Testing | Review Gates | Best For |
|------|----------|---------|--------------|----------|
| `--interactive` | Yes | Yes | User approval each step | Default, recommended |
| `--fast` | Skip | Yes | User approval each step | Clear requirements |
| `--auto` | Yes | Yes | Auto if score >= 9.5 | Trusted, well-planned tasks |
| `--parallel` | Optional | Yes | User approval each step | Multi-component features |
| `--no-test` | Yes | Skip | User approval each step | Prototyping only |

---

## Beginner Progression

| Level | When | Workflow | Focus On |
|-------|------|---------|----------|
| Day 1 | Learning | Ask questions + `/cook "small task"` | Understanding what Claude can do |
| Week 1 | Building | `/plan` -> `/cook` -> `/git cm` | Planning before coding |
| Month 1 | Proficient | `/brainstorm` -> `/plan --hard` -> `/cook` | Design thinking before planning |
| Advanced | Expert | Full Level 4 workflow + parallel agents | Maximum quality + speed |

---

## Essential Tips

### Prompting

- **Be specific**: "Add JWT auth to `/api/users` endpoint" > "Add auth"
- **Reference files**: Mention file names directly so Claude reads them
- **Paste real errors**: Full error message, not "it doesn't work"
- **Include verification**: "Run tests after implementing" or "Build should succeed"
- **One task at a time**: Focused tasks > mega-requests

### Context Management

- `/clear` between unrelated tasks — prevents context pollution
- Use subagents for heavy exploration — keeps main context clean
- Rewind when going in circles — don't burn tokens on dead ends
- Keep CLAUDE.md concise — too many rules = rules get ignored

### Safety

- Review changes before committing (read the diff)
- Don't commit secrets (`.env`, API keys)
- Use git branches for experiments
- Commit often with small, focused changes
- Say "no" to tool calls you're unsure about

### Common Mistakes & Fixes

| Mistake | Fix |
|---------|-----|
| Repeating corrections 3+ times | `/clear` and restart with better prompt |
| Never clearing context | `/clear` between unrelated tasks |
| Accepting code without testing | Always `/test` before committing |
| Vague prompts | Be specific: what, where, and why |
| Ignoring review gates in `/cook` | Read output at each gate — it's your safety net |
| Skipping planning for complex tasks | `/plan` saves time vs. fixing bad code later |

---

## Other Useful Commands

| Command | Purpose |
|---------|---------|
| `/git cm` | Commit with conventional format + secret scanning |
| `/git cp` | Commit and push |
| `/git pr` | Create pull request |
| `/test` | Run tests without auto-fixes |
| `/fix` | Debug + fix bugs (activates debug loop) |
| `/code-review` | Review code quality |
| `/simplify` | Simplify code for clarity |
| `/research "topic"` | Deep research on a technical topic |
| `/docs` | Manage project documentation |
| `/debug` | Systematic root cause analysis |
| `/preview --explain` | Visual explanation of complex code |
| `/preview --diagram` | Architecture diagrams |

---

## TL;DR

> **Be specific. One task at a time. Plan before building big things. Always test. Commit often.**

> Start with `/cook`. Graduate to `/plan` -> `/cook`. Master `/brainstorm` -> `/plan --hard` -> `/cook`.
