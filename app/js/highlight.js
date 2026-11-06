// Leichtes Syntax-Highlighting fuer Python und C++ (ohne Bibliothek)

import { escapeHtml } from './util.js';

const words = s => new Set(s.split(/\s+/).filter(Boolean));

const PY_KEYWORDS = words(`False None True and as assert async await break class continue def del elif else
  except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case`);
const PY_BUILTINS = words(`print input int float str bool len range list dict set tuple type abs min max sum round
  sorted enumerate zip open isinstance super self map filter any all reversed`);

const CPP_KEYWORDS = words(`alignas auto break case catch class const constexpr continue default delete do else enum
  explicit extern false final for friend goto if inline mutable namespace new noexcept nullptr operator override
  private protected public return sizeof static static_cast struct switch template this throw true try typedef
  typename union using virtual volatile while`);
const CPP_TYPES = words(`int double float char bool void long short unsigned signed size_t string vector map array
  unique_ptr shared_ptr std uint8_t int32_t int64_t uint32_t FVector FString AActor UCLASS UPROPERTY UFUNCTION
  GENERATED_BODY Super`);

const RULES = {
  python: [
    ['com', /#[^\n]*/y],
    ['str', /(?:[rRbBfFuU]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/y],
    ['num', /\d[\d_]*(?:\.\d+)?/y],
    ['word', /[A-Za-z_]\w*/y],
  ],
  cpp: [
    ['pre', /#[ \t]*\w+[^\n]*/y],
    ['com', /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    ['str', /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y],
    ['num', /\d[\d']*(?:\.\d+)?[fFuUlL]*/y],
    ['word', /[A-Za-z_]\w*/y],
  ],
};

function classify(word, lang, text, end) {
  if (lang === 'python') {
    if (PY_KEYWORDS.has(word)) return 'kw';
    if (PY_BUILTINS.has(word)) return 'bi';
  } else {
    if (CPP_KEYWORDS.has(word)) return 'kw';
    if (CPP_TYPES.has(word)) return 'ty';
  }
  const rest = text.slice(end, end + 40);
  if (/^\s*\(/.test(rest)) return 'fn';
  return null;
}

function atLineStart(text, i) {
  const start = text.lastIndexOf('\n', i - 1) + 1;
  return text.slice(start, i).trim() === '';
}

export function highlight(text, lang = 'python') {
  const rules = RULES[lang] || RULES.python;
  let out = '';
  let i = 0;
  let plain = '';
  const flush = () => { if (plain) { out += escapeHtml(plain); plain = ''; } };

  while (i < text.length) {
    let matched = false;
    for (const [kind, re] of rules) {
      if (kind === 'pre' && !atLineStart(text, i)) continue;
      re.lastIndex = i;
      const m = re.exec(text);
      if (!m || m[0].length === 0) continue;
      const token = m[0];
      const end = i + token.length;
      let cls = kind;
      if (kind === 'word') cls = classify(token, lang, text, end);
      flush();
      out += cls ? `<span class="t-${cls}">${escapeHtml(token)}</span>` : escapeHtml(token);
      i = end;
      matched = true;
      break;
    }
    if (!matched) {
      plain += text[i];
      i += 1;
    }
  }
  flush();
  return out;
}
