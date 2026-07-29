/* Pre-generate neural TTS for core Korean content (run once on your PC).
 *
 * Reads the vocabulary + phrases from data/koreanData.ts, calls Gemini TTS for
 * each, and writes a WAV per clip plus a manifest (korean text -> filename) into
 * public/audio/tts/. At runtime the app plays these files and falls back to Web
 * Speech for anything missing (utils/pronunciation.ts). No per-user API cost.
 *
 * Resumable: skips clips already present. Paced under the free-tier rate limit,
 * with backoff on 429. Usage:  node scripts/generate-tts.cjs [--limit N] [--dry]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'tts');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const VOICE = 'Kore';
const GAP_MS = 30000;        // spacing to stay under the free-tier TTS rate limit
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? parseInt(args[i + 1], 10) : Infinity; })();

function envKey() {
  const env = fs.readFileSync(path.join(ROOT, 'backend', '.env'), 'utf8');
  const m = env.match(/^GEMINI_API_KEY=(.+)$/m);
  return m ? m[1].trim() : null;
}

function loadContent() {
  const esbuild = require(path.join(ROOT, 'node_modules', 'esbuild'));
  const tmp = path.join(OUT_DIR, '__data.cjs');
  esbuild.buildSync({ entryPoints: [path.join(ROOT, 'data', 'koreanData.ts')], bundle: true, format: 'cjs', outfile: tmp, logLevel: 'silent' });
  const d = require(tmp);
  fs.unlinkSync(tmp);
  const words = d.vocabulary.flatMap(c => c.items.map(i => i.korean));
  const phrases = d.commonPhrases.map(p => p.korean);
  // Preserve order, dedupe.
  return [...new Set([...words, ...phrases])];
}

const fileFor = text => crypto.createHash('md5').update(text).digest('hex').slice(0, 12) + '.wav';

function pcmToWav(pcm, rate) {
  const ch = 1, bps = 16, byteRate = rate * ch * bps / 8, blockAlign = ch * bps / 8;
  const b = Buffer.alloc(44 + pcm.length);
  b.write('RIFF', 0); b.writeUInt32LE(36 + pcm.length, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(ch, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(byteRate, 28); b.writeUInt16LE(blockAlign, 32); b.writeUInt16LE(bps, 34);
  b.write('data', 36); b.writeUInt32LE(pcm.length, 40); pcm.copy(b, 44); return b;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const targets = loadContent();
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};

  const todo = targets.filter(t => {
    const f = fileFor(t);
    return !(manifest[t] && fs.existsSync(path.join(OUT_DIR, f)));
  }).slice(0, LIMIT);

  console.log(`targets: ${targets.length} · already done: ${targets.length - todo.length + (targets.length - todo.length === 0 ? 0 : 0)} · to generate: ${todo.length}`);
  if (DRY) { console.log('first 10:', todo.slice(0, 10).join('  ')); return; }
  if (todo.length === 0) { console.log('nothing to do.'); return; }

  require('dns').setServers(['8.8.8.8', '1.1.1.1']);
  const { GoogleGenAI } = require(path.join(ROOT, 'backend', 'node_modules', '@google', 'genai'));
  const ai = new GoogleGenAI({ apiKey: envKey() });
  // Slow, clear, beginner-friendly delivery — the pace a teacher uses, which
  // neural TTS produces without the distortion of time-stretching.
  const prompt = w => `Read this Korean aloud slowly and very clearly for a beginner language learner. Enunciate each syllable distinctly in a calm, warm, encouraging teaching voice. Say only the text: ${w}`;

  let done = 0;
  for (const text of todo) {
    let attempt = 0, saved = false;
    while (attempt < 5 && !saved) {
      attempt++;
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: prompt(text),
          config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
        });
        const part = res.candidates?.[0]?.content?.parts?.[0];
        const b64 = part?.inlineData?.data;
        if (!b64) throw new Error('no-audio');
        const rate = parseInt((part.inlineData.mimeType.match(/rate=(\d+)/) || [])[1] || '24000', 10);
        const f = fileFor(text);
        fs.writeFileSync(path.join(OUT_DIR, f), pcmToWav(Buffer.from(b64, 'base64'), rate));
        manifest[text] = f;
        fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0));
        done++; saved = true;
        console.log(`  ✓ ${done}/${todo.length}  ${text}`);
      } catch (e) {
        const is429 = /429|quota|RESOURCE_EXHAUSTED/i.test(e.message);
        const wait = is429 ? 35000 * attempt : 4000 * attempt;
        console.log(`  … retry ${text} (${is429 ? '429 rate limit' : e.message.slice(0, 40)}) in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
    if (!saved) console.log(`  ✗ gave up: ${text}`);
    await sleep(GAP_MS);
  }
  console.log(`\nDone. ${done} generated. Manifest: ${Object.keys(manifest).length} total.`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
