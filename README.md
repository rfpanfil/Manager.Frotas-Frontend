# Manager.Frotas 🚚

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Tested-2EAD33?logo=playwright&logoColor=white)

**Manager.Frotas** é um sistema SaaS B2B completo para gestão de frotas, controle de compras, estoque e manutenção de veículos, desenvolvido sob uma arquitetura limpa (Domain-Driven Design) e projetado para escalar.

## 🏗 Estrutura do Projeto (Monorepo)
Este repositório contém o código completo da aplicação, dividido em dois ecossistemas principais:

- 📂 **/backend**: API RESTful robusta construída em Python (FastAPI). Responsável pelas regras de negócio, multi-tenancy (SaaS), segurança RBAC, e integração com banco de dados relacional PostgreSQL via SQLAlchemy.
- 📂 **/frontend**: Aplicação SPA rica (React + Vite), focada em UX/UI com Zustand para controle de estado local, React Query para caching e integração visual moderna para desktops industriais.

## 🎯 Módulos Principais
- **Dashboards:** KPIs financeiros e métricas operacionais de veículos em tempo real.
- **Módulo de Compras:** Solicitações, Cotações (comparativo de preços dinâmico), Ordens de Compra e Recebimentos.
- **Gestão de Estoque:** Cadastro e movimentação de peças (unidades, litros) e componentes seriados (pneus).
- **Gestão de Frota:** Controle de chassi, eixos (visual interativo), check-lists de manutenção e planos de revisão preditiva.
- **Roteirização e Mapa:** Acompanhamento via mapas, otimizador de rotas com base em endereços, etc.
- **Controle Administrativo:** Matriz de acessos e permissões (RBAC) extremamente detalhada.

## 🧪 Testes E2E (Automação de Qualidade)
Este projeto é coberto por robôs de Automação de Interface (Playwright) localizados na sub-pasta rontend/e2e-tests. 
A suíte garante a integridade dos módulos essenciais a cada modificação, varrendo logins, permissões e telas vitais simulando um usuário humano contra a nuvem.

---
*Este é um projeto proprietário (Portfólio de Engenharia de Software).*
