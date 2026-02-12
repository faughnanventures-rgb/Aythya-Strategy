/**
 * Core type definitions for the Life Strategic Planning Platform
 * Based on the Personal Strategic Planning Framework document
 */

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  expires: string;
}

// ============================================
// STRATEGIC PLAN TYPES
// ============================================

export interface StrategicPlan {
  id: string;
  userId: string;
  title: string;
  status: PlanStatus;
  currentPhase: PlanPhase;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  
  // Phase data
  currentState: CurrentStateAnalysis | null;
  energyAudit: EnergyAudit | null;
  minimumViableStability: MinimumViableStability | null;
  strategicPillars: StrategicPillar[];
  tacticalMap: TacticalMap | null;
  goals: Goal[];
  relationshipAudit: RelationshipAudit | null;
  reflection: Reflection | null;
}

export type PlanStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export type PlanPhase = 
  | 'current_state'
  | 'energy_audit'
  | 'minimum_viable_stability'
  | 'strategic_pillars'
  | 'tactical_mapping'
  | 'goal_setting'
  | 'relationship_audit'
  | 'reflection'
  | 'completed';

// ============================================
// PHASE 1: CURRENT STATE ANALYSIS
// ============================================

export interface CurrentStateAnalysis {
  id: string;
  planId: string;
  completedAt: Date | null;
  
  // Opening context
  openingContext: OpeningContext;
  
  // Asset inventory
  assets: AssetInventory;
  
  // Constraints
  constraints: Constraints;
  
  // AI conversation history for this phase
  conversationHistory: ConversationMessage[];
}

export interface OpeningContext {
  // What are the 2-3 areas where you feel strongest/most fulfilled?
  strengthAreas: string[];
  
  // What prompted this conversation? (transitions, changes, etc.)
  triggerContext: string;
  
  // Additional context user wants to share
  additionalContext: string;
}

export interface AssetInventory {
  // Professional experience: skills, roles, expertise
  professionalExperience: ProfessionalAsset[];
  
  // Rediscovered or emerging interests
  emergingInterests: Interest[];
  
  // Health/wellness status
  healthStatus: HealthStatus;
  
  // Relationships inventory
  relationships: RelationshipInventory;
  
  // Core values (identified through conversation)
  coreValues: CoreValue[];
}

export interface ProfessionalAsset {
  id: string;
  type: 'skill' | 'role' | 'expertise' | 'achievement' | 'credential';
  name: string;
  description: string;
  yearsOfExperience: number | null;
  currentlyActive: boolean;
  relevanceScore: number; // 1-5, how relevant to future goals
}

export interface Interest {
  id: string;
  name: string;
  description: string;
  status: 'rediscovered' | 'emerging' | 'established';
  energyLevel: 'high' | 'medium' | 'low';
  timeInvested: string; // e.g., "2 hours/week"
}

export interface HealthStatus {
  physicalHealth: HealthDimension;
  mentalHealth: HealthDimension;
  energyLevels: HealthDimension;
  constraints: string[]; // Physical limitations, conditions, etc.
  momentum: string; // What's working well
}

export interface HealthDimension {
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface RelationshipInventory {
  // Who's in their life
  currentRelationships: RelationshipEntry[];
  
  // Who's returned recently
  reconnections: string[];
  
  // Who's missing
  missingRelationships: string[];
}

export interface RelationshipEntry {
  id: string;
  name: string;
  type: 'family' | 'friend' | 'colleague' | 'mentor' | 'romantic' | 'community' | 'other';
  quality: 'additive' | 'neutral' | 'subtractive';
  notes: string;
}

export interface CoreValue {
  id: string;
  name: string; // e.g., "independence", "creativity", "stability", "impact"
  importance: 1 | 2 | 3 | 4 | 5;
  currentAlignment: 1 | 2 | 3 | 4 | 5; // How aligned is current life with this value
  notes: string;
}

export interface Constraints {
  financial: FinancialConstraint;
  legal: LegalConstraint[];
  health: string[];
  time: TimeConstraint[];
  geographic: GeographicConstraint;
  external: ExternalConstraint[]; // Things outside their control
}

export interface FinancialConstraint {
  incomeNeeds: string;
  debt: string;
  obligations: string[];
  runway: string; // How long can they sustain current situation
}

export interface LegalConstraint {
  type: 'divorce' | 'custody' | 'contract' | 'visa' | 'other';
  description: string;
  timeline: string | null;
  status: 'active' | 'pending' | 'resolved';
}

export interface TimeConstraint {
  type: 'caregiving' | 'job_search' | 'education' | 'commitment' | 'other';
  description: string;
  hoursPerWeek: number | null;
}

export interface GeographicConstraint {
  currentLocation: string;
  desiredLocation: string | null;
  flexibility: 'none' | 'limited' | 'moderate' | 'high';
  notes: string;
}

export interface ExternalConstraint {
  description: string;
  dependsOn: string; // What are they waiting on
  estimatedResolution: string | null;
}

// ============================================
// PHASE 2: ENERGY AUDIT
// ============================================

export interface EnergyAudit {
  id: string;
  planId: string;
  completedAt: Date | null;
  
