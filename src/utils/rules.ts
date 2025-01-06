import { NoUnusedFragmentsRule } from "graphql/validation/rules/NoUnusedFragmentsRule";
import { specifiedRules } from "graphql/validation/specifiedRules";

export const validationRules = specifiedRules.filter((r) => r != NoUnusedFragmentsRule);
