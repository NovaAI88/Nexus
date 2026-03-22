/**
 * initialState.js — Departments
 * Seed data for the department model.
 * Used on first load when localStorage contains no department data.
 * Reflects real company structure as of 2026-03-22.
 *
 * Structure:
 *   Department owns one or more Projects.
 *   Projects reference their Department via departmentId.
 */

export const INITIAL_DEPARTMENTS = [
  {
    id: 'nexus',
    name: 'NEXUS',
    label: '02_NEXUS',
    description: 'Mission control system and daily operating layer.',
    status: 'active',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'hephaestus',
    name: 'HEPHAESTUS',
    label: '03_HEPHAESTUS',
    description: 'Build department. Owns all technical projects.',
    status: 'active',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'xenon',
    name: 'XENON',
    label: '04_XENON',
    description: 'Distribution department. Owns all growth and content projects.',
    status: 'active',
    createdAt: '2026-03-20T00:00:00.000Z',
  },
];

export const DEPARTMENTS_STORAGE_KEY = 'nexus:departments';
