import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '../../playwright/.auth/frotas_user.json');

setup('authenticate Frotas', async ({ page }) => {
  setup.setTimeout(120000); 
  
  await page.goto('/login');
  
  const preencherBtn = page.getByRole('button', { name: /Preencher/i }).first();
  await expect(preencherBtn).toBeVisible({ timeout: 30000 });
  await preencherBtn.click();
  
  await page.getByRole('button', { name: /Entrar/i }).first().click();
  
  // Como as vezes exibe toaster ou spinner, vamos esperar um link visível da home page
  await expect(page.locator('text=Início').first()).toBeVisible({ timeout: 80000 });
  
  await page.context().storageState({ path: authFile });
});
