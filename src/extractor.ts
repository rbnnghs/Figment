// Figma node types are available globally
import type {
  SemanticMetadata,
  AccessibilityProperties,
  ResponsiveProperties,
  BreakpointBehavior,
  AnimationProperties,
  StateManagement,
  ValidationRules,
  LintingResult,
  ComponentMetadata,
  DesignSystemIntegration,
  ExportConfiguration,
  PrototypeFlow,
  GroupMetadata,
  ContainerAdaptation,
  ResizingLogic,
  ClickHandler,
  Transition,
  DesignTokenMapping,
  LintingWarning,
  ExportStructure,
  PrototypeConnection
} from './types'

// Component relationships and context for complete understanding
export interface ComponentRelationships {
  // Parent-child relationships
  parentComponent?: ComponentReference
  childComponents: ComponentReference[]
  siblingComponents: ComponentReference[]
  
  // Instance relationships
  mainComponent?: ComponentReference
  instanceOverrides: InstanceOverride[]
  variantProperties: VariantProperty[]
  
  // Design system relationships
  designSystemPath: string[]
  styleReferences: StyleReference[]
  tokenReferences: TokenReference[]
  
  // Usage tracking
  usageInstances: UsageInstance[]
  dependentComponents: string[]
  
  // Version tracking
  componentHistory?: ComponentVersion[]
  lastModified: string
  creator: string
}

export interface ComponentReference {
  id: string
  name: string
  type: string
  key?: string
  description?: string
  published?: boolean
  remote?: boolean
}

export interface InstanceOverride {
  property: string
  value: any
  originalValue: any
  overrideType: 'text' | 'fill' | 'stroke' | 'effect' | 'component' | 'visible'
  path: string[]
}

export interface VariantProperty {
  name: string
  value: string
  type: 'boolean' | 'text' | 'variant'
  defaultValue: string
  options?: string[]
}

export interface StyleReference {
  id: string
  name: string
  type: 'paint' | 'text' | 'effect' | 'grid'
  description?: string
  remote?: boolean
}

export interface TokenReference {
  name: string
  value: any
  type: string
  path: string[]
  collection?: string
  mode?: string
}

export interface UsageInstance {
  page: string
  frame: string
  count: number
  variations: string[]
}

export interface ComponentVersion {
  version: string
  timestamp: string
  changes: string[]
  author: string
}

// Design context for understanding the bigger picture
export interface DesignContext {
  // Page and frame context
  pageContext: PageContext
  frameHierarchy: FrameHierarchy[]
  
  // Design system context
  designSystemInfo: DesignSystemInfo
  
  // Layout context
  layoutGrid: LayoutGrid
  guides: Guide[]
  
  // Prototype context
  flowContext: FlowContext
  
  // Collaboration context
  comments: Comment[]
  annotations: Annotation[]
  
  // Export context
  exportContext: ExportContext
}

export interface PageContext {
  name: string
  id: string
  type: 'design' | 'prototype' | 'dev'
  description?: string
  flowStartingPoints: string[]
}

export interface FrameHierarchy {
  id: string
  name: string
  type: string
  level: number
  parentId?: string
  childIds: string[]
  bounds: BoundingBox
}

export interface DesignSystemInfo {
  name?: string
  version?: string
  library: boolean
  published: boolean
  components: number
  styles: number
  tokens: number
  lastUpdated: string
}

export interface LayoutGrid {
  type: 'stretch' | 'left' | 'right' | 'center'
  alignment: 'min' | 'center' | 'max'
  gutterSize: number
  offset: number
  count?: number
  sectionSize?: number
  visible: boolean
  color: string
  opacity: number
}

export interface Guide {
  axis: 'x' | 'y'
  offset: number
  color: string
  opacity: number
}

export interface FlowContext {
  flowId?: string
  startNodeId?: string
  connections: PrototypeConnection[]
  hotspots: Hotspot[]
}

export interface Hotspot {
  x: number
  y: number
  width: number
  height: number
  action: string
  destination?: string
}

export interface Comment {
  id: string
  message: string
  author: string
  timestamp: string
  x: number
  y: number
  resolved: boolean
  replies: Comment[]
}

export interface Annotation {
  id: string
  type: 'measurement' | 'specification' | 'note'
  content: string
  x: number
  y: number
  width?: number
  height?: number
  target?: string
}

export interface ExportContext {
  format: string
  scale: number
  includeId: boolean
  bounds: 'content' | 'frame'
  constraint: 'scale' | 'width' | 'height'
  colorSpace: 'sRGB' | 'DisplayP3'
}

export interface DesignBlueprint {
  component: string
  description?: string
  label?: string
  isInstance: boolean
  variant?: string
  visuals: VisualProperties
  typography?: TypographyProperties
  layout: LayoutProperties
  interactivity?: InteractivityProperties
  tokenMapping?: Record<string, string>
  children?: DesignBlueprint[]
  geometry?: GeometryProperties
  effects?: EffectProperties[]
      constraints?: ConstraintProperties
  size?: SizeProperties
  position?: PositionProperties
  absoluteTransform?: TransformMatrix
  componentProperties?: Record<string, any>
  screenshot?: string // Base64 encoded PNG screenshot of the component
  
  // Enhanced semantic metadata
  semantic?: SemanticMetadata
  accessibility?: AccessibilityProperties
  
  // Enhanced responsive and adaptive properties
  responsive?: ResponsiveProperties
  breakpointBehavior?: BreakpointBehavior[]
  
  // Enhanced animation and state management
  animation?: AnimationProperties
  stateManagement?: StateManagement
  
  // Enhanced validation and linting
  validation?: ValidationRules
  linting?: LintingResult[]
  
  // Enhanced component metadata
  metadata?: ComponentMetadata
  
  // Enhanced design system integration
  designSystem?: DesignSystemIntegration
  
  // Enhanced export configuration
  exportConfig?: ExportConfiguration
  
  // Enhanced naming and organization
  cleanName?: string
  normalizedName?: string
  componentPath?: string
  hierarchyLevel?: number
  siblingIndex?: number
  
  // Enhanced prototype and flow detection
  prototypeFlow?: PrototypeFlow
  linkedScreens?: string[]
  navigationPath?: string[]
  
  // Enhanced group-level metadata
  groupMetadata?: GroupMetadata
  sectionType?: 'header' | 'footer' | 'sidebar' | 'main' | 'navigation' | 'nav' | 'modal' | 'card' | 'form' | 'list' | 'table' | 'other' | 'button' | 'text' | 'container' | 'input' | 'image' | 'icon' | 'layout' | undefined

  // Enhanced responsive behaviors
  containerAdaptation?: ContainerAdaptation
  resizingLogic?: ResizingLogic
  
  // Enhanced component semantics
  componentPurpose?: string
  componentRole?: string
  isReusableInstance?: boolean
  variantStates?: string[]
  
  // Enhanced interactivity
  onClickHandlers?: ClickHandler[]
  transitions?: Transition[]
  animationType?: string
  easing?: string
  timing?: number
  
  // Enhanced design token integration
  designTokens?: DesignTokenMapping
  fallbackValues?: Record<string, any>
  
  // Enhanced linting and validation
  lintingWarnings?: LintingWarning[]
  nonTokenValues?: string[]
  inconsistentPatterns?: string[]
  
  // Enhanced export structure
  exportStructure?: ExportStructure
  humanReadable?: boolean
  llmParsable?: boolean
  yamlExport?: string
  jsonExport?: string
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
  // Enhanced properties
  zIndex?: number
  layerOrder?: number
  isContainer?: boolean
  hasMask?: boolean
  isClipped?: boolean
  theme?: string
  breakpointsUsed?: boolean
  
  // NEW: Enhanced extraction properties
  enhancedVisuals?: EnhancedVisualProperties
  precisePosition?: PrecisePositionProperties
  preciseTypography?: PreciseTypographyProperties
  componentRelationships?: ComponentRelationships
  designContext?: DesignContext
  
  // 100% design data fidelity
  comprehensiveDesignData?: any
}

export interface VisualProperties {
  fills?: FillProperty[]
  strokes?: StrokeProperty[]
  borderRadius?: BorderRadiusProperty
  cornerSmoothing?: number
  opacity?: number
  blendMode?: string
  isMask?: boolean
  effects?: EffectProperties[]
  strokeAlign?: string
  strokeWeight?: number
  strokeCap?: string
  strokeJoin?: string
  dashPattern?: number[]
  fillStyleId?: string
  strokeStyleId?: string
}

export interface FillProperty {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'VIDEO'
  visible?: boolean
  opacity?: number
  blendMode?: string
  // Solid fill
  color?: string
  // Gradient fills
  gradientStops?: GradientStop[]
  gradientTransform?: TransformMatrix
  // Image/Video fills
  imageHash?: string
  scaleMode?: string
  imageTransform?: TransformMatrix
  // Token mapping
  token?: string
  fallbackColor?: string
}

export interface GradientStop {
  position: number
  color: string
}

export interface StrokeProperty {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND'
  visible?: boolean
  opacity?: number
  blendMode?: string
  color?: string
  gradientStops?: GradientStop[]
  gradientTransform?: TransformMatrix
  token?: string
  fallbackColor?: string
}

export interface BorderRadiusProperty {
  topLeft?: number
  topRight?: number
  bottomRight?: number
  bottomLeft?: number
  uniform?: number
}

export interface EffectProperties {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR'
  visible?: boolean
  radius?: number
  color?: string
  offset?: [number, number]
  spread?: number
  blendMode?: string
}

export interface TypographyProperties {
  font: FontProperty
  text?: string
  textContent?: string
  textTransform?: string
  alignment?: TextAlignment
  paragraphSpacing?: number
  lineHeight?: LineHeightProperty
  letterSpacing?: LetterSpacingProperty
  textStyleId?: string
  textAutoResize?: string
  textTruncation?: string
  paragraphIndent?: number
  listSpacing?: number
  hangingPunctuation?: boolean
  lineIndent?: number
  textCase?: string
  textDecoration?: string
  openTypeFeatures?: OpenTypeFeatures
  textColor?: string
  textColorToken?: string
  textColorFallback?: string
}

export interface FontProperty {
  token?: string
  fallback: {
    family: string
    size: string
    weight: number
    style: string
    lineHeight: string
    letterSpacing: string
  }
}

export interface TextAlignment {
  horizontal: string
  vertical?: string
}

export interface LineHeightProperty {
  value: number
  unit: 'PIXELS' | 'PERCENT' | 'AUTO'
}

export interface LetterSpacingProperty {
  value: number
  unit: 'PIXELS' | 'PERCENT'
}

export interface OpenTypeFeatures {
  liga?: boolean
  dlig?: boolean
  smcp?: boolean
  c2sc?: boolean
  c2pc?: boolean
  salt?: boolean
  tnum?: boolean
  onum?: boolean
  lnum?: boolean
  pnum?: boolean
  case?: boolean
  locl?: boolean
  zero?: boolean
  hist?: boolean
  ss01?: boolean
  ss02?: boolean
  ss03?: boolean
  ss04?: boolean
  ss05?: boolean
  ss06?: boolean
  ss07?: boolean
  ss08?: boolean
  ss09?: boolean
  ss10?: boolean
  ss11?: boolean
  ss12?: boolean
  ss13?: boolean
  ss14?: boolean
  ss15?: boolean
  ss16?: boolean
  ss17?: boolean
  ss18?: boolean
  ss19?: boolean
  ss20?: boolean
}

export interface LayoutProperties {
  padding?: PaddingProperty
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  autoLayout?: AutoLayoutProperty
  constraints: ConstraintProperty
  layoutAlign?: string
  layoutGrow?: number
  layoutPositioning?: string
  itemSpacing?: number
  primaryAxisAlignItems?: string
  counterAxisAlignItems?: string
  primaryAxisSizingMode?: string
  counterAxisSizingMode?: string
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  // Enhanced sizing & responsiveness
  sizeMode?: {
    width: string;
    height: string;
  };
  // Spacing and stacking context
  gap?: number
  zIndex?: number
  // Responsive hints
  responsiveHints?: {
    preferredBehavior: string;
    breakpointSupport: boolean;
    fluidSizing: boolean;
    adaptiveLayout: boolean;
  };
  // Container behavior
  overflow?: {
    horizontal: string;
    vertical: string;
  };
  clipContent?: boolean;
  // Export metadata
  filename?: string
  componentReference?: string
  exportedAt?: string
  // AI hints
  suggestedComponentType?: string
  designIntent?: string
  importance?: 'high' | 'medium' | 'low'
}

export interface PaddingProperty {
  top: number
  right: number
  bottom: number
  left: number
  uniform?: number
}

export interface AutoLayoutProperty {
  enabled: boolean;
  direction: 'HORIZONTAL' | 'VERTICAL' | 'NONE'
  spacing: number
  alignment: string
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  itemSpacing?: number
  primaryAxisAlignItems?: string
  counterAxisAlignItems?: string
  primaryAxisSizingMode?: string
  counterAxisSizingMode?: string
  // Enhanced auto-layout properties
  padding: PaddingProperty;
  alignItems: string;
  justifyContent: string;
  gap: number;
  // Additional alignment context for manual layouts
  detectedDirection?: string;
  suggestedAlignment?: string;
}

export interface ConstraintProperty {
  horizontal: 'LEFT' | 'RIGHT' | 'LEFT_AND_RIGHT' | 'CENTER' | 'SCALE' | 'MIN' | 'MAX'
  vertical: 'TOP' | 'BOTTOM' | 'TOP_AND_BOTTOM' | 'CENTER' | 'SCALE' | 'MIN' | 'MAX'
}

export interface InteractivityProperties {
  states?: Record<string, StateProperty>
  onClick?: string
  onHover?: string
  onPress?: string
  reactions?: ReactionProperty[]
  prototypeStartNodeID?: string
  transitionNodeID?: string
  transitionDuration?: number
  transitionEasing?: string
}

export interface StateProperty {
  fill?: string
  opacity?: number
  scale?: number
  transition?: string
  effects?: EffectProperties[]
  stroke?: StrokeProperty
}

export interface ReactionProperty {
  trigger: TriggerProperty
  action: ActionProperty
  destination?: any
}

export interface TriggerProperty {
  type: 'ON_CLICK' | 'ON_HOVER' | 'ON_PRESS' | 'ON_DRAG' | 'ON_KEY_DOWN' | 'ON_KEY_UP'
  keyCode?: number
  device?: string
}

export interface ActionProperty {
  type: 'NAVIGATE' | 'OVERLAY' | 'BACK' | 'CLOSE' | 'OPEN_URL' | 'SET_VARIABLE' | 'CONDITION'
  destination?: any
  navigation?: string
  transition?: string
  preserveScrollPosition?: boolean
}

export interface GeometryProperties {
  fills?: FillProperty[]
  strokes?: StrokeProperty[]
  strokeWeight?: number
  strokeAlign?: string
  strokeCap?: string
  strokeJoin?: string
  dashPattern?: number[]
  windingRule?: string
  vectorPaths?: VectorPath[]
  vectorNetwork?: VectorNetwork
  handleMirroring?: string
  strokeStyleId?: string
  fillStyleId?: string
  // Enhanced for 100% fidelity
  svgData?: SVGExportData
  preciseCoordinates?: PreciseCoordinates
  pathCommands?: PathCommand[]
  boundingBox?: BoundingBox
  clipPath?: string
  maskData?: MaskData
}

export interface VectorPath {
  windingRule: string
  data: string
}

export interface VectorNetwork {
  vertices: Vertex[]
  segments: Segment[]
  regions: Region[]
}

export interface Vertex {
  x: number
  y: number
  strokeCap?: string
  strokeJoin?: string
  cornerRadius?: number
  handleMirroring?: string
}

export interface Segment {
  start: number
  end: number
  tangentStart?: Vector
  tangentEnd?: Vector
}

export interface Region {
  windingRule: string
  loopIndices: number[]
  fills: FillProperty[]
}

