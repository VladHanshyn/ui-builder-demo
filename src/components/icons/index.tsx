/**
 * Icons - Tango Design System
 * 
 * Central export point for all icon components.
 * Icons are 20x20px by default with currentColor stroke.
 */

import { SVGProps } from "react";

// ============================================
// TYPES
// ============================================

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Icon size (width & height) */
  size?: number;
}

// ============================================
// BASE ICON WRAPPER
// ============================================

const Icon = ({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {children}
  </svg>
);

// ============================================
// ACTION ICONS
// ============================================

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 4V16M4 10H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const EditIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M14.166 2.5L17.5 5.833M2.5 17.5L3.333 14.166L13.333 4.166L16.666 7.5L6.666 17.5H2.5V17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 5.833H16.666M8.333 9.166V14.166M11.666 9.166V14.166M4.166 5.833L5 15.833C5 16.938 5.895 17.5 7 17.5H13C14.104 17.5 15 16.938 15 15.833L15.833 5.833M7.5 5.833V3.333C7.5 2.873 7.873 2.5 8.333 2.5H11.666C12.126 2.5 12.5 2.873 12.5 3.333V5.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="6.666" y="6.666" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M13.333 6.666V5C13.333 3.895 12.438 3 11.333 3H5C3.895 3 3 3.895 3 5V11.333C3 12.438 3.895 13.333 5 13.333H6.666"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </Icon>
);

export const EyeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 4.166C3.75 4.166 1.25 10 1.25 10C1.25 10 3.75 15.833 10 15.833C16.25 15.833 18.75 10 18.75 10C18.75 10 16.25 4.166 10 4.166Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const EyeOffIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M2.5 2.5L17.5 17.5M8.235 8.236A2.5 2.5 0 0011.765 11.765M4.5 6.5C3 7.833 1.25 10 1.25 10C1.25 10 3.75 15.833 10 15.833C11.5 15.833 12.833 15.5 14 15M16.5 13.5C17.833 12.167 18.75 10 18.75 10C18.75 10 16.25 4.166 10 4.166C9.166 4.166 8.375 4.291 7.625 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// ============================================
// NAVIGATION ICONS
// ============================================

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ChevronUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M15 12.5L10 7.5L5 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12.5 15L7.5 10L12.5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M7.5 5L12.5 10L7.5 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M15.833 10H4.166M4.166 10L9.166 5M4.166 10L9.166 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M4.166 10H15.833M15.833 10L10.833 5M15.833 10L10.833 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// ============================================
// STATUS ICONS
// ============================================

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M4.166 10.833L7.5 14.166L15.833 5.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5 5L15 15M5 15L15 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const InfoIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 9V14M10 6.5V7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const WarningIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 7V10.5M10 13V13.5M3.5 17.5H16.5L10 3.5L3.5 17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ErrorIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M7 7L13 13M13 7L7 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const SuccessIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M6.666 10L9.166 12.5L13.333 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// ============================================
// UI ICONS
// ============================================

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M13 13L17 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const SettingsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 2.5V4.5M10 15.5V17.5M17.5 10H15.5M4.5 10H2.5M15.303 4.697L13.889 6.111M6.111 13.889L4.697 15.303M15.303 15.303L13.889 13.889M6.111 6.111L4.697 4.697"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const MenuIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3 5H17M3 10H17M3 15H17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const MoreHorizontalIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5" cy="10" r="1.5" fill="currentColor" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="15" cy="10" r="1.5" fill="currentColor" />
  </Icon>
);

export const MoreVerticalIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="5" r="1.5" fill="currentColor" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="10" cy="15" r="1.5" fill="currentColor" />
  </Icon>
);

