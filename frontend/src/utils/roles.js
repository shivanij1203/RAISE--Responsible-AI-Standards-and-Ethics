// Roles that may open the department-wide view. Faculty ('pi') and students,
// including demo visitors, never see it.
const DEPARTMENT_VIEW_ROLES = ['admin', 'compliance'];

/** @param {string | null | undefined} role mapped role from App (pi, student, admin, ...) */
export function canSeeDepartmentView(role) {
  return DEPARTMENT_VIEW_ROLES.includes(role);
}
