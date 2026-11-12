import { itemNameForUiParameter, type UiParameter } from './data'

export const ACTIVE_UI_PARAMETER_YEAR = '2026'

export function parameterForItemName(itemName: string, parameters: readonly UiParameter[]) {
  return parameters.find(
    (parameter) => parameter.year === ACTIVE_UI_PARAMETER_YEAR && itemNameForUiParameter(parameter.itemId) === itemName,
  )
}

export function isItemDisplayed(itemName: string, parameters: readonly UiParameter[]) {
  const parameter = parameterForItemName(itemName, parameters)
  return parameter?.display !== 'N' && parameter?.collapse !== 'Y'
}

export function additionalParameters(parameters: readonly UiParameter[]) {
  return parameters
    .filter((parameter) => parameter.year === ACTIVE_UI_PARAMETER_YEAR && parameter.display === 'Y' && parameter.collapse === 'Y')
    .sort((a, b) => a.order - b.order)
}
