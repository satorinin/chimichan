// scripts/test-tokenizer.mjs
// Small node script that builds kuromoji tokenizer and tokenizes a sentence.
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const kuromoji = require('kuromoji');

async function run() {
  try {
    const dicPath = path.resolve('./node_modules/kuromoji/dict/');
    console.log('Using dicPath:', dicPath);

    await new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) return reject(err);
        const text = 'すもももももももものうち';
        const tokens = tokenizer.tokenize(text);
        console.log('Tokens:', tokens.length);
        if (!Array.isArray(tokens) || tokens.length === 0) return reject(new Error('No tokens produced'));
        // simple sanity checks
        if (!tokens[0].surface_form) return reject(new Error('Token missing surface_form'));
        console.log('Sample token[0]:', tokens[0]);
        resolve();
      });
    });

    console.log('Tokenization test passed');
    process.exit(0);
  } catch (err) {
    console.error('Tokenization test failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();
