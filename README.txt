Helin & Fatih — AI Demo (Web + Backend)

Bu paket:
- public/ : HTML/CSS/JS arayüz
- server.js : Express backend + OpenAI entegrasyonu
- /api/helin : aylık yorum JSON
- /api/fatih : rüya yorumu JSON

Kurulum:
1) Node.js 18+ kurulu olsun
2) Klasörde:
   npm install
3) OpenAI anahtarını ortam değişkeni olarak ver:
   - macOS/Linux:
       export OPENAI_API_KEY="xxx"
       export OPENAI_MODEL="gpt-4.1-mini"  (opsiyonel)
   - Windows PowerShell:
       setx OPENAI_API_KEY "xxx"
       setx OPENAI_MODEL "gpt-4.1-mini"
   Sonra terminali kapat-aç.

4) Çalıştır:
   npm start
5) Aç:
   http://localhost:3000

Not:
- API key'i asla HTML içine koyma. Bu demo doğru şekilde backend üzerinden çağırır.