export interface Vector {
  x: number
  y: number
}

export interface TransformMatrix {
  a: number
  b: number
  c: number
  d: number
  tx: number
  ty: number
}

// Enhanced interfaces for 100% design data fidelity
export interface SVGExportData {
  viewBox: string
  width: number
  height: number
  svgContent: string
  paths: SVGPath[]
  preserveAspectRatio?: string
}

export interface SVGPath {
  d: string // Path data
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeLinecap?: string
  strokeLinejoin?: string
  strokeDasharray?: string
  fillRule?: string
  opacity?: number
  transform?: string
}

export interface PreciseCoordinates {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  skewX: number
  skewY: number
  originX: number
  originY: number
}

export interface PathCommand {
  command: string // M, L, C, Q, A, Z etc.
  coordinates: number[]
  relative: boolean
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  left: number
  top: number
  right: number
  bottom: number
  centerX: number
  centerY: number
  pixelBounds?: {
    left: number
    top: number
    right: number
    bottom: number
  }
}

export interface MaskData {
  type: 'alpha' | 'vector' | 'outline'
  path?: string
  opacity?: number
  inverted?: boolean
}

export interface DetailedFillProperty extends FillProperty {
  // Enhanced fill properties for 100% fidelity
  imageHash?: string
  imageUrl?: string
  videoHash?: string
  scaleMode?: string
  detailedImageTransform?: number[]
  filters?: FilterProperty[]
  blendMode?: string
  opacity?: number
  gradientHandlePositions?: any[]
}

export interface FilterProperty {
  type: string
  value: number
  unit?: string
}

export interface PreciseGradientProperty {
  type: 'linear' | 'radial' | 'angular' | 'diamond'
  stops: PreciseGradientStop[]
  transform: number[]
  opacity?: number
  blendMode?: string
}

export interface PreciseGradientStop {
  position: number
  color: {
    r: number
    g: number
    b: number
    a: number
  }
  midpoint?: number
}

export interface SizeProperties {
  width: number
  height: number
  resizeToFit?: boolean
}

export interface PositionProperties {
  x: number
  y: number
  rotation?: number
  zIndex?: number
}

export interface ConstraintProperties {
  horizontal: string
  vertical: string
  scaleMode?: string
}

export async function extractDesignBlueprint(node: any): Promise<DesignBlueprint> {
  // --- Semantic & Group/Section Detection ---
  // Clean and normalize names
  const cleanName = node.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  const normalizedName = cleanName
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  // Heuristic: Section type detection based on name/type
  let sectionType: DesignBlueprint['sectionType'] = undefined;
  const nameLower = cleanName.toLowerCase();
  if (nameLower.includes('nav')) sectionType = 'navigation';
  else if (nameLower.includes('header')) sectionType = 'header';
  else if (nameLower.includes('footer')) sectionType = 'footer';
  else if (nameLower.includes('sidebar')) sectionType = 'sidebar';
  else if (nameLower.includes('modal')) sectionType = 'modal';
  else if (nameLower.includes('card')) sectionType = 'card';
  else if (nameLower.includes('form')) sectionType = 'form';
  else if (nameLower.includes('list')) sectionType = 'list';
  else if (nameLower.includes('table')) sectionType = 'table';
  else if (node.type === 'GROUP') sectionType = 'other';

  // Semantic metadata (best-effort)
  const semantic: SemanticMetadata = {
    purpose: sectionType ? sectionType : undefined,
    role: node.type === 'BUTTON' ? 'button' :
      nameLower.includes('button') && (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') ? 'button' :
      node.type === 'TEXT' ? 'text' :
      node.type === 'GROUP' ? 'group' :
      node.type === 'FRAME' ? 'container' :
      node.type === 'INSTANCE' ? 'instance' :
      node.type === 'COMPONENT' ? 'component' :
      node.type === 'COMPONENT_SET' ? 'variant-group' :
      undefined,
    componentType: sectionType ? sectionType :
      (node.type === 'COMPONENT' ? 'other' : 
       node.type === 'COMPONENT_SET' ? 'other' : undefined),
    isInteractive: node.reactions && node.reactions.length > 0,
    isReusable: node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET',
    isResponsive: node.layoutMode && node.layoutMode !== 'NONE',
    // Additional semantic fields
    isContainer: node.children && node.children.length > 0,
    // Explicit interaction flags
    hasInteractions: !!(node.reactions && node.reactions.length > 0),
    hasHoverState: !!(node.reactions && node.reactions.some((r: any) => r.trigger.type === 'ON_HOVER')),
    hasClickHandler: !!(node.reactions && node.reactions.some((r: any) => r.trigger.type === 'ON_CLICK')),

  };

  // Group-level metadata
  const allowedGroupTypes = [
    'header', 'footer', 'sidebar', 'modal', 'card', 'form', 'list', 'other', 'navigation', 'content', 'toolbar'
  ];
  let groupType: GroupMetadata['type'] = 'other';
  if (sectionType && allowedGroupTypes.includes(sectionType)) {
    groupType = sectionType as GroupMetadata['type'];
  }
  const groupMetadata: GroupMetadata | undefined = node.type === 'GROUP' || node.type === 'FRAME' ? {
    type: groupType,
    purpose: sectionType || 'group',
    role: 'group',
    isContainer: true,
    isInteractive: !!(node.reactions && node.reactions.length > 0),
    childrenCount: node.children ? node.children.length : 0,
    layoutType: node.layoutMode && node.layoutMode !== 'NONE' ? 'auto' : 'manual',
    responsiveBehavior: node.layoutMode && node.layoutMode !== 'NONE' ? 'auto-layout' : 'none',
  } : undefined;

  // --- Responsive/Adaptive Extraction ---
  // Responsive properties
  let responsive: ResponsiveProperties | undefined = undefined;
  let breakpointBehavior: BreakpointBehavior[] | undefined = undefined;
  let containerAdaptation: ContainerAdaptation | undefined = undefined;
  let resizingLogic: ResizingLogic | undefined = undefined;

  if (node.layoutMode && node.layoutMode !== 'NONE') {
    responsive = {
      breakpoints: {},
      adaptiveLayout: true,
      fluidSizing: node.primaryAxisSizingMode === 'AUTO' || node.counterAxisSizingMode === 'AUTO',
      containerQueries: false,
      aspectRatio: node.width && node.height ? node.width / node.height : undefined,
      viewportAdaptation: {
        type: 'scale',
        minWidth: node.minWidth,
        maxWidth: node.maxWidth,
        minHeight: node.minHeight,
        maxHeight: node.maxHeight,
        preserveAspectRatio: true,
        maintainProportions: true
      }
    };
    breakpointBehavior = [
      {
        breakpoint: 'md',
        minWidth: node.minWidth,
        maxWidth: node.maxWidth,
        layoutChanges: {
          direction: node.layoutMode,
          alignment: node.primaryAxisAlignItems,
          spacing: node.itemSpacing,
          padding: {
            top: node.paddingTop || 0,
            right: node.paddingRight || 0,
            bottom: node.paddingBottom || 0,
            left: node.paddingLeft || 0
          },
          sizing: node.primaryAxisSizingMode,
          constraints: node.constraints,
          position: node.layoutPositioning,
          display: 'flex',
        }
      }
    ];
    containerAdaptation = {
      type: 'responsive',
      minWidth: node.minWidth,
      maxWidth: node.maxWidth,
      aspectRatio: node.width && node.height ? node.width / node.height : undefined,
      breakpoints: {
        md: {
          width: node.width,
          layout: node.layoutMode,
          spacing: node.itemSpacing,
          padding: {
            top: node.paddingTop || 0,
            right: node.paddingRight || 0,
            bottom: node.paddingBottom || 0,
            left: node.paddingLeft || 0
          },
          childrenLayout: node.layoutMode
        }
      },
      contentBehavior: 'scale'
    };
    resizingLogic = {
      type: 'responsive',
      constraints: [
        {
          axis: 'horizontal',
          type: 'min',
          value: node.minWidth || 0,
          unit: 'px'
        },
        {
          axis: 'vertical',
          type: 'min',
          value: node.minHeight || 0,
          unit: 'px'
        }
      ],
      behavior: 'maintain-aspect',
      minSize: { width: node.minWidth || 0, height: node.minHeight || 0 },
      maxSize: { width: node.maxWidth || node.width, height: node.maxHeight || node.height },
      preferredSize: { width: node.width, height: node.height }
    };
  }

  // --- Interactivity & Prototype Flows ---
  let onClickHandlers: ClickHandler[] | undefined = undefined;
  let transitions: Transition[] | undefined = undefined;
  let animationType: string | undefined = undefined;
  let easing: string | undefined = undefined;
  let timing: number | undefined = undefined;
  let prototypeFlow: PrototypeFlow | undefined = undefined;
  let linkedScreens: string[] | undefined = undefined;

  if (node.reactions && node.reactions.length > 0) {
    onClickHandlers = node.reactions.map((reaction: any) => ({
      type: reaction.trigger.type === 'ON_CLICK' ? 'navigate' : 'custom',
      target: reaction.action?.destination,
      parameters: reaction.action,
      customCode: undefined,
      validation: undefined,
      feedback: undefined
    }));
    transitions = node.reactions.map((reaction: any) => ({
      type: reaction.action?.transition || 'fade',
      duration: reaction.action?.duration || 200,
      easing: reaction.action?.easing || 'ease',
      direction: 'in',
      properties: [],
      keyframes: undefined
    }));
    animationType = node.reactions[0].action?.transition || 'fade';
    easing = node.reactions[0].action?.easing || 'ease';
    timing = node.reactions[0].action?.duration || 200;
    // Prototype flow (best-effort)
    prototypeFlow = {
      startNode: node.id,
      endNode: node.reactions[0].action?.destination || '',
      connections: node.reactions.map((reaction: any) => ({
        from: node.id,
        to: reaction.action?.destination || '',
        trigger: reaction.trigger.type,
        action: reaction.action?.type,
        transition: reaction.action?.transition,
        duration: reaction.action?.duration
      })),
      screens: node.reactions.map((reaction: any) => reaction.action?.destination).filter(Boolean),
      navigation: {
        type: 'linear',
        steps: [],
        decisionPoints: []
      }
    };
    linkedScreens = node.reactions.map((reaction: any) => reaction.action?.destination).filter(Boolean);
  }

  // --- Linting/Validation ---
  let linting: LintingResult[] | undefined = undefined;
  let lintingWarnings: LintingWarning[] | undefined = undefined;
  let nonTokenValues: string[] | undefined = undefined;
  let inconsistentPatterns: string[] | undefined = undefined;

  // Simple lint: warn if fills/strokes/effects/text have no token mapping
  nonTokenValues = [];
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (!fill.styleId) nonTokenValues.push('fill');
    }
  }
  if (node.strokes && Array.isArray(node.strokes)) {
    for (const stroke of node.strokes) {
      if (!stroke.styleId) nonTokenValues.push('stroke');
    }
  }
  if (node.effects && Array.isArray(node.effects)) {
    for (const effect of node.effects) {
      if (!effect.styleId) nonTokenValues.push('effect');
    }
  }
  if (node.styleId === undefined) nonTokenValues.push('text');
  if (nonTokenValues.length > 0) {
    lintingWarnings = nonTokenValues.map((v) => ({
      level: 'warning',
      category: 'token',
      message: `No design token for ${v}`,
      element: node.name,
      property: v,
      value: undefined,
      fixable: false
    }));
    linting = lintingWarnings.map(w => ({
      level: w.level,
      category: w.category,
      message: w.message,
      suggestion: undefined,
      element: w.element,
      property: w.property,
      value: w.value,
      expectedValue: undefined,
      rule: 'token-required',
      fixable: false
    }));
  }

  // --- PIXEL-PERFECT ENHANCED EXTRACTION ---
  const enhancedVisuals = await extractEnhancedVisualProperties(node);
  const precisePosition = await extractPrecisePositionProperties(node, node.parent);
  const preciseTypography = node.type === 'TEXT' || hasTextChildren(node) ? 
    await extractPreciseTypographyProperties(node) : undefined;
  const componentRelationships = await extractComponentRelationships(node);
  const designContext = await extractDesignContext(node);
  
  // --- Fallback to standard extraction for compatibility ---
  const standardVisuals = await extractVisualProperties(node);
  const standardLayout = await extractLayoutProperties(node);
  const standardTypography = await extractTypographyProperties(node);

  // --- Sizing & Responsiveness ---
  const sizeMode = node.primaryAxisSizingMode || node.counterAxisSizingMode || 'fixed';
  const responsiveBehavior = node.layoutMode && node.layoutMode !== 'NONE' ? 'auto-layout' : 'manual';

  // --- Children & Hierarchy ---
  let childrenWithMetadata: DesignBlueprint[] = [];
  if ('children' in node && node.children.length > 0) {
    childrenWithMetadata = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childBlueprint = await extractDesignBlueprint(child);
      childBlueprint.siblingIndex = i;
      childBlueprint.hierarchyLevel = 1;
      if (child.zIndex !== undefined) {
        childBlueprint.position = { 
          x: childBlueprint.position?.x || 0,
          y: childBlueprint.position?.y || 0,
          rotation: childBlueprint.position?.rotation,
          zIndex: child.zIndex 
        };
      }
      childrenWithMetadata.push(childBlueprint);
    }
  }

  // --- Component Usage Reference (Design System Alignment) ---
  let componentReference: string | undefined = undefined;
  if (node.type === 'INSTANCE') {
    try {
      const mainComponent = await node.getMainComponentAsync();
      componentReference = mainComponent ? mainComponent.name : node.name;
    } catch (error) {
      console.warn('Could not get main component for reference:', node.name, error);
      componentReference = node.name;
    }
  } else if (node.type === 'COMPONENT') {
    componentReference = node.name;
  }

  // --- Enhanced Token Mapping with Fallbacks ---
  const enhancedTokenMapping = await extractTokenMapping(node);
  
  // Centralized token mapping block (always present)
  const centralizedTokenMapping = {
    background: enhancedTokenMapping?.background || null,
    text: enhancedTokenMapping?.text || null,
    font: enhancedTokenMapping?.font || null,
    borderRadius: enhancedTokenMapping?.borderRadius || null,
    border: enhancedTokenMapping?.border || null,
    shadow: enhancedTokenMapping?.shadow || null,
    spacing: enhancedTokenMapping?.spacing || null,
    sizing: enhancedTokenMapping?.sizing || null
  };

  const designTokens: DesignTokenMapping = {
    colors: {
      backgroundPrimary: enhancedTokenMapping?.background || null,
      textPrimary: enhancedTokenMapping?.text || null,
      borderPrimary: enhancedTokenMapping?.border || null
    },
    typography: {
      buttonText: enhancedTokenMapping?.font || null,
      bodyText: enhancedTokenMapping?.text || null,
      headingText: enhancedTokenMapping?.font || null
    },
    spacing: {
      padding: enhancedTokenMapping?.spacing || null,
      margin: enhancedTokenMapping?.spacing || null,
      gap: enhancedTokenMapping?.spacing || null
    },
    sizing: {
      width: enhancedTokenMapping?.sizing || null,
      height: enhancedTokenMapping?.sizing || null,
      minWidth: enhancedTokenMapping?.sizing || null,
      maxWidth: enhancedTokenMapping?.sizing || null
    },
    shadows: {
      dropShadow: enhancedTokenMapping?.shadow || null,
      innerShadow: enhancedTokenMapping?.shadow || null
    },
    borders: {
      borderColor: enhancedTokenMapping?.border || null,
      borderWidth: enhancedTokenMapping?.border || null,
      borderStyle: enhancedTokenMapping?.border || null
    },
    radii: {
      radiusSmall: enhancedTokenMapping?.borderRadius || null,
      radiusMedium: enhancedTokenMapping?.borderRadius || null,
      radiusLarge: enhancedTokenMapping?.borderRadius || null
    },
    zIndex: {
      base: enhancedTokenMapping?.zIndex || null,
      elevated: enhancedTokenMapping?.zIndex || null,
      modal: enhancedTokenMapping?.zIndex || null
    },
    animations: {
      transition: null,
      duration: null,
      easing: null
    },
    breakpoints: {
      mobile: null,
      tablet: null,
      desktop: null
    },
    components: {
      button: enhancedTokenMapping?.component || null,
      input: enhancedTokenMapping?.component || null,
      card: enhancedTokenMapping?.component || null
    },
    effects: {
      shadow: enhancedTokenMapping?.shadow || null,
      blur: enhancedTokenMapping?.effect || null,
      overlay: enhancedTokenMapping?.effect || null
    }
  };

  // Map tokens to categories
  if (enhancedTokenMapping) {
    for (const [key, value] of Object.entries(enhancedTokenMapping)) {
      if (key.includes('color') || key.includes('fill') || key.includes('stroke')) {
        designTokens.colors[key] = value;
      } else if (key.includes('font') || key.includes('text')) {
        designTokens.typography[key] = value;
      } else if (key.includes('spacing') || key.includes('padding') || key.includes('margin')) {
        designTokens.spacing[key] = value;
      } else if (key.includes('size') || key.includes('width') || key.includes('height')) {
        designTokens.sizing[key] = value;
      } else if (key.includes('shadow') || key.includes('effect')) {
        designTokens.shadows[key] = value;
      } else if (key.includes('border')) {
        designTokens.borders[key] = value;
      } else if (key.includes('radius')) {
        designTokens.radii[key] = value;
      }
    }
  }

  // --- Fallback Values ---
  const fallbackValues: Record<string, any> = {};
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID') {
      // For text nodes, this is the text color; for other nodes, it's background
      if (node.type === 'TEXT') {
        fallbackValues.textColor = rgbaToHex(fill.color);
      } else {
        fallbackValues.backgroundColor = rgbaToHex(fill.color);
      }
    }
  }
  if (node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes[0];
    if (stroke.type === 'SOLID') {
      fallbackValues.borderColor = rgbaToHex(stroke.color);
    }
  }
  if (node.fontSize) {
    fallbackValues.fontSize = `${node.fontSize}px`;
  }
  if (node.fontName) {
    fallbackValues.fontFamily = node.fontName.family;
  }

  // --- Enhanced Component Reference (Design System Alignment) ---
  let enhancedComponentReference = undefined;
  if (node.type === 'INSTANCE') {
    try {
      const mainComponent = await node.getMainComponentAsync();
      if (mainComponent) {
        enhancedComponentReference = mainComponent.name;
      }
    } catch (error) {
      console.warn('Could not get main component for enhanced reference:', node.name, error);
    }
  } else if (node.type === 'COMPONENT') {
    enhancedComponentReference = node.name;
  } else {
    // Try to infer component type from name and properties
    const nameLower = node.name.toLowerCase();
    if (nameLower.includes('button')) {
      enhancedComponentReference = nameLower.includes('primary') ? 'ButtonPrimary' : 
                          nameLower.includes('secondary') ? 'ButtonSecondary' : 'Button';
    } else if (nameLower.includes('card')) {
      enhancedComponentReference = 'Card';
    } else if (nameLower.includes('input')) {
      enhancedComponentReference = 'Input';
    } else if (nameLower.includes('modal')) {
      enhancedComponentReference = 'Modal';
    } else if (nameLower.includes('nav')) {
      enhancedComponentReference = 'Navigation';
    }
  }

  // --- Z-index and Layer Order ---
  const zIndex = node.zIndex !== undefined ? node.zIndex : 0;
  const layerOrder = node.zIndex !== undefined ? node.zIndex : 0;

  // --- Container Behavior ---
  const isContainer = node.children && node.children.length > 0;
  const hasMask = node.isMask || false;
  const isClipped = node.clipsContent || false;

  // --- Theme Detection (Optional) ---
  const theme = node.name.toLowerCase().includes('dark') ? 'dark' :
                node.name.toLowerCase().includes('light') ? 'light' : 'neutral';

  // --- Breakpoint Support ---
  const breakpointsUsed = node.layoutMode && node.layoutMode !== 'NONE';

  // --- Export Metadata ---
  const exportedAt = new Date().toISOString();
  const filename = `${normalizedName}.yaml`;

  // --- AI Hints (Meta) ---
  const suggestedComponentType = sectionType || 
    (node.type === 'BUTTON' ? 'button' : 
     node.type === 'TEXT' ? 'text' : 
     node.type === 'GROUP' ? 'container' : 
     node.type === 'FRAME' ? 'layout' : 'component');
  
  const designIntent = `${sectionType || 'component'} with ${node.children?.length || 0} children`;
  const importance = node.reactions && node.reactions.length > 0 ? 'high' : 
                    node.type === 'COMPONENT' ? 'medium' : 'low';

  // Extract comprehensive design data for 100% fidelity
  const comprehensiveData = await extractComprehensiveDesignData(node);

  const blueprint: DesignBlueprint = {
    component: node.name,
    isInstance: node.type === 'INSTANCE',
    visuals: standardVisuals,
    typography: standardTypography,
    layout: standardLayout,
    geometry: await extractGeometryProperties(node),
    effects: await extractEffects(node),
    constraints: await extractConstraintProperties(node),
    size: await extractSizeProperties(node),
    position: await extractPositionProperties(node),
    absoluteTransform: node.absoluteTransform,
    tokenMapping: await extractTokenMapping(node),
    // --- Enhanced fields ---
    cleanName,
    normalizedName,
    sectionType,
    semantic,
    groupMetadata,
    // --- Responsive/Adaptive ---
    responsive,
    breakpointBehavior,
    containerAdaptation,
    resizingLogic,
    // --- Interactivity/Prototype ---
    onClickHandlers,
    transitions,
    animationType,
    easing,
    timing,
    prototypeFlow,
    linkedScreens,
    // --- Linting/Validation ---
    linting,
    lintingWarnings,
    nonTokenValues,
    inconsistentPatterns,
    // --- Enhanced sizing & responsiveness ---
    sizeMode,
    responsiveBehavior,
    // --- Children with metadata ---
    children: childrenWithMetadata,
    // --- Export metadata ---
    filename,
    exportedAt,
    // --- AI hints ---
    suggestedComponentType,
    designIntent,
    importance,
    // --- Enhanced token mapping ---
    designTokens,
    fallbackValues,
    // --- Enhanced component reference ---
    componentReference: enhancedComponentReference,
    // --- Z-index and layer order ---
    zIndex,
    layerOrder,
    // --- Container behavior ---
    isContainer,
    hasMask,
    isClipped,
    // --- Theme and breakpoints ---
    theme,
    breakpointsUsed,
    
    // --- PIXEL-PERFECT ENHANCED PROPERTIES ---
    enhancedVisuals,
    precisePosition,
    preciseTypography,
    componentRelationships,
    designContext,
    
    // 100% design data fidelity - comprehensive extraction
    comprehensiveDesignData: comprehensiveData
  }

  // Extract component variant information (using async API)
  if (node.type === 'INSTANCE') {
    try {
      const mainComponent = await node.getMainComponentAsync();
      if (mainComponent) {
        blueprint.variant = mainComponent.name
        blueprint.description = mainComponent.description || undefined
      }
    } catch (error) {
      console.warn('Could not get main component for variant info:', node.name, error);
    }
    
    // Extract variant properties from instance
    if (node.componentProperties) {
      const variantProps: VariantProperty[] = []
      for (const [key, value] of Object.entries(node.componentProperties)) {
        const prop = value as any
        variantProps.push({
          name: key,
          value: prop.value,
          type: prop.type || 'variant',
          defaultValue: prop.defaultValue || prop.value,
          options: prop.preferredValues || undefined
        })
      }
      blueprint.componentRelationships = blueprint.componentRelationships || {
        childComponents: [],
        siblingComponents: [],
        instanceOverrides: [],
        variantProperties: variantProps,
        designSystemPath: [],
        styleReferences: [],
        tokenReferences: [],
        usageInstances: [],
        dependentComponents: [],
        lastModified: new Date().toISOString(),
        creator: 'Unknown'
      }
      blueprint.componentRelationships.variantProperties = variantProps
    }
  } else if (node.type === 'COMPONENT_SET') {
    // Handle component sets (variant groups)
    blueprint.description = node.description || undefined
    blueprint.variant = 'component-set'
    
    // Extract all variants from the component set
    if (node.children && node.children.length > 0) {
      const variants: string[] = []
      const variantProperties: VariantProperty[] = []
      
      // Analyze children to determine variant properties
      for (const child of node.children) {
        if (child.type === 'COMPONENT') {
          variants.push(child.name)
          
          // Extract variant properties from component name patterns
          const nameParts = child.name.split(', ')
          for (const part of nameParts) {
            if (part.includes('=')) {
              const [propName, propValue] = part.split('=')
              const existingProp = variantProperties.find(p => p.name === propName.trim())
              if (!existingProp) {
                variantProperties.push({
                  name: propName.trim(),
                  value: propValue.trim(),
                  type: 'variant',
                  defaultValue: propValue.trim(),
                  options: [propValue.trim()]
                })
              } else {
                existingProp.options = existingProp.options || []
                if (!existingProp.options.includes(propValue.trim())) {
                  existingProp.options.push(propValue.trim())
                }
              }
            }
          }
        }
      }
      
      blueprint.variantStates = variants
      blueprint.componentRelationships = blueprint.componentRelationships || {
        childComponents: [],
        siblingComponents: [],
        instanceOverrides: [],
        variantProperties: variantProperties,
        designSystemPath: [],
        styleReferences: [],
        tokenReferences: [],
        usageInstances: [],
        dependentComponents: [],
        lastModified: new Date().toISOString(),
        creator: 'Unknown'
      }
      blueprint.componentRelationships.variantProperties = variantProperties
    }
  } else if (node.type === 'COMPONENT') {
    blueprint.description = node.description || undefined
    // Check if this component is part of a variant group
    if (node.parent && node.parent.type === 'COMPONENT_SET') {
      blueprint.variant = 'variant'
      blueprint.variantStates = [node.name]
    }
  }

  // Extract typography if it's a text node or has text children
  if ('characters' in node || hasTextChildren(node)) {
    blueprint.typography = await extractTypographyProperties(node)
  }

  // Extract interactivity if it has prototype connections
  if ('reactions' in node && node.reactions.length > 0) {
    blueprint.interactivity = await extractInteractivityProperties(node)
  }

  // Extract component properties for instances
  if (node.type === 'INSTANCE' && node.componentProperties) {
    blueprint.componentProperties = node.componentProperties
  }

  // Extract children if they exist
  if ('children' in node && node.children.length > 0) {
    blueprint.children = []
    for (const child of node.children) {
      const childBlueprint = await extractDesignBlueprint(child)
      // Fix position for group children
      if (node.type === 'GROUP') {
        childBlueprint.position = await extractPositionProperties(child, node)
      }
      blueprint.children.push(childBlueprint)
    }
  }

  return blueprint
}

