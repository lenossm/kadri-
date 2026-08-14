import { test, expect } from '@playwright/test';

async function asRole(page, role) {
  await page.addInitScript((r) => {
    localStorage.removeItem('kadri_demo_workspace');
    localStorage.setItem('kadri_demo_role', r);
  }, role);
}

test('editor cannot open payments', async ({ page }) => {
  await asRole(page, 'editor');
  await page.goto('/demo/payments');
  await expect(page.getByRole('heading', { name: /don't have access/i })).toBeVisible();
  await expect(page.getByText(/outstanding/i)).toHaveCount(0);
});

test('editor sees assigned projects only', async ({ page }) => {
  await asRole(page, 'editor');
  await page.goto('/demo/projects');
  await expect(page.getByRole('heading', { name: /northline/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /meridian/i })).toHaveCount(0);
});

test('editor cannot open an unassigned project by URL', async ({ page }) => {
  await asRole(page, 'editor');
  await page.goto('/demo/projects/meridian');
  await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
});

test('finance can open payments and not the review room', async ({ page }) => {
  await asRole(page, 'finance');
  await page.goto('/demo/payments');
  await expect(page.getByRole('heading', { name: /^payments$/i })).toBeVisible();
  await page.goto('/demo/reviews');
  await expect(page.getByRole('heading', { name: /don't have access/i })).toBeVisible();
});

test('client portal never includes internal comments', async ({ page }) => {
  await page.goto('/portal/northline');
  await expect(page.getByRole('heading', { name: 'Northline Campaign', exact: true })).toBeVisible();
  await expect(page.getByText(/prepare two alternatives/i)).toHaveCount(0);
  await expect(page.getByText(/can we hold this frame/i)).toBeVisible();
});

test('login screen is KADRI, not a generic form shell', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  await expect(page.getByText(/KADRI/i).first()).toBeVisible();
});
