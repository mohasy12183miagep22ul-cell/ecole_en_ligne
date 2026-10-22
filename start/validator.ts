/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { SimpleMessagesProvider, VineDate } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/**
 * Messages de validation en français (consigne : tout est en français, y
 * compris les messages d'erreur). Les écrans peuvent toujours afficher un
 * message plus précis pour un champ donné.
 */
vine.messagesProvider = new SimpleMessagesProvider({
  'required': 'Ce champ est obligatoire.',
  'requiredIfMissing': 'Ce champ est obligatoire.',
  'requiredIfExists': 'Ce champ est obligatoire.',
  'requiredWhen': 'Ce champ est obligatoire.',
  'string': 'Texte attendu.',
  'email': 'Adresse e-mail invalide.',
  'regex': 'Format invalide.',
  'minLength': '{{ min }} caractères minimum.',
  'maxLength': '{{ max }} caractères maximum.',
  'fixedLength': '{{ size }} caractères attendus.',
  'number': 'Nombre attendu.',
  'withoutDecimals': 'Nombre entier attendu.',
  'positive': 'Nombre positif attendu.',
  'min': 'Valeur minimale : {{ min }}.',
  'max': 'Valeur maximale : {{ max }}.',
  'range': 'Valeur entre {{ min }} et {{ max }} attendue.',
  'enum': 'Valeur non autorisée.',
  'boolean': 'Valeur oui / non attendue.',
  'array': 'Liste attendue.',
  'array.minLength': '{{ min }} élément(s) minimum.',
  'array.maxLength': '{{ max }} élément(s) maximum.',
  'date': 'Date invalide.',
  'date.beforeOrEqual': 'La date ne peut pas être dans le futur.',
  'confirmed': 'Les deux saisies ne correspondent pas.',
  'file': 'Fichier attendu.',
  // Toutes les pièces jointes sont limitées à 5 Mo (§ 12).
  'file.size': 'Fichier trop volumineux : 5 Mo au maximum.',
  // L'extension est lue dans le contenu réel du fichier, pas dans son nom.
  'file.extname': 'Type de fichier non accepté.',
})
