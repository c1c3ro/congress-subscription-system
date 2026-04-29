# Congress subscription system

Aplicação de **inscrição e gerenciamento** dos congressos (UTI e UTI Ped/Neo), com:

- **Inscrição pública** (`/inscricao-uti`, `/inscricao-utipedneo`)
- **Escolha de workshops** (`/workshops` no painel admin)
- **Identificador** (`/identificador`) para consulta/validação via QR Code
- **Painel administrativo** protegido por login (`/login`)

## Variáveis de ambiente

Use o `.env.local` para configurar Supabase e credenciais do admin. Há um exemplo em `.env.example`.
