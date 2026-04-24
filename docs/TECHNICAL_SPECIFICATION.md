# Technical Specification: VKR-IP

## 1. Purpose

`VKR-IP` is a web platform for accounting, analyzing, and valuing intellectual property assets. The system supports a unified IP register, AI-assisted valuation workflows, document generation, deadline tracking, and a frontend dashboard for operational visibility.

## 2. Goals

- Automate collection and storage of intellectual property data.
- Support expert valuation of IP assets using income-based methodology.
- Reduce manual work for legal and business users through guided interviews and generated reports.
- Provide a web interface for analytics, asset management, and valuation scenarios.
- Maintain a deployable production environment based on Docker and Nginx.

## 3. System Scope

The project includes:

- A `FastAPI` backend with business logic, persistence, reporting, and API endpoints.
- A `Next.js` frontend with pages for valuation, asset registry, and dashboard visualizations.
- A `PostgreSQL` database for domain data storage.
- Docker-based local and production deployment definitions.

The project does not include:

- Native mobile clients.
- External billing or payment processing.
- Multi-tenant separation for different organizations.

## 4. Target Users

- Legal specialists working with intellectual property.
- Business analysts evaluating commercial potential of IP assets.
- Administrators maintaining the system and deployment.
- Project supervisors or academic reviewers demonstrating the platform's functionality.

## 5. Functional Requirements

### 5.1 IP Asset Registry

- The system shall store IP objects with their type, status, descriptive metadata, and related files.
- The system shall support multiple asset categories, including software, databases, trademarks, and inventions.
- The system shall display asset lists and asset details in the frontend.

### 5.2 AI-Assisted Valuation

- The system shall provide an interview-driven valuation flow.
- The system shall collect legal, financial, and contextual factors affecting value.
- The system shall calculate valuation outputs using the `Relief from Royalty` and `DCF` approach.
- The system shall support risk weighting and scenario-based interpretation.
- The system shall present valuation results in the frontend and prepare them for export.

### 5.3 Reporting

- The system shall generate valuation reports in document form.
- The system shall include calculation rationale, supporting factors, and source inputs in generated reports.
- The system shall preserve data needed for auditability of valuation conclusions.

### 5.4 Dashboard and Analytics

- The system shall provide a dashboard page with key metrics and visual charts.
- The system shall visualize portfolio structure and value distribution.
- The system shall show summary indicators for users reviewing the current state of the IP portfolio.

### 5.5 Deadlines and Knowledge Base

- The system shall support tracking of legally relevant deadlines related to IP management.
- The system shall store and expose knowledge-base materials used in the project domain.

### 5.6 Administration and Operations

- The system shall run in Docker containers for backend, frontend, and database services.
- The system shall expose a production-ready frontend over `Nginx`.
- The system shall support environment-based configuration for secrets, URLs, and external providers.

## 6. Non-Functional Requirements

### 6.1 Reliability

- The application shall restart automatically in production container mode after failure.
- The backend shall expose a health endpoint for operational checks.

### 6.2 Performance

- The frontend shall render core dashboard and valuation pages in a standard desktop browser without blocking initialization errors.
- The backend shall respond to standard CRUD and valuation requests within acceptable interactive latency for demo usage.

### 6.3 Security

- Sensitive configuration shall be provided via environment variables and deployment configuration, not hardcoded in application logic.
- Access to deployment infrastructure shall be restricted to authorized maintainers.
- The project should avoid storing live secrets in committed repository files.

### 6.4 Maintainability

- Backend and frontend code shall remain separated by responsibility.
- Deployment files shall be versioned with the application source.
- Project documentation shall describe local launch and production deployment steps.

## 7. Technology Stack

- Frontend: `Next.js 15`, `React 19`, `TypeScript`, `Recharts`
- Backend: `FastAPI`, `Python 3.11`, `SQLAlchemy`, `Pydantic`
- Database: `PostgreSQL 15`
- Reporting: `reportlab`, `docxtpl`
- Infrastructure: `Docker`, `Docker Compose`, `Nginx`

## 8. Deployment Requirements

### 8.1 Local Environment

- Backend shall run on port `8000`.
- Frontend shall run on port `3000`.
- PostgreSQL shall be available for application persistence.

### 8.2 Production Environment

- The production domain shall be served through `Nginx`.
- The frontend shall use the production API URL exposed through environment configuration.
- The production stack shall be deployable from the repository using `docker-compose.prod.yml`.

## 9. Repository Requirements

- The `main` branch shall reflect the current актуальная application codebase.
- Production state changes that are required for reproducibility shall be synchronized back into `main`.
- Branches used only as temporary server snapshots may be removed after their contents are merged and verified.

## 10. Acceptance Criteria

- The project is cloned and started with Docker according to repository instructions.
- Backend health checks pass in the deployed environment.
- Frontend pages open successfully and render valuation and dashboard functionality.
- The repository contains current production-relevant code in `main`.
- Technical documentation is present in the repository in a readable text format.

## 11. Future Development

- Add role-based access control for multiple user groups.
- Extend valuation scenarios and reporting templates.
- Add more robust test coverage for valuation workflows and dashboard rendering.
- Move deployment secrets fully out of tracked configuration files.
