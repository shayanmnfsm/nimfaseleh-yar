const { fixPersianText } = require('../fixer.js');

let totalTests = 0;
let passedTests = 0;
let failures = 0;

function assert(actual, expected, message) {
    totalTests++;
    if (actual === expected) {
        passedTests++;
        console.log(`PASS: ${message}`);
    } else {
        failures++;
        console.error(`FAIL: ${message}\n  Expected: [${expected}]\n  Actual:   [${actual}]`);
    }
}

// 1. arabicChars
assert(fixPersianText('علي كةؤئأإ آ').text, 'علی کهویاا آ', 'Arabic characters mapping (آ unchanged)');

// 2. digits
assert(fixPersianText('٠١٢٣٤٥٦٧٨٩').text, '۰۱۲۳۴۵۶۷۸۹', 'Arabic-Indic digits');

// 5. latinDigits
assert(fixPersianText('123', { latinDigits: true }).text, '۱۲۳', 'Latin digits on');
assert(fixPersianText('123', { latinDigits: false }).text, '123', 'Latin digits off');

// 3a. Verb prefixes
assert(fixPersianText('می شود').text, 'می\u200Cشود', 'Prefix می');
assert(fixPersianText('نمی روم').text, 'نمی\u200Cروم', 'Prefix نمی');
assert(fixPersianText('می می رود').text, 'می می\u200Cرود', 'Double prefix (second joined)');
assert(fixPersianText('می خواهم').text, 'می\u200Cخواهم', 'Prefix می خواهم');

// 3b. Plural
assert(fixPersianText('کتاب ها').text, 'کتاب\u200Cها', 'Plural ها');
assert(fixPersianText('کتاب ها، خوب است').text, 'کتاب\u200Cها، خوب است', 'Plural ها before comma');
assert(fixPersianText('این ها').text, 'این\u200Cها', 'Plural ها after pronoun');

// 3c. Comparative
assert(fixPersianText('بزرگ تر').text, 'بزرگ\u200Cتر', 'Comparative تر');
assert(fixPersianText('بزرگ ترین').text, 'بزرگ\u200Cترین', 'Superlative ترین');

// 3d. Ezafe/Indefinite
assert(fixPersianText('خانه ی من').text, 'خانه\u200Cی من', 'Ezafe ی');
assert(fixPersianText('خانه ای').text, 'خانه\u200Cای', 'Indefinite ای');
assert(fixPersianText('کتابی').text, 'کتابی', 'Word ending in ی (no space) remains unchanged');
assert(fixPersianText('ای دوست').text, 'ای دوست', 'Vocative ای at start remains separate');
assert(fixPersianText('ای کاش').text, 'ای کاش', 'Interjection ای remains separate');
assert(fixPersianText('«، ای کاش»').text, '«، ای کاش»', 'Vocative ای after punctuation remains separate');

// 3e. Clitics
assert(fixPersianText('خانه ام').text, 'خانه\u200Cام', 'Clitic ام');
assert(fixPersianText('خانه شان').text, 'خانه\u200Cشان', 'Clitic شان');
assert(fixPersianText('کتاب مان').text, 'کتاب\u200Cمان', 'Clitic مان');
assert(fixPersianText('کتاب ات').text, 'کتاب\u200Cات', 'Clitic ات');
assert(fixPersianText('کتاب اش').text, 'کتاب\u200Cاش', 'Clitic اش');
assert(fixPersianText('کتاب تان').text, 'کتاب\u200Cتان', 'Clitic تان');

// 3. Non-rules (Never join)
assert(fixPersianText('کتاب را').text, 'کتاب را', 'Word "را" stays separate');
assert(fixPersianText('به خانه').text, 'به خانه', 'Preposition "به" stays separate');
assert(fixPersianText('از خانه').text, 'از خانه', 'Preposition "از" stays separate');
assert(fixPersianText('تمیز کردن').text, 'تمیز کردن', 'Compound verb remains separate');
assert(fixPersianText('ها در اول جمله').text, 'ها در اول جمله', 'Standalone "ها" remains separate');

