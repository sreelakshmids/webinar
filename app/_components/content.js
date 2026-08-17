// Copy for the Full Stack Roadmap webinar landing page.
//
// Kept out of the component so the wording can be reviewed and edited without
// reading JSX. Nothing here is a claim about outcomes or a student quote —
// testimonials live in CONFIG.testimonials and are real-students-only.

// Seven stages → the `01 / 07` numbered hairline grid the homepage uses for
// its capability cards.
export const ROADMAP = [
  {
    title: "The foundations people skip",
    body: "Semantic HTML, the parts of modern CSS that actually carry a layout, and the browser model underneath both. Where most self-taught paths quietly break.",
    tags: ["HTML", "CSS", "Layout"],
  },
  {
    title: "JavaScript, properly",
    body: "The language before the framework: scope, closures, the event loop, promises, modules. Learn this once and every framework after it gets easier.",
    tags: ["ES2023", "Async", "Modules"],
  },
  {
    title: "React as a mental model",
    body: "State, effects and composition explained as a model you can reason about, rather than a list of hooks to memorise before an interview.",
    tags: ["React", "State", "Hooks"],
  },
  {
    title: "The backend you can defend",
    body: "Node and Express, REST design that survives a second client, and where the real boundaries between layers belong.",
    tags: ["Node", "Express", "REST"],
  },
  {
    title: "Data and schema design",
    body: "MongoDB, modelling for how the data is read, indexes, and the queries that get slow at ten thousand rows instead of ten.",
    tags: ["MongoDB", "Mongoose", "Indexes"],
  },
  {
    title: "Auth, security, testing",
    body: "Sessions and tokens, the OWASP items that come up in every review, and enough testing to change code without fear.",
    tags: ["JWT", "OWASP", "Testing"],
  },
  {
    title: "Ship it and prove it",
    body: "Deployment, CI, environment config and logs — the difference between a repo and a product a hiring manager can open.",
    tags: ["CI/CD", "Deploy", "Logs"],
  },
];

export const STACK_GROUPS = [
  {
    label: "Frontend",
    items: ["HTML", "CSS", "JavaScript", "React", "Next.js", "TypeScript"],
  },
  {
    label: "Backend",
    items: ["Node.js", "Express", "REST", "JWT", "Zod"],
  },
  {
    label: "Data",
    items: ["MongoDB", "Mongoose", "Indexing", "Aggregation"],
  },
  {
    label: "Ship",
    items: ["Git", "GitHub Actions", "Docker", "Vercel", "AWS"],
  },
];

export const AUDIENCE_FOR = [
  {
    lead: "Students in B.Tech, BCA or MCA",
    rest: "who want a plan for the next twelve months instead of another playlist.",
  },
  {
    lead: "Fresh graduates",
    rest: "sending applications with no replies and no idea which gap is costing them.",
  },
  {
    lead: "Career switchers",
    rest: "coming from a non-CS background who need the order of learning, not more content.",
  },
  {
    lead: "Self-taught developers",
    rest: "who can build things but keep stalling at the same interview round.",
  },
];

export const AUDIENCE_NOT_FOR = [
  {
    lead: "Anyone looking for a shortcut",
    rest: "— this is a roadmap, and the roadmap takes months of work to walk.",
  },
  {
    lead: "Senior engineers",
    rest: "already shipping full stack systems in production. You know this material.",
  },
  {
    lead: "People wanting a live coding class",
    rest: "— the session is about sequencing and judgement, not typing along.",
  },
];

export const TAKEAWAYS = [
  {
    lead: "A written 12-month roadmap",
    rest: "with the order to learn things in and roughly how long each stage takes.",
  },
  {
    lead: "The skip list",
    rest: "— the technologies people burn months on that no junior job actually asks for.",
  },
  {
    lead: "A portfolio standard",
    rest: "that describes what a project has to demonstrate before it belongs on a CV.",
  },
  {
    lead: "How hiring actually reads a profile",
    rest: "for a junior full stack role in India, and what changes the read.",
  },
  {
    lead: "Live Q&A",
    rest: "— bring the question you've been stuck on and ask it directly.",
  },
];
