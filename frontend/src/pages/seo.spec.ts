import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  '/',
  '/simple-website-checkup',
  '/free-website-audit-for-small-business',
  '/convert-more-real-estate-website-visitors',
  '/increase-ecommerce-conversion-rates',
  '/landingpg-aiuxagent',
  '/agency-user-testing',
  '/privacy-policy',
];

const NON_INDEXED_PAGES = [
  '/login',
  '/account',
  '/payment-success',
  '/referral-claim',
  '/waitlist',
];

test.describe('SEO Meta Tag Validation', () => {
  for (const page of PUBLIC_PAGES) {
    test(`should have correct SEO tags on page: ${page}`, async ({ baseURL, page: testPage }) => {
      await testPage.goto(page);

      const canonicalLink = testPage.locator('link[rel="canonical"]');
      await expect(canonicalLink).toHaveAttribute('href', `${baseURL}${page.substring(1)}`);

      const robotsMeta = testPage.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute('content', 'index, follow');
    });
  }

  for (const page of NON_INDEXED_PAGES) {
    test(`should have 'noindex' tag on page: ${page}`, async ({ page: testPage }) => {
      await testPage.goto(page);
      const robotsMeta = testPage.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute('content', 'noindex');
    });
  }
});