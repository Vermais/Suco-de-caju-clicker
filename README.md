# Suco de Caju Clicker

Jogo incremental para navegador. Clique para produzir suco de caju, compre máquinas e melhorias, participe de eventos e renasça para ganhar castanhas permanentes. Os cliques não têm limite de velocidade nem detector de autoclicker. O progresso é salvo automaticamente no navegador e pode ser sincronizado com a conta do álbum.

## Executar

Abra `dist/index.html` no navegador. Para publicar na Vercel, importe este repositório; a configuração em `vercel.json` serve a pasta `dist`.

O jogo usa a mesma conta e o mesmo projeto Supabase do [Álbum Pedro Victor](https://album-pedro-victor.vercel.app/#album).

## Publicar atualizações

Atualize **os dois valores** `gameVersion` em `dist/game.js` e `version` em `dist/version.json` para a mesma versão nova a cada publicação. Abas que carregaram esta versão conferem o arquivo de versão a cada 45 segundos e ao voltar a ficar visíveis. Antes de recarregar, o jogo salva o progresso local e tenta concluir a sincronização da conta. Uma aba aberta antes da introdução desse recurso precisa ser atualizada manualmente uma vez.

## Renascimento e buffs

O renascimento converte o saldo atual com uma curva cúbica inspirada no Cookie Clicker. Se `E` é o total de castanhas já conquistadas, ganhar `N` novas exige `1 bilhão × ((E + N)³ − E³)` copos em saldo. A primeira exige 1 bilhão; após ela, a próxima exige 7 bilhões; após duas, a próxima exige 19 bilhões. Gastar castanhas não reduz o custo nem permite ganhar novamente o mesmo nível.

Cada castanha conquistada dá +1% de bônus. A loja mantém os cinco buffs permanentes, com custos que triplicam por nível. A produção cresce ×1,25 por nível; o primeiro buff de clique dobra seu valor e os seguintes dão ×1,25. Prêmios de eventos sobem 15% e duração 10% por nível. Castanhas e níveis comprados em versões anteriores são preservados; os efeitos passam a seguir o novo balanceamento.