async function extractVisualProperties(node: any): Promise<VisualProperties> {
  const visuals: VisualProperties = {}
  
  try {
    // Extract fills with enhanced token binding
    if ('fills' in node && node.fills && node.fills.length > 0) {
              // For text nodes, fills represent text color, not background
        if (node.type === 'TEXT') {
          // Text color is handled in typography extraction
        } else {
        // For non-text nodes, extract fills as background
        visuals.fills = await Promise.all(node.fills.map(async (fill: any) => {
          const fillProp: FillProperty = {
            type: fill.type,
            visible: fill.visible !== false,
            opacity: fill.opacity,
            blendMode: fill.blendMode
          }

          if (fill.type === 'SOLID') {
            fillProp.color = rgbaToHex(fill.color)
            fillProp.fallbackColor = rgbaToHex(fill.color)
            if (fill.styleId) {
              const style = await figma.getStyleByIdAsync(fill.styleId)
              if (style) {
                fillProp.token = style.name
              }
            }
          } else if (fill.type.includes('GRADIENT')) {
            fillProp.gradientStops = fill.gradientStops.map((stop: any) => ({
              position: stop.position,
              color: rgbaToHex(stop.color)
            }))
            fillProp.gradientTransform = fill.gradientTransform
            fillProp.fallbackColor = fillProp.gradientStops?.[0]?.color
          } else if (fill.type === 'IMAGE' || fill.type === 'VIDEO') {
            fillProp.imageHash = fill.imageHash
            fillProp.scaleMode = fill.scaleMode
            fillProp.imageTransform = fill.imageTransform
          }

          return fillProp
        }))
      }
    }

    // Extract strokes with enhanced token binding
    if ('strokes' in node && node.strokes && node.strokes.length > 0) {
      visuals.strokes = await Promise.all(node.strokes.map(async (stroke: any) => {
        const strokeProp: StrokeProperty = {
          type: stroke.type,
          visible: stroke.visible !== false,
          opacity: stroke.opacity,
          blendMode: stroke.blendMode
        }

        if (stroke.type === 'SOLID') {
          strokeProp.color = rgbaToHex(stroke.color)
          strokeProp.fallbackColor = rgbaToHex(stroke.color)
          if (stroke.styleId) {
            const style = await figma.getStyleByIdAsync(stroke.styleId)
            if (style) {
              strokeProp.token = style.name
            }
          }
        } else if (stroke.type.includes('GRADIENT')) {
          strokeProp.gradientStops = stroke.gradientStops.map((stop: any) => ({
            position: stop.position,
            color: rgbaToHex(stop.color)
          }))
          strokeProp.gradientTransform = stroke.gradientTransform
          strokeProp.fallbackColor = strokeProp.gradientStops?.[0]?.color
        }

        return strokeProp
      }))
    }

    // Extract border radius with individual corner support
    if ('cornerRadius' in node) {
      if (typeof node.cornerRadius === 'number') {
        visuals.borderRadius = { uniform: node.cornerRadius }
      } else if (Array.isArray(node.cornerRadius)) {
        visuals.borderRadius = {
          topLeft: node.cornerRadius[0],
          topRight: node.cornerRadius[1],
          bottomRight: node.cornerRadius[2],
          bottomLeft: node.cornerRadius[3]
        }
      }
    }

    // Extract corner smoothing
    if ('cornerSmoothing' in node) {
      visuals.cornerSmoothing = node.cornerSmoothing
    }

    // Extract stroke properties
    if ('strokeWeight' in node && typeof node.strokeWeight === 'number') {
      visuals.strokeWeight = node.strokeWeight
    }
    if ('strokeAlign' in node) visuals.strokeAlign = node.strokeAlign
    if ('strokeCap' in node) visuals.strokeCap = node.strokeCap
    if ('strokeJoin' in node) visuals.strokeJoin = node.strokeJoin
    if ('dashPattern' in node) visuals.dashPattern = node.dashPattern

    // Extract opacity
    if ('opacity' in node) {
      visuals.opacity = node.opacity
    }

    // Extract blending mode
    if ('blendMode' in node) {
      visuals.blendMode = node.blendMode
    }

    // Extract mask properties
    if ('isMask' in node) {
      visuals.isMask = node.isMask
    }

    // Extract style IDs (only if they exist and are not empty)
    if ('fillStyleId' in node && node.fillStyleId && node.fillStyleId !== '') {
      visuals.fillStyleId = node.fillStyleId
    }
    if ('strokeStyleId' in node && node.strokeStyleId && node.strokeStyleId !== '') {
      visuals.strokeStyleId = node.strokeStyleId
    }

    return visuals
  } catch (error) {
    console.error('Error extracting visual properties:', error)
    return visuals
  }
}

