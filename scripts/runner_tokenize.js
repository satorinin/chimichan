// Runner to smoke-test parser output
const parser = require('../src/parser');

const sample = 'これはテストです。日本語の文章を解析します。';

const tokens = parser.parse(sample);
console.log(JSON.stringify(tokens, null, 2));
