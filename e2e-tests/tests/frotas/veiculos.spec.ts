import { test, expect } from '@playwright/test';

test.describe('Módulo de Veículos', () => {
  test('Deve acessar lista de veículos', async ({ page }) => {
    await page.goto('/veiculos');
    
    // Aguarda carregar qualquer tabela ou lista de veículos (botão novo ou grid)
    await expect(page.getByRole('button').filter({ hasText: /Novo|Cadastrar|Veículo/i }).first()).toBeVisible({ timeout: 15000 });
  });
});
