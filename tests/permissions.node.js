import assert from 'node:assert/strict';
import { CAP, can, filterProjects, roleHas } from '../src/permissions/engine.js';

const editor = {
  kind: 'member',
  role: 'editor',
  status: 'active',
  projectAccess: 'selected',
  assignedProjectIds: ['northline'],
};

assert.equal(roleHas('owner', CAP.PAYMENT_VIEW), true);
assert.equal(can(editor, CAP.PAYMENT_VIEW), false);
assert.equal(can(editor, CAP.REVIEW_UPLOAD, { projectId: 'northline' }), true);
assert.equal(can(editor, CAP.REVIEW_UPLOAD, { projectId: 'meridian' }), false);
assert.equal(can({ ...editor, status: 'suspended' }, CAP.PROJECT_VIEW), false);

const projects = [{ id: 'northline' }, { id: 'meridian' }];
assert.deepEqual(filterProjects(projects, editor).map((p) => p.id), ['northline']);
assert.equal(can({ kind: 'client', clientPerms: { 'review.comment': true } }, 'review.comment'), true);
assert.equal(can({ kind: 'client', clientPerms: {} }, CAP.REVIEW_COMMENT_INTERNAL), false);

console.log('permission engine ok');
