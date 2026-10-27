import { Baby, Bike, Gift, Headphones, House, Shirt, ShoppingBag, Snowflake, Sparkles, Store, Tag, Watch, type LucideProps } from "lucide-react";

const map = { shirt: Shirt, bag: ShoppingBag, watch: Watch, headphones: Headphones, home: House, snowflake: Snowflake, gift: Gift, sparkles: Sparkles, baby: Baby, bike: Bike, store: Store, tag: Tag };

export function CategoryIcon({ name, ...rest }: Omit<LucideProps, "name"> & { name?: string | null }) {
  const Icon = map[(name ?? "tag") as keyof typeof map] ?? Tag;
  return <Icon aria-hidden="true" {...rest} />;
}

export const CATEGORY_ICON_NAMES = Object.keys(map);