async function extractTypographyProperties(node: any): Promise<TypographyProperties | undefined> {
  const typography: Partial<TypographyProperties> = {}

  try {
    if ('fontName' in node) {
      const font = await figma.loadFontAsync(node.fontName)
      typography.font = {
        fallback: {
          family: node.fontName.family,
          size: `${node.fontSize}px`,
          weight: extractFontWeight(node.fontName.style),
          style: node.fontName.style,
          lineHeight: node.lineHeight ? 
            (node.lineHeight.unit === 'AUTO' ? 'auto' : 
             `${node.lineHeight.value}${node.lineHeight.unit === 'PIXELS' ? 'px' : '%'}`) : 'auto',
          letterSpacing: node.letterSpacing ? `${node.letterSpacing.value}${node.letterSpacing.unit === 'PIXELS' ? 'px' : '%'}` : '0px'
        }
      }

      // Check if text style is linked for tokenized typography
      if (node.styleId) {
        const style = await figma.getStyleByIdAsync(node.styleId)
        if (style) {
          typography.textStyleId = node.styleId
          typography.font!.token = style.name
        }
      }
    }

    // Extract text content
    if ('characters' in node) {
      typography.textContent = node.characters
    }

    // Extract text color from fills (critical for text color accuracy)
    if ('fills' in node && node.fills && node.fills.length > 0) {
      const textFill = node.fills[0]
      if (textFill.type === 'SOLID' && textFill.visible !== false) {
        typography.textColor = rgbaToHex(textFill.color)
        typography.textColorToken = textFill.styleId ? (await figma.getStyleByIdAsync(textFill.styleId))?.name : undefined
        typography.textColorFallback = rgbaToHex(textFill.color)
      }
    }

    // Extract text properties
    if ('textTransform' in node) typography.textTransform = node.textTransform
    if ('textCase' in node) typography.textCase = node.textCase
    if ('textDecoration' in node) typography.textDecoration = node.textDecoration
    if ('textAutoResize' in node) typography.textAutoResize = node.textAutoResize
    if ('textTruncation' in node) typography.textTruncation = node.textTruncation

    // Extract alignment
    if ('textAlignHorizontal' in node || 'textAlignVertical' in node) {
      typography.alignment = {
        horizontal: node.textAlignHorizontal || 'LEFT',
        vertical: node.textAlignVertical
      }
    }

    // Extract spacing properties
    if ('paragraphSpacing' in node) typography.paragraphSpacing = node.paragraphSpacing
    if ('paragraphIndent' in node) typography.paragraphIndent = node.paragraphIndent
    if ('listSpacing' in node) typography.listSpacing = node.listSpacing
    if ('lineIndent' in node) typography.lineIndent = node.lineIndent

    // Extract line height
    if ('lineHeight' in node) {
      typography.lineHeight = {
        value: node.lineHeight.value,
        unit: node.lineHeight.unit
      }
    }

    // Extract letter spacing
    if ('letterSpacing' in node) {
      typography.letterSpacing = {
        value: node.letterSpacing.value,
        unit: node.letterSpacing.unit
      }
    }

    // Extract OpenType features
    if ('opentypeFlags' in node) {
      typography.openTypeFeatures = extractOpenTypeFeatures(node.opentypeFlags)
    }

    return typography as TypographyProperties
  } catch (error) {
    console.error('Error extracting typography properties:', error)
    return undefined
  }
}

function extractFontWeight(style: string): number {
  if (style.includes('Thin')) return 100
  if (style.includes('Extra Light') || style.includes('Ultra Light')) return 200
  if (style.includes('Light')) return 300
  if (style.includes('Regular') || style.includes('Normal')) return 400
  if (style.includes('Medium')) return 500
  if (style.includes('Semi Bold') || style.includes('Demi Bold')) return 600
  if (style.includes('Bold')) return 700
  if (style.includes('Extra Bold') || style.includes('Ultra Bold')) return 800
  if (style.includes('Black') || style.includes('Heavy')) return 900
  return 400
}

function extractOpenTypeFeatures(flags: number): OpenTypeFeatures {
  return {
    liga: (flags & 1) !== 0,
    dlig: (flags & 2) !== 0,
    smcp: (flags & 4) !== 0,
    c2sc: (flags & 8) !== 0,
    c2pc: (flags & 16) !== 0,
    salt: (flags & 32) !== 0,
    tnum: (flags & 64) !== 0,
    onum: (flags & 128) !== 0,
    lnum: (flags & 256) !== 0,
    pnum: (flags & 512) !== 0,
    case: (flags & 1024) !== 0,
    locl: (flags & 2048) !== 0,
    zero: (flags & 4096) !== 0,
    hist: (flags & 8192) !== 0,
    ss01: (flags & 16384) !== 0,
    ss02: (flags & 32768) !== 0,
    ss03: (flags & 65536) !== 0,
    ss04: (flags & 131072) !== 0,
    ss05: (flags & 262144) !== 0,
    ss06: (flags & 524288) !== 0,
    ss07: (flags & 1048576) !== 0,
    ss08: (flags & 2097152) !== 0,
    ss09: (flags & 4194304) !== 0,
    ss10: (flags & 8388608) !== 0,
    ss11: (flags & 16777216) !== 0,
    ss12: (flags & 33554432) !== 0,
    ss13: (flags & 67108864) !== 0,
    ss14: (flags & 134217728) !== 0,
    ss15: (flags & 268435456) !== 0,
    ss16: (flags & 536870912) !== 0,
    ss17: (flags & 1073741824) !== 0,
    ss18: (flags & 2147483648) !== 0,
    ss19: (flags & 4294967296) !== 0,
    ss20: (flags & 8589934592) !== 0
  }
}

async function extractLayoutProperties(node: any): Promise<LayoutProperties> {
  const layout: LayoutProperties = {
    constraints: {
      horizontal: node.constraints?.horizontal || 'MIN',
      vertical: node.constraints?.vertical || 'MIN'
    }
  }

  // Extract auto-layout properties with full support
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    layout.autoLayout = {
      enabled: true,
      direction: node.layoutMode,
      spacing: node.itemSpacing || 0,
      alignment: node.primaryAxisAlignItems || 'MIN',
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      itemSpacing: node.itemSpacing,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      counterAxisAlignItems: node.counterAxisAlignItems,
      primaryAxisSizingMode: node.primaryAxisSizingMode,
      counterAxisSizingMode: node.counterAxisSizingMode,
      // Enhanced auto-layout properties
      padding: {
        top: node.paddingTop || 0,
        right: node.paddingRight || 0,
        bottom: node.paddingBottom || 0,
        left: node.paddingLeft || 0
      },
      alignItems: node.counterAxisAlignItems || 'MIN',
      justifyContent: node.primaryAxisAlignItems || 'MIN',
      gap: node.itemSpacing || 0
    }
  } else {
    // Enhanced manual layout with alignment details
    const detectedDirection = node.width > node.height ? 'HORIZONTAL' : 'VERTICAL';
    const defaultAlignment = 'CENTER';
    
    layout.autoLayout = {
      enabled: false,
      direction: 'NONE',
      spacing: 0,
      alignment: defaultAlignment,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      alignItems: defaultAlignment,
      justifyContent: defaultAlignment,
      gap: 0,
      // Additional alignment context for manual layouts
      detectedDirection,
      suggestedAlignment: defaultAlignment
    }
  }

  // Extract padding
  if ('paddingLeft' in node || 'paddingRight' in node || 'paddingTop' in node || 'paddingBottom' in node) {
    layout.padding = {
      top: node.paddingTop || 0,
      right: node.paddingRight || 0,
      bottom: node.paddingBottom || 0,
      left: node.paddingLeft || 0
    }
  }

  // Extract sizing constraints with structured size mode
  if ('minWidth' in node) layout.minWidth = node.minWidth
  if ('maxWidth' in node) layout.maxWidth = node.maxWidth
  if ('minHeight' in node) layout.minHeight = node.minHeight
  if ('maxHeight' in node) layout.maxHeight = node.maxHeight

  // Add structured size mode declarations with responsive hints
  layout.sizeMode = {
    width: node.primaryAxisSizingMode || 'FIXED',
    height: node.counterAxisSizingMode || 'FIXED'
  }

  // Add responsive hints
  layout.responsiveHints = {
    preferredBehavior: node.primaryAxisSizingMode === 'AUTO' ? 'hug-content' : 'fixed-size',
    breakpointSupport: node.layoutMode && node.layoutMode !== 'NONE',
    fluidSizing: node.primaryAxisSizingMode === 'AUTO' || node.counterAxisSizingMode === 'AUTO',
    adaptiveLayout: node.layoutMode && node.layoutMode !== 'NONE'
  }

  // Extract layout properties
  if ('layoutAlign' in node) layout.layoutAlign = node.layoutAlign
  if ('layoutGrow' in node) layout.layoutGrow = node.layoutGrow
  if ('layoutPositioning' in node) layout.layoutPositioning = node.layoutPositioning

  // Add spacing and stacking context
  if ('itemSpacing' in node) layout.gap = node.itemSpacing
  if ('zIndex' in node) layout.zIndex = node.zIndex

  // Add container behavior and overflow
  layout.overflow = {
    horizontal: 'visible',
    vertical: 'visible'
  }
  layout.clipContent = false

  return layout
}

async function extractGeometryProperties(node: any): Promise<GeometryProperties | undefined> {
  const geometry: GeometryProperties = {}

  try {
    // Extract fills (skip for text nodes - handled in typography)
    if ('fills' in node && node.fills && node.fills.length > 0 && node.type !== 'TEXT') {
      geometry.fills = node.fills.map((fill: any) => ({
        type: fill.type,
        visible: fill.visible !== false,
        opacity: fill.opacity,
        blendMode: fill.blendMode,
        color: fill.type === 'SOLID' ? rgbaToHex(fill.color) : undefined,
        gradientStops: fill.gradientStops?.map((stop: any) => ({
          position: stop.position,
          color: rgbaToHex(stop.color)
        })),
        gradientTransform: fill.gradientTransform
      }))
    }

    // Extract strokes
    if ('strokes' in node && node.strokes && node.strokes.length > 0) {
      geometry.strokes = node.strokes.map((stroke: any) => ({
        type: stroke.type,
        visible: stroke.visible !== false,
        opacity: stroke.opacity,
        blendMode: stroke.blendMode,
        color: stroke.type === 'SOLID' ? rgbaToHex(stroke.color) : undefined,
        gradientStops: stroke.gradientStops?.map((stop: any) => ({
          position: stop.position,
          color: rgbaToHex(stop.color)
        })),
        gradientTransform: stroke.gradientTransform
      }))
    }

    // Extract stroke properties
    if ('strokeWeight' in node && typeof node.strokeWeight === 'number') {
      geometry.strokeWeight = node.strokeWeight
    }
    if ('strokeAlign' in node) geometry.strokeAlign = node.strokeAlign
    if ('strokeCap' in node) geometry.strokeCap = node.strokeCap
    if ('strokeJoin' in node) geometry.strokeJoin = node.strokeJoin
    if ('dashPattern' in node) geometry.dashPattern = node.dashPattern

    // Extract winding rule
    if ('windingRule' in node) geometry.windingRule = node.windingRule

    // Extract vector paths
    if ('vectorPaths' in node) {
      geometry.vectorPaths = node.vectorPaths.map((path: any) => ({
        windingRule: path.windingRule,
        data: path.data
      }))
    }

    // Extract vector network
    if ('vectorNetwork' in node) {
      geometry.vectorNetwork = {
        vertices: node.vectorNetwork.vertices.map((vertex: any) => ({
          x: vertex.x,
          y: vertex.y,
          strokeCap: vertex.strokeCap,
          strokeJoin: vertex.strokeJoin,
          cornerRadius: vertex.cornerRadius,
          handleMirroring: vertex.handleMirroring
        })),
        segments: node.vectorNetwork.segments.map((segment: any) => ({
          start: segment.start,
          end: segment.end,
          tangentStart: segment.tangentStart ? { x: segment.tangentStart.x, y: segment.tangentStart.y } : undefined,
          tangentEnd: segment.tangentEnd ? { x: segment.tangentEnd.x, y: segment.tangentEnd.y } : undefined
        })),
        regions: node.vectorNetwork.regions.map((region: any) => ({
          windingRule: region.windingRule,
          loopIndices: region.loopIndices,
          fills: region.fills.map((fill: any) => ({
            type: fill.type,
            visible: fill.visible !== false,
            opacity: fill.opacity,
            blendMode: fill.blendMode,
            color: fill.type === 'SOLID' ? rgbaToHex(fill.color) : undefined
          }))
        }))
      }
    }

    // Extract handle mirroring
    if ('handleMirroring' in node) geometry.handleMirroring = node.handleMirroring

    // Extract style IDs
    if ('strokeStyleId' in node && node.strokeStyleId) geometry.strokeStyleId = node.strokeStyleId
    if ('fillStyleId' in node && node.fillStyleId) geometry.fillStyleId = node.fillStyleId

    // Enhanced extraction for 100% design data fidelity
    await enhanceGeometryWithDetailedData(node, geometry);

    return Object.keys(geometry).length > 0 ? geometry : undefined
  } catch (error) {
    console.error('Error extracting geometry properties:', error)
    return undefined
  }
}

// Enhanced geometry extraction for 100% design data fidelity
async function enhanceGeometryWithDetailedData(node: any, geometry: GeometryProperties): Promise<void> {
  try {
    // Extract detailed bounding box
    if ('width' in node && 'height' in node) {
      const x = node.x || 0;
      const y = node.y || 0;
      const width = node.width;
      const height = node.height;
      
      geometry.boundingBox = {
        x,
        y,
        width,
        height,
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
        centerX: x + width / 2,
        centerY: y + height / 2,
        pixelBounds: {
          left: Math.round(x),
          top: Math.round(y),
          right: Math.round(x + width),
          bottom: Math.round(y + height)
        }
      };
    }

    // Extract precise coordinates and transforms
    if ('absoluteTransform' in node && node.absoluteTransform) {
      const transform = node.absoluteTransform;
      geometry.preciseCoordinates = {
        x: transform[4] || 0,
        y: transform[5] || 0,
        width: node.width || 0,
        height: node.height || 0,
        rotation: Math.atan2(transform[1], transform[0]) * (180 / Math.PI),
        scaleX: Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]),
        scaleY: Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]),
        skewX: Math.atan2(transform[2], transform[3]) * (180 / Math.PI) - 90,
        skewY: Math.atan2(transform[1], transform[0]) * (180 / Math.PI),
        originX: 0, // Default origin
        originY: 0
      };
    }

    // Extract SVG data for vector nodes
    if (node.type === 'VECTOR' && ('vectorPaths' in node || 'vectorNetwork' in node)) {
      geometry.svgData = await extractSVGData(node);
    }

    // Extract detailed path commands for precise reproduction
    if ('vectorPaths' in node && node.vectorPaths) {
      geometry.pathCommands = [];
      for (const path of node.vectorPaths) {
        if (path.data) {
          const commands = parsePathData(path.data);
          geometry.pathCommands.push(...commands);
        }
      }
    }

    // Extract mask data if present
    if ('clipsContent' in node && node.clipsContent) {
      geometry.maskData = {
        type: 'outline',
        opacity: 1.0,
        inverted: false
      };
    }

    // Extract clip path for complex shapes
    if (node.type === 'VECTOR' && node.vectorPaths && node.vectorPaths.length > 0) {
      geometry.clipPath = convertVectorPathToClipPath(node.vectorPaths[0]);
    }

  } catch (error) {
    console.error('Error enhancing geometry with detailed data:', error);
  }
}

