import { generateSummary, analyzeSentiment, extractActionItems } from '../src/lib/nlp.js';

async function test() {
  console.log("Testing NLP pipelines...");
  const text = "This is a meeting about the new project. We need to complete the design by Friday. Hema will lead the development.";
  
  try {
    console.log("Generating summary...");
    const summary = await generateSummary(text, 'english');
    console.log("Summary:", summary);

    console.log("Analyzing sentiment...");
    const sentiment = await analyzeSentiment(text);
    console.log("Sentiment:", sentiment);

    console.log("Extracting action items...");
    const items = await extractActionItems(text, 'english');
    console.log("Action Items:", items);

    console.log("Test successful!");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
