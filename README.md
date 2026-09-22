# Pipeline Lab

Projeto React pequeno para estudar os workflows de CI e CD deste repositorio.

## Rodar localmente

```bash
npm ci
npm run dev
```

## Comandos do CI

```bash
npm run lint
npm run build
```

O workflow `ci.yaml` valida pull requests e pushes em `develop` e `main`. Em pushes para `develop`, ele tambem constroi a imagem Docker e faz um smoke test na porta 8080.

O workflow `cd.yaml` roda apenas em pushes para `main`. Ele prepara o build e publica na Vercel usando `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` e `VERCEL_TOKEN` configurados como secrets do ambiente `production`.

## Docker local

```bash
npm run build
docker build --tag pipeline-lab .
docker run --publish 8080:80 pipeline-lab
```

Abra `http://localhost:8080` para testar o mesmo servidor usado pelo CI.
