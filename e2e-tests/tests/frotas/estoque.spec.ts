import { test, expect } from '@playwright/test';

test.describe('Módulo de Estoque', () => {
  test('Deve acessar as telas de Estoque', async ({ page }) => {
    await page.goto('/estoque');
    await expect(page.locator('text=Estoque').or(page.locator('text=Pneus')).or(page.getByRole('button', { name: /Nova|Adicionar/i })).first()).toBeVisible({ timeout: 15000 });
  });
});
