import { test, expect } from '@playwright/test';

test.describe('Módulo de Rotas e Rastreamento', () => {
  test('Deve acessar a tela de Rotas', async ({ page }) => {
    await page.goto('/rotas');
    await expect(page.locator('.sidebar-nav').or(page.locator('nav')).first()).toBeVisible({ timeout: 15000 });
  });
});
