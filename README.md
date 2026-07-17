# Ludus - Quiz Interativo (Estilo Kahoot/Balatro)

O **Ludus** é uma plataforma de quiz em tempo real projetada para engajar turmas, amigos e equipes. Inspirado pela dinâmica frenética do Kahoot e pela estética marcante e neo-brutalista de jogos como *Balatro*, o Ludus torna o ato de responder perguntas uma experiência visualmente rica e incrivelmente rápida.

## 🌟 Principais Recursos

- **Tempo Real com WebSockets:** Sincronização instantânea entre a tela do apresentador (Host) e os celulares dos jogadores usando **Supabase Realtime**. Não é necessário recarregar a página!
- **Setup Inteligente via Markdown (.md):** Adeus aos formulários chatos! O apresentador pode criar quizzes inteiros escrevendo um simples arquivo de texto usando a sintaxe de *Task Lists* do Markdown.
- **UI/UX Neo-Brutalista:** Uma estética única, combinando sombras espessas (box-shadows pesadas), botões coloridos de alto contraste, e o icônico fundo dinâmico inspirado em Balatro.
- **Pontuação Baseada em Tempo:** Quanto mais rápido o jogador responder, mais pontos ele ganha.
- **Leaderboard Instantâneo:** Ao final de cada rodada, o pódio é gerado e as posições de cada jogador são atualizadas no próprio celular.
- **Exportação para Excel:** O apresentador pode baixar um relatório completo das pontuações em formato `.CSV` com apenas um clique no final do jogo.

---

## 🛠️ Tecnologias Utilizadas

- **[Svelte 5](https://svelte.dev/) / [SvelteKit](https://kit.svelte.dev/)**: Framework reativo de altíssimo desempenho.
- **[TailwindCSS](https://tailwindcss.com/)**: Estilização baseada em classes utilitárias para a UI Neo-Brutalista.
- **[Supabase](https://supabase.com/)**: Backend-as-a-Service utilizado para a persistência das salas e canais de WebSockets.
- **Lucide Icons**: Pacote de ícones minimalistas.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) instalado na máquina.
- Um projeto criado no [Supabase](https://supabase.com/).

### 1. Configurando o Banco de Dados (Supabase)
Vá até o painel SQL do seu projeto no Supabase e execute o seguinte script para criar as tabelas necessárias:

```sql
CREATE TABLE rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  pin text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'lobby',
  current_question jsonb
);

CREATE TABLE players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  score integer DEFAULT 0
);
```

### 2. Configurando as Variáveis de Ambiente
Na raiz da pasta `ludus-app`, crie um arquivo chamado `.env` e cole as suas credenciais do Supabase:

```env
PUBLIC_SUPABASE_URL=sua_url_do_supabase_aqui
PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_do_supabase_aqui
```

### 3. Rodando a Aplicação
No seu terminal, dentro da pasta `ludus-app`, execute os comandos:

```bash
# Instalar as dependências
npm install

# Rodar o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no seu navegador!

---

## 📝 Como criar um Quiz (Formato .md)

Crie um arquivo de texto normal com a extensão `.md`. Use `#` para o título da pergunta e `- [ ]` para as opções. Marque a correta com um `x`.

Exemplo:
```markdown
# Qual é a capital do Brasil?
- [ ] São Paulo
- [x] Brasília
- [ ] Rio de Janeiro
- [ ] Salvador

# Qual linguagem usamos no Ludus?
- [ ] React
- [ ] Vue
- [x] Svelte
```
Vá em "Sou Apresentador" na Home do app, arraste esse arquivo e inicie a partida!
