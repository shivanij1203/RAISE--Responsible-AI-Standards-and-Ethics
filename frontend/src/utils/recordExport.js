import { downloadProjectRecord } from '../services/api';
import { generateDisclosure } from './disclosure';
import { saveBlob } from './download';

/**
 * Download the AI use record. The server builds it as real text: a PDF with
 * its title and language set, or an accessible Word file with heading styles.
 * The disclosure statement is the same one the Disclosure button shows.
 * @param {{ project: object, scope?: 'full' | 'mine', format?: 'pdf' | 'docx' }} options
 */
export async function downloadRecord({ project, scope = 'full', format = 'pdf' }) {
  const blob = await downloadProjectRecord(project.id, {
    format,
    scope,
    disclosure: generateDisclosure(project),
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  saveBlob(blob, `${project.name.replace(/\s+/g, '_')}_AI_Use_Record.${format}`);
}
