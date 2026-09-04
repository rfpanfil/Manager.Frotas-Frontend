import { test, expect } from '@playwright/test';

test.describe('Módulo de Gastos', () => {
  test('Deve acessar a tela de Gastos', async ({ page }) => {
    await page.goto('/gastos');
    
    // Procura pela aba de Filtros ou botão de Novo
    await expect(page.getByRole('button').filter({ hasText: /Filtro|Novo|Lançar|Adicionar/i }).first()).toBeVisible({ timeout: 15000 });
  });
});
