import { createProject, parseQuickAddActivity } from '../services/api';

// Quick Add asks for a category. A typed sentence gets the closest one for
// its detected kind of use (keys from constants/activityCategories.js).
const CATEGORY_FOR_USE_CASE = {
  grading: 'grading',
  teaching: 'teaching',
  admin: 'admin',
};

/**
 * Creates an AI use from one sentence, exactly as Quick Add does when the
 * visitor clicks Create: parse the sentence, then create with the detected
 * use case, risk flags, and tools. An example keeps its own short name and
 * category; a typed sentence uses the parsed name.
 * @param {{ sentence: string, name?: string, category?: string }} example
 * @returns {Promise<object>} the created project
 */
export async function buildFromSentence(example) {
  const draft = await parseQuickAddActivity(example.sentence.trim());
  const name = example.name || draft.name;
  const category = example.category || CATEGORY_FOR_USE_CASE[draft.ai_use_case] || 'research';
  return createProject(
    name,
    draft.description,
    draft.ai_use_case,
    draft.suggested_tool_ids || [],
    '',
    '',
    draft.risk_context || {},
    false,
    category,
  );
}
