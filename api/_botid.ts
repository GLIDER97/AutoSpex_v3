// Vercel BotID (basic mode, included on all plans) for the paid endpoints.
// The pages load the BotID client (index.tsx, with the rewrites in
// vercel.json); here the server asks Vercel whether the request came from a
// bot. The check runs only on Vercel; set BOTID_CHECK=off to turn it off.
// Basic mode is forced so the paid Deep Analysis tier is never used by accident.
import { checkBotId } from 'botid/server';

/** True when Vercel BotID classifies the request as a bot. Errors let the request through (the daily caps still apply). */
export async function isBot(): Promise<boolean> {
  if (!process.env.VERCEL || process.env.BOTID_CHECK === 'off') return false;
  try {
    const verdict = await checkBotId({ advancedOptions: { checkLevel: 'basic' } });
    return verdict.isBot;
  } catch (err) {
    console.error('botid: check failed, allowing the request', err instanceof Error ? err.message : err);
    return false;
  }
}
