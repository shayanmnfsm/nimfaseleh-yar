(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.NimFaselehYar = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    const ZWNJ = '\u200C';
    // Persian/Arabic LETTERS only (the broad U+0600-U+06FF block also contains
    // punctuation like ، ؛ ؟ and digits, which must not count as word letters).
    const LETTERS = '\u0621-\u064A\u066E-\u06D3\u06FA-\u06FC\u06FF';

    function fixPersianText(text, options = {}) {
        text = text === null || text === undefined ? '' : String(text);

        const opts = {
            arabicChars: options.arabicChars !== false,
            digits: options.digits !== false,
            halfSpace: options.halfSpace !== false,
            punctuation: options.punctuation !== false,
            latinDigits: !!options.latinDigits
        };

        const counts = {
            arabicChars: 0,
            digits: 0,
            halfSpace: 0,
            punctuation: 0,
            latinDigits: 0
        };

        // 1. arabicChars (explicit escapes: Arabic vs Persian kaf/yeh are visually identical)
        if (opts.arabicChars) {
            const arabicMap = { '\u064A': '\u06CC', '\u0643': '\u06A9', '\u0629': '\u0647', '\u0624': '\u0648', '\u0626': '\u06CC', '\u0623': '\u0627', '\u0625': '\u0627' };
            text = text.replace(/[\u064A\u0643\u0629\u0624\u0626\u0623\u0625]/g, (m) => {
                counts.arabicChars++;
                return arabicMap[m] || m;
            });
        }

        // 2. digits (Arabic-Indic to Persian)
        if (opts.digits) {
            const arabicIndicDigits = '٠١٢٣٤٥٦٧٨٩';
            const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
            text = text.replace(/[٠-٩]/g, (m) => {
                counts.digits++;
                return persianDigits[arabicIndicDigits.indexOf(m)];
            });
        }

        // 5. latinDigits (opt-in)
        if (opts.latinDigits) {
            const latinDigits = '0123456789';
            const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
            text = text.replace(/[0-9]/g, (m) => {
                counts.latinDigits++;
                return persianDigits[latinDigits.indexOf(m)];
            });
        }

        // 3. halfSpace
        if (opts.halfSpace) {
            // a. Verb prefix: (ن?می). The negative lookahead skips a following
            // می/نمی word without consuming it, so «می می رود» still fixes
            // the second prefix.
            const prefixRegex = new RegExp('(^|[^a-zA-Z' + LETTERS + '])(ن?می)[ \\t]+(?!(?:ن?می)(?![a-zA-Z' + LETTERS + ']))([' + LETTERS + ']+)', 'g');
            text = text.replace(prefixRegex, (m, p1, p2, p3) => {
                counts.halfSpace++;
                return p1 + p2 + ZWNJ + p3;
            });

            // b. Merge spaced plural/comparative + ezafe chains («ها ی» → «های»,
            // «تر ی» → «تری») so the suffix rule below can join them.
            const chainRegex = new RegExp('(ها|تر|ترین)[ \\t]+(یی|ی)(?![a-zA-Z' + LETTERS + '])', 'g');
            text = text.replace(chainRegex, (m, p1, p2) => {
                counts.halfSpace++;
                return p1 + p2;
            });

            // c-g. Suffixes (longest first). The vocative «ای» guard skips joining
            // when ای introduces کاش/خدا/جان/عزیز/مردم/رفیق («ای کاش»، «گفت ای خدا»).
            const vocativeNext = new RegExp('^[ \\t]+(کاش|خدا|جان|عزیز|مردم|رفیق)(?![a-zA-Z' + LETTERS + '])');
            const suffixRegex = new RegExp('([' + LETTERS + ']+)[ \\t]+(هایی|های|ترینی|ترین|تری|تر|یی|ای|ی|مان|تان|شان|ام|ات|اش|ها)(?![a-zA-Z' + LETTERS + '])', 'g');
            text = text.replace(suffixRegex, (m, p1, p2, offset, str) => {
                if (p2 === 'ای' && vocativeNext.test(str.slice(offset + m.length))) {
                    return m;
                }
                counts.halfSpace++;
                return p1 + ZWNJ + p2;
            });
        }

        // 4. punctuation
        if (opts.punctuation) {
            // 3 or more dots
            text = text.replace(/\.{3,}/g, () => {
                counts.punctuation++;
                return '…';
            });

            // Remove spaces before . ، ؛ : ؟ ! ) »
            text = text.replace(/[ \t]+([.،؛:؟!)]|»)/g, (m, p1) => {
                counts.punctuation++;
                return p1;
            });

            // Ensure exactly one space AFTER . ، ؛ : ؟ ! when followed by a Persian
            // letter. Latin letters are excluded so domains, emails and
            // abbreviations (site.com, U.S.A) are never split.
            text = text.replace(/([.،؛:؟!])[ \t]*(?=[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FC\u06FF])/g, (m, p1) => {
                const res = p1 + ' ';
                if (res !== m) counts.punctuation++;
                return res;
            });

            // Remove spaces inside guillemets and parentheses
            const insidePunc = [ [/«[ \t]+/g, '«'], [/[ \t]+»/g, '»'], [/\([ \t]+/g, '('], [/[ \t]+\)/g, ')'] ];
            insidePunc.forEach(([reg, rep]) => {
                text = text.replace(reg, () => {
                    counts.punctuation++;
                    return rep;
                });
            });

            // Collapse 2+ consecutive spaces/tabs
            text = text.replace(/[ \t]{2,}/g, () => {
                counts.punctuation++;
                return ' ';
            });

            // Trim start/end of every line
            let lines = text.split('\n');
            text = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed !== line) counts.punctuation++;
                return trimmed;
            }).join('\n');

            // Collapse 3+ newlines into 2
            text = text.replace(/\n{3,}/g, () => {
                counts.punctuation++;
                return '\n\n';
            });
        }

        return { text, counts };
    }

    return { fixPersianText };
}));
