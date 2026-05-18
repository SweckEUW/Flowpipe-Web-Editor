export interface PortDefinition {
  name: string
  valueType: 'string' | 'number' | 'integer' | 'boolean' | 'select' | 'filepath' | 'dirpath' | 'any'
  default?: unknown
  options?: string[]
}

export interface NodeTypeDefinition {
  type: string
  label: string
  category: string
  module: string
  cls: string
  file_location: string
  inputs: PortDefinition[]
  outputs: PortDefinition[]
}

export interface NodeRegistry {
  nodes: NodeTypeDefinition[]
}
