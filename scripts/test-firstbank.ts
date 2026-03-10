const text = `
04-Feb-2026  S76182236  REM:R-1426464991/NYSC 
STATE:JAN2026NRA:CBN:1 Ref000003521420  04-Feb-2026  0.00  77,000.00  77,000.00  S76182236
27-Feb-2026  S76237636  REM:R-1436092704/FGN:
FEDER:LAFEB2026NRA:CBN Ref00000165395  27-Feb-2026  0.00  77,000.00  154,000.00  S76237636
28-Feb-2026  S633391  3229384461:WTax.Pd:28-01-2026to 27-02-2026
Ref28022026S633391  27-Feb-2026  42.59  0.00  153,957.41  S633391
28-Feb-2026  S633391  3229384461:Int.Pd:28-01-2026 to 27-02-2026
Ref28022026S633391  27-Feb-2026  0.00  425.93  154,383.34  S633391
`;

const DATE_PATTERN = `\\d{2}-[A-Za-z]{3}-\\d{4}`;
const AMOUNT_PATTERN = `[\\d,]+[.:]\\d{2}`;

// Trans Date, Ref, Details, Value Date, Withdrawal, Deposit, Balance, Unique Ref
const FIRSTBANK_PATTERN = new RegExp(
    `(${DATE_PATTERN})\\s+(\\S+)\\s+([\\s\\S]{1,800}?)\\s+(${DATE_PATTERN})\\s+(${AMOUNT_PATTERN})\\s+(${AMOUNT_PATTERN})\\s+(${AMOUNT_PATTERN})(?:\\s+\\S+)?`,
    'g'
);

let match;
while ((match = FIRSTBANK_PATTERN.exec(text)) !== null) {
    const [, transDate, ref, desc, valDate, withdrawal, deposit, balance] = match;
    console.log({
        transDate, ref, desc: desc.replace(/\s+/g, ' ').trim(), valDate, withdrawal, deposit, balance
    });
}
