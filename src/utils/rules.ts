import { NoUnusedFragments } from 'graphql/validation/rules/NoUnusedFragments'
import { specifiedRules } from 'graphql/validation/specifiedRules'

export const validationRules = specifiedRules.filter(r => r != NoUnusedFragments)
