import React from 'react';

type TokenType = 'text' | 'url' | 'bold' | 'hashtag' | 'mention';

interface Token {
  type: TokenType;
  value: string;
  children?: Token[];
}

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?"'\])}>])/g;
const BOLD_REGEX = /\*\*(.+?)\*\*/g;
const HASHTAG_REGEX = /(^|\s)(#[a-zA-Z]\w{0,29})(?=\s|$|[.,!?;:])/g;
const MENTION_REGEX = /(^|\s)(@[a-zA-Z]\w{0,29})(?=\s|$|[.,!?;:])/g;

function tokenizeInline(text: string): Token[] {
  const tokens: Token[] = [];
  let remaining = text;
  let lastIndex = 0;

  // Combined regex for single-pass matching
  const combined = new RegExp(
    `(${URL_REGEX.source})|(${BOLD_REGEX.source})|((?:^|\\s))(#[a-zA-Z]\\w{0,29})(?=\\s|$|[.,!?;:])|((?:^|\\s))(@[a-zA-Z]\\w{0,29})(?=\\s|$|[.,!?;:])`,
    'g'
  );

  // Use individual regexes in priority order for cleaner matching
  // Build a list of all matches with positions
  interface Match {
    type: TokenType;
    start: number;
    end: number;
    value: string;
    innerValue?: string;
    prefix?: string;
  }

  const matches: Match[] = [];

  // Find URLs
  let m: RegExpExecArray | null;
  const urlRe = new RegExp(URL_REGEX.source, 'g');
  while ((m = urlRe.exec(text)) !== null) {
    matches.push({ type: 'url', start: m.index, end: m.index + m[0].length, value: m[0] });
  }

  // Find Bold
  const boldRe = new RegExp(BOLD_REGEX.source, 'g');
  while ((m = boldRe.exec(text)) !== null) {
    matches.push({ type: 'bold', start: m.index, end: m.index + m[0].length, value: m[0], innerValue: m[1] });
  }

  // Find Hashtags
  const hashRe = new RegExp(HASHTAG_REGEX.source, 'g');
  while ((m = hashRe.exec(text)) !== null) {
    const prefix = m[1];
    const tag = m[2];
    matches.push({ type: 'hashtag', start: m.index + prefix.length, end: m.index + prefix.length + tag.length, value: tag, prefix });
  }

  // Find Mentions
  const mentionRe = new RegExp(MENTION_REGEX.source, 'g');
  while ((m = mentionRe.exec(text)) !== null) {
    const prefix = m[1];
    const mention = m[2];
    matches.push({ type: 'mention', start: m.index + prefix.length, end: m.index + prefix.length + mention.length, value: mention, prefix });
  }

  // Sort by start position, prioritize: url > bold > hashtag > mention
  const priority: Record<TokenType, number> = { url: 0, bold: 1, hashtag: 2, mention: 3, text: 4 };
  matches.sort((a, b) => a.start - b.start || priority[a.type] - priority[b.type]);

  // Remove overlapping matches (keep higher priority)
  const filtered: Match[] = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      filtered.push(match);
      lastEnd = match.end;
    }
  }

  // Build tokens
  let cursor = 0;
  for (const match of filtered) {
    if (match.start > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, match.start) });
    }

    if (match.type === 'bold' && match.innerValue) {
      // Recursively tokenize bold content (for nested hashtags/mentions)
      const innerTokens = tokenizeInline(match.innerValue);
      tokens.push({ type: 'bold', value: match.value, children: innerTokens });
    } else {
      tokens.push({ type: match.type, value: match.value });
    }

    cursor = match.end;
  }

  if (cursor < text.length) {
    tokens.push({ type: 'text', value: text.slice(cursor) });
  }

  return tokens;
}

function renderToken(token: Token, index: number): React.ReactNode {
  switch (token.type) {
    case 'url':
      return (
        <a
          key={index}
          href={token.value}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-700 hover:underline break-all"
        >
          {token.value}
        </a>
      );
    case 'bold':
      return (
        <strong key={index} className="font-bold">
          {token.children
            ? token.children.map((child, i) => renderToken(child, i))
            : token.value}
        </strong>
      );
    case 'hashtag':
      return (
        <span
          key={index}
          onClick={(e) => e.stopPropagation()}
          className="text-purple-600 font-semibold cursor-default"
        >
          {token.value}
        </span>
      );
    case 'mention':
      return (
        <span
          key={index}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 font-semibold cursor-default"
        >
          {token.value}
        </span>
      );
    case 'text':
    default:
      return <React.Fragment key={index}>{token.value}</React.Fragment>;
  }
}

function isBulletLine(line: string): { isBullet: boolean; content: string } {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    return { isBullet: true, content: trimmed.slice(2) };
  }
  return { isBullet: false, content: line };
}

export function parseDescription(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletGroup: React.ReactNode[] = [];

  const flushBullets = () => {
    if (bulletGroup.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-0.5">
          {bulletGroup}
        </ul>
      );
      bulletGroup = [];
    }
  };

  lines.forEach((line, lineIndex) => {
    const { isBullet, content } = isBulletLine(line);

    if (isBullet) {
      const tokens = tokenizeInline(content);
      bulletGroup.push(
        <li key={`li-${lineIndex}`} className="text-current">
          {tokens.map((token, i) => renderToken(token, i))}
        </li>
      );
    } else {
      flushBullets();

      const tokens = tokenizeInline(line);
      elements.push(
        <React.Fragment key={`line-${lineIndex}`}>
          {lineIndex > 0 && !isBulletLine(lines[lineIndex - 1]).isBullet && '\n'}
          {tokens.map((token, i) => renderToken(token, i))}
        </React.Fragment>
      );
    }
  });

  flushBullets();

  return <>{elements}</>;
}
