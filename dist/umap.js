import { createRequire } from 'module'; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/picomatch/lib/constants.js
var require_constants = __commonJS({
  "node_modules/picomatch/lib/constants.js"(exports, module) {
    "use strict";
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DEFAULT_MAX_EXTGLOB_RECURSION = 0;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR = `${QMARK}*?`;
    var SEP = "/";
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR,
      START_ANCHOR,
      SEP
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`,
      SEP: "\\"
    };
    var POSIX_REGEX_SOURCE = {
      __proto__: null,
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module.exports = {
      DEFAULT_MAX_EXTGLOB_RECURSION,
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        __proto__: null,
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars2) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars2.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// node_modules/picomatch/lib/utils.js
var require_utils = __commonJS({
  "node_modules/picomatch/lib/utils.js"(exports) {
    "use strict";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants();
    exports.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports.isRegexChar = (str) => str.length === 1 && exports.hasRegexChars(str);
    exports.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports.isWindows = () => {
      if (typeof navigator !== "undefined" && navigator.platform) {
        const platform = navigator.platform.toLowerCase();
        return platform === "win32" || platform === "windows";
      }
      if (typeof process !== "undefined" && process.platform) {
        return process.platform === "win32";
      }
      return false;
    };
    exports.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
        return match === "\\" ? "" : match;
      });
    };
    exports.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1) return input;
      if (input[idx - 1] === "\\") return exports.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports.wrapOutput = (input, state = {}, options = {}) => {
      const prepend = options.contains ? "" : "^";
      const append = options.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
    exports.basename = (path, { windows } = {}) => {
      const segs = path.split(windows ? /[\\/]/ : "/");
      const last = segs[segs.length - 1];
      if (last === "") {
        return segs[segs.length - 2];
      }
      return last;
    };
  }
});

// node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "node_modules/picomatch/lib/scan.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token) => {
      if (token.isPrefix !== true) {
        token.depth = token.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options) => {
      const opts = options || {};
      const length = input.length - 1;
      const scanToEnd = opts.parts === true || opts.tokens === true || opts.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index2 = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token = { value: "", depth: 0, isGlob: false };
      const eos = () => index2 >= length;
      const peek = () => str.charCodeAt(index2 + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index2);
      };
      while (index2 < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index2);
          tokens.push(token);
          token = { value: "", depth: 0, isGlob: false };
          if (finished === true) continue;
          if (prev === CHAR_DOT && index2 === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index2 + 1;
          continue;
        }
        if (opts.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            isExtglob = token.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index2 === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              let parens = 0;
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token.backslashes = true;
                  advance();
                  continue;
                }
                if (code === CHAR_LEFT_PARENTHESES) {
                  parens++;
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES && --parens === 0) {
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token.isBracket = true;
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index2 === start) {
          negated = token.negated = true;
          start++;
          continue;
        }
        if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token.isGlob = true;
          if (scanToEnd === true) {
            let parens = 1;
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_BACKWARD_SLASH) {
                backslashes = token.backslashes = true;
                advance();
                continue;
              }
              if (code === CHAR_LEFT_PARENTHESES) {
                parens++;
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES && --parens === 0) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts.unescape === true) {
        if (glob) glob = utils.removeBackslashes(glob);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token);
        }
        state.tokens = tokens;
      }
      if (opts.parts === true || opts.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n3 = prevIndex !== void 0 ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value2 = input.slice(n3, i);
          if (opts.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value2;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (i >= start) {
            parts.push(value2);
            prevIndex = i;
          }
        }
        const n = prevIndex !== void 0 ? prevIndex + 1 : start;
        const value = input.slice(n);
        parts.push(value);
        if (opts.tokens && prevIndex && prevIndex + 1 < input.length) {
          tokens[tokens.length - 1].value = value;
          depth(tokens[tokens.length - 1]);
          state.maxDepth += tokens[tokens.length - 1].depth;
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module.exports = scan;
  }
});

// node_modules/picomatch/lib/parse.js
var require_parse = __commonJS({
  "node_modules/picomatch/lib/parse.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    var utils = require_utils();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants;
    var expandRange = (args, options) => {
      if (typeof options.expandRange === "function") {
        return options.expandRange(...args, options);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v) => utils.escapeRegex(v)).join("..");
      }
      return value;
    };
    var syntaxError = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var splitTopLevel = (input) => {
      const parts = [];
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let value = "";
      let escaped = false;
      for (const ch of input) {
        if (escaped === true) {
          value += ch;
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          value += ch;
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          value += ch;
          continue;
        }
        if (quote === 0) {
          if (ch === "[") {
            bracket++;
          } else if (ch === "]" && bracket > 0) {
            bracket--;
          } else if (bracket === 0) {
            if (ch === "(") {
              paren++;
            } else if (ch === ")" && paren > 0) {
              paren--;
            } else if (ch === "|" && paren === 0) {
              parts.push(value);
              value = "";
              continue;
            }
          }
        }
        value += ch;
      }
      parts.push(value);
      return parts;
    };
    var isPlainBranch = (branch) => {
      let escaped = false;
      for (const ch of branch) {
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (/[?*+@!()[\]{}]/.test(ch)) {
          return false;
        }
      }
      return true;
    };
    var normalizeSimpleBranch = (branch) => {
      let value = branch.trim();
      let changed = true;
      while (changed === true) {
        changed = false;
        if (/^@\([^\\()[\]{}|]+\)$/.test(value)) {
          value = value.slice(2, -1);
          changed = true;
        }
      }
      if (!isPlainBranch(value)) {
        return;
      }
      return value.replace(/\\(.)/g, "$1");
    };
    var hasRepeatedCharPrefixOverlap = (branches) => {
      const values = branches.map(normalizeSimpleBranch).filter(Boolean);
      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          const a = values[i];
          const b = values[j];
          const char = a[0];
          if (!char || a !== char.repeat(a.length) || b !== char.repeat(b.length)) {
            continue;
          }
          if (a === b || a.startsWith(b) || b.startsWith(a)) {
            return true;
          }
        }
      }
      return false;
    };
    var parseRepeatedExtglob = (pattern, requireEnd = true) => {
      if (pattern[0] !== "+" && pattern[0] !== "*" || pattern[1] !== "(") {
        return;
      }
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let escaped = false;
      for (let i = 1; i < pattern.length; i++) {
        const ch = pattern[i];
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          continue;
        }
        if (quote === 1) {
          continue;
        }
        if (ch === "[") {
          bracket++;
          continue;
        }
        if (ch === "]" && bracket > 0) {
          bracket--;
          continue;
        }
        if (bracket > 0) {
          continue;
        }
        if (ch === "(") {
          paren++;
          continue;
        }
        if (ch === ")") {
          paren--;
          if (paren === 0) {
            if (requireEnd === true && i !== pattern.length - 1) {
              return;
            }
            return {
              type: pattern[0],
              body: pattern.slice(2, i),
              end: i
            };
          }
        }
      }
    };
    var buildCharClassStar = (chars2) => {
      const source = chars2.length === 1 ? utils.escapeRegex(chars2[0]) : `[${chars2.map((ch) => utils.escapeRegex(ch)).join("")}]`;
      return `${source}*`;
    };
    var getStarExtglobSequenceChars = (pattern) => {
      let index2 = 0;
      const chars2 = [];
      while (index2 < pattern.length) {
        const match = parseRepeatedExtglob(pattern.slice(index2), false);
        if (!match || match.type !== "*") {
          return;
        }
        const branches = splitTopLevel(match.body).map((branch2) => branch2.trim());
        if (branches.length !== 1) {
          return;
        }
        const branch = normalizeSimpleBranch(branches[0]);
        if (!branch || branch.length !== 1) {
          return;
        }
        chars2.push(branch);
        index2 += match.end + 1;
      }
      if (chars2.length < 1) {
        return;
      }
      return chars2;
    };
    var repeatedExtglobRecursion = (pattern) => {
      let depth = 0;
      let value = pattern.trim();
      let match = parseRepeatedExtglob(value);
      while (match) {
        depth++;
        value = match.body.trim();
        match = parseRepeatedExtglob(value);
      }
      return depth;
    };
    var analyzeRepeatedExtglob = (body, options) => {
      if (options.maxExtglobRecursion === false) {
        return { risky: false };
      }
      const max = typeof options.maxExtglobRecursion === "number" ? options.maxExtglobRecursion : constants.DEFAULT_MAX_EXTGLOB_RECURSION;
      const branches = splitTopLevel(body).map((branch) => branch.trim());
      if (branches.length > 1) {
        if (branches.some((branch) => branch === "") || branches.some((branch) => /^[*?]+$/.test(branch)) || hasRepeatedCharPrefixOverlap(branches)) {
          return { risky: true };
        }
      }
      const safeChars = [];
      let sawStarSequence = false;
      let combinable = true;
      for (const branch of branches) {
        const chars2 = getStarExtglobSequenceChars(branch);
        if (chars2) {
          sawStarSequence = true;
          safeChars.push(...chars2);
          continue;
        }
        const literal = normalizeSimpleBranch(branch);
        if (literal && literal.length === 1) {
          safeChars.push(literal);
          continue;
        }
        combinable = false;
        if (repeatedExtglobRecursion(branch) > max) {
          return { risky: true };
        }
      }
      if (sawStarSequence) {
        return combinable ? { risky: true, safeOutput: buildCharClassStar([...new Set(safeChars)]) } : { risky: true };
      }
      return { risky: false };
    };
    var parse = (input, options) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts.prepend || "" };
      const tokens = [bos];
      const capture = opts.capture ? "" : "?:";
      const PLATFORM_CHARS = constants.globChars(opts.windows);
      const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts2) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts.dot ? "" : NO_DOT;
      const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
      let star = opts.bash === true ? globstar(opts) : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      if (typeof opts.noext === "boolean") {
        opts.noextglob = opts.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek = state.peek = (n = 1) => input[state.index + n];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num2 = 0) => {
        state.consumed += value2;
        state.index += num2;
      };
      const append = (token) => {
        state.output += token.output != null ? token.output : token.value;
        consume(token.value);
      };
      const negate = () => {
        let count2 = 1;
        while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
          advance();
          state.start++;
          count2++;
        }
        if (count2 % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack.pop();
      };
      const push = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output) append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.output = (prev.output || prev.value) + tok.value;
          prev.value += tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token.prev = prev;
        token.parens = state.parens;
        token.output = state.output;
        token.startIndex = state.index;
        token.tokensIndex = tokens.length;
        const output = (opts.capture ? "(" : "") + token.open;
        increment("parens");
        push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token);
      };
      const extglobClose = (token) => {
        const literal = input.slice(token.startIndex, state.index + 1);
        const body = input.slice(token.startIndex + 2, state.index);
        const analysis = analyzeRepeatedExtglob(body, opts);
        if ((token.type === "plus" || token.type === "star") && analysis.risky) {
          const safeOutput = analysis.safeOutput ? (token.output ? "" : ONE_CHAR) + (opts.capture ? `(${analysis.safeOutput})` : analysis.safeOutput) : void 0;
          const open = tokens[token.tokensIndex];
          open.type = "text";
          open.value = literal;
          open.output = safeOutput || utils.escapeRegex(literal);
          for (let i = token.tokensIndex + 1; i < tokens.length; i++) {
            tokens[i].value = "";
            tokens[i].output = "";
            delete tokens[i].suffix;
          }
          state.output = token.output + open.output;
          state.backtrack = true;
          push({ type: "paren", extglob: true, value, output: "" });
          decrement("parens");
          return;
        }
        let output = token.close + (opts.capture ? ")" : "");
        let rest;
        if (token.type === "negate") {
          let extglobStar = star;
          if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
            extglobStar = globstar(opts);
          }
          if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
            output = token.close = `)$))${extglobStar}`;
          }
          if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            const expression = parse(rest, { ...options, fastpaths: false }).output;
            output = token.close = `)${expression})${extglobStar})`;
          }
          if (token.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc2, chars2, first, rest, index2) => {
          if (first === "\\") {
            backslashes = true;
            return m;
          }
          if (first === "?") {
            if (esc2) {
              return esc2 + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index2 === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars2.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars2.length);
          }
          if (first === "*") {
            if (esc2) {
              return esc2 + first + (rest ? star : "");
            }
            return star;
          }
          return esc2 ? m : `\\${m}`;
        });
        if (backslashes === true) {
          if (opts.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m) => {
              return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
            });
          }
        }
        if (output === input && opts.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek();
          if (next === "/" && opts.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push({ type: "text", value });
            continue;
          }
          const match = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match && match[0].length > 2) {
            slashes = match[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix2 = POSIX_REGEX_SOURCE[rest2];
                if (posix2) {
                  prev.value = pre + posix2;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts.keepQuotes === true) {
            push({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts.strictBrackets === true) {
            throw new SyntaxError(syntaxError("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts.nobracket === true || !remaining().includes("]")) {
            if (opts.nobracket !== true && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "["));
            }
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts.nobrace === true || !brace) {
            push({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range = [];
            for (let i = arr.length - 1; i >= 0; i--) {
              tokens.pop();
              if (arr[i].type === "brace") {
                break;
              }
              if (arr[i].type !== "dots") {
                range.unshift(arr[i].value);
              }
            }
            output = expandRange(range, opts);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out2 = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out2;
            for (const t of toks) {
              state.output += t.output || t.value;
            }
          }
          push({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack[stack.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".") prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek();
            let output = value;
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push({ type: "text", value, output });
            continue;
          }
          if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts.noextglob !== true && peek() === "(") {
            if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts.regex === false) {
            push({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push({ type: "plus", value });
            continue;
          }
          push({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            push({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match) {
            value += match[0];
            state.index += match[0].length;
          }
          push({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          const isEnd = eos() || state.parens > 0 && rest === ")".repeat(state.parens) && !extglobs.some((extglob) => extglob.type === "negate");
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && isEnd) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token = { type: "star", value, output: star };
        if (opts.bash === true) {
          token.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token.output = nodot + token.output;
          }
          push(token);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
          token.output = value;
          push(token);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push(token);
      }
      while (state.brackets > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token of state.tokens) {
          state.output += token.output != null ? token.output : token.value;
          if (token.suffix) {
            state.output += token.suffix;
          }
        }
      }
      return state;
    };
    parse.fastpaths = (input, options) => {
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR,
        START_ANCHOR
      } = constants.globChars(opts.windows);
      const nodot = opts.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star = opts.bash === true ? ".*?" : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      const globstar = (opts2) => {
        if (opts2.noglobstar === true) return star;
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*.*":
            return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*/*":
            return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
          case "**":
            return nodot + globstar(opts);
          case "**/*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
          default: {
            const match = /^(.*?)\.(\w+)$/.exec(str);
            if (!match) return;
            const source2 = create(match[1]);
            if (!source2) return;
            return source2 + DOT_LITERAL + match[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source = create(output);
      if (source && opts.strictSlashes !== true) {
        source += `${SLASH_LITERAL}?`;
      }
      return source;
    };
    module.exports = parse;
  }
});

// node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "node_modules/picomatch/lib/picomatch.js"(exports, module) {
    "use strict";
    var scan = require_scan();
    var parse = require_parse();
    var utils = require_utils();
    var constants = require_constants();
    var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch3 = (glob, options, returnState = false) => {
      if (Array.isArray(glob)) {
        const fns = glob.map((input) => picomatch3(input, options, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2) return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject(glob) && glob.tokens && glob.input;
      if (glob === "" || typeof glob !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix2 = opts.windows;
      const regex = isState ? picomatch3.compileRe(glob, options) : picomatch3.makeRe(glob, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch3(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch3.test(input, regex, options, { glob, posix: posix2 });
        const result = { glob, state, regex, posix: posix2, input, output, match, isMatch };
        if (typeof opts.onResult === "function") {
          opts.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored(input)) {
          if (typeof opts.onIgnore === "function") {
            opts.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts.onMatch === "function") {
          opts.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch3.test = (input, regex, options, { glob, posix: posix2 } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix2 ? utils.toPosixSlashes : null);
      let match = input === glob;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch3.matchBase(input, regex, options, posix2);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch3.matchBase = (input, glob, options, posix2 = options && options.windows) => {
      const regex = glob instanceof RegExp ? glob : picomatch3.makeRe(glob, options);
      return regex.test(utils.basename(input, { windows: posix2 }));
    };
    picomatch3.isMatch = (str, patterns, options) => picomatch3(patterns, options)(str);
    picomatch3.parse = (pattern, options) => {
      if (Array.isArray(pattern)) return pattern.map((p) => picomatch3.parse(p, options));
      return parse(pattern, { ...options, fastpaths: false });
    };
    picomatch3.scan = (input, options) => scan(input, options);
    picomatch3.compileRe = (state, options, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts = options || {};
      const prepend = opts.contains ? "" : "^";
      const append = opts.contains ? "" : "$";
      let source = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source = `^(?!${source}).*$`;
      }
      const regex = picomatch3.toRegex(source, options);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch3.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse.fastpaths(input, options);
      }
      if (!parsed.output) {
        parsed = parse(input, options);
      }
      return picomatch3.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch3.toRegex = (source, options) => {
      try {
        const opts = options || {};
        return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
      } catch (err2) {
        if (options && options.debug === true) throw err2;
        return /$^/;
      }
    };
    picomatch3.constants = constants;
    module.exports = picomatch3;
  }
});

// node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "node_modules/picomatch/index.js"(exports, module) {
    "use strict";
    var pico = require_picomatch();
    var utils = require_utils();
    function picomatch3(glob, options, returnState = false) {
      if (options && (options.windows === null || options.windows === void 0)) {
        options = { ...options, windows: utils.isWindows() };
      }
      return pico(glob, options, returnState);
    }
    Object.assign(picomatch3, pico);
    module.exports = picomatch3;
  }
});

// src/cli.ts
import { existsSync as existsSync4, readFileSync as readFileSync14, realpathSync as realpathSync4 } from "node:fs";
import { relative as relative4, resolve as resolve3 } from "node:path";
import { pathToFileURL } from "node:url";

// src/config.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
var DEFAULT_CONFIG = {
  mode: "solo",
  zones: {},
  critical: [],
  exclude: [],
  threshold: 60,
  fadingFloor: 30,
  activeDays: 90,
  halfLifeDays: 180,
  historyDays: 730,
  handoff: { enabled: true, minLines: 50 },
  handles: {},
  githubReviews: false
};
var ConfigError = class extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
    this.name = "ConfigError";
  }
};
function umDir(root) {
  return join(root, ".understanding");
}
function configPath(root) {
  return join(umDir(root), "config.json");
}
function isSetUp(root) {
  return existsSync(configPath(root));
}
var isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isStrArr = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
var isNum = (v) => typeof v === "number" && Number.isFinite(v);
function check(field, ok, expected) {
  if (!ok) throw new ConfigError(field, `Invalid config: "${field}" must be ${expected}`);
}
function validate(raw) {
  if ("mode" in raw) check("mode", raw.mode === "solo" || raw.mode === "team", '"solo" or "team"');
  if ("zones" in raw) {
    check("zones", isObj(raw.zones) && Object.values(raw.zones).every(isStrArr), "an object of string arrays");
  }
  for (const f of ["critical", "exclude"]) {
    if (f in raw) check(f, isStrArr(raw[f]), "an array of strings");
  }
  for (const f of ["threshold", "fadingFloor", "activeDays", "halfLifeDays", "historyDays"]) {
    if (f in raw) check(f, isNum(raw[f]), "a number");
  }
  if ("handoff" in raw) {
    const h = raw.handoff;
    check("handoff", isObj(h), "an object");
    const ho = h;
    if ("enabled" in ho) check("handoff.enabled", typeof ho.enabled === "boolean", "a boolean");
    if ("minLines" in ho) check("handoff.minLines", isNum(ho.minLines), "a number");
  }
  if ("githubReviews" in raw) check("githubReviews", typeof raw.githubReviews === "boolean", "a boolean");
  if ("handles" in raw) {
    check("handles", isObj(raw.handles) && Object.values(raw.handles).every((v) => typeof v === "string"), "an object of strings");
  }
}
function loadConfig(root) {
  const path = configPath(root);
  if (!existsSync(path)) return structuredClone(DEFAULT_CONFIG);
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new ConfigError("config.json", `Could not parse ${path}: ${e.message}`);
  }
  if (!isObj(raw)) throw new ConfigError("config.json", `${path} must contain a JSON object`);
  validate(raw);
  const d = structuredClone(DEFAULT_CONFIG);
  const { handoff, ...rest } = raw;
  return { ...d, ...rest, handoff: { ...d.handoff, ...handoff ?? {} } };
}
var SOLO_IGNORE = "*\n";
var TEAM_IGNORE = "local/\nreport.html\n";
function ensureUnderstandingIgnore(root) {
  const file = join(umDir(root), ".gitignore");
  if (existsSync(file)) return;
  let team = false;
  try {
    team = loadConfig(root).mode === "team";
  } catch {
  }
  mkdirSync(umDir(root), { recursive: true });
  writeFileSync(file, team ? TEAM_IGNORE : SOLO_IGNORE);
}

// src/context.ts
import { readFileSync as readFileSync10, realpathSync } from "node:fs";
import { join as join10, relative as relative2, resolve } from "node:path";

// src/imports.ts
import { readFileSync as readFileSync3 } from "node:fs";
import { join as join3, posix } from "node:path";

// src/zones.ts
var import_picomatch = __toESM(require_picomatch2(), 1);
import { createHash } from "node:crypto";
import { mkdirSync as mkdirSync2, readFileSync as readFileSync2, statSync, writeFileSync as writeFileSync2 } from "node:fs";
import { dirname, join as join2 } from "node:path";
var DEFAULT_EXCLUDES = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/vendor/**",
  "**/*.min.*",
  "**/*.map",
  "**/*.snap",
  "**/*.lock",
  "**/package-lock.json",
  "**/pnpm-lock.yaml",
  "**/go.sum",
  ".understanding/**"
];
var MAX_FILE_BYTES = 1024 * 1024;
var SPLIT_ABOVE = 3e3;
var MERGE_BELOW = 150;
var ROOT_ID = "(root)";
function excludeMatcher(exclude) {
  return (0, import_picomatch.default)([...DEFAULT_EXCLUDES, ...exclude], { dot: true });
}
function readFileEntries(root, paths, exclude) {
  const isExcluded = excludeMatcher(exclude);
  const out2 = [];
  for (const path of paths) {
    if (isExcluded(path)) continue;
    const full = join2(root, path);
    let buf;
    try {
      const st = statSync(full);
      if (!st.isFile() || st.size > MAX_FILE_BYTES) continue;
      buf = readFileSync2(full);
    } catch {
      continue;
    }
    if (buf.includes(0)) continue;
    const loc = buf.toString("utf8").split("\n").filter((l) => l.trim() !== "").length;
    out2.push({ path, loc, hash: createHash("sha1").update(buf).digest("hex").slice(0, 12) });
  }
  return out2;
}
var dirOf = (path) => path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
var parentOf = (dir) => dirOf(dir);
var idForDir = (dir) => dir || ROOT_ID;
var sumLoc = (files) => files.reduce((n, f) => n + f.loc, 0);
var byPath = (a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
function chunk(files) {
  const target = sumLoc(files) / Math.ceil(sumLoc(files) / SPLIT_ABOVE);
  const chunks = [];
  let cur = [];
  let curLoc = 0;
  for (const f of files) {
    if (cur.length && (curLoc + f.loc > SPLIT_ABOVE || curLoc >= target)) {
      chunks.push(cur);
      cur = [];
      curLoc = 0;
    }
    cur.push(f);
    curLoc += f.loc;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}
function zoneDirectories(files) {
  const byDir = /* @__PURE__ */ new Map();
  for (const f of files) {
    const dir = dirOf(f.path);
    (byDir.get(dir) ?? byDir.set(dir, []).get(dir)).push(f);
  }
  const out2 = [];
  for (const [dir, direct] of byDir) {
    if (sumLoc(direct) <= SPLIT_ABOVE) {
      out2.push({ id: idForDir(dir), dir, override: false, files: direct });
      continue;
    }
    const chunks = chunk(direct);
    chunks.forEach((c, i) => out2.push({ id: chunks.length === 1 ? idForDir(dir) : `${idForDir(dir)}#${i + 1}`, dir, override: false, files: c }));
  }
  return out2;
}
function mergeSmall(drafts) {
  const zones = [...drafts];
  for (; ; ) {
    const small = zones.filter((z) => !z.override && z.dir !== "" && sumLoc(z.files) < MERGE_BELOW).sort((a, b) => b.dir.split("/").length - a.dir.split("/").length || (a.id < b.id ? -1 : 1))[0];
    if (!small) return zones;
    zones.splice(zones.indexOf(small), 1);
    const parent = parentOf(small.dir);
    let target = zones.find((z) => !z.override && z.dir === parent && !z.id.includes("#"));
    if (!target) {
      target = { id: idForDir(parent), dir: parent, override: false, files: [] };
      zones.push(target);
    }
    target.files.push(...small.files);
  }
}
function buildZones(files, config) {
  const drafts = [];
  const claimed = /* @__PURE__ */ new Set();
  for (const [name, patterns] of Object.entries(config.zones)) {
    const match = (0, import_picomatch.default)(patterns, { dot: true });
    const mine = files.filter((f) => !claimed.has(f.path) && match(f.path));
    mine.forEach((f) => claimed.add(f.path));
    if (mine.length) drafts.push({ id: name, dir: "", override: true, files: mine });
  }
  const rest = files.filter((f) => !claimed.has(f.path));
  const dirZones = zoneDirectories(rest.sort(byPath));
  return [...drafts, ...mergeSmall(dirZones)].map((d) => {
    const sorted = [...d.files].sort(byPath);
    return {
      id: d.id,
      files: sorted.map((f) => f.path),
      loc: sumLoc(sorted),
      fingerprint: Object.fromEntries(sorted.map((f) => [f.path, f.hash]))
    };
  }).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
function zoneIndex(zones) {
  const m = /* @__PURE__ */ new Map();
  for (const z of zones) for (const f of z.files) m.set(f, z.id);
  return m;
}
function cachePath(root) {
  return join2(umDir(root), "local", "zones-cache.json");
}
function writeZoneCache(root, zones) {
  const path = cachePath(root);
  mkdirSync2(dirname(path), { recursive: true });
  writeFileSync2(path, JSON.stringify(Object.fromEntries(zoneIndex(zones))));
}
function readZoneCache(root) {
  try {
    const v = JSON.parse(readFileSync2(cachePath(root), "utf8"));
    return typeof v === "object" && v !== null && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

// src/imports.ts
var EXT_LANG = {
  ts: "ts",
  tsx: "ts",
  mts: "ts",
  cts: "ts",
  js: "ts",
  jsx: "ts",
  mjs: "ts",
  cjs: "ts",
  py: "py",
  go: "go",
  java: "java",
  kt: "java",
  rs: "rs",
  rb: "rb",
  php: "php",
  cs: "cs"
};
function languageOf(path) {
  const dot = path.lastIndexOf(".");
  return dot < 0 ? null : EXT_LANG[path.slice(dot + 1).toLowerCase()] ?? null;
}
var PATTERNS = {
  ts: [
    /\b(?:import|export)\s[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\b(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ],
  py: [/^[ \t]*from\s+(\.*[\w.]*)\s+import\b/gm, /^[ \t]*import\s+([\w.]+)/gm],
  go: [/\bimport\s+(?:[\w.]+\s+)?"([^"]+)"/g, /^[ \t]*(?:[\w.]+\s+)?"([^"\n]+)"[ \t]*$/gm],
  java: [/^[ \t]*import\s+(?:static\s+)?([\w.]*\w(?:\.\*)?)\s*;?/gm],
  cs: [/^[ \t]*using\s+(?:static\s+)?([\w.]+)\s*;/gm],
  rs: [/^[ \t]*(?:pub\s+)?use\s+((?:crate|self|super)(?:::\w+)*)/gm, /^[ \t]*(?:pub\s+)?mod\s+(\w+)\s*;/gm],
  rb: [/^[ \t]*require_relative\s*\(?\s*['"]([^'"]+)['"]/gm, /^[ \t]*require\s*\(?\s*['"]([^'"]+)['"]/gm],
  php: [
    /\b(?:require|include)(?:_once)?\s*\(?\s*(?:__DIR__\s*\.\s*)?['"]([^'"]+)['"]/g,
    /^[ \t]*use\s+(?:function\s+|const\s+)?([\w\\]+)/gm
  ]
};
function importMatches(lang, source) {
  const all = (re, text3, offset = 0) => [...text3.matchAll(re)].map((m) => ({ spec: m[1], index: offset + m.index }));
  if (lang === "go") {
    const single = all(PATTERNS.go[0], source);
    const grouped = [...source.matchAll(/\bimport\s*\(([\s\S]*?)\)/g)].flatMap((b) => {
      const start = b.index + b[0].indexOf("(") + 1;
      return all(PATTERNS.go[1], b[1], start).map((m) => {
        const lead = source.slice(m.index).match(/^\s*/)[0].length;
        return { spec: m.spec, index: m.index + lead };
      });
    });
    return [...single, ...grouped];
  }
  if (lang === "rs") {
    return [...all(PATTERNS.rs[0], source), ...all(PATTERNS.rs[1], source).map((m) => ({ ...m, spec: `self::${m.spec}` }))];
  }
  return PATTERNS[lang].flatMap((re) => all(re, source));
}
var indexCache = /* @__PURE__ */ new WeakMap();
function indexOf(files) {
  let ix = indexCache.get(files);
  if (!ix) {
    const dirs = /* @__PURE__ */ new Set();
    for (const f of files) {
      let d = posix.dirname(f);
      while (d !== "." && !dirs.has(d)) {
        dirs.add(d);
        d = posix.dirname(d);
      }
    }
    ix = { dirs, list: [...files].sort() };
    indexCache.set(files, ix);
  }
  return ix;
}
var dirOf2 = (p) => p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "";
var joinPath = (...parts) => posix.normalize(parts.filter(Boolean).join("/")).replace(/^\.\//, "");
var endsAt = (path, suffix) => path === suffix || path.endsWith(`/${suffix}`);
function dirBySuffix(segs, files, min) {
  const { dirs } = indexOf(files);
  for (let k = segs.length; k >= Math.min(min, segs.length); k--) {
    const suffix = segs.slice(segs.length - k).join("/");
    const hit = [...dirs].sort().find((d) => endsAt(d, suffix));
    if (hit) return hit;
  }
  return null;
}
function fileBySuffix(rel, exts, files) {
  const { list } = indexOf(files);
  for (const e of exts) {
    const hit = list.find((f) => endsAt(f, rel + e));
    if (hit) return hit;
  }
  return null;
}
var firstIn = (cands, files) => cands.find((c) => files.has(c)) ?? null;
var TS_EXTS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"];
function resolveGo(from, spec, files, modules) {
  let modDir = null;
  for (let d = dirOf2(from); modDir === null; d = dirOf2(d)) {
    if (modules.has(d)) modDir = d;
    if (!d) break;
  }
  if (modDir !== null) {
    const mod = modules.get(modDir);
    if (spec !== mod && !spec.startsWith(`${mod}/`)) return null;
    const target = joinPath(modDir, spec.slice(mod.length + 1));
    return indexOf(files).dirs.has(target) ? target : null;
  }
  const segs = spec.split("/").filter(Boolean);
  return segs.length < 2 ? null : dirBySuffix(segs, files, 2);
}
function resolveImport(from, spec, lang, files, goModules = /* @__PURE__ */ new Map()) {
  const dir = dirOf2(from);
  switch (lang) {
    case "ts": {
      if (!spec.startsWith(".")) return null;
      const base = joinPath(dir, spec);
      const stem = base.replace(/\.(?:[cm]?js|jsx)$/, "");
      return firstIn([
        base,
        ...TS_EXTS.map((e) => base + e),
        ...TS_EXTS.map((e) => stem + e),
        ...TS_EXTS.map((e) => `${base}/index${e}`)
      ], files);
    }
    case "py": {
      const dots = spec.match(/^\.*/)[0].length;
      const parts = spec.slice(dots).split(".").filter(Boolean);
      const tryBase = (base) => firstIn([`${base}.py`, `${base}/__init__.py`].map((c) => c.replace(/^\//, "")), files);
      if (dots > 0) {
        let d = dir;
        for (let i = 1; i < dots; i++) d = dirOf2(d);
        return tryBase(joinPath(d, ...parts));
      }
      if (!parts.length) return null;
      for (let d = dir; ; d = dirOf2(d)) {
        const hit = tryBase(joinPath(d, ...parts));
        if (hit) return hit;
        if (!d) return null;
      }
    }
    case "go":
      return resolveGo(from, spec, files, goModules);
    case "cs": {
      const segs = spec.split(".").filter(Boolean);
      return dirBySuffix(segs, files, segs.length === 1 ? 1 : 2);
    }
    case "java": {
      const wild = spec.endsWith(".*");
      const segs = spec.replace(/\.\*$/, "").split(".");
      if (!wild) {
        for (let k = segs.length; k >= 2; k--) {
          const hit = fileBySuffix(segs.slice(0, k).join("/"), [".java", ".kt"], files);
          if (hit) return hit;
        }
      }
      return dirBySuffix(wild ? segs : segs.slice(0, -1), files, 2);
    }
    case "rs": {
      const [head, ...rest] = spec.split("::");
      if (head === "super") return null;
      if (head === "self") {
        const name = rest[0];
        const stem = posix.basename(from).replace(/\.rs$/, "");
        const nest = ["mod", "lib", "main"].includes(stem) ? dir : joinPath(dir, stem);
        return firstIn([joinPath(nest, `${name}.rs`), joinPath(nest, name, "mod.rs")], files);
      }
      for (let k = rest.length; k >= 1; k--) {
        const rel = rest.slice(0, k).join("/");
        const hit = fileBySuffix(rel, [".rs", "/mod.rs"], files);
        if (hit) return hit;
        const d = dirBySuffix(rest.slice(0, k), files, k);
        if (d && endsAt(d, rel)) return d;
      }
      return null;
    }
    case "rb": {
      const rel = spec.replace(/\.rb$/, "");
      const local = joinPath(dir, `${rel}.rb`);
      if (files.has(local)) return local;
      return fileBySuffix(rel.replace(/^(\.\.?\/)+/, ""), [".rb"], files);
    }
    case "php": {
      if (spec.includes("\\")) return fileBySuffix(spec.replace(/^\\/, "").replace(/\\/g, "/"), [".php"], files);
      const rel = spec.replace(/^\//, "");
      return firstIn([joinPath(dir, rel), rel], files);
    }
  }
}
var MIN_COCHANGE_COMMITS = 3;
function readSource(root, path) {
  try {
    return readFileSync3(join3(root, path), "utf8");
  } catch {
    return null;
  }
}
var lineAt = (source, index2) => {
  let n = 1;
  for (let i = source.indexOf("\n"); i >= 0 && i < index2; i = source.indexOf("\n", i + 1)) n++;
  return n;
};
function scanEdges(root, known, from = known) {
  const filesByDir = /* @__PURE__ */ new Map();
  for (const p of known) {
    for (let d = dirOf2(p); ; d = dirOf2(d)) {
      (filesByDir.get(d) ?? filesByDir.set(d, /* @__PURE__ */ new Set()).get(d)).add(p);
      if (!d) break;
    }
  }
  const goModules = /* @__PURE__ */ new Map();
  for (const p of known) {
    if (posix.basename(p) !== "go.mod") continue;
    const m = readSource(root, p)?.match(/^\s*module\s+(\S+)/m);
    if (m) goModules.set(dirOf2(p), m[1].replace(/^"|"$/g, ""));
  }
  const edges = [];
  const seen = /* @__PURE__ */ new Set();
  for (const path of from) {
    const lang = languageOf(path);
    if (!lang || !known.has(path)) continue;
    const src = readSource(root, path);
    if (src === null) continue;
    for (const { spec, index: index2 } of importMatches(lang, src)) {
      const target = resolveImport(path, spec, lang, known, goModules);
      if (!target) continue;
      const line2 = lineAt(src, index2);
      const targets = known.has(target) ? [target] : [...filesByDir.get(target) ?? []];
      for (const t of targets) {
        const key = `${path}\0${line2}\0${t}`;
        if (t === path || seen.has(key)) continue;
        seen.add(key);
        edges.push({ fromFile: path, line: line2, toFile: t });
      }
    }
  }
  return edges.sort((a, b) => cmp(a.fromFile, b.fromFile) || a.line - b.line || cmp(a.toFile, b.toFile));
}
var cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
function importEdges(root, files) {
  return scanEdges(root, new Set(files.map((f) => typeof f === "string" ? f : f.path)));
}
function fanInByZone(root, files, zones, commits) {
  const known = new Set(files.map((f) => f.path));
  const zoneOf = zoneIndex(zones);
  const importers = new Map(zones.map((z) => [z.id, /* @__PURE__ */ new Set()]));
  const hasSupported = /* @__PURE__ */ new Set();
  for (const [path, zid] of zoneOf) if (languageOf(path) && known.has(path)) hasSupported.add(zid);
  for (const e of scanEdges(root, known, zoneOf.keys())) {
    const fz = zoneOf.get(e.fromFile);
    const tz = zoneOf.get(e.toFile);
    if (fz && tz && tz !== fz) importers.get(tz).add(e.fromFile);
  }
  const result = {};
  for (const z of zones) {
    if (hasSupported.has(z.id)) {
      result[z.id] = importers.get(z.id).size;
      continue;
    }
    const counts = /* @__PURE__ */ new Map();
    for (const c of commits) {
      const paths = new Set(c.files.map((f) => f.path));
      if (!z.files.some((f) => paths.has(f))) continue;
      for (const p of paths) {
        const pz = zoneOf.get(p);
        if (pz && pz !== z.id) counts.set(p, (counts.get(p) ?? 0) + 1);
      }
    }
    result[z.id] = [...counts.values()].filter((n) => n >= MIN_COCHANGE_COMMITS).length;
  }
  return result;
}

// src/pipeline.ts
import { homedir } from "node:os";

// src/attribution.ts
import { randomBytes } from "node:crypto";
import { appendFileSync, mkdirSync as mkdirSync3, readdirSync as readdirSync2, readFileSync as readFileSync5, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join5, relative, sep } from "node:path";

// src/jsonl-union.ts
import { existsSync as existsSync2, readdirSync, readFileSync as readFileSync4 } from "node:fs";
import { join as join4 } from "node:path";

// src/git.ts
import { execFileSync } from "node:child_process";
var GitError = class extends Error {
  constructor(message, status, stderr) {
    super(message);
    this.status = status;
    this.stderr = stderr;
    this.name = "GitError";
  }
};
function git(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C" },
      maxBuffer: 512 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (e) {
    const err2 = e;
    const stderr = String(err2.stderr ?? "");
    throw new GitError(`git ${args.join(" ")} failed: ${stderr.trim() || err2.message}`, err2.status ?? null, stderr);
  }
}
function repoRootOf(cwd) {
  try {
    return git(cwd, ["rev-parse", "--show-toplevel"]).trim() || null;
  } catch {
    return null;
  }
}
function listTrackedFiles(root) {
  return git(root, ["ls-files", "-z"]).split("\0").filter(Boolean);
}
var AGENT_RE = /^co-authored-by:.*\b(claude|anthropic|copilot|cursor|codex|devin|aider|gemini|openai|windsurf|cline|jules)\b/im;
function isAgentTrailer(message) {
  return AGENT_RE.test(message);
}
function parseNumstat(body) {
  const tokens = body.replace(/^[\n\0]+/, "").split("\0");
  const files = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i].replace(/^\n+/, "");
    if (!tok) continue;
    const m = /^(\d+|-)\t(\d+|-)\t(.*)$/s.exec(tok);
    if (!m) continue;
    let path = m[3];
    if (path === "") {
      path = tokens[i + 2] ?? "";
      i += 2;
    }
    files.push({
      path,
      added: m[1] === "-" ? 0 : Number(m[1]),
      deleted: m[2] === "-" ? 0 : Number(m[2])
    });
  }
  return files;
}
function readHistory(root, sinceDays, now = /* @__PURE__ */ new Date()) {
  const since = new Date(now.getTime() - sinceDays * 864e5).toISOString();
  try {
    git(root, ["rev-parse", "--verify", "-q", "HEAD"]);
  } catch {
    return [];
  }
  const out2 = git(root, [
    "log",
    "--no-merges",
    "-M",
    "-z",
    "--numstat",
    `--since=${since}`,
    "--format=%x1e%H%x1f%ae%x1f%aI%x1f%B%x1f"
  ]);
  const commits = [];
  for (const rec of out2.split("")) {
    if (!rec.trim()) continue;
    const [sha, email, date, message, body = ""] = rec.split("");
    commits.push({
      sha,
      email,
      date: new Date(date),
      message,
      agentTrailer: isAgentTrailer(message),
      files: parseNumstat(body)
    });
  }
  return commits;
}
function currentEmail(root) {
  try {
    return git(root, ["config", "user.email"]).trim();
  } catch {
    return "";
  }
}
function defaultBranchRef(root) {
  try {
    const ref2 = git(root, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]).trim();
    if (ref2) return ref2;
  } catch {
  }
  for (const ref2 of ["origin/main", "origin/master"]) {
    try {
      git(root, ["rev-parse", "--verify", "--quiet", `refs/remotes/${ref2}`]);
      return ref2;
    } catch {
    }
  }
  return null;
}
function showAtRef(root, ref2, path) {
  try {
    return git(root, ["show", `${ref2}:${path}`]);
  } catch {
    return null;
  }
}
function listAtRef(root, ref2, dir) {
  const d = dir.replace(/^\.\//, "").replace(/\/+$/, "");
  try {
    const args = ["ls-tree", "-r", "--name-only", "-z", ref2];
    if (d) args.push("--", `${d}/`);
    return git(root, args).split("\0").filter(Boolean);
  } catch {
    return [];
  }
}
function commitsWithNotes(root, notesRef) {
  try {
    const out2 = git(root, ["notes", `--ref=${notesRef}`, "list"]);
    const set = /* @__PURE__ */ new Set();
    for (const line2 of out2.split("\n")) {
      const parts = line2.trim().split(/\s+/);
      if (parts[1]) set.add(parts[1]);
    }
    return set;
  } catch {
    return /* @__PURE__ */ new Set();
  }
}

// src/jsonl-union.ts
function countLines(text3) {
  const m = /* @__PURE__ */ new Map();
  for (const line2 of text3.split("\n")) if (line2.trim()) m.set(line2, (m.get(line2) ?? 0) + 1);
  return m;
}
function readJsonlUnion(root, dirRel, defaultRef) {
  const counts = /* @__PURE__ */ new Map();
  const merge = (name, text3) => {
    const cur = counts.get(name) ?? counts.set(name, /* @__PURE__ */ new Map()).get(name);
    for (const [line2, n] of countLines(text3)) cur.set(line2, Math.max(cur.get(line2) ?? 0, n));
  };
  const dir = join4(root, dirRel);
  if (existsSync2(dir)) {
    for (const n of readdirSync(dir).filter((x) => x.endsWith(".jsonl")).sort()) {
      try {
        merge(n, readFileSync4(join4(dir, n), "utf8"));
      } catch {
      }
    }
  }
  if (defaultRef) {
    for (const p of listAtRef(root, defaultRef, dirRel)) {
      if (!p.endsWith(".jsonl")) continue;
      const t = showAtRef(root, defaultRef, p);
      if (t !== null) merge(p.slice(p.lastIndexOf("/") + 1), t);
    }
  }
  const out2 = /* @__PURE__ */ new Map();
  for (const [name, lines] of counts) {
    const arr = [];
    for (const [line2, n] of lines) for (let k = 0; k < n; k++) arr.push(line2);
    out2.set(name, arr);
  }
  return out2;
}

// src/attribution.ts
function agentLinesByCommit(commits, edits, notedShas, opts = {}) {
  const includeAll = opts.includeTrailersAndNotes ?? true;
  const isMine = opts.isMine ?? (() => true);
  const editsByFile = /* @__PURE__ */ new Map();
  for (const e of edits) (editsByFile.get(e.file) ?? editsByFile.set(e.file, []).get(e.file)).push(e);
  const result = /* @__PURE__ */ new Map();
  commits.forEach((c, i) => {
    const perFile = /* @__PURE__ */ new Map();
    const wholeCommit = includeAll && (c.agentTrailer || notedShas.has(c.sha));
    if (!wholeCommit && !isMine(c.email)) return;
    for (const f of c.files) {
      if (f.added <= 0) continue;
      let lines = 0;
      if (wholeCommit) {
        lines = f.added;
      } else {
        const fileEdits = editsByFile.get(f.path);
        if (!fileEdits) continue;
        const prev = commits.slice(i + 1).find((p) => p.files.some((pf) => pf.path === f.path));
        const lo = prev ? prev.date.getTime() : -Infinity;
        const hi = c.date.getTime();
        const sum2 = fileEdits.filter((e) => {
          const t = Date.parse(e.ts);
          return t > lo && t <= hi;
        }).reduce((n, e) => n + e.lines, 0);
        lines = Math.min(f.added, sum2);
      }
      if (lines > 0) perFile.set(f.path, (perFile.get(f.path) ?? 0) + lines);
    }
    if (perFile.size) result.set(c.sha, perFile);
  });
  return result;
}
var countLines2 = (s) => typeof s === "string" && s.length ? s.split("\n").length : 0;
function editLines(name, input) {
  if (name === "Edit") return countLines2(input.new_string);
  if (name === "Write") return countLines2(input.content);
  if (Array.isArray(input.edits)) {
    return input.edits.reduce((n, e) => n + countLines2(e?.new_string), 0);
  }
  return 0;
}
function backfillSessionEdits(root, homeDir) {
  const dir = join5(homeDir, ".claude", "projects", root.replace(/[^A-Za-z0-9-]/g, "-"));
  let names;
  try {
    names = readdirSync2(dir).filter((n) => n.endsWith(".jsonl")).sort();
  } catch {
    return [];
  }
  const out2 = [];
  for (const name of names) {
    let text3;
    try {
      text3 = readFileSync5(join5(dir, name), "utf8");
    } catch {
      continue;
    }
    for (const line2 of text3.split("\n")) {
      if (!line2.trim()) continue;
      try {
        const rec = JSON.parse(line2);
        if (rec?.type !== "assistant" || typeof rec.timestamp !== "string" || !Array.isArray(rec.message?.content)) continue;
        const session = typeof rec.sessionId === "string" ? rec.sessionId : name.replace(/\.jsonl$/, "");
        for (const block2 of rec.message.content) {
          if (block2?.type !== "tool_use" || !["Edit", "Write", "MultiEdit"].includes(block2.name)) continue;
          const input = block2.input ?? {};
          const fp = input.file_path;
          if (typeof fp !== "string") continue;
          const rel = relative(root, fp);
          if (!rel || rel.startsWith("..") || rel.startsWith(sep) || /^[A-Za-z]:/.test(rel)) continue;
          const lines = editLines(block2.name, input);
          if (lines <= 0) continue;
          out2.push({ file: rel.split(sep).join("/"), ranges: [], lines, session, ts: rec.timestamp });
        }
      } catch {
      }
    }
  }
  return out2;
}
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
var localDir = (root) => join5(umDir(root), "local");
var shareDir = (root) => join5(umDir(root), "agent-share");
function machineId(root) {
  const path = join5(localDir(root), "machine-id");
  try {
    const id2 = readFileSync5(path, "utf8").trim();
    if (/^[0-9a-f]{8}$/.test(id2)) return id2;
  } catch {
  }
  const id = randomBytes(4).toString("hex");
  mkdirSync3(localDir(root), { recursive: true });
  writeFileSync3(path, id);
  return id;
}
function syncAgentShare(root, zones, commits, agentLines) {
  const zoneOf = zoneIndex(zones);
  const totals = /* @__PURE__ */ new Map();
  for (const c of commits) {
    const perFile = agentLines.get(c.sha);
    if (!perFile) continue;
    const week = isoWeek(c.date);
    for (const [path, n] of perFile) {
      const zone = zoneOf.get(path);
      if (!zone || n <= 0) continue;
      const key = `${zone}|${week}`;
      const cur = totals.get(key) ?? { zone, week, total: 0 };
      cur.total += n;
      totals.set(key, cur);
    }
  }
  const writtenPath = join5(localDir(root), "agent-share-written.json");
  let written = {};
  try {
    const v = JSON.parse(readFileSync5(writtenPath, "utf8"));
    if (typeof v === "object" && v !== null && !Array.isArray(v)) written = v;
  } catch {
  }
  const lines = [];
  for (const [key, { zone, week, total }] of totals) {
    const delta = total - (written[key] ?? 0);
    if (delta <= 0) continue;
    const entry = { zone, agentLines: delta, week };
    lines.push(JSON.stringify(entry));
    written[key] = total;
  }
  if (!lines.length) return;
  mkdirSync3(shareDir(root), { recursive: true });
  appendFileSync(join5(shareDir(root), `${machineId(root)}.jsonl`), lines.join("\n") + "\n");
  mkdirSync3(localDir(root), { recursive: true });
  writeFileSync3(writtenPath, JSON.stringify(written));
}
function readAgentShares(root, defaultRef) {
  const out2 = [];
  for (const lines of readJsonlUnion(root, ".understanding/agent-share", defaultRef).values()) {
    for (const line2 of lines) {
      try {
        const v = JSON.parse(line2);
        if (typeof v.zone !== "string" || typeof v.agentLines !== "number" || typeof v.week !== "string") continue;
        out2.push(v);
      } catch {
      }
    }
  }
  return out2;
}

// src/editlog.ts
import { appendFileSync as appendFileSync2, mkdirSync as mkdirSync4, readFileSync as readFileSync6, writeFileSync as writeFileSync4 } from "node:fs";
import { join as join6 } from "node:path";
var localDir2 = (root) => join6(umDir(root), "local");
var editsPath = (root) => join6(localDir2(root), "edits.jsonl");
var handoffPath = (root) => join6(localDir2(root), "handoff.json");
function appendEdit(root, e) {
  mkdirSync4(localDir2(root), { recursive: true });
  appendFileSync2(editsPath(root), JSON.stringify(e) + "\n");
}
function readEdits(root) {
  let text3;
  try {
    text3 = readFileSync6(editsPath(root), "utf8");
  } catch {
    return [];
  }
  const out2 = [];
  for (const line2 of text3.split("\n")) {
    if (!line2.trim()) continue;
    try {
      out2.push(JSON.parse(line2));
    } catch {
    }
  }
  return out2;
}
function readHandoff(root) {
  try {
    const v = JSON.parse(readFileSync6(handoffPath(root), "utf8"));
    return {
      checkedUpTo: typeof v.checkedUpTo === "string" ? v.checkedUpTo : "",
      nudgedLines: typeof v.nudgedLines === "number" ? v.nudgedLines : 0
    };
  } catch {
    return { checkedUpTo: "", nudgedLines: 0 };
  }
}
function writeHandoff(root, h) {
  mkdirSync4(localDir2(root), { recursive: true });
  writeFileSync4(handoffPath(root), JSON.stringify(h));
}
function uncheckedEdits(root) {
  const { checkedUpTo } = readHandoff(root);
  return readEdits(root).filter((e) => e.ts > checkedUpTo);
}
function markChecked(root, upToTs) {
  writeHandoff(root, { checkedUpTo: upToTs, nudgedLines: 0 });
}
function getNudgedLines(root) {
  return readHandoff(root).nudgedLines;
}
function setNudgedLines(root, n) {
  writeHandoff(root, { ...readHandoff(root), nudgedLines: n });
}

// src/events.ts
import { appendFileSync as appendFileSync3, mkdirSync as mkdirSync5, readFileSync as readFileSync7, writeFileSync as writeFileSync5 } from "node:fs";
import { join as join7 } from "node:path";

// src/identity.ts
function sanitizeHandle(s) {
  const h = s.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  return h === "" || h === "." || h === ".." ? "unknown" : h;
}
function handleFor(email, config) {
  const override = Object.hasOwn(config.handles, email) ? config.handles[email] : "";
  return sanitizeHandle(override || email.split("@")[0]);
}

// src/events.ts
var eventsRel = ".understanding/events";
var localDir3 = (root) => join7(umDir(root), "local");
function appendJsonl(dir, file, value) {
  mkdirSync5(dir, { recursive: true });
  appendFileSync3(join7(dir, file), JSON.stringify(value) + "\n");
}
function appendPass(root, handle, ev) {
  appendJsonl(join7(root, eventsRel), `${sanitizeHandle(handle)}.jsonl`, ev);
}
function readPasses(root, defaultRef) {
  const out2 = /* @__PURE__ */ new Map();
  for (const [name, lines] of readJsonlUnion(root, eventsRel, defaultRef)) {
    const evs = [];
    for (const line2 of lines) {
      try {
        evs.push(JSON.parse(line2));
      } catch {
      }
    }
    out2.set(name.replace(/\.jsonl$/, ""), evs);
  }
  return out2;
}
function appendLocalPartial(root, ev) {
  appendJsonl(localDir3(root), "partials.jsonl", ev);
}
function readLocalPartials(root) {
  let text3;
  try {
    text3 = readFileSync7(join7(localDir3(root), "partials.jsonl"), "utf8");
  } catch {
    return [];
  }
  const out2 = [];
  for (const line2 of text3.split("\n")) {
    if (!line2.trim()) continue;
    try {
      out2.push(JSON.parse(line2));
    } catch {
    }
  }
  return out2;
}
function appendAttempt(root, a) {
  appendJsonl(localDir3(root), "attempts.jsonl", a);
}
function readFlags(root) {
  try {
    const v = JSON.parse(readFileSync7(join7(localDir3(root), "flags.json"), "utf8"));
    if (typeof v === "object" && v !== null && !Array.isArray(v)) return v;
  } catch {
  }
  return {};
}
function writeFlags(root, flags) {
  mkdirSync5(localDir3(root), { recursive: true });
  writeFileSync5(join7(localDir3(root), "flags.json"), JSON.stringify(flags, null, 2) + "\n");
}
function addFlag(root, zone, flag) {
  const flags = readFlags(root);
  const cur = Array.isArray(flags[zone]) ? flags[zone] : [];
  if (cur.includes(flag)) return;
  flags[zone] = [...cur, flag];
  writeFlags(root, flags);
}
function removeFlag(root, zone, flag) {
  const flags = readFlags(root);
  const cur = Object.hasOwn(flags, zone) && Array.isArray(flags[zone]) ? flags[zone] : [];
  if (!cur.includes(flag)) return;
  const rest = cur.filter((f) => f !== flag);
  if (rest.length) flags[zone] = rest;
  else delete flags[zone];
  writeFlags(root, flags);
}

// src/reviews.ts
import { execFileSync as execFileSync2 } from "node:child_process";
import { mkdirSync as mkdirSync6, readFileSync as readFileSync8, writeFileSync as writeFileSync6 } from "node:fs";
import { dirname as dirname2, join as join8 } from "node:path";
var BUDGET_MS = 2e4;
var CACHE_MS = 24 * 36e5;
var MIN_COMMENT_CHARS = 20;
var ghIn = (root, args, timeout) => execFileSync2("gh", args, { cwd: root, timeout, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
function ghAvailable(root) {
  try {
    ghIn(root, ["auth", "status"], 5e3);
    return true;
  } catch {
    return false;
  }
}
var cachePath2 = (root) => join8(umDir(root), "local", "reviews-cache.json");
function readReviewCache(root) {
  try {
    const v = JSON.parse(readFileSync8(cachePath2(root), "utf8"));
    const at = typeof v.fetchedAt === "string" ? Date.parse(v.fetchedAt) : NaN;
    if (Number.isNaN(at) || Date.now() - at >= CACHE_MS || typeof v.counts !== "object" || v.counts === null) return null;
    return v.counts;
  } catch {
    return null;
  }
}
function cachedReviews(root, config) {
  return config.githubReviews ? readReviewCache(root) ?? {} : {};
}
function writeCache(root, counts) {
  try {
    mkdirSync6(dirname2(cachePath2(root)), { recursive: true });
    writeFileSync6(cachePath2(root), JSON.stringify({ fetchedAt: new Date(Date.now()).toISOString(), counts }));
  } catch {
  }
}
function reviewCountsByPath(root, run = (args, t) => ghIn(root, args, t)) {
  const cached = readReviewCache(root);
  if (cached) return cached;
  const started = Date.now();
  const call = (args) => {
    const left = BUDGET_MS - (Date.now() - started);
    if (left <= 0) throw new Error("review budget exceeded");
    return run(args, Math.max(1, left));
  };
  try {
    const repo = call(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]).trim();
    const prs = JSON.parse(call(["api", `repos/${repo}/pulls?state=closed&per_page=50`, "--jq", "[.[] | {number, merged_at}]"]));
    const counts = {};
    for (const pr of prs.filter((p) => p.merged_at)) {
      const comments = JSON.parse(call(["api", `repos/${repo}/pulls/${pr.number}/comments?per_page=100`]));
      for (const c of comments) {
        const login = c.user?.login;
        if (!c.path || !login || (c.body ?? "").trim().length < MIN_COMMENT_CHARS) continue;
        counts[c.path] ??= {};
        counts[c.path][login] = (counts[c.path][login] ?? 0) + 1;
      }
    }
    if (Date.now() - started > BUDGET_MS) return {};
    writeCache(root, counts);
    return counts;
  } catch {
    return {};
  }
}

// src/scoring.ts
var import_picomatch2 = __toESM(require_picomatch2(), 1);

// src/weights.ts
var HUMAN_BASE = 30;
var HUMAN_SHARE_MULT = 80;
var HUMAN_SHARE_MAX = 40;
var AGENT_PENALTY = 50;
var REVIEW_PER = 5;
var REVIEW_MAX = 10;
var SESSION_PASS_LEVEL = 80;
var PARTIAL_LEVEL = 50;
var HANDOFF_PASS_LEVEL = 65;
var RECENT_DAYS = 90;
var DARKNESS = { dark: 1, fading: 0.6, fragile: 0.4, owned: 0.1, unknown: 0 };
var CRIT = { fanIn: 0.35, churn: 0.25, loc: 0.15, fixes: 0.25, tagged: 1 };
var FIX_RE = /\b(fix|bug|hotfix|revert|incident)\b/i;
var DARK_AGENT_SHARE = 0.5;

// src/scoring.ts
var DAY = 864e5;
var STATES = ["owned", "fragile", "fading", "dark", "unknown"];
var clamp = (n, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
var sum = (ns) => ns.reduce((a, b) => a + b, 0);
var num = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
var share = (v) => clamp(num(v), 0, 1);
var daysSince = (now, t) => Math.max(0, (now.getTime() - t) / DAY);
var plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
var pct = (s) => `${Math.max(1, Math.round(s * 100))}%`;
var ago = (days) => days < 1 ? "today" : `${plural(Math.floor(days), "day", "days")} ago`;
var timeDecay = (days, halfLifeDays) => halfLifeDays > 0 ? 0.5 ** (days / halfLifeDays) : 1;
var NOTICEABLE_DECAY = 0.97;
function decayTimeEvidence(days, cfg) {
  return { kind: "decay-time", text: `evidence from ${ago(days)} counts for less (it halves every ${cfg.halfLifeDays} days)` };
}
function validEvents(evs) {
  if (!Array.isArray(evs)) return [];
  return evs.filter((e) => typeof e === "object" && e !== null && typeof e.zone === "string" && typeof e.date === "string" && !Number.isNaN(Date.parse(e.date)) && typeof e.level === "number" && Number.isFinite(e.level)).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
var latestFor = (zoneId, evs) => validEvents(evs).filter((e) => e.zone === zoneId).at(-1);
function zoneTouches(zone, inp) {
  const inZone = new Set(zone.files);
  const out2 = [];
  for (const c of inp.commits) {
    const files = c.files.filter((f) => inZone.has(f.path));
    if (!files.length) continue;
    const agentByPath = inp.agentLines.get(c.sha);
    out2.push({
      handle: inp.handleOf(c.email),
      time: c.date.getTime(),
      message: c.message,
      added: sum(files.map((f) => Math.max(0, f.added))),
      agent: sum(files.map((f) => clamp(num(agentByPath?.get(f.path)), 0, Math.max(0, f.added))))
    });
  }
  return out2;
}
function activity(inp) {
  const last = /* @__PURE__ */ new Map();
  const see = (h, t) => last.set(h, Math.max(t, last.get(h) ?? -Infinity));
  for (const c of inp.commits) see(inp.handleOf(c.email), c.date.getTime());
  for (const [h, evs] of inp.passes) for (const e of validEvents(evs)) see(h, Date.parse(e.date));
  return last;
}
function zoneAgentShare(zone, touches, inp) {
  const added = sum(touches.map((t) => t.added));
  const local = added > 0 ? sum(touches.map((t) => t.agent)) / added : 0;
  return Math.max(share(local), share(inp.sharedAgentShare[zone.id]));
}
function personAgentFrac(handle, zone, mine, inp) {
  const added = sum(mine.map((t) => t.added));
  const own = added > 0 ? share(sum(mine.map((t) => t.agent)) / added) : 0;
  if (inp.config.mode === "team" && handle !== inp.me) return Math.max(own, share(inp.sharedAgentShare[zone.id]));
  return own;
}
function historyLevel(handle, zone, touches, inp) {
  const mine = touches.filter((t) => t.handle === handle);
  const reviews = Math.max(0, num(inp.reviews[zone.id]?.[handle]));
  if (!mine.length && !reviews) return null;
  const evidence = [];
  let level = 0;
  if (mine.length) {
    const lines = sum(mine.map((t) => t.added));
    const last = Math.max(...mine.map((t) => t.time));
    const days = daysSince(inp.now, last);
    evidence.push({ kind: "human-commits", text: `added ~${lines} lines here; last commit ${ago(days)}` });
    const agentFrac = personAgentFrac(handle, zone, mine, inp);
    const zoneShare = zoneAgentShare(zone, touches, inp);
    const teammate = inp.config.mode === "team" && handle !== inp.me;
    if (agentFrac > 0 || teammate && zoneShare > 0) {
      evidence.push({ kind: "agent-share", text: `about ${pct(zoneShare)} of this zone was written by agents` });
    }
    const authorship = zone.loc > 0 ? Math.min(HUMAN_SHARE_MAX, HUMAN_SHARE_MULT * lines / zone.loc) : 0;
    const raw = Math.max(0, HUMAN_BASE + authorship - AGENT_PENALTY * agentFrac);
    const othersAfter = sum(touches.filter((t) => t.handle !== handle && t.time > last).map((t) => t.added));
    const changed = zone.loc > 0 ? Math.max(0, 1 - othersAfter / zone.loc) : 1;
    if (othersAfter > 0) evidence.push({ kind: "decay-change", text: `others have added ~${othersAfter} lines here since` });
    const faded = timeDecay(days, inp.config.halfLifeDays);
    if (faded <= NOTICEABLE_DECAY) evidence.push(decayTimeEvidence(days, inp.config));
    level = raw * changed * faded;
  }
  if (reviews) {
    level += Math.min(REVIEW_MAX, REVIEW_PER * reviews);
    evidence.push({ kind: "review", text: `reviewed ${plural(reviews, "change", "changes")} here` });
  }
  return { level, evidence };
}
function passLevel(ev, zone, inp, kind) {
  const fp = typeof ev.fingerprint === "object" && ev.fingerprint !== null ? ev.fingerprint : {};
  const byLines = inp.fileLoc !== void 0 && zone.files.some((f) => num(inp.fileLoc?.[f]) > 0);
  const weight = (f) => byLines ? Math.max(0, num(inp.fileLoc?.[f])) : 1;
  const total = sum(zone.files.map(weight));
  const same = sum(zone.files.filter((f) => fp[f] === zone.fingerprint[f]).map(weight));
  const unchanged = total > 0 ? same / total : 0;
  const days = daysSince(inp.now, Date.parse(ev.date));
  const faded = timeDecay(days, inp.config.halfLifeDays);
  const what = ev.kind === "handoff" ? "a handoff check" : "a learning session";
  const evidence = [kind === "pass" ? { kind: "pass", text: `passed ${what} here ${ago(days)}` } : { kind: "partial", text: `partly passed ${what} here ${ago(days)}` }];
  if (unchanged < 1) evidence.push({ kind: "decay-change", text: `about ${pct(1 - unchanged)} of its files have changed since` });
  if (faded <= NOTICEABLE_DECAY) evidence.push(decayTimeEvidence(days, inp.config));
  return { level: clamp(ev.level) * unchanged * faded, evidence };
}
var FLAG_TEXT = {
  "hard-to-verify": "too unclear to quiz on yet (hard to verify)",
  "unreviewed-agent-code": "has agent code that skipped a handoff check (unreviewed)"
};
var zoneFlags = (zone, inp) => (Array.isArray(inp.flags[zone.id]) ? inp.flags[zone.id] : []).filter((f) => f in FLAG_TEXT);
function personLevels(zone, inp) {
  const touches = zoneTouches(zone, inp);
  const lastActive = activity(inp);
  const passes = /* @__PURE__ */ new Map();
  for (const [h, evs] of inp.passes) {
    const ev = latestFor(zone.id, evs);
    if (ev) passes.set(h, ev);
  }
  const partial = latestFor(zone.id, inp.localPartials);
  const handles = /* @__PURE__ */ new Set([...touches.map((t) => t.handle), ...Object.keys(inp.reviews[zone.id] ?? {}), ...passes.keys()]);
  if (partial) handles.add(inp.me);
  const people = [];
  for (const handle of handles) {
    const pass = passes.get(handle);
    const parts = [
      historyLevel(handle, zone, touches, inp),
      pass ? passLevel(pass, zone, inp, "pass") : null,
      partial && handle === inp.me ? passLevel(partial, zone, inp, "partial") : null
    ].filter((p) => p !== null);
    if (!parts.length) continue;
    const evidence = parts.flatMap((p) => p.evidence);
    const active = daysSince(inp.now, lastActive.get(handle) ?? -Infinity) <= inp.config.activeDays;
    if (!active) {
      evidence.push({ kind: "inactive", text: `no commits or passes in this repository in the last ${inp.config.activeDays} days` });
    }
    if (handle === inp.me) for (const f of zoneFlags(zone, inp)) evidence.push({ kind: "flag", text: FLAG_TEXT[f] });
    people.push({ handle, level: Math.round(clamp(Math.max(...parts.map((p) => p.level)))), active, evidence });
  }
  return people.sort((a, b) => b.level - a.level || (a.handle < b.handle ? -1 : a.handle > b.handle ? 1 : 0));
}
function zoneState(people, agentShare, hasEvidence, inp) {
  const { threshold, fadingFloor, mode } = inp.config;
  const active = people.filter((p) => mode === "team" ? p.active : p.handle === inp.me);
  const above = active.filter((p) => p.level >= threshold).length;
  if (mode === "solo") {
    if (above) return "owned";
    if (active.some((p) => p.level >= fadingFloor)) return "fading";
    return hasEvidence ? "dark" : "unknown";
  }
  if (above >= 2) return "owned";
  if (above === 1) return "fragile";
  if (active.some((p) => p.level >= fadingFloor)) return "fading";
  if (agentShare >= DARK_AGENT_SHARE || people.length > 0 && !active.length) return "dark";
  return "unknown";
}
function rank(values, v) {
  return v > 0 ? values.filter((w) => w <= v).length / values.length : 0;
}
function signals(zone, touches, inp, isCritical) {
  const recent = touches.filter((t) => daysSince(inp.now, t.time) <= RECENT_DAYS);
  return {
    fanIn: Math.max(0, num(inp.fanIn[zone.id])),
    churn90: recent.length,
    loc: zone.loc,
    fixes90: recent.filter((t) => FIX_RE.test(t.message)).length,
    tagged: zone.files.some(isCritical)
  };
}
function criticality(all) {
  const col = (k) => all.map((s) => s[k]);
  const [fanIn, churn, loc, fixes] = [col("fanIn"), col("churn90"), col("loc"), col("fixes90")];
  return all.map((s) => {
    const score = CRIT.fanIn * rank(fanIn, s.fanIn) + CRIT.churn * rank(churn, s.churn90) + CRIT.loc * rank(loc, s.loc) + CRIT.fixes * rank(fixes, s.fixes90) + (s.tagged ? CRIT.tagged : 0);
    return { ...s, score: Math.round(score * 100) / 100 };
  });
}
function reasonFor(state, c) {
  const parts = [state[0].toUpperCase() + state.slice(1)];
  if (c.fanIn > 0) parts.push(`${plural(c.fanIn, "file imports", "files import")} it`);
  if (c.fixes90 > 0) parts.push(`${plural(c.fixes90, "fix", "fixes")} in the last ${RECENT_DAYS} days`);
  if (c.tagged) parts.push("tagged critical");
  return parts.join(" \xB7 ");
}
function scoreMap(inp) {
  const isCritical = inp.config.critical.length ? (0, import_picomatch2.default)(inp.config.critical, { dot: true }) : () => false;
  const drafts = inp.zones.map((zone) => {
    const touches = zoneTouches(zone, inp);
    const people = personLevels(zone, inp);
    const agentShare = zoneAgentShare(zone, touches, inp);
    const state = zoneState(people, agentShare, people.length > 0 || agentShare > 0, inp);
    return { zone, people, agentShare, state, signals: signals(zone, touches, inp, isCritical) };
  });
  const crits = criticality(drafts.map((d) => d.signals));
  const zones = drafts.map(({ zone, people, agentShare, state }, i) => ({
    zone,
    state,
    people,
    agentShare,
    criticality: crits[i],
    darkness: DARKNESS[state],
    danger: DARKNESS[state] * crits[i].score,
    reason: reasonFor(state, crits[i]),
    flags: zoneFlags(zone, inp)
  }));
  const byId = (a, b) => a.zone.id < b.zone.id ? -1 : a.zone.id > b.zone.id ? 1 : 0;
  const top = zones.filter((z) => z.danger > 0).sort((a, b) => b.danger - a.danger || b.criticality.score - a.criticality.score || byId(a, b)).slice(0, 10);
  const unclearCritical = zones.filter((z) => z.state === "unknown" && z.criticality.score >= 0.5).sort((a, b) => b.criticality.score - a.criticality.score || byId(a, b)).slice(0, 3);
  const counts = Object.fromEntries(STATES.map((s) => [s, zones.filter((z) => z.state === s).length]));
  return { mode: inp.config.mode, generatedAt: inp.now.toISOString(), me: inp.me, zones, top, unclearCritical, counts };
}

// src/pipeline.ts
function sharedShareByZone(root, zones, commits, now, historyDays, defaultRef) {
  const zoneOf = zoneIndex(zones);
  const added = {};
  for (const c of commits) {
    for (const f of c.files) {
      const z = zoneOf.get(f.path);
      if (z) added[z] = (added[z] ?? 0) + Math.max(0, f.added);
    }
  }
  const first = isoWeek(new Date(now.getTime() - historyDays * 864e5));
  const last = isoWeek(now);
  const agent = {};
  for (const e of readAgentShares(root, defaultRef)) {
    if (e.week < first || e.week > last) continue;
    agent[e.zone] = (agent[e.zone] ?? 0) + Math.max(0, e.agentLines);
  }
  const out2 = {};
  for (const [z, n] of Object.entries(agent)) if (added[z] > 0) out2[z] = Math.min(1, n / added[z]);
  return out2;
}
function foldReviews(zones, byZone, byPath2, config, committers) {
  const out2 = {};
  for (const [z, people] of Object.entries(byZone)) out2[z] = { ...people };
  const zoneOf = zoneIndex(zones);
  for (const [path, logins] of Object.entries(byPath2)) {
    const z = zoneOf.get(path);
    if (!z) continue;
    for (const [login, n] of Object.entries(logins)) {
      const h = handleFor(login, config);
      if (!Object.hasOwn(config.handles, login) && !committers.has(h)) continue;
      (out2[z] ??= {})[h] = (out2[z][h] ?? 0) + n;
    }
  }
  return out2;
}
function buildMap(root, opts = {}) {
  const now = opts.now ?? /* @__PURE__ */ new Date();
  const config = loadConfig(root);
  const files = readFileEntries(root, listTrackedFiles(root), config.exclude);
  const zones = buildZones(files, config);
  writeZoneCache(root, zones);
  const fileLoc = Object.fromEntries(files.map((f) => [f.path, f.loc]));
  const commits = readHistory(root, config.historyDays, now);
  const notedShas = commitsWithNotes(root, "refs/notes/ai");
  const solo = config.mode === "solo";
  const edits = readEdits(root);
  if (solo) {
    const live = new Set(edits.map((e) => e.session));
    for (const e of backfillSessionEdits(root, opts.homeDir ?? homedir())) if (!live.has(e.session)) edits.push(e);
  }
  const myEmail = currentEmail(root);
  const me = myEmail ? handleFor(myEmail, config) : "me";
  const isMine = (email) => myEmail !== "" && handleFor(email, config) === me;
  const agentLines = agentLinesByCommit(commits, edits, notedShas, { isMine });
  const defaultRef = defaultBranchRef(root);
  let sharedAgentShare = {};
  if (!solo) {
    syncAgentShare(root, zones, commits, agentLinesByCommit(commits, edits, notedShas, { includeTrailersAndNotes: false, isMine }));
    sharedAgentShare = sharedShareByZone(root, zones, commits, now, config.historyDays, defaultRef);
  }
  return scoreMap({
    config,
    now,
    me,
    handleOf: (email) => handleFor(email, config),
    zones,
    commits,
    agentLines,
    sharedAgentShare,
    fileLoc,
    passes: readPasses(root, defaultRef),
    localPartials: readLocalPartials(root),
    fanIn: fanInByZone(root, files, zones, commits),
    reviews: foldReviews(
      zones,
      opts.reviews ?? {},
      opts.reviewsByPath ?? cachedReviews(root, config),
      config,
      new Set(commits.map((c) => handleFor(c.email, config)))
    ),
    flags: readFlags(root)
  });
}

// src/record.ts
import { mkdirSync as mkdirSync7, readFileSync as readFileSync9, writeFileSync as writeFileSync7 } from "node:fs";
import { dirname as dirname3, join as join9 } from "node:path";
var SCORE = { pass: 1, partial: 0.5, miss: 0 };
var DAY2 = 864e5;
function gradeSession(grades) {
  if (grades.length === 0) return "miss";
  const avg = grades.reduce((s, g2) => s + SCORE[g2], 0) / grades.length;
  if (avg >= 0.67 && !grades.includes("miss")) return "pass";
  return avg >= 0.34 ? "partial" : "miss";
}
function handoffSet(root) {
  const isExcluded = excludeMatcher(loadConfig(root).exclude);
  const edits = uncheckedEdits(root).filter((e) => !isExcluded(e.file));
  const cache = readZoneCache(root) ?? {};
  const by = /* @__PURE__ */ new Map();
  for (const e of edits) {
    const dir = dirname3(e.file);
    const id = cache[e.file] ?? (dir === "." ? "(root)" : dir);
    const z = by.get(id) ?? { zone: id, lines: 0, files: [] };
    z.lines += e.lines;
    if (!z.files.includes(e.file)) z.files.push(e.file);
    by.set(id, z);
  }
  return {
    totalLines: edits.reduce((s, e) => s + e.lines, 0),
    zones: [...by.values()].sort((a, b) => b.lines - a.lines),
    edits
  };
}
var lastLearnPath = (root) => join9(umDir(root), "local", "last-learn.json");
function readLastLearn(root) {
  try {
    const v = JSON.parse(readFileSync9(lastLearnPath(root), "utf8"));
    return typeof v.zone === "string" && typeof v.date === "string" ? { zone: v.zone, date: v.date } : null;
  } catch {
    return null;
  }
}
function writeLastLearn(root, zone, date) {
  mkdirSync7(dirname3(lastLearnPath(root)), { recursive: true });
  writeFileSync7(lastLearnPath(root), JSON.stringify({ zone, date }));
}
function clearHandoff(root, edits) {
  if (edits.length) markChecked(root, edits.reduce((m, e) => e.ts > m ? e.ts : m, ""));
}
function recordResult(root, r) {
  const now = r.now ?? /* @__PURE__ */ new Date();
  const date = now.toISOString();
  const opts = { now, homeDir: r.homeDir };
  const result = gradeSession(r.grades);
  const handoff = r.kind === "handoff" ? handoffSet(root) : null;
  const zoneIds = handoff ? handoff.zones.map((z) => z.zone) : r.zones;
  const before = buildMap(root, opts);
  const levelOf = (m, id) => m.zones.find((z) => z.zone.id === id)?.people.find((p) => p.handle === m.me)?.level ?? 0;
  const live = zoneIds.filter((id) => before.zones.some((z) => z.zone.id === id));
  if (handoff) {
    if (result === "pass") {
      for (const id of live) {
        const z = before.zones.find((x) => x.zone.id === id);
        appendPass(root, before.me, { zone: id, level: Math.max(levelOf(before, id), HANDOFF_PASS_LEVEL), fingerprint: z.zone.fingerprint, date, kind: "handoff" });
      }
      for (const id of zoneIds) removeFlag(root, id, "unreviewed-agent-code");
    } else if (result === "miss") {
      for (const id of zoneIds) addFlag(root, id, "unreviewed-agent-code");
    }
    clearHandoff(root, handoff.edits);
  } else {
    for (const id of live) {
      const z = before.zones.find((x) => x.zone.id === id);
      const current = levelOf(before, id);
      if (result === "pass") {
        appendPass(root, before.me, { zone: id, level: Math.max(current, SESSION_PASS_LEVEL), fingerprint: z.zone.fingerprint, date, kind: "session" });
        removeFlag(root, id, "hard-to-verify");
        removeFlag(root, id, "unreviewed-agent-code");
      } else if (result === "partial") {
        appendLocalPartial(root, { zone: id, level: Math.max(current, PARTIAL_LEVEL), fingerprint: z.zone.fingerprint, date, kind: "session" });
        appendAttempt(root, { zone: id, kind: "session", result: "partial", date });
      } else {
        appendAttempt(root, { zone: id, kind: "session", result: "miss", date, retryAfter: new Date(now.getTime() + 3 * DAY2).toISOString() });
      }
    }
  }
  if (!handoff && r.zones[0]) {
    try {
      writeLastLearn(root, r.zones[0], date);
    } catch {
    }
  }
  const after = buildMap(root, opts);
  const changes = live.map((id) => ({
    zone: id,
    before: before.zones.find((z) => z.zone.id === id).state,
    after: after.zones.find((z) => z.zone.id === id)?.state ?? "unknown",
    levelBefore: levelOf(before, id),
    levelAfter: levelOf(after, id)
  }));
  return { result, changes };
}
function skipHandoff(root, _now = /* @__PURE__ */ new Date()) {
  const set = handoffSet(root);
  for (const z of set.zones) addFlag(root, z.zone, "unreviewed-agent-code");
  clearHandoff(root, set.edits);
}
function markUnverifiable(root, zone) {
  addFlag(root, zone, "hard-to-verify");
}

// src/context.ts
var MAX_NEIGHBOURS = 8;
var MAX_FILES = 5;
var MAX_IMPORTS = 10;
var MAX_HINTS = 8;
var HINT_DEPTH = 4;
var MAX_LINE = 200;
function targetPath(root, target, cwd = process.cwd()) {
  let base = cwd;
  try {
    base = realpathSync(base);
  } catch {
  }
  const rel = relative2(root, resolve(base, target)).split("\\").join("/");
  return rel === "" ? target : rel.replace(/^\.\//, "");
}
function resolveTarget(m, root, target, cwd) {
  const byId = m.zones.find((z) => z.zone.id === target);
  if (byId) return { zone: byId, note: "" };
  const path = targetPath(root, target, cwd);
  const file = m.zones.find((z) => z.zone.files.includes(path));
  if (file) return { zone: file, note: "" };
  const dir = path.replace(/\/+$/, "") + "/";
  const counts = m.zones.map((z) => ({ z, n: z.zone.files.filter((f) => f.startsWith(dir)).length })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n || b.z.danger - a.z.danger || (a.z.zone.id < b.z.zone.id ? -1 : 1));
  if (!counts.length) return null;
  const pick = counts[0];
  const note = counts.length > 1 ? `"${target}" spans ${counts.length} zones; picked ${pick.z.zone.id}, which holds the most files under it (${pick.n}).` : "";
  return { zone: pick.z, note };
}
var TEST_PATH = /(^|\/)(tests?|__tests__|specs?|e2e|fixtures?|__mocks__)\/|\.(test|spec)\.[^/]+$|_test\.go$|(^|\/)test_[^/]*\.py$/;
var ENTRY_DIRS = /* @__PURE__ */ new Set([
  "routes",
  "route",
  "router",
  "controllers",
  "controller",
  "handlers",
  "handler",
  "pages",
  "app",
  "api",
  "cli",
  "cmd",
  "bin",
  "server",
  "endpoints",
  "views"
]);
var ENTRY_NAMES = /* @__PURE__ */ new Set(["main", "index", "server", "app", "cli", "routes", "router", "handler", "handlers", "manage", "wsgi", "asgi"]);
var MARKERS = [
  [/\b(?:app|server|fastify|api)\.(?:get|post|put|patch|delete|route|use)\s*\(/, "app.get("],
  [/\brouter\.\w+\s*\(/, "router."],
  [/@(?:Rest)?Controller\b|@(?:Request|Get|Post|Put|Delete|Patch)Mapping\b/, "@Controller"],
  [/@(?:app|router|bp|blueprint)\.(?:route|get|post|put|delete)\b/, "@app.route"],
  [/\bfunc main\s*\(/, "func main("],
  [/if __name__ == ['"]__main__['"]/, "__name__ == '__main__'"],
  [/^#!/, "shebang"]
];
function entryHint(path, source) {
  if (TEST_PATH.test(path)) return null;
  const segs = path.split("/");
  const name = segs[segs.length - 1];
  const inPagesOrApp = segs.slice(0, -1).some((s) => s === "pages" || s === "app");
  if (source !== null) {
    for (const [re, label3] of MARKERS) if (re.test(source)) return `marker: ${label3}`;
    if (inPagesOrApp && /\bexport default (?:async )?function\b/.test(source)) return "marker: export default function";
  }
  const dir = segs.slice(0, -1).find((s) => ENTRY_DIRS.has(s));
  if (dir) return `path: ${dir}/`;
  const stem = name.replace(/\.[^.]+$/, "");
  if (ENTRY_NAMES.has(stem)) return `name: ${name}`;
  return null;
}
function readLines(root, path, cache) {
  if (!cache.has(path)) {
    try {
      cache.set(path, readFileSync10(join10(root, path), "utf8").split("\n"));
    } catch {
      cache.set(path, null);
    }
  }
  return cache.get(path);
}
var byCountThenName = (a, b) => b.n - a.n || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
function neighbours(edges, zoneOf, side, root, lines) {
  const groups = /* @__PURE__ */ new Map();
  for (const e of edges) {
    const file = side === "importer" ? e.fromFile : e.toFile;
    const z = zoneOf.get(file);
    if (!z) continue;
    const g2 = groups.get(z) ?? groups.set(z, /* @__PURE__ */ new Map()).get(z);
    (g2.get(file) ?? g2.set(file, []).get(file)).push(e);
  }
  return [...groups.entries()].map(([zone, files]) => ({ zone, files, n: files.size, key: zone })).sort(byCountThenName).slice(0, MAX_NEIGHBOURS).map(({ zone, files }) => {
    const top = [...files.entries()].map(([f, es]) => ({ f, es, n: es.length, key: f })).sort(byCountThenName).slice(0, MAX_FILES);
    const imports = top.flatMap((t) => t.es).sort((a, b) => a.fromFile < b.fromFile ? -1 : a.fromFile > b.fromFile ? 1 : a.line - b.line).slice(0, MAX_IMPORTS).map((e) => ({
      from: e.fromFile,
      line: e.line,
      to: e.toFile,
      text: (readLines(root, e.fromFile, lines)?.[e.line - 1] ?? "").trim().slice(0, MAX_LINE)
    }));
    return { zone, files: top.map((t) => t.f).sort(), fileCount: files.size, imports };
  });
}
function entryHints(root, zoneFiles, edges, lines) {
  const importersOf = /* @__PURE__ */ new Map();
  for (const e of edges) (importersOf.get(e.toFile) ?? importersOf.set(e.toFile, []).get(e.toFile)).push(e.fromFile);
  const depth = new Map(zoneFiles.map((f) => [f, 0]));
  let frontier = [...zoneFiles];
  for (let d = 1; d <= HINT_DEPTH && frontier.length; d++) {
    const next = [];
    for (const f of frontier) {
      for (const imp of importersOf.get(f) ?? []) {
        if (depth.has(imp)) continue;
        depth.set(imp, d);
        next.push(imp);
      }
    }
    frontier = next;
  }
  const hints = [];
  for (const [file, d] of depth) {
    const why = entryHint(file, readLines(root, file, lines)?.join("\n") ?? null);
    if (why) hints.push({ file, depth: d, why });
  }
  return hints.sort((a, b) => a.depth - b.depth || (a.file < b.file ? -1 : 1)).slice(0, MAX_HINTS);
}
function zoneContext(root, m, z, picked) {
  const zoneOf = zoneIndex(m.zones.map((r) => r.zone));
  const edges = importEdges(root, [...zoneOf.keys()]);
  const mine = new Set(z.zone.files);
  const inEdges = edges.filter((e) => mine.has(e.toFile) && !mine.has(e.fromFile));
  const outEdges = edges.filter((e) => mine.has(e.fromFile) && !mine.has(e.toFile));
  const lines = /* @__PURE__ */ new Map();
  return {
    zone: { id: z.zone.id, files: z.zone.files, state: z.state, reason: z.reason, loc: z.zone.loc, fanIn: z.criticality.fanIn },
    picked,
    inbound: neighbours(inEdges, zoneOf, "importer", root, lines),
    outbound: neighbours(outEdges, zoneOf, "imported", root, lines),
    entryHints: entryHints(root, z.zone.files, edges, lines),
    fingerprint: z.zone.fingerprint
  };
}
function pickZone(m, root, target, cwd) {
  if (target) {
    const r = resolveTarget(m, root, target, cwd);
    return r ? { zone: r.zone, picked: { by: "argument", note: r.note || r.zone.reason } } : { zone: null, why: `No zone found for "${target}".` };
  }
  const last = readLastLearn(root);
  const lastZone = last && m.zones.find((z) => z.zone.id === last.zone);
  if (lastZone) return { zone: lastZone, picked: { by: "last-learn", note: `the zone of your last learning session \xB7 ${lastZone.reason}` } };
  const top = m.top[0] ?? m.unclearCritical[0];
  if (top) return { zone: top, picked: { by: "top-danger", note: top.reason } };
  return { zone: null, why: "Nothing stands out: no zone is both critical and poorly understood. Name a zone or path." };
}

// src/hooks.ts
import { realpathSync as realpathSync2 } from "node:fs";
import { dirname as dirname4, basename, isAbsolute, join as join11, relative as relative3, resolve as resolve2 } from "node:path";
var isObj2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function lineCount(s) {
  if (typeof s !== "string" || s === "") return 0;
  const n = s.split("\n").length;
  return s.endsWith("\n") ? n - 1 : n;
}
function repoRelative(root, file, cwd) {
  const abs = isAbsolute(file) ? file : resolve2(cwd, file);
  const attempt = (p) => {
    const rel = relative3(root, p);
    return rel === "" || rel.startsWith("..") || isAbsolute(rel) ? null : rel.split("\\").join("/");
  };
  const direct = attempt(abs);
  if (direct) return direct;
  try {
    return attempt(join11(realpathSync2(dirname4(abs)), basename(abs)));
  } catch {
    return null;
  }
}
function rangesOf(response, input, tool) {
  const patch = isObj2(response) && Array.isArray(response.structuredPatch) ? response.structuredPatch : null;
  if (patch && patch.length > 0) {
    const ranges = [];
    let lines2 = 0;
    for (const h of patch) {
      if (!isObj2(h) || typeof h.newStart !== "number") continue;
      if (Array.isArray(h.lines)) {
        let n = h.newStart;
        let runStart = -1;
        const close = () => {
          if (runStart >= 0) ranges.push([runStart, n - 1]);
          runStart = -1;
        };
        for (const l of h.lines) {
          const c = typeof l === "string" ? l[0] : "";
          if (c === "+") {
            if (runStart < 0) runStart = n;
            n++;
            lines2++;
          } else if (c === "-") {
            close();
          } else {
            close();
            n++;
          }
        }
        close();
      } else if (typeof h.newLines === "number" && h.newLines > 0) {
        ranges.push([h.newStart, h.newStart + h.newLines - 1]);
        lines2 += h.newLines;
      }
    }
    if (ranges.length > 0) return { ranges, lines: lines2 };
  }
  let lines = 0;
  if (tool === "Write") lines = lineCount(input.content);
  else if (tool === "MultiEdit" && Array.isArray(input.edits)) {
    for (const e of input.edits) if (isObj2(e)) lines += lineCount(e.new_string);
  } else if (tool === "NotebookEdit") lines = lineCount(input.new_source);
  else lines = lineCount(input.new_string);
  return { ranges: lines > 0 ? [[1, lines]] : [], lines };
}
function onPostToolUse(input) {
  try {
    if (!isObj2(input) || !isObj2(input.tool_input)) return;
    const ti = input.tool_input;
    const file = typeof ti.file_path === "string" ? ti.file_path : typeof ti.notebook_path === "string" ? ti.notebook_path : null;
    if (!file) return;
    const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
    const root = repoRootOf(cwd);
    if (!root || !isSetUp(root)) return;
    const rel = repoRelative(root, file, cwd);
    if (!rel || excludeMatcher(loadConfig(root).exclude)(rel)) return;
    const { ranges, lines } = rangesOf(input.tool_response, ti, input.tool_name);
    appendEdit(root, {
      file: rel,
      ranges,
      lines,
      session: typeof input.session_id === "string" ? input.session_id : "",
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch {
  }
}
function onStop(input) {
  try {
    if (!isObj2(input)) return null;
    const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
    const root = repoRootOf(cwd);
    if (!root || !isSetUp(root)) return null;
    const { handoff, exclude } = loadConfig(root);
    if (!handoff.enabled) return null;
    const isExcluded = excludeMatcher(exclude);
    const edits = uncheckedEdits(root).filter((e) => !isExcluded(e.file));
    const unchecked = edits.reduce((n, e) => n + e.lines, 0);
    if (unchecked - getNudgedLines(root) < handoff.minLines) return null;
    const cache = readZoneCache(root);
    const zones = new Set(edits.map((e) => cache?.[e.file] ?? dirname4(e.file)));
    setNudgedLines(root, unchecked);
    return JSON.stringify({
      systemMessage: `Agents changed ~${unchecked} lines in ${zones.size} zones since your last check. Run /understanding-map:handoff for a 60-second check.`
    });
  } catch {
    return null;
  }
}

// src/report.ts
import { mkdirSync as mkdirSync8, writeFileSync as writeFileSync8 } from "node:fs";
import { join as join12 } from "node:path";

// node_modules/d3-hierarchy/dist/d3-hierarchy.mjs
function count(node) {
  var sum2 = 0, children = node.children, i = children && children.length;
  if (!i) sum2 = 1;
  else while (--i >= 0) sum2 += children[i].value;
  node.value = sum2;
}
function node_count() {
  return this.eachAfter(count);
}
function node_each(callback, that) {
  let index2 = -1;
  for (const node of this) {
    callback.call(that, node, ++index2, this);
  }
  return this;
}
function node_eachBefore(callback, that) {
  var node = this, nodes = [node], children, i, index2 = -1;
  while (node = nodes.pop()) {
    callback.call(that, node, ++index2, this);
    if (children = node.children) {
      for (i = children.length - 1; i >= 0; --i) {
        nodes.push(children[i]);
      }
    }
  }
  return this;
}
function node_eachAfter(callback, that) {
  var node = this, nodes = [node], next = [], children, i, n, index2 = -1;
  while (node = nodes.pop()) {
    next.push(node);
    if (children = node.children) {
      for (i = 0, n = children.length; i < n; ++i) {
        nodes.push(children[i]);
      }
    }
  }
  while (node = next.pop()) {
    callback.call(that, node, ++index2, this);
  }
  return this;
}
function node_find(callback, that) {
  let index2 = -1;
  for (const node of this) {
    if (callback.call(that, node, ++index2, this)) {
      return node;
    }
  }
}
function node_sum(value) {
  return this.eachAfter(function(node) {
    var sum2 = +value(node.data) || 0, children = node.children, i = children && children.length;
    while (--i >= 0) sum2 += children[i].value;
    node.value = sum2;
  });
}
function node_sort(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}
function node_path(end) {
  var start = this, ancestor = leastCommonAncestor(start, end), nodes = [start];
  while (start !== ancestor) {
    start = start.parent;
    nodes.push(start);
  }
  var k = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k, 0, end);
    end = end.parent;
  }
  return nodes;
}
function leastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = a.ancestors(), bNodes = b.ancestors(), c = null;
  a = aNodes.pop();
  b = bNodes.pop();
  while (a === b) {
    c = a;
    a = aNodes.pop();
    b = bNodes.pop();
  }
  return c;
}
function node_ancestors() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
}
function node_descendants() {
  return Array.from(this);
}
function node_leaves() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}
function node_links() {
  var root = this, links = [];
  root.each(function(node) {
    if (node !== root) {
      links.push({ source: node.parent, target: node });
    }
  });
  return links;
}
function* node_iterator() {
  var node = this, current, next = [node], children, i, n;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      yield node;
      if (children = node.children) {
        for (i = 0, n = children.length; i < n; ++i) {
          next.push(children[i]);
        }
      }
    }
  } while (next.length);
}
function hierarchy(data, children) {
  if (data instanceof Map) {
    data = [void 0, data];
    if (children === void 0) children = mapChildren;
  } else if (children === void 0) {
    children = objectChildren;
  }
  var root = new Node$1(data), node, nodes = [root], child, childs, i, n;
  while (node = nodes.pop()) {
    if ((childs = children(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs;
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = childs[i] = new Node$1(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }
  return root.eachBefore(computeHeight);
}
function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}
function objectChildren(d) {
  return d.children;
}
function mapChildren(d) {
  return Array.isArray(d) ? d[1] : null;
}
function copyData(node) {
  if (node.data.value !== void 0) node.value = node.data.value;
  node.data = node.data.data;
}
function computeHeight(node) {
  var height = 0;
  do
    node.height = height;
  while ((node = node.parent) && node.height < ++height);
}
function Node$1(data) {
  this.data = data;
  this.depth = this.height = 0;
  this.parent = null;
}
Node$1.prototype = hierarchy.prototype = {
  constructor: Node$1,
  count: node_count,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  find: node_find,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy,
  [Symbol.iterator]: node_iterator
};
function required(f) {
  if (typeof f !== "function") throw new Error();
  return f;
}
function constantZero() {
  return 0;
}
function constant(x) {
  return function() {
    return x;
  };
}
function roundNode(node) {
  node.x0 = Math.round(node.x0);
  node.y0 = Math.round(node.y0);
  node.x1 = Math.round(node.x1);
  node.y1 = Math.round(node.y1);
}
function treemapDice(parent, x0, y0, x1, y1) {
  var nodes = parent.children, node, i = -1, n = nodes.length, k = parent.value && (x1 - x0) / parent.value;
  while (++i < n) {
    node = nodes[i], node.y0 = y0, node.y1 = y1;
    node.x0 = x0, node.x1 = x0 += node.value * k;
  }
}
function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null;
  this.a = this;
  this.z = 0;
  this.m = 0;
  this.c = 0;
  this.s = 0;
  this.t = null;
  this.i = i;
}
TreeNode.prototype = Object.create(Node$1.prototype);
function treemapSlice(parent, x0, y0, x1, y1) {
  var nodes = parent.children, node, i = -1, n = nodes.length, k = parent.value && (y1 - y0) / parent.value;
  while (++i < n) {
    node = nodes[i], node.x0 = x0, node.x1 = x1;
    node.y0 = y0, node.y1 = y0 += node.value * k;
  }
}
var phi = (1 + Math.sqrt(5)) / 2;
function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  var rows = [], nodes = parent.children, row, nodeValue, i0 = 0, i1 = 0, n = nodes.length, dx, dy, value = parent.value, sumValue, minValue, maxValue, newRatio, minRatio, alpha, beta;
  while (i0 < n) {
    dx = x1 - x0, dy = y1 - y0;
    do
      sumValue = nodes[i1++].value;
    while (!sumValue && i1 < n);
    minValue = maxValue = sumValue;
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
    beta = sumValue * sumValue * alpha;
    minRatio = Math.max(maxValue / beta, beta / minValue);
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) {
        sumValue -= nodeValue;
        break;
      }
      minRatio = newRatio;
    }
    rows.push(row = { value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1) });
    if (row.dice) treemapDice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1);
    else treemapSlice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
    value -= sumValue, i0 = i1;
  }
  return rows;
}
var squarify = function custom(ratio) {
  function squarify2(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1);
  }
  squarify2.ratio = function(x) {
    return custom((x = +x) > 1 ? x : 1);
  };
  return squarify2;
}(phi);
function index() {
  var tile = squarify, round = false, dx = 1, dy = 1, paddingStack = [0], paddingInner = constantZero, paddingTop = constantZero, paddingRight = constantZero, paddingBottom = constantZero, paddingLeft = constantZero;
  function treemap(root) {
    root.x0 = root.y0 = 0;
    root.x1 = dx;
    root.y1 = dy;
    root.eachBefore(positionNode);
    paddingStack = [0];
    if (round) root.eachBefore(roundNode);
    return root;
  }
  function positionNode(node) {
    var p = paddingStack[node.depth], x0 = node.x0 + p, y0 = node.y0 + p, x1 = node.x1 - p, y1 = node.y1 - p;
    if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
    if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
    node.x0 = x0;
    node.y0 = y0;
    node.x1 = x1;
    node.y1 = y1;
    if (node.children) {
      p = paddingStack[node.depth + 1] = paddingInner(node) / 2;
      x0 += paddingLeft(node) - p;
      y0 += paddingTop(node) - p;
      x1 -= paddingRight(node) - p;
      y1 -= paddingBottom(node) - p;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      tile(node, x0, y0, x1, y1);
    }
  }
  treemap.round = function(x) {
    return arguments.length ? (round = !!x, treemap) : round;
  };
  treemap.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], treemap) : [dx, dy];
  };
  treemap.tile = function(x) {
    return arguments.length ? (tile = required(x), treemap) : tile;
  };
  treemap.padding = function(x) {
    return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner();
  };
  treemap.paddingInner = function(x) {
    return arguments.length ? (paddingInner = typeof x === "function" ? x : constant(+x), treemap) : paddingInner;
  };
  treemap.paddingOuter = function(x) {
    return arguments.length ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x) : treemap.paddingTop();
  };
  treemap.paddingTop = function(x) {
    return arguments.length ? (paddingTop = typeof x === "function" ? x : constant(+x), treemap) : paddingTop;
  };
  treemap.paddingRight = function(x) {
    return arguments.length ? (paddingRight = typeof x === "function" ? x : constant(+x), treemap) : paddingRight;
  };
  treemap.paddingBottom = function(x) {
    return arguments.length ? (paddingBottom = typeof x === "function" ? x : constant(+x), treemap) : paddingBottom;
  };
  treemap.paddingLeft = function(x) {
    return arguments.length ? (paddingLeft = typeof x === "function" ? x : constant(+x), treemap) : paddingLeft;
  };
  return treemap;
}
var resquarify = function custom2(ratio) {
  function resquarify2(parent, x0, y0, x1, y1) {
    if ((rows = parent._squarify) && rows.ratio === ratio) {
      var rows, row, nodes, i, j = -1, n, m = rows.length, value = parent.value;
      while (++j < m) {
        row = rows[j], nodes = row.children;
        for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value;
        if (row.dice) treemapDice(row, x0, y0, x1, value ? y0 += (y1 - y0) * row.value / value : y1);
        else treemapSlice(row, x0, y0, value ? x0 += (x1 - x0) * row.value / value : x1, y1);
        value -= row.value;
      }
    } else {
      parent._squarify = rows = squarifyRatio(ratio, parent, x0, y0, x1, y1);
      rows.ratio = ratio;
    }
  }
  resquarify2.ratio = function(x) {
    return custom2((x = +x) > 1 ? x : 1);
  };
  return resquarify2;
}(phi);

// src/html.ts
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
var safeJson = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

// src/report-template.ts
function howEstimatesWork(mode, s) {
  const pct2 = (f) => `${Math.round(f * 100)}%`;
  const states = mode === "team" ? `Owned: 2 or more active people at ${s.threshold} or more. Fragile: exactly one. Fading: nobody active at ${s.threshold}, but someone active at ${s.fadingFloor} or more. Dark: nobody active at ${s.fadingFloor} or more, and at least ${pct2(DARK_AGENT_SHARE)} of the zone is agent-written or everyone with evidence here is inactive. Unknown: not enough evidence either way. Active means a commit or a pass in this repository in the last ${s.activeDays} days.` : `Owned: your level is ${s.threshold} or more. Fading: ${s.fadingFloor} or more. Dark: there is evidence, but your level is below ${s.fadingFloor}. Unknown: no evidence yet.`;
  const darkness = (mode === "team" ? ["dark", "fading", "fragile", "owned"] : ["dark", "fading", "owned"]).map((k) => `${k[0].toUpperCase()}${k.slice(1)} ${DARKNESS[k]}`).join(", ");
  const items = [
    `<strong>Commits.</strong> Anyone who committed to a zone starts at ${HUMAN_BASE}, plus up to +${HUMAN_SHARE_MAX} for authorship (${HUMAN_SHARE_MULT} \xD7 the lines they added \xF7 the zone's lines of code), minus ${AGENT_PENALTY} \xD7 the fraction of their lines written by agents.`,
    `<strong>Code changed since.</strong> That level is multiplied by 1 \u2212 (lines others added after their last commit \xF7 the zone's lines of code).`,
    `<strong>Time.</strong> Evidence counts for less as it ages: it halves every ${s.halfLifeDays} days.`,
    `<strong>Sessions and handoff checks.</strong> A passed learning session sets your level to max(current, ${SESSION_PASS_LEVEL}); a passed handoff check sets each touched zone to max(current, ${HANDOFF_PASS_LEVEL}); a partly passed session sets max(current, ${PARTIAL_LEVEL}) and stays on your machine. These decay with the share of the zone's files changed since, and with time.`,
    `<strong>Reviews.</strong> With the optional PR review signal on, each substantive review comment adds +${REVIEW_PER}, up to +${REVIEW_MAX}.`,
    `A person's level is the highest of these, from 0 to 100.`,
    `<strong>States.</strong> ${states}`,
    `<strong>Ranking.</strong> Danger = darkness \xD7 criticality. Darkness: ${darkness}; Unknown zones are not ranked. Criticality adds percentile ranks of fan-in (\xD7 ${CRIT.fanIn}), commits in the last ${RECENT_DAYS} days (\xD7 ${CRIT.churn}), lines of code (\xD7 ${CRIT.loc}) and fixes in the last ${RECENT_DAYS} days (\xD7 ${CRIT.fixes}), plus ${CRIT.tagged} for zones tagged critical.`
  ];
  return `<ul class="method">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}
var THEME_CSS = String.raw`:root {
  --bg: #f7f6f2; --surface: #ffffff; --text: #1f2328; --muted: #5c6470; --border: #dcdad2;
  --owned: #2f9e5b; --fragile: #e0a21a; --fading: #f2d38a; --dark: #a11d2b; --unknown: #9aa0a8;
  --on-owned: #ffffff; --on-fragile: #1f2328; --on-fading: #1f2328; --on-dark: #ffffff; --on-unknown: #1f2328;
  --accent: #1f5fbf;
  --font: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14161a; --surface: #1c1f25; --text: #e6e8eb; --muted: #9aa3ad; --border: #333842;
    --owned: #3fb673; --fragile: #d19a1c; --fading: #8a7442; --dark: #c0392f; --unknown: #5b616b;
    --on-owned: #0c1a12; --on-fragile: #1a1405; --on-fading: #f3ecd9; --on-dark: #ffffff; --on-unknown: #eceef1;
    --accent: #6ea8ff;
  }
}
`;
var REPORT_TEMPLATE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Understanding Map</title>
<style>
${THEME_CSS}* { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 var(--font); }
main { max-width: 1100px; margin: 0 auto; padding: 16px; }
h1 { font-size: 1.4rem; margin: 0 0 4px; }
h2 { font-size: 1.05rem; margin: 28px 0 10px; }
.meta, .note { color: var(--muted); font-size: 0.88rem; margin: 2px 0; }
.counts { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 6px; padding: 0; list-style: none; }
.counts li { display: flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 3px 12px; font-size: 0.88rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.s-owned { background: var(--owned); color: var(--on-owned); }
.s-fragile { background: var(--fragile); color: var(--on-fragile); }
.s-fading { background: var(--fading); color: var(--on-fading); }
.s-dark { background: var(--dark); color: var(--on-dark); }
.s-unknown { background: var(--unknown); color: var(--on-unknown); }
.treemap { position: relative; width: 100%; padding-bottom: 60%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.tile { position: absolute; overflow: hidden; border: 1px solid var(--bg); padding: 4px 6px; font-size: 0.78rem; line-height: 1.2; cursor: pointer; word-break: break-all; }
.tile:hover, .tile:focus-visible, .tile.sel { outline: 3px solid var(--accent); outline-offset: -3px; z-index: 1; }
.table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
table { border-collapse: collapse; width: 100%; min-width: 520px; font-size: 0.88rem; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { color: var(--muted); font-weight: 600; white-space: nowrap; }
tbody tr { cursor: pointer; }
tbody tr:hover, tbody tr.sel { background: color-mix(in srgb, var(--accent) 12%, transparent); }
.badge { display: inline-block; border-radius: 4px; padding: 1px 8px; font-size: 0.8rem; }
.zid { font-family: var(--mono); word-break: break-all; }
#panel { margin-top: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; }
#panel h3 { margin: 0 0 6px; font-size: 1.05rem; font-family: var(--mono); word-break: break-all; }
#panel h4 { margin: 14px 0 4px; font-size: 0.9rem; color: var(--muted); }
#panel ul { margin: 0; padding-left: 20px; }
.cmd { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 14px; }
.cmd a { color: var(--accent); font-weight: 600; }
.cmd code { font-family: var(--mono); background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 4px 8px; word-break: break-all; }
.method { padding-left: 20px; color: var(--muted); font-size: 0.88rem; }
.method li { margin: 4px 0; }
.method strong { color: var(--text); }
button { font: inherit; background: var(--accent); color: var(--bg); border: 0; border-radius: 6px; padding: 4px 12px; cursor: pointer; }
</style>
</head>
<body>
<main>
<header>
<h1>Understanding Map</h1>
__HEADER__
</header>
<h2>Map</h2>
<p class="note">Tile area is lines of code; colour is the understanding state. Click a tile for its evidence.</p>
<div class="treemap" id="treemap">__TREEMAP__</div>
<h2>Ranked zones</h2>
<div class="table-wrap">
<table>
<thead><tr><th>Zone</th><th>State</th><th>Lines</th><th>Why it matters</th></tr></thead>
<tbody>__TABLE__</tbody>
</table>
</div>
<section id="panel" aria-live="polite"><p class="note">Select a zone to see its evidence.</p></section>
<section>
<h2>How estimates work</h2>
__METHOD__
</section>
</main>
<script type="application/json" id="data">__DATA__</script>
<script>
(function () {
  var data = JSON.parse(document.getElementById('data').textContent);
  var panel = document.getElementById('panel');
  var byId = {};
  data.zones.forEach(function (z) { byId[z.id] = z; });
  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function list(items) {
    var ul = el('ul');
    items.forEach(function (t) { ul.appendChild(el('li', t)); });
    return ul;
  }
  function show(id) {
    var z = byId[id];
    if (!z) return;
    document.querySelectorAll('.sel').forEach(function (n) { n.classList.remove('sel'); });
    document.querySelectorAll('[data-id]').forEach(function (n) { if (n.getAttribute('data-id') === id) n.classList.add('sel'); });
    panel.textContent = '';
    panel.appendChild(el('h3', z.id));
    var st = el('span', z.state, 'badge s-' + z.state);
    panel.appendChild(st);
    panel.appendChild(el('p', z.reason));
    panel.appendChild(el('h4', 'Evidence (an estimate)'));
    var ev = [];
    z.people.forEach(function (p) {
      p.evidence.forEach(function (e) { ev.push((data.mode === 'team' ? p.handle + ': ' : '') + e.text); });
    });
    panel.appendChild(ev.length ? list(ev) : el('p', 'No evidence yet.', 'note'));
    if (data.mode === 'team') {
      panel.appendChild(el('h4', 'Understood by'));
      panel.appendChild(z.understoodBy.length ? list(z.understoodBy) : el('p', 'Nobody active reaches ' + data.threshold + '.', 'note'));
      if (z.leftInactive.length) {
        panel.appendChild(el('h4', 'Left / inactive (not counted)'));
        panel.appendChild(list(z.leftInactive));
      }
    }
    if (z.flags.length) {
      panel.appendChild(el('h4', 'Flags'));
      panel.appendChild(list(z.flags));
    }
    if (z.agentShare > 0) panel.appendChild(el('p', 'About ' + Math.max(1, Math.round(z.agentShare * 100)) + '% of this zone was written by agents.', 'note'));
    panel.appendChild(cmdRow('/understanding-map:learn ' + z.id));
    var vis = cmdRow('/understanding-map:visualize ' + z.id);
    if (z.visual) {
      var a = el('a', 'Open animation');
      a.href = z.visual;
      vis.appendChild(a);
    }
    panel.appendChild(vis);
  }
  function cmdRow(cmd) {
    var row = el('div', undefined, 'cmd');
    row.appendChild(el('code', cmd));
    var btn = el('button', 'Copy');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      try { navigator.clipboard.writeText(cmd).then(function () { btn.textContent = 'Copied'; }, function () { btn.textContent = 'Copy failed'; }); }
      catch (e) { btn.textContent = 'Copy failed'; }
    });
    row.appendChild(btn);
    return row;
  }
  document.querySelectorAll('[data-id]').forEach(function (n) {
    n.addEventListener('click', function () { show(n.getAttribute('data-id')); });
    n.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); show(n.getAttribute('data-id')); } });
  });
})();
</script>
</body>
</html>
`;

// src/report.ts
var label = (s) => s[0].toUpperCase() + s.slice(1);
function buildTree(zones) {
  const root = { name: "", children: [] };
  for (const z of zones) {
    let cur = root;
    for (const seg of z.zone.id.split("/").filter(Boolean)) {
      cur.children ??= [];
      let next = cur.children.find((c) => c.name === seg && !c.zone);
      if (!next) {
        next = { name: seg };
        cur.children.push(next);
      }
      cur = next;
    }
    if (cur.children?.length) cur.children.push({ name: cur.name, zone: z });
    else cur.zone = z;
  }
  return root;
}
function renderTreemap(zones) {
  if (!zones.length) return "";
  const root = hierarchy(buildTree(zones)).sum((n) => n.zone ? Math.max(n.zone.zone.loc, 1) : 0);
  const laid = index().size([100, 100]).tile(squarify).paddingInner(0.2)(root);
  return laid.leaves().map((l) => {
    const z = l.data.zone;
    const w = l.x1 - l.x0;
    const h = l.y1 - l.y0;
    const text3 = w >= 9 && h >= 7 ? esc(z.zone.id) : "";
    const title = esc(`${z.zone.id} \u2014 ${label(z.state)} \xB7 ${z.zone.loc} lines`);
    const pos = `left:${l.x0.toFixed(3)}%;top:${l.y0.toFixed(3)}%;width:${w.toFixed(3)}%;height:${h.toFixed(3)}%`;
    return `<div class="tile s-${z.state}" role="button" tabindex="0" data-id="${esc(z.zone.id)}" title="${title}" style="${pos}">${text3}</div>`;
  }).join("\n");
}
function renderTable(zones) {
  return [...zones].sort((a, b) => b.danger - a.danger || a.zone.id.localeCompare(b.zone.id)).map((z) => `<tr data-id="${esc(z.zone.id)}" tabindex="0"><td class="zid">${esc(z.zone.id)}</td><td><span class="badge s-${z.state}">${label(z.state)}</span></td><td>${z.zone.loc}</td><td>${esc(z.reason)}</td></tr>`).join("\n");
}
function renderHeader(m) {
  const c = m.counts;
  const states = m.mode === "team" ? ["owned", "fragile", "fading", "dark", "unknown"] : ["owned", "fading", "dark", "unknown"];
  const chips = states.map((s) => `<li><span class="dot s-${s}"></span>${label(s)} ${c[s]}</li>`).join("");
  return `<p class="meta">${esc(m.mode)} mode \xB7 generated ${esc(m.generatedAt)} \xB7 ${m.zones.length} zones</p>
<ul class="counts">${chips}</ul>
<p class="note">Scores are estimates from git history and sessions \u2014 each one lists its evidence.</p>`;
}
var VISUAL_HREF = /^local\/visuals\/[a-z0-9-]+\.html$/;
function reportData(m, threshold, visuals) {
  const team = m.mode === "team";
  return {
    mode: m.mode,
    generatedAt: m.generatedAt,
    threshold,
    zones: m.zones.map((z) => {
      const listed = team ? z.people : z.people.filter((p) => p.handle === m.me);
      return {
        id: z.zone.id,
        state: z.state,
        loc: z.zone.loc,
        agentShare: z.agentShare,
        criticality: z.criticality,
        danger: z.danger,
        reason: z.reason,
        flags: z.flags,
        people: listed.map((p) => ({ handle: p.handle, level: p.level, active: p.active, evidence: p.evidence })),
        understoodBy: team ? z.people.filter((p) => p.active && p.level >= threshold).map((p) => p.handle) : [],
        leftInactive: team ? z.people.filter((p) => !p.active).map((p) => p.handle) : [],
        visual: Object.hasOwn(visuals, z.zone.id) && VISUAL_HREF.test(visuals[z.zone.id]) ? visuals[z.zone.id] : null
      };
    })
  };
}
function renderReport(m, opts = {}) {
  const settings = {
    threshold: opts.threshold ?? DEFAULT_CONFIG.threshold,
    fadingFloor: opts.fadingFloor ?? DEFAULT_CONFIG.fadingFloor,
    halfLifeDays: opts.halfLifeDays ?? DEFAULT_CONFIG.halfLifeDays,
    activeDays: opts.activeDays ?? DEFAULT_CONFIG.activeDays
  };
  const fill = {
    __HEADER__: renderHeader(m),
    __TREEMAP__: renderTreemap(m.zones),
    __TABLE__: renderTable(m.zones),
    __DATA__: safeJson(reportData(m, settings.threshold, opts.visuals ?? {})),
    __METHOD__: howEstimatesWork(m.mode, settings)
  };
  return REPORT_TEMPLATE.replace(/__(HEADER|TREEMAP|TABLE|DATA|METHOD)__/g, (k) => fill[k]);
}
function writeReport(root, html) {
  const dir = join12(root, ".understanding");
  mkdirSync8(dir, { recursive: true });
  const path = join12(dir, "report.html");
  writeFileSync8(path, html);
  return path;
}

// src/setup.ts
import { existsSync as existsSync3, mkdirSync as mkdirSync9, readFileSync as readFileSync11, writeFileSync as writeFileSync9 } from "node:fs";
import { join as join13 } from "node:path";
var TEAM_ATTRIBUTES = [
  ".understanding/events/*.jsonl merge=union",
  ".understanding/agent-share/*.jsonl merge=union"
];
function runSetup(root, opts) {
  const dir = umDir(root);
  mkdirSync9(dir, { recursive: true });
  const configPath2 = join13(dir, "config.json");
  let existing = {};
  if (existsSync3(configPath2)) {
    try {
      const raw = JSON.parse(readFileSync11(configPath2, "utf8"));
      if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) existing = raw;
    } catch {
    }
  }
  const kept = Array.isArray(existing.critical) && existing.critical.every((g2) => typeof g2 === "string") ? existing.critical : [];
  const critical = opts.critical ?? kept;
  writeFileSync9(configPath2, JSON.stringify({ ...existing, mode: opts.mode, critical }, null, 2) + "\n");
  const ignore = opts.mode === "team" ? TEAM_IGNORE : SOLO_IGNORE;
  const gitignoreLines = ignore.trimEnd().split("\n");
  writeFileSync9(join13(dir, ".gitignore"), ignore);
  const gitattributesLines = [];
  if (opts.mode === "team") {
    const attrPath = join13(root, ".gitattributes");
    const current = existsSync3(attrPath) ? readFileSync11(attrPath, "utf8") : "";
    const have = new Set(current.split(/\r?\n/).map((l) => l.trim()));
    gitattributesLines.push(...TEAM_ATTRIBUTES.filter((l) => !have.has(l)));
    if (gitattributesLines.length > 0) {
      const sep3 = current === "" || current.endsWith("\n") ? "" : "\n";
      writeFileSync9(attrPath, current + sep3 + gitattributesLines.join("\n") + "\n");
    }
  }
  machineId(root);
  return { configPath: configPath2, critical, gitignoreLines, gitattributesLines };
}

// src/storyboard.ts
import { readFileSync as readFileSync12, realpathSync as realpathSync3, statSync as statSync2 } from "node:fs";
import { join as join14, sep as sep2 } from "node:path";
var LABEL_MAX = 40;
var ROLE_MAX = 90;
var JOURNEY_MIN = 2;
var JOURNEY_MAX = 6;
var STEPS_MIN = 3;
var STEPS_MAX = 7;
var StoryboardError = class extends Error {
  constructor(field, message) {
    super(`${field}: ${message}`);
    this.field = field;
    this.name = "StoryboardError";
  }
};
var fail = (field, message) => {
  throw new StoryboardError(field, message);
};
var isObj3 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var chars = (s) => [...s].length;
var CONTROL = /[\u0000-\u001f\u007f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;
var MENTION = /@[A-Za-z0-9_]/;
var escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function text(v, field, max, ctx) {
  if (typeof v !== "string") return fail(field, "must be a string");
  const s = v.trim();
  if (!s) return fail(field, "must not be empty");
  if (CONTROL.test(s)) return fail(field, "must be one line of plain text");
  if (chars(s) > max) return fail(field, `is ${chars(s)} characters; the limit is ${max}`);
  if (MENTION.test(s)) return fail(field, "must not name people (no @mentions or email addresses)");
  for (const h of ctx.people ?? []) {
    if (h.length >= 3 && new RegExp(`(^|[^a-z0-9])${escapeRe(h.toLowerCase())}($|[^a-z0-9])`).test(s.toLowerCase())) {
      return fail(field, "must not name people (it contains a handle from the map)");
    }
  }
  return s;
}
function parseRef(ref2) {
  const m = /^(.+):([1-9]\d*)$/.exec(ref2);
  if (!m) return null;
  const path = m[1].replace(/^\.\//, "");
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path) || path.includes("\\")) return null;
  if (path.split("/").some((s) => s === ".." || s === "." || s === "")) return null;
  return { path, line: Number(m[2]) };
}
function ref(v, field, ctx, within) {
  if (typeof v !== "string") return fail(field, 'must be a "path:line" string');
  const r = parseRef(v.trim());
  if (!r) return fail(field, `"${v}" must be "path:line" with a repository-relative path and a line from 1`);
  const n = ctx.lineCount(r.path);
  if (n === null) return fail(field, `${r.path} is not a file on the map (tracked and not excluded)`);
  if (r.line > n) return fail(field, `line ${r.line} is past the end of ${r.path} (${n} lines)`);
  if (within && !within.files.includes(r.path)) return fail(field, `${r.path} is not in zone ${within.zone}`);
  return `${r.path}:${r.line}`;
}
function optional(v, field) {
  if (v === void 0 || v === null) return null;
  return isObj3(v) ? v : fail(field, "must be an object or null");
}
function journey(v, ctx) {
  if (v === void 0 || v === null) return null;
  if (!Array.isArray(v) || v.length < JOURNEY_MIN || v.length > JOURNEY_MAX) {
    return fail("journey", `must have ${JOURNEY_MIN}\u2013${JOURNEY_MAX} stops (or be left out)`);
  }
  const targets = v.filter((s) => isObj3(s) && s.target === true).length;
  if (targets !== 1) return fail("journey", `needs exactly one stop with "target": true (found ${targets})`);
  return v.map((s, i) => {
    const f = `journey[${i}]`;
    if (!isObj3(s)) return fail(f, "must be an object");
    if (s.target !== void 0 && typeof s.target !== "boolean") fail(`${f}.target`, "must be true or false");
    const target = s.target === true;
    const label3 = text(s.label, `${f}.label`, LABEL_MAX, ctx);
    if (typeof s.zone !== "string" || !Object.hasOwn(ctx.zones, s.zone)) {
      return fail(`${f}.zone`, `"${String(s.zone)}" is not a zone on the map`);
    }
    if (target && s.zone !== ctx.zone) return fail(`${f}.zone`, `the target stop must be the visualised zone ${ctx.zone}`);
    const stop = { label: label3, zone: s.zone, ref: ref(s.ref, `${f}.ref`, ctx, { zone: s.zone, files: ctx.zones[s.zone] }), target };
    if (target) stop.role = text(s.role, `${f}.role`, ROLE_MAX, ctx);
    return stop;
  });
}
function validateStoryboard(raw, ctx) {
  if (!isObj3(raw)) return fail("storyboard", "must be a JSON object");
  if (raw.zone !== ctx.zone) return fail("zone", `must be "${ctx.zone}"`);
  const trig = optional(raw.trigger, "trigger");
  const trigger = trig && { label: text(trig.label, "trigger.label", LABEL_MAX, ctx), ref: ref(trig.ref, "trigger.ref", ctx) };
  const stops = journey(raw.journey, ctx);
  const out2 = optional(raw.outcome, "outcome");
  const outcome = out2 && { label: text(out2.label, "outcome.label", LABEL_MAX, ctx) };
  if (!Array.isArray(raw.steps) || raw.steps.length < STEPS_MIN || raw.steps.length > STEPS_MAX) {
    return fail("steps", `must have ${STEPS_MIN}\u2013${STEPS_MAX} steps`);
  }
  const zone = { zone: ctx.zone, files: ctx.zones[ctx.zone] ?? [] };
  const steps = raw.steps.map((s, i) => {
    if (!isObj3(s)) return fail(`steps[${i}]`, "must be an object");
    return { label: text(s.label, `steps[${i}].label`, LABEL_MAX, ctx), ref: ref(s.ref, `steps[${i}].ref`, ctx, zone) };
  });
  const g2 = optional(raw.gotcha, "gotcha");
  const gotcha = g2 && { label: text(g2.label, "gotcha.label", LABEL_MAX, ctx), ref: ref(g2.ref, "gotcha.ref", ctx) };
  return { zone: ctx.zone, trigger, journey: stops, outcome, steps, gotcha };
}
function refFiles(s) {
  const refs = [s.trigger?.ref, ...(s.journey ?? []).map((j) => j.ref), ...s.steps.map((x) => x.ref), s.gotcha?.ref];
  return [...new Set(refs.flatMap((r) => r ? [parseRef(r)?.path ?? ""] : []).filter(Boolean))].sort();
}
function mapLineCounter(root, mapFiles) {
  const known = new Set(mapFiles);
  const count2 = repoLineCounter(root);
  return (path) => known.has(path) ? count2(path) : null;
}
function repoLineCounter(root) {
  let base;
  try {
    base = realpathSync3(root);
  } catch {
    return () => null;
  }
  return (path) => {
    if (!parseRef(`${path}:1`) || path === ".git" || path.startsWith(".git/")) return null;
    try {
      const full = realpathSync3(join14(base, path));
      if (!full.startsWith(base + sep2) || full.slice(base.length + 1).split(sep2)[0] === ".git") return null;
      if (!statSync2(full).isFile()) return null;
      const lines = readFileSync12(full, "utf8").split("\n");
      return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
    } catch {
      return null;
    }
  };
}

// src/layout.ts
var WIDE = 1280;
var NARROW = 375;
var FitError = class extends Error {
  constructor(field, message) {
    super(`${field}: ${message}`);
    this.field = field;
    this.name = "FitError";
  }
};
var BOLD = 1.06;
var MONO_EM = 0.62;
var NARROW_CH = /* @__PURE__ */ new Set([..."ijl.,:;'!|`"]);
var SEMI_CH = /* @__PURE__ */ new Set([...'frt()[]{}/\\-"*']);
var WIDE_LOWER = /* @__PURE__ */ new Set([..."mw"]);
var WIDE_UPPER = /* @__PURE__ */ new Set([..."MW@%&"]);
function charEm(ch, mono) {
  const cp = ch.codePointAt(0);
  if (cp >= 4352) return 1.1;
  if (mono) return MONO_EM;
  if (ch === " ") return 0.32;
  if (NARROW_CH.has(ch)) return 0.3;
  if (SEMI_CH.has(ch)) return 0.42;
  if (WIDE_UPPER.has(ch)) return 0.98;
  if (WIDE_LOWER.has(ch)) return 0.9;
  if (ch >= "A" && ch <= "Z") return 0.74;
  if (ch >= "a" && ch <= "z") return 0.6;
  if (ch >= "0" && ch <= "9") return 0.62;
  return cp > 127 ? 0.7 : 0.62;
}
function measure(s, st) {
  let em = 0;
  for (const ch of s) em += charEm(ch, !!st.mono);
  return em * st.size * (st.bold ? BOLD : 1);
}
function breakWord(word, maxW, st) {
  const out2 = [];
  let rest = [...word];
  while (rest.length) {
    let n = 0;
    while (n < rest.length && measure(rest.slice(0, n + 1).join(""), st) <= maxW) n++;
    if (n === 0) n = 1;
    if (n < rest.length) {
      const piece = rest.slice(0, n);
      let at = -1;
      for (let i = piece.length - 1; i > 0; i--) if ("/:-_.".includes(piece[i])) {
        at = i;
        break;
      }
      if (at >= Math.floor(n / 2)) n = at + 1;
    }
    out2.push(rest.slice(0, n).join(""));
    rest = rest.slice(n);
  }
  return out2;
}
function wrap(text3, maxW, st) {
  const words = text3.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const joined = cur ? `${cur} ${w}` : w;
    if (measure(joined, st) <= maxW) {
      cur = joined;
      continue;
    }
    if (cur) lines.push(cur);
    cur = "";
    if (measure(w, st) <= maxW) {
      cur = w;
      continue;
    }
    const pieces = breakWord(w, maxW, st);
    lines.push(...pieces.slice(0, -1));
    cur = pieces[pieces.length - 1];
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}
var LH = 1.3;
function block(text3, x, y, w, st, align, lines) {
  const ls = lines ?? wrap(text3, w, st);
  const lh = Math.round(st.size * LH * 10) / 10;
  return { x, y, w, h: ls.length * lh, lines: ls, size: st.size, lh, mono: !!st.mono, bold: !!st.bold, align };
}
function sharedSize(texts, w, sizes, maxLines, st) {
  for (const size of sizes) if (texts.every((t) => wrap(t, w, { ...st, size }).length <= maxLines)) return size;
  return null;
}
function fitOrFail(items, w, sizes, maxLines, st, what) {
  const size = sharedSize(items.map((i) => i.text), w, sizes, maxLines, st);
  if (size !== null) return size;
  const bad = items.find((i) => wrap(i.text, w, { ...st, size: sizes[sizes.length - 1] }).length > maxLines);
  throw new FitError(bad.field, `is too wide to fit ${what} in ${maxLines} line${maxLines > 1 ? "s" : ""}; shorten it`);
}
function pill(text3, cx, y, maxTextW, st, padX, padY, bounds, lines) {
  const ls = lines ?? wrap(text3, maxTextW, st);
  const tw = Math.max(...ls.map((l) => measure(l, st)));
  const w = Math.min(Math.max(tw + 2 * padX, 64), maxTextW + 2 * padX);
  const x = Math.min(Math.max(cx - w / 2, bounds[0]), bounds[1] - w);
  const t = block(text3, x + padX, y + padY, w - 2 * padX, st, "middle", ls);
  return { rect: { x, y, w, h: t.h + 2 * padY }, text: t };
}
var bottom = (r) => r.y + r.h;
var cxOf = (r) => r.x + r.w / 2;
var cyOf = (r) => r.y + r.h / 2;
var METRICS = {
  wide: {
    M: 32,
    headingY: 24,
    heading: 16,
    zone: 44,
    badge: 18,
    body: 24,
    whyTop: 110,
    labelSizes: [16, 15, 14, 13, 12],
    pillSizes: [15, 14, 13, 12],
    roleSizes: [20, 19, 18, 17, 16, 15],
    roleLines: 3,
    chip: 14,
    stepSizes: [19, 18, 17, 16, 15],
    insideTitle: 24,
    gotchaSizes: [20, 19, 18, 17, 16],
    closing: 20,
    boxPadX: 10,
    boxPadY: 12
  },
  narrow: {
    M: 12,
    headingY: 14,
    heading: 14,
    zone: 26,
    badge: 15,
    body: 17,
    whyTop: 70,
    labelSizes: [14, 13, 12, 11],
    pillSizes: [14, 13, 12, 11],
    roleSizes: [15, 14, 13, 12],
    roleLines: 4,
    chip: 12,
    stepSizes: [16, 15, 14, 13],
    insideTitle: 17,
    gotchaSizes: [16, 15, 14, 13],
    closing: 15,
    boxPadX: 8,
    boxPadY: 10
  }
};
function layoutJourney(j, heading, W, m, narrow) {
  const n = j.stops.length;
  const rowW = W - 2 * m.M;
  const boxW = narrow ? (rowW - 28) / 2 : Math.min(200, (rowW - (n - 1) * 36) / n);
  const gap = narrow ? 28 : Math.min(80, (rowW - n * boxW) / (n - 1));
  const textW = boxW - 2 * m.boxPadX;
  const labelSize = fitOrFail(j.stops.map((s) => ({ text: s.label, field: s.field })), textW, m.labelSizes, 2, { bold: true }, "in its box");
  const lst = { size: labelSize, bold: true };
  const lh = Math.round(labelSize * LH * 10) / 10;
  const boxH = 2 * lh + 2 * m.boxPadY;
  const pillPadX = 14;
  const pillPadY = 8;
  const pillTextMax = narrow ? rowW - 2 * pillPadX : Math.min(320, (rowW - 24) / 2 - 2 * pillPadX);
  const pillItems = [{ text: j.start.label, field: j.start.field }, ...j.outcome ? [{ text: j.outcome.label, field: j.outcome.field }] : []];
  const pillSize = fitOrFail(pillItems, pillTextMax, m.pillSizes, 2, {}, "in its pill");
  const pst = { size: pillSize };
  const pillsTop = bottom(heading) + (narrow ? 22 : 56);
  const rowX0 = narrow ? m.M : (W - (n * boxW + (n - 1) * gap)) / 2;
  const slot = (i) => {
    if (!narrow) return { col: i, row: 0 };
    const row = Math.floor(i / 2);
    const inRow = i % 2;
    return { col: row % 2 === 0 ? inRow : 1 - inRow, row };
  };
  const firstCx = rowX0 + slot(0).col * (boxW + gap) + boxW / 2;
  const startBounds = narrow ? [m.M, W - m.M] : [m.M, W / 2 - 12];
  const start = pill(j.start.label, firstCx, pillsTop, pillTextMax, pst, pillPadX, pillPadY, startBounds);
  let outcome = null;
  const lastSlot = slot(n - 1);
  const lastCx = rowX0 + lastSlot.col * (boxW + gap) + boxW / 2;
  if (j.outcome && !narrow) outcome = pill(j.outcome.label, lastCx, pillsTop, pillTextMax, pst, pillPadX, pillPadY, [W / 2 + 12, W - m.M]);
  const bandBottom = Math.max(bottom(start.rect), outcome ? bottom(outcome.rect) : 0);
  const rowTop = bandBottom + (narrow ? 32 : 44);
  const boxes = j.stops.map((s, i) => {
    const { col, row } = slot(i);
    const rect2 = { x: rowX0 + col * (boxW + gap), y: rowTop + row * (boxH + 36), w: boxW, h: boxH };
    const lines = wrap(s.label, textW, lst);
    const th = lines.length * lh;
    const label3 = block(s.label, rect2.x + m.boxPadX, rect2.y + (boxH - th) / 2, textW, lst, "middle", lines);
    return { rect: rect2, label: label3, target: s.target };
  });
  const gridBottom = Math.max(...boxes.map((b) => bottom(b.rect)));
  if (j.outcome && narrow) {
    outcome = pill(j.outcome.label, lastCx, gridBottom + 32, pillTextMax, pst, pillPadX, pillPadY, [m.M, W - m.M]);
  }
  const arrows = [];
  const b0 = boxes[0].rect;
  const ax = Math.min(Math.max(cxOf(b0), start.rect.x + pillPadX), start.rect.x + start.rect.w - pillPadX);
  arrows.push([{ x: ax, y: bottom(start.rect) + 4 }, { x: ax, y: b0.y - 4 }]);
  for (let i = 1; i < n; i++) {
    const a = boxes[i - 1].rect;
    const b = boxes[i].rect;
    if (a.y === b.y) {
      const leftToRight = a.x < b.x;
      arrows.push([{ x: leftToRight ? a.x + a.w + 4 : a.x - 4, y: cyOf(a) }, { x: leftToRight ? b.x - 4 : b.x + b.w + 4, y: cyOf(b) }]);
    } else {
      arrows.push([{ x: cxOf(a), y: bottom(a) + 4 }, { x: cxOf(b), y: b.y - 4 }]);
    }
  }
  const last = boxes[n - 1].rect;
  if (outcome) {
    const ox = Math.min(Math.max(cxOf(last), outcome.rect.x + pillPadX), outcome.rect.x + outcome.rect.w - pillPadX);
    arrows.push(narrow ? [{ x: ox, y: bottom(last) + 4 }, { x: ox, y: outcome.rect.y - 4 }] : [{ x: ox, y: last.y - 4 }, { x: ox, y: bottom(outcome.rect) + 4 }]);
  }
  const below = Math.max(gridBottom, outcome ? bottom(outcome.rect) : 0);
  const roleW = Math.min(880, rowW);
  const roleSize = fitOrFail([{ text: j.role.text, field: j.role.field }], roleW, m.roleSizes, m.roleLines, {}, "under the journey");
  const role = block(j.role.text, (W - roleW) / 2, below + (narrow ? 28 : 40), roleW, { size: roleSize }, "middle");
  const chipSt = { size: m.chip, mono: true };
  const roleRef = pill(j.roleRef, W / 2, bottom(role) + 12, roleW - 20, chipSt, 10, 5, [m.M, W - m.M]);
  const target = boxes.find((b) => b.target).rect;
  const roleLink = narrow ? null : [{ x: cxOf(target), y: bottom(target) + 4 }, { x: cxOf(target), y: role.y - 6 }];
  return { heading, start, outcome, boxes, arrows, role, roleRef, roleLink, target };
}
function layoutAt(input, W) {
  const narrow = W < 640;
  const m = METRICS[narrow ? "narrow" : "wide"];
  const rowW = W - 2 * m.M;
  const head = (t) => block(t, m.M, m.headingY, rowW, { size: m.heading, bold: true }, "start");
  const chipSt = { size: m.chip, mono: true };
  const zone = block(input.zoneId, m.M, m.whyTop, rowW, { size: m.zone, mono: true, bold: true }, "start");
  const badgeSt = { size: m.badge, bold: true };
  const bw = measure(input.stateLabel, badgeSt) + 28;
  const badgeText = block(input.stateLabel, m.M + 14, bottom(zone) + 24 + 6, bw - 28, badgeSt, "middle", [input.stateLabel]);
  const badge = { rect: { x: m.M, y: bottom(zone) + 24, w: bw, h: badgeText.h + 12 }, text: badgeText };
  const reason = block(input.reason, m.M, bottom(badge.rect) + 24, rowW, { size: m.body }, "start");
  const why = { heading: head(input.headings.why), zone, badge, reason };
  const journey2 = input.journey ? layoutJourney(input.journey, head(input.headings.journey), W, m, narrow) : null;
  const iHeading = head(input.headings.inside);
  const title = block(input.insideTitle, m.M, bottom(iHeading) + (narrow ? 18 : 30), rowW, { size: m.insideTitle, mono: true, bold: true }, "start");
  const numR = narrow ? 12 : 15;
  const labelX = m.M + (narrow ? 34 : 52);
  const labelW = narrow ? W - m.M - labelX : 520;
  const stepSize = fitOrFail(input.steps.map((s) => ({ text: s.label, field: s.field })), labelW, m.stepSizes, 2, { bold: true }, "in its step");
  const sst = { size: stepSize, bold: true };
  const chipX = narrow ? labelX : labelX + labelW + 24;
  const chipMaxText = W - m.M - chipX - 20;
  let y = bottom(title) + (narrow ? 20 : 28);
  const pad = narrow ? 8 : 10;
  const rows = input.steps.map((s) => {
    const label3 = block(s.label, labelX, y + pad, labelW, sst, "start");
    const chipTop = narrow ? bottom(label3) + 6 : y + pad;
    const chip = pill(s.ref, chipX, chipTop, chipMaxText, chipSt, 10, 4, [chipX, W - m.M]);
    chip.rect.x = chipX;
    chip.text.x = chipX + 10;
    const h = (narrow ? bottom(chip.rect) - y : Math.max(label3.h, chip.rect.h)) + pad * (narrow ? 1 : 2);
    const rect2 = { x: m.M, y, w: rowW, h };
    y += h + (narrow ? 10 : 12);
    const cy = narrow ? label3.y + label3.lh / 2 : rect2.y + h / 2;
    return { rect: rect2, num: { cx: m.M + numR + 2, cy, r: numR, size: narrow ? 12 : 14 }, label: label3, chip };
  });
  const inside = { heading: iHeading, title, rows };
  const oHeading = head(input.headings.outro);
  const outTop = journey2 ? Math.max(...journey2.boxes.map((b) => bottom(b.rect)), journey2.outcome ? bottom(journey2.outcome.rect) : 0) + (narrow ? 28 : 40) : bottom(oHeading) + (narrow ? 40 : 96);
  let gotcha = null;
  let closingTop = outTop;
  if (input.gotcha) {
    const cardW = Math.min(760, rowW);
    const cx0 = (W - cardW) / 2;
    const inner = cardW - 40;
    const t = block(input.gotcha.title, cx0 + 20, outTop + 16, inner, { size: narrow ? 13 : 14, bold: true }, "start");
    const gSize = fitOrFail([{ text: input.gotcha.label, field: input.gotcha.field }], inner, m.gotchaSizes, 2, {}, "in the watch-out note");
    const label3 = block(input.gotcha.label, cx0 + 20, bottom(t) + 6, inner, { size: gSize }, "start");
    const chip = pill(input.gotcha.ref, cx0 + 20, bottom(label3) + 10, inner - 20, chipSt, 10, 4, [cx0 + 20, cx0 + cardW - 20]);
    chip.rect.x = cx0 + 20;
    chip.text.x = cx0 + 30;
    const rect2 = { x: cx0, y: outTop, w: cardW, h: bottom(chip.rect) + 16 - outTop };
    gotcha = { rect: rect2, title: t, label: label3, chip };
    closingTop = bottom(rect2) + (narrow ? 24 : 36);
  }
  const closing = block(input.closing, m.M, closingTop, rowW, { size: m.closing, bold: true }, "middle");
  const outro = { heading: oHeading, gotcha, closing };
  const margin = narrow ? 28 : 40;
  const fit = (y2) => Math.ceil(y2 + margin);
  const heights = {
    why: fit(bottom(reason)),
    journey: journey2 ? fit(bottom(journey2.roleRef.rect)) : 0,
    inside: fit(Math.max(...rows.map((r) => bottom(r.rect)))),
    outro: fit(bottom(closing))
  };
  const height = Math.max(heights.why, heights.journey, heights.inside, heights.outro);
  return { width: W, height, heights, why, journey: journey2, inside, outro };
}
function layoutVisual(input, width) {
  return layoutAt(input, width);
}
function fitError(input) {
  try {
    layoutAt(input, WIDE);
    layoutAt(input, NARROW);
    return null;
  } catch (e) {
    if (e instanceof FitError) return e;
    throw e;
  }
}

// src/visual-template.ts
var PLAYER_JS = String.raw`(function () {
  var doc = document;
  doc.documentElement.classList.remove('no-js');
  var data = JSON.parse(doc.getElementById('umap-data').textContent);
  var scenes = data.scenes, n = scenes.length, Z = data.zoom, journey = !!data.dot;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // A page opened in a background tab waits, fully drawn, and starts when it is first shown.
  var waiting = !reduce && !!doc.hidden;
  var idx = 0, t = 0, playing = !reduce && !waiting, speed = 1, last = null, hold = 0, shownIdx = -1, prevScene = null;
  var $ = function (id) { return doc.getElementById(id); };
  var label = $('scene'), playBtn = $('play'), speedBtn = $('speed');
  var caps = [].slice.call(doc.querySelectorAll('.captions > li'));
  var svgs = [].slice.call(doc.querySelectorAll('svg.v')).map(function (s) {
    var layers = {};
    [].forEach.call(s.querySelectorAll('.layer'), function (l) { layers[l.getAttribute('data-layer')] = l; });
    var els = [].slice.call(s.querySelectorAll('.el')).map(function (e) {
      var lit = e.getAttribute('data-lit');
      return { e: e, layer: e.parentNode.getAttribute('data-layer'), a: +e.getAttribute('data-a'), homeOnly: e.classList.contains('home-only'),
        lit: lit ? lit.split(' ').map(Number) : null, keep: e.hasAttribute('data-keep-lit') };
    });
    var key = s.classList.contains('v-w') ? 'w' : 'n';
    return { s: s, layers: layers, els: els, cam: data.cam[key], dot: s.querySelector('.dot'), pts: journey ? data.dot[key] : null };
  });
  function ease(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function mix(a, b, k) { return a.map(function (v, i) { return v + (b[i] - v) * k; }); }
  function dotAt(arrows) {
    var h = data.dot.hops;
    for (var k = 0; k < h.length; k++) {
      if (t >= h[k][0] && t < h[k][1]) {
        var a = arrows[k], e = ease((t - h[k][0]) / (h[k][1] - h[k][0]));
        return [a[0] + (a[2] - a[0]) * e, a[1] + (a[3] - a[1]) * e];
      }
    }
    return null;
  }
  function render() {
    var sc = scenes[idx].id, changed = sc !== prevScene;
    prevScene = sc;
    var vis = { why: sc === 'why', journey: sc === 'journey' || sc === 'outro' || (sc === 'inside' && journey && t < Z),
      inside: sc === 'inside' && (!journey || t >= Z), outro: sc === 'outro' };
    svgs.forEach(function (v) {
      for (var k in v.layers) {
        var l = v.layers[k], on = !!vis[k];
        // On a scene change the outgoing layer goes at once (no fade), so the camera never shows it mid-zoom.
        if (changed && !on && l.classList.contains('show')) {
          l.classList.add('cut');
          l.classList.remove('show');
          getComputedStyle(l).opacity;
          l.classList.remove('cut');
        } else l.classList.toggle('show', on);
      }
      v.els.forEach(function (x) {
        var home = x.layer === sc;
        var on = !!vis[x.layer] && (home ? t >= x.a : !x.homeOnly);
        x.e.classList.toggle('on', on);
        if (x.lit) x.e.classList.toggle('lit', on && (home ? t >= x.lit[0] && t < x.lit[1] : x.keep));
      });
      var c = v.cam, box = [0, 0, c.w, c.h[sc]];
      if (journey && sc === 'inside' && t < Z) box = mix(box, c.zin, ease(t / Z));
      if (journey && sc === 'outro' && t < Z) box = mix(c.zout, box, ease(t / Z));
      v.s.setAttribute('viewBox', box.join(' '));
      if (v.dot) {
        var p = sc === 'journey' ? dotAt(v.pts) : null;
        if (p) { v.dot.setAttribute('cx', p[0]); v.dot.setAttribute('cy', p[1]); }
        v.dot.classList.toggle('on', !!p);
      }
    });
    if (shownIdx !== idx) {
      shownIdx = idx;
      label.textContent = 'Scene ' + (idx + 1) + ' of ' + n + ': ' + scenes[idx].title.replace(/^\d+ · /, '');
      caps.forEach(function (c, i) { c.classList.toggle('current', i === idx); });
    }
  }
  // Without a running clock (paused, reduced motion) a scene is shown complete; while playing it starts from 0.
  function go(i) { idx = (i + n) % n; t = playing ? 0 : scenes[idx].duration; hold = 0; render(); }
  function setPlaying(p) {
    playing = p && !reduce;
    if (playing && t >= scenes[idx].duration) { t = 0; hold = 0; render(); }
    playBtn.textContent = playing ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', String(playing));
  }
  function tick(now) {
    if (playing && last !== null) {
      t += Math.min(0.1, (now - last) / 1000) * speed;
      if (t >= scenes[idx].duration) {
        if (idx < n - 1) { idx++; t = 0; }
        else { hold += t - scenes[idx].duration; t = scenes[idx].duration; if (hold > 3) { idx = 0; t = 0; hold = 0; } }
      }
      render();
    }
    last = now;
    requestAnimationFrame(tick);
  }
  $('restart').addEventListener('click', function () { go(0); });
  $('prev').addEventListener('click', function () { go(idx - 1); });
  $('next').addEventListener('click', function () { go(idx + 1); });
  playBtn.addEventListener('click', function () { waiting = false; setPlaying(!playing); });
  speedBtn.addEventListener('click', function () {
    speed = speed === 1 ? 1.5 : 1;
    speedBtn.textContent = speed === 1 ? '1×' : '1.5×';
    speedBtn.setAttribute('aria-label', 'Speed ' + speedBtn.textContent);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') go(idx + 1);
    else if (e.key === 'ArrowLeft') go(idx - 1);
    else if ((e.key === ' ' || e.key === 'k') && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); waiting = false; setPlaying(!playing); }
  });
  doc.addEventListener('visibilitychange', function () {
    if (waiting && !doc.hidden) { waiting = false; idx = 0; t = 0; setPlaying(true); render(); }
  });
  if (reduce) doc.documentElement.classList.add('reduced');
  setPlaying(playing);
  go(0);
  requestAnimationFrame(tick);
})();`;
var VISUAL_TEMPLATE = String.raw`<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
${THEME_CSS}* { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 var(--font); }
main { max-width: 1320px; margin: 0 auto; padding: 16px; }
h1 { font: 700 1.3rem/1.3 var(--mono); margin: 0 0 4px; word-break: break-all; }
h2 { font-size: 1.05rem; margin: 24px 0 8px; }
.meta, .note { color: var(--muted); font-size: 0.88rem; margin: 2px 0; }
.stage { margin-top: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.v { display: block; width: 100%; height: auto; }
.v-n { display: none; max-width: 480px; margin: 0 auto; }
@media (max-width: 760px) {
  main { padding: 12px 0; }
  header, h2, .captions, .note, .controls { padding-left: 12px; padding-right: 12px; }
  .stage { border-radius: 0; border-left: 0; border-right: 0; }
  .v-w { display: none; }
  .v-n { display: block; }
}
.no-js .stage, .no-js .controls { display: none; }
.controls { position: sticky; bottom: 0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 0; background: var(--bg); }
button { font: inherit; background: var(--accent); color: var(--bg); border: 0; border-radius: 6px; padding: 5px 12px; cursor: pointer; min-width: 44px; min-height: 32px; }
button:focus-visible { outline: 3px solid var(--text); outline-offset: 2px; }
#scene { color: var(--muted); font-size: 0.9rem; }
.reduced #play, .reduced #speed { display: none; }
.captions { padding-left: 20px; }
.captions > li { margin: 6px 0 12px; padding: 4px 8px; border-left: 3px solid transparent; }
.captions > li.current { border-left-color: var(--accent); }
.captions h3 { font-size: 0.95rem; margin: 0 0 2px; }
.captions p { margin: 2px 0; }
.captions ol { margin: 2px 0; padding-left: 20px; }
code { font-family: var(--mono); font-size: 0.88em; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; word-break: break-all; }
/* Stage drawing */
.st-owned { --st: var(--owned); --on-st: var(--on-owned); }
.st-fragile { --st: var(--fragile); --on-st: var(--on-fragile); }
.st-fading { --st: var(--fading); --on-st: var(--on-fading); }
.st-dark { --st: var(--dark); --on-st: var(--on-dark); }
.st-unknown { --st: var(--unknown); --on-st: var(--on-unknown); }
.stage-bg { fill: var(--surface); }
.layer { opacity: 0; transition: opacity .35s ease; }
.layer.cut { transition: none; }
.layer.show { opacity: 1; }
.el { opacity: 0; transition: opacity .45s ease, transform .45s ease; }
.el.on { opacity: 1; }
.row { transform: translateX(-10px); }
.row.on { transform: none; }
text { fill: var(--text); font-family: var(--font); }
.mono { font-family: var(--mono); }
.b, .strong { font-weight: 700; }
.h { fill: var(--muted); }
.badge-bg { fill: var(--st); }
.badge-t { fill: var(--on-st); }
.box-bg { fill: var(--bg); stroke: var(--border); stroke-width: 1.5; }
.box-t { fill: var(--text); }
.box.lit .box-bg { stroke: var(--accent); stroke-width: 2.5; }
.box.tgt .box-bg { fill: var(--st); stroke: var(--st); }
.box.tgt .box-t { fill: var(--on-st); }
.box.tgt.lit .box-bg { stroke: var(--accent); stroke-width: 3; filter: drop-shadow(0 0 10px var(--accent)); }
.pill-bg { fill: color-mix(in srgb, var(--accent) 12%, var(--surface)); stroke: var(--accent); stroke-width: 1.5; }
.end.lit .pill-bg { fill: color-mix(in srgb, var(--accent) 28%, var(--surface)); stroke-width: 2.5; }
.arrow { stroke: var(--muted); stroke-width: 2; }
.ah { fill: var(--muted); }
.link { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 4 4; }
.dot { fill: var(--accent); stroke: var(--surface); stroke-width: 2; opacity: 0; transition: opacity .15s; }
.dot.on { opacity: 1; }
.chip-bg { fill: var(--bg); stroke: var(--border); }
.chip-t { fill: var(--muted); }
.inside-bg { fill: color-mix(in srgb, var(--st) 9%, var(--surface)); }
.row-bg { fill: var(--surface); stroke: var(--border); }
.row.lit .row-bg { fill: color-mix(in srgb, var(--accent) 10%, var(--surface)); stroke: var(--accent); stroke-width: 2; }
.num-bg { fill: var(--border); }
.row.lit .num-bg { fill: var(--accent); }
.row.lit .num-t { fill: var(--surface); }
.gotcha-bg { fill: color-mix(in srgb, var(--fragile) 14%, var(--surface)); stroke: var(--fragile); stroke-width: 2; }
.closing { fill: var(--accent); }
@media (prefers-reduced-motion: reduce) {
  .layer, .el, .dot { transition: none !important; }
  .row { transform: none; }
}
</style>
</head>
<body>
<main>
<header>
<h1>__ZONE__</h1>
<p class="meta">__META__</p>
</header>
<div class="stage" id="stage">__STAGE__</div>
<div class="controls" role="toolbar" aria-label="Animation controls">
<button type="button" id="restart">Restart</button>
<button type="button" id="prev" aria-label="Previous scene">Prev</button>
<button type="button" id="play" aria-pressed="true">Pause</button>
<button type="button" id="next" aria-label="Next scene">Next</button>
<button type="button" id="speed" aria-label="Speed 1×">1×</button>
<span id="scene" aria-live="polite"></span>
</div>
<h2>Scenes</h2>
__CAPTIONS__
<p class="note">Watching doesn't change the Understanding Map. To lock it in, run <code>__LEARN__</code>.</p>
</main>
<script type="application/json" id="umap-data">__DATA__</script>
<script>
${PLAYER_JS}
</script>
</body>
</html>
`;

// src/visual.ts
var TITLES = { why: "Why this matters", journey: "Product journey", inside: "Inside the zone", outro: "Back out" };
var STATES2 = ["owned", "fragile", "fading", "dark", "unknown"];
var learnCommand = (zoneId) => `/understanding-map:learn ${zoneId}`;
var cap = (s) => s[0].toUpperCase() + s.slice(1);
var plural2 = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function reasonLine(z) {
  const rest = z.reason.replace(new RegExp(`^${cap(z.state)}(\\s*\xB7\\s*)?`), "").trim();
  return rest || (z.fanIn > 0 ? `${plural2(z.fanIn, "file imports", "files import")} it` : "No other files import it");
}
function sceneIds(sb) {
  return sb.journey ? ["why", "journey", "inside", "outro"] : ["why", "inside", "outro"];
}
function layoutInputFor(sb, z) {
  const ids = sceneIds(sb);
  const heading = (id) => `${ids.indexOf(id) + 1} \xB7 ${TITLES[id]}`;
  const t = sb.journey ? sb.journey.findIndex((s) => s.target) : -1;
  return {
    headings: { why: heading("why"), journey: sb.journey ? heading("journey") : "", inside: heading("inside"), outro: heading("outro") },
    zoneId: z.id,
    stateLabel: cap(z.state),
    reason: reasonLine(z),
    journey: sb.journey && {
      start: sb.trigger ? { label: sb.trigger.label, field: "trigger.label" } : { label: "Called by", field: "trigger" },
      stops: sb.journey.map((s, i) => ({ label: s.label, field: `journey[${i}].label`, target: s.target })),
      outcome: sb.outcome && { label: sb.outcome.label, field: "outcome.label" },
      role: { text: sb.journey[t].role ?? "", field: `journey[${t}].role` },
      roleRef: sb.journey[t].ref
    },
    insideTitle: `Inside ${z.id}`,
    steps: sb.steps.map((s, i) => ({ label: s.label, ref: s.ref, field: `steps[${i}].label` })),
    gotcha: sb.gotcha && { title: "Watch out", label: sb.gotcha.label, ref: sb.gotcha.ref, field: "gotcha.label" },
    closing: `Lock it in: ${learnCommand(z.id)}`
  };
}
function checkStoryboard(raw, ctx) {
  const sb = validateStoryboard(raw, ctx);
  const fit = fitError(layoutInputFor(sb, { id: ctx.zone, state: "unknown", reason: "", fanIn: 0 }));
  if (fit) throw new StoryboardError(fit.field, fit.message.slice(fit.field.length + 2));
  return sb;
}
var ZOOM = 1.2;
var HOP = 1.6;
var PAUSE = 0.8;
var TARGET_HOLD = 3;
var WHY = 10;
var OUTRO = 10;
var JOURNEY_MIN2 = 20;
var INSIDE_TARGET = 29;
function timeline(sb) {
  const why = { zone: 0.3, badge: 1.2, reason: 2.2 };
  let journey2 = null;
  let journeyDur = 0;
  if (sb.journey) {
    const n = sb.journey.length;
    const boxes = sb.journey.map((_, i) => 0.8 + 0.3 * i);
    const outcome = 0.8 + 0.3 * n;
    const arrows = n + (sb.outcome ? 1 : 0);
    const targetIndex = sb.journey.findIndex((s) => s.target);
    const hops = [];
    let t = outcome + 0.8;
    let reach = 0;
    for (let k = 0; k < arrows; k++) {
      hops.push([t, t + HOP]);
      t += HOP;
      if (k === targetIndex) reach = t;
      t += k === targetIndex ? TARGET_HOLD : PAUSE;
    }
    const visits = boxes.map((_, k) => [hops[k][1], k + 1 < arrows ? hops[k + 1][0] : 1e9]);
    journey2 = { start: 0.3, boxes, outcome, hops, visits, reach, role: reach + 0.3 };
    journeyDur = Math.max(JOURNEY_MIN2, Math.round((t + 3) * 10) / 10);
  }
  const step = Math.min(7, Math.max(4, (INSIDE_TARGET - 4.6) / sb.steps.length));
  const steps = sb.steps.map((_, i) => [1.6 + i * step, i === sb.steps.length - 1 ? 1e9 : 1.6 + (i + 1) * step]);
  const insideDur = Math.round((1.6 + sb.steps.length * step + 3) * 10) / 10;
  const outro = { gotcha: 1.4, closing: sb.gotcha ? 3.4 : 1.6 };
  const durations = { why: WHY, journey: journeyDur, inside: insideDur, outro: OUTRO };
  const ids = sceneIds(sb);
  return {
    scenes: ids.map((id, i) => ({ id, title: `${i + 1} \xB7 ${TITLES[id]}`, duration: durations[id] })),
    why,
    journey: journey2,
    steps,
    outro
  };
}
var n2 = (v) => String(Math.round(v * 100) / 100);
var attrs = (a) => Object.entries(a).flatMap(([k, v]) => v === void 0 ? [] : [` ${k}="${esc(typeof v === "number" ? n2(v) : v)}"`]).join("");
function text2(b, cls, extra = {}) {
  const x = b.align === "middle" ? b.x + b.w / 2 : b.x;
  const spans = b.lines.map((l, i) => `<tspan${attrs({ x, y: b.y + i * b.lh + b.lh / 2 + b.size * 0.35 })}>${esc(l)}</tspan>`).join("");
  const classes = [cls, b.mono ? "mono" : "", b.bold ? "b" : ""].filter(Boolean).join(" ");
  return `<text${attrs({ class: classes, "font-size": b.size, "text-anchor": b.align === "middle" ? "middle" : "start", ...extra })}>${spans}</text>`;
}
var rect = (r, cls, rx = 8) => `<rect${attrs({ class: cls, x: r.x, y: r.y, width: r.w, height: r.h, rx })}/>`;
var pillSvg = (p, cls) => rect(p.rect, `${cls}-bg`, Math.min(p.rect.h / 2, 18)) + text2(p.text, `${cls}-t`);
var line = (a, b, cls, marker) => `<line${attrs({ class: cls, x1: a.x, y1: a.y, x2: b.x, y2: b.y, "marker-end": marker ? `url(#${marker})` : void 0 })}/>`;
var g = (body, a, cls = "", extra = {}) => `<g${attrs({ class: `el ${cls}`.trim(), "data-a": a, ...extra })}>${body}</g>`;
function svg(l, tl, state, variant) {
  const marker = `ah-${variant}`;
  const parts = [];
  parts.push(`<defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah" d="M0,0 L10,5 L0,10 z"/></marker></defs>`);
  parts.push(`<rect class="stage-bg" x="0" y="0" width="${l.width}" height="${l.height}"/>`);
  const w = l.why;
  parts.push(`<g class="layer" data-layer="why">` + g(text2(w.heading, "h"), 0) + g(text2(w.zone, "zone"), tl.why.zone) + g(rect(w.badge.rect, `badge-bg st-${state}`, 6) + text2(w.badge.text, `badge-t st-${state}`), tl.why.badge) + g(text2(w.reason, "body"), tl.why.reason) + `</g>`);
  const j = l.journey;
  if (j && tl.journey) {
    const t = tl.journey;
    const items = [g(text2(j.heading, "h"), 0, "home-only")];
    items.push(g(pillSvg(j.start, "pill"), t.start));
    items.push(g(line(j.arrows[0][0], j.arrows[0][1], "arrow", marker), t.boxes[0]));
    j.boxes.forEach((b, i) => {
      if (i > 0) items.push(g(line(j.arrows[i][0], j.arrows[i][1], "arrow", marker), t.boxes[i]));
      const cls = b.target ? `box tgt st-${state}` : "box";
      const lit = b.target ? { "data-lit": `${n2(t.reach)} 1e9`, "data-keep-lit": "1" } : { "data-lit": `${n2(t.visits[i][0])} ${n2(t.visits[i][1])}` };
      items.push(g(rect(b.rect, "box-bg") + text2(b.label, "box-t"), t.boxes[i], cls, lit));
    });
    if (j.outcome) {
      items.push(g(pillSvg(j.outcome, "pill"), t.outcome, "end", { "data-lit": `${n2(t.hops[t.hops.length - 1][1])} 1e9`, "data-keep-lit": "1" }));
      items.push(g(line(j.arrows[j.arrows.length - 1][0], j.arrows[j.arrows.length - 1][1], "arrow", marker), t.outcome));
    }
    if (j.roleLink) items.push(g(line(j.roleLink[0], j.roleLink[1], "link"), t.role, "home-only"));
    items.push(g(text2(j.role, "role"), t.role, "home-only"));
    items.push(g(pillSvg(j.roleRef, "chip"), t.role + 0.4, "home-only"));
    items.push(`<circle class="dot" r="${variant === "w" ? 8 : 6}" cx="${n2(j.arrows[0][0].x)}" cy="${n2(j.arrows[0][0].y)}"/>`);
    parts.push(`<g class="layer" data-layer="journey">${items.join("")}</g>`);
  }
  const ins = l.inside;
  const rows = ins.rows.map((r, i) => {
    const [a, b] = tl.steps[i];
    return g(rect(r.rect, "row-bg") + `<circle class="num-bg"${attrs({ cx: r.num.cx, cy: r.num.cy, r: r.num.r })}/><text${attrs({ class: "num-t b", x: r.num.cx, y: r.num.cy + r.num.size * 0.35, "font-size": r.num.size, "text-anchor": "middle" })}>${i + 1}</text>` + text2(r.label, "row-t") + pillSvg(r.chip, "chip"), a, "row", { "data-lit": `${n2(a)} ${n2(b)}` });
  }).join("");
  parts.push(`<g class="layer" data-layer="inside"><rect class="inside-bg st-${state}" x="0" y="0" width="${l.width}" height="${l.height}"/>` + g(text2(ins.heading, "h"), 0) + g(text2(ins.title, "zone small"), 0.9) + rows + `</g>`);
  const o = l.outro;
  const gotcha = o.gotcha ? g(rect(o.gotcha.rect, "gotcha-bg") + text2(o.gotcha.title, "gotcha-h") + text2(o.gotcha.label, "gotcha-t") + pillSvg(o.gotcha.chip, "chip"), tl.outro.gotcha) : "";
  parts.push(`<g class="layer" data-layer="outro">` + g(text2(o.heading, "h"), 0) + gotcha + g(text2(o.closing, "closing"), tl.outro.closing) + `</g>`);
  return `<svg class="v v-${variant}" viewBox="0 0 ${l.width} ${l.heights.why}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${parts.join("")}</svg>`;
}
function fitAspect(r, width, height, pad = 24) {
  let [x, y, w, h] = [r.x - pad, r.y - pad, r.w + 2 * pad, r.h + 2 * pad];
  const aspect = width / height;
  if (w / h < aspect) {
    const nw = h * aspect;
    x -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / aspect;
    y -= (nh - h) / 2;
    h = nh;
  }
  return [x, y, w, h].map((v) => Math.round(v * 100) / 100);
}
function camera(l) {
  const t = l.journey?.target;
  return {
    w: l.width,
    h: { ...l.heights, journey: l.heights.journey || l.heights.why },
    zin: t ? fitAspect(t, l.width, l.heights.inside) : null,
    zout: t ? fitAspect(t, l.width, l.heights.outro) : null
  };
}
function captions(sb, z, input, tl) {
  const ref2 = (r) => `<code>${esc(r)}</code>`;
  const items = [];
  for (const s of tl.scenes) {
    let body = "";
    if (s.id === "why") {
      body = `<p><code>${esc(z.id)}</code> is <strong>${esc(cap(z.state))}</strong>. ${esc(input.reason)}.</p>`;
    } else if (s.id === "journey" && sb.journey) {
      const stops = sb.journey.map((j) => (j.target ? `<strong>${esc(j.label)}</strong>` : esc(j.label)) + ` (${ref2(j.ref)})`);
      const start = sb.trigger ? `${esc(sb.trigger.label)} (${ref2(sb.trigger.ref)})` : "Called by";
      const chain = [start, ...stops, ...sb.outcome ? [esc(sb.outcome.label)] : []].join(" \u2192 ");
      const target = sb.journey.find((j) => j.target);
      body = `<p>${chain}</p><p>${esc(target.label)}: ${esc(target.role ?? "")}.</p>`;
    } else if (s.id === "inside") {
      body = `<ol>${sb.steps.map((st) => `<li>${esc(st.label)} ${ref2(st.ref)}</li>`).join("")}</ol>`;
    } else if (s.id === "outro") {
      body = (sb.gotcha ? `<p>Watch out: ${esc(sb.gotcha.label)} ${ref2(sb.gotcha.ref)}</p>` : "") + `<p>Lock it in: <code>${esc(learnCommand(z.id))}</code></p>`;
    }
    items.push(`<li><h3>${esc(s.title)}</h3>${body}</li>`);
  }
  return `<ol class="captions">${items.join("")}</ol>`;
}
function renderVisual(sb, z, generatedAt) {
  const state = STATES2.includes(z.state) ? z.state : "unknown";
  const live = { ...z, state };
  const input = layoutInputFor(sb, live);
  const tl = timeline(sb);
  const wide = layoutVisual(input, WIDE);
  const narrow = layoutVisual(input, NARROW);
  const data = {
    version: 1,
    zone: z.id,
    zoom: ZOOM,
    scenes: tl.scenes,
    dot: tl.journey ? {
      hops: tl.journey.hops,
      w: wide.journey.arrows.map(([a, b]) => [a.x, a.y, b.x, b.y].map((v) => Math.round(v * 10) / 10)),
      n: narrow.journey.arrows.map(([a, b]) => [a.x, a.y, b.x, b.y].map((v) => Math.round(v * 10) / 10))
    } : null,
    cam: { w: camera(wide), n: camera(narrow) },
    storyboard: sb
  };
  const fill = {
    __TITLE__: esc(`${z.id} \xB7 Understanding Map`),
    __ZONE__: esc(z.id),
    __META__: esc(`Animation of one zone, drawn from a storyboard checked against the code \xB7 generated ${generatedAt}`),
    __STAGE__: svg(wide, tl, state, "w") + svg(narrow, tl, state, "n"),
    __CAPTIONS__: captions(sb, live, input, tl),
    __LEARN__: esc(learnCommand(z.id)),
    __DATA__: safeJson(data)
  };
  const html = VISUAL_TEMPLATE.replace(/__(TITLE|ZONE|META|STAGE|CAPTIONS|LEARN|DATA)__/g, (k) => fill[k]);
  return { html, scenes: tl.scenes.map((s) => s.id) };
}

// src/visual-cache.ts
import { readdirSync as readdirSync3 } from "node:fs";

// src/visual-store.ts
import { createHash as createHash2 } from "node:crypto";
import { mkdirSync as mkdirSync10, readFileSync as readFileSync13, writeFileSync as writeFileSync10 } from "node:fs";
import { join as join15 } from "node:path";
function visualSlug(zoneId) {
  const base = zoneId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "zone";
  return `${base}-${createHash2("sha1").update(zoneId).digest("hex").slice(0, 6)}`;
}
var visualsDir = (root) => join15(umDir(root), "local", "visuals");
var visualHref = (zoneId) => `local/visuals/${visualSlug(zoneId)}.html`;
var MISSING = "missing";
function hashFile(root, path) {
  try {
    return createHash2("sha1").update(readFileSync13(join15(root, path))).digest("hex").slice(0, 12);
  } catch {
    return MISSING;
  }
}
function visualFingerprint(root, zoneFiles, storyboard) {
  const paths = [.../* @__PURE__ */ new Set([...zoneFiles, ...refFiles(storyboard)])].sort();
  return Object.fromEntries(paths.map((p) => [p, hashFile(root, p)]));
}
function saveVisual(root, saved, html) {
  const dir = visualsDir(root);
  mkdirSync10(dir, { recursive: true });
  const base = join15(dir, visualSlug(saved.zone));
  writeFileSync10(`${base}.html`, html);
  writeFileSync10(`${base}.json`, JSON.stringify(saved, null, 2) + "\n");
  return { html: `${base}.html`, json: `${base}.json` };
}
var isObj4 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function readSavedVisual(root, zoneId) {
  try {
    const v = JSON.parse(readFileSync13(join15(visualsDir(root), `${visualSlug(zoneId)}.json`), "utf8"));
    if (!isObj4(v) || v.zone !== zoneId || typeof v.date !== "string" || !isObj4(v.fingerprint) || !isObj4(v.storyboard)) return null;
    if (!Array.isArray(v.storyboard.steps)) return null;
    return v;
  } catch {
    return null;
  }
}
function checkFresh(root, zone, saved) {
  let current;
  try {
    current = visualFingerprint(root, zone.files, saved.storyboard);
  } catch {
    return { fresh: false, reason: "the saved storyboard could not be read" };
  }
  const keys = /* @__PURE__ */ new Set([...Object.keys(current), ...Object.keys(saved.fingerprint)]);
  const changed = [...keys].filter((k) => current[k] !== saved.fingerprint[k] || current[k] === MISSING).sort();
  return changed.length ? { fresh: false, reason: `the code changed since the last visual (${changed.slice(0, 3).join(", ")}${changed.length > 3 ? ", \u2026" : ""})` } : { fresh: true };
}

// src/visual-cache.ts
var liveZone = (z) => ({ id: z.zone.id, state: z.state, reason: z.reason, fanIn: z.criticality.fanIn });
function storyboardContextFor(root, m, zoneId) {
  return {
    zone: zoneId,
    zones: Object.fromEntries(m.zones.map((z) => [z.zone.id, z.zone.files])),
    lineCount: mapLineCounter(root, m.zones.flatMap((z) => z.zone.files)),
    people: [...new Set(m.zones.flatMap((z) => z.people.map((p) => p.handle)))]
  };
}
function reusableVisual(root, m, z) {
  const saved = readSavedVisual(root, z.zone.id);
  if (!saved) return { reason: "no saved animation for this zone yet" };
  const fresh = checkFresh(root, { id: z.zone.id, files: z.zone.files }, saved);
  if (!fresh.fresh) return { reason: fresh.reason };
  try {
    checkStoryboard(saved.storyboard, storyboardContextFor(root, m, z.zone.id));
  } catch {
    return { reason: "the saved storyboard no longer matches the map" };
  }
  return { saved };
}
function rerender(root, z, saved, date) {
  const r = renderVisual(saved.storyboard, liveZone(z), date);
  return { path: saveVisual(root, saved, r.html).html, scenes: r.scenes };
}
function refreshVisuals(root, m, date) {
  let saved;
  try {
    saved = new Set(readdirSync3(visualsDir(root)));
  } catch {
    return {};
  }
  const out2 = {};
  for (const z of m.zones) {
    if (!saved.has(`${visualSlug(z.zone.id)}.json`)) continue;
    try {
      const r = reusableVisual(root, m, z);
      if (!("saved" in r)) continue;
      rerender(root, z, r.saved, date);
      out2[z.zone.id] = visualHref(z.zone.id);
    } catch {
    }
  }
  return out2;
}

// src/terminal.ts
var label2 = (s) => s[0].toUpperCase() + s.slice(1);
function formatSummary(m, reportPath) {
  const c = m.counts;
  const counts = m.mode === "team" ? `Owned ${c.owned} \xB7 Fragile ${c.fragile} \xB7 Fading ${c.fading} \xB7 Dark ${c.dark} \xB7 Unknown ${c.unknown}` : `Owned ${c.owned} \xB7 Fading ${c.fading} \xB7 Dark ${c.dark} \xB7 Unknown ${c.unknown}`;
  const header = `Understanding Map \u2014 ${m.zones.length} zones (${m.mode} mode)`;
  if (!m.zones.length) {
    const empty = [header, "", "No tracked files yet \u2014 commit some code, then run map again."];
    if (reportPath) empty.push(`Report: ${reportPath}`);
    return empty.join("\n");
  }
  const lines = [header, counts, ""];
  if (m.top.length) {
    lines.push("Where understanding matters most:");
    m.top.forEach((z, i) => lines.push(`${String(i + 1).padStart(2)}. ${z.zone.id} \u2014 ${z.reason}`));
  } else {
    lines.push("Nothing stands out as a risk right now.");
  }
  if (m.unclearCritical.length) {
    lines.push("", "Critical but not enough evidence yet:");
    for (const z of m.unclearCritical) lines.push(`  ${z.zone.id} \u2014 ${z.reason}`);
  }
  lines.push("", "Scores are estimates from git history and sessions. Run /understanding-map:who <path> to see the evidence.");
  if (reportPath) lines.push(`Report: ${reportPath}`);
  lines.push("Next: /understanding-map:learn");
  return lines.join("\n");
}
function formatWho(z, mode, opts = {}) {
  const threshold = opts.threshold ?? 60;
  const counted = z.people.filter((p) => mode === "team" ? p.active : opts.me !== void 0 ? p.handle === opts.me : true);
  const inactive = mode === "team" ? z.people.filter((p) => !p.active) : [];
  const knowers = counted.filter((p) => p.level >= threshold);
  const lines = [`${z.zone.id} \u2014 ${label2(z.state)}`, "Understood by:"];
  if (knowers.length) for (const p of knowers) lines.push(`  ${p.handle}  ${p.level}/100`);
  else lines.push(`  nobody (${label2(z.state)})`);
  const evidenceFor = (p) => {
    lines.push(`  ${p.handle} (${p.level}/100)`);
    for (const e of p.evidence) lines.push(`    - ${e.text}`);
  };
  lines.push("", "Evidence (estimates from git history and sessions):");
  if (counted.length) counted.forEach(evidenceFor);
  else lines.push(`  nobody has commits, passes or reviews here; ${z.reason}`);
  if (inactive.length) {
    lines.push("", "left / inactive (not counted toward the state):");
    inactive.forEach(evidenceFor);
  }
  if (z.agentShare > 0) lines.push("", `About ${Math.max(1, Math.round(z.agentShare * 100))}% of this zone was written by agents.`);
  return lines.join("\n");
}

// src/cli.ts
var out = (s) => void process.stdout.write(s.endsWith("\n") ? s : s + "\n");
var err = (s) => void process.stderr.write(s.endsWith("\n") ? s : s + "\n");
function parseArgs(args) {
  const flags = /* @__PURE__ */ new Set();
  const positional = [];
  for (const a of args) {
    if (a.startsWith("--")) flags.add(a);
    else positional.push(a);
  }
  return { flags, positional };
}
function requireRoot() {
  const root = repoRootOf(process.cwd());
  if (!root) err("Understanding Map needs a git repository. Run it from inside one.");
  return root;
}
function guarded(body) {
  return async (args) => {
    const root = requireRoot();
    if (!root) return 2;
    try {
      return await body(root, args);
    } catch (e) {
      if (process.env.UMAP_DEBUG === "1") err(e.stack ?? String(e));
      else err(`Understanding Map failed: ${e.message.split("\n")[0]}`);
      return 1;
    }
  };
}
function findZone(m, root, target) {
  const byId = m.zones.find((z) => z.zone.id === target);
  if (byId) return byId;
  const path = targetPath(root, target);
  const file = m.zones.find((z) => z.zone.files.includes(path));
  if (file) return file;
  const dir = path.replace(/\/+$/, "") + "/";
  return m.zones.find((z) => z.zone.files.some((f) => f.startsWith(dir))) ?? null;
}
function optionalReviews(root, config, deps = { ghAvailable }) {
  try {
    if (!config.githubReviews || process.env.UMAP_NO_GH === "1") return {};
    const cached = readReviewCache(root);
    if (cached) return cached;
    if (!deps.ghAvailable(root)) return {};
    return reviewCountsByPath(root, deps.run);
  } catch {
    return {};
  }
}
var cap2 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
var GRADES = ["pass", "partial", "miss"];
var valueOf = (args, flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : void 0;
};
async function readStdin() {
  let text3 = "";
  for await (const chunk2 of process.stdin) text3 += String(chunk2);
  return text3;
}
var commands = {
  /** Hook entry point: not guarded; reads stdin, never throws, always exits 0. */
  hook: async (args) => {
    try {
      let input = null;
      try {
        input = JSON.parse(await readStdin());
      } catch {
      }
      if (args[0] === "post-tool-use") onPostToolUse(input);
      else if (args[0] === "stop") {
        const text3 = onStop(input);
        if (text3) out(text3);
      }
    } catch {
    }
    return 0;
  },
  status: guarded((root, args) => {
    const setUp = isSetUp(root);
    const mode = loadConfig(root).mode;
    if (parseArgs(args).flags.has("--json")) out(JSON.stringify({ setUp, mode, root }));
    else out(setUp ? `Understanding Map is set up (${mode} mode) in ${root}` : "Understanding Map is not set up yet. Run /understanding-map:setup.");
    return 0;
  }),
  setup: guarded((root, args) => {
    const valueOf2 = (flag) => {
      const i = args.indexOf(flag);
      return i >= 0 ? args[i + 1] : void 0;
    };
    const mode = valueOf2("--mode");
    if (mode !== "solo" && mode !== "team") {
      err('Usage: setup --mode solo|team [--critical "<glob>,<glob>"]');
      return 2;
    }
    const critical = args.includes("--critical") ? (valueOf2("--critical") ?? "").split(",").map((g2) => g2.trim()).filter(Boolean) : void 0;
    const r = runSetup(root, { mode, critical });
    const lines = [
      `Set up Understanding Map in ${mode} mode.`,
      `Wrote ${relative4(root, r.configPath)}${r.critical.length ? ` with critical areas: ${r.critical.join(", ")}` : ""}.`,
      mode === "solo" ? "Everything in .understanding/ stays on this machine (it is ignored by git)." : "Local data and the HTML report are ignored by git; passes and anonymous zone totals can be shared."
    ];
    if (r.gitattributesLines.length) lines.push(`Added ${r.gitattributesLines.length} merge rule(s) to .gitattributes so shared files merge cleanly.`);
    if (mode === "team") lines.push("Commit .understanding/config.json, .understanding/.gitignore, events/ and agent-share/ with your normal commits \u2014 only passes and anonymous zone totals are shared.");
    out(lines.join("\n"));
    return 0;
  }),
  map: guarded((root, args) => {
    ensureUnderstandingIgnore(root);
    const config = loadConfig(root);
    const m = buildMap(root, { reviewsByPath: optionalReviews(root, config) });
    const { flags } = parseArgs(args);
    let reportPath = null;
    if (!flags.has("--no-report")) {
      try {
        let visuals = {};
        try {
          visuals = refreshVisuals(root, m, (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
        } catch {
        }
        reportPath = writeReport(root, renderReport(m, { ...config, visuals }));
      } catch (e) {
        err(`Could not write the HTML report: ${e.message.split("\n")[0]}`);
      }
    }
    if (flags.has("--json")) {
      out(JSON.stringify(m));
      return 0;
    }
    let text3 = formatSummary(m, reportPath);
    if (!isSetUp(root)) text3 += "\nNot set up yet \u2014 run /understanding-map:setup to choose solo or team.";
    out(text3);
    return 0;
  }),
  zone: guarded((root, args) => {
    const { flags, positional } = parseArgs(args);
    if (!positional[0]) {
      err("Usage: zone <id|path> [--json]");
      return 2;
    }
    const m = buildMap(root);
    const z = findZone(m, root, positional[0]);
    if (!z) {
      err(`No zone found for "${positional[0]}".`);
      return 1;
    }
    out(flags.has("--json") ? JSON.stringify(z) : formatWho(z, m.mode, { threshold: loadConfig(root).threshold, me: m.me }));
    return 0;
  }),
  who: guarded((root, args) => {
    const target = parseArgs(args).positional[0];
    if (!target) {
      err("Usage: who <path>");
      return 2;
    }
    const m = buildMap(root);
    const z = findZone(m, root, target);
    if (!z) {
      err(`No zone found for "${target}".`);
      return 1;
    }
    out(formatWho(z, m.mode, { threshold: loadConfig(root).threshold, me: m.me }));
    return 0;
  }),
  record: guarded((root, args) => {
    const kind = valueOf(args, "--kind");
    const grades = (valueOf(args, "--grades") ?? "").split(",").map((g2) => g2.trim()).filter(Boolean);
    const zones = (valueOf(args, "--zones") ?? "").split(",").map((z) => z.trim()).filter(Boolean);
    if (kind !== "session" && kind !== "handoff" || grades.length < 1 || grades.length > 3 || !grades.every((g2) => GRADES.includes(g2)) || kind === "session" && zones.length === 0) {
      err("Usage: record --kind session|handoff [--zones <id,id>] --grades pass|partial|miss[,...] (1-3 grades; --zones required for session) [--json]");
      return 2;
    }
    if (kind === "handoff" && handoffSet(root).zones.length === 0) {
      err("Nothing to check \u2014 no agent changes since the last check.");
      return 2;
    }
    if (kind === "session") {
      const known = new Set(buildMap(root).zones.map((z) => z.zone.id));
      const bad = zones.filter((z) => !known.has(z));
      if (bad.length) {
        err(`Unknown zone: ${bad.join(", ")}. Run map to see zone ids.`);
        return 2;
      }
    }
    const r = recordResult(root, { kind, zones, grades });
    const changes = r.changes.filter((c) => c.before !== c.after || c.levelBefore !== c.levelAfter);
    if (parseArgs(args).flags.has("--json")) out(JSON.stringify({ result: r.result, changes }));
    else {
      out([
        `Result: ${r.result}`,
        ...changes.length ? changes.map((c) => `${c.zone}: ${cap2(c.before)} \u2192 ${cap2(c.after)} (level ${c.levelBefore} \u2192 ${c.levelAfter})`) : ["No change on the map."]
      ].join("\n"));
    }
    return 0;
  }),
  unverifiable: guarded((root, args) => {
    const zone = valueOf(args, "--zone");
    if (!zone) {
      err("Usage: unverifiable --zone <id>");
      return 2;
    }
    markUnverifiable(root, zone);
    out(`Marked ${zone} as hard to verify.`);
    return 0;
  }),
  "handoff-set": guarded((root, args) => {
    const s = handoffSet(root);
    out(parseArgs(args).flags.has("--json") ? JSON.stringify(s) : s.zones.length ? `${s.totalLines} agent-written lines across ${s.zones.length} zone(s): ${s.zones.map((z) => `${z.zone} (${z.lines})`).join(", ")}` : "Nothing to check \u2014 no agent changes since the last check.");
    return 0;
  }),
  "handoff-skip": guarded((root) => {
    skipHandoff(root);
    out("Skipped the handoff check; touched zones are flagged as unreviewed agent code.");
    return 0;
  }),
  context: guarded((root, args) => {
    const { flags, positional } = parseArgs(args);
    const m = buildMap(root);
    const p = pickZone(m, root, positional[0]);
    if (!p.zone) {
      if (positional[0]) {
        err(p.why);
        return 1;
      }
      out(flags.has("--json") ? JSON.stringify({ zone: null, why: p.why }) : p.why);
      return 0;
    }
    const c = zoneContext(root, m, p.zone, p.picked);
    if (flags.has("--json")) out(JSON.stringify(c));
    else {
      const names = (ns) => ns.length ? ns.map((n) => n.zone).join(", ") : "none";
      out([
        `${c.zone.id} \u2014 ${c.picked.note}`,
        `Files: ${c.zone.files.length} \xB7 ${c.zone.loc} lines \xB7 ${c.zone.fanIn} importing file(s)`,
        `Imported by: ${names(c.inbound)}`,
        `Imports: ${names(c.outbound)}`,
        `Entry hints: ${c.entryHints.length ? c.entryHints.map((h) => h.file).join(", ") : "none"}`
      ].join("\n"));
    }
    return 0;
  }),
  visualize: guarded((root, args) => {
    const sbFile = valueOf(args, "--storyboard");
    const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--storyboard");
    const json = args.includes("--json");
    const cached = args.includes("--cached");
    if (!positional[0] || !cached && !sbFile) {
      err('Usage: visualize "<zone>" --storyboard <file.json> [--json] | visualize "<zone>" --cached [--json]');
      return 2;
    }
    const m = buildMap(root);
    const p = pickZone(m, root, positional[0]);
    if (!p.zone) {
      err(p.why);
      return 1;
    }
    const z = p.zone;
    const rel = (path) => relative4(root, path).split("\\").join("/");
    const ready = (path, scenes, fromCache) => {
      if (json) out(JSON.stringify({ path, rel: rel(path), scenes, cached: fromCache }));
      else out(`Animation ready${fromCache ? " (unchanged code, reused)" : ""}: ${rel(path)} \u2014 open it in your browser.`);
    };
    const date = (/* @__PURE__ */ new Date()).toISOString();
    ensureUnderstandingIgnore(root);
    if (cached) {
      const r2 = reusableVisual(root, m, z);
      if (!("saved" in r2)) {
        out(json ? JSON.stringify({ cached: false, reason: r2.reason }) : `No reusable animation: ${r2.reason}.`);
        return 0;
      }
      const page = rerender(root, z, r2.saved, date.slice(0, 10));
      ready(page.path, page.scenes, true);
      return 0;
    }
    let raw;
    try {
      const fromCwd = resolve3(sbFile);
      raw = JSON.parse(readFileSync14(existsSync4(fromCwd) ? fromCwd : resolve3(root, sbFile), "utf8"));
    } catch (e) {
      err(`Invalid storyboard: storyboard: could not read ${sbFile} as JSON (${e.message.split("\n")[0]})`);
      return 2;
    }
    let sb;
    try {
      sb = checkStoryboard(raw, storyboardContextFor(root, m, z.zone.id));
    } catch (e) {
      if (!(e instanceof StoryboardError)) throw e;
      err(`Invalid storyboard: ${e.message}`);
      return 2;
    }
    const r = renderVisual(sb, liveZone(z), date.slice(0, 10));
    const paths = saveVisual(root, { zone: z.zone.id, date, fingerprint: visualFingerprint(root, z.zone.files, sb), storyboard: sb }, r.html);
    ready(paths.html, r.scenes, false);
    return 0;
  }),
  pick: guarded((root, args) => {
    const m = buildMap(root);
    const top = m.top[0];
    const unclear = m.unclearCritical[0];
    const pick = top ? { zone: top, why: top.reason } : unclear ? { zone: unclear, why: `${unclear.reason} \xB7 critical, but there is not enough evidence to say who understands it` } : { zone: null, why: "Nothing stands out: no zone is both critical and poorly understood." };
    out(parseArgs(args).flags.has("--json") ? JSON.stringify(pick) : pick.zone ? `${pick.zone.zone.id} \u2014 ${pick.why}` : pick.why);
    return 0;
  })
};
async function main(argv) {
  const [name, ...rest] = argv;
  const cmd = name ? commands[name] : void 0;
  if (!cmd) {
    err(`Usage: umap <${Object.keys(commands).join("|")}> [options]`);
    return 2;
  }
  return cmd(rest);
}
function isDirectRun() {
  if (!process.argv[1]) return false;
  let path = process.argv[1];
  try {
    path = realpathSync4(path);
  } catch {
  }
  return import.meta.url === pathToFileURL(path).href;
}
if (isDirectRun()) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
export {
  commands,
  main,
  optionalReviews
};
