# @nous-labs/auto-extract

Standalone auto-extraction pipeline for implicit memory capture from AI conversation messages. Zero dependencies. 3-layer classifier pipeline.

## Installation

Clone the repository:

```bash
git clone https://github.com/nous-labs/nous-auto-extract.git
```

Add as a local dependency in your project's `package.json`:

```json
{
  "dependencies": {
    "@nous-labs/auto-extract": "file:../nous-auto-extract"
  }
}
```
## Usage

```typescript
import { extractFromMessages, buildCaptureMetadata } from '@nous-labs/auto-extract';

const messages = [
  { role: 'user', content: 'I prefer dark mode for all my tools' },
  { role: 'assistant', content: 'Got it, I will remember that preference' },
  { role: 'user', content: 'Never use semicolons in JavaScript' },
];

const candidates = extractFromMessages(messages);

for (const candidate of candidates) {
  console.log(`Found ${candidate.type} at ${candidate.confidence.toFixed(2)} confidence`);
  console.log(buildCaptureMetadata(candidate));
}
```

## API Reference

### `extractFromMessages(messages, config?)`

Batch extraction from an array of conversation messages.

- **messages**: `ConversationMessage[]` — Array of messages with `role` and `content`
- **config**: `ExtractorConfig` — Optional configuration overrides
- **Returns**: `ExtractionCandidate[]` — Array of extraction candidates meeting confidence thresholds

### `classifyMessage(message, config?)`

Classify a single message through the full pipeline.

- **message**: `ConversationMessage` — Single message to classify
- **config**: `ExtractorConfig` — Optional configuration overrides
- **Returns**: `ClassificationResult` — Classification result (check `.accepted` field)

### `buildCaptureMetadata(candidate, config?)`

Build JSON metadata string from an extraction candidate.

- **candidate**: `ExtractionCandidate` — The extraction candidate
- **config**: `ExtractorConfig` — Optional configuration overrides
- **Returns**: `string` — JSON string with capture metadata

### `scoreText(text)`

Raw keyword scoring without pipeline filters.

- **text**: `string` — Text to score
- **Returns**: `CategoryScore | null` — Highest scoring category, or null if no primary keywords match

### `matchesNegativePattern(text, role)`

Check if text matches negative rejection patterns.

- **text**: `string` — Text to check
- **role**: `MessageRole` — Role of the message sender
- **Returns**: `{ rejected: boolean; pattern?: string }` — Whether rejected and which pattern matched

### `isRoleAllowed(type, role)`

Check if a memory type is allowed for a given role.

- **type**: `MemoryType` — The memory type
- **role**: `MessageRole` — The message role
- **Returns**: `boolean` — True if role is allowed for this type

## Configuration

```typescript
interface ExtractorConfig {
  confidenceThreshold?: number;   // Default: 0.5
  assistantThreshold?: number;    // Default: 0.6
  extractorVersion?: string;      // Default: "1.0"
}
```

- **confidenceThreshold**: Minimum confidence score for extraction (human messages)
- **assistantThreshold**: Higher threshold for assistant-generated content
- **extractorVersion**: Version identifier for metadata tracking

## Types

```typescript
type MessageRole = 'user' | 'assistant';
type MemoryType = 'decision' | 'preference' | 'constraint' | 'failure' | 'learning';

interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  sessionId: string;
}

interface ClassificationResult {
  accepted: boolean;
  type?: MemoryType;
  confidence?: number;
  content?: string;
  rejectionReason?: RejectionReason;
  explicitIntent?: boolean;
  primaryMatches?: string[];
  boosterMatches?: string[];
}

type RejectionReason = 'negative_pattern' | 'below_threshold' | 'role_forbidden' | 'empty_content';

interface ExtractionCandidate {
  type: MemoryType;
  content: string;
  confidence: number;
  sourceMessageId: string;
  sourceSessionId: string;
  sourceRole: MessageRole;
  explicitIntent: boolean;
}

interface CategoryScore {
  type: MemoryType;
  score: number;
  primaryMatches: string[];
  boosterMatches: string[];
}

## Architecture

The extraction pipeline uses a 4-layer classification system:

### Layer 0: Explicit Intent Bypass

Phrases like "remember this", "keep in mind", or "note that" bypass normal scoring. When detected with 0.85+ confidence, the message is auto-accepted as a `learning` type without further analysis.

### Layer 1: Negative Pattern Matching

Filters out content that should never be extracted:

- AI meta-talk ("As an AI", "I don't have personal experiences")
- First-person recall ("I told you earlier", "As I mentioned before")
- Remind-me patterns ("Remind me to...", "Don't let me forget...")
- Assistant-generated lists and summaries
- Pure questions without statements

### Layer 2: Multi-Keyword Scoring

Five memory categories are scored independently:

| Type | Primary Keywords (0.25) | Booster Keywords (0.10) |
|------|------------------------|------------------------|
| decision | decided, choosing, settled on, going with | picked, selected, opted, choice |
| preference | prefer, like, favorite, rather | dislike, enjoy, love, hate |
| constraint | must, never, always, required | cannot, forbidden, mandatory, strict |
| failure | failed, error, broke, didn't work | mistake, wrong, issue, problem |
| learning | learned, discovered, realized, found out | figured out, understood, now know |

Base score: 0.30. Primary keywords add 0.25. Booster keywords add 0.10.

### Layer 3: Confidence Threshold + Role Validation

Final validation applies role-based rules:

- **Human messages**: Standard threshold (0.5)
- **Assistant messages**: Higher threshold (0.6)
- **Type restrictions**: Preferences, constraints, and decisions are human-only. Failures and learnings allow both roles.

## Scripts

```bash
bun test           # Run test suite (54 tests, 139 assertions)
bun run build      # Compile TypeScript
bun run typecheck  # Type-check without emitting
```

## License

MIT

## Repository

https://github.com/nous-labs/nous-auto-extract
