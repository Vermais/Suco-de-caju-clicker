# Suco de Caju Clicker

Jogo incremental para navegador. Clique para produzir suco de caju, compre máquinas e melhorias, participe de eventos e renasça para ganhar castanhas permanentes. Os cliques não têm limite de velocidade nem detector de autoclicker. O progresso é salvo automaticamente no navegador e pode ser sincronizado com a conta do álbum.

## Executar

Abra `dist/index.html` no navegador. Para publicar na Vercel, importe este repositório; a configuração em `vercel.json` serve a pasta `dist`.

O jogo usa a mesma conta e o mesmo projeto Supabase do [Álbum Pedro Victor](https://album-pedro-victor.vercel.app/#album).

## Publicar atualizações

Atualize **os dois valores** `gameVersion` em `dist/game.js` e `version` em `dist/version.json` para a mesma versão nova a cada publicação. Abas que carregaram esta versão conferem o arquivo de versão a cada 45 segundos e ao voltar a ficar visíveis. Antes de recarregar, o jogo salva o progresso local e tenta concluir a sincronização da conta. Uma aba aberta antes da introdução desse recurso precisa ser atualizada manualmente uma vez.

## Renascimento e buffs

O renascimento usa somente `state.juice`, o saldo atual disponível na conta. Produção histórica (`allTime`), produção da safra (`runProduced`) e a antiga `prestigeBase` não entram no cálculo. Sem castanhas conquistadas, o primeiro renascimento exige 1 bilhão em saldo e rende 5 castanhas; 8 bilhões rendem 10 e 27 bilhões rendem 15. Para `E` castanhas já conquistadas, `N` novas exigem `8 milhões × ((E + N)³ − E³)` copos em saldo, com mínimo de 1 bilhão quando `E = 0`. Depois de conquistar 5 castanhas, a próxima exige 728 milhões em saldo; depois de 6, exige 1,016 bilhão. Gastar copos reduz a recompensa disponível. Gastar castanhas não reduz o custo crescente. O renascimento consome o saldo, sem carregar sobras para a safra seguinte; somente o Kit de recomeço fornece o novo saldo inicial.

Cada castanha conquistada dá +1% de produção, mesmo depois de gastar. A loja tem 12 buffs com preços que dobram por nível. Produção e clique permanentes dão +10% **aditivos** por nível, até +100%, sem a antiga curva exponencial. Kit inicial dobra por nível. Cooperativa dá +0,5% por tipo e nível; Pulso industrial acrescenta +0,1% de CpS por nível. Conquistas só aumentam a produção através da linha Aroma (4% de aroma por conquista), sem bônus global gratuito.

## Economia de referência

Referência consultada: [código oficial do Cookie Clicker](https://orteil.dashnet.org/cookieclicker/main.js), em 30/09/2026. Mantemos a regra pedida de renascimento pelo **saldo atual**, com primeiro patamar de 1 bilhão; esse ponto difere do jogo original.

- 18 produtores com os preços e CpS base correspondentes do original, incluindo os seis avançados corrigidos. Cada unidade encarece 15%.
- Melhorias normais em 1, 5, 25, 50, 100, 150 e depois a cada 50 até 600. Fatores de preço iniciais: 10, 50, 500, 50.000, 5 milhões, 500 milhões. Dobram a produção do produtor.
- Espremedores e cliques compartilham os três primeiros dobramentos (100, 500 e 10.000). Depois, a equipe integrada dá bônus por outro produtor, seguindo a linha de dedos do original.
- Cliques começam em 1, sem fração gratuita de CpS. A linha avançada acrescenta 1% de CpS por compra, por 50 mil, 5 milhões, 500 milhões etc., desbloqueada por suco feito manualmente. Os cliques continuam sem limites ou detector de autoclicker.
- Bônus globais entre 1% e 5%; sinergias exigem os dois produtores e progresso avançado, com preço proporcional à dupla.
- Eventos a cada 5–15 minutos, encurtados pelo buff de frequência. O dourado dá produção ×7 por 77 segundos ou `min(saldo × 15%, CpS × 900) + 13`. Chuva e meteoro também respeitam teto pelo saldo e CpS, sem recompensas baseadas no poder de clique.

Saldo, produtores, castanhas e níveis dos jogadores são preservados ao carregar, mas recebem as regras novas. IDs antigos dos patamares extras 10 e 75 migram para 25 e 100, deduplicados; os três antigos dobramentos extras de espremedor migram para as três melhorias de clique, evitando contar o mesmo bônus duas vezes. `handmade` registra apenas produção de cliques na safra; salvamentos anteriores começam esse contador em zero sem remover melhorias já compradas. A antiga `prestigeBase` é descartada. Não há alteração de esquema.

`scripts/balanced-profile.js` gera um perfil administrativo de referência sem conectar ao banco: saldo de 1 bilhão e orçamento máximo de 250 milhões já investidos em produtores e melhorias, sem castanhas, buffs ou renascimentos inflados. Histórico corresponde ao saldo mais o investimento real; conquistas são recalculadas. Sua execução isolada não altera nenhuma conta.

## Verificar

Execute `node tests/game-core.test.js`, `node tests/cloud-sync.test.js`, `node tests/numbers.test.js` e `node --check dist/game.js`.

A interface tem rolagem independente para produtores e loja. Todos os números dinâmicos são abreviados a partir de 1.000, inclusive produção por segundo, quantidades e ranking. A notação segue até vigintilhão e depois usa notação científica. Produções menores que 1.000 preservam duas casas decimais. Conflitos de revisão recarregam o salvamento remoto, sem reenviar um cache antigo após um reset administrativo.

Cliques têm partículas e movimento do copo; compras, eventos, conquistas e renascimentos têm feedback animado. Prefers-reduced-motion desativa os efeitos. O número de partículas simultâneas é limitado apenas para desempenho visual, sem limitar os cliques ou ganhos.