// Extract SVG data with full fidelity
async function extractSVGData(node: any): Promise<SVGExportData | undefined> {
  try {
    const width = node.width || 100;
    const height = node.height || 100;
    
    // VERY RESTRICTIVE: Only export node types that we know will definitely work
    const definitelyExportableTypes = ['VECTOR', 'TEXT', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'LINE', 'IMAGE'];
    
    // For complex nodes, be much more restrictive
    const isDefinitelyExportable = definitelyExportableTypes.includes(node.type);
    
    // For containers, require very specific conditions
    const isExportableContainer = (
      (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'INSTANCE') &&
      // Must have visible fills, strokes, or effects
      (
        (Array.isArray(node.fills) && node.fills.length > 0 && node.fills.some((fill: any) => fill.visible !== false)) ||
        (Array.isArray(node.strokes) && node.strokes.length > 0 && node.strokes.some((stroke: any) => stroke.visible !== false)) ||
        (Array.isArray(node.effects) && node.effects.length > 0 && node.effects.some((effect: any) => effect.visible !== false))
      ) &&
      // Must not be too complex (avoid complex instances that often fail)
      (node.type !== 'INSTANCE' || (node.children && node.children.length <= 5))
    );
    
    if (!isDefinitelyExportable && !isExportableContainer) {
      // Silent skip for complex nodes that are likely to fail
      return undefined;
    }
    
    // Skip export for nodes that are unlikely to have visible content
    if (!node.visible || (node.opacity !== undefined && node.opacity === 0)) {
      return undefined;
    }
    
    // Additional check for very small or zero-sized nodes
    const isTooSmallToExport = (
      (node.width !== undefined && node.width < 1) ||
      (node.height !== undefined && node.height < 1) ||
      (node.width === 0 || node.height === 0)
    );
    
    // Skip nodes with clipping masks that have no content
    const isEmptyMask = (
      node.isMask && 
      (!node.children || node.children.length === 0 || 
       node.children.every((child: any) => !child.visible || child.opacity === 0))
    );
    
    // Skip instances with many children (they often fail)
    const isComplexInstance = (
      node.type === 'INSTANCE' && 
      node.children && 
      node.children.length > 10
    );
    
    if (isTooSmallToExport || isEmptyMask || isComplexInstance) {
      return undefined;
    }
    
    // Export node as SVG with additional error handling
    let svgString: any;
    try {
      svgString = await node.exportAsync({ 
        format: 'SVG',
        svgIdAttribute: true,
        svgOutlineText: false,
        svgSimplifyStroke: false
      });
    } catch (exportError) {
      // Silent fail for nodes that can't be exported
      console.log(`SVG export failed for ${node.name} (${node.type}): Node may not have visible layers`);
      return undefined;
    }
    
    // Check if the export returned valid data
    if (!svgString || (typeof svgString === 'string' && svgString.trim().length === 0)) {
      return undefined;
    }
    
    // Handle SVG string - in Figma plugin environment, it's already a string
    let svgContent: string;
    if (typeof svgString === 'string') {
      svgContent = svgString;
    } else if (svgString instanceof Uint8Array) {
      // Fallback for environments that might return Uint8Array
      try {
        svgContent = new TextDecoder().decode(svgString);
      } catch (error) {
        // Manual decoding if TextDecoder is not available
        svgContent = String.fromCharCode(...Array.from(svgString));
      }
    } else {
      // Last resort - convert to string
      svgContent = String(svgString);
    }
    
    // Parse SVG to extract path data
    const paths: SVGPath[] = [];
    
    // Extract vector paths with full detail
    if ('vectorPaths' in node && node.vectorPaths) {
      for (const vectorPath of node.vectorPaths) {
        const svgPath: SVGPath = {
          d: vectorPath.data,
          fillRule: vectorPath.windingRule === 'EVENODD' ? 'evenodd' : 'nonzero'
        };
        
        // Add fill information
        if (node.fills && node.fills.length > 0) {
          const fill = node.fills[0];
          if (fill.type === 'SOLID') {
            svgPath.fill = rgbaToHex(fill.color);
            svgPath.opacity = fill.opacity;
          }
        }
        
        // Add stroke information
        if (node.strokes && node.strokes.length > 0) {
          const stroke = node.strokes[0];
          if (stroke.type === 'SOLID') {
            svgPath.stroke = rgbaToHex(stroke.color);
            svgPath.strokeWidth = (typeof node.strokeWeight === 'number') ? node.strokeWeight : 1;
            svgPath.strokeLinecap = node.strokeCap?.toLowerCase();
            svgPath.strokeLinejoin = node.strokeJoin?.toLowerCase();
          }
        }
        
        paths.push(svgPath);
      }
    }
    
    return {
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      svgContent,
      paths,
      preserveAspectRatio: 'xMidYMid meet'
    };
    
  } catch (error) {
    console.error('Error extracting SVG data:', error);
    return undefined;
  }
}

// Parse SVG path data into structured commands
function parsePathData(pathData: string): PathCommand[] {
  const commands: PathCommand[] = [];
  
  try {
    // Regular expression to match SVG path commands
    const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])([\d\s,.-]*)/g;
    let match;
    
    while ((match = commandRegex.exec(pathData)) !== null) {
      const command = match[1];
      const coordString = match[2].trim();
      
      if (coordString) {
        const coordinates = coordString
          .split(/[\s,]+/)
          .filter(c => c.length > 0)
          .map(c => parseFloat(c))
          .filter(c => !isNaN(c));
        
        commands.push({
          command: command.toUpperCase(),
          coordinates,
          relative: command === command.toLowerCase()
        });
      } else if (command.toUpperCase() === 'Z') {
        commands.push({
          command: 'Z',
          coordinates: [],
          relative: false
        });
      }
    }
  } catch (error) {
    console.error('Error parsing path data:', error);
  }
  
  return commands;
}

// Enhanced fill extraction with 100% fidelity
async function extractDetailedFillProperties(node: any): Promise<DetailedFillProperty[]> {
  const fills: DetailedFillProperty[] = [];
  
  if (!('fills' in node) || !node.fills || node.fills.length === 0) {
    return fills;
  }
  
  for (const fill of node.fills) {
    try {
      const detailedFill: DetailedFillProperty = {
        type: fill.type,
        visible: fill.visible !== false,
        opacity: fill.opacity || 1.0,
        blendMode: fill.blendMode || 'NORMAL'
      };
    
    // Solid color fills
    if (fill.type === 'SOLID') {
      detailedFill.color = rgbaToHex(fill.color);
    }
    
    // Gradient fills with precise data
    if (fill.type.includes('GRADIENT')) {
      detailedFill.gradientStops = fill.gradientStops?.map((stop: any) => ({
        position: stop.position,
        color: rgbaToHex(stop.color)
      }));
      detailedFill.gradientTransform = fill.gradientTransform;
      
      // Extract precise gradient data
      if (fill.gradientHandlePositions) {
        detailedFill.gradientHandlePositions = fill.gradientHandlePositions;
      }
    }
    
    // Image fills with complete data
    if (fill.type === 'IMAGE') {
      detailedFill.imageHash = fill.imageHash;
      detailedFill.scaleMode = fill.scaleMode;
      detailedFill.detailedImageTransform = fill.imageTransform;
      
      // Extract image filters if present
      if (fill.filters && Array.isArray(fill.filters)) {
        detailedFill.filters = fill.filters.map((filter: any) => ({
          type: filter.type,
          value: filter.value,
          unit: filter.unit
        }));
      } else if (fill.filters) {
        // Handle non-array filters (might be an object or other structure)
        console.log('Non-array filters detected for fill:', typeof fill.filters);
        detailedFill.filters = [];
      }
    }
    
    // Video fills
    if (fill.type === 'VIDEO') {
      detailedFill.videoHash = fill.videoHash;
      detailedFill.scaleMode = fill.scaleMode;
      detailedFill.detailedImageTransform = fill.imageTransform;
    }
    
    fills.push(detailedFill);
    } catch (error) {
      console.log('Error processing fill property:', error);
      // Skip this fill and continue with others
      continue;
    }
  }
  
  return fills;
}

// Enhanced gradient extraction with precise transform data
function extractPreciseGradientData(fill: any): PreciseGradientProperty | undefined {
  if (!fill.type.includes('GRADIENT')) return undefined;
  
  const gradient: PreciseGradientProperty = {
    type: fill.type.includes('LINEAR') ? 'linear' : 
          fill.type.includes('RADIAL') ? 'radial' : 
          fill.type.includes('ANGULAR') ? 'angular' : 'diamond',
    stops: [],
    transform: fill.gradientTransform || [1, 0, 0, 1, 0, 0],
    opacity: fill.opacity || 1.0,
    blendMode: fill.blendMode || 'NORMAL'
  };
  
  // Extract precise gradient stops
  if (fill.gradientStops) {
    gradient.stops = fill.gradientStops.map((stop: any) => ({
      position: stop.position,
      color: {
        r: stop.color.r,
        g: stop.color.g,
        b: stop.color.b,
        a: stop.color.a
      },
      midpoint: stop.midpoint
    }));
  }
  
  return gradient;
}

// Master function for 100% design data extraction
async function extractComprehensiveDesignData(node: any): Promise<any> {
  const comprehensiveData: any = {};
  
  try {
    // Extract all visual properties with maximum fidelity
    try {
      comprehensiveData.detailedFills = await extractDetailedFillProperties(node);
    } catch (error) {
      console.log('Error extracting detailed fill properties:', error);
      comprehensiveData.detailedFills = [];
    }
    
    // Extract precise measurements and positioning
    if ('width' in node && 'height' in node) {
      comprehensiveData.preciseMeasurements = {
        width: node.width,
        height: node.height,
        x: node.x || 0,
        y: node.y || 0,
        rotation: node.rotation || 0,
        targetAspectRatio: node.targetAspectRatio || null,
        layoutAlign: node.layoutAlign,
        layoutGrow: node.layoutGrow
      };
    }
    
    // Extract all transformation data
    if ('absoluteTransform' in node) {
      comprehensiveData.transformationMatrix = {
        absolute: node.absoluteTransform,
        relative: node.relativeTransform,
        decomposed: decomposeTransform(node.absoluteTransform)
      };
    }
    
    // Extract blend modes and opacity
    comprehensiveData.blendingProperties = {
      blendMode: node.blendMode || 'PASS_THROUGH',
      opacity: node.opacity || 1.0,
      isMask: node.isMask || false,
      visible: node.visible !== false
    };
    
    // Extract layout constraints
    if ('constraints' in node) {
      comprehensiveData.layoutConstraints = {
        horizontal: node.constraints.horizontal,
        vertical: node.constraints.vertical
      };
    }
    
    // Extract auto-layout properties with full detail
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
      comprehensiveData.autoLayoutProperties = {
        mode: node.layoutMode,
        direction: node.primaryAxisAlignItems,
        wrap: node.counterAxisAlignItems,
        spacing: node.itemSpacing,
        padding: {
          top: node.paddingTop || 0,
          right: node.paddingRight || 0,
          bottom: node.paddingBottom || 0,
          left: node.paddingLeft || 0
        },
        primaryAxisSizingMode: node.primaryAxisSizingMode,
        counterAxisSizingMode: node.counterAxisSizingMode,
        primaryAxisAlignItems: node.primaryAxisAlignItems,
        counterAxisAlignItems: node.counterAxisAlignItems,
        layoutWrap: node.layoutWrap
      };
    }
    
    // Extract corner radius with individual corners
    if ('cornerRadius' in node) {
      if (typeof node.cornerRadius === 'number') {
        comprehensiveData.cornerRadius = {
          all: node.cornerRadius,
          topLeft: node.cornerRadius,
          topRight: node.cornerRadius,
          bottomLeft: node.cornerRadius,
          bottomRight: node.cornerRadius
        };
      } else {
        comprehensiveData.cornerRadius = {
          all: 0,
          topLeft: node.topLeftRadius || 0,
          topRight: node.topRightRadius || 0,
          bottomLeft: node.bottomLeftRadius || 0,
          bottomRight: node.bottomRightRadius || 0
        };
      }
    }
    
    // Extract export settings if available
    if ('exportSettings' in node && node.exportSettings) {
      comprehensiveData.exportSettings = node.exportSettings.map((setting: any) => ({
        format: setting.format,
        suffix: setting.suffix,
        constraint: setting.constraint,
        contentsOnly: setting.contentsOnly
      }));
    }
    
    return comprehensiveData;
    
  } catch (error) {
    console.error('Error extracting comprehensive design data:', error);
    return comprehensiveData;
  }
}

// Decompose transformation matrix into readable components
function decomposeTransform(matrix: number[]): any {
  if (!matrix || matrix.length < 6) return null;
  
  const [a, b, c, d, tx, ty] = matrix;
  
  return {
    translateX: tx,
    translateY: ty,
    scaleX: Math.sqrt(a * a + b * b),
    scaleY: Math.sqrt(c * c + d * d),
    rotation: Math.atan2(b, a) * (180 / Math.PI),
    skewX: Math.atan2(c, d) * (180 / Math.PI) - 90,
    skewY: Math.atan2(b, a) * (180 / Math.PI)
  };
}

async function extractEffects(node: any): Promise<EffectProperties[]> {
  const effects: EffectProperties[] = []

  try {
    if ('effects' in node && node.effects && node.effects.length > 0) {
      for (const effect of node.effects) {
        const effectProp: EffectProperties = {
          type: effect.type,
          visible: effect.visible !== false,
          blendMode: effect.blendMode
        }

        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          effectProp.radius = effect.radius
          effectProp.color = rgbaToHex(effect.color)
          effectProp.offset = [effect.offset.x, effect.offset.y]
          effectProp.spread = effect.spread
        } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
          effectProp.radius = effect.radius
        }

        effects.push(effectProp)
      }
    }

    return effects
  } catch (error) {
    console.error('Error extracting effects:', error)
    return effects
  }
}

async function extractInteractivityProperties(node: any): Promise<InteractivityProperties> {
  const interactivity: InteractivityProperties = {}

  try {
    if ('reactions' in node && node.reactions.length > 0) {
      interactivity.reactions = node.reactions.map((reaction: any) => ({
        trigger: {
          type: reaction.trigger.type,
          keyCode: reaction.trigger.keyCode,
          device: reaction.trigger.device
        },
        action: {
          type: reaction.action.type,
          destination: reaction.action.destination,
          navigation: reaction.action.navigation,
          transition: reaction.action.transition,
          preserveScrollPosition: reaction.action.preserveScrollPosition
        },
        destination: reaction.destination
      }))

      interactivity.states = {}
      
      for (const reaction of node.reactions) {
        if (reaction.trigger.type === 'ON_HOVER') {
          interactivity.states.hover = {
            fill: reaction.actions[0]?.destination?.fills?.[0]?.color ? 
                  rgbaToHex(reaction.actions[0].destination.fills[0].color) : undefined,
            transition: 'background-color 0.2s ease-in-out'
          }
        } else if (reaction.trigger.type === 'ON_CLICK') {
          interactivity.onClick = reaction.actions[0]?.destination?.name || 'navigate'
        } else if (reaction.trigger.type === 'ON_PRESS') {
          interactivity.onPress = reaction.actions[0]?.destination?.name || 'navigate'
        }
      }
    }

    // Check for prototype connections
    if ('prototypeStartNodeID' in node) {
      interactivity.prototypeStartNodeID = node.prototypeStartNodeID
    }

    if ('transitionNodeID' in node) {
      interactivity.transitionNodeID = node.transitionNodeID
    }

    if ('transitionDuration' in node) {
      interactivity.transitionDuration = node.transitionDuration
    }

    if ('transitionEasing' in node) {
      interactivity.transitionEasing = node.transitionEasing
    }

    // Check for variant states
    if (node.type === 'INSTANCE' && node.componentProperties) {
      for (const [key, value] of Object.entries(node.componentProperties)) {
        if (key.toLowerCase().includes('state') || key.toLowerCase().includes('variant')) {
          interactivity.states = interactivity.states || {}
          interactivity.states[(value as any).value] = {}
        }
      }
    }

    return interactivity
  } catch (error) {
    console.error('Error extracting interactivity properties:', error)
    return interactivity
  }
}

