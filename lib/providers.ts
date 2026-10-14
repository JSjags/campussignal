import { RestartTask, id, now } from "./domain";
export interface AIProvider {
  extract(text: string): string[];
  task(outcomes: string[]): { title: string; rubric: string[] };
  score(task: RestartTask, text: string): { score: number; feedback: string };
  helpNote(topic: string): Promise<string>;
}
export class FreeRuleProvider implements AIProvider {
  extract(text: string) {
    return text
      .split(/\n|(?<=[.!?])\s+/)
      .map((t) => t.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
      .filter((t) => t.length > 5)
      .slice(0, 12);
  }
  task(outcomes: string[]) {
    return {
      title: `Take one step: ${outcomes[0]}`,
      rubric: [
        "Describe the action you took (at least 40 characters).",
        "Connect your evidence to a word in the confirmed outcome.",
        "Include a result: an observation, test, response, or what you learned.",
      ],
    };
  }
  score(task: RestartTask, text: string) {
    const words =
      task.outcomes
        .join(" ")
        .toLowerCase()
        .match(/[a-z]{4,}/g) ?? [];
    const checks = [
      text.trim().length >= 40,
      words.some((w) => text.toLowerCase().includes(w)),
      /result|test|observ|learn|return|response|work|output|because|error|pass|fail/i.test(
        text,
      ),
    ];
    const score = checks.filter(Boolean).length;
    return {
      score,
      feedback:
        score === 3
          ? "You showed an action, a connection to your outcome, and a result. Small step, real progress."
          : `Keep going: ${task.rubric.filter((_, i) => !checks[i]).join(" ")}`,
    };
  }
  async helpNote(topic: string) {
    return `Let’s make ${topic} smaller. Show your friend what you tried, what happened, and the one thing you expected instead.`;
  }
}
export class OpenAIProvider extends FreeRuleProvider {
  async helpNote(topic: string) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          input: `Give a friendly study hint under 60 words about the following topic. Do not invent course outcomes. Topic: ${topic}`,
          max_output_tokens: 150,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Provider unavailable");
      const data = await response.json();
      return (
        data.output
          ?.flatMap((x: { content?: { text?: string }[] }) => x.content ?? [])
          .map((x: { text?: string }) => x.text ?? "")
          .join("") || super.helpNote(topic)
      );
    } catch {
      return super.helpNote(topic);
    }
  }
}
export const ai: AIProvider = process.env.OPENAI_API_KEY
  ? new OpenAIProvider()
  : new FreeRuleProvider();
export interface WhatsAppProvider {
  send(to: string, text: string): Promise<void>;
}
export class InAppCoach implements WhatsAppProvider {
  async send(to: string, text: string) {
    const { mutate } = await import("./store");
    await mutate((s) => {
      s.coach.push({
        id: id(),
        userId: to,
        role: "coach",
        text,
        createdAt: now(),
      });
    });
  }
}
export const coach: WhatsAppProvider = new InAppCoach();
export class TwilioWhatsAppSandbox implements WhatsAppProvider {
  async send(to: string, text: string) {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_WHATSAPP_FROM!,
          To: to,
          Body: text,
        }),
      },
    );
    if (!response.ok) throw new Error("Twilio delivery failed");
  }
}
