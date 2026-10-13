# Week 4, Day 3 - Forward Propagation, Backward Propagation & Gradient Descent in Neural Network

*September 18, 2026 · [Originally published on Substack](https://niharikabatra.substack.com/p/week-4-day-3-forward-propagation)*

Yesterday, we went inside a **neuron**.

We learned about **inputs, weights, bias, activation functions, vectors, and embeddings**.

But we haven’t answered the most important question yet:

> **How does a neural network actually learn?**

A neural network doesn’t start out knowing which weights are important or what values they should have.

It learns by **making predictions, measuring its mistakes, and adjusting itself**.

Let’s see how that happens.

---

**Imagine a Recommendation System**

Think about a shopping app recommending products to you. The system might look at things like:

- What you’ve searched for
- Products you’ve clicked on
- What you’ve purchased before
- How long you looked at certain products
- What similar customers liked

The model takes these inputs and makes a prediction:

> **“You might be interested in this product.”**

Sometimes it’s right.

Sometimes it’s completely wrong.

When it’s wrong, the model needs to learn from that mistake.

This is where **Forward Propagation, Backward Propagation, and Optimization** come together.

---

**Step 1: Forward Propagation**

First, the neural network needs to make a prediction. This is called **Forward Propagation**.

Remember our neuron from yesterday?

> 📄 **Week 4, Day 2 - Inside a Neuron: From Vectors to Embeddings, Weights & Activation**
> September 17, 2026 · [Read the original on Substack](../04-week-4/day-2-inside-a-neuron-from.md)

It takes its inputs, applies **weights and bias**, passes the result through an **activation function**, and produces an output.

A neural network has many neurons connected across different layers.

Information moves through these layers:

**Input → Layer 1 → Layer 2 → Output**

The information is moving **forward**, which is why we call it **Forward Propagation**.

For our recommendation system, the final output might be:

> **“There is a 75% chance this person will click on this product.”**

The network has made its prediction.

But how do we know whether that prediction was good?

---

**Step 2: Measure the Error**

We need to compare the prediction with what actually happened. This is where **loss** comes in.

We already briefly learned about loss when we studied linear regression.

Loss gives the model a way to measure:

> **“How far was my prediction from the actual answer?”**

Suppose the model predicted that you would click on a product.

But you didn’t.

The model was wrong.

The **loss** tells the model how large that mistake was.

So now we have:

**Inputs → Prediction → Loss**

But there’s another question:

> **“What caused the error?”**

That’s where we move backward.

---

**Step 3: Backward Propagation**

Imagine the recommendation system isn’t making very good recommendations. The team wants to understand:

> **“What went wrong?”**

Maybe the system gave too much importance to someone’s old purchases.

Maybe it didn’t give enough importance to their recent searches.

Maybe another input should have mattered more.

A neural network needs to do something similar.

After calculating the loss, it works **backward through the network** to calculate how the different weights and biases affected that loss.

This is called **Backward Propagation**, or more commonly, **Backpropagation**.

So, very simply:

Forward Propagation

> **“Let’s make a prediction.”**

Backward Propagation

> **“Let’s work backward from the error and calculate how the model’s parameters affected it.”**

But now we have another question:

> **“Once the network works backward, how does it know which way to change the weights?”**

This is where **gradients** come in.

---

**Step 4: Gradients - Which Way Should We Change?**

During backward propagation, the network calculates something called a **gradient** for its weights and biases.

A gradient gives the model information about how changing a particular weight would affect the loss.

In simple terms, the model is asking:

> **“If I change this weight, will my mistake get bigger or smaller?”**

The gradient helps answer that question.

You don’t need to understand the math behind gradients yet.

For now, remember:

> **Backward propagation calculates gradients that tell the network how its weights and biases should change.**

And this is where the two concepts connect:

**Backpropagation = the process of working backward**

**Gradient = information calculated during that process**

Now the network has useful information about how its parameters should change.

But it still needs to **actually make those changes**.

---

**Step 5: Optimization - Actually Making the Changes**

This is where **optimization** comes in.

One of the most common optimization methods is **Gradient Descent**.

Think about standing somewhere on a mountain and wanting to reach the lowest point. You can’t see the entire mountain.

But you can look around and figure out:

> **“Which direction is downhill?”**

You take a small step in that direction.

Then you check again.

Another step.

And another.

You keep adjusting your direction until you get closer to the bottom.

That’s the basic idea behind **Gradient Descent**.

The neural network uses the **gradients calculated during backward propagation** to determine how its weights and biases should be adjusted.

It makes a small update.

Then it tries again.

And again.

And again.

Over many repetitions, the model can gradually reduce its loss and improve its predictions.

---

**One Simple Mental Model**

If all of this feels like a lot, remember this:

> **Forward propagation:**  
> *Make a prediction.*
> 
> **Loss:**  
> *See how wrong you were.*
> 
> **Backpropagation:**  
> *Work backward to figure out how the model’s parameters affected the mistake.*
> 
> **Gradients:**  
> *Get information about which way those parameters should change.*
> 
> **Gradient Descent:**  
> *Use that information to actually update them.*

That’s the basic learning loop behind a neural network.

And notice something important:

**The network isn’t manually told what each weight should be.**

It starts with weights, makes predictions, learns from its mistakes, and gradually adjusts those weights during training.

That repeated process is what allows a neural network to **learn from data**.

---

**Tomorrow**

We now know **how a neural network learns** - from making a prediction to calculating loss, working backward, and updating its weights.

But there’s one question left:

> **What does training actually look like when the model has thousands or millions of examples to learn from?**

Tomorrow, we’ll break down **batches, iterations, epochs, and learning rate** - the building blocks that help us understand what happens during neural network training.

No heavy math. Just the big picture of **how a model learns from lots of data, one step at a time. One step closer to AI.**
