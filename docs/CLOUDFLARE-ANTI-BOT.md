# kitmed.ma derrière Cloudflare : protection anti-robots (runbook)

> Statut : **non appliqué**. Le domaine kitmed.ma et sa zone DNS appartiennent au client (registrar Heberjahiz). Ce document décrit la marche à suivre le jour où le client accepte de passer par Cloudflare (offre gratuite).
>
> Rédigé le 2026-11-18, en complément de la protection déjà intégrée dans l'application (`src/middleware/bot-protection.ts`, `src/app/uploads/[[...path]]/route.ts`).

## Pourquoi

L'audit du 2026-11-18 a montré qu'on pouvait aspirer tout le catalogue (1 333 produits) en quelques secondes via `/api/products`. L'application limite maintenant elle-même le débit, bloque les outils d'aspiration connus et refuse le hot-linking des images. Cloudflare ajoute une couche en amont, gratuite :

- les robots sont filtrés **avant** d'atteindre le VPS (moins de charge) ;
- Cloudflare **vérifie réellement** Googlebot, Bingbot, GPTBot, etc. (adresses IP et signatures), alors que l'application ne peut lire que le User-Agent, qui se falsifie ;
- cache des images et fichiers statiques au plus près des visiteurs.

Objectif inchangé : rester **ouvert aux moteurs de recherche et aux assistants IA** (Google, Bing, ChatGPT, Perplexity, Claude…) pour que KITMED apparaisse dans leurs réponses, tout en freinant les concurrents qui copient le catalogue.

## 0. Avant de commencer

1. Obtenir du client l'accès au compte Heberjahiz (ou qu'il fasse l'étape 3 lui-même avec nous en visio).
2. Relever **tous** les enregistrements DNS actuels de kitmed.ma chez Heberjahiz (capture d'écran ou export) : A, AAAA, CNAME, **MX, TXT (SPF, DKIM, DMARC), SRV**. La messagerie du client en dépend : un oubli coupe ses e-mails.
3. Vérifier si DNSSEC est activé chez Heberjahiz. Si oui, le **désactiver** et attendre 24 h avant de changer les serveurs de noms.
4. Prévoir le changement un jour calme (propagation des NS : de quelques minutes à 24 h, le site reste joignable pendant ce temps).

## 1. Ajouter le site dans Cloudflare

1. Créer (ou utiliser) le compte Cloudflare de l'agence, idéalement avec un accès pour le client (Members → rôle « Administrator » ou lecture seule selon son souhait).
2. *Add a domain* → `kitmed.ma` → offre **Free**.
3. Cloudflare importe automatiquement les enregistrements DNS. **Les comparer avec le relevé de l'étape 0** et compléter ce qui manque.

## 2. Enregistrements DNS

| Type | Nom | Valeur | Proxy |
|---|---|---|---|
| A | `kitmed.ma` (@) | `2.24.62.88` | **Proxied** (nuage orange) |
| A ou CNAME | `www` | `2.24.62.88` ou `kitmed.ma` | **Proxied** |
| MX, TXT (SPF/DKIM/DMARC), autodiscover, webmail… | inchangés | valeurs relevées à l'étape 0 | **DNS only** (nuage gris) |

- Tout ce qui concerne la messagerie reste en **DNS only** : Cloudflare ne relaie pas les e-mails.
- Ne pas mettre d'enregistrement AAAA vers le VPS s'il n'y en avait pas.
- Le VPS 2.24.62.88 (Dokploy/Traefik) doit garder les domaines `kitmed.ma` et `www.kitmed.ma` sur l'application KITMED, comme aujourd'hui.

## 3. Changer les serveurs de noms chez Heberjahiz

1. Cloudflare affiche deux serveurs de noms (du type `xxx.ns.cloudflare.com`).
2. Chez Heberjahiz : espace client → domaine kitmed.ma → « Serveurs DNS / Nameservers » → remplacer les serveurs actuels par les deux de Cloudflare.
3. Attendre l'e-mail « kitmed.ma is now active on Cloudflare ». Vérifier : `dig NS kitmed.ma +short`.
4. Tester tout de suite : site en HTTPS, envoi et réception d'un e-mail du client.

## 4. SSL/TLS

1. SSL/TLS → Overview → mode **Full (strict)**. Le certificat Let's Encrypt de Traefik sur le VPS est valide, donc le mode strict fonctionne.
2. **Ne pas** activer « Always Use HTTPS » dans Cloudflare : Traefik redirige déjà HTTP vers HTTPS, et la redirection de Cloudflare empêcherait le renouvellement Let's Encrypt (défi HTTP-01 sur le port 80). Si on veut quand même l'activer, ajouter une *Configuration Rule* qui l'exclut pour `/.well-known/acme-challenge/*`, ou passer Traefik sur un certificat d'origine Cloudflare.
3. Edge Certificates : TLS 1.2 minimum, HSTS déjà envoyé par l'application (ne pas l'activer une deuxième fois).

