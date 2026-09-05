import { test, expect } from '@playwright/test';

test.describe('Módulo de Veículos (CRUD Profundo com Mocks)', () => {
  test('Deve simular o cadastro completo de um Veículo sem afetar o Banco de Dados', async ({ page }) => {
    // 1. MOCK DE API (Proteção de Banco de Dados)
    // Intercepta a requisição POST para a API do backend
    await page.route('**/api/veiculos*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': '*', // Contorna o bloqueio de CORS
          },
          body: JSON.stringify({ id: 999, placa: 'ABC-1234', status: 'ativo' })
        });
      } else {
        await route.continue();
      }
    });

    // 2. NAVEGAÇÃO E ACESSO
    await page.goto('/veiculos');
    
    // Identifica o botão de criar e clica
    const btnNovo = page.getByRole('button').filter({ hasText: /Novo|Cadastrar/i }).first();
    await expect(btnNovo).toBeVisible({ timeout: 15000 });
    await btnNovo.click();

    // 3. PREENCHIMENTO PROFUNDO (O que faltava antes)
    // Localiza os inputs de forma acessível e preenche
    await page.getByPlaceholder(/Placa/i).fill('ABC-1234');
    await page.getByPlaceholder(/Modelo/i).fill('Toyota Hilux');
    await page.getByRole('button', { name: /Salvar|Confirmar/i }).click();

    // 4. VALIDAÇÃO DE SUCESSO (Verifica se a UI reagiu ao mock de sucesso 201)
    await expect(page.getByText(/cadastrado com sucesso/i)).toBeVisible({ timeout: 5000 });
  });
});
