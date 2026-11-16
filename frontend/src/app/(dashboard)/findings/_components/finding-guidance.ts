/**
 * Static, category-level guidance. This is reference material, not data about a
 * specific finding; the UI labels it as guidance wherever it is shown.
 */
export interface CategoryGuidance {
  /** What this class of vulnerability typically enables. */
  impact: string;
  remediation: string[];
}

const DEFAULT_GUIDANCE: CategoryGuidance = {
  impact:
    'The target deviated from its expected security behaviour under adversarial input. Review the evidence to determine reachability and exploitability.',
  remediation: [
    'Reproduce the case from the linked execution and confirm the failing assertion.',
    'Add a targeted guardrail or policy check at the boundary where the behaviour occurred.',
    'Re-run the suite and capture a regression baseline once the fix is in place.',
  ],
};

export const CATEGORY_GUIDANCE: Record<string, CategoryGuidance> = {
  PROMPT_INJECTION: {
    impact:
      'Untrusted input (user text or retrieved content) was able to override developer instructions. Typical consequences include policy bypass, data exfiltration through the model, and steering of downstream tool calls.',
    remediation: [
      'Isolate untrusted content from system instructions with explicit delimiters or structured message roles; never concatenate retrieved text into the system prompt.',
      'Treat retrieved documents as data: strip or neutralise instruction-like content before it reaches the model.',
      'Gate high-impact actions behind deterministic policy checks rather than model judgement.',
      'Keep a session-bound canary in retrieval sources and alert on any exact-token reappearance in output.',
    ],
  },
  DATA_DISCLOSURE: {
    impact:
      'Content the model should not reveal (instrumented secrets, system prompt material, or retrieved private data) appeared in its output, indicating a confidentiality boundary failure.',
    remediation: [
      'Remove secrets and credentials from prompts and retrieval corpora; reference them server-side instead.',
      'Apply output filtering for known-sensitive patterns and canary tokens before responses leave the service.',
      'Scope retrieval to the requesting principal so the model cannot access documents the user is not entitled to.',
      'Log and alert on canary exposures; rotate any real credential that shares a path with an exposed canary.',
    ],
  },
  TOOL_EXECUTION: {
    impact:
      'The model attempted or performed a tool/function call outside its authorised boundary. Depending on the tool, this can lead to unauthorised state changes, data access, or lateral movement.',
    remediation: [
      'Enforce an explicit allow-list of tools and argument schemas per task, validated outside the model.',
      'Require human confirmation for state-changing or external-network operations.',
      'Run tools with least-privilege credentials scoped to the calling user and session.',
      'Reject tool arguments that contain content traced to untrusted sources (taint checks at the tool boundary).',
    ],
  },
  INSTRUCTION_CONFLICT: {
    impact:
      'The model resolved a conflict between developer and user instructions in favour of the lower-privilege instruction, weakening the intended instruction hierarchy.',
    remediation: [
      'State instruction precedence explicitly in the system prompt and keep safety-critical rules short and unambiguous.',
      'Validate outputs against policy deterministically where the rule is machine-checkable.',
      'Add paired benign tests to ensure the fix does not introduce over-refusal.',
    ],
  },
  REGRESSION: {
    impact:
      'A security property that previously held for this target no longer holds, indicating a regression introduced by a model, prompt, or configuration change.',
    remediation: [
      'Diff the target configuration and model version against the last passing baseline.',
      'Block deployment on new findings in regression comparisons.',
      'Restore the previous control or add a compensating check, then re-baseline.',
    ],
  },
};

export function getCategoryGuidance(category: string | null | undefined): CategoryGuidance {
  return (category && CATEGORY_GUIDANCE[category]) || DEFAULT_GUIDANCE;
}