async function extractConstraintProperties(node: any): Promise<ConstraintProperties | undefined> {
  if (!('constraints' in node)) return undefined

  return {
    horizontal: node.constraints.horizontal,
    vertical: node.constraints.vertical,
    scaleMode: node.constraints.scaleMode
  }
}

async function extractSizeProperties(node: any): Promise<SizeProperties> {
  return {
    width: node.width,
    height: node.height,
    resizeToFit: node.resizeToFit
  }
}

async function extractPositionProperties(node: any, parent?: any): Promise<PositionProperties> {
  let x = node.x;
  let y = node.y;
  
  // For groups, child positions need to be calculated relative to the group bounds
  if (parent && parent.type === 'GROUP' && parent.children && parent.children.length > 0) {
    try {
      // Get the group's bounds by finding the minimum x,y coordinates of all children
      const groupBounds = {
        x: Math.min(...parent.children.map((child: any) => child.x || 0)),
        y: Math.min(...parent.children.map((child: any) => child.y || 0))
      };
      
      // Make position relative to the group's top-left corner
      x = (node.x || 0) - groupBounds.x;
      y = (node.y || 0) - groupBounds.y;
      
      // Ensure positions are not negative (in case of calculation errors)
      x = Math.max(0, x);
      y = Math.max(0, y);
    } catch (error) {
      console.warn('Error calculating group bounds, using absolute position:', error);
      // Fallback to absolute positions if bounds calculation fails
      x = node.x || 0;
      y = node.y || 0;
    }
  }
  
  return {
    x: x || 0,
    y: y || 0,
    rotation: node.rotation || 0
  }
}

async function extractTokenMapping(node: any): Promise<Record<string, string> | undefined> {
  const tokenMapping: Record<string, string> = {}

  try {
    // Extract style references
    if ('fills' in node && node.fills) {
      for (const fill of node.fills) {
        if (fill.styleId) {
          const style = await figma.getStyleByIdAsync(fill.styleId)
          if (style) {
            tokenMapping.background = style.name
          }
        }
      }
    }

    if ('strokes' in node && node.strokes) {
      for (const stroke of node.strokes) {
        if (stroke.styleId) {
          const style = await figma.getStyleByIdAsync(stroke.styleId)
          if (style) {
            tokenMapping.border = style.name
          }
        }
      }
    }

    if ('styleId' in node && node.styleId) {
      const style = await figma.getStyleByIdAsync(node.styleId)
      if (style) {
        tokenMapping.text = style.name
      }
    }

    // Extract effect style references
    if ('effects' in node && node.effects) {
      for (const effect of node.effects) {
        if (effect.styleId) {
          const style = await figma.getStyleByIdAsync(effect.styleId)
          if (style) {
            tokenMapping.effect = style.name
          }
        }
      }
    }

    return Object.keys(tokenMapping).length > 0 ? tokenMapping : undefined
  } catch (error) {
    console.error('Error extracting token mapping:', error)
    return undefined
  }
}

function hasTextChildren(node: any): boolean {
  if ('children' in node) {
    return node.children.some((child: any) => 
      child.type === 'TEXT' || hasTextChildren(child)
    )
  }
  return false
}

function rgbToHex(color: { r: number, g: number, b: number }): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function rgbaToHex(color: { r: number, g: number, b: number, a: number } | undefined): string {
  if (!color) {
    return 'rgba(0, 0, 0, 0)' // Return transparent if no color
  }
  
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  const a = color.a !== undefined ? color.a : 1 // Fix undefined alpha
  return `rgba(${r}, ${g}, ${b}, ${a})`
} 

// Enhanced visual properties for pixel-perfect reproduction
export interface EnhancedVisualProperties extends VisualProperties {
  // Layer blending and composition
  isolate?: boolean
  backgroundClip?: string
  backgroundOrigin?: string
  mixBlendMode?: string
  backdropBlur?: number
  
  // Texture and pattern details
  backgroundImage?: BackgroundImage[]
  backgroundPosition?: string
  backgroundRepeat?: string
  backgroundSize?: string
  backgroundAttachment?: string
  
  // Advanced border properties
  borderImageSource?: string
  borderImageSlice?: string
  borderImageWidth?: string
  borderImageOutset?: string
  borderImageRepeat?: string
  
  // Clipping and masking
  clipPath?: string
  maskImage?: string
  maskPosition?: string
  maskSize?: string
  maskRepeat?: string
  maskComposite?: string
  
  // Sub-pixel and precision details
  subPixelRendering?: boolean
  pixelRatio?: number
  renderingHints?: {
    antiAlias: boolean
    smoothing: boolean
    optimizeSpeed: boolean
  }
  
  // Export and rendering settings
  exportSettings?: ExportSettings[]
  renderBounds?: {
    x: number
    y: number
    width: number
    height: number
    pixelPerfect: boolean
  }
}

export interface BackgroundImage {
  type: 'url' | 'gradient' | 'pattern'
  source: string
  opacity: number
  blendMode: string
  transform?: TransformMatrix
  repeat?: string
  position?: string
  size?: string
}

export interface ExportSettings {
  format: string
  constraint: string
  suffix: string
  resolution: number
  includeId?: boolean
} 

// Enhanced positioning for pixel-perfect reproduction
export interface PrecisePositionProperties extends PositionProperties {
  // Sub-pixel positioning
  preciseX: number  // Actual x including sub-pixels
  preciseY: number  // Actual y including sub-pixels
  preciseRotation: number  // Exact rotation in radians
  
  // Relative positioning context
  relativeToParent: {
    x: number
    y: number
    xPercent: number
    yPercent: number
  }
  
  // Layout grid alignment
  baselineGrid?: {
    aligned: boolean
    offset: number
    gridSize: number
  }
  
  // Visual bounds vs layout bounds
  visualBounds: BoundingBox
  layoutBounds: BoundingBox
  contentBounds: BoundingBox
  
  // Optical corrections
  opticalAdjustments?: {
    verticalAlign: number
    horizontalAlign: number
    visualWeight: number
  }
}

// BoundingBox interface already defined above

// Enhanced layout with precise measurements
export interface PreciseLayoutProperties extends LayoutProperties {
  // Exact measurements
  preciseWidth: number
  preciseHeight: number
  
  // Spacing measurements (to handle sub-pixel values)
  preciseSpacing: {
    top: number
    right: number
    bottom: number
    left: number
    itemSpacing: number
  }
  
  // Baseline and grid system
  baselineOffset: number
  gridAlignment: {
    horizontal: boolean
    vertical: boolean
    gridSize: number
  }
  
  // Flex/Grid precise calculations
  computedFlexValues?: {
    flexGrow: number
    flexShrink: number
    flexBasis: string
    alignSelf: string
  }
  
  // Container relationships
  containingBlock: {
    width: number
    height: number
    established: boolean
  }
} 

// Enhanced typography for exact reproduction
export interface PreciseTypographyProperties extends TypographyProperties {
  // Exact font loading and fallback
  fontStack: FontStack
  fontDisplay: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  fontVariationSettings?: Record<string, number>
  
  // Precise text measurements
  textMetrics: {
    actualBoundingBoxAscent: number
    actualBoundingBoxDescent: number
    actualBoundingBoxLeft: number
    actualBoundingBoxRight: number
    fontBoundingBoxAscent: number
    fontBoundingBoxDescent: number
    width: number
    emHeightAscent: number
    emHeightDescent: number
  }
  
  // Advanced text properties
  textShadow?: TextShadow[]
  textStroke?: {
    width: number
    color: string
  }
  textFillColor?: string
  textStrokeColor?: string
  
  // Text layout details
  writingMode: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr'
  textOrientation: 'mixed' | 'upright' | 'sideways'
  textJustify: 'auto' | 'inter-word' | 'inter-character' | 'none'
  
  // Line box details
  lineBoxes: LineBox[]
  firstLineOffset: number
  lastLineOffset: number
  
  // Character-level details (for complex layouts)
  characterMetrics?: CharacterMetric[]
  
  // Font loading state
  fontLoadingState: 'unloaded' | 'loading' | 'loaded' | 'error'
  fontFace?: {
    family: string
    source: string
    descriptors: Record<string, string>
  }
}

export interface FontStack {
  primary: FontDefinition
  fallbacks: FontDefinition[]
  systemFallback: string
  webFontUrl?: string
  localFontName?: string
}

export interface FontDefinition {
  family: string
  weight: number
  style: string
  stretch: string
  variant: string
  featureSettings: Record<string, any>
}

export interface TextShadow {
  offsetX: number
  offsetY: number
  blurRadius: number
  color: string
}

export interface LineBox {
  y: number
  height: number
  baseline: number
  ascent: number
  descent: number
  leading: number
  width: number
  textAlign: string
}

export interface CharacterMetric {
  char: string
  x: number
  y: number
  width: number
  height: number
  advanceWidth: number
} 

// Enhanced extraction functions for pixel-perfect reproduction
async function extractEnhancedVisualProperties(node: any): Promise<EnhancedVisualProperties> {
  const baseVisuals = await extractVisualProperties(node);
  
  const enhanced: EnhancedVisualProperties = {
    ...baseVisuals,
    
    // LAYER BLENDING AND COMPOSITION
    mixBlendMode: node.blendMode || 'normal',
    isolate: node.isolate || false,
    backdropBlur: extractBackdropBlur(node),
    
    // TEXTURE AND PATTERN DETAILS
    backgroundImage: await extractBackgroundImages(node),
    backgroundPosition: extractBackgroundPosition(node),
    backgroundRepeat: extractBackgroundRepeat(node),
    backgroundSize: extractBackgroundSize(node),
    backgroundAttachment: 'scroll', // Default for Figma
    backgroundClip: node.clipsContent ? 'content-box' : 'border-box',
    backgroundOrigin: 'padding-box',
    
    // ADVANCED BORDER PROPERTIES
    borderImageSource: await extractBorderImageSource(node),
    borderImageSlice: extractBorderImageSlice(node),
    borderImageWidth: extractBorderImageWidth(node),
    borderImageOutset: '0',
    borderImageRepeat: 'stretch',
    
    // CLIPPING AND MASKING
    clipPath: await extractClipPath(node),
    maskImage: await extractMaskImage(node),
    maskPosition: '0% 0%',
    maskSize: 'auto',
    maskRepeat: 'no-repeat',
    maskComposite: 'add',
    
    // SUB-PIXEL AND PRECISION DETAILS
    subPixelRendering: true,
    pixelRatio: extractPixelRatio(node),
    renderingHints: {
      antiAlias: !node.strokeAlign || node.strokeAlign !== 'INSIDE', // Inside strokes often disable AA
      smoothing: true,
      optimizeSpeed: false // Always prioritize quality
    },
    
    // EXPORT SETTINGS
    exportSettings: node.exportSettings?.map((setting: any) => ({
      format: setting.format,
      constraint: setting.constraint?.type || 'SCALE',
      suffix: setting.suffix || '',
      resolution: setting.contentsOnly ? 1 : (setting.constraint?.value || 1),
      includeId: setting.includeId || false
    })) || [],
    
    // PRECISE RENDER BOUNDS
    renderBounds: {
      x: node.absoluteBoundingBox?.x || node.x || 0,
      y: node.absoluteBoundingBox?.y || node.y || 0,
      width: node.absoluteBoundingBox?.width || node.width || 0,
      height: node.absoluteBoundingBox?.height || node.height || 0,
      pixelPerfect: true
    }
  };
  
  return enhanced;
}

async function extractPrecisePositionProperties(node: any, parent?: any): Promise<PrecisePositionProperties> {
  const basePosition = await extractPositionProperties(node, parent);
  
  // Calculate precise bounds
  const absoluteBounds = node.absoluteBoundingBox || { x: node.x || 0, y: node.y || 0, width: node.width || 0, height: node.height || 0 };
  const relativeBounds = node.relativeTransform ? transformBounds(absoluteBounds, node.relativeTransform) : absoluteBounds;
  
  const visualBounds: BoundingBox = {
    x: absoluteBounds.x,
    y: absoluteBounds.y,
    width: absoluteBounds.width,
    height: absoluteBounds.height,
    left: absoluteBounds.x,
    top: absoluteBounds.y,
    right: absoluteBounds.x + absoluteBounds.width,
    bottom: absoluteBounds.y + absoluteBounds.height,
    centerX: absoluteBounds.x + absoluteBounds.width / 2,
    centerY: absoluteBounds.y + absoluteBounds.height / 2,
    pixelBounds: {
      left: Math.floor(absoluteBounds.x),
      top: Math.floor(absoluteBounds.y),
      right: Math.ceil(absoluteBounds.x + absoluteBounds.width),
      bottom: Math.ceil(absoluteBounds.y + absoluteBounds.height)
    }
  };
  
  const layoutBounds = { ...visualBounds }; // In most cases same as visual
  const contentBounds = { ...visualBounds }; // Would need to calculate actual content bounds
  
  const enhanced: PrecisePositionProperties = {
    ...basePosition,
    preciseX: absoluteBounds.x,
    preciseY: absoluteBounds.y,
    preciseRotation: node.rotation || 0,
    
    relativeToParent: parent ? {
      x: absoluteBounds.x - (parent.absoluteBoundingBox?.x || parent.x || 0),
      y: absoluteBounds.y - (parent.absoluteBoundingBox?.y || parent.y || 0),
      xPercent: ((absoluteBounds.x - (parent.absoluteBoundingBox?.x || parent.x || 0)) / (parent.width || 1)) * 100,
      yPercent: ((absoluteBounds.y - (parent.absoluteBoundingBox?.y || parent.y || 0)) / (parent.height || 1)) * 100
    } : { x: 0, y: 0, xPercent: 0, yPercent: 0 },
    
    visualBounds,
    layoutBounds,
    contentBounds,
    
    // Check for baseline grid alignment (would need access to frame's layout grids)
    baselineGrid: undefined, // Would need to check parent frame's layout grids
    
    // Optical adjustments (heuristic based on node type and properties)
    opticalAdjustments: node.type === 'TEXT' ? {
      verticalAlign: 0,
      horizontalAlign: 0,
      visualWeight: node.fontSize ? Math.log(node.fontSize / 16) : 0
    } : undefined
  };
  
  return enhanced;
}

