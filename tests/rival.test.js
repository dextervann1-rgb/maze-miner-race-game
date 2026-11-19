import { expect, it } from 'vitest';
import { RIVALS } from '../src/rival-ai.js';
it('has four rival personalities', () => expect(Object.keys(RIVALS)).toHaveLength(4));
