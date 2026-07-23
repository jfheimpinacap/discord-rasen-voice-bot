# Discord Rasen Voice Bot

Bot de Discord en TypeScript para administrar, en etapas, canales de voz temporales. El proyecto está en el **Prompt 003**: incluye persistencia Prisma/SQLite, infraestructura de comandos slash y el comando administrativo `/setup`.

## Estado actual

`/setup` prepara por servidor la estructura base siguiente y guarda sus snowflakes como texto en `GuildConfiguration`:

```text
CANALES PÚBLICOS
  └─ ➕ Crear canal público
CANALES PRIVADOS
  └─ 🔒 Crear canal privado
```

Las categorías llamadas privadas todavía no aplican overwrites especiales. Los dos generadores son canales de voz normales; crear canales temporales al entrar, mover usuarios, limpieza de canales vacíos, paneles y privacidad individual quedan reservados para el Prompt 004.

El comando solo funciona dentro de un servidor y exige **Gestionar servidor** al administrador. Antes de modificar Discord, el bot verifica **Ver canales**, **Gestionar canales** y **Conectar**. La respuesta es efímera. Es idempotente: valida los IDs configurados y su tipo/ubicación, reutiliza recursos válidos, busca de forma conservadora coincidencias únicas por nombre y crea solo los recursos faltantes. Si falla antes de persistir, no hace `upsert` y elimina únicamente los recursos que creó en esa misma ejecución.

## Tecnologías

- Node.js 20+, TypeScript ESM/NodeNext y discord.js.
- Prisma ORM con SQLite para desarrollo local.
- Zod, dotenv y Pino.
- ESLint, Prettier y Vitest.

## Variables de entorno

Copie `.env.example` a `.env` y complete valores reales localmente; no los suba al repositorio.

| Variable | Descripción |
| --- | --- |
| `DISCORD_TOKEN` | Token secreto del bot. |
| `DISCORD_CLIENT_ID` | Snowflake textual de la aplicación. |
| `DISCORD_GUILD_ID` | Snowflake textual del servidor de desarrollo. |
| `DATABASE_URL` | URL SQLite; `file:./dev.db` se resuelve desde `prisma/schema.prisma`. |
| `LOG_LEVEL` / `NODE_ENV` | Configuración segura de logging y entorno. |

## Procedimiento local

No ejecute el bot ni registre comandos hasta autorizar una prueba manual. El procedimiento previsto es:

1. Configurar `.env`.
2. Instalar dependencias: `npm install`.
3. Generar Prisma Client: `npm run prisma:generate`.
4. Aplicar las migraciones versionadas existentes: `npm run db:deploy`.
5. Ejecutar validaciones: `npm run validate`.
6. Registrar manualmente los comandos: `npm run commands:register`.
7. Iniciar el bot solo cuando se autorice una prueba manual.

`npm run commands:register` realiza una operación real en Discord, usa `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` y `DISCORD_TOKEN`, y publica exclusivamente comandos del servidor de desarrollo mediante la ruta guild-scoped. No forma parte de instalación, compilación ni validación.

## Comandos npm

| Comando | Descripción |
| --- | --- |
| `npm run dev`, `npm run build`, `npm run start` | Desarrollo, compilación y arranque. |
| `npm run lint`, `npm run format:check`, `npm run format`, `npm run test`, `npm run validate` | Calidad local sin modificar Discord. |
| `npm run prisma:generate`, `npm run prisma:validate`, `npm run db:deploy` | Cliente, esquema y migraciones existentes. |
| `npm run commands:register` | Registro manual de slash commands en el servidor de desarrollo. |

## Estructura

```text
prisma/                                  Esquema y migración inicial versionada.
src/config/env.ts                        Carga y validación de entorno.
src/database/                            Prisma y repositorios tipados.
src/discord/client.ts                    Fábrica del único cliente Discord.
src/discord/commands/                    Contrato, registro y definición de /setup.
src/discord/interactions.ts              Despacho seguro de interactionCreate.
src/scripts/register-commands.ts         Registro REST manual por servidor.
src/index.ts                             Coordinación de arranque y cierre.
tests/                                   Pruebas unitarias aisladas.
```