export const StarIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 2.5L12.09 6.74L16.86 7.44L13.43 10.77L14.18 15.52L10 13.27L5.82 15.52L6.57 10.77L3.14 7.44L7.91 6.74L10 2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const StarFilledIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 2.5L12.09 6.74L16.86 7.44L13.43 10.77L14.18 15.52L10 13.27L5.82 15.52L6.57 10.77L3.14 7.44L7.91 6.74L10 2.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const HeartIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 17.5L8.55 16.175C4.4 12.42 1.75 10.03 1.75 7.125C1.75 4.735 3.615 2.875 6 2.875C7.32 2.875 8.59 3.49 9.45 4.465L10 5.075L10.55 4.465C11.41 3.49 12.68 2.875 14 2.875C16.385 2.875 18.25 4.735 18.25 7.125C18.25 10.03 15.6 12.42 11.45 16.175L10 17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const TagIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M17.5 10.585V3.335C17.5 2.875 17.125 2.5 16.665 2.5H9.415C9.19 2.5 8.97 2.59 8.81 2.75L2.75 8.81C2.43 9.13 2.43 9.62 2.75 9.94L9.06 16.25C9.38 16.57 9.87 16.57 10.19 16.25L16.25 10.19C16.41 10.03 16.5 9.81 16.5 9.585"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="13" cy="7" r="1" fill="currentColor" />
  </Icon>
);

export const ChartIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 16.666V8.333M8.333 16.666V3.333M13.333 16.666V10M18.333 16.666V6.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const CalendarIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="4.166" width="15" height="13.334" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M2.5 8.333H17.5M6.666 2.5V5.833M13.333 2.5V5.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const UserIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="6.666" r="3.333" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3.333 17.5C3.333 14.278 6.318 11.666 10 11.666C13.682 11.666 16.666 14.278 16.666 17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const UsersIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="7.5" cy="6.666" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M2.5 16.666C2.5 14.089 4.739 12 7.5 12C10.261 12 12.5 14.089 12.5 16.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="14.166" cy="5.833" r="2.083" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M14.166 10.833C16.007 10.833 17.5 12.326 17.5 14.166"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const BellIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M8.333 15.833C8.333 16.753 9.08 17.5 10 17.5C10.92 17.5 11.666 16.753 11.666 15.833M4.166 15.833H15.833C15.833 15.833 15 14.166 15 10.833C15 7.612 12.761 5 10 5C7.239 5 5 7.612 5 10.833C5 14.166 4.166 15.833 4.166 15.833ZM10 5V2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 2.5V12.5M10 12.5L6.666 9.166M10 12.5L13.333 9.166M3.333 15.833H16.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const UploadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 12.5V2.5M10 2.5L6.666 5.833M10 2.5L13.333 5.833M3.333 15.833H16.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const FilterIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M2.5 5H17.5M5 10H15M7.5 15H12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const SortIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5 7.5V15.833M5 15.833L2.5 13.333M5 15.833L7.5 13.333M15 12.5V4.166M15 4.166L12.5 6.666M15 4.166L17.5 6.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const RefreshIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 10C3.333 6.318 6.318 3.333 10 3.333C12.946 3.333 15.447 5.277 16.333 8M16.666 10C16.666 13.682 13.682 16.666 10 16.666C7.054 16.666 4.553 14.723 3.666 12M16.666 4.166V8H13.333M3.333 12H6.666V15.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const LoadingIcon = (props: IconProps) => (
  <Icon {...props} className={`animate-spin ${props.className || ""}`}>
    <path
      d="M10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

