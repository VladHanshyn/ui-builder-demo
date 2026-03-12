"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Button, 
  ButtonWithPlusIcon, 
  PlusIcon,
  IconButton,
  ButtonGroup,
  ButtonGroupItem,
  ButtonBar,
  ButtonBarItem,
  Chip,
  ChipGroup,
  RemovableChip,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Toggle,
  Avatar,
  AvatarGroup,
  Tooltip,
  SimpleTooltip,
  Notification,
  Input,
  Textarea,
  SearchInput,
  PasswordInput,
  SelectInput,
  List,
  ListItem,
  ListCheckbox,
  ListAvatar,
  ListIcon,
  ListIconGroup,
  ListBadge,
  ListValue,
  ListActionButton,
  ListActionGroup,
  ListLinkIcon,
  Select,
  DatePicker,
  DatePickerInput,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarSubmenu,
  SidebarSubmenuItem,
  SidebarFooter,
  SidebarBackLink,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalFooterSeparated,
  ConfirmModal,
  Popup,
  AlertPopup,
  Input as InputComponent,
} from "@/components";

// Import all icons for display
import {
  // Action Icons
  EditIcon as EditIconLib,
  TrashIcon as TrashIconLib,
  CopyIcon as CopyIconLib,
  EyeIcon as EyeIconLib,
  EyeOffIcon,
  SearchIcon,
  SettingsIcon,
  MenuIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  StarIcon as StarIconLib,
  StarFilledIcon,
  HeartIcon,
  TagIcon as TagIconLib,
  ChartIcon as ChartIconLib,
  CalendarIcon,
  UserIcon,
  UsersIcon,
  BellIcon,
  DownloadIcon,
  UploadIcon,
  FilterIcon,
  SortIcon,
  RefreshIcon,
  LoadingIcon,
  CheckIcon,
  CloseIcon,
  InfoIcon,
  WarningIcon,
  ErrorIcon,
  SuccessIcon,
  // Navigation
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  // Objects
  HomeIcon,
  HomeFilledIcon,
  ClockIcon,
  PhoneIcon,
  CameraIcon,
  CameraOffIcon,
  ImageIcon,
  FolderIcon,
  DocumentIcon,
  ChatIcon,
  DollarIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  PinIcon,
  LockIcon,
  UnlockIcon,
  WalletIcon,
  OldPhoneIcon,
  ListIcon as ListIconLib,
  DesktopIcon,
  TabletIcon,
  TemplateIcon,
  ColumnsIcon,
  HeaderIcon,
  TextIcon,
  RocketIcon,
  FlagIcon,
  // Menu
  PeopleIcon,
  CarouselIcon,
  GiftcardIcon,
  YardIcon,
  LampIcon,
  DiscountIcon,
  CommandIcon,
  EmailIcon,
  StoreIcon,
  PiggyIcon,
  ServerIcon,
  GlobeIcon,
  FireIcon,
  // Toggle
  BellOffIcon,
  SunIcon,
  MoonIcon,
  FullScreenIcon,
  SmallScreenIcon,
  SoundOnIcon,
  SoundOffIcon,
  // Actions Additional
  MinusIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  SaveIcon,
  CompareIcon,
  LinkIcon,
  LinkSlashIcon,
  BlockIcon,
  TranslateIcon,
  PriorityIcon,
  UpdateIcon,
  ExternalLinkIcon,
  ExportIcon,
  ForwardIcon,
  // Arrows
  CaretUpIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChevronDoubleUpIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ArrowUpLeftIcon,
  ArrowDownLeftIcon,
  // Other
  CoinIcon,
  DiamondIcon,
  EmojiIcon,
  DragIcon,
} from "@/components/icons";

// ============================================
// ICONS FOR ACTION BUTTONS
// ============================================

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.166 2.5L17.5 5.833M2.5 17.5L3.333 14.166L13.333 4.166L16.666 7.5L6.666 17.5H2.5V17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4.166C3.75 4.166 1.25 10 1.25 10C1.25 10 3.75 15.833 10 15.833C16.25 15.833 18.75 10 18.75 10C18.75 10 16.25 4.166 10 4.166Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6.666" y="6.666" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M13.333 6.666V5C13.333 3.895 12.438 3 11.333 3H5C3.895 3 3 3.895 3 5V11.333C3 12.438 3.895 13.333 5 13.333H6.666" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.333 5.833H16.666M8.333 9.166V14.166M11.666 9.166V14.166M4.166 5.833L5 15.833C5 16.938 5.895 17.5 7 17.5H13C14.104 17.5 15 16.938 15 15.833L15.833 5.833M7.5 5.833V3.333C7.5 2.873 7.873 2.5 8.333 2.5H11.666C12.126 2.5 12.5 2.873 12.5 3.333V5.833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.333 16.666V8.333M8.333 16.666V3.333M13.333 16.666V10M18.333 16.666V6.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2.5L12.09 6.74L16.86 7.44L13.43 10.77L14.18 15.52L10 13.27L5.82 15.52L6.57 10.77L3.14 7.44L7.91 6.74L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 10.585V3.335C17.5 2.875 17.125 2.5 16.665 2.5H9.415C9.19 2.5 8.97 2.59 8.81 2.75L2.75 8.81C2.43 9.13 2.43 9.62 2.75 9.94L9.06 16.25C9.38 16.57 9.87 16.57 10.19 16.25L16.25 10.19C16.41 10.03 16.5 9.81 16.5 9.585" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="13" cy="7" r="1" fill="currentColor"/>
  </svg>
);

const CheckIconSmall = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIconSmall = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.166 2.5L17.5 5.833M2.5 17.5L3.333 14.166L13.333 4.166L16.666 7.5L6.666 17.5H2.5V17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIconSmall = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.333 5.833H16.666M8.333 9.166V14.166M11.666 9.166V14.166M4.166 5.833L5 15.833C5 16.938 5.895 17.5 7 17.5H13C14.104 17.5 15 16.938 15 15.833L15.833 5.833M7.5 5.833V3.333C7.5 2.873 7.873 2.5 8.333 2.5H11.666C12.126 2.5 12.5 2.873 12.5 3.333V5.833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================
// DEMO COMPONENTS
// ============================================

function RadioGroupDemo({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const [value, setValue] = useState("option1");
  
  return (
    <RadioGroup
      name={`demo-${orientation}`}
      value={value}
      onValueChange={setValue}
      label={orientation === "vertical" ? "Vertical (default)" : "Horizontal"}
      orientation={orientation}
    >
      <Radio value="option1" label="Option 1" />
      <Radio value="option2" label="Option 2" />
      <Radio value="option3" label="Option 3" />
    </RadioGroup>
  );
}

// Modal Section Demo Component
function ModalSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  return (
    <section className="space-y-6">
      <h2 className="text-headline-1 text-primary">Modal & Popup</h2>
      <p className="text-paragraph-2 text-secondary">
        Modal dialogs and popup confirmation windows for user actions.
      </p>

      <div className="flex flex-wrap gap-8">
        {/* Large Modal (Confirmation) */}
        <div className="space-y-4">
          <h3 className="text-headline-3 text-secondary">Large Modal (Confirmation)</h3>
          <button
            onClick={() => setIsConfirmOpen(true)}
            className="px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white text-headline-4"
          >
            Open Confirm Modal
          </button>
          <ConfirmModal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={() => {
              alert("Confirmed!");
              setIsConfirmOpen(false);
            }}
            title="Duplicate Campaign?"
            description="You are about to duplicate Campaign Title 1. Configuration will be the same, but you can change it later."
            confirmText="Duplicate Campaign"
            cancelText="Cancel"
          >
            <div className="mt-2">
              <InputComponent
                label="Campaign Name"
                placeholder="Campaign Title 1 (Copy)"
                defaultValue="Campaign Title 1 (Copy)"
              />
            </div>
          </ConfirmModal>
        </div>

        {/* Custom Modal */}
        <div className="space-y-4">
          <h3 className="text-headline-3 text-secondary">Custom Modal</h3>
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white text-headline-4"
          >
            Open Custom Modal
          </button>
          <Modal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)}>
            <ModalContent>
              <ModalHeader>Connect with Localise!</ModalHeader>
              <ModalBody>
                Enter Gift ID to add Custom Gift to the User&apos;s Custom Gifts bucket in Gifts Row on Screen.
              </ModalBody>
              <div className="mt-2">
                <InputComponent
                  label="Localization Key"
                  placeholder="Enter localization key..."
                  defaultValue="kajhvahjsdlv-84713jkhavfjkv-bhavdjs"
                />
              </div>
            </ModalContent>
            <ModalFooterSeparated align="between">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-1 rounded-lg text-headline-4 bg-[var(--color-base-surface-primary)] border border-[var(--color-base-stroke)] text-[var(--color-base-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("Saved!");
                  setIsCustomModalOpen(false);
                }}
                className="px-4 py-1 rounded-lg text-headline-4 bg-[var(--color-brand-primary)] text-white flex items-center gap-1"
              >
                <CheckIcon className="size-5" />
                Save Changes
              </button>
            </ModalFooterSeparated>
          </Modal>
        </div>

        {/* Small Popup */}
        <div className="space-y-4">
          <h3 className="text-headline-3 text-secondary">Popup (Small Confirmation)</h3>
          <button
            onClick={() => setIsPopupOpen(true)}
            className="px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white text-headline-4"
          >
            Open Popup
          </button>
          <Popup
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            onConfirm={() => {
              alert("Applied!");
              setIsPopupOpen(false);
            }}
            title="Apply changes?"
            description="Are you sure you want to apply changes? It will affect users in Audience of this Campaign."
            confirmText="Apply"
            cancelText="Cancel"
          />
        </div>

        {/* Inline Alert Popup */}
        <div className="space-y-4">
          <h3 className="text-headline-3 text-secondary">Alert Popup (Inline)</h3>
          <AlertPopup
            title="Set default gifts?"
            description="Are you sure you want to set Default gifts? This action can not be undone."
            confirmText="Set"
            cancelText="Cancel"
            onConfirm={() => alert("Set!")}
            onCancel={() => alert("Cancelled!")}
          />
        </div>

        {/* Danger Variant */}
        <div className="space-y-4">
          <h3 className="text-headline-3 text-secondary">Danger Variant</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[var(--color-system-error)] text-white text-headline-4"
          >
            Open Danger Modal
          </button>
          <ConfirmModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => {
              alert("Deleted!");
              setIsModalOpen(false);
            }}
            title="Delete Item?"
            description="Are you sure you want to delete this item? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
          />
        </div>
      </div>
    </section>
  );
}

