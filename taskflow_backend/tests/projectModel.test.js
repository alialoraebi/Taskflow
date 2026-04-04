import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import Project from '../src/models/project.js';

describe('Project model schema', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  test('provides defaults for status and progress', () => {
    const project = new Project({ name: 'New Build' });

    expect(project.status).toBe('Planned');
    expect(project.progress).toBe(0);
  });

  test('requires name field', () => {
    const project = new Project({});
    const validationError = project.validateSync();

    expect(validationError.errors.name).toBeDefined();
  });

  test('rejects invalid status values', () => {
    const project = new Project({ name: 'Invalid', status: 'Foo' });
    const validationError = project.validateSync();

    expect(validationError.errors.status).toBeDefined();
  });

  test('enforces progress range between 0 and 100', () => {
    const project = new Project({ name: 'Progress', progress: 120 });
    const validationError = project.validateSync();

    expect(validationError.errors.progress).toBeDefined();
  });
});
