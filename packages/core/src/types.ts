export type ElementTagName = `${string}-${string}`;

export type Primitive = string | number | boolean | null | undefined;

export type AttributeValueMap = Record<string, unknown>;
export type StateValueMap = Record<string, boolean>;

export type RepresentationFidelity = 'symbol' | 'operational' | 'structural' | 'twin';
export type ObserverRole = 'viewer' | 'operator' | 'maintenance' | 'engineer' | 'installer' | 'simulator';
export type ObserverIntent = 'overview' | 'monitor' | 'operate' | 'diagnose' | 'configure' | 'install' | 'simulate';
export type ObserverScale = 'plant' | 'system' | 'equipment' | 'component';
export type ObserverFidelity = 'auto' | RepresentationFidelity;

export interface ObserverContext {
  readonly role: ObserverRole;
  readonly intent: ObserverIntent;
  readonly scale: ObserverScale;
  readonly fidelity: ObserverFidelity;
  readonly capabilities: readonly string[];
}

export interface RepresentationDefinition {
  readonly id: string;
  readonly label: string;
  readonly fidelity: RepresentationFidelity;
  readonly description?: string;
  readonly requires?: readonly string[];
  readonly preserves?: readonly string[];
}

export interface ElementContext<
  TAttributes extends AttributeValueMap = AttributeValueMap,
  TStates extends StateValueMap = StateValueMap,
> {
  readonly host: HTMLElement;
  readonly attributes: Readonly<TAttributes>;
  readonly states: Readonly<TStates>;
  readonly observer: Readonly<ObserverContext>;
  readonly representation: Readonly<RepresentationDefinition>;
}

export type ContextReader<T> = (context: ElementContext) => T;

export type PortDirection = 'left' | 'right' | 'top' | 'bottom';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface PortDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly direction: PortDirection;
  readonly kind?: string;
}

export type VisualDetail = 'essential' | 'standard' | 'fine';

export interface CssPartDefinition {
  readonly name: string;
  readonly description?: string;
  readonly detail?: VisualDetail;
  readonly minimumFidelity?: RepresentationFidelity;
}
