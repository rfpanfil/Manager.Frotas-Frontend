import { test, expect } from '@playwright/test';

test.describe('Módulo Admin e Colaboradores', () => {
  test('Deve acessar a tela de Colaboradores', async ({ page }) => {
    await page.goto('/colaboradores');
    await expect(page.locator('text=Colaborador').or(page.getByRole('button', { name: /Novo|Cadastrar/i })).first()).toBeVisible({ timeout: 15000 });
  });
  
  test('Deve acessar a tela de Permissões', async ({ page }) => {
    await page.goto('/permissoes');
    await expect(page.locator('text=Permissões').or(page.locator('text=Cargo')).or(page.getByRole('button')).first()).toBeVisible({ timeout: 15000 });
  });
});
