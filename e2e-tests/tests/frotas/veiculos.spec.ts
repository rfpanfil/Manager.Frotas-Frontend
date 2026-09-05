import { test, expect } from '@playwright/test';

test.describe('Módulo de Veículos (CRUD Profundo com Mocks)', () => {
  test('Deve simular o cadastro completo de um Veículo sem afetar o Banco de Dados', async ({ page }) => {
    await page.route('**/api/veiculos*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ id: 999, placa: 'ABC-1234', status: 'ativo' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/veiculos');
    
    const btnNovo = page.getByRole('button').filter({ hasText: /Novo|Cadastrar/i }).first();
    await expect(btnNovo).toBeVisible({ timeout: 15000 });
    await btnNovo.click();

    // 3. PREENCHIMENTO PROFUNDO (COM TODOS OS CAMPOS REQUIRED)
    await page.locator('input[name="placa"]').fill('ABC-1234');
    await page.locator('input[name="modelo"]').fill('Toyota Hilux');
    // A FALHA ESTAVA AQUI: O campo km_atual é "required" no HTML.
    // O navegador estava bloqueando o envio do formulário!
    await page.locator('input[name="km_atual"]').fill('50000');
    
    await page.getByRole('button', { name: /Salvar/i }).click();

    await expect(page.getByText(/Cadastrado!/i).last()).toBeVisible({ timeout: 10000 });
  });
});
