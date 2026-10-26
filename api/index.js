/**
 * Fonction Vercel unique : toutes les requêtes (hors fichiers statiques de
 * `build/statique`) arrivent ici et sont confiées à AdonisJS, compilé dans `build/`
 * par la commande de construction (voir `vercel.json` et docs/deploiement-vercel.md).
 */
import traiter from '../build/bin/vercel.js'

export default traiter
