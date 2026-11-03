# Week 9, Day 5 - Reranking in RAG: Understanding Cross-Encoders

*October 25, 2026 · [Originally published on Substack](https://niharikabatra.substack.com/p/week-9-day-5-reranking-in-rag-understanding)*

> 🔒 **This is a subscriber-only article on Substack.**
> This page mirrors the free preview — **[read the full article on Substack →](https://niharikabatra.substack.com/p/week-9-day-5-reranking-in-rag-understanding)**

We’ve spent the last few days learning how to evaluate a RAG system and understand whether it gives good answers.

But here’s a question we haven’t explored in depth yet:

> **What happens when the system finds the right information but doesn’t recognize that it’s the most useful result?**

Let’s understand this with a simple example.