  // Activities that energize
  energizers: EnergyActivity[];
  
  // Activities that drain
  drainers: EnergyActivity[];
  
  // Work style preferences
  workStyle: WorkStylePreference;
  
  // Definition of "enough"
  enoughDefinition: string;
  
  conversationHistory: ConversationMessage[];
}

export interface EnergyActivity {
  id: string;
  name: string;
  category: 'work' | 'hobby' | 'project' | 'obligation' | 'relationship' | 'other';
  energyImpact: 'high_positive' | 'moderate_positive' | 'neutral' | 'moderate_negative' | 'high_negative';
  flowState: boolean; // Do they lose track of time?
  notes: string;
}

export interface WorkStylePreference {
  focusStyle: 'deep_focus_single' | 'rotating_multiple' | 'mixed';
  preferredSessionLength: string;
  peakEnergyTime: 'morning' | 'afternoon' | 'evening' | 'varies';
  notes: string;
}

// ============================================
// PHASE 3: MINIMUM VIABLE STABILITY
// ============================================

export interface MinimumViableStability {
  id: string;
  planId: string;
  completedAt: Date | null;
  
  // What does "okay" look like
  okayDefinition: string;
  
  // Minimum viable income
  minimumIncome: string;
  
  // What would make next 6-12 months sustainable
  sustainabilityRequirements: string[];
  
  // Timeline context
  timelineContext: string;
  
  conversationHistory: ConversationMessage[];
}

// ============================================
// PHASE 4: STRATEGIC PILLARS
// ============================================

export interface StrategicPillar {
  id: string;
  planId: string;
  
  // Pillar type
  type: PillarType;
  
  // Custom name if type is 'custom'
  customName: string | null;
  
  // What this means for them specifically
  personalMeaning: string;
  
  // Current state
  currentState: string;
  
  // What progress looks like
  progressDefinition: string;
  
  // Priority order
  priority: number;
  
  // Associated goals
  goalIds: string[];
}

export type PillarType = 
  | 'income_financial'
  | 'health_physical'
  | 'building_learning'
  | 'relationships_community'
  | 'healing_processing'
  | 'creative_expression'
  | 'career_transition'
  | 'custom';

// ============================================
// PHASE 5: TACTICAL MAPPING
// ============================================

export interface TacticalMap {
  id: string;
  planId: string;
  completedAt: Date | null;
  
  // Active opportunities
  activeOpportunities: Opportunity[];
  
  // Paths to income
  incomePaths: IncomePath[];
  
  // Projects & commitments
  projectsAndCommitments: ProjectCommitment[];
  
  // Parked ideas
  parkedIdeas: ParkedIdea[];
  
  // Seasonal/location rhythms
  rhythms: SeasonalRhythm[];
  
  conversationHistory: ConversationMessage[];
}

export interface Opportunity {
  id: string;
  name: string;
  description: string;
  status: 'warm' | 'active' | 'pending' | 'cooling';
  nextStep: string;
  potentialOutcome: string;
}

export interface IncomePath {
  id: string;
  name: string;
  type: 'employment' | 'freelance' | 'business' | 'investment' | 'passive' | 'other';
  currentTraction: 'none' | 'early' | 'moderate' | 'strong';
  timeline: string;
  potentialIncome: string;
  requiredActions: string[];
}

export interface ProjectCommitment {
  id: string;
  name: string;
  type: 'project' | 'board' | 'volunteer' | 'commitment' | 'other';
  timePerWeek: string;
  endDate: string | null;
  priority: 'core' | 'important' | 'optional';
}

export interface ParkedIdea {
  id: string;
  name: string;
  description: string;
  excitementLevel: 1 | 2 | 3 | 4 | 5;
  blockingConstraint: string;
  triggerToRevisit: string;
}

export interface SeasonalRhythm {
  id: string;
  season: string; // e.g., "Summer", "Q4", "School year"
  location: string | null;
  focusAreas: string[];
  activities: string[];
}

// ============================================
// PHASE 6: GOALS
// ============================================

export interface Goal {
  id: string;
  planId: string;
  pillarId: string;
  
