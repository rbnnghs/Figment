// Import types from extractor
import type {
  VisualProperties,
  LayoutProperties,
  TypographyProperties,
  ConstraintProperty,
  AutoLayoutProperty,
  PaddingProperty,
  InteractivityProperties,
  GeometryProperties,
  EffectProperties,
  ConstraintProperties,
  TransformMatrix,
  SizeProperties
} from './extractor'

export interface InsertCodeHandler {
  name: 'INSERT_CODE'
  handler: (code: string) => void
}

export interface SelectionUpdateHandler {
  name: 'SELECTION_UPDATE'
  handler: (data: any) => void
}

export interface DownloadBlueprintHandler {
  name: 'DOWNLOAD_BLUEPRINT'
  handler: (data: any) => void
}

export interface CopyToClipboardHandler {
  name: 'COPY_TO_CLIPBOARD'
  handler: (data: any) => void
}

// Enhanced semantic metadata interfaces
export interface SemanticMetadata {
  purpose?: string
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaHidden?: boolean
  tabIndex?: number
  dataAttributes?: Record<string, string>
  accessibility?: AccessibilityProperties
  componentType?: 'header' | 'footer' | 'sidebar' | 'main' | 'navigation' | 'nav' | 'modal' | 'card' | 'form' | 'list' | 'table' | 'other' | 'button' | 'text' | 'container' | 'input' | 'image' | 'icon' | 'layout' | undefined
  variantType?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'disabled' | 'hover' | 'active' | 'focus' | 'loading'
  state?: 'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'loading' | 'error' | 'success'
  priority?: 'high' | 'medium' | 'low'
  isInteractive?: boolean
  isReusable?: boolean
  isResponsive?: boolean
  breakpointBehavior?: BreakpointBehavior[]
  isContainer?: boolean
  // Explicit interaction flags
  hasInteractions?: boolean
  hasHoverState?: boolean
  hasClickHandler?: boolean
}

export interface AccessibilityProperties {
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaHidden?: boolean
  ariaExpanded?: boolean
  ariaPressed?: boolean
  ariaChecked?: boolean
  ariaSelected?: boolean
  ariaRequired?: boolean
  ariaInvalid?: boolean
  ariaLive?: 'off' | 'polite' | 'assertive'
  ariaAtomic?: boolean
  ariaRelevant?: string
  ariaBusy?: boolean
  ariaControls?: string
  ariaOwns?: string
  ariaFlowto?: string
  ariaDropeffect?: string
  ariaGrabbed?: boolean
  ariaActivedescendant?: string
  ariaColcount?: number
  ariaColindex?: number
  ariaColspan?: number
  ariaRowcount?: number
  ariaRowindex?: number
  ariaRowspan?: number
  ariaSort?: 'none' | 'ascending' | 'descending' | 'other'
  ariaReadonly?: boolean
  ariaMultiline?: boolean
  ariaMultiselectable?: boolean
  ariaOrientation?: 'horizontal' | 'vertical'
  ariaValuemin?: number
  ariaValuemax?: number
  ariaValuenow?: number
  ariaValuetext?: string
  ariaLevel?: number
  ariaPosinset?: number
  ariaSetsize?: number
  ariaCurrent?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  ariaHaspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  ariaAutocomplete?: 'none' | 'inline' | 'list' | 'both'
  ariaPlaceholder?: string
  ariaModal?: boolean
}

export interface BreakpointBehavior {
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  minWidth?: number
  maxWidth?: number
  layoutChanges?: LayoutChanges
  visibility?: 'visible' | 'hidden' | 'collapsed'
  sizing?: 'hug' | 'fill' | 'fixed'
  constraints?: ConstraintProperty
  autoLayout?: AutoLayoutProperty
  padding?: PaddingProperty
  margin?: PaddingProperty
  typography?: TypographyProperties
  visuals?: VisualProperties
}

export interface LayoutChanges {
  direction?: 'HORIZONTAL' | 'VERTICAL'
  alignment?: string
  spacing?: number
  padding?: PaddingProperty
  sizing?: 'hug' | 'fill' | 'fixed'
  constraints?: ConstraintProperty
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky'
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch'
  gridTemplateColumns?: string
  gridTemplateRows?: string
  gridGap?: number
  gridColumn?: string
  gridRow?: string
}

// Enhanced responsive and adaptive interfaces
export interface ResponsiveProperties {
  breakpoints?: Record<string, BreakpointBehavior>
  adaptiveLayout?: boolean
  fluidSizing?: boolean
  containerQueries?: boolean
  aspectRatio?: number
  minAspectRatio?: number
  maxAspectRatio?: number
  viewportAdaptation?: ViewportAdaptation
  contentAdaptation?: ContentAdaptation
}

