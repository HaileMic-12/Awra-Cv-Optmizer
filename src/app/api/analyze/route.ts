import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Production Hybrid ATS Analyzer
 *
 * Architecture:
 *
 * Deterministic: 50 points
 * --------------------------------
 * Required skills       20
 * Preferred skills       5
 * Keyword coverage       5
 * Education              5
 * Experience            10
 * CV completeness        5
 *
 * AI semantic: 50 points
 * --------------------------------
 * Semantic skill match  20
 * Responsibility match  15
 * Education context      5
 * Title relevance        5
 * Evidence quality       5
 *
 * IMPORTANT:
 * Gemini NEVER decides the final ATS score.
 * Gemini only supplies semantic evidence.
 * The server validates that evidence before awarding points.
 */

const MODEL = "gemini-3.8-flash";

const MAX_CV_LENGTH = 80_000;
const MAX_JOB_LENGTH = 50_000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* =========================================================
   TYPES
========================================================= */

type SkillCategory =
  | "language"
  | "framework"
  | "database"
  | "backend"
  | "devops"
  | "tool"
  | "cloud"
  | "other";

interface SkillDefinition {
  canonical: string;
  category: SkillCategory;
  aliases: string[];
}

interface SkillRequirement {
  skill: string;
  importance: "required" | "preferred";
  evidence: string;
}

interface SemanticEvidence {
  requirement: string;
  type:
    | "skill"
    | "responsibility"
    | "education"
    | "title"
    | "evidence";
  cvEvidence: string;
  explanation: string;
  confidence: number;
}

interface AIAnalysis {
  semanticSkills: SemanticEvidence[];
  responsibilities: SemanticEvidence[];
  educationEvidence: SemanticEvidence[];
  titleEvidence: SemanticEvidence[];
  evidenceQuality: SemanticEvidence[];
}

interface ScoreBreakdown {
  deterministic: {
    requiredSkills: number;
    preferredSkills: number;
    keywordCoverage: number;
    education: number;
    experience: number;
    completeness: number;
    total: number;
  };

  semantic: {
    skills: number;
    responsibilities: number;
    education: number;
    title: number;
    evidenceQuality: number;
    total: number;
  };

  final: number;
}

/* =========================================================
   SKILL DICTIONARY
========================================================= */

