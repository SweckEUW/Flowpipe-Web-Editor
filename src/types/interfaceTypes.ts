import { NodeInterfaceType } from '@baklavajs/interface-types'

export const TYPE_STRING   = new NodeInterfaceType('string')
export const TYPE_NUMBER   = new NodeInterfaceType('number')
export const TYPE_INTEGER  = new NodeInterfaceType('integer')
export const TYPE_BOOLEAN  = new NodeInterfaceType('boolean')
export const TYPE_FILEPATH = new NodeInterfaceType('filepath')
export const TYPE_DIRPATH  = new NodeInterfaceType('dirpath')
export const TYPE_SELECT   = new NodeInterfaceType('select')

// Numeric interop
TYPE_NUMBER.addConversion(TYPE_INTEGER)
TYPE_INTEGER.addConversion(TYPE_NUMBER)

// String-like interop (filepath / dirpath / select are all strings at runtime)
TYPE_STRING.addConversion(TYPE_FILEPATH)
TYPE_STRING.addConversion(TYPE_DIRPATH)
TYPE_STRING.addConversion(TYPE_SELECT)
TYPE_FILEPATH.addConversion(TYPE_STRING)
TYPE_FILEPATH.addConversion(TYPE_DIRPATH)
TYPE_DIRPATH.addConversion(TYPE_STRING)
TYPE_DIRPATH.addConversion(TYPE_FILEPATH)
TYPE_SELECT.addConversion(TYPE_STRING)

export const ALL_INTERFACE_TYPES = [
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_INTEGER,
  TYPE_BOOLEAN,
  TYPE_FILEPATH,
  TYPE_DIRPATH,
  TYPE_SELECT,
]

import type { PortDefinition } from './nodeRegistry'

export function typeForValueType(vt: PortDefinition['valueType']) {
  switch (vt) {
    case 'string':   return TYPE_STRING
    case 'number':   return TYPE_NUMBER
    case 'integer':  return TYPE_INTEGER
    case 'boolean':  return TYPE_BOOLEAN
    case 'filepath': return TYPE_FILEPATH
    case 'dirpath':  return TYPE_DIRPATH
    case 'select':   return TYPE_SELECT
    default:         return null  // 'any' → untyped → connects to everything
  }
}
