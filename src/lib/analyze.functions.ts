import { createServerFn } from "@tanstack/react-start";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import { z } from "zod";

const InputSchema = z.object({
  username: z.string().min(1).max(39),
  profile: z.object({
    login: z.string(),
    name: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    followers: z.number(),
    following: z.number(),
    public_repos: z.number(),
    created_at: z.string(),
    company: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
  }),
  repos: z.array(
    z.object({
      name: z.string(),
      description: z.string().nullable().optional(),
      stargazers_count: z.number(),
      forks_count: z.number(),
      language: z.string().nullable().optional(),
      updated_at: z.string(),
    }),
  ),
});

const ReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  starRating: z.number().min(1).max(5),
  headline: z.string().describe("Punchy one-line summary of this developer"),
  strengths: z.array(z.string()).min(2).max(5),
  weaknesses: z.array(z.string()).min(2).max(5),
  recruiterImpression: z.string().describe("2-3 sentence recruiter take"),
  resumeImpact: z.object({
    score: z.number().min(0).max(100),
    verdict: z.string(),
  }),
  recommendations: z.array(z.string()).min(3).max(6),
});

type AnalysisInput = z.infer<typeof InputSchema>;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildFallbackReport(data: AnalysisInput): AnalysisReport {
  const totalStars = data.repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = data.repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const activeRepos = data.repos.filter((repo) => {
    const updated = new Date(repo.updated_at).getTime();
    return Number.isFinite(updated) && Date.now() - updated < 1000 * 60 * 60 * 24 * 365;
  }).length;
  const languages = [...new Set(data.repos.map((repo) => repo.language).filter(Boolean))];
  const hasDescriptions = data.repos.filter((repo) => repo.description?.trim()).length;
  const accountAgeYears = Math.max(
    0.5,
    (Date.now() - new Date(data.profile.created_at).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000),
  );

  const score = clampScore(
    30 +
      Math.min(24, totalStars * 1.8) +
      Math.min(14, data.profile.followers / 8) +
      Math.min(12, languages.length * 2) +
      Math.min(10, activeRepos * 1.5) +
      Math.min(10, hasDescriptions * 1.2) +
      Math.min(8, totalForks * 1.2) +
      Math.min(6, accountAgeYears),
  );
  const starRating = Math.max(1, Math.min(5, Math.round(score / 20)));
  const strongestRepo = [...data.repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  )[0];

  const strengths = [
    totalStars > 0
      ? `Social proof is visible with ${totalStars.toLocaleString()} total star${totalStars === 1 ? "" : "s"}.`
      : "A clean public repo base is ready to be packaged into stronger proof.",
    languages.length > 1
      ? `Shows range across ${languages.slice(0, 4).join(", ")}.`
      : `Keeps a focused stack${languages[0] ? ` around ${languages[0]}` : ""} without looking scattered.`,
    activeRepos > 0
      ? `${activeRepos} repo${activeRepos === 1 ? "" : "s"} updated recently, which signals momentum.`
      : "The profile has enough history to turn into a stronger portfolio story.",
  ];

  const weaknesses = [
    hasDescriptions < Math.max(2, Math.ceil(data.repos.length * 0.35))
      ? "Several repositories need sharper descriptions so visitors instantly understand the value."
      : "Descriptions are present, but the strongest repos could still lead with clearer outcomes.",
    totalStars < 5
      ? "Needs more showcase polish, demos, or README visuals to earn trust faster."
      : "The profile can convert attention better by pinning the most impressive work first.",
    data.profile.bio
      ? "Bio exists, but it should connect skills to a specific developer positioning."
      : "Profile bio is missing; recruiters need a quick one-line identity signal.",
  ];

  return {
    overallScore: score,
    starRating,
    headline: strongestRepo
      ? `@${data.profile.login} has a playable dev profile led by ${strongestRepo.name}.`
      : `@${data.profile.login} has a starter profile ready for a portfolio power-up.`,
    strengths,
    weaknesses,
    recruiterImpression:
      score >= 75
        ? "This profile feels credible and active. A recruiter would likely open the flagship repositories and look for production impact, demos, and clear README storytelling."
        : "This profile has useful raw material, but it needs stronger packaging. A recruiter would want clearer project outcomes, pinned highlights, and proof that the work solves real problems.",
    resumeImpact: {
      score: clampScore(score - 4 + Math.min(10, totalStars)),
      verdict:
        score >= 80
          ? "Resume-ready with strong portfolio gravity."
          : score >= 60
            ? "Good base — needs stronger showcase framing."
            : "Needs a polish sprint before it carries the resume.",
    },
    recommendations: [
      "Pin 3 repositories that tell one clear career story: best UI, best backend, best problem-solving project.",
      "Add README screenshots, live demo links, setup steps, and a short impact statement to each flagship repo.",
      "Rewrite the GitHub bio as a compact positioning line with stack, domain, and current goal.",
      "Archive or de-emphasize unfinished experiments that distract from the strongest work.",
      "Add topics/tags to repos so GitHub search and recruiters can understand the stack quickly.",
    ],
  };
}

export const analyzeProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return buildFallbackReport(data);

    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": key },
    });

    const topRepos = [...data.repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10);

    const totalStars = data.repos.reduce((s, r) => s + r.stargazers_count, 0);
    const langs = data.repos
      .map((r) => r.language)
      .filter((l): l is string => !!l);
    const accountAgeYears =
      (Date.now() - new Date(data.profile.created_at).getTime()) /
      (365.25 * 24 * 3600 * 1000);

    const prompt = `Analyze this GitHub developer profile and produce an honest, punchy report.

Username: @${data.profile.login}
Name: ${data.profile.name ?? "—"}
Bio: ${data.profile.bio ?? "—"}
Followers: ${data.profile.followers} | Following: ${data.profile.following}
Public repos: ${data.profile.public_repos}
Total stars across repos: ${totalStars}
Account age: ${accountAgeYears.toFixed(1)} years
Top languages: ${[...new Set(langs)].slice(0, 6).join(", ") || "—"}

Top repos (name | ★ | language | description):
${topRepos
  .map(
    (r) =>
      `- ${r.name} | ★${r.stargazers_count} | ${r.language ?? "?"} | ${r.description ?? ""}`,
  )
  .join("\n")}

Score 0-100 weighting: repo quality > stars > consistency > breadth.
Be specific, reference actual repos. Tone: confident, friendly, slightly playful — like a coach roasting code.`;

    try {
      const { object } = await generateObject({
        model: gateway("google/gemini-3-flash-preview"),
        schema: ReportSchema,
        prompt: `${prompt}\n\nReturn only a valid object matching the requested schema. Use integer scores and 2-5 concise bullet-style items where arrays are requested.`,
      });

      return {
        ...object,
        overallScore: clampScore(object.overallScore),
        starRating: Math.max(1, Math.min(5, Math.round(object.starRating))),
        resumeImpact: {
          ...object.resumeImpact,
          score: clampScore(object.resumeImpact.score),
        },
      };
    } catch (error) {
      console.error("AI analysis failed, using deterministic fallback", error);
      return buildFallbackReport(data);
    }
  });

export type AnalysisReport = z.infer<typeof ReportSchema>;
