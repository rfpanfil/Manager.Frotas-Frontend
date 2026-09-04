import { test, expect } from '@playwright/test';

test.describe('Módulo de Compras', () => {
  test('Deve acessar as telas de Compras', async ({ page }) => {
    await page.goto('/compras');
    await expect(page.locator('text=Compras').or(page.locator('text=Cotações')).or(page.getByRole('button', { name: /Nova/i })).first()).toBeVisible({ timeout: 15000 });
  });
});
