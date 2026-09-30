# Suco de Caju Clicker

Jogo incremental para navegador. Clique para produzir suco de caju, compre máquinas e melhorias, participe de eventos e renasça para ganhar castanhas permanentes. Os cliques não têm limite de velocidade nem detector de autoclicker. O progresso é salvo automaticamente no navegador e pode ser sincronizado com a conta do álbum.

## Executar

Abra `dist/index.html` no navegador. Para publicar na Vercel, importe este repositório; a configuração em `vercel.json` serve a pasta `dist`.

O jogo usa a mesma conta e o mesmo projeto Supabase do [Álbum Pedro Victor](https://album-pedro-victor.vercel.app/#album).

## Publicar atualizações

Atualize **os dois valores** `gameVersion` em `dist/game.js` e `version` em `dist/version.json` para a mesma versão nova a cada publicação. Abas que carregaram esta versão conferem o arquivo de versão a cada 45 segundos e ao voltar a ficar visíveis. Antes de recarregar, o jogo salva o progresso local e tenta concluir a sincronização da conta. Uma aba aberta antes da introdução desse recurso precisa ser atualizada manualmente uma vez.

## Renascimento e buffs

O renascimento usa somente `state.juice`, o saldo atual disponível na conta. Produção histórica (`allTime`), produção da safra (`runProduced`) e a antiga `prestigeBase` não entram no cálculo. Sem castanhas conquistadas, o primeiro renascimento exige 1 bilhão em saldo e rende 5 castanhas; 8 bilhões rendem 10 e 27 bilhões rendem 15. Para `E` castanhas já conquistadas, `N` novas exigem `8 milhões × ((E + N)³ − E³)` copos em saldo, com mínimo de 1 bilhão quando `E = 0`. Depois de conquistar 5 castanhas, a próxima exige 728 milhões em saldo; depois de 6, exige 1,016 bilhão. Gastar copos reduz a recompensa disponível. Gastar castanhas não reduz o custo crescente. O renascimento consome o saldo, sem carregar sobras para a safra seguinte; somente o Kit de recomeço fornece o novo saldo inicial.

Cada castanha conquistada dá +1% de produção, mesmo depois de gastar. A loja tem 15 buffs com preços que dobram por nível. Produção e clique permanentes dão +10% **aditivos** por nível, até +100%, sem a antiga curva exponencial. Kit inicial dobra por nível. Cooperativa dá +0,5% por tipo e nível; Pulso industrial acrescenta +0,1% de CpS por nível. Conquistas só aumentam a produção através da linha Aroma (4% de aroma por conquista), sem bônus global gratuito.

## Economia de referência

Referência consultada: [código oficial do Cookie Clicker](https://orteil.dashnet.org/cookieclicker/main.js), em 30/09/2026. Mantemos a regra pedida de renascimento pelo **saldo atual**, com primeiro patamar de 1 bilhão; esse ponto difere do jogo original.

- 22 produtores com os preços e CpS base correspondentes do original, incluindo os seis avançados corrigidos. Cada unidade encarece 15%.
- Melhorias normais em 1, 5, 25, 50, 100, 150 e depois a cada 50 até 600. Fatores de preço iniciais: 10, 50, 500, 50.000, 5 milhões, 500 milhões. Dobram a produção do produtor.
- Espremedores e cliques compartilham os três primeiros dobramentos (100, 500 e 10.000). Depois, a equipe integrada dá bônus por outro produtor, seguindo a linha de dedos do original.
- Cliques começam em 1, sem fração gratuita de CpS. A linha avançada acrescenta 1% de CpS por compra, por 50 mil, 5 milhões, 500 milhões etc., desbloqueada por suco feito manualmente. Os cliques continuam sem limites ou detector de autoclicker.
- Bônus globais entre 1% e 5%; sinergias exigem os dois produtores e progresso avançado, com preço proporcional à dupla.
- Eventos a cada 1,5–3 minutos, encurtados pelo buff de frequência. O dourado dá produção ×7 por 77 segundos ou `min(saldo × 15%, CpS × 900) + 13`. Chuva e meteoro também respeitam teto pelo saldo e CpS, sem recompensas baseadas no poder de clique.

Saldo, produtores, castanhas e níveis dos jogadores são preservados ao carregar, mas recebem as regras novas. IDs antigos dos patamares extras 10 e 75 migram para 25 e 100, deduplicados; os três antigos dobramentos extras de espremedor migram para as três melhorias de clique, evitando contar o mesmo bônus duas vezes. `handmade` registra apenas produção de cliques na safra; salvamentos anteriores começam esse contador em zero sem remover melhorias já compradas. A antiga `prestigeBase` é descartada. Não há alteração de esquema.

`scripts/balanced-profile.js` gera um perfil administrativo de referência sem conectar ao banco: saldo de 1 bilhão e orçamento máximo de 250 milhões já investidos em produtores e melhorias, sem castanhas, buffs ou renascimentos inflados. Histórico corresponde ao saldo mais o investimento real; conquistas são recalculadas. Sua execução isolada não altera nenhuma conta.

## Verificar

Execute `node tests/game-core.test.js`, `node tests/cloud-sync.test.js`, `node tests/numbers.test.js` e `node --check dist/game.js`.

A interface tem rolagem independente para produtores e loja. Todos os números dinâmicos são abreviados a partir de 1.000, inclusive produção por segundo, quantidades e ranking. A notação segue até vigintilhão e depois usa notação científica. Produções menores que 1.000 preservam duas casas decimais. Conflitos de revisão recarregam o salvamento remoto, sem reenviar um cache antigo após um reset administrativo.

Cliques têm partículas e movimento do copo; compras, eventos, conquistas e renascimentos têm feedback animado. Prefers-reduced-motion desativa os efeitos. O número de partículas simultâneas é limitado apenas para desempenho visual, sem limitar os cliques ou ganhos.

## Expansão de conteúdo — 30/09/2026

- 4 produtores avançados: Conselho dos cajus, Sonho engarrafado, Oceano de realidades e Cajueiro do infinito, com 60 melhorias individuais e 4 sinergias; os produtores antigos mantêm seus IDs.
- 8 receitas novas para diferentes estágios, com +1% a +5% de produção. Total: 392 melhorias comuns.
- 70 conquistas novas por produtor, produção, cliques, receitas, diversidade, desafios e eventos. Total: 126 conquistas.
- 3 eventos novos: Feira do caju (prêmio limitado por saldo e CpS), Aurora do pomar (produção ×2 por 60s) e Brisa da safra (cliques ×3 por 40s). Total: 9 eventos.
- 3 buffs permanentes: Biblioteca ancestral (+1% por cinco melhorias comuns/nível), Raízes do sertão (+1% por dez cajueiros/nível) e Reserva de eventos (+5% de prêmios instantâneos/nível). Máximo de 3 níveis, preços 8/12/6 castanhas, crescimento ×3.
- Nova aba Desafios com 12 objetivos por safra. Resgate único por objetivo, uma recompensa de até 60s de CpS, limitada a 2% do saldo, mínimo de 1 copo. Renascimento limpa os resgates da safra e preserva a contagem histórica de desafios. Recompensas não usam bônus temporários nem premiam castanhas diretamente.

Novos campos `claimedMissions` e `missionsCompleted` ficam no JSON existente do salvamento. Partidas antigas começam sem resgates e sem alterar saldo, castanhas, buffs ou produtores. Recompensas são contabilizadas como produção na safra/histórico, mas só o saldo atual continua determinando o renascimento.

## Eventos mais frequentes

Intervalo base de 90–180 segundos. Estação de festas mantém sua redução de intervalo (no nível 5: 56,25–112,5 segundos). O dourado agora tem 70% de chance de buff e 30% de prêmio instantâneo. Aurora e Brisa aparecem mais; a distribuição completa dá aproximadamente 71% de eventos com buff. Não empilhamos multiplicadores: um evento novo substitui o bônus anterior. Partidas carregadas limitam o tempo restante até o próximo evento ao novo máximo, preservando saldo e eventos já visíveis.

## Skins de figurinhas do álbum

“Minhas figurinhas” consulta somente `album_progress.owned` da conta autenticada, protegida pela política de leitura do próprio usuário. O seletor mostra exclusivamente IDs com cópias positivas, permite buscar nome/número e verifica novamente a coleção ao equipar. A coleção é atualizada a cada 45 segundos com a página visível, ao voltar à página e ao abrir o seletor. Skins não gastam cópias. O bônus de produção depende da ativação temporária descrita abaixo.

`state.skin` aceita os modelos existentes e `sticker:1` até `sticker:111`, persiste no salvamento e no renascimento. O RPC de salvamento verifica a posse usando `auth.uid()`; figurinhas inexistentes ou sem posse voltam ao copo, preservando o restante do progresso. Sua resposta informa a skin efetivamente salva. Imagens e nomes usam o catálogo original do álbum. A migration `20260930111621_clicker_owned_sticker_skins.sql` foi aplicada no Supabase compartilhado.

Execute `node --test --test-isolation=none tests/*.test.js` para verificar todas as regras, sincronização e skins.


## Buffs de figurinhas e expansão — versão 2026-09-30-6

Multiplicadores de produção: comum 1,05×; incomum 1,10×; rara 1,20×; épica 1,35×; mítica 1,50×; lendária 1,75×; secreta 1,90×; supersecreta 2×. Os IDs de raridade seguem o catálogo original do álbum. Botão de ativação exige login e skin da coleção. O efeito dura 10 minutos corridos, depois há 30 minutos de cooldown, ou 40 minutos entre ativações. Trocar de skin pausa o efeito sem pausar o relógio. Uma única espera por conta impede alternar figurinhas para ativar novamente. Recarregar, sair, renascer ou outro dispositivo preserva os tempos.

A tabela `clicker_sticker_buffs` tem RLS e leitura exclusiva do dono, sem escrita direta do cliente. RPCs autenticados validam posse com `auth.uid()` e usam lock por conta para impedir ativações simultâneas. Nenhum pacote/cópia é consumido. Tempos vêm do servidor e avançam com relógio monotônico no navegador. Polling atualiza posse e disponibilidade; ganho ausente, prêmios instantâneos e metas de CpS usam produção base, evitando bônus retroativo. Eventos multiplicam o bônus durante a produção ativa. O clique básico não recebe multiplicador da figurinha; a parcela de CpS das melhorias acompanha a produção ampliada.

Conteúdo adicional: 6 buffs permanentes (Escola de espremedores, Engenharia ancestral, Toque de mestre, Selo da safra, Contratos eternos e Mudas da próxima vida), 8 receitas de +2%, 10 desafios por safra e 12 conquistas. Totais: 21 buffs permanentes, 400 melhorias comuns, 22 desafios e 138 conquistas. Novos buffs custam 4–10 castanhas inicialmente, preço ×3 por nível e máximo de 3 níveis. Engenharia limita o bônus a +20% por nível; contratos preservam o teto de 2% do saldo. Nenhuma compra é concedida automaticamente aos saves antigos.