// ============================================
// OBJECT ICONS
// ============================================

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 10L10 3.333L16.666 10M5 8.333V15.833C5 16.293 5.373 16.666 5.833 16.666H8.333V12.5H11.666V16.666H14.166C14.626 16.666 15 16.293 15 15.833V8.333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const HomeFilledIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 10L10 3.333L16.666 10M5 8.333V15.833C5 16.293 5.373 16.666 5.833 16.666H8.333V12.5H11.666V16.666H14.166C14.626 16.666 15 16.293 15 15.833V8.333"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 5.833V10L12.5 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const PhoneIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5.833" y="2.5" width="8.333" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8.333 14.166H11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const CameraIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="5.833" width="15" height="10.833" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="11.25" r="2.917" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6.666 2.5L5 5.833H15L13.333 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const CameraOffIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M2.5 2.5L17.5 17.5M5.833 5.833H4.5C3.395 5.833 2.5 6.728 2.5 7.833V14.666C2.5 15.771 3.395 16.666 4.5 16.666H15.5C15.74 16.666 15.97 16.624 16.183 16.548M17.5 14.666V7.833C17.5 6.728 16.604 5.833 15.5 5.833H14.166"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ImageIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="4.166" width="15" height="11.666" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6.666" cy="7.5" r="1.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M2.5 13.333L6.666 9.166L10 12.5L13.333 9.166L17.5 13.333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const FolderIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M2.5 5.833C2.5 4.728 3.395 3.833 4.5 3.833H7.5L9.166 5.833H15.5C16.604 5.833 17.5 6.728 17.5 7.833V14.166C17.5 15.271 16.604 16.166 15.5 16.166H4.5C3.395 16.166 2.5 15.271 2.5 14.166V5.833Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const DocumentIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M11.666 2.5H5.833C4.728 2.5 3.833 3.395 3.833 4.5V15.5C3.833 16.604 4.728 17.5 5.833 17.5H14.166C15.271 17.5 16.166 16.604 16.166 15.5V7L11.666 2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M11.666 2.5V7H16.166" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const ChatIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 10C3.333 5.858 6.318 2.5 10 2.5C13.682 2.5 16.666 5.858 16.666 10C16.666 14.142 13.682 17.5 10 17.5C8.849 17.5 7.764 17.193 6.818 16.659L3.333 17.5L4.174 14.015C3.64 13.069 3.333 11.984 3.333 10.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const DollarIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 2.5V17.5M13.333 5.833H8.333C6.953 5.833 5.833 6.953 5.833 8.333C5.833 9.713 6.953 10.833 8.333 10.833H11.666C13.046 10.833 14.166 11.953 14.166 13.333C14.166 14.713 13.046 15.833 11.666 15.833H6.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const MegaphoneIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M16.666 3.333V13.333M16.666 3.333L5.833 6.666H3.333C2.873 6.666 2.5 7.039 2.5 7.5V9.166C2.5 9.626 2.873 10 3.333 10H5.833L16.666 13.333M5.833 10V15.833C5.833 16.293 6.206 16.666 6.666 16.666H7.5C7.96 16.666 8.333 16.293 8.333 15.833V11.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const BriefcaseIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="5.833" width="15" height="11.666" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M13.333 5.833V4.166C13.333 3.246 12.587 2.5 11.666 2.5H8.333C7.413 2.5 6.666 3.246 6.666 4.166V5.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const PinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 17.5V10.833M6.666 2.5L5 6.666C5 8.067 7.238 9.166 10 9.166C12.761 9.166 15 8.067 15 6.666L13.333 2.5H6.666Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const LockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4.166" y="8.333" width="11.666" height="9.166" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M6.666 8.333V5.833C6.666 3.992 8.159 2.5 10 2.5C11.84 2.5 13.333 3.992 13.333 5.833V8.333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const UnlockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4.166" y="8.333" width="11.666" height="9.166" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M6.666 8.333V5.833C6.666 3.992 8.159 2.5 10 2.5C11.84 2.5 13.333 3.992 13.333 5.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const WalletIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="4.166" width="15" height="11.666" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14.166 10H15.833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2.5 7.5H17.5" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const OldPhoneIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M4.166 3.333C4.166 2.873 4.539 2.5 5 2.5H6.666C7.126 2.5 7.5 2.873 7.5 3.333V5.833C7.5 6.293 7.126 6.666 6.666 6.666H5.833L5 8.333L8.333 11.666L10 10.833V10C10 9.54 10.373 9.166 10.833 9.166H13.333C13.793 9.166 14.166 9.54 14.166 10V11.666C14.166 15.348 11.181 18.333 7.5 18.333H4.166V3.333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ListIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M7.5 5H16.666M7.5 10H16.666M7.5 15H16.666M3.333 5H4.166M3.333 10H4.166M3.333 15H4.166"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const DesktopIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="3.333" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7.5 16.666H12.5M10 13.333V16.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const TabletIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4.166" y="2.5" width="11.666" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8.333 14.166H11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const TemplateIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="2.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 7.5H17.5M7.5 7.5V17.5" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const ColumnsIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="2.5" width="5" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="12.5" y="2.5" width="5" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const HeaderIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="2.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 7.5H17.5" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const TextIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M4.166 5H15.833M10 5V16.666M7.5 16.666H12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const RocketIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 14.166L5.833 10C5.833 10 6.666 3.333 10 3.333C13.333 3.333 14.166 10 14.166 10L10 14.166Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="7.5" r="1.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.833 14.166L3.333 16.666M14.166 14.166L16.666 16.666M10 14.166V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const FlagIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M4.166 17.5V2.5M4.166 12.5C4.166 12.5 5 11.666 7.5 11.666C10 11.666 11.666 13.333 14.166 13.333C16.666 13.333 17.5 12.5 17.5 12.5V2.5C17.5 2.5 16.666 3.333 14.166 3.333C11.666 3.333 10 1.666 7.5 1.666C5 1.666 4.166 2.5 4.166 2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// ============================================
// MENU ICONS
// ============================================

