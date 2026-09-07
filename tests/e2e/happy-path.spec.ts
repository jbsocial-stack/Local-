import { test, expect } from '@playwright/test';

// Happy path per the PRD's Definition of done: issue-adjacent flow of
// "staff signs in -> scans a customer's pass -> awards points -> balance
// updates". This sandbox has no live Supabase project, so the API layer is
// mocked at the network boundary (page.route) rather than hitting real
// Postgres — the same test drives the real UI and the real client-side
// request/response contract the API routes implement. Point it at a real
// deployment by deleting the route mocks and seeding real data instead.
test('staff signs in, scans a pass, and awards points', async ({ page }) => {
  await page.route('**/api/staff/login', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      townSlug: 'chichester',
      merchantSlug: 'the-roastery',
      pin: '1234',
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'set-cookie': 'regulars_staff_session=e2e-fake-session; Path=/' },
      body: JSON.stringify({ ok: true, role: 'owner' }),
    });
  });

  await page.route('**/api/scan/verify', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ payload: 'pass-123.999.abcdef01' });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        passId: 'pass-123',
        balancePoints: 150,
        displayName: 'Laura',
        visitNumberThisMonth: 3,
      }),
    });
  });

  await page.route('**/api/ledger/earn', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      passId: 'pass-123',
      basketPence: 1240,
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        points: 37,
        multiplier: 3,
        balancePoints: 187,
        ledgerId: 'ledger-1',
      }),
    });
  });

  await page.goto('/m/chichester/the-roastery/login');
  for (const digit of '1234') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }

  await expect(page).toHaveURL(/\/m\/chichester\/the-roastery\/scan$/);

  await page.getByTestId('e2e-qr-input').fill('pass-123.999.abcdef01');
  await page.getByTestId('e2e-qr-submit').click();

  await expect(page.getByText('Laura')).toBeVisible();
  await expect(page.getByText('3rd visit this month')).toBeVisible();
  await expect(page.getByText('£1.50')).toBeVisible();

  await page.getByRole('button', { name: 'Earn' }).click();
  await page.getByPlaceholder('0.00').fill('12.40');
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('+37 pts')).toBeVisible();
  await expect(page.getByText('at 3x')).toBeVisible();
  await expect(page.getByText('New balance: £1.87')).toBeVisible();
});

test('redeem is capped at the customer\'s available balance', async ({ page }) => {
  await page.route('**/api/staff/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'set-cookie': 'regulars_staff_session=e2e-fake-session; Path=/' },
      body: JSON.stringify({ ok: true, role: 'staff' }),
    });
  });

  await page.route('**/api/scan/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        passId: 'pass-456',
        balancePoints: 1500,
        displayName: null,
        visitNumberThisMonth: 1,
      }),
    });
  });

  await page.route('**/api/ledger/redeem', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'insufficient_balance',
        message: 'Customer has £15.00 available',
        availablePence: 1500,
      }),
    });
  });

  await page.goto('/m/chichester/the-roastery/login');
  for (const digit of '1234') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }

  await page.getByTestId('e2e-qr-input').fill('pass-456.999.deadbeef');
  await page.getByTestId('e2e-qr-submit').click();

  await page.getByRole('button', { name: 'Redeem' }).click();
  await page.getByPlaceholder('0.00').fill('20.00');
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('Customer has £15.00 available')).toBeVisible();
});
