# Manager.Frotas 🚚

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Tested-2EAD33?logo=playwright&logoColor=white)

**Manager.Frotas** é um sistema SaaS B2B completo para gestão de frotas, controle de compras, estoque e manutenção de veículos, desenvolvido sob uma arquitetura limpa (Domain-Driven Design) e projetado para escalar.

## 🧪 Ambiente de Demonstração

Para facilitar a avaliação técnica, o sistema conta com dados fictícios e um banco de dados de demonstração.

Acesse o frontend hospedado na Vercel: **[https://manager-frotas-frontend.vercel.app](https://manager-frotas-frontend.vercel.app)**

🔐 **Credenciais de Acesso (Mock):**
- O sistema possui um atalho rápido na tela de Login chamado **"Preencher com Usuário Demo"**. Basta clicar nele para carregar as credenciais administrativas e entrar no sistema instantaneamente.

> **Nota:** Para evitar conflitos e manter o portfólio limpo, os dados do banco de demonstração são resetados rotineiramente. Sinta-se à vontade para explorar, cadastrar gastos e rotas.

## 🏗 Arquitetura

O Manager.Frotas utiliza uma separação estrita de camadas (Layered Architecture):

- **Frontend:** React estruturado em componentes SPA com Hooks, Context API e Zustand para controle de estado. Interface rica desenhada para desktops e painéis de controle.
- **Backend:** FastAPI modular. As rotas HTTP servem apenas como "portas" de entrada, delegando toda a lógica de negócios para as camadas de *Services*. Segurança rigorosa com JWT e isolamento Multi-Tenant (SaaS).
- **Banco de Dados:** PostgreSQL relacional.

## 🎯 Módulos Principais
- **Dashboards:** KPIs financeiros e métricas operacionais de veículos em tempo real.
- **Módulo de Compras:** Solicitações, Cotações dinâmicas, Ordens de Compra e Recebimentos.
- **Gestão de Estoque:** Movimentação de peças (unidades, litros) e componentes seriados (pneus).
- **Gestão de Frota:** Controle de chassi, eixos interativos, check-lists e planos de revisão preditiva.
- **Roteirização e Mapa:** Acompanhamento e telemetria.

## 🤖 Testes Automatizados E2E (Playwright)
Este projeto conta com uma suíte de testes ponta a ponta (E2E) construída com **Playwright**, que simula a interação de um usuário real no navegador. A suíte varre logins, permissões e fluxos vitais contra o ambiente de produção para garantir regressão zero.

### Como rodar os testes localmente
1. Navegue até a pasta de testes: cd e2e-tests
2. Instale as dependências: 
pm install
3. Execute a suíte de testes: 
pm run test:e2e

---
*Este é um projeto proprietário (Portfólio de Engenharia de Software).*
