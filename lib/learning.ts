import { z } from "zod";
import { State, User, now, id, visiblePeers } from "./domain";
const tags = z.array(z.string().trim().min(1).max(60)).max(12);
export const learningSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    university: z.string().trim().min(2).max(100),
    programme: z.string().trim().min(2).max(100),
    level: z.string().trim().max(40),
    modules: tags,
    topics: tags,
    strengths: tags,
    goal: z.string().trim().max(400),
    studyTime: z.enum([
      "mornings",
      "afternoons",
      "evenings",
      "weekends",
      "flexible",
    ]),
    studyFormat: z.enum(["examples", "practice", "discussion", "reading"]),
    area: z.string().trim().max(100),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    nearby: z.boolean(),
    helper: z.boolean(),
  })
  .refine((v) => !v.nearby || v.area.length >= 2, {
    message: "Choose an approximate area before enabling discovery.",
    path: ["area"],
  })
  .refine((v) => !v.helper || v.strengths.length > 0, {
    message: "Add at least one strength to offer help.",
    path: ["strengths"],
  });
export function saveLearning(s: State, uid: string, input: unknown) {
  const data = learningSchema.parse(input);
  const user = s.users.find((u) => u.id === uid)!;
  Object.assign(user, data, {
    lat: Math.round(data.lat * 1000) / 1000,
    lng: Math.round(data.lng * 1000) / 1000,
    onboardingCompletedAt: now(),
  });
  if (!s.coach.some((m) => m.userId === uid))
    s.coach.push({
      id: id(),
      userId: uid,
      role: "coach",
      createdAt: now(),
      text: `Welcome, ${user.name.split(" ")[0]}. Let’s make space for your learning. Add a module outline or PDF, review its outcomes, then ask me for a plan. Your preferred study time is ${data.studyTime}.`,
    });
  return user;
}
export function helperSuggestions(s: State, user: User) {
  const interests = [...user.topics, ...(user.modules || [])]
    .join(" ")
    .toLowerCase();
  return visiblePeers(s, user)
    .filter((p) => p.helper)
    .map((p) => {
      const shared = (p.strengths?.length ? p.strengths : p.topics).filter(
        (t) =>
          t
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 2)
            .some((w) => interests.includes(w)),
      );
      return {
        ...p,
        matchReason: shared.length
          ? `Can help with ${shared.join(", ")}`
          : p.programme === user.programme
            ? "Same programme · available nearby"
            : "Available to help nearby",
        matchScore:
          shared.length * 3 + (p.programme === user.programme ? 1 : 0),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
export function coachReply(s: State, user: User, message: string) {
  const task = s.tasks.filter((t) => t.userId === user.id).at(-1);
  const outcome = task?.outcomes[0];
  if (/\bstuck\b|\bhelp\b/i.test(message)) {
    const peer = helperSuggestions(s, user)[0];
    return outcome
      ? `Let’s narrow “${outcome}” to one obstacle. What did you try, what happened, and what did you expect? ${peer ? `${peer.name.split(" ")[0]} is available nearby. Open Phone a Friend to send a request.` : "You can enable nearby discovery in your profile to look for peer help."}`
      : "First add your module objectives or a PDF in My outline. Review and confirm an outcome so we can work from your actual course.";
  }
  if (/plan|start|time|overwhelm/i.test(message))
    return outcome
      ? `Your 12-minute plan for “${outcome}”: 2 minutes to choose one small example; 8 minutes to try it; 2 minutes to record the result. ${user.studyFormat === "discussion" ? "Explain your attempt aloud before writing it down." : user.studyFormat === "reading" ? "Use your course notes to check one detail." : user.studyFormat === "examples" ? "Start from a worked example in your course notes." : "Try one example yourself, then compare the result."} Aim for ${user.studyTime || "a time that suits you"}. Your rubric is shown on the restart page.`
      : "Add and confirm your module outcomes first. You can paste text or import a PDF; I won’t invent your course objectives.";
  if (/quiz|practice|question/i.test(message))
    return outcome
      ? `Practice prompt based on your confirmed outcome: “${outcome}”. Describe one concrete example, explain the steps you would take, and name a result that would show progress. This is a reflection prompt, not an official course question or a graded correctness check.`
      : "Confirm an outcome from your outline first, then ask for a practice question.";
  if (/strength|help others/i.test(message))
    return user.strengths?.length
      ? `Your self-reported strengths are ${user.strengths.join(", ")}. ${user.helper && user.nearby ? "You are available to opted-in learners nearby. Check Phone a Friend for requests." : "Enable helping and nearby discovery in your profile when you’re ready to connect."}`
      : "Add your strengths in Learning preferences, then choose whether to offer help to nearby learners.";
  return outcome
    ? `We’re working on “${outcome}”. I’m a rule-based study coach: I can help you plan, offer a practice prompt, find a helper, or review evidence with DONE followed by what you tried and observed. For subject explanations, use your course notes or a peer helper.`
    : "Let’s start with your course material. Open My outline to paste objectives or import a PDF, then review and confirm the outcomes. You can also update your learning preferences in Profile.";
}