export interface ViewportAdaptation {
  type: 'scale' | 'reflow' | 'hide' | 'stack' | 'collapse'
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  preserveAspectRatio?: boolean
  maintainProportions?: boolean
}

export interface ContentAdaptation {
  type: 'truncate' | 'wrap' | 'scroll' | 'ellipsis' | 'expand'
  maxLines?: number
  maxCharacters?: number
  overflowBehavior?: 'visible' | 'hidden' | 'scroll' | 'auto'
  textOverflow?: 'clip' | 'ellipsis'
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'
}

// Enhanced animation and transition interfaces
export interface AnimationProperties {
  type?: 'fade' | 'slide' | 'scale' | 'rotate' | 'translate' | 'custom'
  duration?: number
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier'
  delay?: number
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
  iterationCount?: number | 'infinite'
  playState?: 'running' | 'paused'
  keyframes?: Keyframe[]
  springConfig?: SpringConfig
  customEasing?: string
}

export interface Keyframe {
  offset: number
  properties: Record<string, any>
}

export interface SpringConfig {
  tension: number
  friction: number
  mass?: number
  damping?: number
  stiffness?: number
}

// Enhanced state management interfaces
export interface StateManagement {
  states: Record<string, ComponentState>
  transitions: Record<string, StateTransition>
  stateMachine?: StateMachine
  persistence?: StatePersistence
}

export interface ComponentState {
  name: string
  description?: string
  properties: StateProperties
  conditions?: StateCondition[]
  actions?: StateAction[]
  duration?: number
  isDefault?: boolean
}

export interface StateProperties {
  visuals?: VisualProperties
  layout?: LayoutProperties
  typography?: TypographyProperties
  interactivity?: InteractivityProperties
  accessibility?: AccessibilityProperties
  animation?: AnimationProperties
}

export interface StateCondition {
  type: 'hover' | 'focus' | 'active' | 'disabled' | 'loading' | 'error' | 'success' | 'custom'
  property?: string
  value?: any
  operator?: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'starts-with' | 'ends-with'
  customLogic?: string
}

export interface StateAction {
  type: 'navigate' | 'submit' | 'toggle' | 'show' | 'hide' | 'animate' | 'custom'
  target?: string
  parameters?: Record<string, any>
  customCode?: string
}

export interface StateTransition {
  from: string
  to: string
  trigger: StateCondition
  animation?: AnimationProperties
  duration?: number
  easing?: string
}

export interface StateMachine {
  initial: string
  states: Record<string, StateDefinition>
  transitions: StateTransition[]
}

export interface StateDefinition {
  on?: Record<string, string | StateAction>
  always?: StateAction[]
  entry?: StateAction[]
  exit?: StateAction[]
}

export interface StatePersistence {
  type: 'localStorage' | 'sessionStorage' | 'url' | 'none'
  key?: string
  scope?: 'component' | 'page' | 'global'
  expiration?: number
}

// Enhanced validation and linting interfaces
export interface ValidationRules {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  step?: number
  custom?: string
}

export interface LintingRules {
  designTokens?: boolean
  accessibility?: boolean
  responsive?: boolean
  performance?: boolean
  consistency?: boolean
  naming?: boolean
  spacing?: boolean
  typography?: boolean
  color?: boolean
  layout?: boolean
}

export interface LintingResult {
  level: 'error' | 'warning' | 'info'
  category: string
  message: string
  suggestion?: string
  element?: string
  property?: string
  value?: any
  expectedValue?: any
  rule?: string
  fixable?: boolean
  autoFix?: () => void
}

// Enhanced export configuration
export interface ExportConfiguration {
  format: 'yaml' | 'json' | 'typescript' | 'react' | 'vue' | 'angular' | 'html' | 'css'
  includeMetadata?: boolean
  includeTokens?: boolean
  includeAccessibility?: boolean
  includeResponsive?: boolean
  includeAnimations?: boolean
  includeStates?: boolean
  includeValidation?: boolean
  includeLinting?: boolean
  flattenHierarchy?: boolean
  generateCode?: boolean
  codeFramework?: 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla'
  codeStyle?: 'functional' | 'class' | 'hooks'
  codeLanguage?: 'typescript' | 'javascript'
  cssFramework?: 'tailwind' | 'styled-components' | 'emotion' | 'css-modules' | 'vanilla'
  designSystem?: string
  tokenPrefix?: string
  outputPath?: string
  fileName?: string
  prettify?: boolean
  minify?: boolean
  sourceMaps?: boolean
}