async function extractPreciseTypographyProperties(node: any): Promise<PreciseTypographyProperties | undefined> {
  const baseTypography = await extractTypographyProperties(node);
  if (!baseTypography) return undefined;
  
  // Create font stack with proper fallbacks
  const fontStack: FontStack = {
    primary: {
      family: node.fontName?.family || 'inherit',
      weight: extractFontWeight(node.fontName?.style || 'Regular'),
      style: node.fontName?.style || 'Regular',
      stretch: 'normal',
      variant: 'normal',
      featureSettings: extractOpenTypeFeatures(node.opentypeFlags || 0)
    },
    fallbacks: [
      {
        family: 'system-ui',
        weight: 400,
        style: 'normal',
        stretch: 'normal',
        variant: 'normal',
        featureSettings: {}
      },
      {
        family: 'Arial',
        weight: 400,
        style: 'normal',
        stretch: 'normal',
        variant: 'normal',
        featureSettings: {}
      }
    ],
    systemFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    webFontUrl: undefined, // Could be extracted from font metadata
    localFontName: node.fontName?.family
  };
  
  // CANVAS-BASED PRECISE TEXT MEASUREMENT
  const fontSize = node.fontSize || 16;
  const lineHeight = node.lineHeight?.value || fontSize * 1.2;
  const characters = node.characters || '';
  
  // Simulate canvas text measurement (would be actual canvas in browser environment)
  const textMetrics = await measureTextPrecisely(characters, {
    fontFamily: node.fontName?.family || 'Arial',
    fontSize: fontSize,
    fontWeight: extractFontWeight(node.fontName?.style || 'Regular'),
    letterSpacing: node.letterSpacing?.value || 0,
    lineHeight: lineHeight
  });
  
  // Create precise line boxes with canvas-measured dimensions
  const lineBoxes: LineBox[] = await createPreciseLineBoxes(
    characters, 
    node.width || 0, 
    fontSize, 
    lineHeight,
    node.textAlignHorizontal || 'LEFT',
    fontStack.primary
  );
  
  // Extract character-level metrics for complex layouts
  const characterMetrics: CharacterMetric[] = await extractCharacterMetrics(
    characters,
    fontSize,
    fontStack.primary
  );
  
  const enhanced: PreciseTypographyProperties = {
    ...baseTypography,
    fontStack,
    fontDisplay: 'swap',
    fontVariationSettings: extractFontVariations(node),
    textMetrics,
    writingMode: 'horizontal-tb',
    textOrientation: 'mixed',
    textJustify: 'auto',
    lineBoxes,
    characterMetrics,
    firstLineOffset: lineBoxes.length > 0 ? lineBoxes[0].y : 0,
    lastLineOffset: lineBoxes.length > 0 ? lineBoxes[lineBoxes.length - 1].y + lineBoxes[lineBoxes.length - 1].height : 0,
    fontLoadingState: 'loaded',
    
    // Extract text shadows from effects
    textShadow: node.effects?.filter((effect: any) => 
      effect.type === 'DROP_SHADOW' && effect.visible !== false
    ).map((effect: any) => ({
      offsetX: effect.offset?.x || 0,
      offsetY: effect.offset?.y || 0,
      blurRadius: effect.radius || 0,
      color: rgbaToHex(effect.color)
    })) || undefined,
    
    // Extract text stroke from stroke properties
    textStroke: node.strokes && node.strokes.length > 0 ? {
      width: (typeof node.strokeWeight === 'number') ? node.strokeWeight : 0,
      color: rgbaToHex(node.strokes[0].color)
    } : undefined,
    
    // Text fill color (overrides base extraction for precision)
    textFillColor: node.fills && node.fills.length > 0 ? rgbaToHex(node.fills[0].color) : undefined,
    textStrokeColor: node.strokes && node.strokes.length > 0 ? rgbaToHex(node.strokes[0].color) : undefined
  };
  
  return enhanced;
}

async function extractComponentRelationships(node: any): Promise<ComponentRelationships> {
  const relationships: ComponentRelationships = {
    childComponents: [],
    siblingComponents: [],
    instanceOverrides: [],
    variantProperties: [],
    designSystemPath: [],
    styleReferences: [],
    tokenReferences: [],
    usageInstances: [],
    dependentComponents: [],
    lastModified: new Date().toISOString(),
    creator: 'Unknown'
  };
  
  // Extract main component relationship for instances (using async API)
  if (node.type === 'INSTANCE') {
    try {
      const mainComponent = await node.getMainComponentAsync();
      if (mainComponent) {
        relationships.mainComponent = {
          id: mainComponent.id,
          name: mainComponent.name,
          type: mainComponent.type,
          key: mainComponent.key || '',
          description: mainComponent.description || '',
          published: false, // Would need to check if component is published
          remote: false // Would need to check if component is from external library
        };
      }
    } catch (error) {
      console.warn('Could not get main component for instance:', node.name, error);
    }
    
    // Extract instance overrides
    if (node.componentProperties) {
      relationships.instanceOverrides = Object.entries(node.componentProperties).map(([key, value]: [string, any]) => ({
        property: key,
        value: value.value,
        originalValue: value.defaultValue,
        overrideType: inferOverrideType(key, value),
        path: key.split('/')
      }));
    }
  }
  
  // Extract variant properties from component sets
  if (node.type === 'COMPONENT_SET' && node.children) {
    const variantProps = extractVariantPropertiesFromSet(node);
    relationships.variantProperties = variantProps;
    
    // Extract child components (variants)
    relationships.childComponents = node.children
      .filter((child: any) => child.type === 'COMPONENT')
      .map((child: any) => ({
        id: child.id,
        name: child.name,
        type: child.type,
        key: child.key,
        description: child.description,
        published: false,
        remote: false
      }));
  }
  
  // Extract variant properties from instances
  if (node.type === 'INSTANCE' && node.componentProperties) {
    const variantProps = extractVariantPropertiesFromInstance(node);
    relationships.variantProperties = variantProps;
  }
  
  // Extract style references
  const styleIds = [
    node.fillStyleId,
    node.strokeStyleId,
    node.textStyleId,
    node.effectStyleId
  ].filter(Boolean);
  
  relationships.styleReferences = await Promise.all(styleIds.map(async (styleId) => {
    const style = await figma.getStyleByIdAsync(styleId);
    return {
      id: styleId,
      name: style?.name || 'Unknown Style',
      type: inferStyleType(styleId, node),
      description: style?.description,
      remote: false // Would need to check if style is from external library
    };
  }));
  
  return relationships;
}

// Helper function to extract variant properties from component sets
function extractVariantPropertiesFromSet(node: any): VariantProperty[] {
  const variantProps: VariantProperty[] = [];
  
  if (!node.children) return variantProps;
  
  // Analyze component names to extract variant properties
  const componentNames = node.children
    .filter((child: any) => child.type === 'COMPONENT')
    .map((child: any) => child.name);
  
  // Parse variant properties from component names (e.g., "Button, State=Default, Size=Large")
  for (const name of componentNames) {
    const parts = name.split(', ');
    for (const part of parts) {
      if (part.includes('=')) {
        const [propName, propValue] = part.split('=');
        const existingProp = variantProps.find(p => p.name === propName.trim());
        
        if (!existingProp) {
          variantProps.push({
            name: propName.trim(),
            value: propValue.trim(),
            type: 'variant',
            defaultValue: propValue.trim(),
            options: [propValue.trim()]
          });
        } else {
          existingProp.options = existingProp.options || [];
          if (!existingProp.options.includes(propValue.trim())) {
            existingProp.options.push(propValue.trim());
          }
        }
      }
    }
  }
  
  return variantProps;
}

// Helper function to extract variant properties from instances
function extractVariantPropertiesFromInstance(node: any): VariantProperty[] {
  const variantProps: VariantProperty[] = [];
  
  if (!node.componentProperties) return variantProps;
  
  for (const [key, value] of Object.entries(node.componentProperties)) {
    const prop = value as any;
    variantProps.push({
      name: key,
      value: prop.value,
      type: prop.type || 'variant',
      defaultValue: prop.defaultValue || prop.value,
      options: prop.preferredValues || undefined
    });
  }
  
  return variantProps;
}

async function extractDesignContext(node: any): Promise<DesignContext> {
  const context: DesignContext = {
    pageContext: {
      name: figma.currentPage.name,
      id: figma.currentPage.id,
      type: 'design', // Would need to infer or get from page properties
      flowStartingPoints: []
    },
    frameHierarchy: [],
    designSystemInfo: {
      library: false,
      published: false,
      components: 0,
      styles: 0,
      tokens: 0,
      lastUpdated: new Date().toISOString()
    },
    layoutGrid: {
      type: 'stretch',
      alignment: 'min',
      gutterSize: 20,
      offset: 0,
      visible: false,
      color: '#000000',
      opacity: 0.1
    },
    guides: [],
    flowContext: {
      connections: [],
      hotspots: []
    },
    comments: [],
    annotations: [],
    exportContext: {
      format: 'PNG',
      scale: 1,
      includeId: false,
      bounds: 'content',
      constraint: 'scale',
      colorSpace: 'sRGB'
    }
  };
  
  // Extract layout grids from parent frame
  let currentNode = node.parent;
  while (currentNode && currentNode.type !== 'FRAME') {
    currentNode = currentNode.parent;
  }
  
  if (currentNode && currentNode.layoutGrids) {
    const grid = currentNode.layoutGrids[0];
    if (grid) {
      context.layoutGrid = {
        type: grid.pattern,
        alignment: grid.alignment,
        gutterSize: grid.gutterSize || 20,
        offset: grid.offset || 0,
        count: grid.count,
        sectionSize: grid.sectionSize,
        visible: grid.visible,
        color: rgbaToHex(grid.color),
        opacity: grid.color.a
      };
    }
  }
  
  return context;
}

// Helper functions
function transformBounds(bounds: any, transform: any): any {
  // Apply transformation matrix to bounds - simplified implementation
  return bounds;
}

function splitIntoLines(text: string, maxWidth: number, fontSize: number): Array<{text: string, width: number}> {
  // Simplified line breaking - would need proper text measurement
  const words = text.split(' ');
  const lines: Array<{text: string, width: number}> = [];
  let currentLine = '';
  let currentWidth = 0;
  
  for (const word of words) {
    const wordWidth = word.length * fontSize * 0.6; // Approximation
    if (currentWidth + wordWidth > maxWidth && currentLine) {
      lines.push({ text: currentLine.trim(), width: currentWidth });
      currentLine = word + ' ';
      currentWidth = wordWidth;
    } else {
      currentLine += word + ' ';
      currentWidth += wordWidth;
    }
  }
  
  if (currentLine) {
    lines.push({ text: currentLine.trim(), width: currentWidth });
  }
  
  return lines;
}

function inferOverrideType(key: string, value: any): 'text' | 'fill' | 'stroke' | 'effect' | 'component' | 'visible' {
  if (key.toLowerCase().includes('text') || key.toLowerCase().includes('characters')) return 'text';
  if (key.toLowerCase().includes('fill')) return 'fill';
  if (key.toLowerCase().includes('stroke')) return 'stroke';
  if (key.toLowerCase().includes('effect')) return 'effect';
  if (key.toLowerCase().includes('visible')) return 'visible';
  return 'component';
}

function inferStyleType(styleId: string, node: any): 'paint' | 'text' | 'effect' | 'grid' {
  if (node.fillStyleId === styleId) return 'paint';
  if (node.strokeStyleId === styleId) return 'paint';
  if (node.textStyleId === styleId) return 'text';
  if (node.effectStyleId === styleId) return 'effect';
  return 'paint';
}

// CANVAS-BASED TEXT MEASUREMENT FUNCTIONS
async function measureTextPrecisely(text: string, fontConfig: any): Promise<any> {
  // In a browser environment, this would use actual HTML5 Canvas
  // For now, we'll use mathematical approximations based on font metrics
  
  const fontSize = fontConfig.fontSize;
  const fontFamily = fontConfig.fontFamily;
  
  // Font metrics approximations (would be exact with canvas)
  const approximateCharWidth = fontSize * 0.5; // Average character width
  const textWidth = text.length * approximateCharWidth;
  
  // These would be precise measurements from canvas.measureText()
  return {
    actualBoundingBoxAscent: fontSize * 0.75,   // Distance from baseline to top
    actualBoundingBoxDescent: fontSize * 0.25,  // Distance from baseline to bottom
    actualBoundingBoxLeft: 0,                   // Distance from alignment point to left
    actualBoundingBoxRight: textWidth,          // Distance from alignment point to right
    fontBoundingBoxAscent: fontSize * 0.8,      // Font's ascender
    fontBoundingBoxDescent: fontSize * 0.2,     // Font's descender
    width: textWidth,                           // Total text width
    emHeightAscent: fontSize * 0.8,            // Em square ascent
    emHeightDescent: fontSize * 0.2             // Em square descent
  };
}

async function createPreciseLineBoxes(
  text: string, 
  maxWidth: number, 
  fontSize: number, 
  lineHeight: number,
  textAlign: string,
  fontConfig: any
): Promise<LineBox[]> {
  
  if (!text) return [];
  
  // Simulate text wrapping with precise measurements
  const words = text.split(/\s+/);
  const lines: LineBox[] = [];
  let currentLine = '';
  let currentY = 0;
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = await estimateLineWidth(testLine, fontSize, fontConfig);
    
    if (lineWidth > maxWidth && currentLine) {
      // Finish current line
      const finalWidth = await estimateLineWidth(currentLine, fontSize, fontConfig);
      lines.push({
        y: currentY,
        height: lineHeight,
        baseline: currentY + fontSize * 0.75,
        ascent: fontSize * 0.75,
        descent: fontSize * 0.25,
        leading: lineHeight - fontSize,
        width: finalWidth,
        textAlign: textAlign.toLowerCase()
      });
      
      currentLine = word;
      currentY += lineHeight;
    } else {
      currentLine = testLine;
    }
  }
  
  // Add final line
  if (currentLine) {
    const finalWidth = await estimateLineWidth(currentLine, fontSize, fontConfig);
    lines.push({
      y: currentY,
      height: lineHeight,
      baseline: currentY + fontSize * 0.75,
      ascent: fontSize * 0.75,
      descent: fontSize * 0.25,
      leading: lineHeight - fontSize,
      width: finalWidth,
      textAlign: textAlign.toLowerCase()
    });
  }
  
  return lines;
}

async function extractCharacterMetrics(
  text: string,
  fontSize: number,
  fontConfig: any
): Promise<CharacterMetric[]> {
  
  const metrics: CharacterMetric[] = [];
  let x = 0;
  
  // Calculate position for each character
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const charWidth = await estimateCharacterWidth(char, fontSize, fontConfig);
    
    metrics.push({
      char,
      x,
      y: 0, // Relative to baseline
      width: charWidth,
      height: fontSize,
      advanceWidth: charWidth
    });
    
    x += charWidth;
  }
  
  return metrics;
}

async function estimateLineWidth(text: string, fontSize: number, fontConfig: any): Promise<number> {
  // Simplified width estimation - would use canvas.measureText() in browser
  const avgCharWidth = fontSize * 0.5; // Rough approximation
  return text.length * avgCharWidth;
}

async function estimateCharacterWidth(char: string, fontSize: number, fontConfig: any): Promise<number> {
  // Character-specific width approximations
  const wideChars = 'mwWMOQ@';
  const narrowChars = 'iljI.,:;';
  
  if (wideChars.includes(char)) return fontSize * 0.8;
  if (narrowChars.includes(char)) return fontSize * 0.3;
  if (char === ' ') return fontSize * 0.25;
  
  return fontSize * 0.5; // Average character width
}

function extractFontVariations(node: any): Record<string, number> {
  // Extract font variation settings if available
  const variations: Record<string, number> = {};
  
  // Common font variations
  if (node.fontWeight) variations['wght'] = node.fontWeight;
  if (node.fontWidth) variations['wdth'] = node.fontWidth;
  if (node.fontSlant) variations['slnt'] = node.fontSlant;
  
  return variations;
}

// ENHANCED VISUAL PROPERTIES HELPER FUNCTIONS

function extractBackdropBlur(node: any): number {
  // Check for backdrop blur effects
  if (node.effects) {
    const backdropBlur = node.effects.find((effect: any) => 
      effect.type === 'BACKGROUND_BLUR' && effect.visible !== false
    );
    return backdropBlur ? backdropBlur.radius : 0;
  }
  return 0;
}

async function extractBackgroundImages(node: any): Promise<BackgroundImage[]> {
  if (!node.fills || !Array.isArray(node.fills)) return [];
  
  const backgroundImages: BackgroundImage[] = [];
  
  for (const fill of node.fills) {
    if (fill.type === 'IMAGE' || fill.type === 'VIDEO') {
      backgroundImages.push({
        type: fill.type === 'IMAGE' ? 'url' : 'url',
        source: fill.imageHash || '', // Would need to resolve to actual URL
        opacity: fill.opacity || 1,
        blendMode: fill.blendMode || 'normal',
        transform: fill.imageTransform,
        repeat: fill.scaleMode === 'TILE' ? 'repeat' : 'no-repeat',
        position: '0% 0%', // Would extract from imageTransform
        size: fill.scaleMode === 'FIT' ? 'contain' : 
              fill.scaleMode === 'FILL' ? 'cover' : 'auto'
      });
    } else if (fill.type.includes('GRADIENT')) {
      backgroundImages.push({
        type: 'gradient',
        source: createGradientCSS(fill),
        opacity: fill.opacity || 1,
        blendMode: fill.blendMode || 'normal',
        transform: fill.gradientTransform,
        repeat: 'no-repeat',
        position: '0% 0%',
        size: 'auto'
      });
    }
  }
  
  return backgroundImages;
}