## 5. Côté application (Dokploy) : à faire le même jour

Dans Dokploy → application KITMED → Environment, ajouter :

```
TRUST_CLOUDFLARE=true
```

puis redéployer. Sans cette variable, l'application verrait l'IP des serveurs Cloudflare au lieu de celle du visiteur : tous les visiteurs passant par le même point Cloudflare partageraient le même quota et seraient bloqués (429) ensemble.

Recommandé ensuite : n'accepter sur le VPS, pour les routes kitmed.ma, que les IP de Cloudflare (middleware Traefik `ipAllowList` avec la liste https://www.cloudflare.com/ips/). Sinon un robot peut contourner Cloudflare en appelant directement 2.24.62.88 et falsifier l'en-tête `CF-Connecting-IP`. À faire **uniquement** sur le routeur de KITMED, jamais sur l'accès SSH ni sur les autres sites du VPS.

## 6. Robots : réglages Security → Bots

| Réglage | Valeur | Pourquoi |
|---|---|---|
| **Bot Fight Mode** | **ON** | Défie les robots automatisés connus. Les « Verified Bots » (Googlebot, Bingbot, GPTBot, OAI-SearchBot, ClaudeBot…) ne sont pas touchés. |
| **Block AI Scrapers and Crawlers** (« Block AI bots ») | **OFF** | On veut que ChatGPT, Perplexity, Claude, Gemini lisent le site pour citer KITMED. |
| **Instruct AI bot traffic with robots.txt** (robots.txt géré par Cloudflare) | **OFF** | Le `robots.txt` est généré par l'application ; Cloudflare ne doit pas le réécrire. |
| **AI Labyrinth** | Optionnel (ON possible) | Ne vise que les robots qui ignorent les consignes `nofollow`/robots.txt : il leur sert des pages leurres. Sans effet sur les robots respectueux. À activer si on voit encore des aspirations dans les journaux. |
| **AI Crawl Control** (ex-AI Audit) | Consulter chaque mois | Montre quels robots IA visitent le site ; on peut y autoriser ou bloquer robot par robot. Garder autorisés : GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot, Amazonbot. |

Point d'attention : sur l'offre gratuite, Bot Fight Mode ne peut pas être contourné par une règle WAF. Une semaine après l'activation, regarder Security → Events : si un assistant IA légitime (par exemple Perplexity, qui n'est plus dans la liste « vérifiée » de Cloudflare depuis 2025) ou un outil du client est défié, désactiver Bot Fight Mode et garder seulement les règles des sections 7 et 8.

## 7. Règles WAF personnalisées (Security → WAF → Custom rules, 5 règles en gratuit)

Ordre d'exécution de haut en bas.

**Règle 1 – Laisser passer les robots vérifiés**

- Expression : `(cf.client.bot)`
- Action : **Skip** → cocher « All remaining custom rules » et « Rate limiting rules ».

**Règle 2 – Bloquer les outils d'aspiration connus**

- Expression :
  ```
  (lower(http.user_agent) contains "python-requests") or (lower(http.user_agent) contains "scrapy")
  or (lower(http.user_agent) contains "httrack") or (lower(http.user_agent) contains "go-http-client")
  or (lower(http.user_agent) contains "headlesschrome") or (lower(http.user_agent) contains "ahrefsbot")
  or (lower(http.user_agent) contains "semrushbot") or (lower(http.user_agent) contains "mj12bot")
  or (lower(http.user_agent) contains "dotbot") or (http.user_agent eq "")
  ```
- Action : **Block**. (La liste complète, plus longue, reste dans `src/middleware/bot-protection.ts`.)

**Règle 3 – Défier les appels API qui ne viennent pas d'une page du site**

- Expression :
  ```
  (starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/api/admin/")
   and not cf.client.bot
   and not any(http.request.headers["sec-fetch-site"][*] == "same-origin"))
  ```
- Action : **Managed Challenge**.
- Effet : un navigateur qui charge le site envoie `Sec-Fetch-Site: same-origin` sur les appels API et passe normalement ; un script qui appelle directement `/api/products` est défié. Limite : les très vieux navigateurs (Safari avant 16.4) n'envoient pas cet en-tête ; surveiller Security → Events la première semaine et désactiver la règle si des visiteurs réels sont touchés. Ne **pas** défier tout `/api/*` sans condition : les appels faits par la page (fetch) ne savent pas résoudre un défi et le site afficherait des listes vides.

**Règle 4 (optionnelle) – Pays**

Seulement si les journaux montrent des aspirations massives depuis un pays sans clients : **Managed Challenge** sur ce pays, jamais **Block** (des médecins voyagent).

