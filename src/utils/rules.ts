import { NoUnusedFragmentsRule } from 'graphql/validation/rules/NoUnusedFragmentsRule.js'
import { specifiedRules } from 'graphql/validation/specifiedRules.js'

export const validationRules = specifiedRules.filter((r) => r != NoUnusedFragmentsRule)
