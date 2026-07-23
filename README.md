# Discord Rasen Voice Bot

Base técnica para un bot de Discord orientado a futuras funciones de canales de voz temporales. Esta etapa incorpora persistencia local modular; todavía no crea canales ni registra comandos slash.

## Estado actual

El proyecto está en la fase de **persistencia base con Prisma y SQLite**. Puede conservar configuración por servidor y el registro de canales temporales para uso posterior tras reinicios.

## Tecnologías

- Node.js 20 o superior y TypeScript con ESM/NodeNext.
- discord.js.
- Prisma ORM y SQLite para desarrollo local.
- Zod y dotenv para configuración.
- Pino para logging estructurado.
- ESLint, Prettier y Vitest.

## Configuración inicial de desarrollo

En PowerShell:

```powershell
Copy-Item .env.example .env
# Complete .env con sus valores, sin compartirlos.
npm install
npm run prisma:generate
npm run db:migrate:dev
npm run validate
```

`db:migrate:dev` crea o aplica migraciones durante el desarrollo y puede modificar la base local. `db:deploy` aplica únicamente las migraciones versionadas existentes; es el comando apropiado cuando no se quiere crear una migración nueva.

## Variables de entorno

| Variable            | Descripción                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DISCORD_TOKEN`     | Token secreto del bot. Nunca debe subirse al repositorio.                                                                   |
| `DISCORD_CLIENT_ID` | Snowflake textual de la aplicación de Discord.                                                                              |
| `DISCORD_GUILD_ID`  | Snowflake textual del servidor de desarrollo.                                                                               |
| `DATABASE_URL`      | URL SQLite de Prisma. El ejemplo `file:./dev.db` se resuelve desde `prisma/schema.prisma`, por lo que crea `prisma/dev.db`. |
| `LOG_LEVEL`         | `trace`, `debug`, `info`, `warn`, `error`, `fatal` o `silent`.                                                              |
| `NODE_ENV`          | `development`, `test` o `production`.                                                                                       |

La base SQLite local y sus archivos de diario están excluidos por Git. No se deben versionar bases con datos de desarrollo.

## Modelos de persistencia

- `GuildConfiguration`: una configuración por servidor (`guildId` único), con categorías, canales generadores, demora de borrado de canales vacíos (5 segundos por defecto) y marcas de tiempo.
- `TemporaryVoiceChannel`: registro de cada canal temporal, consultable por servidor y canal; conserva si es `PUBLIC` o `PRIVATE`, y el propietario opcional de un canal privado.

Los snowflakes se almacenan como texto. SQLite no dispone de enums nativos compatibles con Prisma, por lo que `channelType` se persiste como texto y el repositorio expone el tipo estricto `PUBLIC`/`PRIVATE`.

La migración inicial aún debe generarse después de instalar las dependencias, ya que el registro npm no estuvo disponible durante esta preparación. Ejecute `npm run db:migrate:dev -- --name init` de forma local tras completar `.env`; el comando generará los archivos versionables en `prisma/migrations/` y la base local ignorada por Git.

## Comandos

| Comando                   | Descripción                                         |
| ------------------------- | --------------------------------------------------- |
| `npm run dev`             | Ejecuta TypeScript en desarrollo y observa cambios. |
| `npm run build`           | Compila `src` en `dist`.                            |
| `npm run start`           | Ejecuta exclusivamente `dist/index.js`.             |
| `npm run lint`            | Revisa el código con ESLint.                        |
| `npm run format:check`    | Comprueba el formato con Prettier.                  |
| `npm run format`          | Aplica formato con Prettier.                        |
| `npm run test`            | Ejecuta las pruebas unitarias.                      |
| `npm run test:watch`      | Ejecuta Vitest en modo observación.                 |
| `npm run validate`        | Ejecuta formato, lint, pruebas y compilación.       |
| `npm run prisma:generate` | Genera Prisma Client.                               |
| `npm run prisma:format`   | Formatea solamente el esquema Prisma.               |
| `npm run prisma:validate` | Valida el esquema Prisma.                           |
| `npm run db:migrate:dev`  | Crea o aplica migraciones en desarrollo.            |
| `npm run db:deploy`       | Aplica migraciones versionadas sin crear nuevas.    |
| `npm run db:studio`       | Abre Prisma Studio.                                 |

## Estructura

```text
prisma/
  schema.prisma                         Esquema Prisma para SQLite.
src/
  config/env.ts                         Validación y carga de variables de entorno.
  database/prisma.ts                    Cliente Prisma central y desconexión ordenada.
  database/repositories/                Repositorios concretos de persistencia.
  discord/client.ts                     Fábrica del cliente de Discord.
  logging/logger.ts                     Logger central de Pino.
  index.ts                              Arranque, señales y errores del proceso.
tests/
  env.test.ts                           Pruebas de configuración sin conexión externa.
  *-repository.test.ts                  Pruebas de repositorios con dobles tipados.
```

## Alcance aún no implementado

No se incluyen comandos slash ni `/setup`, eventos de voz, creación o eliminación de canales de Discord, movimientos de usuarios, temporizadores, permisos privados, paneles interactivos, recuperación activa, SQL Server, despliegue, Docker, GitHub Actions ni dashboard web.
