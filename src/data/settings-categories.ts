import { 
  Building2, MapPin, Briefcase, Users, Tag, GitBranch, 
  Shield, Workflow, Building, Receipt
} from 'lucide-react';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { OfficesSettings } from '../components/settings/OfficesSettings';
import { StaffCategoriesSettings } from '../components/settings/StaffCategoriesSettings';
import { UsersSettings } from '../components/settings/UsersSettings';
import { TypesSettings } from '../components/settings/TypesSettings';
import { CostCentersSettings } from '../components/settings/CostCentersSettings';
import { PoliciesSettings } from '../components/settings/PoliciesSettings';
import { WorkflowsSettings } from '../components/settings/WorkflowsSettings';
import { ClientsSettings } from '../components/settings/ClientsSettings';
import { BillingSettings } from '../components/settings/BillingSettings';

export interface CategoryConfig {
  id: string;
  name: string;
  icon: any;
  description: string;
  completed: boolean;
  component: any;
  timeEstimate: string;
  priority: number;
  summary: string;
  details: string;
  action: string;
  isNextAction?: boolean;
}

export interface AdvancedCategoryConfig {
  id: string;
  name: string;
  icon: any;
  description: string;
  completed: boolean;
  component: any;
  trigger: string;
  defaultState: string;
}

export function getEssentialCategories(configuredData: any): CategoryConfig[] {
  const userCount = configuredData.users?.count || 0;
  const officeCount = configuredData.offices?.count || 0;
  const firstOffice = configuredData.offices?.offices?.[0];
  const typesCount = (configuredData.types?.costTypes || 0) + (configuredData.types?.leaveTypes || 0) + (configuredData.types?.projectTypes || 0);

  return [
    {
      id: 'general',
      name: 'General Information',
      icon: Building2,
      description: 'Company identity and platform behavior',
      completed: !!configuredData.general?.companyName,
      component: GeneralSettings,
      timeEstimate: '2 mins',
      priority: 1,
      summary: configuredData.general?.companyName || 'Not configured',
      details: [configuredData.general?.location, configuredData.general?.language].filter(Boolean).join(' · ') || 'Set up your company details',
      action: 'Edit details'
    },
    {
      id: 'offices',
      name: 'Offices',
      icon: MapPin,
      description: 'Locations, timezones, and schedules',
      completed: officeCount > 0,
      component: OfficesSettings,
      timeEstimate: '3 mins',
      priority: 2,
      summary: officeCount === 1 ? '1 office' : `${officeCount} offices`,
      details: firstOffice
        ? [firstOffice.name, firstOffice.timezone ? `${firstOffice.timezone} timezone` : '', firstOffice.currency ? `${firstOffice.currency} currency` : ''].filter(Boolean).join(' · ')
        : 'Add your first office location',
      action: firstOffice ? `Manage ${firstOffice.name}` : 'Add office'
    },
    {
      id: 'users',
      name: 'Users',
      icon: Users,
      description: 'Invite your team',
      completed: userCount > 0,
      component: UsersSettings,
      timeEstimate: '3 mins',
      priority: 3,
      summary: userCount === 1 ? '1 team member' : `${userCount} team members`,
      details: userCount > 0 ? `${userCount} users configured` : 'Add team members to start collaborating',
      action: userCount > 0 ? 'Manage users' : 'Add your first user',
    },
    {
      id: 'types',
      name: 'Types',
      icon: Tag,
      description: 'Cost, leave, project, and funding categories',
      completed: typesCount > 0,
      component: TypesSettings,
      timeEstimate: '2 mins',
      priority: 4,
      summary: typesCount > 0 ? `${typesCount} types configured` : 'Using system defaults',
      details: typesCount > 0 ? `${configuredData.types?.costTypes || 0} cost types configured` : 'Customize categories for your workflow',
      action: typesCount > 0 ? 'Manage types' : 'Review & customize types'
    }
  ];
}

export const advancedCategories: AdvancedCategoryConfig[] = [
  {
    id: 'staff-categories',
    name: 'Staff Categories',
    icon: Briefcase,
    description: 'Job positions and pay rates',
    completed: false,
    component: StaffCategoriesSettings,
    trigger: 'Configure before adding users',
    defaultState: 'Standard roles applied'
  },
  {
    id: 'cost-centers',
    name: 'Cost Centers',
    icon: GitBranch,
    description: 'Budget tracking codes',
    completed: false,
    component: CostCentersSettings,
    trigger: 'Set up for expense tracking',
    defaultState: 'Optional feature'
  },
  {
    id: 'policies',
    name: 'Policies',
    icon: Shield,
    description: 'Approval workflows',
    completed: false,
    component: PoliciesSettings,
    trigger: 'Configure before first expense',
    defaultState: 'Auto-approval active'
  },
  {
    id: 'workflows',
    name: 'Workflows',
    icon: Workflow,
    description: 'Kanban board templates',
    completed: false,
    component: WorkflowsSettings,
    trigger: 'Customize project workflows',
    defaultState: 'Default workflow active'
  },
  {
    id: 'clients',
    name: 'Clients',
    icon: Building,
    description: 'Client database',
    completed: false,
    component: ClientsSettings,
    trigger: 'Add when creating client projects',
    defaultState: 'Optional'
  },
  {
    id: 'billing',
    name: 'Billing',
    icon: Receipt,
    description: 'Invoice settings',
    completed: false,
    component: BillingSettings,
    trigger: 'Required before first invoice',
    defaultState: 'Configure when needed'
  }
];

