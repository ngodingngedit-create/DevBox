import type { Tool } from './types';
import { JsonTool } from './json/ui';
import { Base64Tool } from './base64/ui';
import { JwtTool } from './jwt/ui';
import { UrlTool } from './url/ui';
import { TimestampTool } from './timestamp/ui';
import { UuidTool } from './uuid/ui';
import { HashTool } from './hash/ui';
import { CronTool } from './cron/ui';

export const toolsRegistry: Tool[] = [
  {
    id: 'json',
    title: 'JSON Formatter',
    description: 'Format, validate, sort keys, and minify JSON with clear error position indicators.',
    keywords: ['json', 'format', 'prettify', 'minify', 'validator', 'parse', 'indent'],
    component: JsonTool,
  },
  {
    id: 'jwt',
    title: 'JWT Decoder',
    description: 'Inspect JSON Web Tokens, view decoded claims, headers, signatures, and verify expiry dates locally.',
    keywords: ['jwt', 'token', 'decode', 'bearer', 'auth', 'claims', 'exp'],
    component: JwtTool,
  },
  {
    id: 'base64',
    title: 'Base64 Encoder/Decoder',
    description: 'Encode and decode text to and from Base64 with full UTF-8 support.',
    keywords: ['base64', 'encode', 'decode', 'b64', 'utf-8', 'binary'],
    component: Base64Tool,
  },
  {
    id: 'url',
    title: 'URL Encoder/Decoder',
    description: 'Encode and decode URL query parameters and full URIs with toggleable strictness.',
    keywords: ['url', 'uri', 'encode', 'decode', 'percent', 'query', 'params'],
    component: UrlTool,
  },
  {
    id: 'timestamp',
    title: 'Timestamp Converter',
    description: 'Auto-detect seconds vs milliseconds, convert to UTC, ISO 8601, and local formats.',
    keywords: ['timestamp', 'epoch', 'date', 'time', 'unix', 'iso', 'utc', 'convert'],
    component: TimestampTool,
  },
  {
    id: 'uuid',
    title: 'UUID Generator & Validator',
    description: 'Generate bulk v4 UUIDs, toggle uppercase/lowercase, and validate format.',
    keywords: ['uuid', 'guid', 'v4', 'random', 'generate', 'validator', 'crypto'],
    component: UuidTool,
  },
  {
    id: 'hash',
    title: 'Hash Generator',
    description: 'Generate MD5, SHA-1, and SHA-256 hashes completely client-side via Web Crypto.',
    keywords: ['hash', 'md5', 'sha1', 'sha256', 'digest', 'crypto', 'checksum'],
    component: HashTool,
  },
  {
    id: 'cron',
    title: 'Cron Explainer',
    description: 'Translate 5 or 6 field cron syntax into plain English and preview future execution times.',
    keywords: ['cron', 'schedule', 'cronjob', 'explainer', 'time', 'interval', 'quartz'],
    component: CronTool,
  },
];

export function getToolById(id: string): Tool | undefined {
  return toolsRegistry.find((t) => t.id === id);
}
