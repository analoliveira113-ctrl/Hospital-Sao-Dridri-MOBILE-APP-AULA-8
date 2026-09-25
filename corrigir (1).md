# 🚀 Guia Passo a Passo: Do VS Code ao APK com Capacitor e GitHub Actions

---

## 💡 Por que a tela ficou branca no APK anterior?

Em projetos feitos com **React e Vite**, a tela branca acontece por 3 motivos principais:

1. **Caminho absoluto dos arquivos (`base: './'` ausente):**  
   Por padrão, o Vite gera os links dos arquivos como `/assets/index.js`. Dentro do navegador do celular (WebView do Capacitor), caminhos que começam com `/` tentam buscar na raiz do sistema Android e falham. Com `base: './'`, ele busca relativamente dentro do próprio app.
2. **Código React não compilado para a pasta `www`:**  
   O celular Android não entende JSX (`App.jsx`) diretamente. Ele precisa que você rode o build (`npm run build`) para converter tudo em HTML, CSS e JavaScript puro dentro da pasta `www`.
3. **Falta de sincronização do Capacitor (`npx cap sync android`):**  
   O Android só lê o que foi copiado para dentro da pasta `android/app/src/main/assets/public/`.

---

## 🌟 O Novo Fluxo: 100% no VS Code + GitHub Actions

Seguindo o método moderno da aula:
- 💻 **No seu computador (VS Code):** Você só programa, faz o build do Vite e dá `git push`.
- ☁️ **Na nuvem (GitHub Actions):** Os servidores do GitHub instalam o Java, sincronizam o Capacitor, compilam o APK no Gradle e entregam o arquivo `.apk` pronto para download!
- 🚫 **Nada de Android Studio:** Economiza mais de 10 GB de disco e evita travamentos no seu PC!

---

## 📁 Passo 1: Conferir o `vite.config.js` no VS Code

Abra o arquivo `vite.config.js` na raiz da pasta `Ana_Laura`. Ele deve ter a linha `base: './'`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 👈 FUNDAMENTAL para não dar tela branca no celular!
  build: {
    outDir: 'www',
    emptyOutDir: true
  }
});
```
> 💾 *Certifique-se de salvar (`Ctrl + S`).*

---

## 📁 Passo 2: Conferir o `capacitor.config.json`

Abra o arquivo `capacitor.config.json`. Ele deve apontar para a pasta `"www"` e ter o identificador do projeto:

```json
{
  "appId": "br.com.hospitalsaodridri",
  "appName": "Hospital São Dridri",
  "webDir": "www"
}
```
> 💾 *Certifique-se de salvar (`Ctrl + S`).*

---

## 📁 Passo 3: Conferir o script no `package.json`

No arquivo `package.json`, temos o atalho que compila o React e já sincroniza com o Capacitor:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:android": "vite build && npx cap sync android",
    "preview": "vite preview"
  },
```

---

## ☁️ Passo 4: O "Robô da Nuvem" (`.github/workflows/build-apk.yml`)

O arquivo `.github/workflows/build-apk.yml` é a receita de bolo que roda nos servidores do GitHub.  
Garantimos que ele tenha o passo **`npm run build`** antes do `npx cap sync android`:

```yaml
name: Construir APK Android (Capacitor)

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

jobs:
  build:
    name: Gerar APK de Depuracao (Debug)
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Clonar Repositorio
        uses: actions/checkout@v4

      - name: 🟢 Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: 📦 Instalar Dependencias
        run: npm install

      - name: 🏗️ Compilar Projeto Web (React / Vite)
        run: npm run build

      - name: ☕ Configurar Java JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: 🔄 Sincronizar Capacitor com Android
        run: npx cap sync android

      - name: 🔑 Permissao de Execucao do Gradle
        run: chmod +x android/gradlew

      - name: 🔨 Compilar APK com Gradle
        run: |
          cd android
          ./gradlew assembleDebug

      - name: 📤 Publicar APK para Download
        uses: actions/upload-artifact@v4
        with:
          name: meu-aplicativo-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 💻 Passo 5: Testar localmente no Terminal do VS Code

Abra o terminal integrado do VS Code (`Ctrl + '`):

1. **Compilar e sincronizar:**
   ```bash
   npm run build:android
   ```
   *(Você verá a mensagem verde `✓ built in ...ms` e o `Sync finished`).*

---

## 📤 Passo 6: Enviar para o GitHub (`Git Push`)

Agora é só enviar as alterações para disparar o "robô" do GitHub Actions:

### 🔹 Se o repositório já está conectado ao GitHub:
```bash
git add .
git commit -m "fix: corrigindo tela branca com base relativa e build no workflow"
git push origin main
```
*(Se a sua branch principal for `master`, substitua por `git push origin master`).*

### 🔹 Se for a primeira vez enviando para o GitHub (como na aula):
```bash
git init
git add .
git commit -m "feat: configurando capacitor e build apk na nuvem"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

---

## 🎁 Passo 7: Baixar e Instalar o APK Pronto

1. Acesse o seu repositório no **GitHub** pelo navegador.
2. Clique na aba superior **Actions** (ícone de play ▶️).
3. Você verá o workflow em execução: **"Construir APK Android (Capacitor)"**.
4. Aguarde cerca de **2 a 4 minutos** até aparecer o checkmark verde (✅ **Sucesso**).
5. Clique no nome da execução concluída.
6. Role a página até o rodapé, na seção **Artifacts** (Artefatos).
7. Clique em **`meu-aplicativo-apk`** para fazer o download do arquivo `.zip`.
8. Descompacte o arquivo `.zip` no seu computador ou celular para extrair o `app-debug.apk`.
9. Envie para o celular (via WhatsApp Web, Google Drive ou cabo USB) e instale!

---

## ✅ Resultado Final

Ao abrir o aplicativo no celular:
- O WebView carregará os assets relativos `./assets/...` instantaneamente.
- A tela de login e o painel do **Hospital São Dridri** abrirão com todos os estilos e ícones! 🎉
