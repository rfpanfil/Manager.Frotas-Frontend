# Manager.Frotas

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red.svg)

**Manager.Frotas** é um sistema completo para gestão de frotas, compras e manutenção, desenvolvido sob uma arquitetura limpa (Domain-Driven Design), projetado para escalar.

## 🧪 Ambiente de Demonstração

Para facilitar a avaliação, o sistema conta com dados fictícios (empresa, veículos, ordem de compra) e um banco de dados de demonstração.

Acesse o frontend hospedado na Vercel: **[Link será inserido aqui após o deploy]**

🔐 **Credenciais de Acesso (Mock):**
- **Administrador:** `admin@demo.com` / `Demo@2026`
- **Operador:** `operador@demo.com` / `Demo@2026`
- **Visualizador:** `viewer@demo.com` / `Demo@2026`

> **Nota:** Para evitar conflitos, os dados do banco de demonstração são **resetados automaticamente a cada 6 horas**. Sinta-se à vontade para cadastrar, editar e excluir informações.

## 🏗️ Arquitetura

O projeto adota uma arquitetura rigorosa:

- **Frontend (SPA):** React + Vite. Usa `@tanstack/react-query` para cache eficiente e eliminação de over-fetching.
- **Backend (API REST):** FastAPI focado em performance, com estrutura em camadas (Routers → Schemas → Services).
- **Banco de Dados:** PostgreSQL com SQLAlchemy 2.0. Conexões otimizadas (`pool_pre_ping`) para resiliência em ambientes serverless.

## 🔒 Segurança em Primeiro Lugar (Zero Trust)

- **Controle de Acesso Baseado em Função (RBAC):** Proteção dupla no Frontend (ocultação de componentes via `useCan`) e no Backend (validação de token via API Guard).
- **Hardening:** Senhas hasheadas via `bcrypt`, Rate Limiting (`slowapi`) para mitigar força bruta e Security Headers contra XSS.
- **Isolamento de Dados (IDOR Protection):** As consultas backend injetam validações em nível de banco baseadas na propriedade dos dados pelo `current_user`.

## 🚀 Como Rodar Localmente (Frontend)

1. **Clone o repositório:**
   `ash
   git clone https://github.com/rfpanfil/Manager.Frotas-Frontend.git
   cd Manager.Frotas-Frontend
   `

2. **Instale as dependências:**
   `ash
   npm install
   `

3. **Inicie o servidor de desenvolvimento:**
   `ash
   npm run dev
   `
   O frontend estará disponível em http://localhost:3000.

*(Nota: O backend de produção deste projeto possui código privado para proteger a lógica de negócios. O frontend consome a API de demonstração na nuvem).*

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
