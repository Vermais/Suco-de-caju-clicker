# Suco de Caju Clicker

Jogo incremental para navegador. Clique para produzir suco de caju, compre máquinas e melhorias, participe de eventos e renasça para ganhar castanhas permanentes. Os cliques não têm limite de velocidade nem detector de autoclicker. O progresso é salvo automaticamente no navegador e pode ser sincronizado com a conta do álbum.

## Executar

Abra `dist/index.html` no navegador. Para publicar na Vercel, importe este repositório; a configuração em `vercel.json` serve a pasta `dist`.

O jogo usa a mesma conta e o mesmo projeto Supabase do [Álbum Pedro Victor](https://album-pedro-victor.vercel.app/#album).

## Publicar atualizações

Atualize **os dois valores** `gameVersion` em `dist/game.js` e `version` em `dist/version.json` para a mesma versão nova a cada publicação. Abas que carregaram esta versão conferem o arquivo de versão a cada 45 segundos e ao voltar a ficar visíveis. Antes de recarregar, o jogo salva o progresso local e tenta concluir a sincronização da conta. Uma aba aberta antes da introdução desse recurso precisa ser atualizada manualmente uma vez.

## Renascimento e buffs

O renascimento usa somente `state.juice`, o saldo atual disponível na conta. Produção histórica (`allTime`), produção da safra (`runProduced`) e a antiga `prestigeBase` não entram no cálculo. Sem castanhas conquistadas, o primeiro renascimento exige 1 bilhão em saldo e rende 5 castanhas; 8 bilhões rendem 10 e 27 bilhões rendem 15. Para `E` castanhas já conquistadas, `N` novas exigem `8 milhões × ((E + N)³ − E³)` copos em saldo, com mínimo de 1 bilhão quando `E = 0`. Depois de conquistar 5 castanhas, a próxima exige 728 milhões em saldo; depois de 6, exige 1,016 bilhão. Gastar copos reduz a recompensa disponível. Gastar castanhas não reduz o custo crescente. O renascimento consome o saldo, sem carregar sobras para a safra seguinte; somente o Kit de recomeço fornece o novo saldo inicial.

Cada castanha conquistada dá +1% de bônus, mesmo depois de gastar. A loja agora tem 12 buffs, com preços que dobram por nível: produção, clique, kit inicial, produção ausente, eventos, equipe inicial, sinergia entre produtores, conquistas, fração de produção por clique, frequência de eventos, janela de coleta e limite de horas ausentes. O pacote inicial de produção, kit, clique e produção ausente custa as 5 primeiras castanhas. A equipe inicial só é entregue no próximo renascimento, assim como o kit.

São 18 produtores (4 novos), com 15 patamares de melhorias individuais e sinergias entre produtores vizinhos, além de novas melhorias globais e de clique. Os preços de melhorias individuais seguem patamares progressivos inspirados no Cookie Clicker, com bônus de produção ×2. Melhorias de clique multiplicam por ×2, globais acrescentam entre 5% e 25%, e a linha Aroma aumenta a produção com as conquistas (4% de aroma por conquista). O prestígio aumenta a produção automática em 1% por castanha conquistada; cliques recebem a fração da produção prevista pelas melhorias.

Salvamentos anteriores preservam saldo, produtores, melhorias, níveis e castanhas. A antiga `prestigeBase` é descartada na normalização, sem converter produção passada em recompensa. Os dados continuam no JSON de salvamento existente, sem alteração de esquema.

## Verificar

Execute `node tests/game-core.test.js`, `node tests/cloud-sync.test.js`, `node tests/numbers.test.js` e `node --check dist/game.js`.

A interface tem rolagem independente para produtores e loja. Todos os números dinâmicos são abreviados a partir de 1.000, inclusive produção por segundo, quantidades e ranking. A notação segue até vigintilhão e depois usa notação científica. Produções menores que 1.000 preservam duas casas decimais. Conflitos de revisão recarregam o salvamento remoto, sem reenviar um cache antigo após um reset administrativo.

Cliques têm partículas e movimento do copo; compras, eventos, conquistas e renascimentos têm feedback animado. Prefers-reduced-motion desativa os efeitos. O número de partículas simultâneas é limitado apenas para desempenho visual, sem limitar os cliques ou ganhos.
