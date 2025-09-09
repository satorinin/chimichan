// Unit tests for the Anki Syncer module
const ankiSyncer = require('../src/anki_syncer');

describe('Anki Syncer Module', () => {
    test('should sync with Anki', () => {
        expect(() => ankiSyncer.sync()).not.toThrow();
    });
});
