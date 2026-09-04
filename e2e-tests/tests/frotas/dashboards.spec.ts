import { test, expect } from '@playwright/test';

test.describe('Dashboards e Telas Principais', () => {
  test('Deve renderizar a tela inicial e atalhos', async ({ page }) => {
    await page.goto('/home');
    
    // Procura por qualquer botão ou aba que comprove que a tela carregou
    await expect(page.locator('text=Início').or(page.locator('text=Home')).first()).toBeVisible({ timeout: 15000 });
  });
});
