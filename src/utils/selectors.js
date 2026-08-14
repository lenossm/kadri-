import { isPastDue } from './format';

export const REVIEW_STATUSES = ['Awaiting Review', 'Changes Requested', 'Approved'];
export const PAYMENT_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue'];
export const PUBLISH_STATUSES = ['Scheduled', 'Ready', 'Published', 'Delivered'];
export const INQUIRY_STATUSES = ['New', 'Reviewing', 'Qualified', 'Converted', 'Declined', 'Archived'];

export function paymentStatus(payment) {
  if (!payment) return 'Draft';
  if (payment.status === 'Paid' || payment.status === 'Draft') return payment.status;
  if (isPastDue(payment.due) && payment.status !== 'Paid') return 'Overdue';
  return payment.status;
}

export function outstandingAmount(payments = []) {
  return payments
    .filter((p) => {
      const status = paymentStatus(p);
      return status !== 'Paid' && status !== 'Draft';
    })
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
}

export function overdueAmount(payments = []) {
  return payments
    .filter((p) => paymentStatus(p) === 'Overdue')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
}

export function clientStats(clientId, { projects = [], payments = [] }) {
  const related = projects.filter((p) => p.clientId === clientId);
  const relatedPay = payments.filter((p) => p.clientId === clientId);
  return {
    active: related.filter((p) => p.stage !== 'Delivered').length,
    completed: related.filter((p) => p.stage === 'Delivered').length,
    outstanding: outstandingAmount(relatedPay),
  };
}

export function projectPayments(projectId, payments = []) {
  const related = payments.filter((p) => p.projectId === projectId);
  const invoiced = related.reduce((s, p) => s + Number(p.amount || 0), 0);
  const paid = related.filter((p) => paymentStatus(p) === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  return { related, invoiced, paid, outstanding: invoiced - paid };
}

export function projectReviews(projectId, reviews = []) {
  return reviews.filter((r) => r.projectId === projectId);
}

export function matchesQuery(haystack, query) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return String(haystack).toLowerCase().includes(q);
}