export const PeopleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 15C2.5 12.238 4.738 10 7.5 10C10.262 10 12.5 12.238 12.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="14.166" cy="6.666" r="2.083" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13.333 10.833C15.174 10.833 16.666 12.325 16.666 14.166" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const CarouselIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="4.166" width="10" height="11.666" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 6.666V13.333M17.5 6.666V13.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const GiftcardIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="5" width="15" height="11.666" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 5V16.666M2.5 10H17.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7.5 5C7.5 3.619 8.619 2.5 10 2.5C11.381 2.5 12.5 3.619 12.5 5" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const YardIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 17.5V10M10 10C10 7.238 7.761 5 5 5C5 7.762 7.238 10 10 10ZM10 10C10 7.238 12.238 5 15 5C15 7.762 12.761 10 10 10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const LampIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M7.5 17.5H12.5M10 15V17.5M6.666 15H13.333C13.333 15 15 12.5 15 10C15 6.666 12.761 4.166 10 4.166C7.238 4.166 5 6.666 5 10C5 12.5 6.666 15 6.666 15ZM10 4.166V2.5M5 5L3.75 3.75M15 5L16.25 3.75M2.5 10H3.333M16.666 10H17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const DiscountIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M17.5 10L10 2.5L2.5 10L10 17.5L17.5 10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="8.333" r="1.25" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12.5" cy="11.666" r="1.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13.333 6.666L6.666 13.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const CommandIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="2.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6.666 10H13.333M10 6.666V13.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const EmailIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="4.166" width="15" height="11.666" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 6.666L10 11.666L17.5 6.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const StoreIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 8.333V16.666C3.333 17.126 3.706 17.5 4.166 17.5H15.833C16.293 17.5 16.666 17.126 16.666 16.666V8.333M2.5 8.333L4.166 2.5H15.833L17.5 8.333M10 8.333V2.5M5.833 8.333C5.833 9.713 6.953 10.833 8.333 10.833C9.713 10.833 10.833 9.713 10.833 8.333M10.833 8.333C10.833 9.713 11.953 10.833 13.333 10.833C14.713 10.833 15.833 9.713 15.833 8.333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const PiggyIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M16.666 10C16.666 6.318 13.682 3.333 10 3.333C6.318 3.333 3.333 6.318 3.333 10C3.333 13.682 6.318 16.666 10 16.666M12.5 7.5H13.333M6.666 8.333C6.666 8.333 7.5 7.5 8.333 7.5M10 16.666C10 16.666 15 16.666 16.666 15M2.5 9.166L3.333 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ServerIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.333" y="2.5" width="13.333" height="6.666" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3.333" y="10.833" width="13.333" height="6.666" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6.666" cy="5.833" r="0.833" fill="currentColor" />
    <circle cx="6.666" cy="14.166" r="0.833" fill="currentColor" />
  </Icon>
);

export const GlobeIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 10H17.5M10 2.5C12.5 5 13.333 7.5 13.333 10C13.333 12.5 12.5 15 10 17.5M10 2.5C7.5 5 6.666 7.5 6.666 10C6.666 12.5 7.5 15 10 17.5" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const FireIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 17.5C13.333 17.5 16.666 14.166 16.666 10.833C16.666 5.833 10 2.5 10 2.5C10 2.5 10 6.666 7.5 8.333C5 10 3.333 11.666 3.333 13.333C3.333 15 4.166 17.5 10 17.5ZM10 17.5C8.333 17.5 6.666 16.666 6.666 15C6.666 13.333 8.333 12.5 10 12.5C11.666 12.5 12.5 13.333 12.5 14.166"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// ============================================
// TOGGLE ICONS
// ============================================