// Enhanced component metadata
export interface ComponentMetadata {
  id: string
  name: string
  description?: string
  version?: string
  author?: string
  createdAt?: string
  updatedAt?: string
  tags?: string[]
  category?: string
  subcategory?: string
  complexity?: 'simple' | 'medium' | 'complex'
  reusability?: 'low' | 'medium' | 'high'
  maintainability?: 'low' | 'medium' | 'high'
  testability?: 'low' | 'medium' | 'high'
  documentation?: string
  examples?: ComponentExample[]
  dependencies?: string[]
  props?: ComponentProp[]
  events?: ComponentEvent[]
  slots?: ComponentSlot[]
}

export interface ComponentExample {
  name: string
  description?: string
  props?: Record<string, any>
  code?: string
  preview?: string
}

export interface ComponentProp {
  name: string
  type: string
  required?: boolean
  default?: any
  description?: string
  validation?: ValidationRules
  options?: any[]
}

export interface ComponentEvent {
  name: string
  description?: string
  payload?: Record<string, any>
  bubbles?: boolean
  cancelable?: boolean
}

export interface ComponentSlot {
  name: string
  description?: string
  fallback?: string
  scoped?: boolean
}

// Enhanced design system integration
export interface DesignSystemIntegration {
  tokens: DesignTokens
  themes: Theme[]
  components: ComponentLibrary
  patterns: DesignPattern[]
  guidelines: DesignGuidelines
}

export interface DesignTokens {
  colors: ColorToken[]
  typography: TypographyToken[]
  spacing: SpacingToken[]
  sizing: SizingToken[]
  shadows: ShadowToken[]
  borders: BorderToken[]
  radii: RadiusToken[]
  zIndex: ZIndexToken[]
  animations: AnimationToken[]
  breakpoints: BreakpointToken[]
}

export interface ColorToken {
  name: string
  value: string
  category: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic'
  variants?: Record<string, string>
  description?: string
  usage?: string[]
}

export interface TypographyToken {
  name: string
  family: string
  size: string
  weight: number
  lineHeight: string
  letterSpacing: string
  category: 'heading' | 'body' | 'caption' | 'button' | 'label'
  variants?: Record<string, any>
  description?: string
}

export interface SpacingToken {
  name: string
  value: number
  unit: 'px' | 'rem' | 'em' | '%'
  category: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  description?: string
}

export interface SizingToken {
  name: string
  value: number | string
  unit: 'px' | 'rem' | 'em' | '%' | 'auto'
  category: 'width' | 'height' | 'min' | 'max'
  description?: string
}

export interface ShadowToken {
  name: string
  value: string
  category: 'sm' | 'md' | 'lg' | 'xl'
  description?: string
}

export interface BorderToken {
  name: string
  width: number
  style: 'solid' | 'dashed' | 'dotted' | 'double'
  color: string
  description?: string
}

export interface RadiusToken {
  name: string
  value: number
  category: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  description?: string
}

export interface ZIndexToken {
  name: string
  value: number
  category: 'base' | 'dropdown' | 'sticky' | 'fixed' | 'modal' | 'popover' | 'tooltip' | 'toast'
  description?: string
}

export interface AnimationToken {
  name: string
  duration: number
  easing: string
  category: 'fast' | 'normal' | 'slow'
  description?: string
}

export interface BreakpointToken {
  name: string
  value: number
  category: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  description?: string
}

export interface Theme {
  name: string
  description?: string
  tokens: Record<string, any>
  isDefault?: boolean
  isDark?: boolean
}

export interface ComponentLibrary {
  components: Record<string, ComponentMetadata>
  categories: string[]
  searchIndex: Record<string, string[]>
}

export interface DesignPattern {
  name: string
  description?: string
  category: string
  examples: ComponentExample[]
  bestPractices: string[]
  antiPatterns: string[]
}

export interface DesignGuidelines {
  accessibility: AccessibilityGuidelines
  responsive: ResponsiveGuidelines
  performance: PerformanceGuidelines
  consistency: ConsistencyGuidelines
}

export interface AccessibilityGuidelines {
  colorContrast: number
  focusIndicators: boolean
  keyboardNavigation: boolean
  screenReaderSupport: boolean
  semanticHTML: boolean
}

export interface ResponsiveGuidelines {
  mobileFirst: boolean
  breakpointStrategy: 'content' | 'device' | 'container'
  fluidTypography: boolean
  touchTargets: number
}

export interface PerformanceGuidelines {
  maxBundleSize: number
  maxRenderTime: number
  lazyLoading: boolean
  codeSplitting: boolean
}

export interface ConsistencyGuidelines {
  namingConvention: string
  spacingScale: number[]
  colorPalette: string[]
  typographyScale: number[]
}

