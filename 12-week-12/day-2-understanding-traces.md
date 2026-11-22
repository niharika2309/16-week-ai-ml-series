# Week 12, Day 2 - Understanding Traces and Spans in LLM Applications

*November 12, 2026 · [Originally published on Substack](https://niharikabatra.substack.com/p/week-12-day-2-understanding-traces)*

> 🔒 **This is a subscriber-only article on Substack.**
> This page mirrors the free preview — **[read the full article on Substack →](https://niharikabatra.substack.com/p/week-12-day-2-understanding-traces)**

Yesterday, we introduced LLMOps and discussed why monitoring AI applications after deployment is important.

Today, let’s go one level deeper.

Imagine you’ve built a RAG application that answers questions using company documents.

A user asks:

> *“What is our company’s leave policy?”*

Behind the scenes, your application doesn’t simply send this question to an LLM and return an answer.

Several things happen:

1.  The application receives the question.
2.  It converts the question into an embedding.
3.  It searches the vector database.
4.  It retrieves relevant documents.
5.  It sends the question and retrieved documents to the LLM.
6.  The LLM generates an answer.
7.  The application returns the response.

That’s quite a few operations for answering one question!

But how do we see this entire journey?

This is where **traces and spans** come in.
