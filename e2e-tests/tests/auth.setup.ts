import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  
  // Utiliza o botão preencher demo para logar mais rápido
  await page.getByRole('button', { name: 'Preencher com Usuário Demo' }).click();
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  
  // Aguarda carregar a home e os requests de rede
  await page.waitForURL('**/home');
  await expect(page.locator('.sidebar-nav')).toBeVisible();

  // Salva o state
  await page.context().storageState({ path: authFile });
});
