import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('kadri_demo_workspace');
    localStorage.removeItem('kadri_demo_role');
    localStorage.removeItem('kadri-workspace-v1');
  });
});

test('landing opens and enter demo reaches dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/KADRI/);
  await page.getByRole('link', { name: /enter demo/i }).first().click();
  await expect(page).toHaveURL(/\/demo\/dashboard/);
  await expect(page.getByRole('heading', { name: /good morning/i })).toBeVisible();
});

test('primary workspace routes load', async ({ page }) => {
  const routes = [
    ['/demo/dashboard', /good morning/i],
    ['/demo/inquiries', /inquiries/i],
    ['/demo/projects', /projects/i],
    ['/demo/reviews', /reviews/i],
    ['/demo/payments', /payments/i],
    ['/demo/pipeline', /pipeline/i],
    ['/portal/northline', /northline/i],
  ];
  for (const [path, heading] of routes) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  }
});

test('legacy /app/dashboard redirects into demo', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/demo\/dashboard/);
});

test('inquiry converts into a project', async ({ page }) => {
  await page.goto('/demo/inquiries');
  await page.getByRole('button', { name: /new inquiry/i }).click();
  await page.locator('input[name="company"]').fill('Harbor Press');
  await page.locator('input[name="person"]').fill('Nia K.');
  await page.locator('input[name="email"]').fill('nia@harbor.example');
  await page.locator('textarea[name="message"]').fill('Need a short film for the autumn catalogue.');
  await page.getByRole('button', { name: /add inquiry/i }).click();
  await page.locator('.inquiry-row', { hasText: 'Harbor Press' }).click();
  await page.getByRole('button', { name: /turn into project/i }).click();
  await page.getByRole('button', { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/demo\/projects\//);
  await expect(page.getByRole('heading', { name: /harbor press/i })).toBeVisible();
});

test('review comment and approve persist in the room', async ({ page }) => {
  await page.goto('/demo/reviews/review-northline');
  await expect(page.getByText(/northline campaign/i).first()).toBeVisible();
  await page.getByPlaceholder(/leave a precise note/i).fill('Hold the platform two beats longer.');
  await page.getByRole('button', { name: /add comment/i }).click();
  await expect(page.getByText(/hold the platform/i)).toBeVisible();
  await page.getByRole('button', { name: /approve version/i }).click();
  await expect(page.getByText('Approved').first()).toBeVisible();
});
