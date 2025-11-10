# Mode Maintenance - KITMED

## Vue d'ensemble

Le système de maintenance permet de mettre temporairement le site en mode "sous construction" avec une page dédiée en français.

## Fonctionnalités

### Page de Maintenance
- 🇫🇷 **Interface en Français** : Page entièrement traduite
- ⏱️ **Compte à rebours** : Timer en temps réel estimant le retour
- 🎨 **Design Premium** : Interface moderne avec animations
- 📱 **Responsive** : Optimisé pour mobile et desktop
- 🔧 **Améliorations listées** : Affiche ce qui est en cours d'amélioration
- 📞 **Contact d'urgence** : Informations de support disponibles

### Bouton de Contrôle Admin
- 🔄 **Toggle facile** : Activation/désactivation simple
- 👀 **Aperçu** : Prévisualisation de la page sans activer
- ⚠️ **Confirmation** : Dialog de confirmation avant activation
- 🚀 **Redirection auto** : Redirection automatique vers la page maintenance

## Comment Utiliser

### Activer le Mode Maintenance
1. Aller dans **Admin** → **Paramètres** → **Maintenance du Système**
2. Utiliser le bouton **"Mode Maintenance"**
3. Cliquer sur **"Aperçu de la page"** pour voir le résultat
4. Activer le switch pour mettre en maintenance
5. Confirmer dans la dialog qui s'ouvre

### Désactiver le Mode Maintenance
1. Retourner dans les paramètres admin
2. Désactiver le switch
3. Confirmer la désactivation

## Accès Pendant la Maintenance

### Pages Accessibles (exemples)
- `/admin/*` - Panel d'administration
- `/api/*` - API endpoints
- `/maintenance` - Page de maintenance elle-même

### Pages Redirigées
- `/` - Page d'accueil → `/maintenance`
- `/products` - Catalogue → `/maintenance` 
- `/about` - À propos → `/maintenance`
- Toutes les autres pages publiques

## Structure des Fichiers

```
src/
├── app/[locale]/maintenance/page.tsx     # Page de maintenance
├── components/admin/MaintenanceButton.tsx # Bouton de contrôle
├── middleware/maintenance.ts              # Logic de redirection
└── middleware.ts                         # Middleware principal
```

## Personnalisation

### Modifier le Timer
Dans `/src/app/[locale]/maintenance/page.tsx`, ligne 24 :
```typescript
// Changer "2 heures" par la durée souhaitée
const maintenanceEndTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
```

### Modifier les Améliorations Affichées
Dans le même fichier, modifier l'array `improvements` (lignes 44-56).

### Changer les Informations de Contact
Modifier les lignes 140-142 avec vos vraies coordonnées.

## Variables d'Environnement

Pour contrôler via environnement (optionnel) :
```env
MAINTENANCE_MODE=true   # Active le mode maintenance
MAINTENANCE_MODE=false  # Désactive le mode maintenance
```

## Notes Techniques

- **Middleware** : Gère les redirections automatiques
- **Internationalisation** : Support français/anglais
- **Performance** : Page optimisée, pas de dépendances lourdes
- **SEO** : Métadonnées appropriées pour maintenance
- **Accessibilité** : Respect des standards WCAG

## Dépannage

### Le mode maintenance ne s'active pas
- Vérifier que le middleware fonctionne
- Checker les logs de développement
- S'assurer que les settings se sauvent correctement

### Page de maintenance non accessible
- Vérifier l'URL : `/fr/maintenance` ou `/en/maintenance`
- Confirmer que le fichier page.tsx existe
- Vérifier les dépendances (Logo, Button, etc.)

## Support

Pour toute question ou problème, contacter l'équipe technique.