## 8. Limitation de débit (Security → WAF → Rate limiting rules, 1 règle en gratuit)

- Nom : `API catalogue`
- Expression : `(starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/api/admin/"))`
- Caractéristique : IP
- Seuil : **30 requêtes par 10 secondes** (seule période disponible en gratuit)
- Action : **Block**, durée 10 secondes

C'est un garde-fou large (180/min) : l'application applique déjà ses propres limites plus fines (60/min et 400/h sur `/api/products`, voir `RATE_RULES`). Cloudflare arrête surtout les rafales avant qu'elles n'atteignent le VPS.

## 9. Cache (Caching → Cache Rules)

1. **Images et fichiers** : `starts_with(http.request.uri.path, "/uploads/") or starts_with(http.request.uri.path, "/_next/static/") or starts_with(http.request.uri.path, "/images/")` → Eligible for cache, Edge TTL « Use cache-control header » (l'application envoie déjà `max-age=31536000, immutable`).
2. **Jamais en cache** : `starts_with(http.request.uri.path, "/api/") or http.request.uri.path contains "/admin"` → Bypass cache.
3. Les pages HTML : laisser le comportement par défaut (Cloudflare ne met pas le HTML en cache sans règle).

Attention : une image servie depuis le cache Cloudflare n'atteint plus l'application, donc la protection anti hot-linking de l'application ne s'applique plus à elle. Activer en plus **Scrape Shield → Hotlink Protection** (gratuit) : Cloudflare refuse alors l'affichage des images de kitmed.ma sur d'autres sites, tout en acceptant les requêtes sans Referer et celles de kitmed.ma. Même chose pour l'optimiseur d'images de Next.js : `/_next/image?url=/uploads/...` est servi avant le middleware de l'application et n'est donc pas protégé côté application. Si on constate du hot-linking par ce chemin, ajouter une règle WAF : `(http.request.uri.path eq "/_next/image" and http.referer ne "" and not http.referer contains "kitmed.ma" and not cf.client.bot)` → Block.

Vérifier ensuite qu'un partage de lien produit sur WhatsApp / LinkedIn / Facebook affiche toujours l'image (les robots d'aperçu n'envoient pas de Referer, ils passent).

## 10. Vérifications après bascule

```bash
# Site et API depuis un navigateur : normal (200)
curl -sI https://kitmed.ma/fr | head -1
# Script brut sur l'API : 403 (Cloudflare ou application)
curl -s -o /dev/null -w "%{http_code}\n" "https://kitmed.ma/api/products?pageSize=50"
# Robots et sitemap accessibles
curl -s https://kitmed.ma/robots.txt | head
curl -sI https://kitmed.ma/sitemap.xml | head -1
curl -sI https://kitmed.ma/llms.txt | head -1
```

Puis : Google Search Console → Inspection d'URL sur une fiche produit (doit être « explorable ») ; Bing Webmaster Tools idem ; envoi et réception d'un e-mail du client ; une demande de devis depuis le site.

## 11. Ce qu'il faut dire au client

Message proposé (à adapter) :

> Bonjour,
>
> Nous avons constaté qu'un programme pouvait copier automatiquement tout votre catalogue (produits, descriptions, fiches techniques, photos) en quelques secondes. Le site est maintenant protégé : il limite le nombre de pages consultées par minute, bloque les logiciels d'aspiration connus et empêche d'autres sites d'afficher vos photos.
>
> Pour aller plus loin, nous vous proposons de placer kitmed.ma derrière Cloudflare (service gratuit, utilisé par une grande partie du web). Concrètement, il faut changer les « serveurs DNS » de votre domaine chez Heberjahiz. Cela ne change rien pour vos visiteurs ni pour vos e-mails, le site devient plus rapide et les robots indésirables sont arrêtés avant d'arriver sur le site. Google, Bing et les assistants IA (ChatGPT, Perplexity, Claude…) continuent de lire votre site pour vous recommander.
>
> Nous avons besoin soit de votre accès Heberjahiz, soit de 15 minutes avec vous pour faire la modification ensemble. Aucun coût supplémentaire.

Points à expliquer si le client demande :
- aucune protection n'empêche à 100 % un concurrent déterminé de copier un site public page par page à la main ; l'objectif est d'empêcher la copie automatique et massive ;
- le domaine reste sa propriété chez Heberjahiz, seul l'aiguillage DNS passe chez Cloudflare ; c'est réversible à tout moment (remettre les anciens serveurs DNS).

## Retour arrière

1. Chez Heberjahiz, remettre les serveurs de noms d'origine (et les enregistrements relevés à l'étape 0 s'ils ont été supprimés).
2. Dans Dokploy, retirer `TRUST_CLOUDFLARE` (ou le mettre à `false`) et redéployer.
3. Retirer l'éventuel `ipAllowList` Cloudflare sur le routeur Traefik de KITMED.
