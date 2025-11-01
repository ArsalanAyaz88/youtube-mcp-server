export interface MCPFunctionOptions {
  description?: string;
  parameters?: unknown;
}

export interface MCPFunctionGroup {}

export function MCPFunction(_options: MCPFunctionOptions = {}): MethodDecorator {
  return function () {
    // no-op decorator; used only for metadata/organization in this project
  } as MethodDecorator;
}