export const BellOffIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M2.5 2.5L17.5 17.5M8.333 15.833C8.333 16.753 9.08 17.5 10 17.5C10.92 17.5 11.666 16.753 11.666 15.833M15 10.833C15 7.612 12.761 5 10 5C9.166 5 8.375 5.226 7.666 5.625M4.166 15.833H15.833C15.833 15.833 15 14.166 15 10.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="3.333" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 2.5V4.166M10 15.833V17.5M2.5 10H4.166M15.833 10H17.5M4.697 4.697L5.875 5.875M14.125 14.125L15.303 15.303M4.697 15.303L5.875 14.125M14.125 5.875L15.303 4.697"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M17.5 10.833C17.5 14.976 14.143 18.333 10 18.333C5.857 18.333 2.5 14.976 2.5 10.833C2.5 6.69 5.857 3.333 10 3.333C10 6.666 12.5 10 17.5 10.833Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const FullScreenIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 7.5V4.166C3.333 3.706 3.706 3.333 4.166 3.333H7.5M12.5 3.333H15.833C16.293 3.333 16.666 3.706 16.666 4.166V7.5M16.666 12.5V15.833C16.666 16.293 16.293 16.666 15.833 16.666H12.5M7.5 16.666H4.166C3.706 16.666 3.333 16.293 3.333 15.833V12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const SmallScreenIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M7.5 3.333V6.666C7.5 7.126 7.126 7.5 6.666 7.5H3.333M16.666 7.5H13.333C12.873 7.5 12.5 7.126 12.5 6.666V3.333M12.5 16.666V13.333C12.5 12.873 12.873 12.5 13.333 12.5H16.666M3.333 12.5H6.666C7.126 12.5 7.5 12.873 7.5 13.333V16.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const SoundOnIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 7.5H6.666L10.833 3.333V16.666L6.666 12.5H3.333V7.5ZM14.166 6.666C15.476 7.976 15.833 9.166 15.833 10C15.833 10.833 15.476 12.024 14.166 13.333M12.5 8.333C13.333 9.166 13.333 10 13.333 10C13.333 10.833 12.5 11.666 12.5 11.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const SoundOffIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 7.5H6.666L10.833 3.333V16.666L6.666 12.5H3.333V7.5ZM13.333 8.333L17.5 12.5M17.5 8.333L13.333 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// ============================================
// ACTION ICONS (ADDITIONAL)
// ============================================

export const MinusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M4 10H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const PlayIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5 4.166V15.833L15.833 10L5 4.166Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const PauseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M6.666 4.166V15.833M13.333 4.166V15.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Icon>
);

export const StopIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4.166" y="4.166" width="11.666" height="11.666" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const SaveIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M15.833 17.5H4.166C3.706 17.5 3.333 17.126 3.333 16.666V3.333C3.333 2.873 3.706 2.5 4.166 2.5H13.333L16.666 5.833V16.666C16.666 17.126 16.293 17.5 15.833 17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6.666 2.5V6.666H12.5V2.5M6.666 17.5V11.666H13.333V17.5" stroke="currentColor" strokeWidth="1.5" />
  </Icon>
);

export const CompareIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 2.5V17.5M3.333 6.666L6.666 3.333L10 6.666M16.666 13.333L13.333 16.666L10 13.333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const LinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M8.333 11.666C9.166 12.5 10.833 13.333 12.5 11.666L15 9.166C16.666 7.5 15.833 5 14.166 3.333C12.5 1.666 10 0.833 8.333 2.5L6.666 4.166M11.666 8.333C10.833 7.5 9.166 6.666 7.5 8.333L5 10.833C3.333 12.5 4.166 15 5.833 16.666C7.5 18.333 10 19.166 11.666 17.5L13.333 15.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const LinkSlashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M2.5 2.5L17.5 17.5M8.333 11.666C8.905 12.238 9.619 12.619 10.357 12.809M11.666 8.333C11.095 7.762 10.381 7.381 9.643 7.191M15 9.166C16.666 7.5 15.833 5 14.166 3.333C12.5 1.666 10 0.833 8.333 2.5L7.5 3.333M5 10.833C3.333 12.5 4.166 15 5.833 16.666C7.5 18.333 10 19.166 11.666 17.5L12.5 16.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const BlockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4.697 15.303L15.303 4.697" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

