import { random } from "remotion";

const HOOKS: Record<string, string[]> = {
  educational: [
    "Did you know {topic} can change everything?",
    "Here's the truth about {topic} nobody tells you",
    "3 things you MUST know about {topic}",
    "The secret to mastering {topic} in 60 seconds",
  ],
  viral: [
    "This {topic} hack went viral for a reason",
    "Everyone's talking about {topic} — here's why",
    "{topic} is trending — don't miss out",
    "The {topic} trend that's breaking the internet",
  ],
  evergreen: [
    "The ultimate guide to {topic}",
    "How to {topic} like a pro",
    "{topic} — everything you need to know",
    "Master {topic} with these proven tips",
  ],
  personal_brand: [
    "My honest opinion on {topic}",
    "What I learned about {topic} the hard way",
    "My {topic} journey — the full story",
    "I tried {topic} so you don't have to",
  ],
};

const SCRIPTS: Record<string, string[]> = {
  educational: [
    "Let's talk about {topic}. First, {topic} is important because it affects millions of people. Here are 3 key facts: it drives growth, saves time, and builds community. The bottom line? {topic} is a game changer.",
    "You've heard of {topic}, but do you really understand it? Here's a quick breakdown. Step 1: learn the basics. Step 2: apply them daily. Step 3: track your results. Simple, right?",
  ],
  viral: [
    "Everyone's talking about {topic} right now — and for good reason. It just happened: {topic} is everywhere. Here's what you need to know before it's too late. Share this before it disappears.",
    "Breaking: {topic} is going viral and here's the truth. The mainstream media won't tell you this. Stay until the end for the biggest reveal.",
  ],
  evergreen: [
    "Want to master {topic}? I've spent years studying this and here's what actually works. Tip 1: consistency beats perfection. Tip 2: learn from the best. Tip 3: take action today. Start now.",
    "The complete guide to {topic} in under 60 seconds. What it is, why it matters, and exactly how to get started. No fluff, just results.",
  ],
  personal_brand: [
    "I failed at {topic} three times before I finally got it right. Here's the story of what I learned. The key was changing my mindset completely. Now I want to share that with you.",
    "My honest take on {topic} — and I'm not holding back. After trying everything, here's what actually worked for me. Take notes.",
  ],
};

const CAPTIONS: Record<string, string[]> = {
  educational: [
    "Learn everything about {topic} in 60 seconds 🎓 Drop your questions below! #educational #{topic}",
    "The truth about {topic} that schools never teach 📚 Save this for later! #{topic} #learning",
  ],
  viral: [
    "{topic} is trending for a reason 🔥 Comment your thoughts! #{topic} #viral #trending",
    "Everyone needs to see this {topic} moment 👀 Share before it's gone! #{topic} #viralvideo",
  ],
  evergreen: [
    "Your complete guide to {topic} ✅ Bookmark this! #{topic} #tips #howto",
    "Master {topic} with these pro tips 💡 Follow for more! #{topic} #guide",
  ],
  personal_brand: [
    "My real experience with {topic} 💯 What's yours? #{topic} #storytime #authentic",
    "Sharing my {topic} journey — the full truth 🎤 Comment below! #{topic} #personal",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(random(null) * arr.length)];
}

function fillTemplate(template: string, topic: string): string {
  return template.replace(/\{topic\}/g, topic);
}

function detectBucket(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/breaking|news|viral|trend|latest|update|everyone|right now/.test(lower)) return "viral";
  if (/how to|guide|tutorial|tips|learn|understand|explain|step/.test(lower)) return "educational";
  if (/my story|my experience|honest|journey|failed|personal/.test(lower)) return "personal_brand";
  return "evergreen";
}

export class RuleBasedGenerator {
  static generate(type: "hook" | "script" | "caption" | string, prompt: string): string {
    const bucket = detectBucket(prompt);
    const topic = prompt.length > 50 ? prompt.substring(0, 50).trim() : prompt.trim();

    if (type === "hook") {
      const arr = HOOKS[bucket] || HOOKS.evergreen;
      return fillTemplate(pickRandom(arr), topic);
    }
    if (type === "caption") {
      const arr = CAPTIONS[bucket] || CAPTIONS.evergreen;
      return fillTemplate(pickRandom(arr), topic);
    }
    const arr = SCRIPTS[bucket] || SCRIPTS.evergreen;
    return fillTemplate(pickRandom(arr), topic);
  }
}
