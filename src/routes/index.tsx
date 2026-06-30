import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Code2,
  FolderGit2,
  Gamepad2,
  GitFork,
  Home,
  Loader2,
  MousePointer2,
  Quote,
  RotateCcw,
  Rocket,
  Sparkles,
  Star,
  TerminalSquare,
  Trophy,
  Users,
} from "lucide-react";
import robotMascot from "@/assets/robot-mascot.png";
import { analyzeProfile, type AnalysisReport } from "@/lib/analyze.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitHub Profile Analyzer — AI Dev Score" },
      {
        name: "description",
        content:
          "Analyze any public GitHub profile with repo stats, language insights, recruiter-style feedback, AI scoring and an action plan.",
      },
      { property: "og:title", content: "GitHub Profile Analyzer — AI Dev Score" },
      {
        property: "og:description",
        content: "Turn a GitHub username into a playful developer scorecard and upgrade checklist.",
      },
      { property: "og:url", content: "https://git-profile-planner.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://git-profile-planner.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "GitHub Profile Analyzer",
          url: "https://git-profile-planner.lovable.app/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "GitHub Profile Analyzer",
          url: "https://git-profile-planner.lovable.app/",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "All",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Index,
});

type GitHubUser = {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  company: string | null;
  location: string | null;
  html_url: string;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  html_url: string;
};

const LOADING_LINES = [
  "Opening the GitHub loot chest…",
  "Sorting repos by signal and sparkle…",
  "Checking stars, forks, languages and activity…",
  "Asking the AI coach for a verdict…",
  "Building your developer power card…",
];

const SITE_BULLETS = [
  "Search any public GitHub username — no login required.",
  "See profile score, stars, repo strength, activity and language mix.",
  "Get recruiter-style quotes, weak spots, strengths and an upgrade plan.",
  "Use the result as a portfolio checklist before applying for jobs.",
];

