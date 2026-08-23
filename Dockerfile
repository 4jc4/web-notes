# ---- Build ----
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# O build de produção precisa do contrato OpenAPI mais recente pra
# gerar src/generated/api/ — mesmo artefato que o CI valida em
# ci.yml (git diff --exit-code). Ver docs/deployment.md.
RUN npm run api:generate
RUN npm run build


# ---- Runtime ----
FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# output: 'standalone' (next.config.ts) já inclui um node_modules
# mínimo — nada de `npm ci` na imagem de runtime.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