export const TranslateIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M2.5 4.166H10.833M6.666 2.5V4.166M8.333 4.166C8.333 7.5 5.833 10.833 2.5 12.5M4.166 8.333C5.416 9.583 7.083 10.416 8.75 10.833M10 17.5L13.333 10L16.666 17.5M11.25 15H15.416"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const PriorityIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 2.5V10M10 17.5V14.166"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path d="M5 7.5L10 2.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const UpdateIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M16.666 10C16.666 13.682 13.682 16.666 10 16.666C6.318 16.666 3.333 13.682 3.333 10C3.333 6.318 6.318 3.333 10 3.333M10 3.333V7.5M10 3.333L6.666 6.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ExternalLinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M15 10.833V15.833C15 16.293 14.626 16.666 14.166 16.666H4.166C3.706 16.666 3.333 16.293 3.333 15.833V5.833C3.333 5.373 3.706 5 4.166 5H9.166M12.5 3.333H16.666V7.5M7.5 12.5L16.666 3.333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ExportIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 12.5V2.5M10 2.5L13.333 5.833M10 2.5L6.666 5.833M3.333 12.5V15.833C3.333 16.293 3.706 16.666 4.166 16.666H15.833C16.293 16.666 16.666 16.293 16.666 15.833V12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ForwardIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12.5 5L17.5 10L12.5 15M17.5 10H7.5C5.119 10 3.333 11.786 3.333 14.166V15.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// ============================================
// ARROW ICONS (ADDITIONAL)
// ============================================

export const CaretUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M6.666 12.5L10 8.333L13.333 12.5"
      fill="currentColor"
    />
  </Icon>
);

export const CaretDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M6.666 7.5L10 11.666L13.333 7.5"
      fill="currentColor"
    />
  </Icon>
);

export const CaretLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12.5 6.666L8.333 10L12.5 13.333"
      fill="currentColor"
    />
  </Icon>
);

export const CaretRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M7.5 6.666L11.666 10L7.5 13.333"
      fill="currentColor"
    />
  </Icon>
);

export const ChevronDoubleUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5 11.666L10 6.666L15 11.666M5 15L10 10L15 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ChevronDoubleDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5 5L10 10L15 5M5 8.333L10 13.333L15 8.333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ChevronDoubleLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M11.666 5L6.666 10L11.666 15M15 5L10 10L15 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ChevronDoubleRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5 5L10 10L5 15M8.333 5L13.333 10L8.333 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ArrowUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 15.833V4.166M10 4.166L5 9.166M10 4.166L15 9.166"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ArrowDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M10 4.166V15.833M10 15.833L5 10.833M10 15.833L15 10.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5.833 14.166L14.166 5.833M14.166 5.833H7.5M14.166 5.833V12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ArrowDownRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M5.833 5.833L14.166 14.166M14.166 14.166H7.5M14.166 14.166V7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ArrowUpLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M14.166 14.166L5.833 5.833M5.833 5.833H12.5M5.833 5.833V12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ArrowDownLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M14.166 5.833L5.833 14.166M5.833 14.166H12.5M5.833 14.166V7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// ============================================
// OTHER ICONS
// ============================================

export const CoinIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 5.833V14.166M7.5 8.333H11.666C12.586 8.333 13.333 9.08 13.333 10C13.333 10.92 12.586 11.666 11.666 11.666H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const DiamondIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3.333 7.5L10 17.5L16.666 7.5L13.333 2.5H6.666L3.333 7.5ZM3.333 7.5H16.666M10 17.5L7.5 7.5L10 2.5L12.5 7.5L10 17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const EmojiIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6.666 11.666C6.666 11.666 7.916 13.333 10 13.333C12.083 13.333 13.333 11.666 13.333 11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="7.5" cy="7.5" r="0.833" fill="currentColor" />
    <circle cx="12.5" cy="7.5" r="0.833" fill="currentColor" />
  </Icon>
);

export const DragIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M7.5 4.166V4.174M7.5 10V10.008M7.5 15.833V15.841M12.5 4.166V4.174M12.5 10V10.008M12.5 15.833V15.841"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Icon>
);
