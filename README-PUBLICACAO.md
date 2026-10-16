# Hospital São Dridri — versão corrigida

## Executar no computador para testar
1. Instale Node.js 22 ou superior.
2. Crie `.env.local` copiando `.env.example`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave pública (publishable/anon) do projeto Supabase.
4. Execute `npm install` e `npm run dev`.

## Publicar no GitHub Pages
O workflow `.github/workflows/deploy.yml` compila o Vite e publica a pasta `www`.

No GitHub, abra:
**Settings → Secrets and variables → Actions → New repository secret**

Crie estes dois secrets:
- `VITE_SUPABASE_URL` = URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` = chave pública (publishable/anon) do Supabase

Depois envie os arquivos para a branch `main`. Acesse **Actions** e espere o workflow “Publicar Hospital São Dridri no GitHub Pages” terminar com sucesso.

Em **Settings → Pages**, selecione **GitHub Actions** como fonte de publicação.

## URLs de autenticação
O login com Google retorna para:
`https://analoliveira113-ctrl.github.io/Hospital-Sao-Dridri-MOBILE-APP-AULA-8/`

No Supabase, em **Authentication → URL Configuration**, inclua esse endereço nas Redirect URLs. No Google Cloud, mantenha como URI de redirecionamento autorizado o callback do Supabase:
`https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`

Não publique `.env.local`, Client Secret do Google ou chaves privadas. A chave pública do Supabase pode ser usada no frontend; as tabelas precisam ter políticas RLS adequadas.