// 4. Punctuation
assert(fixPersianText('سلام  خوبی؟').text, 'سلام خوبی؟', 'Collapse double spaces');
assert(fixPersianText('خوبی ؟').text, 'خوبی؟', 'Remove space before ؟');
assert(fixPersianText('سلام.خوبی').text, 'سلام. خوبی', 'Add space after .');
assert(fixPersianText('سلام،خوبی').text, 'سلام، خوبی', 'Add space after ،');
assert(fixPersianText('« متن »').text, '«متن»', 'Remove spaces inside guillemets');
assert(fixPersianText('( متن )').text, '(متن)', 'Remove spaces inside parentheses');
assert(fixPersianText('متن...').text, 'متن…', 'Dots to ellipsis');
assert(fixPersianText('متن....').text, 'متن…', '4 dots to ellipsis');
assert(fixPersianText('3.5').text, '3.5', 'Digits around dot (no extra space)');
assert(fixPersianText('  خط دارای فاصله  ').text, 'خط دارای فاصله', 'Trim line start/end');
assert(fixPersianText('خط ۱\n\n\nخط ۲').text, 'خط ۱\n\nخط ۲', 'Collapse 3 newlines to 2');

// 3f. Plural/ezafe chains + vocative guard (review additions)
assert(fixPersianText('کتاب های من').text, 'کتاب\u200Cهای من', 'Plural+ezafe های');
assert(fixPersianText('کتاب هایی').text, 'کتاب\u200Cهایی', 'Plural+ezafe هایی');
assert(fixPersianText('کتاب ها ی من').text, 'کتاب\u200Cهای من', 'Spaced chain ها ی');
assert(fixPersianText('خانه بزرگ تر ی').text, 'خانه بزرگ\u200Cتری', 'Comparative+ezafe تری');
assert(fixPersianText('دختر ی آمد').text, 'دختری آمد', 'Indefinite after تر-ending word');
assert(fixPersianText('گفت ای کاش').text, 'گفت ای کاش', 'Vocative ای کاش after verb stays separate');
assert(fixPersianText('و ای کاش').text, 'و ای کاش', 'Vocative ای کاش after و stays separate');
assert(fixPersianText('گفت ای خدا').text, 'گفت ای خدا', 'Vocative ای خدا after verb stays separate');
assert(fixPersianText('خانه ای دوست داشتنی').text, 'خانه\u200Cای دوست داشتنی', 'Indefinite ای before دوست still joins');
assert(fixPersianText('به site.com برو').text, 'به site.com برو', 'Domain not split');
assert(fixPersianText('U.S.A').text, 'U.S.A', 'Latin abbreviation not split');

// Options disabling
assert(fixPersianText('می شود', { halfSpace: false }).text, 'می شود', 'Option halfSpace: false');
assert(fixPersianText('123', { digits: false }).text, '123', 'Option digits: false');
assert(fixPersianText('علي', { arabicChars: false }).text, 'علي', 'Option arabicChars: false');

// Counts
const res1 = fixPersianText('می شود علي 123', { latinDigits: true });
assert(res1.counts.halfSpace, 1, 'Count halfSpace');
assert(res1.counts.arabicChars, 1, 'Count arabicChars');
assert(res1.counts.latinDigits, 3, 'Count latinDigits');

const res2 = fixPersianText('سلام  ... خوبی ؟');
assert(res2.counts.punctuation, 3, 'Count punctuation (space collapse, dots, space before)');

// Idempotency
const firstFix = fixPersianText('می شود علي ...').text;
const secondFix = fixPersianText(firstFix);
assert(secondFix.text, firstFix, 'Idempotency: text remains same');
assert(secondFix.counts.arabicChars, 0, 'Idempotency: arabicChars count is 0');
assert(secondFix.counts.halfSpace, 0, 'Idempotency: halfSpace count is 0');
assert(secondFix.counts.punctuation, 0, 'Idempotency: punctuation count is 0');

console.log(`\nTOTAL: ${totalTests} tests, ${passedTests} passed, ${failures} failed.`);
process.exit(failures ? 1 : 0);
