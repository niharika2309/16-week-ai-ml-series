# Week 5, Day 1 - Attention Is All You Need

*September 23, 2026 · [Originally published on Substack](https://niharikabatra.substack.com/p/week-5-day-1-attention-is-all-you)*

Today is a little special for me.

**It’s my birthday! 🎂**

And what better way to spend it than starting a new chapter of our AI journey together?

Yesterday, we paused before moving ahead and connected the dots from everything we learned about **neural networks**.

Today, we’re stepping into one of the most important ideas behind modern AI.

And we’re going to start with a paper.

In **2017**, a group of researchers published a paper with a rather bold title:

> **“Attention Is All You Need.”**

At the time, this wasn’t just a catchy title.

It introduced a very different way of thinking about how machines could process language.

And that idea eventually became the foundation for much of the AI we’re talking about today.

---

**Before Transformers**

Before this paper, neural networks used for language often processed sequences step by step.

For example:

> **I → went → to → the → store → yesterday**

The model would process the words in sequence while trying to retain information about what came before.

This worked, but language has a tricky property:

**Important relationships aren’t always next to each other.**

Consider:

> **“The book that I bought last week from the bookstore near my office was surprisingly good.”**

![](../assets/images/05-week-5/c8993623-2f97-4cc8-adca-518496b08ac0.jpeg)

To understand **“was surprisingly good,”** the model needs to connect that phrase back to **“book”**, even though several words sit in between.

As sequences became longer, capturing these relationships efficiently became challenging.

---

**Then came attention**

The researchers behind *Attention Is All You Need* asked a different question:

**What if the model could look at the different parts of a sequence and learn which ones are important to each other?**

Instead of relying entirely on processing a sentence one word after another, attention gives the model a way to consider relationships between different parts of the input.

In simple terms, the model can ask:

> **“When I’m trying to understand this part, which other parts should I pay attention to?”**

And the important part is:

**The model learns these relationships from data.**

We don’t manually tell it which words should be connected.

---

**This led to Transformers**

The paper introduced the **Transformer** architecture.

At its core was a powerful idea:

**attention could be used as the main mechanism for understanding relationships within sequences.**

Transformers could also process many parts of a sequence in parallel, making them much more efficient to train than approaches that depended heavily on sequential processing.

And this idea became incredibly influential.

Today, Transformers are behind many of the AI systems you’ve probably heard about, including modern large language models and generative AI.

---

**But what exactly is “attention”?**

This is where we’re going to slow down.

You don’t need to understand the entire Transformer architecture today.

First, we need to understand one simple idea:

> **Attention helps a model determine which parts of the input are relevant to each other.**

Once that clicks, the rest of the Transformer architecture becomes much easier to understand.

And that brings us to our next question:

**How does a model actually decide what to pay attention to?**

**Before we learn how attention works, it helps to know where it lives.**

Think of it like opening a machine before learning how one of its most important parts works.

Tomorrow, we’ll first understand the **big picture of the Transformer architecture**. Then we’ll zoom into attention and see what is happening inside it.