  // Goal content
  title: string;
  description: string;
  
  // Goal type
  type: GoalType;
  
  // For rhythm goals
  rhythmFrequency: string | null; // e.g., "60 species/month"
  
  // For milestone goals
  milestoneTarget: string | null;
  milestoneDeadline: Date | null;
  
  // For trigger-based goals
  triggerEvent: string | null;
  
  // Progress tracking
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  progressNotes: string;
  
  // Timeline
  targetDate: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export type GoalType = 
  | 'rhythm'      // Ongoing practices
  | 'milestone'   // Specific achievements
  | 'experience'  // Things to do, not metrics
  | 'presence'    // Ways of showing up
  | 'trigger'     // Tied to an event, not a date
  | 'custom';

// ============================================
// PHASE 7: RELATIONSHIP AUDIT
// ============================================

export interface RelationshipAudit {
  id: string;
  planId: string;
  completedAt: Date | null;
  
  // Additive relationships
  additiveRelationships: AuditedRelationship[];
  
  // Subtractive relationships
  subtractiveRelationships: AuditedRelationship[];
  
  // Reconnections
  reconnections: Reconnection[];
  
  // Relationships let go
  releasedRelationships: ReleasedRelationship[];
  
  // Investments to make
  investmentPriorities: string[];
  
  // Boundaries needed
  boundariesNeeded: BoundaryNeeded[];
  
  conversationHistory: ConversationMessage[];
}

export interface AuditedRelationship {
  id: string;
  name: string;
  impact: string; // How they affected you
  notes: string;
}

export interface Reconnection {
  id: string;
  name: string;
  whatBroughtThemBack: string;
  feelingsAboutIt: string;
}

export interface ReleasedRelationship {
  id: string;
  name: string | null; // Can be anonymous
  circumstances: string;
  feelingsNow: string;
}

export interface BoundaryNeeded {
  id: string;
  relationship: string;
  boundaryType: 'conversation' | 'distance' | 'decision' | 'other';
  description: string;
}

// ============================================
// PHASE 8: REFLECTION
// ============================================

export interface Reflection {
  id: string;
  planId: string;
  completedAt: Date | null;
  
  // One sentence encapsulation
  yearInOneSentence: string;
  
  // Losses grieved
  lossesGrieved: string[];
  
  // Losses that were relief
  lossesRelief: string[];
  
  // Self-discoveries
  selfDiscoveries: string[];
  
  // Surprising accomplishments
  surprisingAccomplishments: string[];
  
  // To carry forward
  carryForward: string[];
  
  // To leave behind
  leaveBehind: string[];
  
  conversationHistory: ConversationMessage[];
}

// ============================================
// CONVERSATION & AI TYPES
// ============================================

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  phase: PlanPhase;
  extractedData?: Record<string, unknown>;
  followUpQuestions?: string[];
}

export interface AIConversationContext {
  plan: StrategicPlan;
  currentPhase: PlanPhase;
  conversationHistory: ConversationMessage[];
  userContext: UserContext;
}

export interface UserContext {
  name: string;
  previousPlans: number;
  currentPlanProgress: number; // percentage
}

// ============================================
// API TYPES
// ============================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ChatRequest {
  planId: string;
  message: string;
  phase: PlanPhase;
}

export interface ChatResponse {
  message: string;
  extractedData?: Record<string, unknown>;
  suggestedNextPhase?: PlanPhase;
  followUpQuestions?: string[];
}

// ============================================
// STORAGE TYPES
// ============================================

export type StorageMode = 'local' | 'supabase';

export interface StorageAdapter {
  // Plan operations
  createPlan: (userId: string, title: string) => Promise<StrategicPlan>;
  getPlan: (planId: string) => Promise<StrategicPlan | null>;
  updatePlan: (planId: string, updates: Partial<StrategicPlan>) => Promise<StrategicPlan>;
  deletePlan: (planId: string) => Promise<void>;
  listPlans: (userId: string) => Promise<StrategicPlan[]>;
  
  // Phase data operations
  savePhaseData: <T>(planId: string, phase: PlanPhase, data: T) => Promise<void>;
  getPhaseData: <T>(planId: string, phase: PlanPhase) => Promise<T | null>;
  
  // Conversation operations
  saveConversation: (planId: string, phase: PlanPhase, messages: ConversationMessage[]) => Promise<void>;
  getConversation: (planId: string, phase: PlanPhase) => Promise<ConversationMessage[]>;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface UIState {
  currentPlan: StrategicPlan | null;
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  currentPhaseIndex: number;
}

export interface OnboardingState {
  step: number;
  totalSteps: number;
  completed: boolean;
}