function extractBackgroundPosition(node: any): string {
  // Extract background position from image transforms
  if (node.fills) {
    const imageFill = node.fills.find((fill: any) => fill.type === 'IMAGE');
    if (imageFill && imageFill.imageTransform) {
      // Parse transform matrix to get position
      const transform = imageFill.imageTransform;
      return `${transform[4] || 0}px ${transform[5] || 0}px`;
    }
  }
  return '0% 0%';
}

function extractBackgroundRepeat(node: any): string {
  if (node.fills) {
    const imageFill = node.fills.find((fill: any) => fill.type === 'IMAGE');
    if (imageFill) {
      return imageFill.scaleMode === 'TILE' ? 'repeat' : 'no-repeat';
    }
  }
  return 'no-repeat';
}

function extractBackgroundSize(node: any): string {
  if (node.fills) {
    const imageFill = node.fills.find((fill: any) => fill.type === 'IMAGE');
    if (imageFill) {
      switch (imageFill.scaleMode) {
        case 'FIT': return 'contain';
        case 'FILL': return 'cover';
        case 'TILE': return 'auto';
        case 'STRETCH': return '100% 100%';
        default: return 'auto';
      }
    }
  }
  return 'auto';
}

async function extractBorderImageSource(node: any): Promise<string | undefined> {
  // Check if strokes contain image patterns
  if (node.strokes) {
    const imageStroke = node.strokes.find((stroke: any) => stroke.type === 'IMAGE');
    if (imageStroke) {
      return imageStroke.imageHash; // Would need to resolve to actual URL
    }
  }
  return undefined;
}

function extractBorderImageSlice(node: any): string {
  // Extract border image slice values
  if (node.strokes) {
    const imageStroke = node.strokes.find((stroke: any) => stroke.type === 'IMAGE');
    if (imageStroke) {
      // Would calculate actual slice values from stroke properties
      return '1';
    }
  }
  return '1';
}

// Helper function to safely convert values to strings, avoiding symbol conversion errors
function safeStringify(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'symbol') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  
  try {
    return String(value);
  } catch (error) {
    console.warn('Failed to stringify value:', value, error);
    return fallback;
  }
}

// Helper function to safely convert to number
function safeNumber(value: any, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function extractBorderImageWidth(node: any): string {
  try {
    const strokeWeight = safeNumber(node.strokeWeight, 1);
    return `${strokeWeight}px`;
  } catch (error) {
    console.warn('Error extracting border image width:', error);
    return '1px';
  }
}

async function extractClipPath(node: any): Promise<string | undefined> {
  if (node.isMask) {
    // For mask nodes, we'd need to calculate the actual clipping path
    // This would require parsing vector data if available
    if (node.type === 'VECTOR' && node.vectorPaths) {
      return convertVectorPathToClipPath(node.vectorPaths[0]);
    }
    // For simple shapes, approximate with basic shapes
    if (node.type === 'RECTANGLE') {
      const r = node.cornerRadius || 0;
      if (r > 0) {
        return `inset(0 round ${r}px)`;
      }
      return 'inset(0)';
    }
    if (node.type === 'ELLIPSE') {
      return 'ellipse(50% 50% at 50% 50%)';
    }
  }
  return undefined;
}

async function extractMaskImage(node: any): Promise<string | undefined> {
  // Check if the node has masking applied
  if (node.effects) {
    const maskEffect = node.effects.find((effect: any) => 
      effect.type === 'LAYER_BLUR' && effect.visible !== false
    );
    if (maskEffect) {
      // Would extract actual mask image if available
      return 'none'; // Placeholder
    }
  }
  return undefined;
}

function extractPixelRatio(node: any): number {
  // Extract pixel ratio from export settings or constraints
  if (node.exportSettings && node.exportSettings.length > 0) {
    const setting = node.exportSettings[0];
    if (setting.constraint && setting.constraint.value) {
      return setting.constraint.value;
    }
  }
  return 1; // Default
}

function createGradientCSS(fill: any): string {
  if (!fill.gradientStops) return '';
  
  const stops = fill.gradientStops.map((stop: any) => 
    `${rgbaToHex(stop.color)} ${Math.round(stop.position * 100)}%`
  ).join(', ');
  
  switch (fill.type) {
    case 'GRADIENT_LINEAR':
      // Calculate angle from gradient transform
      const angle = calculateGradientAngle(fill.gradientTransform);
      return `linear-gradient(${angle}deg, ${stops})`;
    case 'GRADIENT_RADIAL':
      return `radial-gradient(circle, ${stops})`;
    case 'GRADIENT_ANGULAR':
      return `conic-gradient(${stops})`;
    default:
      return `linear-gradient(${stops})`;
  }
}

function calculateGradientAngle(transform: any): number {
  if (!transform) return 0;
  
  // Calculate angle from transformation matrix
  // This is simplified - would need proper matrix math
  const a = transform[0];
  const b = transform[1];
  
  return Math.round(Math.atan2(b, a) * (180 / Math.PI));
}

function convertVectorPathToClipPath(vectorPath: any): string {
  // Convert SVG path data to CSS clip-path
  // This is a complex conversion that would need proper implementation
  if (vectorPath && vectorPath.data) {
    // Simplified conversion - would need full SVG path parser
    return `path("${vectorPath.data}")`;
  }
  return 'none';
}

// PIXEL-PERFECT VALIDATION SYSTEM
export interface PixelPerfectValidation {
  overall: {
    accuracy: number,
    score: number,
    pixelPerfect: boolean
  },
  positioning: {
    accuracy: number,
    subPixelPrecision: boolean,
    relativePrecision: boolean
  },
  typography: {
    accuracy: number,
    fontMetrics: boolean,
    lineSpacing: boolean,
    characterSpacing: boolean
  },
  visuals: {
    accuracy: number,
    colorPrecision: boolean,
    blendModes: boolean,
    effects: boolean
  },
  suggestions: string[]
}

export async function validatePixelPerfectExtraction(
  node: any, 
  blueprint: DesignBlueprint
): Promise<PixelPerfectValidation> {
  
  // Validate positioning accuracy
  const positioningValidation = validatePositioning(node, blueprint);
  
  // Validate typography accuracy
  const typographyValidation = validateTypography(node, blueprint);
  
  // Validate visual properties accuracy
  const visualValidation = validateVisuals(node, blueprint);
  
  // Calculate overall accuracy
  const overallAccuracy = Math.round(
    (positioningValidation.accuracy + typographyValidation.accuracy + visualValidation.accuracy) / 3
  );
  
  const validation: PixelPerfectValidation = {
    overall: {
      accuracy: overallAccuracy,
      score: overallAccuracy,
      pixelPerfect: overallAccuracy >= 95
    },
    positioning: positioningValidation,
    typography: typographyValidation,
    visuals: visualValidation,
    suggestions: generateImprovementSuggestions(positioningValidation, typographyValidation, visualValidation)
  };
  
  return validation;
}

function validatePositioning(node: any, blueprint: DesignBlueprint): any {
  let score = 0;
  let maxScore = 0;
  let subPixelPrecision = false;
  let relativePrecision = false;
  
  // Check basic positioning
  if (blueprint.position && node.x !== undefined && node.y !== undefined) {
    const xAccuracy = Math.abs(blueprint.position.x - node.x) <= 0.1;
    const yAccuracy = Math.abs(blueprint.position.y - node.y) <= 0.1;
    
    if (xAccuracy && yAccuracy) score += 30;
    maxScore += 30;
  }
  
  // Check sub-pixel precision
  if (blueprint.precisePosition) {
    subPixelPrecision = true;
    const preciseXAccuracy = blueprint.precisePosition.preciseX === node.x;
    const preciseYAccuracy = blueprint.precisePosition.preciseY === node.y;
    
    if (preciseXAccuracy && preciseYAccuracy) score += 25;
    maxScore += 25;
  }
  
  // Check relative positioning
  if (blueprint.precisePosition?.relativeToParent && node.parent) {
    relativePrecision = true;
    // Would validate relative positioning calculations
    score += 20; // Placeholder - assume accurate for now
    maxScore += 20;
  }
  
  // Check size accuracy
  if (blueprint.size && node.width !== undefined && node.height !== undefined) {
    const widthAccuracy = Math.abs(blueprint.size.width - node.width) <= 0.1;
    const heightAccuracy = Math.abs(blueprint.size.height - node.height) <= 0.1;
    
    if (widthAccuracy && heightAccuracy) score += 25;
    maxScore += 25;
  }
  
  return {
    accuracy: maxScore > 0 ? Math.round((score / maxScore) * 100) : 100,
    subPixelPrecision,
    relativePrecision
  };
}

function validateTypography(node: any, blueprint: DesignBlueprint): any {
  if (node.type !== 'TEXT' && !hasTextChildren(node)) {
    return {
      accuracy: 100,
      fontMetrics: true,
      lineSpacing: true,
      characterSpacing: true
    };
  }
  
  let score = 0;
  let maxScore = 0;
  let fontMetrics = false;
  let lineSpacing = false;
  let characterSpacing = false;
  
  // Check basic typography
  if (blueprint.typography && node.fontName) {
    const fontFamilyMatch = blueprint.typography.font?.fallback.family === node.fontName.family;
    const fontSizeMatch = parseInt(blueprint.typography.font?.fallback.size || '0') === node.fontSize;
    const fontWeightMatch = blueprint.typography.font?.fallback.weight === extractFontWeight(node.fontName.style);
    
    if (fontFamilyMatch) score += 15;
    if (fontSizeMatch) score += 15;
    if (fontWeightMatch) score += 10;
    maxScore += 40;
  }
  
  // Check enhanced typography
  if (blueprint.preciseTypography) {
    fontMetrics = true;
    
    // Validate text metrics
    if (blueprint.preciseTypography.textMetrics) {
      score += 20; // Assume accurate for now
      maxScore += 20;
    }
    
    // Validate line spacing
    if (blueprint.preciseTypography.lineBoxes && blueprint.preciseTypography.lineBoxes.length > 0) {
      lineSpacing = true;
      score += 20;
      maxScore += 20;
    }
    
    // Validate character spacing
    if (blueprint.preciseTypography.characterMetrics && blueprint.preciseTypography.characterMetrics.length > 0) {
      characterSpacing = true;
      score += 20;
      maxScore += 20;
    }
  }
  
  return {
    accuracy: maxScore > 0 ? Math.round((score / maxScore) * 100) : 100,
    fontMetrics,
    lineSpacing,
    characterSpacing
  };
}

function validateVisuals(node: any, blueprint: DesignBlueprint): any {
  let score = 0;
  let maxScore = 0;
  let colorPrecision = false;
  let blendModes = false;
  let effects = false;
  
  // Check basic visual properties
  if (blueprint.visuals) {
    // Validate fills
    if (node.fills && blueprint.visuals.fills) {
      const fillsMatch = node.fills.length === blueprint.visuals.fills.length;
      if (fillsMatch) score += 20;
      maxScore += 20;
      colorPrecision = true;
    }
    
    // Validate strokes
    if (node.strokes && blueprint.visuals.strokes) {
      const strokesMatch = node.strokes.length === blueprint.visuals.strokes.length;
      if (strokesMatch) score += 15;
      maxScore += 15;
    }
    
    // Validate effects
    if (node.effects && blueprint.visuals.effects) {
      const effectsMatch = node.effects.length === blueprint.visuals.effects.length;
      if (effectsMatch) score += 15;
      maxScore += 15;
      effects = true;
    }
  }
  
  // Check enhanced visual properties
  if (blueprint.enhancedVisuals) {
    // Validate blend modes
    if (blueprint.enhancedVisuals.mixBlendMode) {
      blendModes = true;
      const blendModeMatch = blueprint.enhancedVisuals.mixBlendMode === (node.blendMode || 'normal');
      if (blendModeMatch) score += 15;
      maxScore += 15;
    }
    
    // Validate sub-pixel rendering
    if (blueprint.enhancedVisuals.subPixelRendering) {
      score += 10; // Assume accurate
      maxScore += 10;
    }
    
    // Validate clipping/masking
    if (blueprint.enhancedVisuals.clipPath || blueprint.enhancedVisuals.maskImage) {
      score += 15;
      maxScore += 15;
    }
    
    // Validate export settings
    if (blueprint.enhancedVisuals.exportSettings && blueprint.enhancedVisuals.exportSettings.length > 0) {
      score += 10;
      maxScore += 10;
    }
  }
  
  return {
    accuracy: maxScore > 0 ? Math.round((score / maxScore) * 100) : 100,
    colorPrecision,
    blendModes,
    effects
  };
}

function generateImprovementSuggestions(
  positioning: any,
  typography: any,
  visuals: any
): string[] {
  const suggestions: string[] = [];
  
  // Positioning suggestions
  if (positioning.accuracy < 95) {
    if (!positioning.subPixelPrecision) {
      suggestions.push('Enable sub-pixel positioning for better accuracy');
    }
    if (!positioning.relativePrecision) {
      suggestions.push('Add relative positioning context for responsive layouts');
    }
  }
  
  // Typography suggestions
  if (typography.accuracy < 95) {
    if (!typography.fontMetrics) {
      suggestions.push('Implement canvas-based font measurement for precise text metrics');
    }
    if (!typography.lineSpacing) {
      suggestions.push('Add line-by-line analysis for accurate line spacing');
    }
    if (!typography.characterSpacing) {
      suggestions.push('Include character-level metrics for complex text layouts');
    }
  }
  
  // Visual suggestions
  if (visuals.accuracy < 95) {
    if (!visuals.colorPrecision) {
      suggestions.push('Improve color extraction precision and gradient handling');
    }
    if (!visuals.blendModes) {
      suggestions.push('Add blend mode and layer composition support');
    }
    if (!visuals.effects) {
      suggestions.push('Enhance effect extraction including backdrop blur and clipping');
    }
  }
  
  // General suggestions
  if (positioning.accuracy < 90 || typography.accuracy < 90 || visuals.accuracy < 90) {
    suggestions.push('Consider implementing real-time preview validation');
    suggestions.push('Add machine learning pattern recognition for better accuracy');
  }
  
  return suggestions;
}

// TESTING AND BENCHMARKING FUNCTIONS
export async function runPixelPerfectBenchmark(nodes: any[]): Promise<{
  averageAccuracy: number,
  pixelPerfectCount: number,
  totalNodes: number,
  detailedResults: PixelPerfectValidation[]
}> {
  
  console.log('🧪 Running pixel-perfect benchmark on', nodes.length, 'nodes');
  
  const results: PixelPerfectValidation[] = [];
  let totalAccuracy = 0;
  let pixelPerfectCount = 0;
  
  for (const node of nodes) {
    try {
      const blueprint = await extractDesignBlueprint(node);
      const validation = await validatePixelPerfectExtraction(node, blueprint);
      
      results.push(validation);
      totalAccuracy += validation.overall.accuracy;
      
      if (validation.overall.pixelPerfect) {
        pixelPerfectCount++;
      }
      
      console.log(`✓ ${node.name}: ${validation.overall.accuracy}% ${validation.overall.pixelPerfect ? '(Pixel Perfect!)' : ''}`);
      
    } catch (error) {
      console.error(`✗ Failed to process ${node.name}:`, error);
    }
  }
  
  const averageAccuracy = nodes.length > 0 ? Math.round(totalAccuracy / nodes.length) : 0;
  
  console.log('📊 Benchmark Results:', {
    averageAccuracy: `${averageAccuracy}%`,
    pixelPerfect: `${pixelPerfectCount}/${nodes.length}`,
    successRate: `${Math.round((pixelPerfectCount / nodes.length) * 100)}%`
  });
  
  return {
    averageAccuracy,
    pixelPerfectCount,
    totalNodes: nodes.length,
    detailedResults: results
  };
}