function Index() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingLine, setLoadingLine] = useState(0);
  const analyze = useServerFn(analyzeProfile);

  const mutation = useMutation({
    mutationFn: async (handle: string) => {
      let clean = handle.trim().replace(/^@/, "");
      // Accept full GitHub profile URLs like https://github.com/username
      const urlMatch = clean.match(/github\.com\/([a-zA-Z0-9-]{1,39})/i);
      if (urlMatch) clean = urlMatch[1];
      // Strip any trailing slashes / paths just in case
      clean = clean.split("/")[0];
      if (!/^[a-zA-Z0-9-]{1,39}$/.test(clean)) {
        throw new Error("Enter a GitHub username or profile URL (e.g. github.com/torvalds).");
      }

      const userRes = await fetch(`https://api.github.com/users/${clean}`);
      if (userRes.status === 404) throw new Error(`No GitHub user "${clean}".`);
      if (userRes.status === 403) throw new Error("GitHub rate limit hit. Try again in a minute.");
      if (!userRes.ok) throw new Error("Couldn't reach GitHub right now.");
      const profile = (await userRes.json()) as GitHubUser;

      const reposRes = await fetch(
        `https://api.github.com/users/${clean}/repos?per_page=100&sort=updated`,
      );
      if (reposRes.status === 403) throw new Error("GitHub repo rate limit hit. Try again in a minute.");
      if (!reposRes.ok) throw new Error("Couldn't load this user's repositories.");
      const reposJson = await reposRes.json();
      const repos = (Array.isArray(reposJson) ? reposJson : []).filter(
        (r): r is GitHubRepo => !!r?.name,
      );

      const report = await analyze({ data: { username: clean, profile, repos } });
      return { profile, repos, report };
    },
    onError: (e: Error) => setError(e.message),
    onMutate: () => setError(null),
    onSuccess: () => {
      // Wait for report to render, then smoothly scroll to it
      setTimeout(() => {
        document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    },
  });

  useEffect(() => {
    if (!mutation.isPending) return;
    setLoadingLine(0);
    const id = setInterval(() => setLoadingLine((i) => (i + 1) % LOADING_LINES.length), 1300);
    return () => clearInterval(id);
  }, [mutation.isPending]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    mutation.mutate(username);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-ink">
      <FloatingShapes />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <TopBar />

        <main>
          <section className="grid min-h-[calc(100vh-96px)] items-center gap-8 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-10">
            <div className="animate-pop-in">
              <div className="game-pill inline-flex items-center gap-2 bg-lime px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest">
                <Gamepad2 className="size-4" /> Level up your dev identity
              </div>
              <h1 className="text-arcade mt-5 max-w-3xl font-display text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
                GitHub Profile Analyzer
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-ink/80">
                A playful AI scorecard that reads public GitHub data, rates your developer profile, and gives you practical moves to make it stronger.
              </p>

              <form onSubmit={onSubmit} className="mt-7 max-w-2xl space-y-3">
                <div className="brutal animate-pulse-border flex items-center gap-3 bg-panel px-3 py-3 sm:px-4">
                  <span className="grid size-10 shrink-0 place-items-center border-2 border-ink bg-yellow font-mono text-lg font-bold">
                    @
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username or github.com/username"
                    aria-label="GitHub username or profile URL"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    maxLength={39}
                    className="min-w-0 flex-1 bg-transparent py-2 font-mono text-base font-bold outline-none placeholder:text-ink/40"
                  />
                  <span className="hidden rounded-full border-2 border-ink bg-mint px-3 py-1 font-mono text-[10px] font-bold uppercase sm:inline-flex">
                    public scan
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="brutal press flex w-full items-center justify-center gap-3 bg-coral py-4 font-display text-xl tracking-wide text-primary-foreground disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="size-5 animate-spin" /> Scanning profile
                    </>
                  ) : (
                    <>
                      Start scan <ArrowRight className="size-5" />
                    </>
                  )}
                </button>
                {error && (
                  <div className="brutal-sm bg-card px-3 py-3 font-mono text-xs font-bold text-destructive">
                    ! {error}
                  </div>
                )}
              </form>

              <FeatureBullets />
            </div>

            <HeroScanner isLoading={mutation.isPending} loadingLine={LOADING_LINES[loadingLine]} />
          </section>

          <WhatItDoes />
          <QuoteStrip />

          {mutation.data && (
            <Report
              profile={mutation.data.profile}
              repos={mutation.data.repos}
              report={mutation.data.report}
              onScanAnother={() => {
                mutation.reset();
                setUsername("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <nav className="flex items-center gap-2" aria-label="Main">
      <div className="brutal-sm flex items-center gap-2 bg-panel-2 px-3 py-2">
        <Home className="size-4" />
        <span className="font-mono text-xs font-bold">GH ARENA</span>
      </div>
      <div className="brutal-sm hidden items-center gap-2 bg-card px-3 py-2 sm:flex">
        <Trophy className="size-4 text-coral" />
        <span className="font-mono text-xs font-bold">profile battle card</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="game-pill bg-mint px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest">online</div>
        <div className="brutal-sm grid size-10 place-items-center bg-violet text-paper">
          <Rocket className="size-4" />
        </div>
      </div>
    </nav>
  );
}

function FloatingShapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-cube-spin absolute left-[3%] top-[18%] size-14 rotate-12 border-4 border-ink bg-yellow shadow-brutal-sm" />
      <div className="animate-float-tilt absolute right-[6%] top-[16%] size-20 rounded-full border-4 border-ink bg-mint shadow-brutal" />
      <div className="absolute bottom-[14%] left-[7%] h-14 w-28 -rotate-12 border-4 border-ink bg-violet shadow-brutal" />
      <div className="absolute bottom-[8%] right-[10%] size-12 rotate-45 border-4 border-ink bg-coral shadow-brutal-sm" />
    </div>
  );
}

function FeatureBullets() {
  return (
    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
      {SITE_BULLETS.map((item, index) => (
        <li key={item} className="brutal-sm flex items-start gap-2 bg-card px-3 py-3 text-sm font-semibold">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-yellow font-mono text-[10px] font-bold">
            {index + 1}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function HeroScanner({ isLoading, loadingLine }: { isLoading: boolean; loadingLine: string }) {
  return (
    <aside className="prism relative mx-auto w-full max-w-md animate-pop-in border-[3px] border-ink bg-panel p-5 lg:max-w-none" style={{ animationDelay: "100ms" }}>
      <div className="absolute -left-5 top-8 rotate-[-10deg] border-2 border-ink bg-coral px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-brutal-sm">
        AI coach
      </div>
      <div className="absolute -right-4 top-24 rotate-12 border-2 border-ink bg-lime px-3 py-1 font-mono text-[10px] font-bold uppercase shadow-brutal-sm">
        3D scan
      </div>
      <div className="grid place-items-center rounded-[24px] border-2 border-ink bg-panel-2 px-5 py-8 text-center">
        <img
          src={robotMascot}
          alt="Friendly robot mascot analyzing a GitHub profile"
          width={210}
          height={210}
          className={`size-44 object-contain drop-shadow-xl ${isLoading ? "animate-bob" : "animate-float-tilt"}`}
        />
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {["stars", "repos", "languages", "impact"].map((chip) => (
            <span key={chip} className="game-pill bg-card px-3 py-1 font-mono text-[10px] font-bold uppercase">
              {chip}
            </span>
          ))}
        </div>
        <h2 className="mt-6 font-display text-2xl leading-tight">Profile power scanner</h2>
        <p className="mt-2 max-w-sm text-sm font-medium text-ink/70">It turns scattered GitHub signals into one clear developer story.</p>
        {isLoading ? (
          <div className="mt-6 w-full">
            <div className="brutal-sm h-4 overflow-hidden bg-card p-0">
              <div className="h-full w-1/3 bg-coral" style={{ animation: "scan-sweep 1.4s linear infinite" }} />
            </div>
            <p className="mt-3 font-mono text-xs font-bold text-ink/65">{loadingLine}</p>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2 rounded-full border-2 border-ink bg-mint px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm">
            <MousePointer2 className="size-4" /> waiting for username
          </div>
        )}
      </div>
    </aside>
  );
}

function WhatItDoes() {
  const cards = [
    {
      icon: <Code2 className="size-5" />,
      title: "Reads public signals",
      text: "Repos, followers, stars, forks, languages and update activity become one clean profile summary.",
      color: "bg-mint",
    },
    {
      icon: <BadgeCheck className="size-5" />,
      title: "Scores your profile",
      text: "You get an overall score, star rating, resume impact score and flagship repository cards.",
      color: "bg-yellow",
    },
    {
      icon: <Sparkles className="size-5" />,
      title: "Gives upgrade moves",
      text: "The report lists strengths, weak points, recruiter impression and bullet-point action steps.",
      color: "bg-coral text-primary-foreground",
    },
  ];

  return (
    <section className="py-8" aria-labelledby="what-it-does">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-coral-dark">What this website does</p>
          <h2 id="what-it-does" className="mt-2 font-display text-2xl sm:text-3xl">
            Your GitHub, turned into a game card
          </h2>
        </div>
        <Boxes className="hidden size-10 text-violet sm:block" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card, index) => (
          <article key={card.title} className="brutal press bg-card p-5" style={{ transform: `rotate(${(index - 1) * 0.7}deg)` }}>
            <div className={`grid size-12 place-items-center border-2 border-ink ${card.color} shadow-brutal-sm`}>{card.icon}</div>
            <h3 className="mt-4 font-display text-lg leading-tight">{card.title}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-ink/72">{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuoteStrip() {
  const line = "“Your README is your lobby screen.” • “Pinned repos should sell your strongest quest.” • “Stars help, but clarity converts.” • ";
  return (
    <section className="brutal my-8 overflow-hidden bg-ink py-3 text-paper" aria-label="Developer profile quotes">
      <div className="animate-marquee flex w-[200%] gap-8 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-widest">
        <span>{line.repeat(2)}</span>
        <span>{line.repeat(2)}</span>
      </div>
    </section>
  );
}

function Report({ profile, repos, report, onScanAnother }: { profile: GitHubUser; repos: GitHubRepo[]; report: AnalysisReport; onScanAnother: () => void }) {
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3);
  const langCounts = repos.reduce<Record<string, number>>((acc, r) => {
    if (!r.language) return acc;
    acc[r.language] = (acc[r.language] ?? 0) + 1;
    return acc;
  }, {});
  const totalLang = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
  const langs = Object.entries(langCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, pct: Math.round((count / totalLang) * 100) }));

  const langColors = ["bg-coral", "bg-blue", "bg-yellow", "bg-mint", "bg-violet"];

  return (
    <div className="mt-12 space-y-6" id="report">
      <section className="brutal animate-pop-in overflow-hidden bg-card">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px] lg:p-6">
          <div className="flex items-start gap-4">
            <img src={profile.avatar_url} alt={`${profile.login} avatar`} width={96} height={96} className="brutal-sm size-24 shrink-0 bg-muted object-cover" />
            <div className="min-w-0 flex-1">
              <div className="game-pill mb-2 inline-flex bg-lime px-3 py-1 font-mono text-[10px] font-bold uppercase">player card unlocked</div>
              <h2 className="font-display text-2xl leading-tight">{profile.name ?? profile.login}</h2>
              <a href={profile.html_url} target="_blank" rel="noreferrer" className="font-mono text-sm font-bold text-coral-dark">
                @{profile.login}
              </a>
              {profile.bio && <p className="mt-2 max-w-2xl text-sm font-medium text-ink/75">{profile.bio}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <Stat icon={<Users className="size-3.5" />} label="Followers" value={profile.followers} />
            <Stat icon={<FolderGit2 className="size-3.5" />} label="Repos" value={profile.public_repos} />
            <Stat icon={<Star className="size-3.5 fill-yellow stroke-ink" />} label="Stars" value={totalStars} />
          </div>
        </div>
        <p className="border-t-2 border-ink bg-yellow/50 px-5 py-4 text-base font-bold italic lg:px-6">“{report.headline}”</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="brutal animate-pop-in grid place-items-center bg-panel-2 p-6" style={{ animationDelay: "80ms" }}>
          <ScoreGauge value={report.overallScore} />
          <div className="mt-5 text-center">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">Star rating</div>
            <div className="mt-2 flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`size-7 stroke-ink stroke-[2px] ${i < report.starRating ? "fill-yellow" : "fill-muted"}`} />
              ))}
            </div>
            <div className="mt-2 font-mono text-xs font-bold">{report.starRating}.0 / 5.0</div>
          </div>
        </div>

        <section className="brutal animate-pop-in bg-card p-5" style={{ animationDelay: "120ms" }}>
          <SectionTitle icon={<Activity className="size-4" />}>Quick read</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InsightBox label="Recruiter quote" text={`“${report.recruiterImpression}”`} />
            <InsightBox label="Resume impact" text={`${report.resumeImpact.verdict} (${report.resumeImpact.score}/100)`} />
          </div>
        </section>
      </section>

      {langs.length > 0 && (
        <section className="brutal animate-pop-in bg-card p-5" style={{ animationDelay: "160ms" }}>
          <SectionTitle icon={<TerminalSquare className="size-4" />}>Language breakdown</SectionTitle>
          <div className="mt-4 space-y-3">
            {langs.map((l, i) => (
              <div key={l.name}>
                <div className="mb-1 flex justify-between font-mono text-xs font-bold">
                  <span>{l.name}</span>
                  <span>{l.pct}%</span>
                </div>
                <div className="brutal-sm h-4 overflow-hidden bg-muted p-0">
                  <div className={`h-full ${langColors[i % langColors.length]}`} style={{ width: `${l.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {topRepos.length > 0 && (
        <section className="animate-pop-in space-y-3" style={{ animationDelay: "200ms" }}>
          <SectionTitle icon={<FolderGit2 className="size-4" />}>Flagship repositories</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-3">
            {topRepos.map((r, i) => (
              <a key={r.name} href={r.html_url} target="_blank" rel="noreferrer" className="brutal press block bg-card p-4" style={{ transform: `rotate(${(i - 1) * 0.8}deg)` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base">{r.name}</h3>
                    {r.description && <p className="mt-2 line-clamp-3 text-xs font-medium leading-relaxed text-ink/70">{r.description}</p>}
                  </div>
                  <div className="shrink-0 rounded-xl border-2 border-ink bg-yellow px-2 py-1 text-right font-mono text-xs font-bold">
                    <div className="flex items-center gap-1">
                      <Star className="size-3 fill-coral stroke-ink" />
                      {r.stargazers_count}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-ink/70">
                      <GitFork className="size-3" />
                      {r.forks_count}
                    </div>
                  </div>
                </div>
                {r.language && <span className="game-pill mt-4 inline-flex bg-mint px-3 py-1 font-mono text-[10px] font-bold uppercase">{r.language}</span>}
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard accent="bg-mint" title="Strengths" icon={<CheckCircle2 className="size-4" />} items={report.strengths} marker="+" markerClass="text-ink" delay={240} />
        <ListCard accent="bg-coral" title="Weak points" icon={<AlertTriangle className="size-4" />} items={report.weaknesses} marker="−" markerClass="text-coral-dark" delay={280} />
      </div>

      <section className="brutal animate-pop-in bg-violet p-5 text-paper" style={{ animationDelay: "320ms" }}>
        <SectionTitle icon={<Quote className="size-4" />}>Coach quote</SectionTitle>
        <div className="mt-4 flex gap-3">
          <img src={robotMascot} alt="" width={56} height={56} className="brutal-sm size-14 shrink-0 bg-card p-1" />
          <p className="text-sm font-semibold italic leading-relaxed text-paper">“Great GitHub profiles do not just show code. They show decisions, proof, and momentum.”</p>
        </div>
      </section>

      <section className="brutal animate-pop-in bg-card p-5" style={{ animationDelay: "360ms" }}>
        <SectionTitle icon={<Sparkles className="size-4" />}>Bullet-point action plan</SectionTitle>
        <ol className="mt-4 grid gap-3 lg:grid-cols-2">
          {report.recommendations.map((r, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border-2 border-ink bg-panel-2 p-3">
              <span className="grid size-8 shrink-0 place-items-center border-2 border-ink bg-coral font-mono text-xs font-bold text-primary-foreground shadow-brutal-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="pt-1 text-sm font-semibold leading-snug">{r}</span>
            </li>
          ))}
        </ol>
      </section>

      <BoostRating profile={profile} repos={repos} report={report} />

      <button onClick={onScanAnother} className="brutal press flex w-full items-center justify-center gap-2 bg-ink py-4 font-display text-lg tracking-wide text-paper disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50">
        <RotateCcw className="size-4" /> Scan another profile
      </button>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-current/75">
      {icon}
      {children}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="brutal-sm bg-paper px-2 py-2 text-center">
      <div className="flex items-center justify-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
        {icon} {label}
      </div>
      <div className="font-display text-lg leading-tight">{value.toLocaleString()}</div>
    </div>
  );
}

function InsightBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-3xl border-2 border-ink bg-panel-2 p-4 shadow-brutal-sm">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral-dark">{label}</div>
      <p className="mt-2 text-sm font-semibold leading-relaxed">{text}</p>
    </div>
  );
}

function ListCard({ accent, title, icon, items, marker, markerClass, delay }: { accent: string; title: string; icon: ReactNode; items: string[]; marker: string; markerClass: string; delay: number }) {
  return (
    <section className="brutal animate-pop-in overflow-hidden bg-card" style={{ animationDelay: `${delay}ms` }}>
      <div className={`flex items-center gap-2 border-b-2 border-ink ${accent} px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest ${accent === "bg-coral" ? "text-primary-foreground" : "text-ink"}`}>
        {icon}
        {title}
      </div>
      <ul className="space-y-2 p-4">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm font-semibold leading-snug">
            <span className={`font-mono font-bold ${markerClass}`}>{marker}</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScoreGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const angle = (pct / 100) * 360;
  return (
    <div className="brutal-sm relative grid size-44 place-items-center rounded-full bg-card" style={{ background: `conic-gradient(var(--coral) ${angle}deg, var(--mint) ${angle}deg)` }}>
      <div className="brutal-sm grid size-32 place-items-center rounded-full bg-card">
        <div className="text-center">
          <div className="font-display text-4xl leading-none">{pct}</div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">/ 100</div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-14 pb-4 text-center">
      <div className="brutal inline-flex flex-wrap items-center justify-center gap-2 bg-ink px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-paper">
        <span>Built for developer glow-ups</span>
        <span className="text-lime">© @MANNJAIN</span>
      </div>
    </footer>
  );
}

function BoostRating({ profile, repos, report }: { profile: GitHubUser; repos: GitHubRepo[]; report: AnalysisReport }) {
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const withDesc = repos.filter((r) => (r.description ?? "").trim().length > 10).length;
  const descPct = repos.length ? Math.round((withDesc / repos.length) * 100) : 0;
  const langSet = new Set(repos.map((r) => r.language).filter(Boolean));
  const now = Date.now();
  const recent = repos.filter((r) => now - new Date(r.updated_at).getTime() < 1000 * 60 * 60 * 24 * 90).length;
  const hasBio = !!(profile.bio && profile.bio.trim().length > 10);
  const pinnedWorthy = repos.filter((r) => r.stargazers_count >= 3 || (r.description ?? "").length > 20).length;

  type Tip = { title: string; why: string; gain: string; done: boolean; color: string };
  const tips: Tip[] = [
    {
      title: hasBio ? "Bio is set — keep it sharp" : "Write a punchy 1-line bio",
      why: "Recruiters read the bio before any repo. Say what you build + your stack.",
      gain: "+5 score",
      done: hasBio,
      color: "bg-yellow",
    },
    {
      title: descPct >= 70 ? `Great — ${descPct}% of repos have descriptions` : `Add descriptions to repos (${descPct}% done)`,
      why: "A clear one-liner per repo turns a list of names into a portfolio.",
      gain: "+8 score",
      done: descPct >= 70,
      color: "bg-mint",
    },
    {
      title: pinnedWorthy >= 3 ? "Pin your 6 strongest repos" : "Build 3+ flagship repos worth pinning",
      why: "Pinned repos are your shop window. Lead with depth, not quantity.",
      gain: "+10 score",
      done: pinnedWorthy >= 6,
      color: "bg-coral text-primary-foreground",
    },
    {
      title: totalStars >= 25 ? `Nice — ${totalStars} total stars` : "Ship one shareable mini-project",
      why: "A useful tool, demo, or template attracts stars and proves shipping skill.",
      gain: "+12 score",
      done: totalStars >= 25,
      color: "bg-violet text-paper",
    },
    {
      title: recent >= 3 ? "Activity looks healthy" : "Push commits in the last 90 days",
      why: "Recent updates show momentum. Empty graphs read as inactive.",
      gain: "+7 score",
      done: recent >= 3,
      color: "bg-lime",
    },
    {
      title: langSet.size >= 3 ? `Solid range — ${langSet.size} languages` : "Show 3+ languages or a clear specialty",
      why: "Either go deep on a niche or show range. Avoid one-language clutter.",
      gain: "+6 score",
      done: langSet.size >= 3,
      color: "bg-blue text-paper",
    },
    {
      title: "Add a polished README to your top repo",
      why: "Hero image, what it does, install steps, demo link. README = first impression.",
      gain: "+9 score",
      done: false,
      color: "bg-yellow",
    },
    {
      title: "Make your username profile README",
      why: `A repo named "${profile.login}" becomes your profile page. Add stack, projects, contact.`,
      gain: "+6 score",
      done: false,
      color: "bg-mint",
    },
  ];

  const todo = tips.filter((t) => !t.done);
  const done = tips.filter((t) => t.done);
  const potential = Math.min(100, report.overallScore + todo.reduce((s, t) => s + parseInt(t.gain.replace(/\D/g, ""), 10), 0));

  return (
    <section className="brutal animate-pop-in bg-card p-5" style={{ animationDelay: "400ms" }} aria-labelledby="boost-rating">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionTitle icon={<Trophy className="size-4" />}>Boost your rating</SectionTitle>
          <h3 id="boost-rating" className="mt-2 font-display text-2xl leading-tight">How to push your score higher</h3>
          <p className="mt-1 text-sm font-medium text-ink/70">Personalized to {profile.login}. Tick these off and rescan.</p>
        </div>
        <div className="brutal-sm bg-lime px-4 py-2 text-center">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">Potential</div>
          <div className="font-display text-2xl leading-none">{report.overallScore} → {potential}</div>
        </div>
      </div>

      <ol className="mt-5 grid gap-3 lg:grid-cols-2">
        {todo.map((t, i) => (
          <li key={i} className="brutal-sm flex gap-3 bg-panel-2 p-3">
            <span className={`grid size-9 shrink-0 place-items-center border-2 border-ink font-display text-sm ${t.color} shadow-brutal-sm`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-display text-base leading-tight">{t.title}</h4>
                <span className="shrink-0 rounded-full border-2 border-ink bg-yellow px-2 py-0.5 font-mono text-[10px] font-bold">{t.gain}</span>
              </div>
              <p className="mt-1 text-xs font-medium leading-relaxed text-ink/70">{t.why}</p>
            </div>
          </li>
        ))}
      </ol>

      {done.length > 0 && (
        <div className="mt-5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">Already winning</div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {done.map((t, i) => (
              <li key={i} className="game-pill inline-flex items-center gap-1 bg-mint px-3 py-1 font-mono text-[10px] font-bold uppercase">
                <CheckCircle2 className="size-3" /> {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}