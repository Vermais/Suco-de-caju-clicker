# Suco de Caju Clicker

Jogo incremental para navegador. Clique para produzir suco de caju, compre máquinas e melhorias, participe de eventos e renasça para ganhar castanhas permanentes. Os cliques não têm limite de velocidade nem detector de autoclicker. O progresso é salvo automaticamente no navegador e pode ser sincronizado com a conta do álbum.

## Executar

Abra `dist/index.html` no navegador. Para publicar na Vercel, importe este repositório; a configuração em `vercel.json` serve a pasta `dist`.

O jogo usa a mesma conta e o mesmo projeto Supabase do [Álbum Pedro Victor](https://album-pedro-victor.vercel.app/#album).

## Publicar atualizações

Atualize **os dois valores** `gameVersion` em `dist/game.js` e `version` em `dist/version.json` para a mesma versão nova a cada publicação. Abas que carregaram esta versão conferem o arquivo de versão a cada 45 segundos e ao voltar a ficar visíveis. Antes de recarregar, o jogo salva o progresso local e tenta concluir a sincronização da conta. Uma aba aberta antes da introdução desse recurso precisa ser atualizada manualmente uma vez.

## Renascimento e buffs

O prestígio usa produção acumulada, como o Cookie Clicker: comprar máquinas e melhorias não reduz o progresso. Mantemos o primeiro renascimento em 1 bilhão produzido, mas ele rende 5 castanhas. A curva é `floor(5 × raiz_cúbica(produção acumulada / 1 bilhão))`, com entrada mínima de 1 bilhão. 8 bilhões rendem 10 níveis, 27 bilhões rendem 15. Apenas os níveis ainda não conquistados viram novas castanhas. Após renascer exatamente em 1 bilhão, a próxima castanha exige mais 728 milhões produzidos; o custo marginal continua crescente. Sobras entre níveis são preservadas. Kits e produtores iniciais não geram prestígio gratuito.

Cada castanha conquistada dá +1% de bônus, mesmo depois de gastar. A loja agora tem 12 buffs, com preços que dobram por nível: produção, clique, kit inicial, produção ausente, eventos, equipe inicial, sinergia entre produtores, conquistas, fração de produção por clique, frequência de eventos, janela de coleta e limite de horas ausentes. O pacote inicial de produção, kit, clique e produção ausente custa as 5 primeiras castanhas. A equipe inicial só é entregue no próximo renascimento, assim como o kit.

São 18 produtores (4 novos), com 11 patamares de melhorias individuais e sinergias entre produtores vizinhos, além de novas melhorias globais e de clique. As melhorias de 100 e 200 unidades ficaram mais acessíveis.

Salvamentos anteriores preservam saldo, produtores, melhorias, níveis e castanhas. `prestigeBase` migra os níveis já conquistados para uma base compatível com a nova curva e soma a produção da safra atual. Depois de cada rebirth, essa base inclui a produção contabilizada; normalizações posteriores não a recalculam. Os dados adicionais continuam no JSON de salvamento existente, sem alteração de esquema.

## Verificar

Execute `node tests/game-core.test.js` e `node --check dist/game.js`.
