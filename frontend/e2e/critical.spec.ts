import { test, expect } from "@playwright/test";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

test.describe("Critical E2E flows (Phase 16)", () => {
  test("health check", async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.ok()).toBeTruthy();
  });

  test("product browsing + variant + cart + coupon + shipping", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator("text=فروشگاه")).toBeVisible();
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await firstProduct.click();
    await expect(page.locator("h1")).toBeVisible();
    // variant selector if exists
    const variantBtn = page.locator('button:has-text("گونه")').first();
    if (await variantBtn.isVisible()) await variantBtn.click();
    await page.locator('button:has-text("افزودن به سبد")').first().click();
    await page.goto("/cart");
    await expect(page.locator("text=سبد خرید")).toBeVisible();
    await page.goto("/checkout");
    await expect(page.locator("text=تسویه حساب")).toBeVisible();
  });

  test("wishlist server sync (authenticated)", async ({ page, request }) => {
    // Register a temp user
    const email = `e2e-${Date.now()}@test.local`;
    const reg = await request.post(`${API}/auth/register`, { data: { email, password: "Secret123!", full_name: "E2E" } });
    expect(reg.ok()).toBeTruthy();
    const { access_token } = await reg.json();
    // Wishlist add
    const products = await request.get(`${API}/products?page_size=1`);
    const { items } = await products.json();
    const pid = items[0].id;
    const add = await request.post(`${API}/wishlist/${pid}`, { headers: { Authorization: `Bearer ${access_token}` } });
    expect(add.ok()).toBeTruthy();
    const list = await request.get(`${API}/wishlist`, { headers: { Authorization: `Bearer ${access_token}` } });
    expect((await list.json()).length).toBeGreaterThan(0);
  });

  test("contact form", async ({ page }) => {
    await page.goto("/contact");
    await page.fill('input[name="name"]', "E2E Tester");
    await page.fill('input[name="email"]', "e2e@test.local");
    await page.fill('textarea[name="message"]', "این یک پیام تستی برای بررسی فرم تماس است.");
    await page.click('button:has-text("ارسال پیام")');
    await expect(page.locator("text=پیام شما رسید")).toBeVisible({ timeout: 10000 });
  });
});