const SKILLS: SkillDefinition[] = [
  {
    canonical: "JavaScript",
    category: "language",
    aliases: ["javascript", "js", "ecmascript"],
  },
  {
    canonical: "TypeScript",
    category: "language",
    aliases: ["typescript", "ts"],
  },
  {
    canonical: "Java",
    category: "language",
    aliases: ["java"],
  },
  {
    canonical: "Python",
    category: "language",
    aliases: ["python", "py"],
  },
  {
    canonical: "C++",
    category: "language",
    aliases: ["c++", "cpp"],
  },
  {
    canonical: "C#",
    category: "language",
    aliases: ["c#", "csharp", "c sharp"],
  },
  {
    canonical: "PHP",
    category: "language",
    aliases: ["php"],
  },
  {
    canonical: "SQL",
    category: "language",
    aliases: ["sql"],
  },

  {
    canonical: "React",
    category: "framework",
    aliases: ["react", "reactjs", "react.js"],
  },
  {
    canonical: "React Native",
    category: "framework",
    aliases: ["react native", "reactnative"],
  },
  {
    canonical: "Next.js",
    category: "framework",
    aliases: ["next.js", "nextjs", "next js"],
  },
  {
    canonical: "Node.js",
    category: "backend",
    aliases: ["node.js", "nodejs", "node js"],
  },
  {
    canonical: "Express.js",
    category: "backend",
    aliases: ["express", "express.js", "expressjs"],
  },
  {
    canonical: "Laravel",
    category: "framework",
    aliases: ["laravel"],
  },
  {
    canonical: "Django",
    category: "framework",
    aliases: ["django"],
  },
  {
    canonical: "Spring",
    category: "framework",
    aliases: ["spring", "spring boot", "springboot"],
  },

  {
    canonical: "Firebase",
    category: "backend",
    aliases: ["firebase"],
  },
  {
    canonical: "REST API",
    category: "backend",
    aliases: ["rest api", "restful api", "restful services"],
  },
  {
    canonical: "GraphQL",
    category: "backend",
    aliases: ["graphql"],
  },

  {
    canonical: "MySQL",
    category: "database",
    aliases: ["mysql"],
  },
  {
    canonical: "PostgreSQL",
    category: "database",
    aliases: ["postgresql", "postgres"],
  },
  {
    canonical: "MongoDB",
    category: "database",
    aliases: ["mongodb", "mongo db", "mongo"],
  },
  {
    canonical: "Redis",
    category: "database",
    aliases: ["redis"],
  },

  {
    canonical: "Git",
    category: "tool",
    aliases: ["git"],
  },
  {
    canonical: "GitHub",
    category: "tool",
    aliases: ["github", "git hub"],
  },
  {
    canonical: "Docker",
    category: "devops",
    aliases: ["docker"],
  },
  {
    canonical: "Kubernetes",
    category: "devops",
    aliases: ["kubernetes", "k8s"],
  },
  {
    canonical: "AWS",
    category: "cloud",
    aliases: ["aws", "amazon web services"],
  },
  {
    canonical: "Azure",
    category: "cloud",
    aliases: ["azure", "microsoft azure"],
  },
  {
    canonical: "Google Cloud",
    category: "cloud",
    aliases: ["google cloud", "gcp", "google cloud platform"],
  },

  {
    canonical: "Tailwind CSS",
    category: "framework",
    aliases: ["tailwind", "tailwind css"],
  },
  {
    canonical: "Bootstrap",
    category: "framework",
    aliases: ["bootstrap"],
  },
];

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[•●▪◦]/g, " ")
    .replace(/[^\p{L}\p{N}+#./-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Used for comparing evidence.
 * Removes punctuation and common stop words.
 */
function tokenize(value: string): string[] {
  return normalizeText(value)
    .replace(/[+#./-]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 2 &&
        ![
          "the",
          "and",
          "for",
          "with",
          "from",
          "this",
          "that",
          "are",
          "was",
          "were",
          "has",
          "have",
          "had",
          "using",
          "used",
        ].includes(word)
    );
}

/* =========================================================
   SAFE STRING HANDLING
========================================================= */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cleanInput(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

/* =========================================================
   SKILL MATCHING
========================================================= */

/**
 * Exact phrase matching with boundaries.
 *
 * This prevents:
 *
 * Java -> JavaScript
 *
 * from being considered a match.
 */
function containsPhrase(text: string, phrase: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);

  if (!normalizedText || !normalizedPhrase) return false;

  const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`,
    "iu"
  );

  return regex.test(normalizedText);
}

function getSkillDefinition(
  skill: string
): SkillDefinition | undefined {
  const normalized = normalizeText(skill);

  return SKILLS.find((definition) =>
    definition.aliases.some(
      (alias) => normalizeText(alias) === normalized
    )
  );
}

function canonicalSkill(skill: string): string | null {
  const definition = getSkillDefinition(skill);

  return definition?.canonical ?? null;
}

function extractSkills(text: string): string[] {
  const found = new Set<string>();

  for (const skill of SKILLS) {
    for (const alias of skill.aliases) {
      if (containsPhrase(text, alias)) {
        found.add(skill.canonical);
        break;
      }
    }
  }

  return [...found];
}

function skillExists(text: string, skill: string): boolean {
  const definition = getSkillDefinition(skill);

  if (!definition) {
    return containsPhrase(text, skill);
  }

  return definition.aliases.some((alias) =>
    containsPhrase(text, alias)
  );
}

/* =========================================================
   JOB REQUIREMENT EXTRACTION
========================================================= */

/**
 * Deterministic extraction of explicit technical skills.
 *
 * Gemini can discover semantic requirements later,
 * but explicit skills are always verified against the actual JD.
 */
function extractExplicitJobSkills(jobDescription: string) {
  const required: SkillRequirement[] = [];
  const preferred: SkillRequirement[] = [];

  const normalizedJob = normalizeText(jobDescription);

  for (const skill of SKILLS) {
    const foundAlias = skill.aliases.find((alias) =>
      containsPhrase(normalizedJob, alias)
    );

    if (!foundAlias) continue;

    const index = normalizedJob.indexOf(normalizeText(foundAlias));

    const surroundingText = normalizedJob.slice(
      Math.max(0, index - 180),
      Math.min(
        normalizedJob.length,
        index + normalizeText(foundAlias).length + 180
      )
    );

    const preferredWords = [
      "preferred",
      "nice to have",
      "bonus",
      "plus",
      "desirable",
      "advantage",
    ];

    const requiredWords = [
      "required",
      "must",
      "essential",
      "mandatory",
      "strong knowledge",
      "proficiency",
      "proficient",
      "experience with",
      "experience in",
    ];

    const isPreferred = preferredWords.some((word) =>
      surroundingText.includes(word)
    );

    const isRequired = requiredWords.some((word) =>
      surroundingText.includes(word)
    );

    const item: SkillRequirement = {
      skill: skill.canonical,
      importance: isPreferred && !isRequired
        ? "preferred"
        : "required",
      evidence: surroundingText,
    };

    if (item.importance === "preferred") {
      preferred.push(item);
    } else {
      required.push(item);
    }
  }

  return {
    required,
    preferred,
  };
}

/* =========================================================
   KEYWORD COVERAGE
========================================================= */

const STOP_WORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "also",
  "been",
  "being",
  "between",
  "could",
  "from",
  "have",
  "into",
  "more",
  "other",
  "should",
  "their",
  "there",
  "these",
  "those",
  "through",
  "using",
  "which",
  "while",
  "would",
  "your",
  "will",
  "with",
  "that",
  "this",
  "they",
  "them",
  "then",
  "than",
  "such",
  "must",
  "required",
  "requirements",
  "candidate",
  "candidates",
  "role",
  "position",
  "responsibilities",
  "experience",
]);

function extractImportantKeywords(jobDescription: string): string[] {
  const words = tokenize(jobDescription);

  const frequency = new Map<string, number>();

  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;

    frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .filter(([word, count]) => count >= 2 || word.length >= 7)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);
}

function calculateKeywordScore(
  cv: string,
  job: string
): number {
  const keywords = extractImportantKeywords(job);

  if (keywords.length === 0) {
    return 5;
  }

  const matched = keywords.filter((keyword) =>
    containsPhrase(cv, keyword)
  );

  return Math.round(
    (matched.length / keywords.length) * 5
  );
}

/* =========================================================
   EDUCATION
========================================================= */

const DEGREE_LEVELS = [
  {
    level: 4,
    names: [
      "phd",
      "doctorate",
      "doctoral",
    ],
  },
  {
    level: 3,
    names: [
      "master",
      "msc",
      "ma",
      "mba",
      "meng",
    ],
  },
  {
    level: 2,
    names: [
      "bachelor",
      "bsc",
      "ba",
      "beng",
      "btech",
    ],
  },
  {
    level: 1,
    names: [
      "diploma",
      "associate",
      "certificate",
    ],
  },
];

function detectDegreeLevel(text: string): number {
  const normalized = normalizeText(text);

  for (const degree of DEGREE_LEVELS) {
    if (
      degree.names.some((name) =>
        containsPhrase(normalized, name)
      )
    ) {
      return degree.level;
    }
  }

  return 0;
}

function detectRequiredDegree(job: string): number {
  const normalized = normalizeText(job);

  for (const degree of DEGREE_LEVELS) {
    if (
      degree.names.some((name) =>
        containsPhrase(normalized, name)
      )
    ) {
      return degree.level;
    }
  }

  return 0;
}

function calculateEducationScore(
  cv: string,
  job: string
): number {
  const requiredLevel = detectRequiredDegree(job);

  if (requiredLevel === 0) {
    return 5;
  }

  const candidateLevel = detectDegreeLevel(cv);

  if (candidateLevel === 0) {
    return 0;
  }

  if (candidateLevel >= requiredLevel) {
    return 5;
  }

  return 2;
}

/* =========================================================
   EXPERIENCE
========================================================= */

function extractYearsRequirement(job: string): number | null {
  const normalized = normalizeText(job);

  const matches = [
    /(\d+)\s*\+?\s*years?\s+of\s+(?:relevant\s+)?experience/gi,
    /minimum\s+(?:of\s+)?(\d+)\s*years?/gi,
    /at\s+least\s+(\d+)\s*years?/gi,
  ];

  for (const regex of matches) {
    const match = normalized.match(regex);

    if (match?.[1]) {
      const years = Number(match[1]);

      if (Number.isFinite(years)) {
        return years;
      }
    }
  }

  return null;
}

function extractCandidateYears(cv: string): number {
  const normalized = normalizeText(cv);

  const explicitMatches = [
    ...normalized.matchAll(
      /(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:professional\s+|relevant\s+)?experience/gi
    ),
  ];

  const years = explicitMatches
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);

  return years.length > 0 ? Math.max(...years) : 0;
}

function calculateExperienceScore(
  cv: string,
  job: string
): number {
  const requiredYears = extractYearsRequirement(job);

  if (requiredYears === null) {
    /**
     * No explicit years requirement.
     * We still reward evidence of experience.
     */
    const hasExperienceSection =
      /experience|employment|work history|internship|freelance|professional/i.test(
        cv
      );

    return hasExperienceSection ? 10 : 4;
  }

  const candidateYears = extractCandidateYears(cv);

  if (candidateYears >= requiredYears) {
    return 10;
  }

  if (candidateYears > 0) {
    return Math.round(
      (candidateYears / requiredYears) * 10
    );
  }

  return 0;
}

/* =========================================================
   CV COMPLETENESS
========================================================= */

function calculateCompletenessScore(cv: string): number {
  const checks = [
    /email|e-mail/i.test(cv),
    /phone|mobile|telephone/i.test(cv),
    /education|university|college|degree|bachelor|master/i.test(cv),
    /experience|employment|internship|freelance/i.test(cv),
    /skills|technical skills|technologies/i.test(cv),
    /project|projects/i.test(cv),
    /summary|profile|objective/i.test(cv),
    /github|linkedin|portfolio|website/i.test(cv),
    /language|languages/i.test(cv),
    /achievement|certification|certificate/i.test(cv),
  ];

  const percentage =
    checks.filter(Boolean).length / checks.length;

  return Math.round(percentage * 5);
}

/* =========================================================
   DETERMINISTIC SCORE
========================================================= */

function calculateRequiredSkillScore(
  cv: string,
  required: SkillRequirement[]
) {
  if (required.length === 0) {
    return {
      score: 20,
      matched: [],
      missing: [],
    };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const requirement of required) {
    if (skillExists(cv, requirement.skill)) {
      matched.push(requirement.skill);
    } else {
      missing.push(requirement.skill);
    }
  }

  const score = Math.round(
    (matched.length / required.length) * 20
  );

  return {
    score: clamp(score, 0, 20),
    matched,
    missing,
  };
}

function calculatePreferredSkillScore(
  cv: string,
  preferred: SkillRequirement[]
) {
  if (preferred.length === 0) {
    return {
      score: 5,
      matched: [],
    };
  }

  const matched = preferred.filter((requirement) =>
    skillExists(cv, requirement.skill)
  );

  return {
    score: Math.round(
      (matched.length / preferred.length) * 5
    ),
    matched: matched.map((item) => item.skill),
  };
}

/* =========================================================
   EVIDENCE VALIDATION
========================================================= */

function evidenceOverlap(evidence: string, source: string): number {
  const evidenceWords = new Set(tokenize(evidence));
  const sourceWords = new Set(tokenize(source));
  if (evidenceWords.size === 0) return 0;

  let overlap = 0;
  for (const word of evidenceWords) {
    if (sourceWords.has(word)) overlap++;
  }
  return overlap / evidenceWords.size;
}

/**
 * Validate that Gemini's evidence is actually grounded in the CV.
 * The old 45% threshold rejected legitimate paraphrases. This version
 * accepts either reasonable lexical overlap or several concrete CV anchors.
 */
function validateEvidence(evidence: SemanticEvidence, cv: string): boolean {
  if (!evidence) return false;
  if (
    typeof evidence.cvEvidence !== "string" ||
    typeof evidence.explanation !== "string" ||
    typeof evidence.requirement !== "string"
  ) return false;

  if (
    typeof evidence.confidence !== "number" ||
    !Number.isFinite(evidence.confidence) ||
    evidence.confidence < 0 ||
    evidence.confidence > 1
  ) return false;

  const evidenceText = evidence.cvEvidence.trim();
  if (evidenceText.length < 8) return false;

  const overlap = evidenceOverlap(evidenceText, cv);
  const evidenceTokens = new Set(tokenize(evidenceText));
  const cvTokens = new Set(tokenize(cv));
  const sharedAnchors = [...evidenceTokens].filter((word) => cvTokens.has(word));

  // Short evidence must overlap strongly; longer paraphrases can pass with
  // a lower ratio when several concrete words are still grounded in the CV.
  const anchorMinimum = evidenceTokens.size >= 8 ? 3 : 2;
  return overlap >= 0.30 || sharedAnchors.length >= anchorMinimum;
}

function validEvidence(
  items: SemanticEvidence[] | unknown,
  cv: string
): SemanticEvidence[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is SemanticEvidence => Boolean(item))
    .filter((item) => validateEvidence(item, cv));
}

function semanticStrength(
  item: SemanticEvidence,
  cv: string
): number {
  const requirementTokens = new Set(tokenize(item.requirement));
  const evidenceTokens = new Set(tokenize(item.cvEvidence));
  const explanationTokens = new Set(tokenize(item.explanation));

  let requirementOverlap = 0;
  for (const token of requirementTokens) {
    if (evidenceTokens.has(token) || explanationTokens.has(token)) {
      requirementOverlap++;
    }
  }

  const requirementCoverage = requirementTokens.size
    ? requirementOverlap / requirementTokens.size
    : 0;

  const grounding = evidenceOverlap(item.cvEvidence, cv);

  // Confidence is supporting evidence, never the sole authority.
  return clamp(
    grounding * 0.45 +
      requirementCoverage * 0.20 +
      item.confidence * 0.35,
    0,
    1
  );
}

function scoreSemanticEvidence(
  items: SemanticEvidence[],
  cv: string,
  maxPoints: number,
  maxItems: number
): number {
  if (items.length === 0) return 0;

  const strengths = items
    .map((item) => semanticStrength(item, cv))
    .sort((a, b) => b - a)
    .slice(0, maxItems);

  if (strengths.length === 0) return 0;

  const average = strengths.reduce((sum, value) => sum + value, 0) / strengths.length;
  const coverage = Math.min(1, strengths.length / Math.min(4, maxItems));

  // Slightly generous: strong grounded evidence should receive meaningful
  // credit even when the CV uses different wording from the JD.
  return Math.round(
    clamp(maxPoints * (average * 0.75 + coverage * 0.25), 0, maxPoints)
  );
}

/* =========================================================
   AI SEMANTIC SCORE
========================================================= */

function calculateAIScore(ai: AIAnalysis, cv: string) {
  const skills = validEvidence(ai.semanticSkills, cv);
  const responsibilities = validEvidence(ai.responsibilities, cv);
  const education = validEvidence(ai.educationEvidence, cv);
  const title = validEvidence(ai.titleEvidence, cv);
  const quality = validEvidence(ai.evidenceQuality, cv);

  const skillsScore = scoreSemanticEvidence(skills, cv, 20, 8);
  const responsibilitiesScore = scoreSemanticEvidence(responsibilities, cv, 15, 6);
  const evidenceScore = scoreSemanticEvidence(quality, cv, 5, 5);

  const educationStrength = education.length
    ? Math.max(...education.map((item) => semanticStrength(item, cv)))
    : 0;
  const titleStrength = title.length
    ? Math.max(...title.map((item) => semanticStrength(item, cv)))
    : 0;

  const educationScore = Math.round(clamp(educationStrength * 5, 0, 5));
  const titleScore = Math.round(clamp(titleStrength * 5, 0, 5));

  // IMPORTANT: total is calculated from the exact integer values displayed
  // in each category. This eliminates the 14/50 vs 15/50 rounding bug.
  const rounded = {
    skills: clamp(skillsScore, 0, 20),
    responsibilities: clamp(responsibilitiesScore, 0, 15),
    education: clamp(educationScore, 0, 5),
    title: clamp(titleScore, 0, 5),
    evidenceQuality: clamp(evidenceScore, 0, 5),
  };

  const total = clamp(
    rounded.skills +
      rounded.responsibilities +
      rounded.education +
      rounded.title +
      rounded.evidenceQuality,
    0,
    50
  );

  return {
    ...rounded,
    total,
    validatedEvidence: {
      skills,
      responsibilities,
      education,
      title,
      quality,
    },
  };
}

/* =========================================================
   GEMINI SCHEMA
========================================================= */

const semanticEvidenceSchema = {
  type: Type.OBJECT,
  properties: {
    requirement: {
      type: Type.STRING,
    },
    type: {
      type: Type.STRING,
      enum: [
        "skill",
        "responsibility",
        "education",
        "title",
        "evidence",
      ],
    },
    cvEvidence: {
      type: Type.STRING,
    },
    explanation: {
      type: Type.STRING,
    },
    confidence: {
      type: Type.NUMBER,
    },
  },
  required: [
    "requirement",
    "type",
    "cvEvidence",
    "explanation",
    "confidence",
  ],
};

const aiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    semanticSkills: {
      type: Type.ARRAY,
      items: semanticEvidenceSchema,
    },
    responsibilities: {
      type: Type.ARRAY,
      items: semanticEvidenceSchema,
    },
    educationEvidence: {
      type: Type.ARRAY,
      items: semanticEvidenceSchema,
    },
    titleEvidence: {
      type: Type.ARRAY,
      items: semanticEvidenceSchema,
    },
    evidenceQuality: {
      type: Type.ARRAY,
      items: semanticEvidenceSchema,
    },
  },
  required: [
    "semanticSkills",
    "responsibilities",
    "educationEvidence",
    "titleEvidence",
    "evidenceQuality",
  ],
};

/* =========================================================
   GEMINI SEMANTIC ANALYSIS
========================================================= */

async function analyzeSemantically(
  cv: string,
  job: string
): Promise<AIAnalysis> {
  const prompt = `
You are the semantic evidence engine for a professional CV/job matching system.

Your job is NOT to calculate an ATS score.

You must analyze whether the candidate's CV provides semantic evidence that relates to the job description.

STRICT BUT FAIR RULES:

1. NEVER invent skills, experience, projects, education, employers, or achievements.
2. NEVER calculate the final ATS score.
3. You ARE allowed to recognize genuine semantic equivalence and contextual relationships.
4. Do not require identical wording when the CV clearly demonstrates the same underlying capability.
5. Examples of acceptable contextual interpretation:
   - "built web applications with React" supports React front-end development.
   - "consumed backend endpoints" can support API integration when the surrounding CV context clearly supports it.
   - "managed data with MySQL" supports relational database experience.
   - "deployed applications" supports deployment experience, but does not identify a cloud provider unless stated.
6. Do NOT treat merely adjacent technologies as identical. React is not automatically React Native; JavaScript is not automatically TypeScript; Node.js is not automatically Express.js; Firebase is not automatically AWS.
7. A related capability may receive semantic evidence when the CV contains real contextual evidence for that capability.
8. Every cvEvidence value must be a short quote or close paraphrase grounded in the supplied CV.
9. Prefer evidence from EXPERIENCE, PROJECTS, INTERNSHIPS, FREELANCE WORK, and detailed SKILLS descriptions over generic profile claims.
10. For each category, identify multiple distinct pieces of evidence when they genuinely exist. Do not duplicate the same sentence.
11. Confidence represents how strongly the CV evidence supports the relationship; use 0.60-0.75 for reasonable partial matches, 0.76-0.90 for strong matches, and 0.91-1.00 only for very clear matches.
12. Do not reject a match solely because the exact JD phrase is absent. Evaluate meaning, context, transferable responsibilities, and demonstrated outcomes.
13. If there is genuinely no supporting CV evidence, return an empty array rather than guessing.

SEMANTIC SKILLS:
Identify relevant skills demonstrated by the CV, including contextual synonyms and skills demonstrated through projects or responsibilities.
Separate direct matches from reasonable contextual matches in the explanation.

RESPONSIBILITIES:
Compare what the candidate actually did in experience, projects, internships, freelance work, or other detailed sections against what the job requires.
Give credit for transferable responsibilities when the underlying work is genuinely similar, even if job titles differ.

EDUCATION:
Determine whether the candidate's education provides relevant contextual evidence.

TITLE:
Determine whether the candidate's professional/project titles are semantically relevant to the target position.

EVIDENCE QUALITY:
Identify strong evidence such as:
- measurable accomplishments
- real projects
- professional experience
- deployed applications
- responsibilities closely matching the role

Do NOT reward generic claims such as:
"I am hardworking."
"I am passionate."
"I am a fast learner."

For cvEvidence, use a short quote or very close extract from the CV.

JOB DESCRIPTION:
${job}

CANDIDATE CV:
${cv}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: aiResponseSchema,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return JSON.parse(text) as AIAnalysis;
}

/* =========================================================
   RECOMMENDATIONS
========================================================= */

function generateRecommendations(args: {
  missingSkills: string[];
  matchedSkills: string[];
  keywordScore: number;
  educationScore: number;
  experienceScore: number;
  completenessScore: number;
}) {
  const recommendations: string[] = [];

  if (args.missingSkills.length > 0) {
    recommendations.push(
      `Missing required skills: ${args.missingSkills.join(
        ", "
      )}. Only add these to the CV if you genuinely have the skills.`
    );
  }

  if (args.keywordScore < 3) {
    recommendations.push(
      "The CV contains relatively few important terms from the job description. Where truthful, use the employer's terminology when describing existing experience."
    );
  }

  if (args.educationScore < 5) {
    recommendations.push(
      "Review the education requirements and make the relevant degree, field, institution, and certifications easy to identify."
    );
  }

  if (args.experienceScore < 7) {
    recommendations.push(
      "Make relevant experience and project responsibilities more explicit, especially work that directly relates to the target position."
    );
  }

  if (args.completenessScore < 4) {
    recommendations.push(
      "The CV appears to be missing some standard ATS-readable sections or contact/profile information."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "The CV has strong coverage of the analyzed requirements. Focus on measurable achievements and tailoring the summary to the specific role."
    );
  }

  return recommendations;
}

/* =========================================================
   ROUTE
========================================================= */

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    /* -----------------------------------------------------
       ENVIRONMENT VALIDATION
    ----------------------------------------------------- */

    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

    if (!geminiConfigured) {
      console.warn(
        `[${requestId}] GEMINI_API_KEY is missing. Using deterministic fallback analysis.`
      );
    }

    /* -----------------------------------------------------
       REQUEST BODY
    ----------------------------------------------------- */

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
          requestId,
        },
        { status: 400 }
      );
    }

    const raw = body as {
      cvData?: unknown;
      jobDescription?: unknown;
    };

    const cv = cleanInput(
      raw.cvData,
      MAX_CV_LENGTH
    );

    const jobDescription = cleanInput(
      raw.jobDescription,
      MAX_JOB_LENGTH
    );

    if (!cv) {
      return NextResponse.json(
        {
          error: "CV data is required.",
          requestId,
        },
        { status: 400 }
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        {
          error: "Job description is required.",
          requestId,
        },
        { status: 400 }
      );
    }

    if (cv.length < 100) {
      return NextResponse.json(
        {
          error:
            "The CV content is too short to analyze reliably.",
          requestId,
        },
        { status: 400 }
      );
    }

    if (jobDescription.length < 80) {
      return NextResponse.json(
        {
          error:
            "The job description is too short to analyze reliably.",
          requestId,
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       1. EXPLICIT REQUIREMENTS
    ----------------------------------------------------- */

    const jobRequirements =
      extractExplicitJobSkills(
        jobDescription
      );

    /* -----------------------------------------------------
       2. DETERMINISTIC SCORING
    ----------------------------------------------------- */

    const requiredResult =
      calculateRequiredSkillScore(
        cv,
        jobRequirements.required
      );

    const preferredResult =
      calculatePreferredSkillScore(
        cv,
        jobRequirements.preferred
      );

    const keywordScore =
      calculateKeywordScore(
        cv,
        jobDescription
      );

    const educationScore =
      calculateEducationScore(
        cv,
        jobDescription
      );

    const experienceScore =
      calculateExperienceScore(
        cv,
        jobDescription
      );

    const completenessScore =
      calculateCompletenessScore(cv);

    const deterministicTotal = clamp(
      requiredResult.score +
        preferredResult.score +
        keywordScore +
        educationScore +
        experienceScore +
        completenessScore,
      0,
      50
    );

    /* -----------------------------------------------------
       3. GEMINI SEMANTIC ANALYSIS WITH AUTOMATIC FALLBACK
    ----------------------------------------------------- */

    let aiAnalysis: AIAnalysis | null = null;
    let semanticAnalysisAvailable = false;
    let analysisMode: "ai" | "deterministic_fallback" = "ai";
    let fallbackReason: "missing_api_key" | "ai_unavailable" | null = null;

    if (geminiConfigured) {
      try {
        aiAnalysis = await analyzeSemantically(
          cv,
          jobDescription
        );
        semanticAnalysisAvailable = true;
      } catch (aiError) {
        console.error(
          `[${requestId}] Gemini analysis failed. Falling back to deterministic analysis:`,
          aiError
        );

        analysisMode = "deterministic_fallback";
        fallbackReason = "ai_unavailable";
      }
    } else {
      analysisMode = "deterministic_fallback";
      fallbackReason = "missing_api_key";
    }

    /* -----------------------------------------------------
       4. SEMANTIC SCORE
    ----------------------------------------------------- */

    const semantic = aiAnalysis
      ? calculateAIScore(aiAnalysis, cv)
      : {
          skills: 0,
          responsibilities: 0,
          education: 0,
          title: 0,
          evidenceQuality: 0,
          total: 0,
          validatedEvidence: {
            skills: [],
            responsibilities: [],
            education: [],
            title: [],
            quality: [],
          },
        };

    /* -----------------------------------------------------
       5. FINAL SCORE

       Normal mode:
         deterministic 50 + semantic AI 50 = 100

       Fallback mode:
         deterministic score is normalized from 50 to 100
         so the user still receives a normal ATS score.
         No unavailable AI points are invented.
    ----------------------------------------------------- */

    const finalScore = semanticAnalysisAvailable
      ? clamp(
          deterministicTotal + semantic.total,
          0,
          100
        )
      : clamp(
          Math.round(deterministicTotal * 2),
          0,
          100
        );

    /* -----------------------------------------------------
       6. RECOMMENDATIONS
    ----------------------------------------------------- */

    const recommendations =
      generateRecommendations({
        missingSkills: requiredResult.missing,
        matchedSkills: [
          ...requiredResult.matched,
          ...preferredResult.matched,
        ],
        keywordScore,
        educationScore,
        experienceScore,
        completenessScore,
      });

    /* -----------------------------------------------------
       7. FINAL RESPONSE
    ----------------------------------------------------- */

    const breakdown: ScoreBreakdown = {
      deterministic: {
        requiredSkills:
          requiredResult.score,
        preferredSkills:
          preferredResult.score,
        keywordCoverage:
          keywordScore,
        education:
          educationScore,
        experience:
          experienceScore,
        completeness:
          completenessScore,
        total:
          deterministicTotal,
      },

      semantic: {
        skills:
          semantic.skills,
        responsibilities:
          semantic.responsibilities,
        education:
          semantic.education,
        title:
          semantic.title,
        evidenceQuality:
          semantic.evidenceQuality,
        total:
          semantic.total,
      },

      final: finalScore,
    };

    return NextResponse.json({
      success: true,

      requestId,

      atsScore: finalScore,

      scoreModel: {
        deterministic: 50,
        semanticAI: 50,
        total: 100,
        activeMode: analysisMode,
        fallback: !semanticAnalysisAvailable,
      },

      breakdown,

      skills: {
        required: jobRequirements.required.map(
          (item) => item.skill
        ),

        preferred: jobRequirements.preferred.map(
          (item) => item.skill
        ),

        candidate: extractSkills(cv),

        matchedRequired:
          requiredResult.matched,

        missingRequired:
          requiredResult.missing,

        matchedPreferred:
          preferredResult.matched,
      },

      semanticEvidence:
        semantic.validatedEvidence,

      recommendations,

      metadata: {
        model: MODEL,
        semanticAnalysisAvailable,
        analysisMode,
        fallbackReason,
        analysisVersion: "3.0.0",
      },

      // Returned as part of a successful response so the frontend can
      // render an in-page notice instead of using a browser/system alert.
      notice: semanticAnalysisAvailable
        ? null
        : {
            type: "warning",
            title: "AI insights temporarily unavailable",
            message:
              "Your ATS analysis was completed using standard CV and job matching. Some AI-powered semantic insights are temporarily unavailable.",
          },
    });
  } catch (error) {
    console.error(
      "ATS analysis error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to analyze the CV at this time.",
      },
      { status: 500 }
    );
  }
}