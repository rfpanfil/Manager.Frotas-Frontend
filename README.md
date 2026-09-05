# Manager.Frotas 🚚

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Tested-2EAD33?logo=playwright&logoColor=white)

**Manager.Frotas** é um ecossistema SaaS B2B corporativo para gestão de frotas, controle de compras, estoque e manutenção de veículos, construído com foco em escalabilidade, clean code e segurança de dados.

## 🧪 Ambiente de Demonstração
Acesse o frontend hospedado na Vercel: **[https://manager-frotas-frontend.vercel.app](https://manager-frotas-frontend.vercel.app)**

🔐 **Credenciais de Acesso (Mock):**
Utilize o atalho **"Preencher com Usuário Demo"** na tela de Login para acesso rápido via bypass seguro.
> *Nota: O banco de dados relacional sofre wipes (reset) programados para manter a integridade do portfólio.*

## 🛠️ Stack Tecnológico

**Frontend**
- **Framework:** React 18 + Vite
- **Gestão de Estado & Fetching:** Zustand (Global State) e React Query (Caching e Stale-while-revalidate)
- **Estilização & UI:** Componentização moderna e responsiva focada em Dashboards B2B
- **Deploy:** Vercel

**Backend**
- **Framework:** Python + FastAPI (Alta performance e assíncrono)
- **Banco de Dados:** PostgreSQL Serverless (Hospedado na Neon.tech)
- **ORM & Conexão:** SQLAlchemy
- **Segurança:** Autenticação JWT, Passlib (Bcrypt) e mitigação severa de IDOR

**DevOps & Automação de Qualidade (QA)**
- **Testes E2E:** Playwright (Suíte completa cobrindo fluxos de CRUD e RBAC)
- **Infraestrutura:** Render.com (API) e Vercel (Front)
- **Conteinerização:** Docker Ready

## 🏗 Arquitetura e Engenharia (Layered Architecture)
O sistema adota uma separação rígida de responsabilidades:
- **Frontend (SPA):** React com Zustand (State Management) e React Query para cache de dados e stale-while-revalidate. Interface componentizada e responsiva.
- **Backend (API):** FastAPI orientado a serviços. As rotas (Controllers) são anêmicas e atuam apenas como portas HTTP, injetando dependências e delegando a orquestração pesada para a camada de *Services*.

## 🛡️ Segurança e Governança (Zero Trust)
A infraestrutura foi desenhada para resistir a ataques comuns (OWASP):
- **Zero Trust:** A interface React é tratada apenas como uma camada de apresentação. Absolutamente todas as validações de papéis (RBAC) ocorrem no backend via dependências (`Depends(get_current_user)`).
- **Isolamento de Tenant (SaaS):** Prevenção severa contra IDOR (Insecure Direct Object Reference). As queries do SQLAlchemy obrigatoriamente filtram os dados pela `empresa_id` vinculada ao token JWT do usuário, garantindo que os dados de uma frota jamais vazem para outra.
- **Gestão de Segredos:** Remoção estrita de arquivos `.env` do controle de versão. Credenciais, strings do PostgreSQL (Neon.tech) e JWT Secrets são injetados puramente via ambiente.

## 🏆 Desafios Técnicos Vencidos
1. **Automação E2E com Busca Cega:** Para garantir regressão zero, a suíte do Playwright foi programada para ignorar classes CSS (que são voláteis) e utilizar *Role-Based Locators* (ex: buscar pelo papel de botão ou texto), simulando exatamente a acessibilidade de um usuário humano na esteira de CI/CD.
2. **Concorrência de Estoque:** Lidar com a lógica de baixa de peças em tempo real exigiu transações atômicas no PostgreSQL para evitar *race conditions* quando múltiplos mecânicos requisitam a mesma peça simultaneamente.

## 🎯 Módulos Principais
- **Dashboards:** KPIs financeiros e operacionais.
- **Compras & Estoque:** Cotações dinâmicas, Ordens de Compra, controle de peças em litros/unidades e serialização (chassi/pneus).
- **Roteirização:** Acompanhamento telemétrico em mapa.

---
*Projeto proprietário - Portfólio de Engenharia de Software.*

