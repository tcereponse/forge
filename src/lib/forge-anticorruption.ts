// Anti-corruption utilities for generated code.
// Implements the 3 safeguards from the CODE_GENERATION_CORRUPTION_PRD:
//   1. Safe JSON string unescaping (fixes the \n → n corruption at the source)
//   2. Post-write crash-test (detect corrupted files: long first line, pattern (;|})n(keyword))
//   3. Auto-repair (replace corrupted 'n' with real newlines)

/**
 * Properly unescape a JSON string value captured from a raw JSON text.
 * This is the CRITICAL fix: the old code used .replace(/\\(.)/g, "$1") which
 * turned the JSON escape \n into a literal 'n' (corruption).
 * This function correctly converts \n → newline, \t → tab, \" → ", \\ → \, etc.
 */
export function unescapeJsonString(raw: string): string {
  let result = "";
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === "\\" && i + 1 < raw.length) {
      const next = raw[i + 1];
      switch (next) {
        case "n":
          result += "\n";
          break;
        case "t":
          result += "\t";
          break;
        case "r":
          result += "\r";
          break;
        case '"':
          result += '"';
          break;
        case "\\":
          result += "\\";
          break;
        case "/":
          result += "/";
          break;
        case "b":
          result += "\b";
          break;
        case "f":
          result += "\f";
          break;
        case "u": {
          // Unicode escape \uXXXX
          const hex = raw.slice(i + 2, i + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            result += String.fromCharCode(parseInt(hex, 16));
            i += 4; // skip XXXX (loop adds the +2 below)
          } else {
            // Invalid unicode escape — keep literally
            result += ch + next;
          }
          break;
        }
        default:
          // Unknown escape — keep the backslash and char
          result += ch + next;
      }
      i += 2;
    } else {
      result += ch;
      i += 1;
    }
  }
  return result;
}

// ── Corruption detection ────────────────────────────────────────────────────

export interface CorruptionFinding {
  file: string;
  type: "long-first-line" | "corrupted-pattern" | "no-newlines";
  detail: string;
  firstLineLength: number;
  lineCount: number;
}

// Regex from the PRD: detect a literal 'n' where a newline should be,
// i.e. after ; or } and before a JS keyword.
const CORRUPTED_PATTERN =
  /(?:;|})n(?:import|const|let|var|function|return|export|if|for|while|class|interface|type|async|await|default)\b/g;

/**
 * Crash-test: detect if a file's newlines were corrupted.
 * Returns findings if the file is suspicious.
 */
export function detectCorruption(
  content: string,
  filePath: string
): CorruptionFinding[] {
  const findings: CorruptionFinding[] = [];

  if (!content || content.length === 0) return findings;

  const lines = content.split("\n");
  const firstLine = lines[0] ?? "";
  const lineCount = lines.length;

  // Test 1: First line abnormally long (> 300 chars) = newlines collapsed
  if (firstLine.length > 300) {
    findings.push({
      file: filePath,
      type: "long-first-line",
      detail: `Première ligne de ${firstLine.length} caractères (seuil: 300). Les sauts de ligne ont probablement été corrompus.`,
      firstLineLength: firstLine.length,
      lineCount,
    });
  }

  // Test 2: File has very few lines but lots of content = newlines collapsed
  // (a real source file with >500 chars should have >5 lines)
  if (content.length > 500 && lineCount < 5) {
    findings.push({
      file: filePath,
      type: "no-newlines",
      detail: `Fichier de ${content.length} caractères mais seulement ${lineCount} lignes. Sauts de ligne manquants.`,
      firstLineLength: firstLine.length,
      lineCount,
    });
  }

  // Test 3: Corrupted pattern (;|})n(keyword) — literal n where newline should be
  const matches = content.match(CORRUPTED_PATTERN);
  if (matches && matches.length > 0) {
    findings.push({
      file: filePath,
      type: "corrupted-pattern",
      detail: `${matches.length} motif(s) corrompu(s) détecté(s): « ;n » ou « }n » suivi d'un mot-clé. Ex: "${matches[0].slice(0, 40)}".`,
      firstLineLength: firstLine.length,
      lineCount,
    });
  }

  return findings;
}

// ── Auto-repair ─────────────────────────────────────────────────────────────

/**
 * Attempt to repair corrupted newlines.
 * Replaces literal 'n' that follows ; or } and precedes a keyword
 * with a real newline character.
 */
export function repairCorruptedNewlines(content: string): string {
  // Replace ;nkeyword → ;\nkeyword  and  }nkeyword → }\nkeyword
  let repaired = content.replace(
    /(;|})n(import|const|let|var|function|return|export|if|for|while|class|interface|type|async|await|default)\b/g,
    "$1\n$2"
  );

  // Also handle the pattern where the literal 'n' appears after other line-ending
  // contexts, like string-end + n + keyword: 'something'nimport → 'something'\nimport
  repaired = repaired.replace(
    /(['"])n(import|const|let|var|function|return|export)\b/g,
    "$1\n$2"
  );

  return repaired;
}

/**
 * Full corruption check + repair pass on a file.
 * Returns { content, wasRepaired, findings }.
 */
export function sanitizeFileContent(
  content: string,
  filePath: string
): {
  content: string;
  wasRepaired: boolean;
  findings: CorruptionFinding[];
} {
  const findings = detectCorruption(content, filePath);

  if (findings.length === 0) {
    return { content, wasRepaired: false, findings: [] };
  }

  // Attempt repair
  const repaired = repairCorruptedNewlines(content);
  const postFindings = detectCorruption(repaired, filePath);

  return {
    content: repaired,
    wasRepaired: postFindings.length < findings.length,
    findings: postFindings, // remaining issues after repair
  };
}
