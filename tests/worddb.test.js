// Unit tests for the WordDB module
const worddb = require('../src/worddb');

describe('WordDB Module', () => {
    test('should add and retrieve words', () => {
        worddb.addWord('example');
        const word = worddb.getWord('example');
        expect(word).toBe(null); // Update with expected word structure
    });
});
