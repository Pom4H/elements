export type ElementTagName = `${string}-${string}`;

export type Primitive = string | number | boolean | null | undefined;

export type AttributeValueMap = Record<string, unknown>;
export type StateValueMap = Record<string, boolean>;

/** The drawing an element is currently showing, once size has had its say. */
export type DetailLevel = 'full' | 'compact' | 'symbol';

export interface ElementContext<
  TAttributes extends AttributeValueMap = AttributeValueMap,
  TStates extends StateValueMap = StateValueMap,
> {
  readonly host: HTMLElement;
  readonly attributes: Readonly<TAttributes>;
  readonly states: Readonly<TStates>;
  /**
   * Resolved level of detail. The runtime always supplies it; a context built
   * by hand without a measured host reads as `full`.
   */
  readonly detail?: DetailLevel;
}

export type ContextReader<T> = (context: ElementContext) => T;

export type PortDirection = 'left' | 'right' | 'top' | 'bottom';

export type PortRole = 'inlet' | 'outlet' | 'bidirectional';

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
  readonly role?: PortRole;
  readonly medium?: string;
  readonly label?: string;
}

export type VisualDetail = 'essential' | 'standard' | 'fine';

export interface CssPartDefinition {
  readonly name: string;
  readonly description?: string;
  readonly detail?: VisualDetail;
}
