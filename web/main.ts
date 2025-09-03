// main.ts — TypeScript stub for future Chrome extension wiring
// This file is not currently built; it is included as a starting point for migrating to TS.

declare const kuromoji: any;

export async function buildTokenizer(dicPath: string = 'https://unpkg.com/kuromoji@latest/dict/') {
  return new Promise<any>((resolve, reject) => {
    if (!kuromoji || !kuromoji.builder) return reject(new Error('kuromoji not available'));
    kuromoji.builder({ dicPath }).build((err: any, tokenizer: any) => {
      if (err) return reject(err);
      resolve(tokenizer);
    });
  });
}

export type Token = {
  word_id: number;
  word_type: string;
  word_position: number;
  surface_form: string;
  pos: string;
  pos_detail_1?: string;
  basic_form?: string;
  reading?: string;
  pronunciation?: string;
};
