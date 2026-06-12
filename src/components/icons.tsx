import type { ReactNode } from 'react'

type IconProps = {
  size?: number
}

function Icon({ children, size = 20 }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function TodayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function OverviewIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 20V12M12 20V5M19 20v-5" />
    </Icon>
  )
}

export function ExercisesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 9v6M4.5 10.5v3M16.5 9v6M19.5 10.5v3M7.5 12h9" />
    </Icon>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="8" cy="17" r="2.2" />
    </Icon>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </Icon>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Icon>
  )
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Icon>
  )
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icon>
  )
}

export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21c3.6 0 6-2.3 6-5.6 0-2.6-1.5-4.4-3-6.4-.6 1-1 1.5-1.8 2.1C12.7 8.6 12 6.3 12.7 3c-3.4 1.8-6.7 5.6-6.7 9.4 0 3.3 2.4 8.6 6 8.6Z" />
    </Icon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  )
}

export function TimerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 2M10 3h4" />
    </Icon>
  )
}

export function TrophyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5v1.5A3.5 3.5 0 0 0 8.5 10M16 5h3v1.5A3.5 3.5 0 0 1 15.5 10" />
      <path d="M12 13v4M8.5 20h7M10 17h4" />
    </Icon>
  )
}
