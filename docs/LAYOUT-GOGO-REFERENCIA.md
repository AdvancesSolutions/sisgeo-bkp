# Layout SIGEO – Referência Gogo

O layout do SIGEO segue o tema **[Gogo Vite MUI Admin](https://gogo-vite.crealeaf.com/dashboards/default)**.

## Estrutura do layout (shell)

- **Header** fixo no topo (`h-20`, `rounded-b-3xl`): logo, botão menu (mobile), Search, Shortcuts, Notifications, Mode, User.
- **Menu lateral esquerdo**: drawer com itens primários e secundários (conforme `menu-items`).
- **Main**: área de conteúdo com `pt-20` e padding lateral conforme largura do menu.
- **ContentWrapper**: papel transparente, `rounded-xl sm:rounded-4xl`, padding `px-4 py-5 sm:py-6 md:py-8 lg:px-12`, conteúdo em grid opcional (boxed/fluid).
- **Footer**: altura fixa, 3 links centralizados (Sobre, Documentação, Suporte).
- **Background**: `BackgroundWrapper` com `bg-background` em tela cheia.

## Páginas internas (ex.: Dashboard)

No [demo do Gogo](https://gogo-vite.crealeaf.com/dashboards/default):

1. **Primeira linha**: título h1 (“Welcome Laura!”) + breadcrumbs (Home > Dashboards > Default) e, à direita, seletor de período e botões.
2. **Conteúdo em Grid**: uso de `<Grid container spacing={5}>` com seções em `<Grid size={{ ... }}>` (ex.: lg:8 + lg:4, ou 4 colunas de stats).

No SIGEO, o Dashboard replica esse padrão:

- **Primeira linha**: “Bem-vindo, [nome]!” (h1) + breadcrumbs (Início > Dashboard).
- **Segunda linha**: cards de atalho em grid responsivo (xs:12, sm:6, lg:3).
- **Alertas**: quando aplicável (ex.: tarefas em validação), em nova linha em grid.

## Referência visual

- Demo: https://gogo-vite.crealeaf.com/dashboards/default  
- Cores, tipografia e espaçamentos vêm de `style/theme/common.css` e `purple.css` (tema roxo).