// Additional interfaces for enhanced blueprint extraction
export interface PrototypeFlow {
  startNode: string
  endNode: string
  connections: PrototypeConnection[]
  screens: string[]
  navigation: NavigationFlow
}

export interface PrototypeConnection {
  from: string
  to: string
  trigger: string
  action: string
  transition?: string
  duration?: number
}

export interface NavigationFlow {
  type: 'linear' | 'branching' | 'circular' | 'hierarchical'
  steps: NavigationStep[]
  decisionPoints: DecisionPoint[]
}

export interface NavigationStep {
  id: string
  name: string
  screen: string
  actions: string[]
  nextSteps: string[]
}

export interface DecisionPoint {
  id: string
  condition: string
  truePath: string
  falsePath: string
}

export interface GroupMetadata {
  type: 'navigation' | 'content' | 'form' | 'list' | 'card' | 'modal' | 'toolbar' | 'sidebar' | 'footer' | 'header' | 'other'
  purpose: string
  role: string
  isContainer: boolean
  isInteractive: boolean
  childrenCount: number
  layoutType: 'auto' | 'manual' | 'grid' | 'flex'
  responsiveBehavior: string
}

export interface ContainerAdaptation {
  type: 'fluid' | 'fixed' | 'responsive' | 'adaptive'
  minWidth?: number
  maxWidth?: number
  aspectRatio?: number
  breakpoints: Record<string, ContainerBreakpoint>
  contentBehavior: 'scale' | 'reflow' | 'hide' | 'stack'
}

export interface ContainerBreakpoint {
  width: number
  layout: string
  spacing: number
  padding: PaddingProperty
  childrenLayout: string
}

export interface ResizingLogic {
  type: 'fixed' | 'fluid' | 'responsive' | 'adaptive'
  constraints: ResizeConstraint[]
  behavior: 'maintain-aspect' | 'stretch' | 'crop' | 'scale'
  minSize: { width: number; height: number }
  maxSize: { width: number; height: number }
  preferredSize: { width: number; height: number }
}

export interface ResizeConstraint {
  axis: 'horizontal' | 'vertical' | 'both'
  type: 'min' | 'max' | 'preferred' | 'fixed'
  value: number
  unit: 'px' | 'rem' | 'em' | '%'
}

export interface ClickHandler {
  type: 'navigate' | 'submit' | 'toggle' | 'show' | 'hide' | 'custom'
  target?: string
  parameters?: Record<string, any>
  customCode?: string
  validation?: ValidationRules
  feedback?: UserFeedback
}

export interface UserFeedback {
  type: 'visual' | 'audio' | 'haptic' | 'none'
  duration?: number
  message?: string
  animation?: AnimationProperties
}

export interface Transition {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'translate' | 'custom'
  duration: number
  easing: string
  delay?: number
  direction?: 'in' | 'out' | 'both'
  properties: string[]
  keyframes?: Keyframe[]
}

export interface DesignTokenMapping {
  colors: Record<string, string | null>
  typography: Record<string, string | null>
  spacing: Record<string, string | null>
  sizing: Record<string, string | null>
  shadows: Record<string, string | null>
  borders: Record<string, string | null>
  radii: Record<string, string | null>
  zIndex: Record<string, string | null>
  animations: Record<string, string | null>
  breakpoints: Record<string, string | null>
}

export interface LintingWarning {
  level: 'error' | 'warning' | 'info'
  category: string
  message: string
  element: string
  property: string
  value: any
  expectedValue?: any
  suggestion?: string
  fixable: boolean
  autoFix?: () => void
}

export interface ExportStructure {
  format: 'yaml' | 'json' | 'typescript' | 'react' | 'vue' | 'angular'
  hierarchy: boolean
  metadata: boolean
  tokens: boolean
  accessibility: boolean
  responsive: boolean
  animations: boolean
  states: boolean
  validation: boolean
  linting: boolean
  humanReadable: boolean
  llmParsable: boolean
  organization: 'flat' | 'nested' | 'grouped'
  naming: 'original' | 'normalized' | 'clean'
}

// Import PositionProperties from extractor and extend it
import type { PositionProperties as BasePositionProperties } from './extractor'
export interface PositionProperties extends BasePositionProperties {
  zIndex?: number
}

// Import DesignBlueprint from extractor and extend it
import type { DesignBlueprint as BaseDesignBlueprint } from './extractor'
export interface DesignBlueprint extends BaseDesignBlueprint {
  // Enhanced sizing & responsiveness
  sizeMode?: string
  responsiveBehavior?: string
  // Export metadata
  filename?: string
  componentReference?: string
  exportedAt?: string
  // AI hints
  suggestedComponentType?: string
  designIntent?: string
  importance?: 'high' | 'medium' | 'low'
}
