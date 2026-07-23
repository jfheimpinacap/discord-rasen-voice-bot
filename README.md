# Discord Rasen Voice Bot

Base técnica inicial para un bot de Discord orientado a futuras funciones de voz. Esta etapa prepara la configuración, el arranque seguro y las herramientas de calidad; no implementa todavía lógica de negocio.

## Estado actual

El proyecto está en la fase de **base técnica inicial**.

## Tecnologías

- Node.js 20 o superior (LTS moderna).
- TypeScript.
- discord.js.
- Zod y dotenv para configuración.
- Pino para logging estructurado.
- ESLint, Prettier y Vitest.

## Requisitos

- Node.js `>=20`.
- npm.

## Instalación local

```powershell
npm install
Copy-Item .env.example .env
```

Complete `.env` con valores propios. **Nunca publique ni suba el token de Discord al repositorio.**

| Variable | Descripción |
| --- | --- |
| `DISCORD_TOKEN` | Token secreto del bot. |
| `DISCORD_CLIENT_ID` | ID numérico (snowflake) de la aplicación de Discord. |
| `DISCORD_GUILD_ID` | ID numérico (snowflake) del servidor de desarrollo. |
| `LOG_LEVEL` | `trace`, `debug`, `info`, `warn`, `error`, `fatal` o `silent`. |
| `NODE_ENV` | `development`, `test` o `production`. |

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Ejecuta TypeScript en modo desarrollo y observa cambios. |
| `npm run build` | Compila `src` en `dist`. |
| `npm run start` | Ejecuta exclusivamente `dist/index.js`. |
| `npm run lint` | Revisa el código con ESLint. |
| `npm run format:check` | Comprueba el formato con Prettier. |
| `npm run format` | Aplica formato con Prettier. |
| `npm run test` | Ejecuta las pruebas unitarias. |
| `npm run test:watch` | Ejecuta Vitest en modo observación. |
| `npm run validate` | Ejecuta formato, lint, pruebas y compilación. |

Para compilar y ejecutar la versión compilada:

```powershell
npm run build
npm run start
```

## Estructura

```text
src/
  config/env.ts       Validación y carga de variables de entorno.
  discord/client.ts   Fábrica del cliente de Discord.
  logging/logger.ts   Logger central de Pino.
  index.ts            Arranque, señales y errores del proceso.
tests/
  env.test.ts         Pruebas de configuración sin conexión externa.
```

## Alcance aún no implementado

No se incluyen canales temporales, movimientos de usuarios, paneles interactivos, comandos slash, persistencia (Prisma/SQLite/SQL Server), reglas de privacidad de canales, despliegue ni dashboard web.