// Navigation Icons
const AgentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L2 6L10 10L18 6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 14L10 18L18 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10L10 14L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6L2 10L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 6L18 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 4L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ComponentsNavIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ThemeSunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.657 4.343L14.243 5.757M5.757 14.243L4.343 15.657M15.657 15.657L14.243 14.243M5.757 5.757L4.343 4.343" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ThemeMoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PhoenixIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2C6 2 3 5 3 9C3 11 4 13 6 14L5 18L10 16L15 18L14 14C16 13 17 11 17 9C17 5 14 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="8" r="1" fill="currentColor"/>
    <circle cx="13" cy="8" r="1" fill="currentColor"/>
    <path d="M8 11C8 11 9 12 10 12C11 12 12 11 12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const apps = [
    { id: "ui-builder", name: "UI Builder", icon: <AgentIcon />, active: false, href: "/" },
    { id: "phoenix", name: "Phoenix", icon: <PhoenixIcon />, active: false, href: "/phoenix" },
    { id: "components", name: "Components", icon: <ComponentsNavIcon />, active: true, href: "/components" },
  ];

  const currentApp = apps.find(app => app.active) || apps[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-base-surface-secondary)] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)]/10 flex items-center justify-center text-[var(--color-brand-primary)]">
          {currentApp.icon}
        </div>
        <span className="font-semibold text-[var(--color-base-primary)]">{currentApp.name}</span>
        <ChevronDownIcon />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[240px] bg-[var(--color-base-surface-primary)] border border-[var(--color-base-stroke)] rounded-xl shadow-lg overflow-hidden z-50">
          {apps.map((app) => (
            <a
              key={app.id}
              href={app.href}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                app.active
                  ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                  : "text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)]"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                app.active
                  ? "bg-[var(--color-brand-primary)] text-white"
                  : "bg-[var(--color-base-surface-secondary)] text-[var(--color-base-secondary)]"
              }`}>
                {app.icon}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{app.name}</span>
                {app.active && <p className="text-xs opacity-70">Current</p>}
              </div>
              {app.active && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </a>
          ))}
          <div className="px-3 py-2 border-t border-[var(--color-base-stroke)]">
            <p className="text-xs text-[var(--color-base-tertiary)]">Switch between applications</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Theme hook
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return { theme, toggleTheme };
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="flex flex-col h-screen bg-[var(--color-base-surface-secondary)]">
      {/* Header - Top Priority */}
      <header className="h-14 flex-shrink-0 border-b border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] flex items-center justify-between px-6">
        {/* Left: App Switcher */}
        <div className="flex items-center gap-3">
          <AppSwitcher />
          <span className="px-2 py-0.5 text-xs bg-[var(--color-base-surface-secondary)] text-[var(--color-base-secondary)] rounded">
            Design System
          </span>
        </div>

        {/* Right: Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <ThemeMoonIcon /> : <ThemeSunIcon />}
        </button>
      </header>

      {/* Main Layout - Below Header */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar defaultActiveItem="components">
          <SidebarGroup>
            <SidebarItem id="agent" icon={<AgentIcon />} label="UI Builder" href="/" />
            <SidebarItem id="components" icon={<ComponentsNavIcon />} label="Components" href="/components" />
          </SidebarGroup>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8 bg-[var(--color-base-surface-primary)]">
          <div className="max-w-4xl mx-auto space-y-12">

        {/* Button Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Button</h2>
          
          {/* Primary Buttons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Primary</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Default</Button>
              <ButtonWithPlusIcon variant="primary">With Icon</ButtonWithPlusIcon>
              <Button variant="primary" leftIcon={<PlusIcon />}>Left Icon</Button>
              <Button variant="primary" isLoading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>

          {/* Secondary Buttons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Secondary</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary">Default</Button>
              <ButtonWithPlusIcon variant="secondary">With Icon</ButtonWithPlusIcon>
              <Button variant="secondary" leftIcon={<PlusIcon />}>Left Icon</Button>
              <Button variant="secondary" isLoading>Loading</Button>
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
          </div>

          {/* Full Width */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Full Width</h3>
            <div className="max-w-sm space-y-3">
              <Button variant="primary" fullWidth>Primary Full Width</Button>
              <Button variant="secondary" fullWidth>Secondary Full Width</Button>
            </div>
          </div>
        </section>

        {/* Action Button */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Action Button</h2>
          <p className="text-paragraph-2 text-secondary">
            Icon-only buttons for actions like add, edit, delete. 32x32px with optional notification badge.
          </p>
          
          {/* States */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">States</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <IconButton icon={<PlusIcon />} aria-label="Add" />
                <span className="text-label-tiny text-secondary">Default</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <IconButton icon={<EditIcon />} aria-label="Edit" />
                <span className="text-label-tiny text-secondary">Edit</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <IconButton icon={<EyeIcon />} aria-label="View" />
                <span className="text-label-tiny text-secondary">View</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <IconButton icon={<TrashIcon />} aria-label="Delete" />
                <span className="text-label-tiny text-secondary">Delete</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <IconButton icon={<PlusIcon />} aria-label="Add" disabled />
                <span className="text-label-tiny text-secondary">Disabled</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <IconButton icon={<PlusIcon />} aria-label="Loading" isLoading />
                <span className="text-label-tiny text-secondary">Loading</span>
              </div>
            </div>
          </div>

          {/* With Badge */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Notification Badge</h3>
            <div className="flex flex-wrap items-center gap-4">
              <IconButton icon={<PlusIcon />} aria-label="Notifications" badge={3} />
              <IconButton icon={<PlusIcon />} aria-label="Notifications" badge={9} />
              <IconButton icon={<PlusIcon />} aria-label="Notifications" badge={99} />
              <IconButton icon={<PlusIcon />} aria-label="Notifications" badge={150} />
            </div>
          </div>
        </section>

        {/* Action Group */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Action Group</h2>
          <p className="text-paragraph-2 text-secondary">
            Connected icon buttons with shared borders. Perfect for related actions like edit, view, copy, delete.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Examples</h3>
            <div className="flex flex-wrap items-center gap-6">
              {/* 4 buttons */}
              <div className="flex flex-col items-start gap-2">
                <ButtonGroup>
                  <ButtonGroupItem icon={<EditIcon />} aria-label="Edit" />
                  <ButtonGroupItem icon={<EyeIcon />} aria-label="View" />
                  <ButtonGroupItem icon={<CopyIcon />} aria-label="Copy" />
                  <ButtonGroupItem icon={<TrashIcon />} aria-label="Delete" />
                </ButtonGroup>
                <span className="text-label-tiny text-secondary">4 actions</span>
              </div>

              {/* 3 buttons */}
              <div className="flex flex-col items-start gap-2">
                <ButtonGroup>
                  <ButtonGroupItem icon={<EditIcon />} aria-label="Edit" />
                  <ButtonGroupItem icon={<EyeIcon />} aria-label="View" />
                  <ButtonGroupItem icon={<TrashIcon />} aria-label="Delete" />
                </ButtonGroup>
                <span className="text-label-tiny text-secondary">3 actions</span>
              </div>

              {/* 2 buttons */}
              <div className="flex flex-col items-start gap-2">
                <ButtonGroup>
                  <ButtonGroupItem icon={<EditIcon />} aria-label="Edit" />
                  <ButtonGroupItem icon={<TrashIcon />} aria-label="Delete" />
                </ButtonGroup>
                <span className="text-label-tiny text-secondary">2 actions</span>
              </div>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Action Bar</h2>
          <p className="text-paragraph-2 text-secondary">
            Spaced icon buttons with a 4px gap. Each button is independent with full rounded corners.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Examples</h3>
            <div className="flex flex-wrap items-center gap-6">
              {/* 4 buttons */}
              <div className="flex flex-col items-start gap-2">
                <ButtonBar>
                  <ButtonBarItem icon={<CopyIcon />} aria-label="Copy" />
                  <ButtonBarItem icon={<ChartIcon />} aria-label="Analytics" />
                  <ButtonBarItem icon={<EditIcon />} aria-label="Edit" />
                  <ButtonBarItem icon={<TrashIcon />} aria-label="Delete" />
                </ButtonBar>
                <span className="text-label-tiny text-secondary">4 actions</span>
              </div>

              {/* 3 buttons */}
              <div className="flex flex-col items-start gap-2">
                <ButtonBar>
                  <ButtonBarItem icon={<EditIcon />} aria-label="Edit" />
                  <ButtonBarItem icon={<EyeIcon />} aria-label="View" />
                  <ButtonBarItem icon={<TrashIcon />} aria-label="Delete" />
                </ButtonBar>
                <span className="text-label-tiny text-secondary">3 actions</span>
              </div>

              {/* 2 buttons */}
              <div className="flex flex-col items-start gap-2">
                <ButtonBar>
                  <ButtonBarItem icon={<CopyIcon />} aria-label="Copy" />
                  <ButtonBarItem icon={<TrashIcon />} aria-label="Delete" />
                </ButtonBar>
                <span className="text-label-tiny text-secondary">2 actions</span>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Group vs Bar Comparison</h3>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex flex-col items-start gap-2">
                <ButtonGroup>
                  <ButtonGroupItem icon={<EditIcon />} aria-label="Edit" />
                  <ButtonGroupItem icon={<EyeIcon />} aria-label="View" />
                  <ButtonGroupItem icon={<CopyIcon />} aria-label="Copy" />
                  <ButtonGroupItem icon={<TrashIcon />} aria-label="Delete" />
                </ButtonGroup>
                <span className="text-label-tiny text-secondary">Action Group (connected)</span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <ButtonBar>
                  <ButtonBarItem icon={<EditIcon />} aria-label="Edit" />
                  <ButtonBarItem icon={<EyeIcon />} aria-label="View" />
                  <ButtonBarItem icon={<CopyIcon />} aria-label="Copy" />
                  <ButtonBarItem icon={<TrashIcon />} aria-label="Delete" />
                </ButtonBar>
                <span className="text-label-tiny text-secondary">Action Bar (spaced)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chip Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Chip</h2>
          <p className="text-paragraph-2 text-secondary">
            Chips help make selections, filter content, or trigger actions. Available in filled and outlined variants with default and selected states.
          </p>
          
          {/* Filled Variant */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Filled</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <Chip variant="filled">Default</Chip>
                <span className="text-label-tiny text-secondary">Default</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Chip variant="filled" selected>Selected</Chip>
                <span className="text-label-tiny text-secondary">Selected</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Chip variant="filled" disabled>Disabled</Chip>
                <span className="text-label-tiny text-secondary">Disabled</span>
              </div>
            </div>
          </div>

          {/* Outlined Variant */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Outlined</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <Chip variant="outlined">Default</Chip>
                <span className="text-label-tiny text-secondary">Default</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Chip variant="outlined" selected>Selected</Chip>
                <span className="text-label-tiny text-secondary">Selected</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Chip variant="outlined" disabled>Disabled</Chip>
                <span className="text-label-tiny text-secondary">Disabled</span>
              </div>
            </div>
          </div>

          {/* With Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Icons</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Chip variant="filled" leftIcon={<StarIcon />}>Featured</Chip>
              <Chip variant="filled" leftIcon={<StarIcon />} selected>Featured</Chip>
              <Chip variant="outlined" leftIcon={<TagIcon />}>Category</Chip>
              <Chip variant="outlined" leftIcon={<TagIcon />} selected>Category</Chip>
            </div>
          </div>

          {/* With Badge */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Badge</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Chip variant="filled" badge={5}>Messages</Chip>
              <Chip variant="filled" badge={12} selected>Notifications</Chip>
              <Chip variant="outlined" badge={3}>Updates</Chip>
              <Chip variant="outlined" badge={99}>Items</Chip>
            </div>
          </div>

          {/* Interactive (Clickable) */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Interactive</h3>
            <p className="text-paragraph-3 text-secondary">Click the chips to toggle selection</p>
            <ChipGroup>
              <Chip variant="filled" onClick={() => {}}>Clickable</Chip>
              <Chip variant="filled" selected onClick={() => {}}>Active</Chip>
              <Chip variant="outlined" onClick={() => {}}>Option A</Chip>
              <Chip variant="outlined" onClick={() => {}}>Option B</Chip>
            </ChipGroup>
          </div>

          {/* Removable Chips */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Removable</h3>
            <p className="text-paragraph-3 text-secondary">Chips with a close button for tag-like behavior</p>
            <ChipGroup>
              <RemovableChip variant="filled" onRemove={() => {}}>React</RemovableChip>
              <RemovableChip variant="filled" onRemove={() => {}}>TypeScript</RemovableChip>
              <RemovableChip variant="filled" onRemove={() => {}}>Next.js</RemovableChip>
              <RemovableChip variant="outlined" onRemove={() => {}}>Tailwind</RemovableChip>
            </ChipGroup>
          </div>

          {/* Chip Group */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Chip Group</h3>
            <p className="text-paragraph-3 text-secondary">Filter chips for selecting categories</p>
            <ChipGroup gap="md">
              <Chip variant="filled" selected>All</Chip>
              <Chip variant="filled">Active</Chip>
              <Chip variant="filled">Pending</Chip>
              <Chip variant="filled">Completed</Chip>
              <Chip variant="filled">Archived</Chip>
            </ChipGroup>
          </div>
        </section>

        {/* Checkbox Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Checkbox</h2>
          <p className="text-paragraph-2 text-secondary">
            Checkboxes allow users to select one or more items from a set. They have enabled/disabled and checked/unchecked states.
          </p>
          
          {/* States */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">States</h3>
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-label-tiny text-secondary">Enabled</span>
                <Checkbox label="Unchecked" />
                <Checkbox label="Checked" defaultChecked />
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-label-tiny text-secondary">Disabled</span>
                <Checkbox label="Unchecked" disabled />
                <Checkbox label="Checked" disabled defaultChecked />
              </div>
            </div>
          </div>

          {/* Checkbox Group */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Checkbox Group</h3>
            <div className="flex flex-wrap gap-8">
              <CheckboxGroup label="Vertical (default)">
                <Checkbox label="Option 1" defaultChecked />
                <Checkbox label="Option 2" />
                <Checkbox label="Option 3" />
              </CheckboxGroup>
              <CheckboxGroup label="Horizontal" orientation="horizontal">
                <Checkbox label="Small" />
                <Checkbox label="Medium" defaultChecked />
                <Checkbox label="Large" />
              </CheckboxGroup>
            </div>
          </div>

          {/* Without Label */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Without Label</h3>
            <div className="flex items-center gap-4">
              <Checkbox hideLabel aria-label="Select item 1" />
              <Checkbox hideLabel aria-label="Select item 2" defaultChecked />
              <Checkbox hideLabel aria-label="Select item 3" disabled />
            </div>
          </div>
        </section>

        {/* Radio Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Radiobutton</h2>
          <p className="text-paragraph-2 text-secondary">
            Radio buttons allow users to select a single option from a set. They should be used within a RadioGroup.
          </p>
          
          {/* States */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">States</h3>
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-label-tiny text-secondary">Enabled</span>
                <Radio name="demo-enabled" value="1" label="Unselected" />
                <Radio name="demo-enabled-2" value="1" label="Selected" defaultChecked />
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-label-tiny text-secondary">Disabled</span>
                <Radio name="demo-disabled" value="1" label="Unselected" disabled />
                <Radio name="demo-disabled-2" value="1" label="Selected" disabled defaultChecked />
              </div>
            </div>
          </div>

          {/* Radio Group */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Radio Group</h3>
            <div className="flex flex-wrap gap-8">
              <RadioGroupDemo orientation="vertical" />
              <RadioGroupDemo orientation="horizontal" />
            </div>
          </div>

          {/* Without Label */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Without Label</h3>
            <div className="flex items-center gap-4">
              <Radio name="no-label" value="1" hideLabel aria-label="Option 1" />
              <Radio name="no-label" value="2" hideLabel aria-label="Option 2" defaultChecked />
              <Radio name="no-label-disabled" value="1" hideLabel aria-label="Option 3" disabled />
            </div>
          </div>
        </section>

        {/* Toggle Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Toggle</h2>
          <p className="text-paragraph-2 text-secondary">
            Toggle switches allow users to turn an option on or off. They have enabled/disabled and on/off states.
          </p>
          
          {/* States */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">States</h3>
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-label-tiny text-secondary">Enabled</span>
                <Toggle label="Off" />
                <Toggle label="On" defaultChecked />
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-label-tiny text-secondary">Disabled</span>
                <Toggle label="Off" disabled />
                <Toggle label="On" disabled defaultChecked />
              </div>
            </div>
          </div>

          {/* Without Label */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Without Label</h3>
            <div className="flex items-center gap-4">
              <Toggle hideLabel aria-label="Toggle option 1" />
              <Toggle hideLabel aria-label="Toggle option 2" defaultChecked />
              <Toggle hideLabel aria-label="Toggle option 3" disabled />
              <Toggle hideLabel aria-label="Toggle option 4" disabled defaultChecked />
            </div>
          </div>

          {/* Use Cases */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Common Use Cases</h3>
            <div className="space-y-3 max-w-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-base-surface-secondary)]">
                <span className="text-sm font-medium text-[var(--color-base-primary)]">Dark Mode</span>
                <Toggle hideLabel aria-label="Toggle dark mode" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-base-surface-secondary)]">
                <span className="text-sm font-medium text-[var(--color-base-primary)]">Notifications</span>
                <Toggle hideLabel aria-label="Toggle notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-base-surface-secondary)]">
                <span className="text-sm font-medium text-[var(--color-base-primary)]">Auto-save</span>
                <Toggle hideLabel aria-label="Toggle auto-save" defaultChecked />
              </div>
            </div>
          </div>
        </section>

        {/* Avatar Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Avatar</h2>
          <p className="text-paragraph-2 text-secondary">
            Used to represent users or things, supporting the display of images, initials, or fallback icons. 
            Available in sizes: 20px (xs), 24px (sm), 32px (md), and 40px (lg).
          </p>
          
          {/* Sizes */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Sizes</h3>
            <div className="flex items-end gap-4">
              <div className="flex flex-col items-center gap-2">
                <Avatar size="xs" src="https://i.pravatar.cc/80?img=1" />
                <span className="text-label-tiny text-secondary">20px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="sm" src="https://i.pravatar.cc/80?img=2" />
                <span className="text-label-tiny text-secondary">24px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="md" src="https://i.pravatar.cc/80?img=3" />
                <span className="text-label-tiny text-secondary">32px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="lg" src="https://i.pravatar.cc/80?img=4" />
                <span className="text-label-tiny text-secondary">40px</span>
              </div>
            </div>
          </div>

          {/* With Initials */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Initials</h3>
            <p className="text-paragraph-3 text-secondary">When no image is provided, shows initials from name</p>
            <div className="flex items-end gap-4">
              <Avatar size="xs" name="John Doe" />
              <Avatar size="sm" name="Alice Smith" />
              <Avatar size="md" name="Bob Johnson" />
              <Avatar size="lg" name="Emma Wilson" />
            </div>
          </div>

          {/* Fallback */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Fallback</h3>
            <p className="text-paragraph-3 text-secondary">When no image or name is provided, shows a user icon</p>
            <div className="flex items-end gap-4">
              <Avatar size="xs" />
              <Avatar size="sm" />
              <Avatar size="md" />
              <Avatar size="lg" />
            </div>
          </div>

          {/* Without Ring */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Without Ring</h3>
            <div className="flex items-end gap-4">
              <Avatar size="md" src="https://i.pravatar.cc/80?img=5" showRing={false} />
              <Avatar size="md" name="No Ring" showRing={false} />
              <Avatar size="md" showRing={false} />
            </div>
          </div>

          {/* Avatar Group */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Avatar Group</h3>
            <p className="text-paragraph-3 text-secondary">Multiple avatars stacked with overlap</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-label-tiny text-secondary w-12">sm:</span>
                <AvatarGroup size="sm">
                  <Avatar size="sm" src="https://i.pravatar.cc/80?img=10" />
                  <Avatar size="sm" src="https://i.pravatar.cc/80?img=11" />
                  <Avatar size="sm" src="https://i.pravatar.cc/80?img=12" />
                </AvatarGroup>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-label-tiny text-secondary w-12">md:</span>
                <AvatarGroup size="md">
                  <Avatar size="md" src="https://i.pravatar.cc/80?img=20" />
                  <Avatar size="md" src="https://i.pravatar.cc/80?img=21" />
                  <Avatar size="md" src="https://i.pravatar.cc/80?img=22" />
                </AvatarGroup>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-label-tiny text-secondary w-12">lg:</span>
                <AvatarGroup size="lg">
                  <Avatar size="lg" src="https://i.pravatar.cc/80?img=30" />
                  <Avatar size="lg" src="https://i.pravatar.cc/80?img=31" />
                  <Avatar size="lg" src="https://i.pravatar.cc/80?img=32" />
                </AvatarGroup>
              </div>
            </div>
          </div>

          {/* With Max */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Group with Max</h3>
            <p className="text-paragraph-3 text-secondary">Limits visible avatars and shows +N indicator</p>
            <div className="flex items-center gap-6">
              <AvatarGroup size="md" max={3}>
                <Avatar size="md" src="https://i.pravatar.cc/80?img=40" />
                <Avatar size="md" src="https://i.pravatar.cc/80?img=41" />
                <Avatar size="md" src="https://i.pravatar.cc/80?img=42" />
                <Avatar size="md" src="https://i.pravatar.cc/80?img=43" />
                <Avatar size="md" src="https://i.pravatar.cc/80?img=44" />
              </AvatarGroup>
              <span className="text-label-tiny text-secondary">max=3</span>
            </div>
          </div>
        </section>

        {/* Tooltip Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Tooltip</h2>
          <p className="text-paragraph-2 text-secondary">
            Tooltips provide brief, informative messages when users hover over, focus on, or tap an element.
            They appear temporarily and shouldn&apos;t interrupt the user experience.
          </p>
          
          {/* Static Tooltips */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Static Tooltip Variants</h3>
            <p className="text-paragraph-3 text-secondary">Tooltip with arrow on top (tooltip appears below)</p>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip text="Text" position="top" align="start" />
                <span className="text-label-tiny text-secondary">Arrow Left</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip text="Text" position="top" align="center" />
                <span className="text-label-tiny text-secondary">Arrow Center</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip text="Text" position="top" align="end" />
                <span className="text-label-tiny text-secondary">Arrow Right</span>
              </div>
            </div>
          </div>

          {/* Bottom Arrow */}
          <div className="space-y-4">
            <p className="text-paragraph-3 text-secondary">Tooltip with arrow on bottom (tooltip appears above)</p>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip text="Text" position="bottom" align="start" />
                <span className="text-label-tiny text-secondary">Arrow Left</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip text="Text" position="bottom" align="center" />
                <span className="text-label-tiny text-secondary">Arrow Center</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip text="Text" position="bottom" align="end" />
                <span className="text-label-tiny text-secondary">Arrow Right</span>
              </div>
            </div>
          </div>

          {/* With Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Icons</h3>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip 
                  text="Text" 
                  leftIcon={<CheckIconSmall />} 
                />
                <span className="text-label-tiny text-secondary">Left Icon</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip 
                  text="Text" 
                  rightIcon={<CheckIconSmall />} 
                />
                <span className="text-label-tiny text-secondary">Right Icon</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SimpleTooltip 
                  text="Text" 
                  leftIcon={<CheckIconSmall />}
                  rightIcon={<CheckIconSmall />} 
                />
                <span className="text-label-tiny text-secondary">Both Icons</span>
              </div>
            </div>
          </div>

          {/* Interactive Tooltips */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Interactive (Hover)</h3>
            <p className="text-paragraph-3 text-secondary">Hover over the buttons to see tooltips</p>
            <div className="flex flex-wrap items-center gap-6">
              <Tooltip content="Edit item" position="top">
                <button className="px-4 py-2 rounded-lg bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] hover:bg-[var(--color-base-tertiary)] transition-colors">
                  Top
                </button>
              </Tooltip>
              <Tooltip content="View details" position="bottom">
                <button className="px-4 py-2 rounded-lg bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] hover:bg-[var(--color-base-tertiary)] transition-colors">
                  Bottom
                </button>
              </Tooltip>
              <Tooltip content="Go back" position="left">
                <button className="px-4 py-2 rounded-lg bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] hover:bg-[var(--color-base-tertiary)] transition-colors">
                  Left
                </button>
              </Tooltip>
              <Tooltip content="Next page" position="right">
                <button className="px-4 py-2 rounded-lg bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] hover:bg-[var(--color-base-tertiary)] transition-colors">
                  Right
                </button>
              </Tooltip>
            </div>
          </div>
        </section>

        {/* Notification Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Notification</h2>
          <p className="text-paragraph-2 text-secondary">
            Notifications are warning messages that require attention. They notify users of a process that a system 
            has performed or will perform. They appear temporarily and shouldn&apos;t interrupt the user experience.
          </p>
          
          {/* Variants */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Variants</h3>
            <div className="flex flex-col gap-3">
              <Notification 
                title="Success Green" 
                variant="success"
                autoDismiss={0}
              />
              <Notification 
                title="Success Blue" 
                variant="success-blue"
                autoDismiss={0}
              />
              <Notification 
                title="Deleted" 
                variant="deleted"
                autoDismiss={0}
              />
              <Notification 
                title="Rejected" 
                variant="rejected"
                autoDismiss={0}
              />
              <Notification 
                title="Information" 
                variant="info"
                autoDismiss={0}
              />
              <Notification 
                title="Banned" 
                variant="ban"
                autoDismiss={0}
              />
              <Notification 
                title="Warning" 
                variant="warning"
                autoDismiss={0}
              />
            </div>
          </div>

          {/* With Description */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Description</h3>
            <div className="flex flex-col gap-3">
              <Notification 
                title="Changes saved"
                description="Your changes have been saved successfully."
                variant="success"
                autoDismiss={0}
              />
              <Notification 
                title="New update available"
                description="A new version is ready to install."
                variant="info"
                autoDismiss={0}
              />
              <Notification 
                title="Please check your input"
                description="Some fields contain invalid values."
                variant="warning"
                autoDismiss={0}
              />
            </div>
          </div>

          {/* With Close Button */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Close Button</h3>
            <div className="flex flex-col gap-3">
              <Notification 
                title="Success with close"
                variant="success"
                showCloseButton
                autoDismiss={0}
              />
              <Notification 
                title="Info with close and description"
                description="Click the X button to dismiss."
                variant="info"
                showCloseButton
                autoDismiss={0}
              />
            </div>
          </div>

          {/* With Undo Button */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Undo Button</h3>
            <div className="flex flex-col gap-3">
              <Notification 
                title="Item deleted"
                variant="deleted"
                showUndo
                onUndo={() => {}}
                autoDismiss={0}
              />
              <Notification 
                title="Action completed"
                variant="success"
                showUndo
                showCloseButton
                autoDismiss={0}
              />
            </div>
          </div>

          {/* With Action Buttons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Action Buttons</h3>
            <div className="flex flex-col gap-3">
              <Notification 
                title="Confirm action"
                description="Are you sure you want to proceed?"
                variant="info"
                primaryAction={{ label: "Confirm", onClick: () => {} }}
                autoDismiss={0}
              />
              <Notification 
                title="Update available"
                description="A new version is ready to install."
                variant="success-blue"
                primaryAction={{ label: "Update", onClick: () => {} }}
                secondaryAction={{ label: "Later", onClick: () => {} }}
                autoDismiss={0}
              />
              <Notification 
                title="Delete item?"
                description="This action cannot be undone."
                variant="warning"
                primaryAction={{ label: "Delete", onClick: () => {} }}
                secondaryAction={{ label: "Cancel", onClick: () => {} }}
                showCloseButton
                autoDismiss={0}
              />
            </div>
          </div>
        </section>

        {/* Input Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Input</h2>
          <p className="text-paragraph-2 text-secondary">
            Input fields enable the user to interact with and input content and data. 
            This component can be used for long and short entries.
          </p>
          
          {/* Basic Inputs */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Basic Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Email" 
                placeholder="Enter your email" 
                fullWidth
              />
              <Input 
                label="Username" 
                mandatory
                placeholder="Enter username" 
                fullWidth
              />
            </div>
          </div>

          {/* Input States */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">States</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Default" 
                placeholder="Default state" 
                fullWidth
              />
              <Input 
                label="With Value" 
                defaultValue="Input Text"
                fullWidth
              />
              <Input 
                label="Error State" 
                defaultValue="Invalid input"
                error="This field has an error"
                fullWidth
              />
              <Input 
                label="Disabled" 
                defaultValue="Disabled input"
                disabled
                fullWidth
              />
            </div>
          </div>

          {/* Input with Hints */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Hints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Campaign ID"
                topHints={["Auto-generated"]}
                defaultValue="CAMP-12345"
                hint="This ID is read-only"
                fullWidth
              />
              <Input 
                label="API Key"
                topHints={["Required", "Secure"]}
                mandatory
                placeholder="Enter API key"
                fullWidth
              />
            </div>
          </div>

          {/* Special Input Types */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Special Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchInput 
                placeholder="Search users..."
                fullWidth
              />
              <PasswordInput 
                label="Password"
                placeholder="Enter password"
                fullWidth
              />
              <SelectInput 
                label="Country"
                placeholder="Select country"
                fullWidth
              />
              <Input 
                label="With Helper Text"
                placeholder="Enter value"
                helperText="USD"
                fullWidth
              />
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Textarea</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea 
                label="Description"
                placeholder="Enter description..."
                rows={4}
                fullWidth
              />
              <Textarea 
                label="Notes"
                mandatory
                placeholder="Enter notes..."
                error="This field is required"
                rows={4}
                fullWidth
              />
            </div>
          </div>
        </section>

        {/* List Component */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">List</h2>
          <p className="text-paragraph-2 text-secondary">
            Lists are continuous, vertical indexes of text and images. They help users find a specific item 
            and act on it. Lists can be ordered logically (alphabetically or numerically).
          </p>
          
          {/* Small List - Basic */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Small List - Text Only</h3>
            <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden">
              <List size="sm">
                <ListItem title="Item 1 - Simple text" />
                <ListItem title="Item 2 - Simple text" />
                <ListItem title="Item 3 - Simple text" showBorder={false} />
              </List>
            </div>
          </div>

          {/* Small List - With Left Content */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Small List - With Left Content</h3>
            <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden">
              <List size="sm">
                <ListItem 
                  title="User with avatar"
                  leftContent={
                    <>
                      <ListCheckbox />
                      <ListIcon><ListLinkIcon /></ListIcon>
                      <ListAvatar name="John Doe" size="sm" />
                    </>
                  }
                />
                <ListItem 
                  title="Another user"
                  leftContent={
                    <>
                      <ListCheckbox defaultChecked />
                      <ListIcon><ListLinkIcon /></ListIcon>
                      <ListAvatar name="Jane Smith" size="sm" />
                    </>
                  }
                />
                <ListItem 
                  title="Third user"
                  leftContent={
                    <>
                      <ListCheckbox />
                      <ListIcon><ListLinkIcon /></ListIcon>
                      <ListAvatar name="Bob Wilson" size="sm" />
                    </>
                  }
                  showBorder={false}
                />
              </List>
            </div>
          </div>

          {/* Small List - With Right Content */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Small List - With Right Content</h3>
            <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden">
              <List size="sm">
                <ListItem 
                  title="Item with badge"
                  rightContent={<ListBadge>Active</ListBadge>}
                />
                <ListItem 
                  title="Item with value"
                  rightContent={<ListValue value="100,000" />}
                />
                <ListItem 
                  title="Item with icons"
                  rightContent={
                    <ListIconGroup>
                      <ListIcon><CheckIconSmall /></ListIcon>
                      <ListIcon><CheckIconSmall /></ListIcon>
                    </ListIconGroup>
                  }
                  showBorder={false}
                />
              </List>
            </div>
          </div>

          {/* Small List - With Description */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Small List - With Description</h3>
            <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden">
              <List size="sm">
                <ListItem 
                  title="Main Title"
                  description="This is a description text that provides more context"
                  leftContent={
                    <>
                      <ListCheckbox />
                      <ListAvatar name="User" size="sm" />
                    </>
                  }
                  rightContent={<ListBadge variant="success">Success</ListBadge>}
                />
                <ListItem 
                  title="Another Title"
                  description="Another description with more details"
                  leftContent={
                    <>
                      <ListCheckbox />
                      <ListAvatar name="Admin" size="sm" />
                    </>
                  }
                  rightContent={<ListBadge variant="warning">Pending</ListBadge>}
                  showBorder={false}
                />
              </List>
            </div>
          </div>

          {/* Big List */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Big List</h3>
            <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden">
              <List size="lg">
                <ListItem 
                  size="lg"
                  title="Big List Item"
                  leftContent={
                    <>
                      <ListCheckbox />
                      <ListIcon><ListLinkIcon /></ListIcon>
                      <ListAvatar name="John Doe" size="lg" />
                    </>
                  }
                  rightContent={
                    <>
                      <ListValue value="1,234" />
                      <ListBadge>Premium</ListBadge>
                    </>
                  }
                />
                <ListItem 
                  size="lg"
                  title="Another Big Item"
                  description="With a subtitle description"
                  leftContent={
                    <>
                      <ListCheckbox defaultChecked />
                      <ListIcon><ListLinkIcon /></ListIcon>
                      <ListAvatar name="Jane Smith" size="lg" />
                    </>
                  }
                  rightContent={
                    <ListActionGroup>
                      <ListActionButton icon={<EditIconSmall />} label="Edit" />
                      <ListActionButton icon={<TrashIconSmall />} label="Delete" />
                    </ListActionGroup>
                  }
                  showBorder={false}
                />
              </List>
            </div>
          </div>

          {/* Interactive List */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Interactive List (Clickable)</h3>
            <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden">
              <List>
                <ListItem 
                  title="Click me"
                  description="This item is clickable"
                  onClick={() => alert("Item 1 clicked!")}
                  leftContent={<ListAvatar name="Click" size="sm" />}
                />
                <ListItem 
                  title="Click me too"
                  description="This item is also clickable"
                  onClick={() => alert("Item 2 clicked!")}
                  leftContent={<ListAvatar name="Click" size="sm" />}
                />
                <ListItem 
                  title="Disabled item"
                  description="This item is disabled"
                  disabled
                  leftContent={<ListAvatar name="Disabled" size="sm" />}
                  showBorder={false}
                />
              </List>
            </div>
          </div>

          {/* Selected State */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Selected State</h3>
            <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden">
              <List>
                <ListItem 
                  title="Selected Item"
                  selected
                  leftContent={<ListCheckbox defaultChecked />}
                />
                <ListItem 
                  title="Normal Item"
                  leftContent={<ListCheckbox />}
                />
                <ListItem 
                  title="Another Normal Item"
                  leftContent={<ListCheckbox />}
                  showBorder={false}
                />
              </List>
            </div>
          </div>
        </section>

        {/* Select Section */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Select Menu</h2>
          
          {/* Basic Select */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Basic Select</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Select 
                label="Country"
                placeholder="Select a country"
                options={[
                  { value: "us", label: "United States" },
                  { value: "uk", label: "United Kingdom" },
                  { value: "ca", label: "Canada" },
                  { value: "au", label: "Australia" },
                  { value: "de", label: "Germany" },
                  { value: "fr", label: "France" },
                ]}
                onChange={(value) => console.log("Selected:", value)}
              />
              <Select 
                label="Required Field"
                mandatory
                placeholder="Select option"
                options={[
                  { value: "opt1", label: "Option 1" },
                  { value: "opt2", label: "Option 2" },
                  { value: "opt3", label: "Option 3" },
                ]}
              />
            </div>
          </div>

          {/* Select with Search */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Select with Search</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Select 
                label="Search Countries"
                placeholder="Search..."
                searchable
                searchPlaceholder="Type to search..."
                options={[
                  { value: "us", label: "United States" },
                  { value: "uk", label: "United Kingdom" },
                  { value: "ca", label: "Canada" },
                  { value: "au", label: "Australia" },
                  { value: "de", label: "Germany" },
                  { value: "fr", label: "France" },
                  { value: "jp", label: "Japan" },
                  { value: "kr", label: "South Korea" },
                  { value: "cn", label: "China" },
                  { value: "in", label: "India" },
                ]}
              />
            </div>
          </div>

          {/* Multi-Select */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Multi-Select</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Select 
                label="Select Tags"
                placeholder="Select tags..."
                multiple
                searchable
                options={[
                  { value: "react", label: "React" },
                  { value: "vue", label: "Vue" },
                  { value: "angular", label: "Angular" },
                  { value: "svelte", label: "Svelte" },
                  { value: "next", label: "Next.js" },
                  { value: "nuxt", label: "Nuxt" },
                ]}
                showActions
                onChange={(values) => console.log("Selected:", values)}
              />
            </div>
          </div>

          {/* Select with Custom Content */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Select with Custom Content</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Select 
                label="Select User"
                placeholder="Select a user..."
                options={[
                  { 
                    value: "user1", 
                    label: "John Doe", 
                    description: "john@example.com",
                    leftContent: <Avatar name="John Doe" size="sm" />
                  },
                  { 
                    value: "user2", 
                    label: "Jane Smith", 
                    description: "jane@example.com",
                    leftContent: <Avatar name="Jane Smith" size="sm" />
                  },
                  { 
                    value: "user3", 
                    label: "Bob Johnson", 
                    description: "bob@example.com",
                    leftContent: <Avatar name="Bob Johnson" size="sm" />
                  },
                ]}
              />
            </div>
          </div>

          {/* Select States */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Select States</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Select 
                label="Error State"
                error="This field is required"
                placeholder="Select option"
                options={[
                  { value: "opt1", label: "Option 1" },
                  { value: "opt2", label: "Option 2" },
                ]}
              />
              <Select 
                label="Disabled"
                disabled
                placeholder="Select option"
                options={[
                  { value: "opt1", label: "Option 1" },
                  { value: "opt2", label: "Option 2" },
                ]}
              />
              <Select 
                label="With Helper"
                hint="Choose your preferred option"
                placeholder="Select option"
                options={[
                  { value: "opt1", label: "Option 1" },
                  { value: "opt2", label: "Option 2" },
                ]}
              />
            </div>
          </div>

          {/* Disabled Options */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Disabled Options</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Select 
                label="With Disabled Options"
                placeholder="Select option"
                options={[
                  { value: "opt1", label: "Available Option 1" },
                  { value: "opt2", label: "Disabled Option", disabled: true },
                  { value: "opt3", label: "Available Option 2" },
                  { value: "opt4", label: "Also Disabled", disabled: true },
                  { value: "opt5", label: "Available Option 3" },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Date Picker Section */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Date Picker</h2>
          
          {/* Basic Date Picker */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Basic Date Picker</h3>
            <div className="flex flex-wrap gap-8 items-start">
              <DatePicker 
                label="Date"
                defaultValue={new Date()}
                onChange={(date) => console.log("Selected:", date)}
              />
              <DatePicker 
                label="Start Date"
                allowRange
                onChange={(date) => console.log("Selected:", date)}
                onRangeChange={(start, end) => console.log("Range:", start, end)}
              />
            </div>
          </div>

          {/* Date Picker with Period Selector */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">With Period Selector</h3>
            <div className="flex flex-wrap gap-8 items-start">
              <DatePicker 
                showPeriodSelector
                label="Date"
                defaultValue={new Date()}
              />
            </div>
          </div>

          {/* Date Picker Input */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Date Picker Input</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <DatePickerInput 
                inputLabel="Birth Date"
                placeholder="Select date..."
                onChange={(date) => console.log("Selected:", date)}
              />
              <DatePickerInput 
                inputLabel="Required Date"
                mandatory
                placeholder="Select date..."
              />
              <DatePickerInput 
                inputLabel="With Error"
                error="Please select a valid date"
                placeholder="Select date..."
              />
            </div>
          </div>

          {/* Date Picker without Actions */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Without Action Buttons</h3>
            <div className="flex flex-wrap gap-8 items-start">
              <DatePicker 
                label="Simple Date"
                showActions={false}
                onChange={(date) => console.log("Selected:", date)}
              />
            </div>
          </div>
        </section>

        {/* Sidebar Section */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Sidebar</h2>
          <p className="text-paragraph-2 text-secondary">
            Navigation sidebar component with menu items, groups, submenus, and various states.
          </p>

          <div className="flex gap-8 flex-wrap">
            {/* Sidebar - Default */}
            <div className="space-y-2">
              <h3 className="text-headline-4 text-secondary">Default Sidebar</h3>
              <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden h-[600px]">
                <Sidebar defaultActiveItem="audiences">
                  <SidebarGroup title="Tools">
                    <SidebarItem
                      id="audiences"
                      icon={<PeopleIcon />}
                      label="Audiences"
                    >
                      <SidebarSubmenu>
                        <SidebarSubmenuItem id="audiences-list" label="Audiences" />
                        <SidebarSubmenuItem id="users-list" label="Users Lists" />
                        <SidebarSubmenuItem id="feature-config" label="Feature Configurations" />
                      </SidebarSubmenu>
                    </SidebarItem>
                    <SidebarItem
                      id="push"
                      icon={<BellIcon />}
                      label="Push & Chat"
                    />
                    <SidebarItem
                      id="banners"
                      icon={<ImageIcon />}
                      label="Banners"
                    />
                    <SidebarItem
                      id="gifts"
                      icon={<GiftcardIcon />}
                      label="Gifts"
                    >
                      <SidebarSubmenu>
                        <SidebarSubmenuItem id="gifts-manager" label="Gifts Manager" />
                        <SidebarSubmenuItem id="custom-gifts" label="Custom Gifts" />
                        <SidebarSubmenuItem id="inventory-gifts" label="Inventory Gifts" />
                        <SidebarSubmenuItem id="gift-row" label="Gift Row on Screen" />
                        <SidebarSubmenuItem id="gift-drawers" label="Gift Drawers" />
                      </SidebarSubmenu>
                    </SidebarItem>
                    <SidebarItem
                      id="messages"
                      icon={<ChatIcon />}
                      label="In-Stream Message"
                    />
                    <SidebarItem
                      id="bottom-sheets"
                      icon={<ColumnsIcon />}
                      label="Bottom Sheets"
                    />
                    <SidebarItem
                      id="offers"
                      icon={<WalletIcon />}
                      label="In-App Offers"
                    >
                      <SidebarSubmenu>
                        <SidebarSubmenuItem id="pricing" label="Pricing" />
                        <SidebarSubmenuItem id="special-offers" label="Special Offers" />
                        <SidebarSubmenuItem id="landing-pages" label="Landing Pages" />
                        <SidebarSubmenuItem id="gift-click" label="Gift Click" />
                        <SidebarSubmenuItem id="wheel-templates" label="Wheel Templates" />
                        <SidebarSubmenuItem id="cashier-design" label="Cashier Design Templates" />
                      </SidebarSubmenu>
                    </SidebarItem>
                    <SidebarItem
                      id="features"
                      icon={<LampIcon />}
                      label="Features"
                    >
                      <SidebarSubmenu>
                        <SidebarSubmenuItem id="free-gifts" label="Free Gifts" />
                        <SidebarSubmenuItem id="tournaments" label="Tournaments" />
                        <SidebarSubmenuItem id="bots" label="Bots" />
                        <SidebarSubmenuItem id="live-party" label="Live Party Bonus" />
                        <SidebarSubmenuItem id="ribbons" label="Ribbons" />
                        <SidebarSubmenuItem id="promo-tiles" label="Promo Tiles" />
                        <SidebarSubmenuItem id="auctions" label="Auctions" />
                        <SidebarSubmenuItem id="resellers-manager" label="Resellers Manager" />
                        <SidebarSubmenuItem id="resellers-campaigns" label="Resellers Campaigns" />
                        <SidebarSubmenuItem id="diamonds-exchange" label="Diamonds Exchange" />
                      </SidebarSubmenu>
                    </SidebarItem>
                    <SidebarItem
                      id="tags"
                      icon={<TagIconLib />}
                      label="Tags"
                    />
                    <SidebarItem
                      id="calendar"
                      icon={<CalendarIcon />}
                      label="Calendar"
                    />
                    <SidebarItem
                      id="audit"
                      icon={<ChartIconLib />}
                      label="Audit Log"
                    />
                    <SidebarItem
                      id="history"
                      icon={<ClockIcon />}
                      label="History"
                    />
                    <SidebarItem
                      id="emulator"
                      icon={<CommandIcon />}
                      label="Web Emulator"
                    />
                    <SidebarItem
                      id="approval"
                      icon={<CheckIcon />}
                      label="Approval Tool"
                    />
                  </SidebarGroup>
                  <SidebarFooter>
                    <SidebarBackLink label="Back to Tango Internal" />
                  </SidebarFooter>
                </Sidebar>
              </div>
            </div>

          </div>
        </section>

        {/* Modal & Popup Section */}
        <ModalSection />

        {/* Icons Section */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Icons</h2>
          
          {/* Action Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Action Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {[
                { icon: <PlusIcon />, name: "Plus" },
                { icon: <MinusIcon />, name: "Minus" },
                { icon: <EditIconLib />, name: "Edit" },
                { icon: <TrashIconLib />, name: "Trash" },
                { icon: <CopyIconLib />, name: "Copy" },
                { icon: <SaveIcon />, name: "Save" },
                { icon: <SearchIcon />, name: "Search" },
                { icon: <FilterIcon />, name: "Filter" },
                { icon: <SortIcon />, name: "Sort" },
                { icon: <RefreshIcon />, name: "Refresh" },
                { icon: <DownloadIcon />, name: "Download" },
                { icon: <UploadIcon />, name: "Upload" },
                { icon: <ExportIcon />, name: "Export" },
                { icon: <ExternalLinkIcon />, name: "External Link" },
                { icon: <LinkIcon />, name: "Link" },
                { icon: <LinkSlashIcon />, name: "Link Slash" },
                { icon: <PlayIcon />, name: "Play" },
                { icon: <PauseIcon />, name: "Pause" },
                { icon: <StopIcon />, name: "Stop" },
                { icon: <SettingsIcon />, name: "Settings" },
                { icon: <CompareIcon />, name: "Compare" },
                { icon: <TranslateIcon />, name: "Translate" },
                { icon: <PriorityIcon />, name: "Priority" },
                { icon: <UpdateIcon />, name: "Update" },
                { icon: <ForwardIcon />, name: "Forward" },
                { icon: <BlockIcon />, name: "Block" },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-base-surface-secondary)]">
                  <span className="text-[var(--color-base-primary)]">{icon}</span>
                  <span className="text-paragraph-3 text-[var(--color-base-secondary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Navigation / Arrow Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {[
                { icon: <ChevronUpIcon />, name: "Chevron Up" },
                { icon: <ChevronDownIcon />, name: "Chevron Down" },
                { icon: <ChevronLeftIcon />, name: "Chevron Left" },
                { icon: <ChevronRightIcon />, name: "Chevron Right" },
                { icon: <ChevronDoubleUpIcon />, name: "Double Up" },
                { icon: <ChevronDoubleDownIcon />, name: "Double Down" },
                { icon: <ChevronDoubleLeftIcon />, name: "Double Left" },
                { icon: <ChevronDoubleRightIcon />, name: "Double Right" },
                { icon: <ArrowUpIcon />, name: "Arrow Up" },
                { icon: <ArrowDownIcon />, name: "Arrow Down" },
                { icon: <ArrowLeftIcon />, name: "Arrow Left" },
                { icon: <ArrowRightIcon />, name: "Arrow Right" },
                { icon: <ArrowUpRightIcon />, name: "Up Right" },
                { icon: <ArrowDownRightIcon />, name: "Down Right" },
                { icon: <ArrowUpLeftIcon />, name: "Up Left" },
                { icon: <ArrowDownLeftIcon />, name: "Down Left" },
                { icon: <CaretUpIcon />, name: "Caret Up" },
                { icon: <CaretDownIcon />, name: "Caret Down" },
                { icon: <CaretLeftIcon />, name: "Caret Left" },
                { icon: <CaretRightIcon />, name: "Caret Right" },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-base-surface-secondary)]">
                  <span className="text-[var(--color-base-primary)]">{icon}</span>
                  <span className="text-paragraph-3 text-[var(--color-base-secondary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Status Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {[
                { icon: <CheckIcon />, name: "Check" },
                { icon: <CloseIcon />, name: "Close" },
                { icon: <InfoIcon />, name: "Info" },
                { icon: <WarningIcon />, name: "Warning" },
                { icon: <ErrorIcon />, name: "Error" },
                { icon: <SuccessIcon />, name: "Success" },
                { icon: <LoadingIcon />, name: "Loading" },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-base-surface-secondary)]">
                  <span className="text-[var(--color-base-primary)]">{icon}</span>
                  <span className="text-paragraph-3 text-[var(--color-base-secondary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Object Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Object Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {[
                { icon: <HomeIcon />, name: "Home" },
                { icon: <HomeFilledIcon />, name: "Home Filled" },
                { icon: <UserIcon />, name: "User" },
                { icon: <UsersIcon />, name: "Users" },
                { icon: <PeopleIcon />, name: "People" },
                { icon: <CalendarIcon />, name: "Calendar" },
                { icon: <ClockIcon />, name: "Clock" },
                { icon: <PhoneIcon />, name: "Phone" },
                { icon: <OldPhoneIcon />, name: "Old Phone" },
                { icon: <CameraIcon />, name: "Camera" },
                { icon: <CameraOffIcon />, name: "Camera Off" },
                { icon: <ImageIcon />, name: "Image" },
                { icon: <FolderIcon />, name: "Folder" },
                { icon: <DocumentIcon />, name: "Document" },
                { icon: <ListIconLib />, name: "List" },
                { icon: <ChatIcon />, name: "Chat" },
                { icon: <EmailIcon />, name: "Email" },
                { icon: <BellIcon />, name: "Bell" },
                { icon: <BellOffIcon />, name: "Bell Off" },
                { icon: <ChartIconLib />, name: "Chart" },
                { icon: <TagIconLib />, name: "Tag" },
                { icon: <StarIconLib />, name: "Star" },
                { icon: <StarFilledIcon />, name: "Star Filled" },
                { icon: <HeartIcon />, name: "Heart" },
                { icon: <EyeIconLib />, name: "Eye" },
                { icon: <EyeOffIcon />, name: "Eye Off" },
                { icon: <LockIcon />, name: "Lock" },
                { icon: <UnlockIcon />, name: "Unlock" },
                { icon: <WalletIcon />, name: "Wallet" },
                { icon: <DollarIcon />, name: "Dollar" },
                { icon: <BriefcaseIcon />, name: "Briefcase" },
                { icon: <MegaphoneIcon />, name: "Megaphone" },
                { icon: <PinIcon />, name: "Pin" },
                { icon: <FlagIcon />, name: "Flag" },
                { icon: <RocketIcon />, name: "Rocket" },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-base-surface-secondary)]">
                  <span className="text-[var(--color-base-primary)]">{icon}</span>
                  <span className="text-paragraph-3 text-[var(--color-base-secondary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Device / Layout Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {[
                { icon: <DesktopIcon />, name: "Desktop" },
                { icon: <TabletIcon />, name: "Tablet" },
                { icon: <TemplateIcon />, name: "Template" },
                { icon: <ColumnsIcon />, name: "Columns" },
                { icon: <HeaderIcon />, name: "Header" },
                { icon: <TextIcon />, name: "Text" },
                { icon: <MenuIcon />, name: "Menu" },
                { icon: <MoreHorizontalIcon />, name: "More H" },
                { icon: <MoreVerticalIcon />, name: "More V" },
                { icon: <DragIcon />, name: "Drag" },
                { icon: <FullScreenIcon />, name: "Full Screen" },
                { icon: <SmallScreenIcon />, name: "Small Screen" },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-base-surface-secondary)]">
                  <span className="text-[var(--color-base-primary)]">{icon}</span>
                  <span className="text-paragraph-3 text-[var(--color-base-secondary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Menu Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {[
                { icon: <CarouselIcon />, name: "Carousel" },
                { icon: <GiftcardIcon />, name: "Giftcard" },
                { icon: <YardIcon />, name: "Yard" },
                { icon: <LampIcon />, name: "Lamp" },
                { icon: <DiscountIcon />, name: "Discount" },
                { icon: <CommandIcon />, name: "Command" },
                { icon: <StoreIcon />, name: "Store" },
                { icon: <PiggyIcon />, name: "Piggy" },
                { icon: <ServerIcon />, name: "Server" },
                { icon: <GlobeIcon />, name: "Globe" },
                { icon: <FireIcon />, name: "Fire" },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-base-surface-secondary)]">
                  <span className="text-[var(--color-base-primary)]">{icon}</span>
                  <span className="text-paragraph-3 text-[var(--color-base-secondary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Toggle Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Toggle / Theme Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {[
                { icon: <SunIcon />, name: "Sun" },
                { icon: <MoonIcon />, name: "Moon" },
                { icon: <SoundOnIcon />, name: "Sound On" },
                { icon: <SoundOffIcon />, name: "Sound Off" },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-base-surface-secondary)]">
                  <span className="text-[var(--color-base-primary)]">{icon}</span>
                  <span className="text-paragraph-3 text-[var(--color-base-secondary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Other Icons */}
          <div className="space-y-4">
            <h3 className="text-headline-3 text-secondary">Other Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {[
                { icon: <CoinIcon />, name: "Coin" },
                { icon: <DiamondIcon />, name: "Diamond" },
                { icon: <EmojiIcon />, name: "Emoji" },
              ].map(({ icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-base-surface-secondary)]">
                  <span className="text-[var(--color-base-primary)]">{icon}</span>
                  <span className="text-paragraph-3 text-[var(--color-base-secondary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Color Palette Preview */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Colors</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Base Colors */}
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-base-primary)]" />
              <p className="text-label-normal text-secondary">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-base-secondary)]" />
              <p className="text-label-normal text-secondary">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-base-tertiary)]" />
              <p className="text-label-normal text-secondary">Tertiary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)]" />
              <p className="text-label-normal text-secondary">Surface</p>
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-danger-100)]" />
              <p className="text-label-normal text-secondary">Danger</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-warning-100)]" />
              <p className="text-label-normal text-secondary">Warning</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-success-100)]" />
              <p className="text-label-normal text-secondary">Success</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-info-100)]" />
              <p className="text-label-normal text-secondary">Info</p>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-brand-primary)]" />
              <p className="text-label-normal text-secondary">Brand Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-[var(--color-brand-secondary)]" />
              <p className="text-label-normal text-secondary">Brand Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-gradient-brand" />
              <p className="text-label-normal text-secondary">Gradient</p>
            </div>
          </div>
        </section>

        {/* Typography Preview */}
        <section className="space-y-6">
          <h2 className="text-headline-1 text-primary">Typography</h2>
          
          <div className="space-y-4">
            <p className="text-hero-1">Hero 1 - 48px</p>
            <p className="text-hero-2">Hero 2 - 40px</p>
            <p className="text-hero-3">Hero 3 - 32px</p>
            <p className="text-hero-4">Hero 4 - 28px</p>
          </div>

          <div className="space-y-3">
            <p className="text-headline-1">Headline 1 - 24px</p>
            <p className="text-headline-2">Headline 2 - 18px</p>
            <p className="text-headline-3">Headline 3 - 16px</p>
            <p className="text-headline-4">Headline 4 - 14px</p>
          </div>

          <div className="space-y-2">
            <p className="text-paragraph-1">Paragraph 1 - 16px regular text for body content</p>
            <p className="text-paragraph-2">Paragraph 2 - 14px regular text for descriptions</p>
            <p className="text-paragraph-3">Paragraph 3 - 12px small text for captions</p>
          </div>

          <div className="space-y-1">
            <p className="text-label-normal">LABEL NORMAL - 12PX</p>
            <p className="text-label-tiny">Label Tiny - 10px</p>
          </div>
        </section>
          </div>
        </main>
      </div>
    </div>
  );
}
