// Plain-language copy about what RAISE is and how it works. Used on the
// landing page and in the About panel so both always say the same thing.

export const HOW_IT_WORKS =
  'Describe your AI use in one sentence. See what applies. Work through it. Keep the record.';

export const WHAT_RAISE_IS_NOT =
  'It does not decide whether you are compliant. It does not replace your IRB, General Counsel, or university policy. Its data scan can miss things.';

// Checked against the code: the checklist, suggested answers, Quick Add, and
// data scans are all fixed rules (keyword and pattern matching). No external
// AI service is called anywhere in the app.
export const HOW_IT_DECIDES =
  'RAISE uses fixed rules drawn from FERPA, the Common Rule, and the NIST AI Risk Management Framework. It does not use an AI model to judge your activity and does not send your text to an AI service.';

// Checked against api/views/verification.py: uploads are read in memory and
// not saved. Django writes uploads larger than about 2.5 MB to a temporary
// file during the request and deletes it afterward.
export const DATA_HANDLING =
  'Files you upload for a scan are processed during the request and are not saved. Large files may be held in a temporary file while the scan runs, then deleted. RAISE keeps only the result text you choose to record, such as which columns were flagged.';

export const DATA_HANDLING_ADVICE =
  'Use the sample files or made-up data only. Do not upload real student records.';

export const PROTOTYPE_STATUS = 'Research prototype. Sample data only.';

// One line under Status in the landing page About section.
export const WHAT_RAISE_DOES_NOT =
  'RAISE suggests what to check and keeps your record. It does not decide compliance or replace your IRB or university policy.';
