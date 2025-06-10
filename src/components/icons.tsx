import type { LucideProps } from 'lucide-react';
import {
  UploadCloud,
  DownloadCloud,
  ScanLine,
  Search,
  Edit3,
  Trash2,
  PlusCircle,
  MinusCircle,
  Package,
  FileText,
  Save,
  AlertTriangle,
  Info,
  Smartphone,
} from 'lucide-react';

export const AppLogo = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2" />
    <path d="M21 14v2a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16v-2" />
    <path d="M7 21v-5.5L3.25 18" />
    <path d="M12 15.5V22M17 21v-5.5L20.75 18" />
    <path d="M12 2.5V9" />
    <path d="M7 3.5V9L3.25 6" />
    <path d="M17 3.5V9l3.75-3" />
    <path d="M3.25 10H20.75" />
  </svg>
);


export const Icons = {
  logo: AppLogo,
  upload: UploadCloud,
  download: DownloadCloud,
  barcode: ScanLine,
  search: Search,
  edit: Edit3,
  delete: Trash2,
  add: PlusCircle,
  remove: MinusCircle,
  package: Package,
  file: FileText,
  save: Save,
  warning: AlertTriangle,
  info: Info,
  apk: Smartphone,
};
