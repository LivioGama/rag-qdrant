export interface FeatureItem {
  id: string
  name: string
  description: string
  workdays: number
  category: FeatureCategory
  keywords: string[]
  rationale?: string
  isMandatory?: boolean
}

export enum FeatureCategory {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  DATABASE = 'DATABASE',
  DEVOPS = 'DEVOPS',
  DESIGN = 'DESIGN',
  QA = 'QA',
}

export const getCategoryColor = (category: FeatureCategory): string => {
  switch (category) {
    case FeatureCategory.FRONTEND:
      return '#3B82F6' // Blue
    case FeatureCategory.BACKEND:
      return '#10B981' // Green
    case FeatureCategory.DATABASE:
      return '#F59E0B' // Amber
    case FeatureCategory.DEVOPS:
      return '#8B5CF6' // Purple
    case FeatureCategory.DESIGN:
      return '#EC4899' // Pink
    case FeatureCategory.QA:
      return '#EF4444' // Red
    default:
      return '#6B7280' // Gray
  }
}

export const getCategoryGradient = (category: FeatureCategory): string => {
  switch (category) {
    case FeatureCategory.FRONTEND:
      return 'linear-gradient(135deg, #3B82F6 0%, #93C5FD 100%)' // Blue gradient
    case FeatureCategory.BACKEND:
      return 'linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)' // Green gradient
    case FeatureCategory.DATABASE:
      return 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)' // Amber gradient
    case FeatureCategory.DEVOPS:
      return 'linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)' // Purple gradient
    case FeatureCategory.DESIGN:
      return 'linear-gradient(135deg, #EC4899 0%, #F9A8D4 100%)' // Pink gradient
    case FeatureCategory.QA:
      return 'linear-gradient(135deg, #EF4444 0%, #FCA5A5 100%)' // Red gradient
    default:
      return 'linear-gradient(135deg, #6B7280 0%, #D1D5DB 100%)' // Gray gradient
  }
}
