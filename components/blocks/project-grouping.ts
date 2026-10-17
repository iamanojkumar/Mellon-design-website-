import type { ProjectGroupingCopy } from "@/lib/blocks";

/**
 * English fallback for the grouped projects listing. Locale page files carry
 * their own translated `grouping` object; a locale that has not been given one
 * yet still renders a working toggle rather than missing labels.
 */
export const DEFAULT_GROUPING: ProjectGroupingCopy = {
  toggleLabel: "Group projects by",
  filterLabel: "Quick select",
  allLabel: "All",
  byService: "By service",
  byIndustry: "By industry",
  countOne: "{count} project",
  countOther: "{count} projects",
  showMore: "Show more",
  viewAll: "View all",
  status: "Showing {shown} of {total}",
};
