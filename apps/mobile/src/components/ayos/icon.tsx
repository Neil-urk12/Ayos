import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/constants/design';

const featherIcons = {
  wrench: 'tool',
  camera: 'camera',
  pin: 'map-pin',
  'check-circle': 'check-circle',
  check: 'check',
  search: 'search',
  bell: 'bell',
  map: 'map',
  list: 'list',
  user: 'user',
  plus: 'plus',
  image: 'image',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  droplet: 'droplet',
  alert: 'alert-triangle',
  share: 'share',
  'log-out': 'log-out',
  shield: 'shield'
} as const;

const ionIcons = {
  bulb: 'bulb-outline',
} as const;

export type IconName = keyof typeof featherIcons | keyof typeof ionIcons;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color = colors.text }: IconProps) {
  if (name in ionIcons) {
    return <Ionicons name={ionIcons[name as keyof typeof ionIcons]} size={size} color={color} />;
  }
  return (
    <Feather name={featherIcons[name as keyof typeof featherIcons]} size={size} color={color} />
  );
}
