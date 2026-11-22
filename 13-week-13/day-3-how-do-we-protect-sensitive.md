# Week 13, Day 3 - How Do We Protect Sensitive Information in AI Applications?

*November 20, 2026 · [Originally published on Substack](https://niharikabatra.substack.com/p/week-13-day-3-how-do-we-protect-sensitive)*

> 🔒 **This is a subscriber-only article on Substack.**
> This page mirrors the free preview — **[read the full article on Substack →](https://niharikabatra.substack.com/p/week-13-day-3-how-do-we-protect-sensitive)**

Yesterday, we explored why AI sometimes makes things up and how techniques like grounding, clear instructions, and fallbacks can make AI applications more reliable.

But reliability isn’t just about giving the correct answer.

It’s also about protecting the information users share with AI.

Imagine you’re building an AI-powered customer support assistant.

A customer asks:

“Can you help me understand my latest salary statement?”

They upload a document containing:

- Full name
- Home address
- Social Security Number (SSN)
- Bank account details
- Salary information

The AI assistant needs some of this information to answer the question.

But should all of it be passed to the AI model?

Absolutely not.

This brings us to an important concept in AI safety: PII protection.
