# Comprehension Calculator

## Purpose
The Comprehension Calculator provides users with insights into how much of a webpage they understand based on their known words and sentences. It highlights areas of the page that are fully understood, partially understood, or unknown.

## Responsibilities
- Analyze webpage content to calculate the percentage of known words and sentences.
- Highlight sentences that are fully understood, partially understood, or unknown.
- Provide a summary of comprehension statistics (e.g., percentage of known words, number of fully understood sentences).

## Architecture
- Input: Tokenized webpage content from the Language Parser Pipeline.
- Output: Comprehension statistics and highlighted text annotations.
- Integration: Works with the Known/Learning/New Word Database and Language Decorator.

## Open Questions
1. How will the calculator handle ambiguous words (e.g., words with multiple meanings)?
2. Should the calculator provide suggestions for improving comprehension (e.g., focus on unknown words)?
3. What performance optimizations are needed for large webpages?
